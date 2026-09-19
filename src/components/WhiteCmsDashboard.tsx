import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  LayoutGrid,
  FileText,
  Database,
  Layers,
  Settings as SettingsIcon,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  HelpCircle,
  Film,
  Image as ImageIcon,
  Check,
  X,
  Radio,
  Bookmark,
  Share2,
  Heart,
  Flame,
  ArrowUpRight,
  Filter,
  BarChart3,
  MessageSquare,
  Star,
  Sliders,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  Users,
  Copy,
  ChevronDown,
  ChevronUp,
  Globe,
  ShieldCheck,
  AlertCircle,
  Maximize2,
  Minimize2,
  Upload,
  Video,
  Youtube,
  Bell,
  BellOff,
  ShieldAlert,
  Zap,
  Hash,
  RotateCcw,
  FileCheck,
  Megaphone,
  BadgePercent,
  ExternalLink,
  Wallet,
  GripVertical,
  Lock,
  Unlock,
  Shield,
  UserCheck,
  Move,
  ArrowUpDown
} from 'lucide-react';
import { LiveMobileEmulator } from './LiveMobileEmulator';
import { CrawlingSection, QueueItem } from './CrawlingSection';
import { auth } from '../lib/firebase';
import {
  ExtendedArticleData,
  subscribeToArticles,
  publishArticle,
  updateArticleInFirestore,
  deleteArticleFromFirestore,
  votePollInFirestore,
  submitReaderAnswerToFirestore,
  uploadVideoFile,
  uploadImageDataUrl,
  uploadImageDataUrls,
  ReaderAnswerItem,
  subscribeToInteractionStats,
  InteractionStats,
  subscribeToAppSettings,
  setDatabaseModeInFirestore,
  DatabaseMode,
  setActiveDatabaseMode,
  migrateFirebaseToLocalDatabase,
  setLocalDatabaseMode,
} from '../lib/newsService';

interface WhiteCmsDashboardProps {
  onOpenMobileReader: () => void;
  onSelectArticleForReader?: (articleId: string) => void;
}

export type NavSection = 'overview' | 'article_creator' | 'crawling' | 'drafts' | 'monetization' | 'data_hub' | 'article_manager' | 'settings';
export type ArticleFormatTab = 'standard' | 'poll' | 'gallery' | 'full_gallery' | 'ask_reader' | 'movie_review';
export type DataHubSubTab = 'polls' | 'ratings' | 'ask_readers';

export interface NavMenuItem {
  id: NavSection;
  label: string;
  badge?: string;
  iconName: 'LayoutDashboard' | 'FileText' | 'Globe' | 'Megaphone' | 'Database' | 'Layers' | 'Settings';
  description: string;
}

export const DEFAULT_MENU_ITEMS: NavMenuItem[] = [
  { id: 'overview', label: 'Overview', iconName: 'LayoutDashboard', description: 'Editorial overview & traffic metrics' },
  { id: 'article_creator', label: 'Create / Edit Article', iconName: 'FileText', description: 'Interactive story editor' },
    { id: 'crawling', label: 'Crawling & Writer Queue', iconName: 'Globe', description: 'Portal sources and fact-check queue' },
    { id: 'drafts', label: 'Drafts', iconName: 'FileText', description: 'Claimed writer drafts' },
  { id: 'monetization', label: 'Sponsored Content', iconName: 'Megaphone', badge: 'New', description: 'Brand stories, links & campaigns' },
  { id: 'data_hub', label: 'Data Hub', iconName: 'Database', description: 'Reader polls & answers' },
  { id: 'article_manager', label: 'Article Manager', iconName: 'Layers', description: 'Content list & filters' },
  { id: 'settings', label: 'Settings', iconName: 'Settings', description: 'System configuration' },
];

const DEFAULT_CATEGORIES = [
  'Hot News',
  'Developing',
  'Breaking',
  'Trending',
  'Movies & TV Shows',
  'Mollywood',
  'Box Office',
  'Celebrity & Pop Culture',
  'Fan Opinion',
  'Movie Reviews',
  'Trailers & Teasers'
];

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function generateStoryId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `#${rand}`;
}

const createDefaultPollOptions = () => [
  { id: '1', text: '', votes: 0, isCorrect: false },
  { id: '2', text: '', votes: 0, isCorrect: false },
];

const DATABASE_SWITCH_PASSWORD = (import.meta.env.VITE_DATABASE_SWITCH_PASSWORD as string | undefined) || 'uproll-admin';

export function WhiteCmsDashboard({ onOpenMobileReader, onSelectArticleForReader }: WhiteCmsDashboardProps) {
  // User Role & Permissions State (Admin vs Editor)
  const [userRole, setUserRole] = useState<'admin' | 'editor'>(() => {
    try {
      return (localStorage.getItem('uproll_cms_user_role') as 'admin' | 'editor') || 'admin';
    } catch (e) {
      return 'admin';
    }
  });

  // Navigation Sidemenu Item Order State (Persisted in localStorage)
  const [menuItems, setMenuItems] = useState<NavMenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('uproll_cms_menu_order');
      if (saved) {
        const orderIds: NavSection[] = JSON.parse(saved);
        const ordered: NavMenuItem[] = [];
        orderIds.forEach((id) => {
          const item = DEFAULT_MENU_ITEMS.find((m) => m.id === id);
          if (item) ordered.push(item);
        });
        DEFAULT_MENU_ITEMS.forEach((item) => {
          if (!ordered.some((o) => o.id === item.id)) ordered.push(item);
        });
        if (ordered.length === DEFAULT_MENU_ITEMS.length) return ordered;
      }
    } catch (e) {
      // Ignore JSON error
    }
    return DEFAULT_MENU_ITEMS;
  });

  // Drag & Drop States for Sidemenu Reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Navigation State
  const [activeSection, setActiveSection] = useState<NavSection>('article_creator');
  const [articleFormatTab, setArticleFormatTab] = useState<ArticleFormatTab>('standard');
  const [dataHubTab, setDataHubTab] = useState<DataHubSubTab>('polls');

  // Firestore Data State
  const [articles, setArticles] = useState<ExtendedArticleData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [interactionStats, setInteractionStats] = useState<Record<string, InteractionStats>>({});

  // Article Manager filters & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Live' | 'Draft'>('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');

  // Form State for Article Creator / Editor
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formStoryId, setFormStoryId] = useState<string>(() => generateStoryId());
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Hot News');
  const [formSummary, setFormSummary] = useState<string>('');
  const [formFullContent, setFormFullContent] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState<string>('UPROLL Editorial Desk');
  const [formStatus, setFormStatus] = useState<'Live' | 'Draft'>('Live');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formAttachedToStoryId, setFormAttachedToStoryId] = useState<string>('');

  // Media Section state: Raw Image, Raw Video, YouTube Link, Preset
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'youtube'>('image');
  const [formFeatureImage, setFormFeatureImage] = useState<string>('');
  const [isImageProcessing, setIsImageProcessing] = useState<boolean>(false);
  const [rawImageFile, setRawImageFile] = useState<File | null>(null);
  const [rawVideoFile, setRawVideoFile] = useState<File | null>(null);
  const [rawVideoUrl, setRawVideoUrl] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');

  // CRITICAL: Push Notification Safety - MUST BE FALSE/DISABLED BY DEFAULT
  const [formSendPush, setFormSendPush] = useState<boolean>(false);

  const fileImageInputRef = useRef<HTMLInputElement>(null);
  const fileVideoInputRef = useRef<HTMLInputElement>(null);

  // Specific format fields
  // Poll / Quiz
  const [pollOptions, setPollOptions] = useState<Array<{ id: string; text: string; votes?: number; isCorrect?: boolean }>>(createDefaultPollOptions);
  const [quizExplanation, setQuizExplanation] = useState<string>('');

  // Gallery
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [photoCredit, setPhotoCredit] = useState<string>('');
  const [formHeaderOverlay, setFormHeaderOverlay] = useState<boolean>(true);

  // Ask Reader
  const [askReaderPrompt, setAskReaderPrompt] = useState<string>('What is your verdict on this topic?');
  const [allowOpenResponses, setAllowOpenResponses] = useState<boolean>(true);

  // Movie Review Specs
  const [movieDirector, setMovieDirector] = useState<string>('');
  const [movieCast, setMovieCast] = useState<string>('');
  const [movieCastMembers, setMovieCastMembers] = useState<Array<{ name: string; characterName: string; imageUrl: string }>>([]);
  const [movieSynopsis, setMovieSynopsis] = useState<string>('');
  const [movieGenres, setMovieGenres] = useState<string[]>(['', '', '', '']);
  const [movieReleaseDate, setMovieReleaseDate] = useState<string>('');
  const [movieReleaseStatus, setMovieReleaseStatus] = useState<'Released' | 'Not yet released'>('Released');
  const [movieCountry, setMovieCountry] = useState<string>('India');
  const [movieLanguage, setMovieLanguage] = useState<string[]>(['Malayalam']);
  const [movieProductionCompany, setMovieProductionCompany] = useState<string>('');
  const [movieRelatedImages, setMovieRelatedImages] = useState<string[]>([]);
  const [movieRelatedImageLink, setMovieRelatedImageLink] = useState<string>('');
  const [movieMusicDirector, setMovieMusicDirector] = useState<string>('');
  const [movieCinematography, setMovieCinematography] = useState<string>('');
  const [movieRuntime, setMovieRuntime] = useState<string>('');
  const [movieYear, setMovieYear] = useState<string>('');
  const [movieCertificate, setMovieCertificate] = useState<string>('');
  const [movieVerdict, setMovieVerdict] = useState<string>('');
  const [movieStarRating, setMovieStarRating] = useState<string>('');
  const [moviePros, setMoviePros] = useState<string>('');
  const [movieCons, setMovieCons] = useState<string>('');

  // Settings State - Synced with LocalStorage
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCatInput, setNewCatInput] = useState<string>('');
  const [appName, setAppName] = useState<string>('UPROLL Short-News');
  const [targetWordCount, setTargetWordCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('uproll_target_word_count');
      return saved ? Number(saved) : 43;
    } catch {
      return 43;
    }
  });
  const [defaultAuthor, setDefaultAuthor] = useState<string>('UPROLL Editorial Desk');
  const [databaseMode, setDatabaseMode] = useState<DatabaseMode>('firebase');
  const [isDatabaseModeSaving, setIsDatabaseModeSaving] = useState<boolean>(false);
  const [showDatabasePasswordModal, setShowDatabasePasswordModal] = useState<boolean>(false);
  const [pendingDatabaseMode, setPendingDatabaseMode] = useState<DatabaseMode | null>(null);
  const [databaseModePassword, setDatabaseModePassword] = useState<string>('');
  const [databaseModePasswordError, setDatabaseModePasswordError] = useState<string>('');

  const [directSponsors, setDirectSponsors] = useState<Array<{
    id: string;
    brand: string;
    headline: string;
    ctaText: string;
    ctaUrl: string;
    imageUrl: string;
    impressions: number;
    clicks: number;
    active: boolean;
    tag: string;
  }>>([]);
  const [newSponsorBrand, setNewSponsorBrand] = useState<string>('');
  const [newSponsorHeadline, setNewSponsorHeadline] = useState<string>('');
  const [newSponsorCtaText, setNewSponsorCtaText] = useState<string>('');
  const [newSponsorCtaUrl, setNewSponsorCtaUrl] = useState<string>('');
  const [newSponsorImage, setNewSponsorImage] = useState<string>('');

  // Monetization Article Creator State (Full Gallery, Standard Story, Gallery Carousel)
  const [monetizeFormatTab, setMonetizeFormatTab] = useState<'full_gallery' | 'standard' | 'gallery'>('full_gallery');
  const [monetizeBrand, setMonetizeBrand] = useState<string>('');
  const [monetizeHeadline, setMonetizeHeadline] = useState<string>('');
  const [monetizeCategory, setMonetizeCategory] = useState<string>('');
  const [monetizeSummary, setMonetizeSummary] = useState<string>('');
  const [monetizeFullContent, setMonetizeFullContent] = useState<string>('');
  const [monetizeCtaLabel, setMonetizeCtaLabel] = useState<string>('');
  const [monetizeLandingUrl, setMonetizeLandingUrl] = useState<string>('');
  const [monetizeFeatureImage, setMonetizeFeatureImage] = useState<string>('');
  const [monetizeGalleryImages, setMonetizeGalleryImages] = useState<string[]>([]);
  const [monetizeSendPush, setMonetizeSendPush] = useState<boolean>(false);
  const [monetizeIsSaving, setMonetizeIsSaving] = useState<boolean>(false);
  const [editingMonetizeArticleId, setEditingMonetizeArticleId] = useState<string | null>(null);
  const [monetizeRawImageFile, setMonetizeRawImageFile] = useState<File | null>(null);
  const monetizeRawImageInputRef = useRef<HTMLInputElement>(null);
  const monetizeGalleryMultipleInputRef = useRef<HTMLInputElement>(null);

  // Handle Raw Image File Upload for Monetization Standard Story
  const handleMonetizeRawImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMonetizeRawImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMonetizeFeatureImage(event.target.result as string);
          showToast(`Raw image loaded: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Multi-image upload for Monetization Gallery (Enforce hard limit of max 10 images)
  const handleMonetizeMultipleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = Math.max(0, 10 - monetizeGalleryImages.length);
      if (remainingSlots <= 0) {
        showToast('Maximum 10 images limit reached');
        return;
      }
      const fileList: File[] = (Array.from(files) as File[]).slice(0, remainingSlots);
      const readers = fileList.map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve(event.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then((newUrls) => {
        setMonetizeGalleryImages((prev) => [...prev, ...newUrls].slice(0, 10));
        showToast(`Added ${newUrls.length} photo(s) to Monetization Gallery (Max 10)`);
      });
    }
  };

  const handlePublishMonetizedArticle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!monetizeBrand.trim()) {
      showToast('Please enter sponsor / partner brand name');
      return;
    }
    if (monetizeFormatTab !== 'full_gallery' && !monetizeHeadline.trim()) {
      showToast('Please enter article headline');
      return;
    }
    if (!monetizeLandingUrl.trim()) {
      showToast('Please provide brand destination back-link URL');
      return;
    }

    setMonetizeIsSaving(true);
    try {
      const generatedId = editingMonetizeArticleId || `monetize-${Date.now()}`;
      const effectiveStoryId = `#${Math.floor(1000 + Math.random() * 9000)}`;

      let articleType: 'full_gallery' | 'news' | 'gallery' = 'news';
      let monetizationTypeVal: 'full_image' | 'standard' | 'gallery' = 'standard';
      let validGallery: string[] = [];

      if (monetizeFormatTab === 'full_gallery') {
        articleType = 'full_gallery';
        monetizationTypeVal = 'full_image';
        validGallery = (monetizeGalleryImages.length > 0 ? monetizeGalleryImages : [monetizeFeatureImage]).slice(0, 10);
      } else if (monetizeFormatTab === 'gallery') {
        articleType = 'gallery';
        monetizationTypeVal = 'gallery';
        validGallery = (monetizeGalleryImages.length > 0 ? monetizeGalleryImages : [monetizeFeatureImage]).slice(0, 10);
      } else {
        articleType = 'news';
        monetizationTypeVal = 'standard';
      }

      const effectiveTitle = monetizeHeadline.trim() || `${monetizeBrand.trim()} Lookbook Collection`;

      const payload: Partial<ExtendedArticleData> & { id: string; title: string } = {
        id: generatedId,
        storyId: effectiveStoryId,
        title: effectiveTitle,
        category: monetizeCategory,
        summary: monetizeFormatTab === 'full_gallery' ? '' : (monetizeSummary.trim() || `${effectiveTitle} - Sponsored by ${monetizeBrand}`),
        fullContent: monetizeFormatTab === 'full_gallery' || monetizeFormatTab === 'gallery' ? '' : (monetizeFullContent.trim() || monetizeSummary.trim()),
        featureImage: monetizeFormatTab === 'full_gallery' && validGallery.length > 0 ? validGallery[0] : monetizeFeatureImage,
        galleryImages: validGallery.length > 0 ? validGallery : undefined,
        type: articleType,
        author: `${monetizeBrand} Brand Desk`,
        status: 'Live',
        isPinned: false,
        isSponsored: true,
        sponsorName: monetizeBrand.trim(),
        ctaButtonLabel: monetizeCtaLabel.trim() || 'Visit Brand Page',
        redirectTargetUrl: monetizeLandingUrl.trim(),
        monetizationType: monetizationTypeVal,
        pushSent: monetizeSendPush,
        date: 'Just now',
        createdAt: Date.now(),
        rating: 'Brand Sponsored',
        genres: [monetizeCategory, 'Monetization', monetizeBrand],
      };

      if (monetizeSendPush) {
        payload.pushSentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      // Optimistic UI state update
      setArticles((prev) => {
        const exists = prev.some((a) => a.id === generatedId);
        if (exists) {
          return prev.map((a) => (a.id === generatedId ? { ...a, ...payload } : a));
        }
        return [{ ...payload, id: generatedId } as ExtendedArticleData, ...prev];
      });

      // Save to Firestore
      if (editingMonetizeArticleId) {
        await updateArticleInFirestore(generatedId, payload);
        showToast(`Updated "${monetizeHeadline.slice(0, 25)}..." in ${databaseMode === 'local' ? 'local database' : 'Firebase'}`);
      } else {
        await publishArticle(payload);
        showToast(`Published sponsored ${monetizeFormatTab === 'full_gallery' ? 'Full Image Gallery' : monetizeFormatTab === 'gallery' ? 'Gallery Slider' : 'Standard Story'} with landing back-link!`);
      }

      setEditingMonetizeArticleId(null);
    } catch (err) {
      console.error('Error publishing monetized article:', err);
      showToast(`Publish failed: ${err instanceof Error ? err.message : `${databaseMode === 'local' ? 'Local database' : 'Firebase'} request failed`}`);
    } finally {
      setMonetizeIsSaving(false);
    }
  };

  const handleEditMonetizedArticle = (art: ExtendedArticleData) => {
    setEditingMonetizeArticleId(art.id);
    setMonetizeRawImageFile(null);
    setMonetizeBrand(art.sponsorName || 'Partner Brand');
    setMonetizeHeadline(art.title);
    setMonetizeCategory(art.category || 'Brand Spotlight');
    setMonetizeSummary(art.summary || '');
    setMonetizeFullContent(art.fullContent || art.summary || '');
    setMonetizeCtaLabel(art.ctaButtonLabel || 'Visit Brand Website');
    setMonetizeLandingUrl(art.redirectTargetUrl || 'https://');
    if (art.featureImage) setMonetizeFeatureImage(art.featureImage);
    if (art.galleryImages && art.galleryImages.length > 0) {
      setMonetizeGalleryImages(art.galleryImages);
    }

    if (art.type === 'full_gallery' || art.monetizationType === 'full_image') {
      setMonetizeFormatTab('full_gallery');
    } else if (art.type === 'gallery' || art.monetizationType === 'gallery') {
      setMonetizeFormatTab('gallery');
    } else {
      setMonetizeFormatTab('standard');
    }

    showToast(`Loaded "${art.title.slice(0, 28)}..." into Monetization Studio`);
  };

  const handleResetMonetizeForm = () => {
    setEditingMonetizeArticleId(null);
    setMonetizeRawImageFile(null);
    setMonetizeBrand('');
    setMonetizeHeadline('');
    setMonetizeCategory('');
    setMonetizeSummary('');
    setMonetizeFullContent('');
    setMonetizeCtaLabel('');
    setMonetizeLandingUrl('');
    setMonetizeFeatureImage('');
    setMonetizeGalleryImages([]);
    setMonetizeSendPush(false);
    showToast('Cleared Monetization Creator form');
  };

  const updateTargetWordCount = (val: number) => {
    const normalized = Math.max(20, Math.min(300, Number(val) || 60));
    setTargetWordCount(normalized);
    try {
      localStorage.setItem('uproll_target_word_count', String(normalized));
    } catch {}
  };

  const galleryMultipleInputRef = useRef<HTMLInputElement>(null);

  // Multi-image upload for gallery (Enforce hard limit of max 10 images)
  const handleMultipleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = Math.max(0, 10 - galleryImages.length);
      if (remainingSlots <= 0) {
        showToast('Maximum 10 images limit reached');
        return;
      }
      const fileList: File[] = (Array.from(files) as File[]).slice(0, remainingSlots);
      const readers = fileList.map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve(event.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then((newUrls) => {
        setGalleryImages((prev) => [...prev, ...newUrls].slice(0, 10));
        showToast(`Added ${newUrls.length} photo(s) to gallery (Max 10)`);
      });
    }
  };

  const handleMovieRelatedImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const remainingSlots = Math.max(0, 10 - movieRelatedImages.length);
    const fileList = (Array.from(files) as File[]).slice(0, remainingSlots);
    const readers = fileList.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then((newUrls) => {
      setMovieRelatedImages((prev) => [...prev, ...newUrls].filter(Boolean).slice(0, 10));
      showToast(`Added ${newUrls.length} related image(s) (Max 10)`);
    });
  };

  const handleMovieCastImageUpload = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMovieCastMembers((prev) =>
        prev.map((member, memberIndex) =>
          memberIndex === index
            ? { ...member, imageUrl: String(reader.result || '') }
            : member,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const addMovieRelatedImageLink = () => {
    const link = movieRelatedImageLink.trim();
    if (!link || movieRelatedImages.length >= 10) return;
    setMovieRelatedImages((prev) => [...prev, link].slice(0, 10));
    setMovieRelatedImageLink('');
  };

  // Answer Submission simulator for Data Hub
  const [simulatedAnswer, setSimulatedAnswer] = useState<string>('');
  const [selectedAskArticleId, setSelectedAskArticleId] = useState<string>('');

  // Fullscreen State
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToInteractionStats(
      setInteractionStats,
      (error) => console.warn('Interaction data subscription error:', error),
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time articles
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToArticles((data) => {
      setArticles(data);
      setIsLoading(false);
    }, (error) => showToast(`Content sync failed: ${error.message}`), databaseMode);
    return () => unsubscribe();
  }, [databaseMode]);

  useEffect(() => {
    const unsubscribe = subscribeToAppSettings((settings) => {
      setDatabaseMode(settings.databaseMode);
      setActiveDatabaseMode(settings.databaseMode);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDatabaseModeChange = async (mode: DatabaseMode) => {
    if (mode === databaseMode || isDatabaseModeSaving || userRole !== 'admin') return;
    const previousMode = databaseMode;
    setDatabaseMode(mode);
    setIsDatabaseModeSaving(true);
    try {
      const migrated = mode === 'local' ? await migrateFirebaseToLocalDatabase() : 0;
      await setDatabaseModeInFirestore(mode);
      await setLocalDatabaseMode(mode);
      setActiveDatabaseMode(mode);
      showToast(mode === 'local'
        ? `Local database active. Mirrored ${migrated} Firebase record(s).`
        : 'Firebase database active.');
    } catch {
      setDatabaseMode(previousMode);
      showToast('Could not save the database mode. Firebase remains active.');
    } finally {
      setIsDatabaseModeSaving(false);
    }
  };

  const requestDatabaseModeChange = (mode: DatabaseMode) => {
    if (mode === databaseMode || isDatabaseModeSaving || userRole !== 'admin') return;
    setPendingDatabaseMode(mode);
    setDatabaseModePassword('');
    setDatabaseModePasswordError('');
    setShowDatabasePasswordModal(true);
  };

  const confirmDatabaseModeChange = async () => {
    if (!pendingDatabaseMode) return;

    const enteredPassword = databaseModePassword.trim();
    if (enteredPassword !== DATABASE_SWITCH_PASSWORD) {
      setDatabaseModePasswordError('Authentication password is incorrect.');
      return;
    }

    setShowDatabasePasswordModal(false);
    setDatabaseModePassword('');
    setDatabaseModePasswordError('');
    await handleDatabaseModeChange(pendingDatabaseMode);
    setPendingDatabaseMode(null);
  };

  // Dynamic Word and Char calculations reflecting standard target (190 chars • 26 words)
  const rawWords = formSummary.trim().split(/\s+/).filter(Boolean);
  const wordCount = rawWords.length;
  const charCount = formSummary.length;
  const bodyLineCount = formSummary
    ? formSummary.split(/\r?\n/).length
    : 0;
  const bodyHasTooManyLines = bodyLineCount > 11;
  const targetChars = 190;
  const targetWords = 26;
  const isOptimalRange = (charCount >= 140 && charCount <= 190) || (wordCount >= 20 && wordCount <= 28);
  const maxWords = targetWordCount || 26;
  const wordPercentage = Math.min(100, Math.round((wordCount / maxWords) * 100));

  const compressFeaturedImage = async (dataUrl: string): Promise<string> => {
    const image = new Image();
    image.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to read image'));
    });
    const scale = Math.min(1, 800 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.55);
  };

  // Handle Raw Image File Upload
  const handleRawImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawImageFile(file);
      setMediaType('image');
      setIsImageProcessing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (event.target?.result) {
            const compressedImage = await compressFeaturedImage(
              event.target.result as string,
            );
            setFormFeatureImage(compressedImage);
            showToast(`Image loaded: ${file.name}`);
          }
        } finally {
          setIsImageProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Raw Video File Upload
  const handleRawVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawVideoFile(file);
      setMediaType('video');
      const objectUrl = URL.createObjectURL(file);
      setRawVideoUrl(objectUrl);
      showToast(`Video loaded: ${file.name}`);
    }
  };

  // Extract YouTube ID
  const youtubeId = extractYouTubeId(youtubeUrl);

  // Load article into creator form for editing
  const handleEditArticle = (art: ExtendedArticleData) => {
    setEditingArticleId(art.id);
    setFormStoryId(art.storyId || art.id || generateStoryId());
    setFormTitle(art.title || '');
    setFormCategory(art.category || 'Hot News');
    setFormSummary(art.summary || '');
    setFormFullContent(art.fullContent || '');
    setFormFeatureImage(art.featureImage || '');
    setFormAuthor(art.author || 'UPROLL Editorial Desk');
    setFormStatus(art.status === 'Draft' ? 'Draft' : 'Live');
    setFormIsPinned(art.isPinned || false);
    setFormAttachedToStoryId(art.attachedToStoryId || '');
    // Push notification is always false/disabled by default even when editing
    setFormSendPush(false);

    if (art.redirectTargetUrl?.includes('youtube') || art.redirectTargetUrl?.includes('youtu.be')) {
      setMediaType('youtube');
      setYoutubeUrl(art.redirectTargetUrl);
    } else {
      setMediaType('image');
    }

    // Set matching format tab
    if (art.type === 'full_gallery') {
      setArticleFormatTab('full_gallery');
      if (art.galleryImages && art.galleryImages.length > 0) {
        setGalleryImages(art.galleryImages.slice(0, 10));
      }
    } else if (art.type === 'gallery') {
      setArticleFormatTab('gallery');
      setFormHeaderOverlay(art.headerOverlay !== false);
      if (art.galleryImages && art.galleryImages.length > 0) {
        setGalleryImages(art.galleryImages.slice(0, 10));
      }
    } else if (art.type === 'poll' || art.type === 'quiz') {
      setArticleFormatTab('poll');
      setPollOptions(
        (art.choiceOptions || []).map((option: any, index: number) => ({
          id: String(option.id || index + 1),
          text: typeof option === 'string' ? option : option.text || option.label || '',
          votes: typeof option === 'object' ? option.votes || 0 : 0,
          isCorrect: art.type === 'quiz' && option.isCorrect === true,
        })),
      );
    } else if (art.type === 'movie' || (art.type as string) === 'movie_review') {
      setArticleFormatTab('movie_review');
      setMovieDirector(art.director || '');
      setMovieCast(art.cast || '');
      setMovieCastMembers(
        (art.castMembers && art.castMembers.length > 0
          ? art.castMembers
          : (art.cast || '').split(',').filter(Boolean).map((name) => ({ name, imageUrl: '' })))
          .slice(0, 15).map((member) => ({
          name: member.name || '',
          characterName: member.characterName || '',
          imageUrl: member.imageUrl || '',
        })),
      );
      setMovieSynopsis(art.synopsis || art.summary || '');
      setMovieGenres([...(art.genres || []), '', '', '', ''].slice(0, 4));
      setMovieReleaseDate(art.releaseDate || '');
      setMovieReleaseStatus(art.releaseStatus || 'Released');
      setMovieCountry(art.country || 'India');
      setMovieLanguage(Array.isArray(art.language) ? art.language : [art.language || 'Malayalam']);
      setMovieProductionCompany(art.productionCompany || '');
      setMovieRelatedImages((art.relatedImages || art.galleryImages || []).slice(0, 10));
      setMovieRelatedImageLink('');
      setMovieMusicDirector(art.musicDirector || '');
      setMovieCinematography(art.cinematography || '');
      setMovieRuntime(art.runtime || art.duration || '');
      setMovieYear(art.year || '');
      setMovieCertificate(art.certificate || '');
      setMovieVerdict(art.verdict || '');
      setMovieStarRating(String(art.starRating || (typeof art.rating === 'string' && parseFloat(art.rating)) || ''));
      setMoviePros(art.positives ? art.positives.join(', ') : '');
      setMovieCons(art.negatives ? art.negatives.join(', ') : '');
    } else {
      setArticleFormatTab('standard');
    }

    setActiveSection('article_creator');
    showToast(`Loaded "${art.title.slice(0, 30)}..." into CMS`);
  };

  const handleResetCreatorForm = () => {
    if (rawVideoUrl) URL.revokeObjectURL(rawVideoUrl);
    setEditingArticleId(null);
    setFormStoryId(generateStoryId());
    setFormTitle('');
    setFormCategory('Hot News');
    setFormSummary('');
    setFormFullContent('');
    setFormFullContent('');
    setFormFeatureImage('');
    setFormAuthor(defaultAuthor);
    setFormStatus('Live');
    setFormIsPinned(false);
    setFormAttachedToStoryId('');
    setFormSendPush(false);
    setMediaType('image');
    setRawImageFile(null);
    setRawVideoFile(null);
    setRawVideoUrl('');
    setYoutubeUrl('');
    if (fileImageInputRef.current) fileImageInputRef.current.value = '';
    if (fileVideoInputRef.current) fileVideoInputRef.current.value = '';
    setPollOptions(createDefaultPollOptions());
    setGalleryImages([]);
    setFormHeaderOverlay(true);
    setMovieDirector('');
    setMovieCast('');
    setMovieCastMembers([]);
    setMovieSynopsis('');
    setMovieGenres(['', '', '', '']);
    setMovieReleaseDate('');
    setMovieReleaseStatus('Released');
    setMovieCountry('India');
    setMovieLanguage(['Malayalam']);
    setMovieProductionCompany('');
    setMovieRelatedImages([]);
    setMovieRelatedImageLink('');
    setMovieMusicDirector('');
    setMovieCinematography('');
    setMovieRuntime('');
    setMovieYear('');
    setMovieCertificate('');
    setMovieVerdict('');
    setMovieStarRating('');
    setMoviePros('');
    setMovieCons('');
    setQuizExplanation('');
  };

  const handleOpenCrawledInStudio = (item: QueueItem) => {
    if (!item.claimedBy) {
      showToast('Claim this story first, then open it in Story Studio.');
      return;
    }
    if (item.claimedBy !== auth.currentUser?.uid) {
      showToast('Only the claiming writer can open this story in Story Studio.');
      return;
    }
    setEditingArticleId(null);
    setFormStoryId(generateStoryId());
    setFormTitle(item.title || '');
    setFormCategory('Hot News');
    setFormSummary(item.summary || item.fullContent || '');
    setFormFullContent(item.fullContent || item.summary || '');
    setFormFeatureImage(item.imageUrl || '');
    setFormAuthor(defaultAuthor);
    setFormStatus('Draft');
    setFormIsPinned(false);
    setFormAttachedToStoryId('');
    setFormSendPush(false);
    setMediaType('image');
    setActiveSection('article_creator');
    showToast('Crawled story opened as a draft in Story Studio.');
  };

  const handleSaveArticle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter an article headline');
      return;
    }
    if (
      articleFormatTab !== 'full_gallery' &&
      articleFormatTab !== 'gallery' &&
      articleFormatTab !== 'poll' &&
      !(articleFormatTab === 'movie_review' ? movieSynopsis.trim() : formSummary.trim())
    ) {
      showToast(articleFormatTab === 'movie_review' ? 'Please enter the movie synopsis' : 'Please enter the article body');
      return;
    }
    if (articleFormatTab !== 'poll' && bodyHasTooManyLines) {
      showToast('Body cannot exceed 11 lines');
      return;
    }
    if (articleFormatTab !== 'poll' && !formFeatureImage.trim()) {
      showToast(
        isImageProcessing
          ? 'Featured image is still processing. Please wait a moment.'
          : 'Please add a featured image before publishing the story.',
      );
      return;
    }

    setIsSaving(true);
    try {
      const generatedId = editingArticleId || `story-${Date.now()}`;
      const effectiveStoryId = formStoryId || `#${Math.floor(1000 + Math.random() * 9000)}`;
      
      const payload: Partial<ExtendedArticleData> & { id: string; title: string } = {
        id: generatedId,
        storyId: effectiveStoryId,
        title: formTitle.trim(),
        category: formCategory,
        summary:
          articleFormatTab === 'movie_review'
            ? movieSynopsis.trim()
            : articleFormatTab === 'poll'
            ? ''
            : formSummary.trim() || formTitle.trim(),
        fullContent:
          articleFormatTab === 'movie_review' ||
          articleFormatTab === 'full_gallery' ||
          articleFormatTab === 'gallery' ||
          articleFormatTab === 'poll'
            ? ''
              : formFullContent.trim() || formSummary.trim(),
        author: formAuthor.trim() || defaultAuthor,
        status: formStatus,
        isPinned: formIsPinned,
        pushSent: formSendPush,
        date: 'Just now',
        createdAt: Date.now(),
        rating: 'Normal',
        genres: [formCategory],
      };
      const latestPublishedStory = articles
        .filter(
          (article) =>
            article.type === 'news' &&
            article.status === 'Live' &&
            article.id !== generatedId,
        )
        .sort(
          (left, right) =>
            Number(right.createdAt || right.updatedAt || 0) -
            Number(left.createdAt || left.updatedAt || 0),
        )[0];
      const attachmentStoryId =
        formAttachedToStoryId || latestPublishedStory?.id || '';
      const pendingFeatureImage = formFeatureImage.trim().startsWith('data:image/')
        ? formFeatureImage.trim()
        : null;

      if (formFeatureImage.trim()) {
        payload.featureImage = formFeatureImage.trim();
      }

      if (formSendPush) {
        payload.pushSentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      if (mediaType === 'youtube' && youtubeUrl) {
        payload.redirectTargetUrl = youtubeUrl;
      }
      if (mediaType === 'video' && rawVideoFile) {
        payload.videoUrl = await uploadVideoFile(rawVideoFile, generatedId);
      }
      const isGalleryFormat =
        articleFormatTab === 'gallery' || articleFormatTab === 'full_gallery';
      if (articleFormatTab !== 'poll' && (!isGalleryFormat || galleryImages.length === 0)) {
        payload.featureImage = pendingFeatureImage || formFeatureImage;
      }

      // Format types
      if (articleFormatTab === 'full_gallery') {
        payload.type = 'full_gallery';
        const validGallery = galleryImages.filter((img) => img && img.trim());
        const gallerySources = (
          validGallery.length > 0 ? validGallery : [formFeatureImage]
        ).slice(0, 10);
        payload.galleryImages = await uploadImageDataUrls(
          gallerySources,
          generatedId,
        );
        payload.featureImage = payload.galleryImages[0] || payload.featureImage;
        payload.badgeTag = 'PHOTO GALLERY';
      } else if (articleFormatTab === 'gallery' || galleryImages.length > 0) {
        if (articleFormatTab === 'gallery') {
          payload.type = 'gallery';
          payload.headerOverlay = formHeaderOverlay;
        }
        payload.galleryImages = await uploadImageDataUrls(
          galleryImages.filter((img) => img && img.trim()).slice(0, 10),
          generatedId,
        );
        payload.featureImage = payload.galleryImages[0] || payload.featureImage;
      } else if (articleFormatTab === 'movie_review') {
        payload.type = 'movie';
        if (attachmentStoryId) payload.attachedToStoryId = attachmentStoryId;
        payload.director = movieDirector;
        payload.cast = movieCastMembers.map((member) => member.name.trim()).filter(Boolean).join(', ');
        payload.synopsis = movieSynopsis.trim();
        payload.genres = movieGenres.filter((genre) => genre.trim()).slice(0, 4);
        payload.releaseDate = movieReleaseDate;
        payload.releaseStatus = movieReleaseStatus;
        payload.country = movieCountry;
        payload.language = movieLanguage;
        payload.productionCompany = movieProductionCompany;
        const relatedImageSources = movieRelatedImages
          .filter((image) => image.trim())
          .slice(0, 10);
        const castMembersToUpload = movieCastMembers
          .map((member, index) => ({ member, index }))
          .filter(({ member }) => member.name.trim());
        const [uploadedRelatedImages, uploadedCastMembers] = await Promise.all([
          uploadImageDataUrls(relatedImageSources, generatedId),
          Promise.all(
            castMembersToUpload.map(async ({ member, index }) => ({
              name: member.name.trim(),
              characterName: member.characterName.trim(),
              imageUrl: await uploadImageDataUrl(
                member.imageUrl.trim(),
                generatedId,
                `cast-${index}`,
              ),
            })),
          ),
        ]);
        payload.galleryImages = uploadedRelatedImages;
        payload.relatedImages = uploadedRelatedImages;
        payload.relatedImageUrls = uploadedRelatedImages;
        payload.castMembers = uploadedCastMembers.slice(0, 15);
        payload.musicDirector = movieMusicDirector;
        payload.cinematography = movieCinematography;
        payload.runtime = movieRuntime;
        payload.year = movieYear;
        payload.certificate = movieCertificate;
      } else if (articleFormatTab === 'poll') {
        const isQuiz = pollOptions.some(
          (option) => option.isCorrect && option.text.trim(),
        );
        const pollBackgroundImage = pendingFeatureImage
          ? await uploadImageDataUrl(pendingFeatureImage, generatedId, 'poll-background')
          : formFeatureImage.trim();
        payload.type = isQuiz ? 'quiz' : 'poll';
        if (attachmentStoryId) payload.attachedToStoryId = attachmentStoryId;
        payload.question = formTitle.trim();
        payload.featureImage = pollBackgroundImage;
        payload.pollBackgroundImage = pollBackgroundImage;
        payload.choiceOptions = pollOptions
          .filter((option) => option.text.trim())
          .map((option) => ({
            id: option.id,
            text: option.text.trim(),
            votes: option.votes || 0,
            isCorrect: option.isCorrect,
          }));
      } else {
        payload.type = 'news';
      }

      if (pendingFeatureImage && articleFormatTab !== 'poll') {
        payload.featureImage = await uploadImageDataUrl(
          pendingFeatureImage,
          generatedId,
          'feature',
        );
      }

      // Optimistic UI state update
      setArticles((prev) => {
        const exists = prev.some((a) => a.id === generatedId);
        if (exists) {
          return prev.map((a) => (a.id === generatedId ? { ...a, ...payload } : a));
        }
        return [{ ...payload, id: generatedId } as ExtendedArticleData, ...prev];
      });

      await publishArticle(payload);

      // Feedback Toast Notification Matching Specification
      showToast(`Story published successfully to ${databaseMode === 'local' ? 'local database' : 'Firebase'}. ID: ${effectiveStoryId}`);
      handleResetCreatorForm();
    } catch (err) {
      console.warn('Database publish caught error, retained in local state:', err);
      showToast(`Publish failed: ${err instanceof Error ? err.message : `${databaseMode === 'local' ? 'Local database' : 'Firebase'} request failed`}`);
      handleResetCreatorForm();
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteArticle = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteArticleFromFirestore(id);
        showToast(`Story removed from ${databaseMode === 'local' ? 'local database' : 'Firebase'}`);
      } catch (err) {
        console.error('Delete failed:', err);
        showToast('Failed to delete story');
      }
    }
  };

  const handleTogglePin = async (art: ExtendedArticleData) => {
    try {
      await updateArticleInFirestore(art.id, { isPinned: !art.isPinned });
      showToast(art.isPinned ? 'Unpinned story' : 'Pinned to Top Spot #1');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (art: ExtendedArticleData) => {
    const next = art.status === 'Draft' ? 'Live' : 'Draft';
    try {
      await updateArticleInFirestore(art.id, { status: next });
      showToast(`Status changed to ${next}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Articles for Manager Table
  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      (art.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.author || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesStatus =
      selectedStatusFilter === 'All' ||
      (selectedStatusFilter === 'Live' && art.status !== 'Draft') ||
      (selectedStatusFilter === 'Draft' && art.status === 'Draft');

    const matchesType =
      selectedTypeFilter === 'All' ||
      art.type === selectedTypeFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });

  // Calculate metrics
  const totalArticles = articles.length;
  const liveArticles = articles.filter(a => a.status !== 'Draft').length;
  const draftArticles = articles.filter(a => a.status === 'Draft').length;
  const pinnedArticles = articles.filter(a => a.isPinned).length;
  const totalViews = articles.reduce((acc, a) => acc + (a.opensCount || 1) * 142 + 230, 0);
  const totalSaves = articles.reduce((acc, a) => acc + (a.savedCount || 8), 0);
  
  // Polls & Ask Reader collections for Data Hub
  const pollArticles = articles.filter(a => (a.type === 'quiz' || a.type === 'poll') && a.choiceOptions && a.choiceOptions.length > 0);
  const reviewArticles = articles.filter(a => a.type === 'movie' || a.type === 'movie_review');
  const askReaderArticles = articles.filter(a => a.category === 'Fan Opinion' || a.category === 'Ask Battles' || a.badgeTag?.includes('ASK'));

  // Open Dashboard in New Tab handler
  const handleOpenInNewTab = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'cms');
      window.open(url.toString(), '_blank');
    } catch (e) {
      window.open(window.location.href, '_blank');
    }
  };

  // Helper to render menu icons dynamically
  const renderMenuIcon = (iconName: string, active: boolean) => {
    const iconClass = `w-4.5 h-4.5 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`;
    switch (iconName) {
      case 'LayoutDashboard': return <LayoutDashboard className={iconClass} />;
      case 'FileText': return <FileText className={iconClass} />;
      case 'Globe': return <Globe className={iconClass} />;
      case 'Megaphone': return <Megaphone className={iconClass} />;
      case 'Database': return <Database className={iconClass} />;
      case 'Layers': return <Layers className={iconClass} />;
      case 'Settings': return <SettingsIcon className={iconClass} />;
      default: return <FileText className={iconClass} />;
    }
  };

  // Drag & Drop handlers for Admin-only Sidemenu
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (userRole !== 'admin') {
      e.preventDefault();
      showToast('Sidemenu drag-and-drop reordering is restricted to Admin only');
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (userRole !== 'admin') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (userRole !== 'admin') return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...menuItems];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    setMenuItems(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      localStorage.setItem('uproll_cms_menu_order', JSON.stringify(updated.map((i) => i.id)));
    } catch (err) {}
    showToast(`Menu reordered: Moved "${draggedItem.label}" to position #${targetIndex + 1}`);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResetMenuOrder = () => {
    setMenuItems(DEFAULT_MENU_ITEMS);
    try {
      localStorage.removeItem('uproll_cms_menu_order');
    } catch (err) {}
    showToast('Sidemenu order reset to default layout');
  };

  const toggleUserRole = () => {
    const newRole = userRole === 'admin' ? 'editor' : 'admin';
    setUserRole(newRole);
    try {
      localStorage.setItem('uproll_cms_user_role', newRole);
    } catch (err) {}
    showToast(newRole === 'admin' ? 'Super Admin Mode Active: Drag & Drop Sidemenu Enabled' : 'Staff Editor Mode: Sidemenu Dragging Locked');
  };

  const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
    if (userRole !== 'admin') {
      showToast('Menu reordering is restricted to Admin only');
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menuItems.length) return;

    const updated = [...menuItems];
    const [item] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, item);
    setMenuItems(updated);

    try {
      localStorage.setItem('uproll_cms_menu_order', JSON.stringify(updated.map((i) => i.id)));
    } catch (err) {}
    showToast(`Moved "${item.label}" ${direction}`);
  };

  return (
    <div className="dashboard-shell w-full h-full flex-1 bg-[#F8FAFC] text-slate-900 flex flex-col antialiased min-h-0 overflow-hidden">
      {/* Top Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-2xl animate-fade-in border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Workspace: Sidebar + Content Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F8FAFC] min-h-0">
        {/* Modern Clean White Sidebar with Admin Drag & Drop Ordering */}
        <aside className="w-full md:w-68 lg:w-72 bg-white border-r border-slate-200/90 p-3.5 sm:p-4 flex flex-col justify-between shrink-0 shadow-2xs overflow-y-auto select-none h-full font-google-sans">
          <div className="space-y-4">
            {/* Admin Permission Status & Drag Toggle Indicator */}
            <div className="rounded-xl border p-2.5 transition-all bg-slate-50 border-slate-200/80">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    userRole === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {userRole === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">
                        {userRole === 'admin' ? 'Admin Access' : 'Editor Access'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-black tracking-tight uppercase ${
                        userRole === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {userRole === 'admin' ? 'Drag Enabled' : 'Locked'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {userRole === 'admin' ? 'Drag handles to reorder sidemenu' : 'Sidemenu drag reordering locked'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleUserRole}
                  title={userRole === 'admin' ? 'Switch to Staff Editor (Locks Menu)' : 'Switch to Super Admin (Enables Drag & Drop)'}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  {userRole === 'admin' ? 'Lock' : 'Unlock'}
                </button>
              </div>
            </div>

            {/* Primary Draggable Nav Links (Admin Only Drag & Drop) */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Sidemenu ({menuItems.length})
                </span>
                {userRole === 'admin' && (
                  <button
                    type="button"
                    onClick={handleResetMenuOrder}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    title="Reset to default navigation order"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <nav className="space-y-1">
                {menuItems.map((item, index) => {
                  const isActive = activeSection === item.id;
                  const isBeingDragged = draggedIndex === index;
                  const isTargetedOver = dragOverIndex === index && draggedIndex !== index;

                  return (
                    <div
                      key={item.id}
                      draggable={userRole === 'admin'}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnter={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative transition-all ${
                        isBeingDragged ? 'opacity-30 scale-[0.98]' : 'opacity-100'
                      } ${isTargetedOver ? 'border-t-2 border-indigo-600 -mt-0.5 pt-0.5' : ''}`}
                    >
                      <div
                        onClick={() => {
                          setActiveSection(item.id);
                          if (item.id === 'article_creator' && !editingArticleId) {
                            handleResetCreatorForm();
                          }
                        }}
                        className={`w-full group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 shadow-2xs border border-indigo-100 font-extrabold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Admin Drag Handle */}
                          {userRole === 'admin' ? (
                            <div
                              title="Drag & Drop to reorder menu (Admin Only)"
                              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0 rounded hover:bg-indigo-100/60"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-1 shrink-0" />
                          )}

                          {/* Dynamic Menu Icon */}
                          {renderMenuIcon(item.iconName, isActive)}

                          <span className="truncate">{item.label}</span>
                        </div>

                        {/* Right Badge / Order Index Pill */}
                        <div className="flex items-center gap-1 shrink-0">
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-black text-[9px] tracking-tight uppercase">
                              {item.badge}
                            </span>
                          )}
                          {userRole === 'admin' && (
                            <span className="text-[10px] text-slate-300 font-mono group-hover:text-slate-400">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Quick Format Creation Shortcuts */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-2 mb-2">
                Fast Create Format
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'standard', label: 'Standard', icon: FileText },
                  { id: 'poll', label: 'Poll / Quiz', icon: Radio },
                  { id: 'gallery', label: 'Gallery Reel', icon: ImageIcon },
                  { id: 'full_gallery', label: 'Full Gallery', icon: Layers },
                  { id: 'ask_reader', label: 'Ask Reader', icon: MessageSquare },
                  { id: 'movie_review', label: 'Review', icon: Star },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleResetCreatorForm();
                        setArticleFormatTab(item.id as ArticleFormatTab);
                        setActiveSection('article_creator');
                      }}
                      className="p-1.5 px-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-all text-left cursor-pointer border border-slate-200/70"
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer Info */}
          <div className="pt-3 border-t border-slate-100 mt-2">
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-0.5">
                <span>Feed Engine</span>
                <span className="text-emerald-600 flex items-center gap-1 font-black text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                {targetWordCount}-word cards rendered with swipe momentum and cloud sync.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto h-full min-h-0">
          {/* ========================================================================= */}
          {/* 1. OVERVIEWS SECTION */}
          {/* ========================================================================= */}
          {activeSection === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Editorial Overview
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Real-time traffic metrics, published short-news volume, and reader interaction stats
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleResetCreatorForm();
                      setActiveSection('article_creator');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Create New Story</span>
                  </button>
                </div>
              </div>

              {/* Key Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Total Stories</span>
                    <Layers className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{totalArticles}</div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{liveArticles} Live in App Feed</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Reader Views</span>
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{totalViews.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Card swipes & full reads
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Saved Stories</span>
                    <Bookmark className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{totalSaves}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Bookmarked by verified readers
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Interactive Polls</span>
                    <Radio className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-2">{pollArticles.length}</div>
                  <div className="text-[11px] text-purple-600 font-bold mt-1">
                    Live quizzes & debates
                  </div>
                </div>
              </div>

              {/* Two Column Section: Category Distribution & Live Feed Pinned Headliners */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Category Activity */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>Category Breakdown</span>
                  </h3>
                  <div className="space-y-3">
                    {DEFAULT_CATEGORIES.map((cat) => {
                      const count = articles.filter(a => a.category === cat).length;
                      const percentage = totalArticles > 0 ? Math.round((count / totalArticles) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>{cat}</span>
                            <span className="text-slate-500">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Headliners / Pinned Stories */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Pin className="w-4 h-4 text-amber-500 fill-current" />
                      <span>Priority Headliners</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-bold">{pinnedArticles} Pinned</span>
                  </div>

                  <div className="space-y-3">
                    {articles.slice(0, 4).map((art, idx) => (
                      <div
                        key={art.id || idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={art.featureImage || ''}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 text-[10px] font-black border border-slate-200">
                                #{idx + 1}
                              </span>
                              <span className="text-[11px] font-bold text-indigo-600">
                                {art.category}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                              {art.title}
                            </h4>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEditArticle(art)}
                          className="p-2 rounded-lg bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-bold border border-slate-200 transition-colors cursor-pointer shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. ARTICLE CREATOR / EDITOR SECTION (Split-Screen Form + Live Mobile Emulator) */}
          {/* ========================================================================= */}
          {activeSection === 'crawling' && <CrawlingSection view="queue" onOpenInStudio={handleOpenCrawledInStudio} />}
          {activeSection === 'drafts' && <CrawlingSection view="drafts" />}

          {activeSection === 'article_creator' && (
            <div className="space-y-6 animate-fade-in w-full">
              {/* Creator Studio Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {editingArticleId ? 'Edit Short-News Story' : 'Story Studio & Live Emulator'}
                      </h2>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 text-xs font-mono font-bold shadow-2xs">
                        <Hash className="w-3 h-3 text-slate-500" />
                        <span>{formStoryId}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newId = generateStoryId();
                            setFormStoryId(newId);
                            showToast(`Generated new Story ID: ${newId}`);
                          }}
                          title="Generate fresh unique Story ID"
                          className="ml-1 p-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Split-screen real-time CMS editor with mobile card emulator sync
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {editingArticleId && (
                    <button
                      type="button"
                      onClick={handleResetCreatorForm}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                    >
                      Clear & New
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSection('article_manager')}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>View All Stories ({articles.length})</span>
                  </button>
                </div>
              </div>

              {/* Split-Screen 2-Column Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* ------------------------------------------------------------- */}
                {/* LEFT SIDE: FORM AREA (xl:col-span-7 2xl:col-span-8) */}
                {/* ------------------------------------------------------------- */}
                <div className="xl:col-span-7 2xl:col-span-8 space-y-5">
                  {/* Format Switcher Tabs */}
                  <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { id: 'standard', label: '1. Standard News', icon: FileText, desc: 'Feed card snippet' },
                      { id: 'poll', label: '2. Poll / Quiz', icon: Radio, desc: 'Interactive live voting' },
                      { id: 'gallery', label: '3. Image Gallery', icon: ImageIcon, desc: 'Multi-slide (max 10)' },
                      { id: 'full_gallery', label: '4. Full Image Gallery', icon: Layers, desc: 'Full-screen cards (max 10)' },
                      { id: 'ask_reader', label: '5. Ask Reader', icon: MessageSquare, desc: 'Open debate' },
                      { id: 'movie_review', label: '6. Movie Review', icon: Star, desc: 'IMDb rating & verdict' },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = articleFormatTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setArticleFormatTab(tab.id as ArticleFormatTab)}
                          className={`flex-1 min-w-[130px] p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="text-xs font-black truncate">{tab.label}</span>
                          </div>
                          <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {tab.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Main Article Form */}
                  <form onSubmit={handleSaveArticle} className="space-y-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
                    {/* 1. Headline / Title Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                            Headline / Title *
                          </label>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Max 80 chars
                          </span>
                        </div>
                        <span className={`text-[11px] font-mono font-bold ${formTitle.length > 70 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {formTitle.length} / 80 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        placeholder="e.g. 'ഖലീഫ' (Khalifa) Official Box Office & Teaser Update (Max 80 chars)"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>

                    {/* 2. Categories & Quick Chips */}
                    {articleFormatTab !== 'gallery' &&
                    articleFormatTab !== 'full_gallery' && (
                      <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                          Category & Tags *
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Select from predefined news tags
                        </span>
                      </div>

                      {/* Dropdown Selector */}
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      >
                        {categoriesList.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      </div>
                    )}

                    {/* 3. Article Body */}
                    {articleFormatTab === 'movie_review' ||
                    articleFormatTab === 'full_gallery' ||
                    articleFormatTab === 'gallery' ||
                    articleFormatTab === 'poll' ? (
                      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center gap-2 text-xs text-indigo-900 font-medium">
                        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>
                          <strong>
                            {articleFormatTab === 'movie_review'
                              ? 'Movie review:'
                              : articleFormatTab === 'poll'
                              ? 'Poll card:'
                              : 'Full Image Gallery Lookbook:'}
                          </strong>{' '}
                          {articleFormatTab === 'movie_review'
                            ? 'Body text is removed. Add the synopsis and movie details below.'
                            : articleFormatTab === 'poll'
                            ? 'Feed summary and full article body are removed. Configure the heading and voting options below.'
                            : 'Feed summary and detailed story body are removed for an uninterrupted photo lookbook experience.'}
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Article Body */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                                Body *
                              </label>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                                  isOptimalRange
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                              >
                                  Article text
                              </span>
                            </div>
                            <span
                              className={`text-xs font-mono font-bold ${
                                bodyHasTooManyLines
                                  ? 'text-rose-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {bodyLineCount} / 11 lines • {wordCount} words
                            </span>
                          </div>

                          {/* Generous Ergonomic Full-Width Textarea using full area */}
                          <textarea
                            required
                            rows={11}
                            value={formSummary}
                            onChange={(e) => setFormSummary(e.target.value)}
                            placeholder="Write the article body..."
                            aria-invalid={bodyHasTooManyLines}
                            className={`w-full min-h-[120px] px-4 py-3 rounded-xl bg-slate-50 border text-sm text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 transition-all resize-y ${
                              bodyHasTooManyLines
                                ? 'border-rose-500 focus:ring-rose-600/20 focus:border-rose-600'
                                : 'border-slate-200 focus:ring-indigo-600/20 focus:border-indigo-600'
                            }`}
                          />
                          {bodyHasTooManyLines && (
                            <p className="text-xs font-bold text-rose-600">
                              Body cannot exceed 11 lines. Remove {bodyLineCount - 11} line{bodyLineCount - 11 === 1 ? '' : 's'} before publishing.
                            </p>
                          )}
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                            Detailed Story Content
                          </label>
                          <textarea
                            rows={8}
                            value={formFullContent}
                            onChange={(e) => setFormFullContent(e.target.value)}
                            placeholder="Optional full story shown when readers tap the headline"
                            className="w-full min-h-[120px] px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                      </>
                    )}

                    {/* 5. Media Section: Raw Image, Raw Video, YouTube Link, Presets */}
                    {articleFormatTab !== 'poll' && (
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                          Media Assets & Video Embed
                        </label>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Image, MP4 Video, or YouTube Link
                        </span>
                      </div>

                      {/* Media Mode Selector */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setMediaType('image')}
                          className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                            mediaType === 'image'
                              ? 'bg-white text-indigo-700 border-indigo-300 shadow-2xs font-black'
                              : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Raw Image File / URL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaType('video')}
                          className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                            mediaType === 'video'
                              ? 'bg-white text-indigo-700 border-indigo-300 shadow-2xs font-black'
                              : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Raw Video File</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaType('youtube')}
                          className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                            mediaType === 'youtube'
                              ? 'bg-white text-rose-700 border-rose-300 shadow-2xs font-black'
                              : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
                          }`}
                        >
                          <Youtube className="w-3.5 h-3.5 text-rose-600" />
                          <span>YouTube Link</span>
                        </button>
                      </div>

                      {/* Media Inputs Based on Selected Type */}
                      {mediaType === 'image' && (
                        <div className="space-y-3 pt-1">
                          {/* File Upload Zone */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <input
                              type="file"
                              ref={fileImageInputRef}
                              accept="image/*"
                              onChange={handleRawImageUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileImageInputRef.current?.click()}
                              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs"
                            >
                              <Upload className="w-4 h-4 text-indigo-600" />
                              <span>Upload Raw Image File</span>
                            </button>
                            {rawImageFile && (
                              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{rawImageFile.name} ({(rawImageFile.size / 1024).toFixed(0)} KB)</span>
                              </span>
                            )}
                          </div>

                        </div>
                      )}

                      {mediaType === 'video' && (
                        <div className="space-y-3 pt-1">
                          <input
                            type="file"
                            ref={fileVideoInputRef}
                            accept="video/mp4,video/webm"
                            onChange={handleRawVideoUpload}
                            className="hidden"
                          />
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => fileVideoInputRef.current?.click()}
                              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs"
                            >
                              <Video className="w-4 h-4 text-indigo-600" />
                              <span>Select Raw Video File (MP4 / WebM)</span>
                            </button>
                            {rawVideoFile && (
                              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{rawVideoFile.name} ({(rawVideoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                              </span>
                            )}
                          </div>
                          {rawVideoUrl && (
                            <div className="w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
                              <video src={rawVideoUrl} controls className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}

                      {mediaType === 'youtube' && (
                        <div className="space-y-2 pt-1">
                          <label className="block text-[11px] font-bold text-slate-600">
                            YouTube Video URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={youtubeUrl}
                              onChange={(e) => setYoutubeUrl(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-600"
                            />
                          </div>
                          {youtubeId ? (
                            <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid YouTube Video ID: {youtubeId} (Synced to Live Emulator)</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-amber-700 font-medium">
                              Enter a standard YouTube or Shorts link to embed
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    )}

                    {/* 6. Format-Specific Field Blocks */}
                    {articleFormatTab === 'poll' && (
                      <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                            <Radio className="w-4 h-4 text-purple-600" />
                            Poll / Quiz Voting Choices
                          </span>
                          <span className="text-[11px] text-purple-700 font-bold">
                            {pollOptions.length} choices configured
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[11px] font-black uppercase tracking-wider text-purple-900">
                            Poll background image (optional)
                          </label>
                          <div className="flex items-center gap-3 flex-wrap">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleRawImageUpload}
                              className="hidden"
                              id="poll-background-upload"
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById('poll-background-upload')?.click()}
                              className="px-3 py-2 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-50 text-[11px] font-black flex items-center gap-2 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Upload background image
                            </button>
                            {formFeatureImage && (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Background selected
                              </span>
                            )}
                          </div>
                          {formFeatureImage && (
                            <div className="overflow-hidden rounded-xl border border-purple-200 bg-white">
                              <img
                                src={formFeatureImage}
                                alt="Poll background preview"
                                className="h-20 w-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {pollOptions.map((opt, idx) => (
                            <div key={opt.id || idx} className="flex items-center gap-2">
                              <span className="w-6 text-center text-xs font-extrabold text-purple-800">
                                {idx + 1}.
                              </span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const next = [...pollOptions];
                                  next[idx].text = e.target.value;
                                  setPollOptions(next);
                                }}
                                placeholder={`Choice ${idx + 1}`}
                                className="flex-1 px-3 py-2 rounded-lg bg-white border border-purple-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = pollOptions.map((o, i) => ({
                                    ...o,
                                    isCorrect: i === idx,
                                  }));
                                  setPollOptions(next);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                                  opt.isCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {opt.isCorrect ? '✓ Correct Answer' : 'Set as Correct'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(articleFormatTab === 'gallery' || articleFormatTab === 'full_gallery') && (
                      <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-4 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-sm font-black uppercase tracking-wider text-sky-950 flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-sky-600" />
                              {articleFormatTab === 'full_gallery' ? 'Full Image Gallery (Max 10 Photos)' : 'Photo Gallery Reel (Max 10 Photos)'}
                            </span>
                            <p className="text-xs text-sky-700 font-medium mt-0.5">
                              {articleFormatTab === 'full_gallery'
                                ? 'Full-screen swipeable photos with touch navigation on mobile.'
                                : 'Horizontal swipe carousel with live pagination on mobile.'}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                            galleryImages.length >= 10
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-sky-100 text-sky-800 border-sky-300'
                          }`}>
                            {galleryImages.length} / 10 Photos {galleryImages.length >= 10 && '(Limit Reached)'}
                          </span>
                        </div>

                        {/* Hidden multiple file upload input */}
                        <input
                          type="file"
                          ref={galleryMultipleInputRef}
                          multiple
                          accept="image/*"
                          onChange={handleMultipleGalleryUpload}
                          className="hidden"
                        />

                        {/* Upload Controls Bar */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <button
                            type="button"
                            disabled={galleryImages.length >= 10}
                            onClick={() => galleryMultipleInputRef.current?.click()}
                            className={`px-4 py-2.5 rounded-xl text-white text-xs font-black flex items-center gap-2 shadow-2xs transition-all ${
                              galleryImages.length >= 10
                                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                                : 'bg-sky-600 hover:bg-sky-700 cursor-pointer active:scale-95'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Upload Multiple Photos (Device)</span>
                          </button>

                          {galleryImages.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Clear all gallery slides?')) setGalleryImages([]);
                              }}
                              className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold cursor-pointer ml-auto"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        {/* Visual Thumbnail Grid with Cover Designation & Ordering */}
                        {galleryImages.length > 0 && (
                          <div className="space-y-2.5 pt-2">
                            <div className="text-[11px] font-black uppercase tracking-wider text-sky-900">
                              Gallery Photos Sequence:
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                              {galleryImages.map((imgUrl, idx) => {
                                const isCover = formFeatureImage === imgUrl;
                                return (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                                      isCover
                                        ? 'bg-white border-sky-400 ring-2 ring-sky-300 shadow-2xs'
                                        : 'bg-white/90 border-sky-200'
                                    }`}
                                  >
                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                                      <img
                                        src={imgUrl}
                                        alt={`Slide ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                        #{idx + 1}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-1 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormFeatureImage(imgUrl);
                                          showToast(`Slide #${idx + 1} set as main feed cover image`);
                                        }}
                                        className={`text-[10px] font-extrabold px-2 py-1 rounded cursor-pointer transition-all ${
                                          isCover
                                            ? 'bg-sky-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-700'
                                        }`}
                                      >
                                        {isCover ? '✓ Cover' : 'Set Cover'}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
                                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer rounded hover:bg-rose-50"
                                        title="Remove Photo"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {articleFormatTab === 'ask_reader' && (
                      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          Crowdsourced Ask Reader Debate
                        </span>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Discussion Question / Verdict Prompt
                          </label>
                          <input
                            type="text"
                            value={askReaderPrompt}
                            onChange={(e) => setAskReaderPrompt(e.target.value)}
                            placeholder="e.g. Do you think the movie justified the pre-release hype?"
                            className="w-full px-3.5 py-2 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {articleFormatTab === 'movie_review' && (
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                            <Film className="w-4 h-4 text-amber-700" />
                            Movie Review Specifications & Technicians
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                            No Rating Stars Mode
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Synopsis
                          </label>
                          <textarea
                            value={movieSynopsis}
                            onChange={(e) => setMovieSynopsis(e.target.value)}
                            placeholder="Write the movie synopsis shown in the app"
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold text-slate-700">
                                Cast members (max 15)
                              </label>
                              <button
                                type="button"
                                disabled={movieCastMembers.length >= 15}
                                onClick={() => setMovieCastMembers((prev) => [...prev, { name: '', characterName: '', imageUrl: '' }].slice(0, 15))}
                                className="text-[10px] font-black text-amber-800 disabled:text-slate-400"
                              >
                                + Add cast
                              </button>
                            </div>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {movieCastMembers.map((member, index) => (
                                <div key={`cast-${index}`} className="grid grid-cols-[1fr_1fr_1.4fr_auto] gap-1.5 items-center">
                                  <input
                                    type="text"
                                    value={member.name}
                                    onChange={(e) => setMovieCastMembers((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item))}
                                    placeholder="Actor name"
                                    className="min-w-0 px-2 py-1.5 rounded-lg bg-white border border-amber-200 text-[11px] text-slate-900"
                                  />
                                  <input
                                    type="text"
                                    value={member.characterName}
                                    onChange={(e) => setMovieCastMembers((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, characterName: e.target.value } : item))}
                                    placeholder="Character name"
                                    className="min-w-0 px-2 py-1.5 rounded-lg bg-white border border-amber-200 text-[11px] text-slate-900"
                                  />
                                  <input
                                    type="text"
                                    value={member.imageUrl}
                                    onChange={(e) => setMovieCastMembers((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, imageUrl: e.target.value } : item))}
                                    placeholder="Image link or upload"
                                    className="min-w-0 px-2 py-1.5 rounded-lg bg-white border border-amber-200 text-[11px] text-slate-900"
                                  />
                                  <label className="col-span-3 inline-flex w-fit items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-black cursor-pointer hover:bg-amber-200">
                                    <Upload className="w-3.5 h-3.5" />
                                    {member.imageUrl ? 'Replace cast image' : 'Upload cast image'}
                                    <input type="file" accept="image/*" onChange={(e) => handleMovieCastImageUpload(index, e)} className="sr-only" />
                                  </label>
                                  <button type="button" onClick={() => setMovieCastMembers((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-rose-600" title="Remove cast member"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500">Name, movie character, and uploaded image are saved to the app. {movieCastMembers.length} / 15</span>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Related images (max 10, horizontal in app)
                            </label>
                            <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black ${movieRelatedImages.length >= 10 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer'}`}>
                              <Upload className="w-4 h-4" />
                              Upload related images
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleMovieRelatedImagesUpload}
                                disabled={movieRelatedImages.length >= 10}
                                className="sr-only"
                              />
                            </label>
                            <div className="flex gap-1.5 mt-2">
                              <input
                                type="url"
                                value={movieRelatedImageLink}
                                onChange={(e) => setMovieRelatedImageLink(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMovieRelatedImageLink(); } }}
                                placeholder="Paste image link"
                                disabled={movieRelatedImages.length >= 10}
                                className="min-w-0 flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-amber-200 text-[11px] text-slate-900"
                              />
                              <button
                                type="button"
                                onClick={addMovieRelatedImageLink}
                                disabled={!movieRelatedImageLink.trim() || movieRelatedImages.length >= 10}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-black disabled:bg-slate-200 disabled:text-slate-400"
                              >
                                Add link
                              </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto mt-2">
                              {movieRelatedImages.map((image, index) => (
                                <div key={`${image}-${index}`} className="relative shrink-0">
                                  <img src={image} alt={`Related ${index + 1}`} className="w-16 h-16 object-cover rounded-lg" />
                                  <button type="button" onClick={() => setMovieRelatedImages(movieRelatedImages.filter((_, i) => i !== index))} className="absolute -top-1 -right-1 bg-white rounded-full text-rose-600" title="Remove image"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500">{movieRelatedImages.length} / 10 images</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {movieGenres.map((genre, index) => (
                            <input
                              key={`genre-${index}`}
                              type="text"
                              value={genre}
                              onChange={(e) => setMovieGenres(movieGenres.map((item, itemIndex) => itemIndex === index ? e.target.value : item))}
                              placeholder={`Genre ${index + 1}`}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900"
                            />
                          ))}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <input type="date" value={movieReleaseDate} onChange={(e) => setMovieReleaseDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900" />
                          <select value={movieReleaseStatus} onChange={(e) => setMovieReleaseStatus(e.target.value as 'Released' | 'Not yet released')} className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900"><option>Released</option><option>Not yet released</option></select>
                          <select value={movieCountry} onChange={(e) => setMovieCountry(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900">
                            {['India', 'United States', 'United Kingdom', 'Other'].map((country) => <option key={country}>{country}</option>)}
                          </select>
                          <div className="rounded-lg bg-white border border-amber-200 px-2 py-1.5">
                            <span className="block text-[10px] font-bold text-slate-500 mb-1">Languages</span>
                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                              {['Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Hindi', 'Bengali', 'Marathi', 'Other'].map((language) => (
                                <label key={language} className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={movieLanguage.includes(language)}
                                    onChange={(e) => setMovieLanguage((current) => e.target.checked ? [...new Set([...current, language])] : current.filter((item) => item !== language))}
                                  />
                                  {language}
                                </label>
                              ))}
                            </div>
                          </div>
                          <input type="text" value={movieProductionCompany} onChange={(e) => setMovieProductionCompany(e.target.value)} placeholder="Production company" className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900" />
                        </div>

                        {/* Row 1: Director, Lead Cast, Music Director */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Director
                            </label>
                            <input
                              type="text"
                              value={movieDirector}
                              onChange={(e) => setMovieDirector(e.target.value)}
                              placeholder="e.g. Vysakh"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Music Director & BGM
                            </label>
                            <input
                              type="text"
                              value={movieMusicDirector}
                              onChange={(e) => setMovieMusicDirector(e.target.value)}
                              placeholder="e.g. Jakes Bejoy"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900"
                            />
                          </div>
                        </div>

                        {/* Row 2: Cinematographer, Runtime, Year, Certificate */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Cinematography
                            </label>
                            <input
                              type="text"
                              value={movieCinematography}
                              onChange={(e) => setMovieCinematography(e.target.value)}
                              placeholder="e.g. Shaji Kumar"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Runtime
                            </label>
                            <input
                              type="text"
                              value={movieRuntime}
                              onChange={(e) => setMovieRuntime(e.target.value)}
                              placeholder="e.g. 2h 30m"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Release Year
                            </label>
                            <input
                              type="text"
                              value={movieYear}
                              onChange={(e) => setMovieYear(e.target.value)}
                              placeholder="e.g. 2026"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Certificate
                            </label>
                            <select
                              value={movieCertificate}
                              onChange={(e) => setMovieCertificate(e.target.value)}
                              placeholder="e.g. U/A 16+"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs font-bold text-slate-900"
                            >
                              <option value="">Select certificate</option>
                              {['U', 'U/A', 'A', 'S', 'Not Rated'].map((certificate) => <option key={certificate}>{certificate}</option>)}
                            </select>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* 7. Story Status */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">
                        Story Status
                      </span>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                      >
                        <option value="Live">Live</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>

                    {/* 8. CRITICAL: Push Notification Safety - UNCHECKED/DISABLED BY DEFAULT */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formSendPush}
                            onChange={(e) => setFormSendPush(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-0 border-amber-400"
                          />
                          <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5 text-amber-700" />
                            Send Push Notification
                          </span>
                        </label>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                          {formSendPush ? 'Active on Publish' : 'Safety Guard: Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        <strong>Safety Note:</strong> Unchecked by default to prevent accidental automated notification blasts. Enable only when ready to ping all subscribed mobile devices.
                      </p>
                    </div>

                    {/* Bottom Form Actions with Prominent Bottom-Right Publish Story Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleResetCreatorForm}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                      >
                        Reset Form
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Publishing to Firestore...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Publish Story</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT SIDE: LIVE MOBILE EMULATOR (xl:col-span-5 2xl:col-span-4) */}
                {/* ------------------------------------------------------------- */}
                <div className="xl:col-span-5 2xl:col-span-4 sticky top-6">
                  <div className="bg-slate-50/80 p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Live Mobile Emulator
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Real-time card synchronization
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {formCategory}
                      </span>
                    </div>

                    {/* Live Mobile Viewport */}
                    <LiveMobileEmulator
                      headline={formTitle}
                      category={formCategory}
                      summary={formSummary}
                      fullContent={formSummary}
                      mediaType={mediaType}
                      imageUrl={formFeatureImage}
                      videoUrl={rawVideoUrl}
                      youtubeUrl={youtubeUrl}
                      youtubeId={youtubeId}
                      author={formAuthor}
                      storyId={formStoryId}
                      isPinned={formIsPinned}
                      sendPush={formSendPush}
                      formatType={articleFormatTab}
                      headerOverlay={formHeaderOverlay}
                      pollOptions={pollOptions}
                      galleryImages={articleFormatTab === 'movie_review' ? movieRelatedImages : galleryImages}
                      movieVerdict={movieVerdict}
                      movieRating={movieStarRating}
                      movieDirector={movieDirector}
                      movieCast={movieCastMembers.map((member) => member.name).filter(Boolean).join(', ')}
                      movieCastMembers={movieCastMembers}
                      movieMusicDirector={movieMusicDirector}
                      movieCinematography={movieCinematography}
                      movieRuntime={movieRuntime}
                      movieYear={movieYear}
                      movieCertificate={movieCertificate}
                      askReaderPrompt={askReaderPrompt}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. DATA HUB SECTION (Poll Data, Ask Readers Data) */}
          {/* ========================================================================= */}
          {activeSection === 'data_hub' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Interactive Data Hub
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Real-time audience voting tallies, trivia accuracy, and crowdsourced debate responses
                  </p>
                </div>

                {/* Data Sub-tabs */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    onClick={() => setDataHubTab('polls')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dataHubTab === 'polls'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Poll & Quiz Data ({pollArticles.length})</span>
                  </button>
                  <button
                    onClick={() => setDataHubTab('ratings')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dataHubTab === 'ratings'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Movie Ratings ({reviewArticles.length})</span>
                  </button>
                  <button
                    onClick={() => setDataHubTab('ask_readers')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dataHubTab === 'ask_readers'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask Readers Data ({askReaderArticles.length})</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Polls & Quizzes breakdown */}
              {dataHubTab === 'polls' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pollArticles.length === 0 ? (
                    <div className="col-span-2 py-16 text-center bg-white rounded-2xl border border-slate-200">
                      <Radio className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No active polls found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Create a poll card to start aggregating votes</p>
                    </div>
                  ) : (
                    pollArticles.map((poll) => {
                      const options: any[] = poll.choiceOptions || [];
                      const liveStats = interactionStats[poll.id];
                      const totalVotes = liveStats?.totalVotes || options.reduce((sum, o) => sum + (o.votes || 0), 0);
                      return (
                        <div
                          key={poll.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-black border border-purple-200">
                                {poll.badgeTag || 'POLL / QUIZ'}
                              </span>
                              <h3 className="text-sm font-black text-slate-900 mt-1.5 line-clamp-2">
                                {poll.title}
                              </h3>
                            </div>
                            <button
                              onClick={() => {
                                handleEditArticle(poll);
                              }}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs"
                              title="Edit Poll"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Options Vote Breakdown Bars */}
                          <div className="space-y-2.5">
                            {options.map((opt: any, idx: number) => {
                              const votes = liveStats?.optionVotes[String(idx)] ?? opt.votes ?? 0;
                              const pct = totalVotes > 0
                                ? Math.round((votes / totalVotes) * 100)
                                : 0;
                              return (
                                <div key={opt.id || idx} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="truncate pr-2">
                                      {idx + 1}. {opt.text}
                                    </span>
                                    <span className="text-slate-900 font-extrabold shrink-0">
                                      {pct}% ({votes} votes)
                                    </span>
                                  </div>
                                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                                      style={{ width: `${Math.max(pct, 4)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer Stats */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1 font-bold text-slate-700">
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              {totalVotes} total verified votes
                            </span>
                            <button
                              onClick={() => {
                                if (onSelectArticleForReader) onSelectArticleForReader(poll.id);
                                onOpenMobileReader();
                              }}
                              className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <span>Preview in Reader</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {dataHubTab === 'ratings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {reviewArticles.length === 0 ? (
                    <div className="col-span-2 py-16 text-center bg-white rounded-2xl border border-slate-200">
                      <Star className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No movie reviews found</p>
                    </div>
                  ) : reviewArticles.map((review) => {
                    const stats = interactionStats[review.id];
                    const average = stats?.averageRating || Number(review.starRating || review.rating || 0);
                    return (
                      <div key={review.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                        <h3 className="text-sm font-black text-slate-900 line-clamp-2">{review.title}</h3>
                        <div className="flex items-end justify-between">
                          <span className="text-4xl font-black text-indigo-700">{average.toFixed(1)}</span>
                          <span className="text-xs font-bold text-slate-500">
                            {stats?.totalRatings || 0} live ratings • {stats?.totalWatched || 0} watched
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2 items-end h-20">
                          {[1, 2, 3, 4, 5].map((rating) => {
                            const count = stats?.ratingCounts[String(rating)] || 0;
                            const max = Math.max(...[1, 2, 3, 4, 5].map((value) => stats?.ratingCounts[String(value)] || 0), 1);
                            return <div key={rating} className="flex flex-col items-center gap-1"><div className="w-full bg-emerald-400 rounded-t" style={{ height: `${Math.max(6, (count / max) * 58)}px` }} /><span className="text-[10px] text-slate-500">{rating}</span></div>;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub-tab 2: Ask Readers Community Submissions */}
              {dataHubTab === 'ask_readers' && (
                <div className="space-y-5">
                  {askReaderArticles.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
                      <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">No Ask Readers stories found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Publish an Ask Reader card to receive submissions</p>
                    </div>
                  ) : (
                    askReaderArticles.map((ask) => {
                      const answers: ReaderAnswerItem[] = ask.readerAnswers || [
                        { id: '1', user: 'CinemaFan_24', text: 'Great cinematography and visuals, thoroughly enjoyed the theatrical release!', date: '10m ago' },
                        { id: '2', user: 'Rahul_M', text: 'Second half screenplay was slightly predictable but overall a solid experience.', date: '1h ago' },
                      ];
                      return (
                        <div key={ask.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                                {ask.category} • ASK READERS
                              </span>
                              <h3 className="text-base font-black text-slate-900 mt-1">
                                {ask.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">{ask.summary}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                              {answers.length} Responses
                            </span>
                          </div>

                          {/* Answers List */}
                          <div className="space-y-2.5 pt-2">
                            {answers.map((ans, idx) => (
                              <div
                                key={ans.id || idx}
                                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-3"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs text-slate-900">
                                      @{ans.user || 'Verified Reader'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {ans.date || 'Just now'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed">
                                    "{ans.text}"
                                  </p>
                                </div>
                                <span className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer">
                                  <Check className="w-4 h-4" />
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. ARTICLE MANAGER SECTION */}
          {/* ========================================================================= */}
          {activeSection === 'article_manager' && (
            <div className="space-y-5 animate-fade-in">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Article Manager
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Search, filter, prioritize top 20 spots, edit and delete live short-news cards
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleResetCreatorForm();
                      setActiveSection('article_creator');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Create Story</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Search input */}
                  <div className="sm:col-span-6 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search headline, summary, category or author..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="sm:col-span-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    >
                      <option value="All">All Categories ({articles.length})</option>
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="sm:col-span-3">
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    >
                      <option value="All">All Statuses ({articles.length})</option>
                      <option value="Live">Live Only ({liveArticles})</option>
                      <option value="Draft">Draft Only ({draftArticles})</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table / Card List */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                    <p className="text-xs font-bold text-slate-600">Connecting to Firestore...</p>
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">
                    <p className="text-base font-bold text-slate-800">No stories match your filter criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredArticles.map((art, idx) => (
                      <div
                        key={art.id || idx}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Thumbnail & Title */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <img
                              src={art.featureImage || ''}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {art.isPinned && (
                              <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[8px] flex items-center gap-0.5 shadow-2xs">
                                <Pin className="w-2 h-2 fill-current" />
                                PIN
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200">
                                {art.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                art.type === 'quiz' || art.type === 'poll'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : art.type === 'gallery'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : art.type === 'movie'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {art.type || 'standard'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                art.status === 'Draft'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {art.status || 'Live'}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {art.title}
                            </h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                              {art.summary}
                            </p>

                            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-semibold mt-2">
                              <span>By {art.author || 'UPROLL Desk'}</span>
                              <span className="inline-flex w-20 shrink-0 truncate">
                                • {art.date || 'Just now'}
                              </span>
                              <span className="flex items-center gap-1 text-slate-600">
                                <Eye className="w-3 h-3" />
                                {art.opensCount ? art.opensCount * 140 : 420} views
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {/* Pin Toggle */}
                          <button
                            onClick={() => handleTogglePin(art)}
                            title={art.isPinned ? 'Unpin' : 'Pin to Top (#1)'}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              art.isPinned
                                ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-2xs'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Pin className={`w-4 h-4 ${art.isPinned ? 'fill-current' : ''}`} />
                          </button>

                          {/* Status Toggle */}
                          <button
                            onClick={() => handleToggleStatus(art)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              art.status === 'Draft'
                                ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {art.status === 'Draft' ? 'Draft' : 'Live'}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEditArticle(art)}
                            className="p-2 rounded-xl bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Mobile Preview */}
                          <button
                            onClick={() => {
                              if (onSelectArticleForReader) onSelectArticleForReader(art.id);
                              onOpenMobileReader();
                            }}
                            className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 transition-colors cursor-pointer"
                            title="Preview in Mobile App"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteArticle(art.id, art.title)}
                            className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. MONETIZATION & ADS SECTION */}
          {/* ========================================================================= */}
          {activeSection === 'monetization' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Megaphone className="w-6 h-6 text-emerald-600" />
                    <span>Sponsored Content</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Manage sponsored stories, image galleries, video campaigns, and coupon promotions delivered from Firestore
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Monetization & Ad settings saved successfully');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Campaign Settings</span>
                  </button>
                </div>
              </div>

              {/* Revenue & Performance Telemetry Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Est. Ad Earnings</span>
                    <Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">$386.40</div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+18.4% this month</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Total Ad Impressions</span>
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">164.2k</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    In-feed & story cards
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Average eCPM</span>
                    <BadgePercent className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">$2.35</div>
                  <div className="text-[11px] text-indigo-600 font-bold mt-1">
                    Cinema & Pop culture
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Active Sponsors</span>
                    <Megaphone className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                    {directSponsors.filter(s => s.active).length} Live
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    {directSponsors.length} Total Campaigns
                  </div>
                </div>
              </div>

              {/* Direct Brand Sponsored Article Studio & Back-Link Generator */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Monetization Article Creator & Brand Back-Link Studio
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Create full image galleries (up to 10 photos), standard 60-word articles, and carousel sliders with direct brand landing page backlinks. Clicking the header or photos opens the brand page.
                      </p>
                    </div>
                  </div>

                  {editingMonetizeArticleId && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                        Editing Article #{editingMonetizeArticleId.slice(0, 10)}
                      </span>
                      <button
                        type="button"
                        onClick={handleResetMonetizeForm}
                        className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Format Type Selector for Monetization */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Sponsored Article Type:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setMonetizeFormatTab('full_gallery')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        monetizeFormatTab === 'full_gallery'
                          ? 'bg-amber-50/70 border-amber-500 shadow-xs ring-1 ring-amber-500/30'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1.5 text-slate-900">
                          <ImageIcon className="w-4 h-4 text-amber-600" />
                          <span>Full Image Gallery</span>
                        </span>
                        {monetizeFormatTab === 'full_gallery' && (
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Up to 10 full-bleed portrait photos with horizontal swipe, partner badge, and floating landing button.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonetizeFormatTab('standard')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        monetizeFormatTab === 'standard'
                          ? 'bg-amber-50/70 border-amber-500 shadow-xs ring-1 ring-amber-500/30'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1.5 text-slate-900">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>Standard Article Story</span>
                        </span>
                        {monetizeFormatTab === 'standard' && (
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Standard 60-word feed card + full article body, branded sponsor tag, and direct landing CTA button.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMonetizeFormatTab('gallery')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        monetizeFormatTab === 'gallery'
                          ? 'bg-amber-50/70 border-amber-500 shadow-xs ring-1 ring-amber-500/30'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center gap-1.5 text-slate-900">
                          <Layers className="w-4 h-4 text-blue-600" />
                          <span>Gallery Slider / Carousel</span>
                        </span>
                        {monetizeFormatTab === 'gallery' && (
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Multi-image top media carousel with headline, summary, and brand destination back-link.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Main 2-Column Layout: Form on Left, Mobile Emulator Preview on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  {/* Left Column: Form Fields (7 Cols) */}
                  <form onSubmit={handlePublishMonetizedArticle} className="lg:col-span-7 space-y-4">
                    {/* Brand Name and Landing URL Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Sponsor / Brand Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={monetizeBrand}
                          onChange={(e) => setMonetizeBrand(e.target.value)}
                          placeholder="Enter advertiser name"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Category / Tag
                        </label>
                        <select
                          value={monetizeCategory}
                          onChange={(e) => setMonetizeCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="Brand Spotlight">Brand Spotlight</option>
                          <option value="Sponsored Story">Sponsored Story</option>
                          <option value="Luxury Lookbook">Luxury Lookbook</option>
                          <option value="Exclusive Offer">Exclusive Offer</option>
                          <option value="Cinema Partner">Cinema Partner</option>
                          <option value="Celebrity & Pop Culture">Celebrity & Pop Culture</option>
                          <option value="Hot News">Hot News</option>
                        </select>
                      </div>
                    </div>

                    {/* Backlink URL & CTA Button Label Row */}
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                          <span>Brand Landing Back-Link Details</span>
                        </span>
                        {monetizeLandingUrl && monetizeLandingUrl.startsWith('http') && (
                          <a
                            href={monetizeLandingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline flex items-center gap-1"
                          >
                            <span>Test Landing Link</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Destination Landing / Back-Link URL <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="url"
                            required
                            value={monetizeLandingUrl}
                            onChange={(e) => setMonetizeLandingUrl(e.target.value)}
                            placeholder="https://www.brand-website.com/offer"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Landing CTA Button Label
                          </label>
                          <input
                            type="text"
                            value={monetizeCtaLabel}
                            onChange={(e) => setMonetizeCtaLabel(e.target.value)}
                            placeholder="Shop Collection / Explore Deals / Book Tickets"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Headline / Campaign Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          {monetizeFormatTab === 'full_gallery' ? 'Campaign Name / Internal Reference (Admin & Analytics Only)' : 'Article Headline'} <span className="text-rose-500">*</span>
                        </label>
                        <span className={`text-[11px] font-mono font-bold ${monetizeHeadline.length > 70 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {monetizeHeadline.length} / 80 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={80}
                        required={monetizeFormatTab !== 'full_gallery'}
                        value={monetizeHeadline}
                        onChange={(e) => setMonetizeHeadline(e.target.value)}
                        placeholder={monetizeFormatTab === 'full_gallery' ? 'Enter gallery headline' : 'Enter sponsored story headline'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Full Gallery Info / Text fields */}
                    {monetizeFormatTab === 'full_gallery' ? (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Full Image Lookbook Mode:</strong> Text summary and detailed story body are removed from the full image gallery format to provide a pure visual sponsored experience.</span>
                      </div>
                    ) : (
                      <>
                        {/* Card Summary - Full Area */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <label className="block text-xs font-bold text-slate-700">
                                Feed Card Summary / Caption *
                              </label>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                Limit: 190 chars
                              </span>
                            </div>
                            <span className={`text-[11px] font-mono font-bold ${monetizeSummary.length > 175 ? 'text-amber-600' : 'text-slate-500'}`}>
                              {monetizeSummary.length} / 190 chars
                            </span>
                          </div>
                          <textarea
                            rows={4}
                            maxLength={190}
                            value={monetizeSummary}
                            onChange={(e) => setMonetizeSummary(e.target.value)}
                            placeholder="Write your sponsored feed summary in Malayalam (Strict limit: 190 characters)..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 leading-relaxed resize-y min-h-[100px]"
                          />
                        </div>

                        {/* Full Article Content (for Standard Story format only) */}
                        {monetizeFormatTab === 'standard' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Full Promotional Story Body (Detailed reading view)
                            </label>
                            <textarea
                              rows={4}
                              value={monetizeFullContent}
                              onChange={(e) => setMonetizeFullContent(e.target.value)}
                              placeholder="Provide the complete brand article text with paragraphs, features, and brand overview..."
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Media Management (Gallery Photos or Feature Image) */}
                    {monetizeFormatTab === 'full_gallery' || monetizeFormatTab === 'gallery' ? (
                      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-bold text-slate-800">
                              Gallery Photos ({monetizeGalleryImages.length} / 10 max)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              ref={monetizeGalleryMultipleInputRef}
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleMonetizeMultipleGalleryUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => monetizeGalleryMultipleInputRef.current?.click()}
                              disabled={monetizeGalleryImages.length >= 10}
                              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Photos</span>
                            </button>
                          </div>
                        </div>

                        {/* Photo Grid Preview */}
                        <div className="grid grid-cols-5 gap-2 pt-1">
                          {monetizeGalleryImages.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-200">
                              <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-black">
                                #{idx + 1}
                              </div>
                              <button
                                type="button"
                                onClick={() => setMonetizeGalleryImages(monetizeGalleryImages.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {monetizeGalleryImages.length === 0 && (
                            <div className="col-span-5 py-6 text-center text-xs text-slate-400">
                              No photos added yet. Upload or add presets (up to 10 photos).
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-amber-600" />
                            <label className="block text-xs font-bold text-slate-800">
                              Feature Image & Media Upload
                            </label>
                          </div>
                          {monetizeRawImageFile && (
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{monetizeRawImageFile.name} ({(monetizeRawImageFile.size / 1024).toFixed(0)} KB)</span>
                            </span>
                          )}
                        </div>

                        {/* Raw Image Upload Button */}
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            ref={monetizeRawImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleMonetizeRawImageUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => monetizeRawImageInputRef.current?.click()}
                            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs hover:border-amber-400"
                          >
                            <Upload className="w-4 h-4 text-amber-600" />
                            <span>Upload Raw Image File</span>
                          </button>

                          <div className="flex-1 min-w-[200px]">
                            <input
                              type="url"
                              value={monetizeFeatureImage}
                              onChange={(e) => setMonetizeFeatureImage(e.target.value)}
                              placeholder="Or paste image URL (https://...)"
                              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                        </div>

                        {/* Image Preview & Presets */}
                        <div className="flex items-center gap-3 pt-1">
                          {monetizeFeatureImage && (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shrink-0 shadow-xs">
                              <img
                                src={monetizeFeatureImage}
                                alt="Feature Preview"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                        </div>
                      </div>
                    )}

                    {/* Submit and Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleResetMonetizeForm}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                      >
                        Reset
                      </button>

                      <button
                        type="submit"
                        disabled={monetizeIsSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-md shadow-amber-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {monetizeIsSaving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Publishing to Firestore...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 fill-black" />
                            <span>{editingMonetizeArticleId ? 'Update Sponsored Story' : 'Publish Sponsored Article to Feed'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Right Column: Live Mobile Emulator Preview (5 Cols) */}
                  <div className="lg:col-span-5 flex flex-col items-center bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                    <div className="w-full flex items-center justify-between mb-2 px-1">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-indigo-600" />
                        <span>Live Feed Card Preview</span>
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        {monetizeFormatTab === 'full_gallery' ? 'Full Gallery' : monetizeFormatTab === 'gallery' ? 'Slider' : 'Standard'}
                      </span>
                    </div>

                    <div className="w-full scale-95 origin-top">
                      <LiveMobileEmulator
                        headline={monetizeHeadline || 'Sponsored Story Headline'}
                        category={monetizeCategory}
                        summary={monetizeSummary || 'Promotional 60-word summary appears here.'}
                        fullContent={monetizeFullContent || monetizeSummary}
                        mediaType="image"
                        imageUrl={monetizeFormatTab === 'full_gallery' && monetizeGalleryImages.length > 0 ? monetizeGalleryImages[0] : monetizeFeatureImage}
                        author={`${monetizeBrand || 'Brand'} Desk`}
                        storyId="#SPON"
                        formatType={monetizeFormatTab}
                        galleryImages={monetizeGalleryImages}
                        isSponsored={true}
                        sponsorName={monetizeBrand}
                        ctaButtonLabel={monetizeCtaLabel}
                        redirectTargetUrl={monetizeLandingUrl}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Sponsored Articles in Feed List */}
                <div className="pt-6 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Live Sponsored Articles & Backlinks in Feed ({articles.filter(a => a.isSponsored || a.redirectTargetUrl || a.sponsorName).length}):</span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenMobileReader}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Live App Feed</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {articles
                      .filter(a => a.isSponsored || !!a.redirectTargetUrl || !!a.sponsorName)
                      .map((art) => (
                        <div
                          key={art.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={art.featureImage || (art.galleryImages && art.galleryImages[0]) || ''}
                              alt={art.title}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-black uppercase">
                                  {art.sponsorName || 'SPONSORED'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {art.type === 'full_gallery' ? 'Full Image Gallery (10-photo)' : art.type === 'gallery' ? 'Gallery Slider' : 'Standard Story'}
                                </span>
                              </div>
                              <h4 className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-2 mt-1">
                                {art.title}
                              </h4>
                              {art.redirectTargetUrl && (
                                <div className="text-[11px] text-amber-700 font-mono truncate mt-0.5">
                                  Backlink: {art.redirectTargetUrl}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2">
                              {art.redirectTargetUrl && (
                                <a
                                  href={art.redirectTargetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition-all"
                                >
                                  <span>{art.ctaButtonLabel || 'Visit Landing'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditMonetizedArticle(art)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit in Monetization Studio"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectArticleForReader) {
                                    onSelectArticleForReader(art.id);
                                  }
                                  onOpenMobileReader();
                                }}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Preview in App"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteArticle(art.id, art.title)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. SETTINGS SECTION */}
          {/* ========================================================================= */}
          {activeSection === 'settings' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  System Settings
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Role permissions, sidemenu arrangement, category hierarchy, 60-word rules, and Firestore synchronization
                </p>
              </div>

              {/* Admin Permissions & Sidemenu Reordering Control */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Role Permissions & Drag-and-Drop Sidemenu</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                          userRole === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {userRole === 'admin' ? 'Super Admin Mode' : 'Staff Editor Mode'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Drag and drop sidemenu ordering is restricted to Admin. Switch roles to test lockdown behavior.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleUserRole}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        userRole === 'admin'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-2xs'
                      }`}
                    >
                      {userRole === 'admin' ? 'Switch to Staff Editor (Lock Menu)' : 'Switch to Super Admin (Enable Drag)'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetMenuOrder}
                      className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Menu Order</span>
                    </button>
                  </div>
                </div>

                {/* Live Sidemenu Order List in Settings */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                    <span>Navigation Structure ({menuItems.length} Sections)</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {userRole === 'admin' ? 'Use Up/Down or drag handles in sidebar to arrange' : 'Reordering locked for non-admins'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {menuItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-mono font-bold text-slate-700 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.label}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {userRole === 'admin' ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveMenuItem(idx, 'up')}
                              className="p-1 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-30 text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed border border-slate-200"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === menuItems.length - 1}
                              onClick={() => handleMoveMenuItem(idx, 'down')}
                              className="p-1 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-30 text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed border border-slate-200"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Database Routing */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Database Routing</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Choose which data provider the app should use.
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wide ${
                    databaseMode === 'firebase'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}>
                    {databaseMode === 'firebase' ? 'Firebase active' : 'Local database active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    disabled={isDatabaseModeSaving || userRole !== 'admin'}
                    onClick={() => requestDatabaseModeChange('firebase')}
                    className={`rounded-lg px-3 py-2.5 text-xs font-black transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      databaseMode === 'firebase'
                        ? 'bg-white text-orange-700 shadow-sm border border-orange-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Firebase
                  </button>
                  <button
                    type="button"
                    disabled={isDatabaseModeSaving || userRole !== 'admin'}
                    onClick={() => requestDatabaseModeChange('local')}
                    className={`rounded-lg px-3 py-2.5 text-xs font-black transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      databaseMode === 'local'
                        ? 'bg-white text-sky-700 shadow-sm border border-sky-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Local Database
                  </button>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-400">
                  This setting is shared through <span className="font-bold text-slate-500">app_settings/global</span>. The local database service must be connected before local mode is used in production.
                </p>
              </div>

              {showDatabasePasswordModal && pendingDatabaseMode && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Admin verification</p>
                        <h3 className="mt-1 text-xl font-black text-slate-900">Authenticate switch</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDatabasePasswordModal(false);
                          setDatabaseModePassword('');
                          setDatabaseModePasswordError('');
                          setPendingDatabaseMode(null);
                        }}
                        className="rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                        aria-label="Close password prompt"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="mb-4 text-sm text-slate-600">
                      Enter the admin password to switch to <span className="font-bold text-slate-800">{pendingDatabaseMode === 'local' ? 'Local Database' : 'Firebase'}</span>.
                    </p>

                    <label className="block text-sm font-bold text-slate-800">
                      Authentication password
                      <input
                        type="password"
                        value={databaseModePassword}
                        onChange={(event) => {
                          setDatabaseModePassword(event.target.value);
                          if (databaseModePasswordError) setDatabaseModePasswordError('');
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
                        placeholder="Enter password"
                        autoFocus
                      />
                    </label>

                    {databaseModePasswordError && (
                      <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                        {databaseModePasswordError}
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDatabasePasswordModal(false);
                          setDatabaseModePassword('');
                          setDatabaseModePasswordError('');
                          setPendingDatabaseMode(null);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={confirmDatabaseModeChange}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
                      >
                        Confirm switch
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
