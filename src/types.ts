export type AppScreen = 'landing' | 'phone_entry' | 'otp_modal' | 'complete_modal' | 'feed' | 'dashboard';

export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
];

export interface ArticleData {
  id: string;
  type?: 'movie' | 'movie_review' | 'news' | 'gallery' | 'full_gallery' | 'background' | 'reels' | 'poll' | 'quiz' | 'ask_reader';
  title: string;
  category: string;
  genres?: string[];
  featureImage: string;
  summary: string;
  fullContent?: string;
  videoUrl?: string;
  detailImage?: string;
  priority?: string;
  galleryImages?: string[];
  isPushNotification?: boolean;
  director?: string;
  author?: string;
  date?: string;
  rating?: string;
  verdict?: string;
  starRating?: number;
  cast?: string;
  musicDirector?: string;
  cinematography?: string;
  runtime?: string;
  certificate?: string;
  positives?: string[];
  negatives?: string[];
  trailerUrl?: string;
  year?: string;
  duration?: string;
  votesCount?: string;
  badgeTag?: string;
  headerOverlay?: boolean;
  isSponsored?: boolean;
  sponsorName?: string;
  ctaButtonLabel?: string;
  redirectTargetUrl?: string;
  monetizationType?: 'full_image' | 'gallery' | 'standard' | 'ad_article';
  brandLogoUrl?: string;
  choiceOptions?: any[];
  cardThemeColor?: string;
  status?: string;
  isPinned?: boolean;
  audienceReviews?: {
    id: string;
    author: string;
    comment: string;
    date: string;
    likes: number;
    dislikes: number;
    rating?: number;
    timestamp?: number;
  }[];
  audienceRatingsCount?: number;
}
