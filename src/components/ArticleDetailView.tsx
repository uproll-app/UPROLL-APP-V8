import React, { useState } from 'react';
import { ArrowLeft, Share2, Bookmark, Heart, Clock, User, MessageCircle, Tag, Eye, Film, Megaphone, CheckCircle2 } from 'lucide-react';
import { ImdbMovieReviewSection } from './ImdbMovieReviewSection';
import { InteractivePoll } from './InteractivePoll';
import { ImageGallerySlider } from './ImageGallerySlider';

export interface ArticleData {
  id: string;
  type?: 'movie' | 'movie_review' | 'news' | 'poll' | 'gallery' | 'full_gallery' | 'background' | 'quiz' | 'reels' | 'ask_reader';
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
  pollQuestion?: string;
  pollOptions?: { id: string; text: string; votes: number }[];
  quizQuestion?: string;
  quizOptions?: { id: string; text: string }[];
  quizCorrectId?: string;
  quizExplanation?: string;
  cardThemeColor?: string;
  cardCoverImage?: string;
  badgeTag?: string;
  headerOverlay?: boolean;
  choiceOptions?: string[] | { id: string; text: string; votes?: number }[];
  readerAnswers?: { id: string; user?: string; text: string; date?: string; timestamp?: number }[];
  isSponsored?: boolean;
  sponsorName?: string;
  ctaButtonLabel?: string;
  redirectTargetUrl?: string;
  monetizationType?: 'full_image' | 'gallery' | 'standard' | 'ad_article';
  brandLogoUrl?: string;
}

interface ArticleDetailViewProps {
  article: ArticleData;
  onBack: () => void;
  onOpenLogin: () => void;
  isWhiteMode?: boolean;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  onBack,
  isWhiteMode = false,
}) => {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(() => Math.floor(Math.random() * 400) + 120);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    // Left-to-right swipe -> Back to feed
    if (deltaX > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
      onBack();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleLike = () => {
    if (!isLiked) {
      setLikesCount((p) => p + 1);
      setIsLiked(true);
    } else {
      setLikesCount((p) => p - 1);
      setIsLiked(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Article link copied to clipboard!');
    }
  };

  const authorName = article.author || (article.category ? `${article.category} Desk` : 'Editorial Desk');
  const authorInitial = authorName.charAt(0).toUpperCase();

  // Process fullContent vs summary - only display actual user provided content
  const rawSummary = (article.summary || '').trim();
  const rawFullContent = (article.fullContent || '').trim();

  // Determine full content paragraphs (split by line breaks)
  const fullContentParagraphs = rawFullContent
    ? rawFullContent.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  const isSummaryDistinct = rawSummary && rawSummary !== rawFullContent;

  const readingTimeMin = Math.max(
    1,
    Math.round((rawSummary.length + rawFullContent.length) / 500)
  );

  // Extract clean tags
  const displayTags =
    article.genres && article.genres.length > 0
      ? article.genres.filter((g) => g && g.trim())
      : article.category
      ? [article.category]
      : [];

  const isMovieType = article.type === 'movie' || article.type === 'movie_review';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`flex-1 flex flex-col justify-between min-h-full animate-slide-from-right relative overflow-hidden font-sans ${
        isWhiteMode ? 'bg-white text-slate-900' : 'bg-[#08090C] text-white'
      }`}
    >
      {/* Top Header Bar with Back Arrow */}
      <div
        className={`sticky top-0 z-30 backdrop-blur-md px-4 py-3 flex items-center justify-between ${
          isWhiteMode ? 'bg-white/90 text-slate-900 border-b border-slate-200' : 'bg-[#08090C]/90 text-white border-b border-zinc-900'
        }`}
      >
        <button
          onClick={onBack}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${
            isWhiteMode ? 'text-slate-700 hover:text-slate-950' : 'text-zinc-300 hover:text-white'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isWhiteMode ? 'bg-slate-100' : 'bg-zinc-800'
            }`}
          >
            <ArrowLeft className={`w-4 h-4 ${isWhiteMode ? 'text-slate-800' : 'text-white'}`} />
          </div>
          <span className="text-xs font-bold">Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isWhiteMode
                ? 'bg-slate-100 text-slate-700 hover:text-slate-950'
                : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${
                isBookmarked
                  ? isWhiteMode
                    ? 'text-emerald-600 fill-emerald-600'
                    : 'text-[#A2D5B1] fill-[#A2D5B1]'
                  : isWhiteMode
                  ? 'text-slate-700'
                  : 'text-zinc-300'
              }`}
            />
          </button>
          <button
            onClick={handleShare}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isWhiteMode
                ? 'bg-slate-100 text-slate-700 hover:text-slate-950'
                : 'bg-zinc-800/80 text-zinc-300 hover:text-white'
            }`}
          >
            <Share2 className={`w-4 h-4 ${isWhiteMode ? 'text-slate-700' : 'text-zinc-300'}`} />
          </button>
        </div>
      </div>

      {/* Main Detailed Article Scroll Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-24">
        {/* Article Meta Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {article.category && (
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isWhiteMode
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {article.category}
              </span>
            )}
            {article.date && (
              <p
                className={`text-[11px] font-medium ${
                  isWhiteMode ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                {article.date}
              </p>
            )}
          </div>

          <h1
            className={`text-xl sm:text-2xl font-black leading-snug tracking-tight ${
              isWhiteMode ? 'text-slate-900' : 'text-white'
            }`}
          >
            {article.title}
          </h1>

          {/* Journalist / Editorial Source & Reading Time */}
          <div
            className={`flex items-center justify-between pt-2 pb-3 border-b ${
              isWhiteMode ? 'border-slate-200' : 'border-zinc-800/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500/30 to-amber-500/30 border border-emerald-500/40 flex items-center justify-center text-xs font-black text-emerald-400">
                {authorInitial}
              </div>
              <div>
                <p className={`text-xs font-extrabold ${isWhiteMode ? 'text-slate-900' : 'text-white'}`}>
                  {authorName}
                </p>
                <p className={`text-[10px] ${isWhiteMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                  {article.category || 'News Desk'} • Uproll Verified
                </p>
              </div>
            </div>

            {/* Reading Time (Only for standard news, removed from top for movie reviews) */}
            {!isMovieType && (
              <div
                className={`text-right text-[10px] font-medium space-y-0.5 ${
                  isWhiteMode ? 'text-slate-500' : 'text-zinc-400'
                }`}
              >
                <p className="flex items-center gap-1 justify-end">
                  <Clock className={`w-3 h-3 ${isWhiteMode ? 'text-slate-400' : 'text-zinc-500'}`} />
                  <span>{readingTimeMin} min read</span>
                </p>
              </div>
            )}
            {isMovieType && (
              <div className="text-right">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                    isWhiteMode
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                  }`}
                >
                  Movie Review
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Feature Image Passed From Main Card */}
        {article.featureImage && (
          <div
            className={`relative w-full h-[240px] sm:h-[300px] rounded-t-2xl rounded-b-none overflow-hidden shadow-xl border ${
              isWhiteMode ? 'border-slate-200' : 'border-zinc-800/90'
            }`}
          >
            <img
              src={article.featureImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div
              className={`absolute inset-0 ${
                isWhiteMode
                  ? 'bg-gradient-to-t from-black/60 via-transparent to-transparent'
                  : 'bg-gradient-to-t from-black/80 via-transparent to-transparent'
              }`}
            />
            {isMovieType && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-300">
                    Cinema Breakdown
                  </span>
                </div>
                {article.verdict && (
                  <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white text-xs font-black tracking-wider uppercase shadow-lg">
                    {article.verdict}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Story Type Specific Embedded Widget / Body Content */}
        {isMovieType ? (
          <div className="pt-1">
            <ImdbMovieReviewSection article={article} isWhiteMode={isWhiteMode} />
          </div>
        ) : (
          /* Article Body - ONLY FRONTEND PROVIDED CONTENT */
          <div
            className={`space-y-3.5 text-xs sm:text-sm leading-relaxed font-normal ${
              isWhiteMode ? 'text-slate-800' : 'text-zinc-300'
            }`}
          >
            {/* Summary / Lead Paragraph */}
            {rawSummary && (
              <p
                className={`text-sm sm:text-base font-semibold leading-relaxed p-4 rounded-xl border ${
                  isWhiteMode
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-200'
                }`}
              >
                {rawSummary}
              </p>
            )}

            {/* Full Article Content Paragraphs (Only if distinct or multi-paragraph) */}
            {fullContentParagraphs.length > 0 && isSummaryDistinct && (
              <div className="space-y-3 pt-1">
                {fullContentParagraphs.map((para, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Story Type Specific Embedded Widget for Poll & Gallery */}
        {article.type === 'poll' && (
          <div className="pt-2">
            <InteractivePoll
              question={article.pollQuestion}
              initialOptions={article.pollOptions}
              isWhiteMode={isWhiteMode}
            />
          </div>
        )}

        {(article.type === 'gallery' || article.type === 'full_gallery') && (
          <div className="pt-2">
            <ImageGallerySlider
              images={article.galleryImages}
              isWhiteMode={isWhiteMode}
            />
          </div>
        )}

        {/* Dynamic Tags Row */}
        {displayTags.length > 0 && (
          <div
            className={`flex items-center gap-2 flex-wrap pt-3 border-t ${
              isWhiteMode ? 'border-slate-200' : 'border-zinc-800/80'
            }`}
          >
            <Tag className={`w-3.5 h-3.5 ${isWhiteMode ? 'text-slate-400' : 'text-zinc-500'}`} />
            {displayTags.map((tag) => (
              <span
                key={tag}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                  isWhiteMode
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}

        {/* Likes & Share Action Bar */}
        <div
          className={`rounded-2xl p-4 border flex items-center justify-between ${
            isWhiteMode
              ? 'bg-slate-50 border-slate-200'
              : 'bg-zinc-900/90 border-zinc-800'
          }`}
        >
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
              isLiked
                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                : isWhiteMode
                ? 'bg-slate-200 text-slate-800 hover:text-slate-950'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likesCount.toLocaleString()} Likes</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#A2D5B1] text-slate-950 font-extrabold text-xs cursor-pointer hover:bg-[#92C8A1]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Article</span>
          </button>
        </div>
      </div>
    </div>
  );
};
