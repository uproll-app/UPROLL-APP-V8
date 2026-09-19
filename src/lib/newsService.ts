import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable,
} from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { ArticleData } from '../types';

export interface ReaderAnswerItem {
  id: string;
  user?: string;
  text: string;
  date?: string;
  timestamp?: number;
}

export interface MovieFeedbackItem {
  id: string;
  author: string;
  comment: string;
  date: string;
  likes: number;
  dislikes: number;
  rating?: number;
  timestamp?: number;
}

export interface ExtendedArticleData extends ArticleData {
  status?: 'Live' | 'Draft' | 'Archived';
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
  source?: string;
  totalVotes?: number;
  question?: string;
  userResponsesCount?: number;
  cardThemeColor?: string;
  pollBackgroundImage?: string;
  attachedToStoryId?: string;
  cardCoverImage?: string;
  badgeTag?: string;
  headerOverlay?: boolean;
  choiceOptions?: string[] | { id: string; text: string; votes?: number }[];
  readerAnswers?: ReaderAnswerItem[];
  audienceReviews?: MovieFeedbackItem[];
  audienceRatingsCount?: number;
  storyId?: string;
  sharesCount?: number;
  savedCount?: number;
  opensCount?: number;
  pushSent?: boolean;
  pushSentTime?: string;
  isPinned?: boolean;
  isSponsored?: boolean;
  sponsorName?: string;
  ctaButtonLabel?: string;
  redirectTargetUrl?: string;
  monetizationType?: 'full_image' | 'gallery' | 'standard' | 'ad_article';
  brandLogoUrl?: string;
  videoUrl?: string;
}

const SETTINGS_COLLECTION = 'app_settings';
const FIRESTORE_WRITE_TIMEOUT_MS = 15000;
const STORAGE_UPLOAD_TIMEOUT_MS = 120000;
const STORAGE_UPLOAD_RETRIES = 2;

export type DatabaseMode = 'firebase' | 'local';

export interface AppSettings {
  reelsEnabled: boolean;
  databaseMode: DatabaseMode;
}

const LOCAL_DATABASE_URL = import.meta.env.VITE_LOCAL_DATABASE_URL || 'http://localhost:8788';
let activeDatabaseMode: DatabaseMode = 'firebase';

export function setActiveDatabaseMode(mode: DatabaseMode): void {
  activeDatabaseMode = mode;
}

export async function migrateFirebaseToLocalDatabase(): Promise<number> {
  const result = await localDatabaseRequest<{ migrated: number }>('/api/migrate/firebase', {
    method: 'POST',
  });
  return result.migrated;
}

export async function setLocalDatabaseMode(mode: DatabaseMode): Promise<void> {
  await localDatabaseRequest('/api/settings/databaseMode', {
    method: 'PUT',
    body: JSON.stringify({ value: mode }),
  });
}

async function localDatabaseRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${LOCAL_DATABASE_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  if (!response.ok) {
    throw new Error(`Local database request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function normalizeImageLink(source: string): string {
  try {
    const url = new URL(source);
    if (url.hostname.endsWith('wikipedia.org')) {
      const fileMarker = '#/media/File:';
      const markerIndex = url.hash.indexOf(fileMarker);
      if (markerIndex >= 0) {
        const fileName = decodeURIComponent(
          url.hash.substring(markerIndex + fileMarker.length),
        );
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
      }
    }
  } catch {
    // Keep the original value for validation below.
  }
  return source;
}

export async function uploadVideoFile(file: File, articleId: string): Promise<string> {
  const extension = file.name.split('.').pop() || 'mp4';
  if (activeDatabaseMode === 'local') {
    const fileName = `${articleId}.${extension}`;
    const response = await fetch(`${LOCAL_DATABASE_URL}/api/media/${encodeURIComponent(fileName)}`, {
      method: 'PUT',
      headers: { 'content-type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!response.ok) throw new Error(`Local media upload failed: ${response.status}`);
    return `${LOCAL_DATABASE_URL}/media/${encodeURIComponent(fileName)}`;
  }
  const videoRef = ref(storage, `content-videos/${articleId}.${extension}`);
  await uploadBytes(videoRef, file, { contentType: file.type || 'video/mp4' });
  return getDownloadURL(videoRef);
}

export async function uploadImageDataUrl(
  dataUrl: string,
  articleId: string,
  assetName: string,
): Promise<string> {
  const source = normalizeImageLink(dataUrl.trim());
  const isDataImage = source.startsWith('data:image/');
  const isRemoteImage = source.startsWith('http://') || source.startsWith('https://');
  if (!isDataImage && !isRemoteImage) return source;

  let response: Response;
  try {
    response = await fetch(source);
    if (!response.ok) return source;
    if (!response.headers.get('content-type')?.startsWith('image/')) return source;
  } catch {
    return source;
  }
  const blob = await response.blob();
  let uploadBlob = blob;
  try {
    const bitmap = await createImageBitmap(blob);
    const maxDimension = 800;
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    uploadBlob = await new Promise<Blob>((resolve) =>
      canvas.toBlob(
        (compressed) => resolve(compressed ?? blob),
        'image/jpeg',
        0.55,
      ),
    );
    bitmap.close();
  } catch {
    uploadBlob = blob;
  }
  if (activeDatabaseMode === 'local') {
    const fileName = `${articleId}-${assetName}.jpg`;
    const response = await fetch(`${LOCAL_DATABASE_URL}/api/media/${encodeURIComponent(fileName)}`, {
      method: 'PUT',
      headers: { 'content-type': 'image/jpeg' },
      body: uploadBlob,
    });
    if (!response.ok) throw new Error(`Local image upload failed: ${response.status}`);
    return `${LOCAL_DATABASE_URL}/media/${encodeURIComponent(fileName)}`;
  }
  const imageRef = ref(storage, `content-images/${articleId}/${assetName}.jpg`);
  try {
    let lastError: unknown;
    for (let attempt = 0; attempt <= STORAGE_UPLOAD_RETRIES; attempt += 1) {
      try {
        await uploadBlobWithTimeout(imageRef, uploadBlob);
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < STORAGE_UPLOAD_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
    }
    if (lastError) throw lastError;
    return await withFirestoreTimeout(
      getDownloadURL(imageRef),
      `Image URL lookup timed out after ${STORAGE_UPLOAD_TIMEOUT_MS / 1000} seconds`,
      STORAGE_UPLOAD_TIMEOUT_MS,
    );
  } catch (error) {
    console.error('Error uploading article image to Firebase Storage:', error);
    throw error;
  }
}

function uploadBlobWithTimeout(
  imageRef: ReturnType<typeof ref>,
  blob: Blob,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(imageRef, blob, {
      contentType: 'image/jpeg',
    });
    const timeoutId = setTimeout(() => {
      task.cancel();
      reject(
        new Error(
          `Image upload timed out after ${STORAGE_UPLOAD_TIMEOUT_MS / 1000} seconds`,
        ),
      );
    }, STORAGE_UPLOAD_TIMEOUT_MS);

    task.on(
      'state_changed',
      undefined,
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
      () => {
        clearTimeout(timeoutId);
        resolve();
      },
    );
  });
}

export async function uploadImageDataUrls(
  dataUrls: string[],
  articleId: string,
): Promise<string[]> {
  return Promise.all(
    dataUrls.map((dataUrl, index) =>
      uploadImageDataUrl(dataUrl, articleId, `image-${index}`),
    ),
  );
}

const CONTENT_COLLECTIONS = [
  'news',
  'galleries',
  'polls',
  'quizzes',
  'reviews',
  'ads',
] as const;

type ContentCollection = (typeof CONTENT_COLLECTIONS)[number];

function collectionForArticle(article: Partial<ExtendedArticleData>): ContentCollection {
  if (article.isSponsored && article.monetizationType) return 'ads';
  switch (article.type) {
    case 'gallery':
    case 'full_gallery':
      return 'galleries';
    case 'poll':
      return 'polls';
    case 'quiz':
      return 'quizzes';
    case 'movie':
    case 'movie_review':
      return 'reviews';
    default:
      return 'news';
  }
}

function normalizeReaderArticle(
  id: string,
  sourceCollection: ContentCollection,
  data: Record<string, any>,
): ExtendedArticleData {
  const galleryImages = Array.isArray(data.imageUrls)
    ? data.imageUrls
    : Array.isArray(data.images)
      ? data.images
      : Array.isArray(data.galleryImages)
        ? data.galleryImages
        : Array.isArray(data.relatedImages)
          ? data.relatedImages
        : [];
  const type = sourceCollection === 'galleries'
    ? 'gallery'
    : sourceCollection === 'polls'
      ? 'poll'
      : sourceCollection === 'quizzes'
        ? 'quiz'
        : sourceCollection === 'reviews'
          ? 'movie_review'
          : sourceCollection === 'ads'
            ? 'news'
            : 'news';

  const isPollOrQuizCollection = sourceCollection === 'polls' || sourceCollection === 'quizzes';
  const pollBackgroundImage =
    data.pollBackgroundImage ||
    data.backgroundImageUrl ||
    data.imageUrl ||
    data.featureImage ||
    data.posterUrl ||
    '';

  return {
    id,
    ...data,
    title: data.title || data.name || data.question || '',
    category: data.category || 'General',
    summary: data.summary || data.body || '',
    type,
    featureImage: isPollOrQuizCollection
      ? pollBackgroundImage
      : data.imageUrl || data.featureImage || data.pollBackgroundImage || galleryImages[0] || data.posterUrl || '',
    pollBackgroundImage,
    galleryImages,
    choiceOptions:
      data.choiceOptions || data.options || data.pollOptions || data.answers || [],
    status: data.isPublished === true || data.status === 'Live' ? 'Live' : 'Draft',
    _contentCollection: sourceCollection,
  } as unknown as ExtendedArticleData;
}

function readerPayload(
  article: Partial<ExtendedArticleData> & { title: string },
  collectionName: ContentCollection,
) {
  const base = {
    title: article.title,
    summary: article.summary || '',
    fullContent: article.fullContent || '',
    isPublished: article.status === 'Live',
    status: article.status || 'Draft',
    category: article.category || 'General',
    source: article.source || article.author || 'UPROLL Editorial Desk',
    timeAgo: article.date || 'Just now',
    updatedAt: Date.now(),
    ...(article.redirectTargetUrl
      ? {
          videoUrl: article.redirectTargetUrl,
          redirectTargetUrl: article.redirectTargetUrl,
          youtubeUrl: article.redirectTargetUrl,
        }
      : {}),
    ...(article.videoUrl ? { videoUrl: article.videoUrl } : {}),
    ...(article.createdAt ? { createdAt: article.createdAt } : { createdAt: Date.now() }),
    ...(article.createdBy || auth.currentUser?.uid
      ? { createdBy: article.createdBy || auth.currentUser?.uid }
      : {}),
    ...(auth.currentUser?.uid ? { updatedBy: auth.currentUser.uid } : {}),
  };

  if (collectionName === 'galleries') {
    return {
      ...base,
      imageUrls: (article.galleryImages?.length
        ? article.galleryImages
        : [article.featureImage].filter(Boolean)).slice(0, 10),
    };
  }

  if (collectionName === 'polls' || collectionName === 'quizzes') {
    const options = (article.choiceOptions || []).map((option: any, index) => {
      const label = typeof option === 'string' ? option : option.text || option.label || '';
      const votes = typeof option === 'object' ? Number(option.votes || 0) : 0;
      return {
        id: String(option.id || index + 1),
        label,
        text: label,
        percent: Number(option.percent || 0),
        votes,
        ...(collectionName === 'quizzes' && option.isCorrect !== undefined
          ? { isCorrect: option.isCorrect }
          : {}),
      };
    });
    const pollBackgroundImage = article.pollBackgroundImage || article.featureImage || '';
    return {
      ...base,
      question: article.question || article.title,
      ...(article.attachedToStoryId
        ? { attachedToStoryId: article.attachedToStoryId }
        : {}),
      imageUrl: pollBackgroundImage,
      featureImage: pollBackgroundImage,
      pollBackgroundImage,
      options,
      votes: Number(article.totalVotes || article.userResponsesCount || 0),
    };
  }

  if (collectionName === 'reviews') {
    return {
      ...base,
      imageUrl: article.featureImage || '',
      ...(article.attachedToStoryId
        ? { attachedToStoryId: article.attachedToStoryId }
        : {}),
      synopsis: article.synopsis || article.summary || '',
      score: Number(article.starRating || article.rating || 0),
      ratingCount: Number(article.audienceRatingsCount || 0),
      ...(article.director ? { director: article.director } : {}),
      ...(article.cast ? { cast: article.cast } : {}),
      ...(article.castMembers ? { castMembers: article.castMembers.slice(0, 15) } : {}),
      ...(article.relatedImages || article.galleryImages
        ? {
            relatedImages: (article.relatedImages || article.galleryImages || []).slice(0, 10),
            relatedImageUrls: (article.relatedImages || article.galleryImages || []).slice(0, 10),
          }
        : {}),
      ...(article.genres ? { genres: article.genres.slice(0, 4) } : {}),
      ...(article.releaseDate ? { releaseDate: article.releaseDate } : {}),
      ...(article.country ? { country: article.country } : {}),
      ...(article.language ? { language: article.language } : {}),
      ...(article.productionCompany ? { productionCompany: article.productionCompany } : {}),
      ...(article.runtime ? { runtime: article.runtime } : {}),
      ...(article.certificate ? { certificate: article.certificate } : {}),
      ...(article.status ? { status: article.status } : {}),
      ...(article.releaseStatus ? { releaseStatus: article.releaseStatus } : {}),
    };
  }

  if (collectionName === 'ads') {
    return {
      ...base,
      advertiser: article.sponsorName || article.author || '',
      body: article.fullContent || article.summary || '',
      imageUrls: article.galleryImages?.slice(0, 10) || [article.featureImage].filter(Boolean),
      ctaLabel: article.ctaButtonLabel || 'Learn more',
      destinationUrl: article.redirectTargetUrl || '',
      priority: 0,
      format: article.monetizationType === 'gallery' ? 'gallery' : 'fullImage',
      isActive: article.status === 'Live',
    };
  }

  return {
    ...base,
    imageUrl: article.featureImage || '',
    readTime: '2 min read',
    accent: 0xFF0E7490,
    icon: article.category || 'article',
  };
}

export const INITIAL_SEED_ARTICLES: ExtendedArticleData[] = [
  {
    id: 'interview-comments-story-2259',
    type: 'news',
    title: "'ആ അഭിമുഖങ്ങൾക്ക് താഴെ വന്ന കമന്റുകളായിരുന്നു ആദ്യത്തെ ധൈര്യം'",
    category: 'Movies & TV Shows',
    genres: ['Interview', 'Mollywood', 'Exclusive'],
    featureImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop',
    rating: 'Normal',
    author: 'FlickPulse Desk',
    date: 'Just now',
    summary: 'സിനിമ രംഗത്തേക്ക് എത്തിയപ്പോഴുള്ള അനുഭവങ്ങളും സോഷ്യൽ മീഡിയ പ്രതികരണങ്ങളും പങ്കുവെച്ച് താരം.',
    fullContent: 'ആദ്യമായി അഭിമുഖങ്ങൾ നൽകിയപ്പോൾ വല്ലാത്ത ഭയമുണ്ടായിരുന്നു. എന്നാൽ പ്രേക്ഷകരുടെ സ്നേഹം നിറഞ്ഞ കമന്റുകളാണ് മുന്നോട്ട് പോകാൻ ഏറ്റവും വലിയ ആത്മവിശ്വാസം നൽകിയത്.',
    storyId: '#2259',
    pushSent: false,
    sharesCount: 4,
    savedCount: 8,
    opensCount: 1,
    isPinned: false,
    status: 'Live',
    createdAt: Date.now(),
  },
  {
    id: 'khalifa-movie-review-7394',
    type: 'movie',
    title: "'ഖലീഫ' (Khalifa) Movie Review",
    category: 'Movie Reviews',
    genres: ['Action', 'Thriller', 'Malayalam'],
    featureImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
    rating: '8.8',
    starRating: 8.8,
    verdict: 'MUST WATCH',
    director: 'Vysakh',
    author: 'Vysakh',
    date: 'Just now',
    summary:
      "വ്യത്യസ്തമായ സ്റ്റൈലിൽ എത്തിയ മാസ്സ് ആക്ഷൻ ചിത്രം ഖലീഫ തിയേറ്ററുകളിൽ തരംഗം സൃഷ്ടിക്കുന്നു. പൃഥ്വിരാജിന്റെ മികച്ച പ്രകടനം വിഷ്വൽ മിടുക്കോടെ പ്രേക്ഷകരിലേക്ക് എത്തുന്നു.",
    fullContent: 'സംവിധായകൻ വൈശാഖിന്റെ സംവിധാന മികവും പൃഥ്വിരാജിന്റെ ആക്ഷൻ രംഗങ്ങളും ചിത്രത്തെ ഒരു ഗംഭീര തീയേറ്റർ അനുഭവമാക്കി മാറ്റുന്നു.',
    storyId: '#7394',
    pushSent: false,
    sharesCount: 4,
    savedCount: 8,
    opensCount: 1,
    isPinned: false,
    status: 'Live',
    audienceRatingsCount: 14280,
    audienceReviews: [
      {
        id: 'mr-1',
        author: 'Rahul Nair',
        comment: 'Exceptional direction and mass action entertainer! The interval sequence and climax action are crafted with exceptional scale.',
        date: '2 hours ago',
        likes: 184,
        dislikes: 12,
        rating: 9,
        timestamp: Date.now() - 7200000,
      },
      {
        id: 'mr-2',
        author: 'Anjali Menon',
        comment: 'The background score elevates every single scene. The screenplay keeps you hooked throughout without any dragging moments.',
        date: '5 hours ago',
        likes: 142,
        dislikes: 8,
        rating: 8,
        timestamp: Date.now() - 18000000,
      },
      {
        id: 'mr-3',
        author: 'Kiran Kumar',
        comment: 'Solid thriller with striking visuals. Great production values and cinematography. A must-watch on the big screen.',
        date: '1 day ago',
        likes: 95,
        dislikes: 6,
        rating: 9,
        timestamp: Date.now() - 86400000,
      },
    ],
    createdAt: Date.now() - 180000,
  },
  {
    id: 'samantha-marriage-3152',
    type: 'gallery',
    headerOverlay: true,
    title: 'samantha marriage',
    category: 'Celebrity & Pop Culture',
    genres: ['Celebrity', 'Wedding', 'Gallery'],
    featureImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop',
    rating: 'Trending',
    author: 'Photo Desk',
    date: 'Just now',
    summary: 'സമാന്തയുടെ ഏറ്റവും പുതിയ വിശേഷങ്ങളും മനോഹരമായ ചിത്രങ്ങളും സോഷ്യൽ മീഡിയയിൽ വൈറലാകുന്നു.',
    fullContent: 'തെന്നിന്ത്യൻ താരം സമാന്തയുടെ വിവാഹ വാർത്തകളും ചിത്രങ്ങളും ആരാധകർക്കിടയിൽ ചർച്ചയാകുന്നു.',
    galleryImages: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1000&auto=format&fit=crop',
    ],
    storyId: '#3152',
    pushSent: false,
    sharesCount: 4,
    savedCount: 8,
    opensCount: 1,
    isPinned: false,
    status: 'Live',
    createdAt: Date.now() - 300000,
  },
  {
    id: 'vismaya-mohanlal-debut-7958',
    type: 'news',
    title: 'വിസ്മയിപ്പിച്ച് വിസ്മയ മോഹൻലാലിൻറെ തുടക്കം, കളക്ഷൻ കണക്കുകൾ പുറത്ത്',
    category: 'Movies & TV Shows',
    genres: ['Box Office', 'Mollywood', 'Debut'],
    featureImage: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop',
    rating: 'Normal',
    author: 'FlickPulse Desk',
    date: 'Just now',
    summary: 'വിസ്മയ മോഹൻലാലിന്റെ പുതിയ സംരംഭത്തിന് ബോക്സ് ഓഫീസിൽ നിന്നും മികച്ച സ്വീകാര്യതയാണ് ലഭിക്കുന്നത്.',
    fullContent: 'ആദ്യ ദിനം മുതൽ മികച്ച ബുക്കിംഗ് സ്വന്തമാക്കിയ ചിത്രം കുടുംബപ്രേക്ഷകരെയും ഒരുപോലെ ആകർഷിക്കുന്നു.',
    storyId: '#7958',
    pushSent: false,
    sharesCount: 4,
    savedCount: 8,
    opensCount: 1,
    isPinned: false,
    status: 'Live',
    createdAt: Date.now() - 360000,
  },
  {
    id: 'joyalukkas-diamond-gallery-9102',
    type: 'full_gallery',
    title: 'Joyalukkas Diamond Fest: 10 Exclusive Luxury Bridal Looks & High Jewellery Showcase',
    category: 'Monetization • Full Image Gallery',
    genres: ['Jewellery', 'Luxury', 'Fashion', 'Lookbook'],
    featureImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 'Top Brand Sponsored',
    author: 'Joyalukkas Brand Desk',
    date: 'Just now',
    summary: 'Discover Joyalukkas Diamond Fest 2026 with handcrafted VVS solitaire diamond necklaces and bridal royal sets. Swipe through all 10 curated lookbook styles.',
    fullContent: 'Joyalukkas presents its flagship Diamond Celebration across all premier showrooms. Featuring certified natural diamonds crafted by master artisans with lifetime exchange assurance.',
    storyId: '#9102',
    pushSent: true,
    pushSentTime: '11:15',
    sharesCount: 18,
    savedCount: 42,
    opensCount: 154,
    isPinned: true,
    isSponsored: true,
    sponsorName: 'Joyalukkas',
    monetizationType: 'full_image',
    ctaButtonLabel: 'Shop Diamond Fest 2026',
    redirectTargetUrl: 'https://www.joyalukkas.com',
    status: 'Live',
    createdAt: Date.now() - 420000,
  },
  {
    id: 'malabar-gold-standard-story-8421',
    type: 'news',
    title: 'Malabar Gold & Diamonds Unveils Royal Heritage Collection with Zero Deduction Exchange',
    category: 'Brand Story',
    genres: ['Jewellery', 'Bridal', 'Sponsored Story'],
    featureImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1000&auto=format&fit=crop',
    rating: 'Sponsored Story',
    author: 'Malabar Editorial',
    date: 'Just now',
    summary: 'Malabar Gold & Diamonds introduces its newest 2026 wedding jewellery line crafted in 916 pure gold with transparent gold pricing and guaranteed buyback policies across South India.',
    fullContent: 'The Royal Heritage line draws inspiration from historic Indian palace architecture, offering lightweight yet magnificent temple jewellery designs.',
    storyId: '#8421',
    pushSent: false,
    sharesCount: 12,
    savedCount: 29,
    opensCount: 98,
    isPinned: false,
    isSponsored: true,
    sponsorName: 'Malabar Gold & Diamonds',
    monetizationType: 'standard',
    ctaButtonLabel: 'Explore Royal Heritage Collection',
    redirectTargetUrl: 'https://www.malabargoldanddiamonds.com',
    status: 'Live',
    createdAt: Date.now() - 480000,
  },
  {
    id: 'bookmyshow-cinema-gallery-7734',
    type: 'gallery',
    title: 'BookMyShow & PVR INOX: Big Ticket Summer Blockbusters & Exclusive IMAX Stills',
    category: 'Cinema Partner',
    genres: ['Movies', 'IMAX', 'Tickets', 'Gallery'],
    featureImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
    ],
    rating: 'Brand Carousel',
    author: 'BookMyShow Desk',
    date: 'Just now',
    summary: 'Experience ultimate cinema immersion with IMAX with Laser and Dolby Cinema. Reserve premiere weekend seats with exclusive 20% discount on cinema combos.',
    fullContent: 'Book tickets for all major upcoming Hollywood, Bollywood, and Mollywood spectacles on BookMyShow with zero convenience fee offers on select cards.',
    storyId: '#7734',
    pushSent: false,
    sharesCount: 22,
    savedCount: 35,
    opensCount: 210,
    isPinned: false,
    isSponsored: true,
    sponsorName: 'BookMyShow',
    monetizationType: 'gallery',
    ctaButtonLabel: 'Book IMAX Seats on BMS',
    redirectTargetUrl: 'https://in.bookmyshow.com',
    status: 'Live',
    createdAt: Date.now() - 540000,
  },
];

// Subscribe to real-time updates from Firestore
export function subscribeToArticles(
  onData: (articles: ExtendedArticleData[]) => void,
  onError?: (err: Error) => void,
  mode: DatabaseMode = activeDatabaseMode,
) {
  if (mode === 'local') {
    let stopped = false;
    const load = async () => {
      try {
        const payload = await localDatabaseRequest<{
          items: Array<{ id: string; collection: ContentCollection; data: Record<string, any> }>;
        }>('/api/content?collections=' + CONTENT_COLLECTIONS.join(','));
        if (!stopped) {
          onData(payload.items.map((item) => normalizeReaderArticle(item.id, item.collection, item.data)));
        }
      } catch (error) {
        if (!stopped) onError?.(error instanceof Error ? error : new Error('Local database unavailable'));
      }
    };
    void load();
    const interval = window.setInterval(load, 2000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }

  const byCollection = new Map<ContentCollection, ExtendedArticleData[]>();
  const unsubscribe = CONTENT_COLLECTIONS.map((collectionName) => {
    const articlesRef = collection(db, collectionName);
    return onSnapshot(
      articlesRef,
      (snapshot) => {
        byCollection.set(
          collectionName,
          snapshot.docs.map((docSnap) =>
            normalizeReaderArticle(docSnap.id, collectionName, docSnap.data()),
          ),
        );
        const merged = Array.from(byCollection.values())
          .flat()
          .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
        onData(merged);
      },
      (error) => {
        console.warn(`Firestore ${collectionName} subscription error:`, error);
        onError?.(error);
      },
    );
  });

  return () => unsubscribe.forEach((stop) => stop());
}

export interface InteractionStats {
  totalVotes: number;
  optionVotes: Record<string, number>;
  totalWatched: number;
  totalRatings: number;
  ratingSum: number;
  averageRating: number;
  ratingCounts: Record<string, number>;
}

export function subscribeToInteractionStats(
  onData: (stats: Record<string, InteractionStats>) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, 'interaction_events'),
    (snapshot) => {
      const stats: Record<string, InteractionStats> = {};
      snapshot.docs.forEach((event) => {
        const data = event.data();
        const contentId = String(data.contentId || '');
        if (!contentId) return;
        const current = stats[contentId] || {
          totalVotes: 0,
          optionVotes: {},
          totalWatched: 0,
          totalRatings: 0,
          ratingSum: 0,
          averageRating: 0,
          ratingCounts: {},
        };
        if (data.action === 'vote') {
          const option = String(data.optionIndex ?? '0');
          current.totalVotes += 1;
          current.optionVotes[option] = (current.optionVotes[option] || 0) + 1;
        } else if (data.action === 'rating') {
          const rating = Number(data.rating || 0);
          if (rating >= 1 && rating <= 5) {
            current.totalRatings += 1;
            current.ratingSum += rating;
            const key = String(rating);
            current.ratingCounts[key] = (current.ratingCounts[key] || 0) + 1;
          }
        } else if (data.action === 'watched' && data.watched === true) {
          current.totalWatched += 1;
        }
        current.averageRating = current.totalRatings
          ? current.ratingSum / current.totalRatings
          : 0;
        stats[contentId] = current;
      });
      onData(stats);
    },
    (error) => onError?.(error),
  );
}

// Seed initial articles if collection is empty
export async function seedArticlesIfEmpty(): Promise<void> {
  return;
}

// Sanitize payloads to ensure Firestore never receives `undefined` values
export function sanitizeForFirestore<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Create new article in Firestore
export async function createArticleInFirestore(
  article: Omit<ExtendedArticleData, 'id'>
): Promise<string> {
  try {
    const collectionName = collectionForArticle(article);
    const articlesRef = collection(db, collectionName);
    const cleaned = sanitizeForFirestore({
      ...readerPayload(article, collectionName),
      createdAt: Date.now(),
      status: article.status || 'Live',
    });
    const docRef = await addDoc(articlesRef, cleaned);
    return docRef.id;
  } catch (err) {
    console.error('Error creating article in Firestore:', err);
    throw err;
  }
}

export async function publishArticle(article: Partial<ExtendedArticleData> & { id?: string; title: string }): Promise<string> {
  try {
    const collectionName = collectionForArticle(article);
    const articlesRef = collection(db, collectionName);
    const targetId = article.id || `story-${Date.now()}`;
    const data = readerPayload(article, collectionName);
    const cleaned = sanitizeForFirestore({
      ...data,
      createdAt: data.createdAt || Date.now(),
      status: data.status || 'Live',
    });
    if (activeDatabaseMode === 'local') {
      await localDatabaseRequest(`/api/content/${collectionName}/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify(cleaned),
      });
      return targetId;
    }
    await withFirestoreTimeout(
      setDoc(doc(articlesRef, targetId), cleaned, { merge: true }),
      'Publishing to Firestore timed out after 15 seconds',
    );
    return targetId;
  } catch (err) {
    console.error('Error publishing article to Firestore:', err);
    throw err;
  }
}

async function withFirestoreTimeout<T>(
  operation: Promise<T>,
  message: string,
  timeoutMs = FIRESTORE_WRITE_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

// Update existing article in Firestore
export async function updateArticleInFirestore(
  id: string,
  updates: Partial<ExtendedArticleData>
): Promise<void> {
  try {
    if (activeDatabaseMode === 'local') {
      const location = await findLocalArticleLocation(id);
      if (!location) throw new Error(`Article ${id} was not found`);
      const cleaned = sanitizeForFirestore({
        ...readerPayload({ ...location.data, ...updates, title: updates.title || location.data.title || '' }, location.collectionName),
        updatedAt: Date.now(),
      });
      await localDatabaseRequest(`/api/content/${location.collectionName}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...location.data, ...cleaned }),
      });
      return;
    }
    const location = await findArticleLocation(id);
    if (!location) throw new Error(`Article ${id} was not found`);
    const docRef = doc(db, location.collectionName, id);
    const cleaned = sanitizeForFirestore({
      ...readerPayload({ ...location.data, ...updates, title: updates.title || location.data.title || '' }, location.collectionName),
      updatedAt: Date.now(),
    });
    await updateDoc(docRef, cleaned);
  } catch (err) {
    console.error('Error updating article in Firestore:', err);
    throw err;
  }
}

export const updateArticle = updateArticleInFirestore;

// Delete article from Firestore
export async function deleteArticleFromFirestore(id: string): Promise<void> {
  try {
    if (activeDatabaseMode === 'local') {
      const location = await findLocalArticleLocation(id);
      if (!location) throw new Error(`Article ${id} was not found`);
      await localDatabaseRequest(`/api/content/${location.collectionName}/${id}`, { method: 'DELETE' });
      return;
    }
    const location = await findArticleLocation(id);
    if (!location) throw new Error(`Article ${id} was not found`);
    const docRef = doc(db, location.collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting article from Firestore:', err);
    throw err;
  }
}

async function findLocalArticleLocation(id: string): Promise<{
  collectionName: ContentCollection;
  data: Record<string, any>;
} | null> {
  const payload = await localDatabaseRequest<{
    items: Array<{ id: string; collection: ContentCollection; data: Record<string, any> }>;
  }>('/api/content?collections=' + CONTENT_COLLECTIONS.join(','));
  const found = payload.items.find((item) => item.id === id);
  return found ? { collectionName: found.collection, data: found.data } : null;
}

async function findArticleLocation(id: string): Promise<{
  collectionName: ContentCollection;
  data: Record<string, any>;
} | null> {
  const snapshots = await Promise.all(
    CONTENT_COLLECTIONS.map(async (collectionName) => ({
      collectionName,
      snapshot: await getDoc(doc(db, collectionName, id)),
    })),
  );
  const found = snapshots.find(({ snapshot }) => snapshot.exists());
  return found
    ? { collectionName: found.collectionName, data: found.snapshot.data() || {} }
    : null;
}

export const deleteArticle = deleteArticleFromFirestore;

// Vote on a poll option in Firestore
export async function votePollInFirestore(
  articleId: string,
  optionId: string
): Promise<void> {
  try {
    const location = await findArticleLocation(articleId);
    if (location) {
      const docRef = doc(db, location.collectionName, articleId);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      const existingOptions = data?.options || data?.pollOptions;
      if (existingOptions) {
        const updatedOptions = existingOptions.map((opt: any) => {
          if (opt.id === optionId) {
            return { ...opt, votes: (opt.votes || 0) + 1 };
          }
          return opt;
        });
        const totalVotes = updatedOptions.reduce((acc: number, curr: any) => acc + (curr.votes || 0), 0);
        await updateDoc(docRef, {
          options: updatedOptions,
          votes: totalVotes,
        });
      }
    }
  } catch (err) {
    console.error('Error voting in poll in Firestore:', err);
  }
}

// Subscribe to global app settings in Firestore
export function subscribeToAppSettings(
  onData: (settings: AppSettings) => void
) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onData({
          reelsEnabled: data.reelsEnabled === true,
          databaseMode: data.databaseMode === 'local' ? 'local' : 'firebase',
        });
      } else {
        // Default settings
        setDoc(docRef, {
          reelsEnabled: false,
          databaseMode: 'firebase',
          siteName: 'FlickPulse / MSTUDI',
        });
        onData({ reelsEnabled: false, databaseMode: 'firebase' });
      }
    });
  } catch (err) {
    console.warn('AppSettings subscribe error:', err);
    onData({ reelsEnabled: false, databaseMode: 'firebase' });
    return () => {};
  }
}

// Submit text answer to an Ask Readers card in Firestore
export async function submitReaderAnswerToFirestore(
  articleId: string,
  answerText: string,
  userName: string = 'Verified Reader'
): Promise<void> {
  try {
    const location = await findArticleLocation(articleId);
    if (location) {
      const docRef = doc(db, location.collectionName, articleId);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();
      const existingAnswers: ReaderAnswerItem[] = data.readerAnswers || [];
      const newAnswer: ReaderAnswerItem = {
        id: `ans-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        user: userName,
        text: answerText.trim(),
        date: 'Just now',
        timestamp: Date.now(),
      };
      await updateDoc(docRef, {
        readerAnswers: [newAnswer, ...existingAnswers],
        userResponsesCount: (data.userResponsesCount || existingAnswers.length) + 1,
      });
    }
  } catch (err) {
    console.error('Error submitting reader answer in Firestore:', err);
    throw err;
  }
}

export async function toggleReelsInFirestore(enabled: boolean): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global');
    await setDoc(docRef, { reelsEnabled: enabled, siteName: 'FlickPulse / MSTUDI' }, { merge: true });
  } catch (err) {
    console.error('Error toggling reels setting in Firestore:', err);
  }
}

export async function setDatabaseModeInFirestore(mode: DatabaseMode): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global');
    await setDoc(docRef, { databaseMode: mode }, { merge: true });
  } catch (err) {
    console.error('Error changing database mode in Firestore:', err);
    throw err;
  }
}

// Submit user movie review / feedback to Firestore
export async function submitMovieReviewToFirestore(
  articleId: string,
  review: {
    author?: string;
    comment: string;
    rating?: number;
    likes?: number;
    dislikes?: number;
  }
): Promise<MovieFeedbackItem> {
  try {
    const location = await findArticleLocation(articleId);
    const docRef = location ? doc(db, location.collectionName, articleId) : null;
    const docSnap = docRef ? await getDoc(docRef) : null;
    const newFeedback: MovieFeedbackItem = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      author: review.author || 'Verified Viewer',
      comment: review.comment.trim(),
      rating: review.rating || 9,
      date: 'Just now',
      likes: review.likes || 1,
      dislikes: review.dislikes || 0,
      timestamp: Date.now(),
    };

    if (docSnap?.exists() && docRef) {
      const data = docSnap.data();
      const existingReviews: MovieFeedbackItem[] = data.audienceReviews || [];
      const totalRatingsCount = (Number(data.audienceRatingsCount) || 14200) + 1;
      
      // Calculate updated rating if user provided rating
      let updatedRating = data.rating;
      let updatedStarRating = data.starRating;
      if (review.rating) {
        const currentAvg = Number(data.starRating || (typeof data.rating === 'string' && parseFloat(data.rating)) || 8.6);
        const newAvg = (((currentAvg * (totalRatingsCount - 1)) + review.rating) / totalRatingsCount).toFixed(1);
        updatedRating = newAvg;
        updatedStarRating = parseFloat(newAvg);
      }

      await updateDoc(docRef, {
        audienceReviews: [newFeedback, ...existingReviews],
        audienceRatingsCount: totalRatingsCount,
        rating: updatedRating,
        starRating: updatedStarRating,
        updatedAt: Date.now(),
      });
    }

    return newFeedback;
  } catch (err) {
    console.error('Error submitting movie review to Firestore:', err);
    return {
      id: `rev-${Date.now()}`,
      author: review.author || 'Verified Viewer',
      comment: review.comment.trim(),
      rating: review.rating || 9,
      date: 'Just now',
      likes: 1,
      dislikes: 0,
      timestamp: Date.now(),
    };
  }
}

// Rate a movie directly (10-star scale) in Firestore
export async function rateMovieInFirestore(
  articleId: string,
  userScore: number
): Promise<{ newRating: string; totalVotes: number }> {
  try {
    const location = await findArticleLocation(articleId);
    const docRef = location ? doc(db, location.collectionName, articleId) : null;
    const docSnap = docRef ? await getDoc(docRef) : null;
    if (docSnap?.exists() && docRef) {
      const data = docSnap.data();
      const currentCount = Number(data.audienceRatingsCount) || 14280;
      const currentRating = Number(data.starRating || (typeof data.rating === 'string' && parseFloat(data.rating)) || 8.6);
      const nextCount = currentCount + 1;
      const nextAvg = (((currentRating * currentCount) + userScore) / nextCount).toFixed(1);

      await updateDoc(docRef, {
        rating: nextAvg,
        starRating: parseFloat(nextAvg),
        audienceRatingsCount: nextCount,
        updatedAt: Date.now(),
      });

      return { newRating: nextAvg, totalVotes: nextCount };
    }
    return { newRating: userScore.toFixed(1), totalVotes: 14281 };
  } catch (err) {
    console.warn('Could not update movie rating in Firestore, fallback local:', err);
    return { newRating: userScore.toFixed(1), totalVotes: 14281 };
  }
}
