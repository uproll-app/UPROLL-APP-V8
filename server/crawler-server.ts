import express from 'express';
import cors from 'cors';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const app = express();
const port = Number(process.env.CRAWLER_PORT || 8787);
const crawlerToken = process.env.CRAWLER_TOKEN;

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'uproll-test-app',
  });
}

const firestore = getFirestore();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function authorized(request: express.Request) {
  return !crawlerToken || request.header('authorization') === `Bearer ${crawlerToken}`;
}

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  return pattern.exec(html)?.[1] ? decodeHtml(pattern.exec(html)![1]) : '';
}

function titleFrom(html: string) {
  return meta(html, 'og:title') || /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() || '';
}

function bodyText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  ).slice(0, 4000);
}

function sourceHost(sourceUrl?: string) {
  if (!sourceUrl) return '';
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

async function crawlSource(sourceUrl: string, sourceName: string, hotTopic: string) {
  const response = await fetch(sourceUrl, {
    headers: { 'user-agent': 'UprollEditorialCrawler/1.0 (+editorial review)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const title = titleFrom(html) || hotTopic;
  const summary = meta(html, 'og:description') || meta(html, 'description') || bodyText(html).slice(0, 600);
  const fullContent = bodyText(html);
  const imageUrl = meta(html, 'og:image') || meta(html, 'twitter:image') || '';
  return {
    sourceName,
    sourceUrl,
    hotTopic,
    title,
    summary,
    fullContent,
    imageUrl,
    status: 'needsReview',
    imageCheck: imageUrl ? 'pending' : 'missing',
    factCheckStatus: 'pending',
    crawledAt: FieldValue.serverTimestamp(),
    publishedAt: null,
  };
}

function articleLinks(html: string, sourceUrl: string, keyword: string) {
  const source = new URL(sourceUrl);
  const term = keyword.toLocaleLowerCase();
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      try {
        const url = new URL(match[1], source);
        url.hash = '';
        const text = decodeHtml(match[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
        return { url: url.toString(), text };
      } catch {
        return null;
      }
    })
    .filter((item): item is { url: string; text: string } => Boolean(item))
    .filter((item) => {
      const parsed = new URL(item.url);
      const sameSite = parsed.hostname === source.hostname || parsed.hostname.endsWith(`.${source.hostname}`);
      const looksLikeArticle = !/\.(jpg|jpeg|png|gif|webp|svg|pdf|xml)$/i.test(parsed.pathname);
      return sameSite && looksLikeArticle && `${item.text} ${item.url}`.toLocaleLowerCase().includes(term);
    });
  return [...new Map(links.map((item) => [item.url, item])).values()].slice(0, 10);
}

async function crawlKeyword(keyword: string, sourceUrl?: string) {
  if (!sourceUrl) throw new Error('Add at least one writer portal before crawling a keyword.');
  const response = await fetch(sourceUrl, {
    headers: { 'user-agent': 'UprollEditorialCrawler/1.0 (+editorial review)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const links = articleLinks(html, sourceUrl, keyword);
  return Promise.all(links.map(async (link) => ({
    ...await crawlSource(link.url, sourceHost(sourceUrl), keyword),
    crawlKey: `${link.url}|${keyword}`,
  })));
}

async function enrichKeywordItem(item: Awaited<ReturnType<typeof crawlKeyword>>[number]) {
  try {
    const response = await fetch(item.sourceUrl, {
      headers: { 'user-agent': 'UprollEditorialCrawler/1.0 (+editorial review)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return item;
    const html = await response.text();
    const extracted = bodyText(html);
    const imageUrl = meta(html, 'og:image') || meta(html, 'twitter:image') || item.imageUrl;
    return {
      ...item,
      summary: meta(html, 'og:description') || item.summary,
      fullContent: extracted.length > item.fullContent.length ? extracted : item.fullContent,
      imageUrl,
    };
  } catch {
    return item;
  }
}

async function crawlKeywordWithContent(keyword: string, sourceUrl?: string) {
  const items = await crawlKeyword(keyword, sourceUrl);
  return Promise.all(items.map(enrichKeywordItem));
}

async function queueKeywordResults(keyword: string, sourceUrl?: string) {
  const items = await crawlKeywordWithContent(keyword, sourceUrl);
  for (const item of items) {
    const recent = await firestore.collection('editorial_queue').where('crawlKey', '==', item.crawlKey).get();
    if (recent.empty) await firestore.collection('editorial_queue').add(item);
  }
  return items.length;
}

let crawlCycleRunning = false;

async function runAutomaticCrawl() {
  if (crawlCycleRunning) return;
  crawlCycleRunning = true;
  try {
  const [sourceSnapshot, keywordSnapshot] = await Promise.all([
    firestore.collection('crawl_sources').where('active', '==', true).get(),
    firestore.collection('crawl_keywords').where('active', '==', true).get(),
  ]);
  const sources = sourceSnapshot.docs.map((item) => item.data());
  const keywords = keywordSnapshot.docs.map((item) => String(item.data().keyword || '').trim()).filter(Boolean);
  if (keywords.length === 0 || sources.length === 0) return;

  const targets = sources.flatMap((source) => keywords.map((keyword) => ({ keyword, sourceUrl: String(source.url || '') })));

  await Promise.all(targets.map(async ({ keyword, sourceUrl }) => {
    try {
      const resultCount = await queueKeywordResults(keyword, sourceUrl);
      const keywordDocs = await firestore.collection('crawl_keywords').where('keyword', '==', keyword).get();
      await Promise.all(keywordDocs.docs.map((item) => item.ref.update({
        lastCrawlAt: FieldValue.serverTimestamp(),
        lastCrawlStatus: `Found ${resultCount} result(s)${sourceHost(sourceUrl) ? ` on ${sourceHost(sourceUrl)}` : ''}`,
      })));
    } catch (error) {
      console.error(`Keyword crawl failed for ${keyword}:`, error);
      const keywordDocs = await firestore.collection('crawl_keywords').where('keyword', '==', keyword).get();
      await Promise.all(keywordDocs.docs.map((item) => item.ref.update({
        lastCrawlAt: FieldValue.serverTimestamp(),
        lastCrawlStatus: 'Crawl failed',
      })));
    }
  }));
  } finally {
    crawlCycleRunning = false;
  }
}

app.post('/crawl', async (request, response) => {
  if (!authorized(request)) return response.status(401).json({ error: 'Unauthorized' });
  const { sources, hotTopic } = request.body as { sources?: { name: string; url: string }[]; hotTopic?: string };
  if (!hotTopic?.trim() || !Array.isArray(sources) || sources.length === 0) {
    return response.status(400).json({ error: 'sources and hotTopic are required' });
  }

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      try {
        const item = await crawlSource(source.url, source.name, hotTopic.trim());
        const reference = await firestore.collection('editorial_queue').add({
          ...item,
          crawlKey: `${source.url}|${hotTopic.trim()}`,
        });
        return { id: reference.id, source: source.name, status: 'queued' };
      } catch (error) {
        const reference = await firestore.collection('editorial_queue').add({
          sourceName: source.name,
          sourceUrl: source.url,
          hotTopic: hotTopic.trim(),
          status: 'failed',
          factCheckStatus: 'pending',
          imageCheck: 'missing',
          error: error instanceof Error ? error.message : 'Crawl failed',
          crawledAt: FieldValue.serverTimestamp(),
          publishedAt: null,
        });
        return { id: reference.id, source: source.name, status: 'failed' };
      }
    }),
  );

  return response.json({ results: results.map((result) => result.status === 'fulfilled' ? result.value : { status: 'failed' }) });
});

app.post('/crawl-keywords', async (request, response) => {
  if (!authorized(request)) return response.status(401).json({ error: 'Unauthorized' });
  const keywords = Array.isArray(request.body?.keywords) ? request.body.keywords.filter((value: unknown) => typeof value === 'string' && value.trim()) : [];
  if (keywords.length === 0) return response.status(400).json({ error: 'At least one keyword is required' });
  const sourceSnapshot = await firestore.collection('crawl_sources').where('active', '==', true).get();
  const sourceUrls = sourceSnapshot.docs
    .map((item) => String(item.data().url || '').trim())
    .filter(Boolean);
  if (sourceUrls.length === 0) return response.status(400).json({ error: 'Add at least one writer portal before crawling keywords' });
  const results = [];
  for (const keyword of keywords) {
    for (const sourceUrl of sourceUrls) {
      try {
        const resultCount = await queueKeywordResults(keyword.trim(), sourceUrl);
        results.push({ keyword, source: sourceHost(sourceUrl) || 'all sources', count: resultCount, status: 'queued' });
      const keywordDocs = await firestore.collection('crawl_keywords').where('keyword', '==', keyword.trim()).get();
      await Promise.all(keywordDocs.docs.map((item) => item.ref.update({
        lastCrawlAt: FieldValue.serverTimestamp(),
        lastCrawlStatus: `Found ${resultCount} result(s)${sourceHost(sourceUrl) ? ` on ${sourceHost(sourceUrl)}` : ''}`,
      })));
      } catch (error) {
        results.push({ keyword, source: sourceHost(sourceUrl) || 'all sources', status: 'failed', error: error instanceof Error ? error.message : 'Crawl failed' });
        const keywordDocs = await firestore.collection('crawl_keywords').where('keyword', '==', keyword.trim()).get();
        await Promise.all(keywordDocs.docs.map((item) => item.ref.update({
          lastCrawlAt: FieldValue.serverTimestamp(),
          lastCrawlStatus: 'Crawl failed',
        })));
      }
    }
  }
  return response.json({ results });
});

app.post('/translate', async (request, response) => {
  if (!authorized(request)) return response.status(401).json({ error: 'Unauthorized' });
  const { title, summary, fullContent, language } = request.body as Record<string, string>;
  const targetLanguage = language?.trim() || 'Malayalam';
  const languageCodes: Record<string, string> = {
    Malayalam: 'ml', Hindi: 'hi', Tamil: 'ta', Telugu: 'te', Kannada: 'kn',
    Bengali: 'bn', Marathi: 'mr', Gujarati: 'gu', Punjabi: 'pa', Odia: 'or',
    Assamese: 'as', Urdu: 'ur',
  };
  const target = languageCodes[targetLanguage] || targetLanguage.toLowerCase().slice(0, 2);
  const translateUrl = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000/translate';
  const apiKey = process.env.LIBRETRANSLATE_API_KEY;
  const translate = async (text: string) => {
    if (!text.trim()) return '';
    const result = await fetch(translateUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'auto', target, format: 'text', ...(apiKey ? { api_key: apiKey } : {}) }),
      signal: AbortSignal.timeout(60000),
    });
    if (!result.ok) throw new Error(`LibreTranslate returned ${result.status}`);
    const payload = await result.json() as { translatedText?: string };
    return payload.translatedText || text;
  };
  try {
    return response.json({
      title: await translate(title || ''),
      summary: await translate(summary || ''),
      fullContent: await translate(fullContent || ''),
    });
  } catch (error) {
    console.error('LibreTranslate request failed:', error);
    return response.status(503).json({ error: `Local translation service unavailable at ${translateUrl}. Start LibreTranslate first.` });
  }
});

app.get('/health', (_request, response) => response.json({ ok: true }));
app.listen(port, () => console.log(`Crawler server listening on http://localhost:${port}`));
setInterval(() => {
  runAutomaticCrawl().catch((error) => console.error('Automatic crawl cycle failed:', error));
}, 5 * 60 * 1000);
setTimeout(() => {
  runAutomaticCrawl().catch((error) => console.error('Initial crawl cycle failed:', error));
}, 2000);
