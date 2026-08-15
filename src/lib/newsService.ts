import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
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
  totalVotes?: number;
  question?: string;
  userResponsesCount?: number;
  cardThemeColor?: string;
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
}

const ARTICLES_COLLECTION = 'articles';
const SETTINGS_COLLECTION = 'app_settings';

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
  onError?: (err: Error) => void
) {
  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const q = query(articlesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed if database is empty
          seedArticlesIfEmpty().then(() => {
            // Re-query handled by onSnapshot
          });
          onData(INITIAL_SEED_ARTICLES);
          return;
        }

        const list: ExtendedArticleData[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
          } as ExtendedArticleData;
        });

        onData(list);
      },
      (error) => {
        console.warn('Firestore onSnapshot error, falling back to seed:', error);
        if (onError) onError(error);
        onData(INITIAL_SEED_ARTICLES);
      }
    );
  } catch (err: any) {
    console.error('subscribeToArticles error:', err);
    if (onError) onError(err);
    onData(INITIAL_SEED_ARTICLES);
    return () => {};
  }
}

// Seed initial articles if collection is empty
export async function seedArticlesIfEmpty(): Promise<void> {
  try {
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const snapshot = await getDocs(articlesRef);
    if (snapshot.empty) {
      for (const article of INITIAL_SEED_ARTICLES) {
        const { id, ...articleWithoutId } = article;
        await setDoc(doc(articlesRef, id), {
          ...articleWithoutId,
          createdAt: article.createdAt || Date.now(),
        });
      }
      console.log('Firebase Firestore successfully seeded with initial feed items!');
    }
  } catch (err) {
    console.warn('Failed to seed articles in Firestore:', err);
  }
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
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const cleaned = sanitizeForFirestore({
      ...article,
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
    const articlesRef = collection(db, ARTICLES_COLLECTION);
    const targetId = article.id || `story-${Date.now()}`;
    const { id, ...data } = article;
    const cleaned = sanitizeForFirestore({
      ...data,
      id: targetId,
      createdAt: data.createdAt || Date.now(),
      status: data.status || 'Live',
    });
    await setDoc(doc(articlesRef, targetId), cleaned, { merge: true });
    return targetId;
  } catch (err) {
    console.error('Error publishing article to Firestore:', err);
    throw err;
  }
}

// Update existing article in Firestore
export async function updateArticleInFirestore(
  id: string,
  updates: Partial<ExtendedArticleData>
): Promise<void> {
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    const cleaned = sanitizeForFirestore({
      ...updates,
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
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting article from Firestore:', err);
    throw err;
  }
}

export const deleteArticle = deleteArticleFromFirestore;

// Vote on a poll option in Firestore
export async function votePollInFirestore(
  articleId: string,
  optionId: string
): Promise<void> {
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.pollOptions) {
        const updatedOptions = data.pollOptions.map((opt: any) => {
          if (opt.id === optionId) {
            return { ...opt, votes: (opt.votes || 0) + 1 };
          }
          return opt;
        });
        const totalVotes = updatedOptions.reduce((acc: number, curr: any) => acc + (curr.votes || 0), 0);
        await updateDoc(docRef, {
          pollOptions: updatedOptions,
          totalVotes,
        });
      }
    }
  } catch (err) {
    console.error('Error voting in poll in Firestore:', err);
  }
}

// Subscribe to global app settings in Firestore
export function subscribeToAppSettings(
  onData: (settings: { reelsEnabled: boolean }) => void
) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as { reelsEnabled: boolean });
      } else {
        // Default settings
        setDoc(docRef, { reelsEnabled: false, siteName: 'FlickPulse / MSTUDI' });
        onData({ reelsEnabled: false });
      }
    });
  } catch (err) {
    console.warn('AppSettings subscribe error:', err);
    onData({ reelsEnabled: false });
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
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
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
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    const docSnap = await getDoc(docRef);
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

    if (docSnap.exists()) {
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
    const docRef = doc(db, ARTICLES_COLLECTION, articleId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
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
