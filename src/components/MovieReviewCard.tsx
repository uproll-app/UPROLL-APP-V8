import React from 'react';
import { Film, Share2, Sparkles, ArrowRight, Clapperboard, Music, Users, Clock, Calendar, Star } from 'lucide-react';
import { ArticleData } from '../types';

interface MovieReviewCardProps {
  article: ArticleData;
  isWhiteMode?: boolean;
  onShare: () => void;
  onSelect: () => void;
}

export const MovieReviewCard: React.FC<MovieReviewCardProps> = ({
  article,
  isWhiteMode = false,
  onShare,
  onSelect,
}) => {
  const handleHeadlineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const displayTitle = article.title || 'Movie Review';
  const displaySummary = article.summary || 'Movie synopsis and editorial breakdown.';
  const displayDirector = article.director || 'Director';
  const displayYear = article.year || '2026';
  const displayRuntime = article.runtime || article.duration || '2h 30m';
  const displayCertificate = article.certificate || 'U/A';
  const displayCast = article.cast || '';
  const displayMusic = article.musicDirector || '';
  const displayRating = article.starRating
    ? Number(article.starRating).toFixed(1)
    : (typeof article.rating === 'string' && parseFloat(article.rating))
    ? parseFloat(article.rating).toFixed(1)
    : '8.6';

  return (
    <div
      id={`movie-card-${article.id}`}
      className={`rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col flex-1 h-full select-none ${
        isWhiteMode ? 'bg-white text-slate-900' : 'bg-black text-white'
      }`}
      style={{ backgroundColor: isWhiteMode ? '#ffffff' : '#000000' }}
    >
      {/* Top 38%: Movie Poster Container with Cinema Tag, People's Average Rate & Share */}
      <div className="relative w-full h-[38%] min-h-[170px] max-h-[250px] rounded-t-[28px] sm:rounded-t-[32px] overflow-hidden bg-zinc-900 shrink-0 shadow-sm">
        <img
          src={article.featureImage}
          alt={displayTitle}
          className="w-full h-full object-cover pointer-events-none"
        />
        <div
          className={`absolute inset-0 pointer-events-none ${
            isWhiteMode
              ? 'bg-gradient-to-t from-black/60 via-transparent to-black/30'
              : 'bg-gradient-to-t from-black/90 via-transparent to-black/40'
          }`}
        />

        {/* Top Left Cinema Tag & People's Avg Rate */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/85 backdrop-blur-md text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
            <Film className="w-3 h-3 text-amber-400" />
            <span>Movie Review</span>
          </span>
          
          {/* People's Average Rate Badge on Poster */}
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-md">
            <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
            <span>{displayRating}/10</span>
          </span>

          {displayCertificate && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
              {displayCertificate}
            </span>
          )}
        </div>

        {/* Top Right Share Button */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
          <button
            id={`share-btn-${article.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
              isWhiteMode
                ? 'bg-white/95 hover:bg-white text-slate-800 shadow-sm'
                : 'bg-black/80 hover:bg-black text-white border border-white/20'
            }`}
            title="Share Movie Review"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom 62%: Story Header (Headline), Synopsis, Cast & Dedicated Arrow to Detailed Page */}
      <div
        className={`p-4 sm:p-5 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar space-y-2.5 ${
          isWhiteMode ? 'bg-white text-slate-900' : 'bg-black text-white'
        }`}
        style={{ backgroundColor: isWhiteMode ? '#ffffff' : '#000000' }}
      >
        {/* Header: Published Date & Tap-to-Read Title */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p
              className={`text-[10px] sm:text-[11px] tracking-wider ${
                isWhiteMode ? 'text-zinc-500 font-medium' : 'text-zinc-400 font-thin'
              }`}
            >
              {article.date || 'Today'} {displayDirector ? `• Dir: ${displayDirector}` : ''}
            </p>

            {/* People Average Rate Chip in Meta Header */}
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-black text-amber-400">
                People's Avg: {displayRating}/10
              </span>
            </div>
          </div>

          {/* Movie Title (Max 80 chars high-impact display) */}
          <h2
            id={`movie-title-${article.id}`}
            onClick={handleHeadlineClick}
            className={`text-base sm:text-lg font-extrabold leading-snug tracking-tight transition-all cursor-pointer select-none active:opacity-75 ${
              isWhiteMode ? 'text-slate-900 hover:text-indigo-600' : 'text-white hover:text-amber-300'
            }`}
            title="Tap headline to open detailed movie review"
          >
            {displayTitle}
          </h2>
        </div>

        {/* Synopsis in a Modern Box */}
        <div
          className={`p-3 rounded-xl border leading-relaxed space-y-1.5 transition-colors ${
            isWhiteMode
              ? 'bg-slate-50/80 border-slate-200/80 shadow-xs'
              : 'bg-zinc-900/60 border-zinc-800/80 backdrop-blur-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Story Synopsis</span>
            </div>
            {displayYear && (
              <span className="text-[10px] font-bold text-zinc-400">
                {displayYear}
              </span>
            )}
          </div>
          <p
            className={`text-xs sm:text-[13.5px] leading-relaxed whitespace-pre-line cursor-default line-clamp-3 ${
              isWhiteMode ? 'text-slate-700 font-normal' : 'text-zinc-300 font-light'
            }`}
          >
            {displaySummary}
          </p>
        </div>

        {/* Movie Meta Specs Chips including Time Duration & Star Score in bottom section */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${
              isWhiteMode
                ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span>Score: {displayRating}/10</span>
          </span>

          {displayRuntime && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                isWhiteMode
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
              }`}
            >
              <Clock className="w-2.5 h-2.5 text-amber-500" />
              <span>{displayRuntime}</span>
            </span>
          )}
          {displayDirector && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                isWhiteMode
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}
            >
              <Clapperboard className="w-2.5 h-2.5 text-amber-500" />
              <span>Dir: {displayDirector}</span>
            </span>
          )}
          {displayCast && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border truncate max-w-[150px] flex items-center gap-1 ${
                isWhiteMode
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}
            >
              <Users className="w-2.5 h-2.5 text-amber-500" />
              <span>Cast: {displayCast}</span>
            </span>
          )}
          {displayMusic && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border truncate max-w-[130px] flex items-center gap-1 ${
                isWhiteMode
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}
            >
              <Music className="w-2.5 h-2.5 text-amber-500" />
              <span>Music: {displayMusic}</span>
            </span>
          )}
        </div>

        {/* Dedicated Sleek Arrow Button to Open Detailed Movie Page */}
        <button
          id={`open-movie-detail-btn-${article.id}`}
          type="button"
          onClick={onSelect}
          className={`w-full py-2.5 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer shadow-sm group active:scale-[0.98] ${
            isWhiteMode
              ? 'bg-slate-900 hover:bg-slate-800 text-white'
              : 'bg-gradient-to-r from-amber-500/20 via-zinc-900 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 text-amber-200 border border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-black tracking-wide">
              View Full Movie Review, Cast & Specs
            </span>
          </div>
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/40 text-amber-300 flex items-center justify-center transition-colors">
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
};
