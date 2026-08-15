import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Share2,
  Home,
  Search,
  User,
  Bookmark,
  Star,
  Clapperboard,
  Newspaper,
  ExternalLink,
  Sun,
  Moon,
  RefreshCw,
  RotateCw,
  Sparkles,
  Film,
  ArrowRight
} from 'lucide-react';
import khalifaPoster from '../assets/images/khalifa_movie_poster_1786627482287.jpg';
import { ImageGallerySlider } from './ImageGallerySlider';
import { FullGalleryCard } from './FullGalleryCard';
import { GalleryArticleCard } from './GalleryArticleCard';
import { BackgroundArticleCard } from './BackgroundArticleCard';
import { MovieReviewCard } from './MovieReviewCard';
import { ArticleDetailView } from './ArticleDetailView';
import { AppSettingsModal } from './AppSettingsModal';
import { ProfileSection } from './ProfileSection';
import { ArticleData } from '../types';
import { subscribeToArticles } from '../lib/newsService';

interface FeedViewProps {
  onOpenLogin: () => void;
  isLoggedIn?: boolean;
}

const INITIAL_SHORT_ARTICLES: ArticleData[] = [
  {
    id: 'mohanlal-shajohn-news',
    type: 'news',
    title: "'ഇരിക്ക് മോനെ.. നിനക്കു ഞാൻ മേക്കപ്പ് ചെയ്തു തരാം'; ഷാജോണിന് മേക്കപ്പിട്ട് മോഹൻലാൽ",
    category: 'CINEMA',
    genres: ['Cinema', 'Malayalam'],
    featureImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop',
    rating: 'Trending',
    author: 'Cinema Bureau',
    date: '2m ago',
    summary:
      "നടൻ കലാഭവൻ ഷാജോണിന് മേക്കപ്പ് ചെയ്യുന്ന മോഹൻലാലിന്റെ ചിത്രങ്ങളാണ് ഇപ്പോൾ ശ്രദ്ധ നേടുന്നത്. മോഹൻലാലിനൊപ്പം ഒരു ഷോയിൽ പങ്കെടുക്കാൻ പോയപ്പോൾ തനിക്കുണ്ടായ മനോഹരമായ നിമിഷം എന്നു കുറിച്ചുകൊണ്ടാണ് ഷാജോൺ ചിത്രം പങ്കുവെച്ചിരിക്കുന്നത്. ഷോയ്ക്ക് പോയപ്പോ...",
  },
  {
    id: 'rashmika-wedding-background',
    type: 'background',
    title: 'rasmika weeding photos',
    category: 'CELEBRITY',
    genres: ['Fashion', 'Wedding', 'Photos'],
    featureImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop',
    rating: 'Viral Photos',
    author: 'Glamour Desk',
    date: '8m ago',
    summary: 'Viral wedding photos featuring Rashmika Mandanna in traditional silk saree and gold jewellery.',
  },
  {
    id: 'full-photo-gallery-10',
    type: 'gallery',
    title: "10 Photos: Traditional Bridal Couture & Heritage Gold Shoot",
    category: 'PHOTO GALLERY',
    genres: ['Fashion', 'Celebrity', 'Gallery'],
    featureImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop',
    rating: '10 Photos',
    author: 'Fashion Desk',
    date: '12m ago',
    summary: 'Exclusive 10-photo high resolution portrait gallery featuring traditional gold craftsmanship and celebrity bridal styling.',
  },
  {
    id: 'ipl-sports-malayalam',
    type: 'news',
    title: "ഇന്ത്യൻ പ്രീമിയർ ലീഗിൽ വൻ മാറ്റങ്ങൾ: പുതിയ റൂളുകൾ പ്രാബല്യത്തിൽ",
    category: 'SPORTS',
    genres: ['Cricket', 'IPL 2026'],
    featureImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1000&auto=format&fit=crop',
    rating: 'Hot News',
    author: 'Sports Tak',
    date: '15m ago',
    summary:
      "വരുന്ന സീസൺ മുതൽ വൻ മാറ്റങ്ങളോടെ ഐപിഎൽ ആവേശം വീണ്ടും വരുന്നു. ഇംപാക്ട് പ്ലെയർ നിയമത്തിലും ടോസ് സമയത്തും മാറ്റങ്ങൾ വരുത്താൻ പുതിയ തീരുമാനമായിട്ടുണ്ട്.",
  },
  {
    id: 'mohanlal-cinema-malayalam',
    type: 'news',
    title: "മോഹൻലാലുമായി പുതിയ ചിത്രം പ്രഖ്യാപിച്ച് പ്രമുഖ സംവിധായകൻ",
    category: 'ENTERTAINMENT',
    genres: ['Cinema', 'Malayalam'],
    featureImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop',
    rating: 'Breaking',
    author: 'Cinema Express',
    date: '25m ago',
    summary:
      "പ്രേക്ഷകർ ഒന്നടങ്കം കാത്തിരുന്ന ആ വമ്പൻ അനൗൺസ്മെന്റ് ഒടുവിൽ എത്തി. റിക്കോർഡ് ബജറ്റിലൊരുങ്ങുന്ന പാാൻ ഇന്ത്യൻ ആക്ഷൻ ബിഗ് ബജറ്റ് ചിത്രമായിരിക്കും ഇത്.",
  },
  {
    id: 'ai-tech-malayalam',
    type: 'news',
    title: "ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസിൽ പുതിയ മുന്നേറ്റവുമായി ടെക് ലോകം",
    category: 'TECHNOLOGY',
    genres: ['AI', 'Tech'],
    featureImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
    rating: 'Top Tech',
    author: 'Tech Crunch',
    date: '40m ago',
    summary:
      "മനുഷ്യന്റെ ദൈനംദിന ജോലികളെ അതിവേഗം ലളിതമാക്കാൻ കഴിവുള്ള പുതിയ AI മോഡലുകൾ വിപണിയിൽ അവതരിപ്പിച്ചു. സാങ്കേതിക വിദ്യയിലെ പ്രധാന മാറ്റമാണിതെന്ന് വിദഗ്ധർ.",
  },
  {
    id: 'khalifa-movie',
    type: 'movie',
    title: "'ഖലീഫ' (Khalifa) Movie Review",
    category: 'Cinema',
    genres: ['Mass Action', 'Drama'],
    featureImage: khalifaPoster,
    director: 'Vysakh',
    cast: 'Unni Mukundan, Siddique, Lena',
    musicDirector: 'Jakes Bejoy',
    cinematography: 'Shaji Kumar',
    date: '1h ago',
    year: '2026',
    duration: '2h 30m',
    runtime: '2h 30m',
    certificate: 'U/A 16+',
    summary:
      "അധികാരത്തിന്റെയും പ്രതികാരത്തിന്റെയും പശ്ചാത്തലത്തിൽ ദുബായിലും കേരളത്തിലുമായി നടക്കുന്ന ഒരു ഹൈ-വോൾട്ടേജ് മാസ് ആക്ഷൻ ത്രില്ലറാണ് ഖലീഫ. കുടുംബ ബന്ധങ്ങളും അതിജീവന പോരാട്ടവും ചിത്രത്തിന്റെ കരുത്താകുന്നു.",
  },
  {
    id: 'space-standard-news',
    type: 'news',
    title: "Global Space Agency Prepares Artemis IV Lunar Habitat Launch",
    category: 'WORLD & SCIENCE',
    genres: ['Space', 'Science'],
    featureImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
    rating: 'Global News',
    author: 'Science Desk',
    date: '1h 30m ago',
    summary:
      "Engineers have successfully completed final pressure testing on the lunar surface habitat module. Artemis IV is scheduled for launch late next month, marking humanity's longest planned stay on the Moon.",
  },
  {
    id: 'khalifa-gallery',
    type: 'gallery',
    title: "10-Photo Gallery: 'Khalifa' Dubai Desert Shooting",
    category: 'Photo Gallery',
    featureImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
    rating: '10 Photos',
    date: '2h 20m ago',
    summary:
      "Explore 10 high-resolution exclusive stills, camera setups, and desert chase sequence photos directly from the production sets of 'Khalifa'.",
  },
  {
    id: 'coolie-movie',
    type: 'movie',
    title: "'Coolie' Movie Review & Teaser First Look",
    category: 'Cinema',
    genres: ['Action', 'Thriller'],
    featureImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
    director: 'Lokesh Kanagaraj',
    cast: 'Rajinikanth, Nagarjuna, Soubin Shahir',
    musicDirector: 'Anirudh Ravichander',
    cinematography: 'Girish Gangadharan',
    year: '2026',
    duration: '2h 45m',
    runtime: '2h 45m',
    certificate: 'U/A',
    date: '3h ago',
    summary:
      "സൂപ്പർസ്റ്റാർ രജനികാന്തും ലോകേഷ് കനകരാജും ഒന്നിക്കുന്ന 'കൂലി'യുടെ ടീസർ പുറത്തിറങ്ങി. അനിരുദ്ധിന്റെ പശ്ചാത്തല സംഗീതവും സ്വർണ്ണക്കടത്തിന്റെ പശ്ചാത്തലത്തിലുള്ള ആക്ഷൻ രംഗങ്ങളും തികച്ചും മാസ് അനുഭവം നൽകുന്നു.",
  },
  {
    id: 'sports-standard-news',
    type: 'news',
    title: "Champions League: Extra-Time Volley Seals Historic Comeback Win",
    category: 'Sports',
    genres: ['Football', 'Sports'],
    featureImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000&auto=format&fit=crop',
    rating: 'Breaking Sports',
    author: 'Sports Desk',
    date: '3h 45m ago',
    summary:
      "In a thrilling night of European football, an underdog squad overturned a two-goal deficit in stoppage time before clinching victory with a stunning 30-yard volley in extra time.",
  },
  {
    id: 'empuraan-movie',
    type: 'movie',
    title: "'Empuraan' (L2) Movie Review & Schedule Wrap",
    category: 'Cinema',
    genres: ['Political', 'Action'],
    featureImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop',
    director: 'Prithviraj Sukumaran',
    cast: 'Mohanlal, Prithviraj, Manju Warrier, Tovino Thomas',
    musicDirector: 'Deepak Dev',
    cinematography: 'Sujith Vaassudev',
    year: '2026',
    duration: '2h 50m',
    runtime: '2h 50m',
    certificate: 'U/A',
    date: '4h ago',
    summary:
      "ലൂസിഫറിന്റെ രണ്ടാം ഭാഗമായ 'എമ്പുരാൻ' അന്താരാഷ്ട്ര ചിത്രീകരണ ഷെഡ്യൂളുകൾ പൂർത്തിയാക്കി. മോഹൻലാൽ-പൃഥ്വിരാജ് കൂട്ടുകെട്ടിൽ ഒരുങ്ങുന്ന ചിത്രം വലിയ പ്രതീക്ഷകളോടെയാണ് പ്രേക്ഷകർ കാത്തിരിക്കുന്നത്.",
  },
  {
    id: 'eco-standard-news',
    type: 'news',
    title: "Green Energy Milestone: Solar & Wind Power Cross 60% of National Grid Supply",
    category: 'Environment',
    genres: ['Green Tech', 'Policy'],
    featureImage: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=1000&auto=format&fit=crop',
    rating: 'Top Story',
    author: 'Climate Bureau',
    date: '5h ago',
    summary:
      "New grid statistics show renewable energy generation hit an all-time high this quarter, driven by expanded offshore wind parks and residential solar adoption across key industrial states.",
  },
];

export const FeedView: React.FC<FeedViewProps> = ({ onOpenLogin, isLoggedIn = false }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'profile'>('home');
  const [articlesList, setArticlesList] = useState<ArticleData[]>(INITIAL_SHORT_ARTICLES);

  // Real-time synchronization with Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeToArticles((data) => {
      if (data && data.length > 0) {
        setArticlesList(data);
      }
    });
    return () => unsubscribe();
  }, []);
  const [currentArticleIndex, setCurrentArticleIndex] = useState<number>(0);
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isWhiteMode, setIsWhiteMode] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadToast, setReloadToast] = useState<string | null>(null);

  // Velocity-aware swipe state & drag physics
  const [slideDirection, setSlideDirection] = useState<number>(1); // 1 = swipe up (next), -1 = swipe down (prev)
  const [animSpeed, setAnimSpeed] = useState<number>(0.3); // Dynamic animation duration in seconds
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isMouseDown = useRef<boolean>(false);
  const mouseStartY = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const mouseStartTime = useRef<number>(0);
  const wheelCooldown = useRef<boolean>(false);

  const currentArticle = articlesList[currentArticleIndex] || articlesList[0];
  const prevArticle = articlesList[(currentArticleIndex - 1 + articlesList.length) % articlesList.length];
  const nextArticle = articlesList[(currentArticleIndex + 1) % articlesList.length];

  const renderArticleCard = (article: typeof currentArticle) => {
    const handleArticleClick = () => {
      if (article.redirectTargetUrl) {
        window.open(article.redirectTargetUrl, '_blank', 'noopener,noreferrer');
      } else {
        setSelectedArticle(article);
      }
    };

    const handleHeadlineClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (article.redirectTargetUrl) {
        window.open(article.redirectTargetUrl, '_blank', 'noopener,noreferrer');
      } else {
        setSelectedArticle(article);
      }
    };

    if (article.type === 'background') {
      return (
        <BackgroundArticleCard
          image={article.featureImage}
          title={article.title}
          publishedTime={article.date || '15m ago'}
          isWhiteMode={isWhiteMode}
          onShare={handleShare}
          onSelect={handleArticleClick}
          isSponsored={article.isSponsored || !!article.redirectTargetUrl}
          sponsorName={article.sponsorName}
          ctaButtonLabel={article.ctaButtonLabel}
          redirectTargetUrl={article.redirectTargetUrl}
        />
      );
    }
    if (article.type === 'full_gallery') {
      return (
        <FullGalleryCard
          images={article.galleryImages && article.galleryImages.length > 0 ? article.galleryImages : (article.featureImage ? [article.featureImage] : undefined)}
          publishedTime={article.date || '20m ago'}
          isWhiteMode={isWhiteMode}
          onShare={handleShare}
          title={article.title}
          isSponsored={article.isSponsored || !!article.redirectTargetUrl}
          sponsorName={article.sponsorName}
          ctaButtonLabel={article.ctaButtonLabel}
          redirectTargetUrl={article.redirectTargetUrl}
          badgeTag={article.badgeTag}
        />
      );
    }
    if (article.type === 'gallery') {
      return (
        <GalleryArticleCard
          images={article.galleryImages && article.galleryImages.length > 0 ? article.galleryImages : (article.featureImage ? [article.featureImage] : undefined)}
          featureImage={article.featureImage}
          title={article.title}
          summary={article.summary}
          category={article.category}
          publishedTime={article.date || '20m ago'}
          isWhiteMode={isWhiteMode}
          headerOverlay={article.headerOverlay !== false}
          onShare={handleShare}
          onSelect={handleArticleClick}
          isSponsored={article.isSponsored || !!article.redirectTargetUrl}
          sponsorName={article.sponsorName}
          ctaButtonLabel={article.ctaButtonLabel}
          redirectTargetUrl={article.redirectTargetUrl}
          badgeTag={article.badgeTag}
        />
      );
    }
    if (article.type === 'movie' || article.type === 'movie_review') {
      return (
        <MovieReviewCard
          article={article}
          isWhiteMode={isWhiteMode}
          onShare={handleShare}
          onSelect={handleArticleClick}
        />
      );
    }
    return (
        <div
          className={`rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col flex-1 h-full select-none ${
            isWhiteMode ? 'bg-white text-slate-900' : 'bg-black text-white'
          }`}
          style={{ backgroundColor: isWhiteMode ? '#ffffff' : '#000000' }}
        >
          {/* Top 40%: Feature Image Container */}
          <div className="relative w-full h-[40%] min-h-[180px] max-h-[260px] rounded-t-[28px] sm:rounded-t-[32px] overflow-hidden bg-zinc-900 shrink-0 shadow-sm">
            <img
              src={article.featureImage}
              alt={article.title}
              className="w-full h-full object-cover pointer-events-none"
            />
            <div
              className={`absolute inset-0 pointer-events-none ${
                isWhiteMode
                  ? 'hidden'
                  : 'bg-gradient-to-t from-black/90 via-transparent to-black/40'
              }`}
            />

            {/* Top Right Share */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                  isWhiteMode
                    ? 'bg-white/95 hover:bg-white text-slate-800 shadow-sm'
                    : 'bg-black/80 hover:bg-black text-white border border-white/20'
                }`}
                title="Share Story"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom 60%: Story Header (Date & Tap-to-Read Headline) + Non-touchable Story Body */}
          <div
            className={`p-4 sm:p-5 flex-1 flex flex-col justify-start space-y-1.5 sm:space-y-2 overflow-y-auto no-scrollbar ${
              isWhiteMode ? 'bg-white text-slate-900' : 'bg-black text-white'
            }`}
            style={{ backgroundColor: isWhiteMode ? '#ffffff' : '#000000' }}
          >
            {/* Story Header (Published time & Interactive Tap/Touch Headline) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p
                  className={`text-[10px] sm:text-[11px] tracking-wider ${
                    isWhiteMode ? 'text-zinc-500 font-medium' : 'text-zinc-400 font-thin'
                  }`}
                >
                  {article.date || '12m ago'}
                </p>
              </div>

              {/* Clean Bold Headline with Tap/Touch to Open Detailed Article or Partner URL */}
              <h2
                onClick={handleHeadlineClick}
                className={`text-base sm:text-lg font-extrabold leading-snug tracking-tight transition-all cursor-pointer select-none active:opacity-75 ${
                  isWhiteMode ? 'text-slate-900 hover:text-indigo-600' : 'text-white hover:text-emerald-300'
                }`}
                title="Tap headline to read full story"
              >
                {article.title}
              </h2>
            </div>

            {/* Story Body Summary Text (No click/touch to open) */}
            <p
              className={`text-sm sm:text-base leading-relaxed pt-0.5 whitespace-pre-line cursor-default ${
                isWhiteMode ? 'text-slate-700' : 'text-zinc-300'
              }`}
            >
              {article.summary}
            </p>
          </div>
        </div>
      );
    };

  const isFeedCompleted = currentArticleIndex >= articlesList.length - 1;

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = performance.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;
    if (delta > 0) {
      // If at beginning and not completed, rubber band
      if (currentArticleIndex === 0 && !isFeedCompleted) {
        setDragY(Math.min(50, delta * 0.25));
      } else if (isFeedCompleted) {
        // Dragging down to reload when feed is completed
        setDragY(Math.min(95, delta * 0.45));
      } else {
        // Dragging down to reveal previous story
        setDragY(delta);
      }
    } else {
      // Dragging up to reveal next story
      setDragY(delta);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchEndY - touchStartY.current;
    const deltaX = touchEndX - (touchStartX.current || 0);
    const duration = Math.max(performance.now() - touchStartTime.current, 1);
    const velocityY = Math.abs(deltaY) / duration; // px/ms
    const velocityX = Math.abs(deltaX) / duration;

    // Check for Horizontal Swipe to trigger sponsor link if present
    if (deltaX < -45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
      if (currentArticle && currentArticle.redirectTargetUrl) {
        window.open(currentArticle.redirectTargetUrl, '_blank', 'noopener,noreferrer');
      }
      touchStartY.current = null;
      touchStartX.current = null;
      setIsDragging(false);
      setDragY(0);
      return;
    }

    processSwipeGesture(deltaY, velocityY);

    touchStartY.current = null;
    touchStartX.current = null;
    setIsDragging(false);
    setDragY(0);
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDown.current = true;
    mouseStartY.current = e.clientY;
    mouseStartX.current = e.clientX;
    mouseStartTime.current = performance.now();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current || mouseStartY.current === null) return;
    const delta = e.clientY - mouseStartY.current;
    if (delta > 0) {
      if (currentArticleIndex === 0 && !isFeedCompleted) {
        setDragY(Math.min(50, delta * 0.25));
      } else if (isFeedCompleted) {
        setDragY(Math.min(95, delta * 0.45));
      } else {
        setDragY(delta);
      }
    } else {
      setDragY(delta);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDown.current || mouseStartY.current === null) return;
    isMouseDown.current = false;
    const deltaY = e.clientY - mouseStartY.current;
    const deltaX = e.clientX - (mouseStartX.current || 0);
    const duration = Math.max(performance.now() - mouseStartTime.current, 1);
    const velocityY = Math.abs(deltaY) / duration; // px/ms

    // Check for Horizontal swipe on desktop drag
    if (deltaX < -60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (currentArticle && currentArticle.redirectTargetUrl) {
        window.open(currentArticle.redirectTargetUrl, '_blank', 'noopener,noreferrer');
      }
      mouseStartY.current = null;
      mouseStartX.current = null;
      setIsDragging(false);
      setDragY(0);
      return;
    }

    processSwipeGesture(deltaY, velocityY);

    mouseStartY.current = null;
    mouseStartX.current = null;
    setIsDragging(false);
    setDragY(0);
  };

  // Wheel Handler
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelCooldown.current) return;
    const deltaY = e.deltaY;
    if (Math.abs(deltaY) > 25) {
      wheelCooldown.current = true;
      const velocity = Math.abs(deltaY) / 100;
      const calculatedDuration = Math.max(0.18, Math.min(0.38, 0.32 / Math.max(velocity, 0.5)));
      setAnimSpeed(calculatedDuration);

      if (deltaY > 0) {
        // Wheel down -> Next story
        setSlideDirection(1);
        handleNextArticle();
      } else {
        // Wheel up -> Previous story if index > 0, or drag and load if feed completed
        if (currentArticleIndex > 0) {
          setSlideDirection(-1);
          handlePrevArticle();
        } else if (isFeedCompleted) {
          handleReloadFeed('New stories loaded!');
        }
      }

      setTimeout(() => {
        wheelCooldown.current = false;
      }, 380);
    }
  };

  // Velocity-based decision logic
  const processSwipeGesture = (deltaY: number, velocity: number) => {
    const isFlick = velocity > 0.3;
    const threshold = isFlick ? 20 : 50;

    const calculatedDuration = Math.max(
      0.16,
      Math.min(0.42, 0.35 / (velocity > 0 ? Math.max(velocity, 0.4) : 1))
    );

    setAnimSpeed(calculatedDuration);

    if (deltaY > threshold) {
      // Swiping DOWN
      if (currentArticleIndex > 0) {
        // Go to previous article
        setSlideDirection(-1);
        handlePrevArticle();
      } else if (isFeedCompleted && deltaY > 35) {
        // Drag & Load ONLY when all stories completed from user feed
        handleReloadFeed('New stories loaded!');
      }
    } else if (deltaY < -threshold) {
      // Swiping UP -> Next Article
      setSlideDirection(1);
      handleNextArticle();
    }
  };

  const handleNextArticle = () => {
    if (currentArticleIndex < articlesList.length - 1) {
      setCurrentArticleIndex((prev) => prev + 1);
    } else {
      loadMoreStories();
    }
  };

  const handlePrevArticle = () => {
    if (currentArticleIndex > 0) {
      setCurrentArticleIndex((prev) => prev - 1);
    }
  };

  const loadMoreStories = () => {
    const timestamp = Date.now();
    const moreStories: ArticleData[] = [
      {
        id: `more-news-${timestamp}-1`,
        type: 'news',
        title: "കേരളത്തിൽ സ്റ്റാർട്ടപ്പുകൾക്ക് വൻ നിക്ഷേപം: $50M പുതിയ ഫണ്ട് പ്രഖ്യാപിച്ചു",
        category: 'BUSINESS',
        genres: ['Kerala', 'Startups'],
        featureImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=1000&auto=format&fit=crop',
        rating: 'Investment News',
        author: 'Business Bureau',
        date: '5 mins ago',
        summary:
          "സാങ്കേതികവിദ്യ, ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസ് മേഖലയിൽ പ്രവർത്തിക്കുന്ന മലയാളി സ്റ്റാർട്ടപ്പുകൾക്ക് കരുത്തേകാൻ പുതിയ വെഞ്ച്വർ ഫണ്ട് രൂപീകരിച്ചു.",
      },
      {
        id: `more-movie-${timestamp}-2`,
        type: 'movie',
        title: "'ലോകാ' (Lokah) Mass Teaser & Movie Review",
        category: 'Cinema',
        genres: ['Action', 'Epic'],
        featureImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1000&auto=format&fit=crop',
        director: 'Midhun Manuel Thomas',
        rating: '9.3 / 10',
        year: '2026',
        duration: '2h 35m',
        votesCount: '1.8k votes logged',
        summary:
          "The grand cinematic teaser for Lokah breaks social media viewing records with over 20 Million views in under 24 hours.",
      },
      {
        id: `more-news-${timestamp}-4`,
        type: 'news',
        title: "Global Economy: Markets Rally as Inflation Drops to 3-Year Low",
        category: 'Economy',
        genres: ['Finance', 'Markets'],
        featureImage: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1000&auto=format&fit=crop',
        rating: 'Market Watch',
        author: 'Financial Times',
        date: 'Just now',
        summary:
          "Central banks signal potential rate cuts following cooler consumer price index data, driving major indices higher across European and Asian markets.",
      },
      {
        id: `more-tech-${timestamp}-5`,
        type: 'news',
        title: "Next-Gen Solid State Batteries Reach Commercial Production Milestone",
        category: 'TECHNOLOGY',
        genres: ['EV', 'Tech'],
        featureImage: 'https://images.unsplash.com/photo-1558441719-670b357021bc?q=80&w=1000&auto=format&fit=crop',
        rating: 'EV Tech',
        author: 'Tech Desk',
        date: '15 mins ago',
        summary:
          "EV battery makers announce 1,000 km range solid-state packs rolling out in late 2026 models with sub-10 minute rapid charging support.",
      },
    ];

    setArticlesList((prev) => [...prev, ...moreStories]);
    setCurrentArticleIndex((prev) => prev + 1);
  };

  const handleReloadFeed = (toastMessage?: string) => {
    setIsReloading(true);
    setTimeout(() => {
      const timestamp = Date.now();
      const STORIES_POOL: Omit<ArticleData, 'id'>[] = [
        {
          type: 'news',
          title: "മലയാള സിനിമയിൽ എഐ റെവല്യൂഷൻ: വൻ പ്രോജക്റ്റുകൾ പ്രഖ്യാപിച്ചു",
          category: 'CINEMA & TECH',
          genres: ['Cinema', 'AI'],
          featureImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop',
          rating: 'Breaking News',
          author: 'Uproll Bureau',
          date: 'Just now',
          summary:
            "വിഷ്വൽ ഇഫക്റ്റുകളിലും പോസ്റ്റ് പ്രൊഡക്ഷനിലും വിപ്ലവകരമായ മാറ്റങ്ങൾ സൃഷ്ടിച്ച് പുതിയ ഇന്ത്യൻ സിനിമാ പ്രോജക്റ്റുകൾ വരുന്നു.",
        },
        {
          type: 'news',
          title: "ഐപിഎൽ വൻ അപ്‌ഡേറ്റ്: സഞ്ജു സാംസൺ പുതിയ ചരിത്ര നേട്ടത്തിലേക്ക്",
          category: 'SPORTS',
          genres: ['Cricket', 'IPL'],
          featureImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1000&auto=format&fit=crop',
          rating: 'Live Update',
          author: 'Sports Desk',
          date: 'Just now',
          summary:
            "ട്വന്റി20 ക്രിക്കറ്റിൽ തകർപ്പൻ ഫോമിൽ തുടരുന്ന മലയാളി ക്യാപ്റ്റൻ പുതിയ വ്യക്തിഗത നാഴികക്കല്ല് മറികടന്നു.",
        },
        {
          type: 'news',
          title: "ആഗോള സോളാർ എനർജി മിഷൻ: വൻതോതിലുള്ള പച്ചപ്പും ഹരിത ഊർജ്ജ പദ്ധതികളും",
          category: 'WORLD & TECH',
          genres: ['Green Tech', 'World'],
          featureImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
          rating: 'Eco Alert',
          author: 'Global Bureau',
          date: 'Just now',
          summary:
            "ശുദ്ധ ഊർജ്ജ ഉൽപ്പാദനത്തിൽ ഏഷ്യൻ രാജ്യങ്ങൾ പുതിയ റിക്കോർഡ് സ്ഥാപിച്ചു. പരിസ്ഥിതി സൗഹൃദ ഗതാഗത സംവിധാനങ്ങൾ വ്യാപകമാകുന്നു.",
        },
      ];

      const chosenStoryTemplate = STORIES_POOL[Math.floor(Math.random() * STORIES_POOL.length)];
      const freshNews: ArticleData = {
        ...chosenStoryTemplate,
        id: `fresh-news-${timestamp}`,
      };

      setArticlesList((prev) => [freshNews, ...prev]);
      setCurrentArticleIndex(0);
      setIsReloading(false);
      setReloadToast(toastMessage || 'New story loaded!');

      setTimeout(() => {
        setReloadToast(null);
      }, 3500);
    }, 600);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentArticle.title,
        text: currentArticle.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (selectedArticle) {
    return (
      <ArticleDetailView
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
        onOpenLogin={onOpenLogin}
        isWhiteMode={isWhiteMode}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between min-h-full animate-fade-in relative overflow-hidden font-sans bg-black text-white">
      {/* App Settings Modal (Screenshot 1) */}
      <AppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isWhiteMode={isWhiteMode}
        onToggleWhiteMode={setIsWhiteMode}
      />

      {/* Top Controls: Theme Toggle & Settings Gear */}
      <div className="pt-3 px-4 flex items-center justify-between z-20 backdrop-blur-md pb-2 bg-black/80 text-white border-b border-zinc-900/60">
        <button
          onClick={() => setIsWhiteMode(!isWhiteMode)}
          className="px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm cursor-pointer border bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800 active:scale-95"
          title="Toggle White Card Theme"
        >
          {isWhiteMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>White Card</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Dark Card</span>
            </>
          )}
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-sm bg-black text-white border-zinc-800 hover:bg-zinc-900 active:scale-95"
          title="Open App Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area - Touch Swipable Card */}
      <div className="flex-1 flex flex-col relative overflow-hidden pb-[60px]">
        {activeTab === 'home' && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isMouseDown.current) {
                isMouseDown.current = false;
                setIsDragging(false);
                setDragY(0);
              }
            }}
            onWheel={handleWheel}
            className="flex-1 flex flex-col px-1 py-2 sm:px-1.5 sm:py-2.5 overflow-hidden cursor-grab active:cursor-grabbing select-none relative touch-pan-x w-full h-full"
          >
            {/* Underneath Deck Card - Stationed directly under the top card */}
            <div
              className="absolute inset-x-1 sm:inset-x-1.5 top-2 sm:top-2.5 bottom-2 sm:bottom-2.5 flex flex-col justify-start z-0 pointer-events-none will-change-transform"
              style={{
                transform: `scale(${isDragging ? Math.min(1, 0.95 + (Math.abs(dragY) / 600) * 0.05) : 0.95})`,
                opacity: isDragging ? Math.min(1, 0.88 + (Math.abs(dragY) / 350) * 0.12) : 0.88,
                filter: isDragging ? `brightness(${Math.min(1, 0.9 + (Math.abs(dragY) / 600) * 0.1)})` : 'brightness(0.9)',
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease, filter 0.3s ease',
              }}
            >
              {renderArticleCard(isDragging && dragY > 0 && currentArticleIndex > 0 ? prevArticle : nextArticle)}
            </div>

            <AnimatePresence custom={slideDirection} initial={false} mode="popLayout">
              <motion.div
                key={currentArticleIndex}
                custom={slideDirection}
                variants={{
                  initial: (direction: number) => ({
                    // Swipe UP (direction 1): lower card appears underneath/from bottom
                    // Swipe DOWN (direction -1): previous card smoothly comes from top
                    y: direction === 1 ? '100%' : '-100%',
                    scale: 0.96,
                    opacity: 0.85,
                    zIndex: 20,
                  }),
                  animate: {
                    y: isDragging ? `${dragY}px` : '0%',
                    scale: isDragging && dragY > 0 && currentArticleIndex === 0 && !isFeedCompleted ? Math.max(0.96, 1 - dragY / 800) : 1,
                    opacity: 1,
                    zIndex: 20,
                    transition: isDragging
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 420,
                          damping: 32,
                          mass: 0.55,
                        },
                  },
                  exit: (direction: number) => ({
                    // Swipe UP (direction 1): current card peels UP off the screen
                    // Swipe DOWN (direction -1): current card moves down off the screen
                    y: direction === 1 ? '-100%' : '100%',
                    scale: 0.96,
                    opacity: 0.5,
                    zIndex: direction === 1 ? 25 : 10,
                    transition: {
                      type: 'spring',
                      stiffness: 420,
                      damping: 32,
                      mass: 0.55,
                    },
                  }),
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-x-1 sm:inset-x-1.5 top-2 sm:top-2.5 bottom-2 sm:bottom-2.5 flex flex-col justify-start z-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] rounded-[28px] sm:rounded-[32px] overflow-hidden"
              >
                {renderArticleCard(currentArticle)}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="p-4 space-y-4">
            <h2
              className={`text-base font-extrabold ${
                isWhiteMode ? 'text-slate-900' : 'text-white'
              }`}
            >
              Search News Shorts
            </h2>
            <div
              className={`rounded-full px-4 py-3 flex items-center gap-2 border ${
                isWhiteMode
                  ? 'bg-white border-slate-300 text-slate-900'
                  : 'bg-zinc-900 border-zinc-800 text-white'
              }`}
            >
              <Search
                className={`w-4 h-4 ${
                  isWhiteMode ? 'text-slate-400' : 'text-zinc-400'
                }`}
              />
              <input
                type="text"
                placeholder="Search news, movies, polls, galleries..."
                className={`bg-transparent text-xs focus:outline-none w-full ${
                  isWhiteMode
                    ? 'text-slate-900 placeholder-slate-400'
                    : 'text-white placeholder-zinc-500'
                }`}
              />
            </div>
          </div>
        )}

        {/* Profile Tab (Matching Screenshot 2) */}
        {activeTab === 'profile' && (
          <ProfileSection
            onClose={() => setActiveTab('home')}
            isWhiteMode={isWhiteMode}
            onToggleWhiteMode={setIsWhiteMode}
            onLogout={onOpenLogin}
          />
        )}
      </div>

      {/* Drag & Reload Top Floating Indicator Bar - only enabled when all stories completed from user feed */}
      <div className="absolute top-[52px] inset-x-0 z-30 flex flex-col items-center pointer-events-none px-4">
        <AnimatePresence>
          {(isDragging && dragY > 20 && isFeedCompleted) || isReloading || reloadToast || isFeedCompleted ? (
            <motion.div
              initial={{ y: -40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full shadow-2xl border backdrop-blur-xl ${
                isWhiteMode
                  ? 'bg-white/95 text-slate-900 border-slate-300 shadow-slate-400/30'
                  : 'bg-zinc-900/95 text-white border-zinc-700 shadow-black/80'
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 text-emerald-400 shrink-0 ${
                  isReloading || (isFeedCompleted && dragY > 35) ? 'animate-spin' : ''
                }`}
              />
              <span className="text-[11px] font-extrabold tracking-tight">
                {reloadToast ? (
                  reloadToast
                ) : isReloading ? (
                  'Updating News Feed...'
                ) : isFeedCompleted && dragY > 35 ? (
                  'Release to load new stories!'
                ) : isFeedCompleted && dragY > 0 ? (
                  'Pull down to reload fresh stories...'
                ) : (
                  'All stories caught up • Pull down or tap to reload'
                )}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReloadFeed('New stories loaded!');
                }}
                className="ml-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-black hover:bg-emerald-400 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 flex items-center gap-1"
              >
                <RotateCw className={`w-3 h-3 ${isReloading ? 'animate-spin' : ''}`} />
                <span>{isReloading ? 'Loading...' : 'Reload'}</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Bar - ALWAYS BLACK & ALL ICONS ALWAYS WHITE */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-black border-none py-2.5 px-8 flex items-center justify-around text-white">
        <button
          onClick={() => {
            setActiveTab('home');
          }}
          className="flex flex-col items-center gap-1 cursor-pointer group"
          aria-label="Home"
        >
          <Home className="w-5 h-5 text-white" />
          <div
            className={`w-5 h-0.5 rounded-full transition-all bg-white ${
              activeTab === 'home' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
          />
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className="flex flex-col items-center gap-1 cursor-pointer group"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-white" />
          <div
            className={`w-5 h-0.5 rounded-full transition-all bg-white ${
              activeTab === 'search' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
          />
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className="flex flex-col items-center gap-1 cursor-pointer group"
          aria-label="Profile"
        >
          <User className="w-5 h-5 text-white" />
          <div
            className={`w-5 h-0.5 rounded-full transition-all bg-white ${
              activeTab === 'profile' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
