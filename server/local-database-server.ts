import express from 'express';
import cors from 'cors';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  databaseFilePath,
  getContent,
  listContent,
  readSetting,
  removeContent,
  replaceSetting,
  upsertContent,
} from './local-database';

const app = express();
const port = Number(process.env.LOCAL_DATABASE_PORT || 8788);
const contentCollections = ['news', 'galleries', 'polls', 'quizzes', 'reviews', 'ads'];
const mediaDirectory = resolve(process.env.LOCAL_MEDIA_PATH || './data/media');
mkdirSync(mediaDirectory, { recursive: true });

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'uproll-test-app',
  });
}

const firestore = getFirestore();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use((request, _response, next) => {
  console.log(
    `[local-db] ${request.ip} ${request.method} ${request.path} ${request.header('user-agent') || ''}`,
  );
  next();
});
app.use('/media', express.static(mediaDirectory));

function serializeFirestoreValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toMillis();
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeFirestoreValue(item)]));
  }
  return value;
}

function validCollection(value: unknown): value is string {
  return typeof value === 'string' && contentCollections.includes(value);
}

function mediaUrlsForRequest(data: Record<string, unknown>, host: string): Record<string, unknown> {
  const localOrigin = `http://${host}`;
  const rewrite = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value.replace('http://localhost:8788', localOrigin);
    }
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewrite(item)]));
    }
    return value;
  };
  const normalized = rewrite(data) as Record<string, unknown>;
  if (!normalized.featureImage && normalized.imageUrl) {
    normalized.featureImage = normalized.imageUrl;
  }
  if (!normalized.imageUrl && normalized.featureImage) {
    normalized.imageUrl = normalized.featureImage;
  }
  return normalized;
}

app.get('/health', (_request, response) => {
  response.json({ ok: true, database: 'sqlite', path: databaseFilePath() });
});

app.get('/api/config', (_request, response) => {
  response.json({ databaseMode: readSetting('databaseMode', 'local') });
});

app.put(
  '/api/media/:name',
  express.raw({ type: ['image/*', 'video/*', 'application/octet-stream'], limit: '250mb' }),
  (request, response) => {
    if (!Buffer.isBuffer(request.body)) return response.status(400).json({ error: 'Binary media body is required' });
    const fileName = basename(request.params.name);
    writeFileSync(resolve(mediaDirectory, fileName), request.body);
    return response.json({ url: `/media/${encodeURIComponent(fileName)}` });
  },
);

app.post('/api/migrate/media', (_request, response) => {
  let migrated = 0;
  for (const item of listContent(contentCollections)) {
    const data = { ...item.data };
    const imageFields = ['featureImage', 'imageUrl', 'posterUrl'];
    for (const field of imageFields) {
      const value = data[field];
      if (typeof value !== 'string' || !value.startsWith('data:image/')) continue;
      const match = value.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (!match) continue;
      const fileName = `${item.id}-${field}.jpg`;
      writeFileSync(resolve(mediaDirectory, fileName), Buffer.from(match[1], 'base64'));
      data[field] = `/media/${encodeURIComponent(fileName)}`;
      migrated += 1;
    }
    if (JSON.stringify(data) !== JSON.stringify(item.data)) {
      upsertContent(item.collection, item.id, data);
    }
  }
  return response.json({ migrated });
});

app.get('/api/content', (request, response) => {
  const requested = typeof request.query.collections === 'string'
    ? request.query.collections.split(',').filter(validCollection)
    : contentCollections;
  const host = request.get('host') || 'localhost:8788';
  response.json({
    items: listContent(requested).map((item) => ({
      ...item,
      data: mediaUrlsForRequest(item.data, host),
    })),
  });
});

app.get('/api/content/:collection/:id', (request, response) => {
  const { collection, id } = request.params;
  if (!validCollection(collection)) return response.status(400).json({ error: 'Unsupported collection' });
  const item = getContent(collection, id);
  if (!item) return response.status(404).json({ error: 'Content not found' });
  return response.json({
    ...item,
    data: mediaUrlsForRequest(item.data, request.get('host') || 'localhost:8788'),
  });
});

app.put('/api/content/:collection/:id', (request, response) => {
  const { collection, id } = request.params;
  if (!validCollection(collection)) return response.status(400).json({ error: 'Unsupported collection' });
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    return response.status(400).json({ error: 'JSON object body is required' });
  }
  return response.json(upsertContent(collection, id, request.body as Record<string, unknown>));
});

app.delete('/api/content/:collection/:id', (request, response) => {
  const { collection, id } = request.params;
  if (!validCollection(collection)) return response.status(400).json({ error: 'Unsupported collection' });
  return response.json({ deleted: removeContent(collection, id) });
});

app.put('/api/settings/:key', (request, response) => {
  if (!request.body || !Object.prototype.hasOwnProperty.call(request.body, 'value')) {
    return response.status(400).json({ error: 'value is required' });
  }
  replaceSetting(request.params.key, request.body.value);
  return response.json({ key: request.params.key, value: request.body.value });
});

app.post('/api/migrate/firebase', async (_request, response) => {
  let migrated = 0;
  for (const collection of contentCollections) {
    const snapshot = await firestore.collection(collection).get();
    for (const document of snapshot.docs) {
      const data = serializeFirestoreValue(document.data()) as Record<string, unknown>;
      upsertContent(collection, document.id, data);
      migrated += 1;
    }
  }
  replaceSetting('databaseMode', 'local');
  return response.json({ migrated, databaseMode: 'local' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Local database server listening on http://localhost:${port}`);
  console.log(`SQLite database: ${databaseFilePath()}`);
});
