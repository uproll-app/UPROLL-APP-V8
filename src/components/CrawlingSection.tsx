import { useEffect, useState } from 'react';
import {
  addDoc,
  deleteDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { Globe2, Image as ImageIcon, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';

type CrawlSource = {
  id: string;
  name: string;
  url: string;
  active?: boolean;
};

type CrawlKeyword = {
  id: string;
  keyword: string;
  active?: boolean;
  lastCrawlAt?: { seconds?: number };
  lastCrawlStatus?: string;
};

export type QueueItem = {
  id: string;
  sourceName?: string;
  sourceUrl?: string;
  hotTopic?: string;
  title?: string;
  summary?: string;
  fullContent?: string;
  imageUrl?: string;
  factCheckNotes?: string;
  imageCheck?: 'pending' | 'verified' | 'missing';
  factCheckStatus?: 'pending' | 'verified' | 'needs-review';
  status?: 'submitted' | 'processing' | 'needsReview' | 'published';
  crawledAt?: { seconds: number };
  publishedAt?: { seconds: number };
  claimedBy?: string;
  claimedByEmail?: string;
  claimedAt?: { seconds: number };
};

const INDIAN_LANGUAGES = [
  'Malayalam',
  'Hindi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Punjabi',
  'Odia',
  'Assamese',
  'Urdu',
];

const formatDate = (value?: { seconds?: number; toDate?: () => Date }) => {
  if (!value) return 'Not yet';
  const date = typeof value.toDate === 'function'
    ? value.toDate()
    : value.seconds
      ? new Date(value.seconds * 1000)
      : null;
  return date ? date.toLocaleString() : 'Not yet';
};

const displayHost = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value;
  }
};

export function CrawlingSection({ view = 'queue', onOpenInStudio }: { view?: 'queue' | 'drafts'; onOpenInStudio?: (item: QueueItem) => void }) {
  const [sources, setSources] = useState<CrawlSource[]>([]);
  const [keywords, setKeywords] = useState<CrawlKeyword[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [hotTopic, setHotTopic] = useState('');
  const [keyword, setKeyword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [message, setMessage] = useState('');
  const [openItem, setOpenItem] = useState<QueueItem | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const unsubscribeSources = onSnapshot(
      query(collection(db, 'crawl_sources'), orderBy('name')),
      (snapshot) => setSources(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<CrawlSource, 'id'>) }))),
    );
    const unsubscribeQueue = onSnapshot(
      query(collection(db, 'editorial_queue'), orderBy('crawledAt', 'desc')),
      (snapshot) => setQueue(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<QueueItem, 'id'>) }))),
    );
    const unsubscribeKeywords = onSnapshot(
      query(collection(db, 'crawl_keywords'), orderBy('keyword')),
      (snapshot) => setKeywords(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<CrawlKeyword, 'id'>) }))),
    );
    return () => {
      unsubscribeSources();
      unsubscribeQueue();
      unsubscribeKeywords();
    };
  }, []);

  const addSource = async () => {
    if (sources.length >= 20) {
      setMessage('You can monitor up to 20 portal links.');
      return;
    }
    if (!sourceName.trim() || !sourceUrl.trim()) {
      setMessage('Enter both a portal name and portal URL.');
      return;
    }
    const normalizedUrl = /^https?:\/\//i.test(sourceUrl.trim())
      ? sourceUrl.trim()
      : `https://${sourceUrl.trim()}`;
    try {
      new URL(normalizedUrl);
    } catch {
      setMessage('Enter a valid portal URL, for example https://example.com.');
      return;
    }
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'crawl_sources'), {
        name: sourceName.trim(),
        url: normalizedUrl,
        active: true,
        createdAt: serverTimestamp(),
      });
      setSourceName('');
      setSourceUrl('');
      setMessage('Portal added to the crawl list.');
    } finally {
      setIsAdding(false);
    }
  };

  const deleteSource = async (item: CrawlSource) => {
    const confirmed = window.confirm(`Remove the portal “${item.name}” from the crawl list?`);
    if (!confirmed) return;

    await deleteDoc(doc(db, 'crawl_sources', item.id));
    setMessage(`Removed portal “${item.name}”.`);
  };

  const addKeyword = async () => {
    if (keywords.length >= 20) {
      setMessage('You can monitor up to 20 keywords.');
      return;
    }
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      setMessage('Enter a keyword to monitor.');
      return;
    }
    if (keywords.some((item) => item.keyword.trim().toLocaleLowerCase() === normalizedKeyword.toLocaleLowerCase())) {
      setMessage('That keyword is already being monitored.');
      return;
    }
    await addDoc(collection(db, 'crawl_keywords'), {
      keyword: normalizedKeyword,
      active: true,
      createdAt: serverTimestamp(),
    });
    setKeyword('');
    setMessage('Trending keyword added. The crawler will monitor it automatically.');
  };

  const deleteKeyword = async (item: CrawlKeyword) => {
    await deleteDoc(doc(db, 'crawl_keywords', item.id));
    setMessage(`Stopped monitoring “${item.keyword}”.`);
  };

  const deleteQueueItem = async (item: QueueItem) => {
    const label = item.title || item.sourceName || item.sourceUrl || 'this story';
    if (!window.confirm(`Delete “${label}” from the queue and drafts?`)) return;
    await deleteDoc(doc(db, 'editorial_queue', item.id));
    if (openItem?.id === item.id) setOpenItem(null);
    setMessage('Story removed from the queue and drafts.');
  };

  const clearCrawledContent = async () => {
    if (!auth.currentUser) {
      setMessage('Sign in with an official admin account to clear crawled content.');
      return;
    }
    const token = await auth.currentUser.getIdTokenResult();
    if (token.claims.role !== 'admin') {
      setMessage('Only an official admin account can clear crawled content.');
      return;
    }
    setIsClearing(true);
    try {
      for (let index = 0; index < queue.length; index += 500) {
        const batch = writeBatch(db);
        queue.slice(index, index + 500).forEach((item) => {
          batch.delete(doc(db, 'editorial_queue', item.id));
        });
        await batch.commit();
      }
      setMessage(`Removed ${queue.length} crawled queue item(s). Keywords remain active.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to clear crawled content.');
    } finally {
      setIsClearing(false);
    }
  };

  const requestCrawl = async () => {
    if (sources.length === 0) {
      setMessage('Add a news portal before crawling a keyword.');
      return;
    }
    if (!hotTopic.trim() && keywords.length === 0) return;
    setIsCrawling(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CRAWLER_URL || 'http://localhost:8787'}/crawl-keywords`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ keywords: hotTopic.trim() ? [hotTopic.trim()] : keywords.map((item) => item.keyword) }),
        },
      );
      if (!response.ok) throw new Error('Crawler server unavailable');
      const result = await response.json() as { results?: { status: string }[] };
      const failed = result.results?.filter((item) => item.status === 'failed').length || 0;
      setMessage(failed ? `${failed} keyword crawl(s) failed; review the queue for details.` : 'Keyword crawl completed. New stories are in the queue.');
      setHotTopic('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Crawler server unavailable.');
    } finally {
      setIsCrawling(false);
    }
  };

  const saveReview = async (item: QueueItem, changes: Partial<QueueItem>) => {
    await updateDoc(doc(db, 'editorial_queue', item.id), changes);
    setMessage('Writer review saved.');
  };

  const publishItem = async (item: QueueItem) => {
    await saveReview(item, { status: 'published', publishedAt: serverTimestamp() as unknown as { seconds: number } });
  };

  const claimItem = async (item: QueueItem) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in with an official writer account first.');
    await runTransaction(db, async (transaction) => {
      const reference = doc(db, 'editorial_queue', item.id);
      const snapshot = await transaction.get(reference);
      const current = snapshot.data() as QueueItem | undefined;
      if (current?.claimedBy && current.claimedBy !== user.uid) {
        throw new Error('This story is already assigned to another writer.');
      }
      transaction.update(reference, {
        claimedBy: user.uid,
        claimedByEmail: user.email || user.uid,
        claimedAt: serverTimestamp(),
        status: 'processing',
      });
    });
    setMessage('Story claimed for your account.');
  };

  return (
    <section className="p-5 sm:p-7 space-y-6 overflow-y-auto h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">Editorial automation</p>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{view === 'drafts' ? 'Writer Drafts' : 'Crawling & Writer Queue'}</h2>
          <p className="text-sm text-slate-500 mt-1">{view === 'drafts' ? 'Stories claimed by writers. Only the claiming writer can edit and publish.' : 'Queue hot topics from multiple portals, then claim a story to move it into Drafts.'}</p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">{view === 'drafts' ? 'Claimed work' : 'Automatic monitoring'}</span>
      </div>

      {message && <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">{message}</div>}

      {view === 'queue' && <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
        <div className="min-w-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Globe2 className="w-5 h-5 text-indigo-600" /><h3 className="font-black text-slate-900">News portals</h3></div><span className="text-xs font-bold text-slate-500">{sources.length} / 20</span></div>
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="Portal name" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://portal.com" type="url" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <button onClick={addSource} disabled={isAdding || sources.length >= 20} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50"><Plus className="w-4 h-4" />Add portal</button>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{source.name}</p>
                  <p className="text-xs text-slate-500 truncate" title={source.url}>{displayHost(source.url)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black uppercase text-emerald-700">Active</span>
                  <button
                    type="button"
                    onClick={() => void deleteSource(source)}
                    title={`Delete ${source.name}`}
                    className="p-1.5 rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete portal ${source.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {sources.length === 0 && <p className="text-sm text-slate-400">Add the first portal to begin.</p>}
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Trending keywords ({keywords.length} / 20)</p>
            <div className="flex gap-2">
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Add a topic keyword" className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
              <button onClick={addKeyword} disabled={keywords.length >= 20} className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-50"><Plus className="w-4 h-4" />Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords.map((item) => <span key={item.id} title={item.lastCrawlAt ? `Last crawl: ${formatDate(item.lastCrawlAt)}` : 'Not crawled yet'} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">{item.keyword}<small className="font-medium text-amber-700">{item.lastCrawlStatus || 'Not crawled yet'}</small><button type="button" onClick={() => void deleteKeyword(item)} title={`Delete ${item.keyword}`} className="text-amber-700 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button></span>)}
              {keywords.length === 0 && <span className="text-xs text-slate-400">No keywords saved yet.</span>}
            </div>
          </div>
        </div>

        <div className="min-w-0 bg-slate-950 rounded-2xl p-5 shadow-sm space-y-4 text-white">
          <div className="flex items-center gap-2"><Search className="w-5 h-5 text-amber-300" /><h3 className="font-black">Queue a hot topic</h3></div>
          <textarea value={hotTopic} onChange={(event) => setHotTopic(event.target.value)} rows={3} placeholder="Example: Kerala film release updates" className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/40" />
          <button onClick={requestCrawl} disabled={isCrawling || sources.length === 0 || (!hotTopic.trim() && keywords.length === 0)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-sm font-black disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${isCrawling ? 'animate-spin' : ''}`} />Crawl portal keywords</button>
          <p className="text-xs text-white/55">The crawler checks article links from your added portals for each keyword every 15 minutes.</p>
        </div>
      </div>}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black text-slate-900">Writer review queue</h3><p className="text-xs text-slate-500 mt-1">Verify image, factual accuracy, crawl time, and publication time before publishing.</p></div><div className="flex items-center gap-2"><span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{queue.length} items</span>{view === 'queue' && <button type="button" onClick={() => void clearCrawledContent()} disabled={isClearing || queue.length === 0} className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold disabled:opacity-50">{isClearing ? 'Clearing...' : 'Clear crawled content'}</button>}</div></div>
        <div className="space-y-3">
          {queue.filter((item) => view === 'drafts' ? Boolean(item.claimedBy) : !item.claimedBy).map((item) => <div key={item.id}><QueueReviewCard item={item} onOpen={(openedItem) => { if (onOpenInStudio) onOpenInStudio(openedItem); else setOpenItem(openedItem); }} onClaim={claimItem} onDelete={deleteQueueItem} /></div>)}
          {queue.filter((item) => view === 'drafts' ? Boolean(item.claimedBy) : !item.claimedBy).length === 0 && <div className="py-12 text-center text-sm text-slate-400">{view === 'drafts' ? 'No claimed drafts yet.' : 'No unclaimed crawl requests yet.'}</div>}
        </div>
      </div>
      {openItem && <QueueDetail item={openItem} onClose={() => setOpenItem(null)} onClaim={claimItem} onSave={saveReview} onPublish={publishItem} onMessage={setMessage} />}
    </section>
  );
}

function QueueReviewCard({ item, onOpen, onClaim, onDelete }: { item: QueueItem; onOpen: (item: QueueItem) => void; onClaim: (item: QueueItem) => Promise<void>; onDelete: (item: QueueItem) => Promise<void> }) {
  return <article className="flex items-center gap-4 border border-slate-200 rounded-xl p-3 bg-white hover:border-indigo-300 transition-colors">
    <div className="w-20 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
      {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-400" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 truncate">{item.sourceName || 'Portal'} · {item.hotTopic || 'Latest content'}</p>
      <h4 className="font-bold text-sm text-slate-900 truncate">{item.title || 'Untitled crawled story'}</h4>
      <p className="text-xs text-slate-500 truncate">{item.summary || 'No summary extracted yet.'}</p>
      <p className="text-[10px] text-slate-400 mt-1">Crawled {formatDate(item.crawledAt)}{item.claimedBy ? ` · Claimed by ${item.claimedByEmail || item.claimedBy}` : ''}</p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button onClick={() => onOpen(item)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">Open</button>
      {!item.claimedBy && <button onClick={() => void onClaim(item)} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold">Claim</button>}
      <button type="button" onClick={() => void onDelete(item)} title="Delete story" aria-label="Delete story" className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
    </div>
  </article>;
}

function QueueDetail({ item, onClose, onClaim, onSave, onPublish, onMessage }: { item: QueueItem; onClose: () => void; onClaim: (item: QueueItem) => Promise<void>; onSave: (item: QueueItem, changes: Partial<QueueItem>) => Promise<void>; onPublish: (item: QueueItem) => Promise<void>; onMessage: (message: string) => void }) {
  const canEdit = item.claimedBy === auth.currentUser?.uid;
  const [title, setTitle] = useState(item.title || '');
  const [summary, setSummary] = useState(item.summary || '');
  const [fullContent, setFullContent] = useState(item.fullContent || item.summary || '');
  const [imageUrl, setImageUrl] = useState(item.imageUrl || '');
  const [isTranslating, setIsTranslating] = useState(false);
  const [language, setLanguage] = useState('Malayalam');
  const [translationError, setTranslationError] = useState('');

  const translateStory = async () => {
    setIsTranslating(true);
    setTranslationError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_CRAWLER_URL || 'http://localhost:8787'}/translate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, summary, fullContent, language }),
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(failure?.error || 'Translation service is unavailable.');
      }
      const translated = await response.json() as { title?: string; summary?: string; fullContent?: string };
      setTitle(translated.title || title);
      setSummary(translated.summary || summary);
      setFullContent(translated.fullContent || fullContent);
      onMessage(`Entire story translated to ${language}. Review it before saving.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Translation failed.';
      setTranslationError(message);
      onMessage(message);
    } finally {
      setIsTranslating(false);
    }
  };

  return <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 sm:p-8 grid place-items-center" onClick={onClose}>
    <article className="w-full max-w-3xl max-h-full overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="p-5 sm:p-7 space-y-4">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-indigo-600">{item.sourceName || 'Portal'} · {item.hotTopic || 'Latest content'}</p><h3 className="text-xl font-black text-slate-900 mt-1">{title || 'Untitled crawled story'}</h3><p className="text-xs text-slate-500 mt-1">Crawled {formatDate(item.crawledAt)}{item.claimedByEmail ? ` · Claimed by ${item.claimedByEmail}` : ''}</p></div><button onClick={onClose} className="text-sm font-bold text-slate-500">Close</button></div>
        {imageUrl && <img src={imageUrl} alt="Crawled story" className="w-full max-h-80 object-cover rounded-xl bg-slate-100" />}
        {canEdit ? <div className="space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Headline" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold" /><textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} placeholder="Feed summary" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Image URL" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /><textarea value={fullContent} onChange={(event) => setFullContent(event.target.value)} rows={12} placeholder="Full story content" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm leading-6" />{translationError && <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">{translationError}</p>}<div className="flex flex-wrap items-center gap-2"><select value={language} onChange={(event) => setLanguage(event.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800">{INDIAN_LANGUAGES.map((item) => <option key={item} value={item}>{item}</option>)}</select><button onClick={() => void translateStory()} disabled={isTranslating} className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-sm font-black disabled:opacity-50">{isTranslating ? 'Translating...' : 'Translate entire story'}</button><button onClick={() => void onSave(item, { title, summary, fullContent, imageUrl, status: 'needsReview' })} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold">Save draft</button><button onClick={() => void onPublish(item)} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold">Publish</button></div></div> : <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{fullContent || summary || 'Full content is not available yet.'}</p>}
        {!item.claimedBy && <button onClick={() => void onClaim(item)} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold">Claim story</button>}
      </div>
    </article>
  </div>;
}
