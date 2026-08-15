import React, { useState } from 'react';
import { Film, User, Clapperboard, Music, Camera, ThumbsUp, ThumbsDown, MessageSquare, Sparkles, Clock, Calendar, ShieldCheck, Tag, Star, Award, Check } from 'lucide-react';
import { ArticleData } from '../types';
import { submitMovieReviewToFirestore, rateMovieInFirestore } from '../lib/newsService';

interface Review {
  id: string;
  author: string;
  comment: string;
  date: string;
  likes: number;
  dislikes: number;
  userLiked?: boolean;
  userRating?: number;
}

const SAMPLE_REVIEWS: Review[] = [
  {
    id: 'r1',
    author: 'Rahul Nair',
    comment: 'Exceptional direction and mass action entertainer! The interval sequence and climax action are crafted with exceptional scale.',
    date: '2 hours ago',
    likes: 184,
    dislikes: 12,
    userRating: 9,
  },
  {
    id: 'r2',
    author: 'Anjali Menon',
    comment: 'The background score elevates every single scene. The screenplay keeps you hooked throughout without any dragging moments.',
    date: '5 hours ago',
    likes: 142,
    dislikes: 8,
    userRating: 8,
  },
  {
    id: 'r3',
    author: 'Kiran Kumar',
    comment: 'Solid thriller with striking visuals. Great production values and cinematography. A must-watch on the big screen for all cinema enthusiasts.',
    date: '1 day ago',
    likes: 95,
    dislikes: 6,
    userRating: 9,
  },
];

interface ImdbMovieReviewSectionProps {
  article?: ArticleData;
  isWhiteMode?: boolean;
}

export const ImdbMovieReviewSection: React.FC<ImdbMovieReviewSectionProps> = ({
  article,
  isWhiteMode = false,
}) => {
  const initialReviews: Review[] = (article?.audienceReviews && article.audienceReviews.length > 0)
    ? article.audienceReviews.map((r) => ({
        id: r.id,
        author: r.author,
        comment: r.comment,
        date: r.date || 'Recently',
        likes: r.likes || 0,
        dislikes: r.dislikes || 0,
        userRating: r.rating || 9,
      }))
    : SAMPLE_REVIEWS;

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [newReviewText, setNewReviewText] = useState<string>('');
  const [newReviewRating, setNewReviewRating] = useState<number>(9);

  // User Interactive Star Rating State (Out of 10)
  const initialAvgRating = Number(article?.starRating || (typeof article?.rating === 'string' && parseFloat(article.rating)) || 8.6);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userHasRated, setUserHasRated] = useState<boolean>(false);
  const [totalRatingsCount, setTotalRatingsCount] = useState<number>(article?.audienceRatingsCount || 14280);

  const displayAvgRating = userHasRated && userRating
    ? (((initialAvgRating * totalRatingsCount) + userRating) / (totalRatingsCount + 1)).toFixed(1)
    : initialAvgRating.toFixed(1);

  const handleVoteHelpful = (id: string, isLike: boolean) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          if (isLike) {
            return { ...r, likes: r.likes + 1 };
          } else {
            return { ...r, dislikes: r.dislikes + 1 };
          }
        }
        return r;
      })
    );
  };

  const handleUserRate = async (score: number) => {
    setUserRating(score);
    setUserHasRated(true);
    setTotalRatingsCount((prev) => prev + 1);

    if (article?.id) {
      try {
        await rateMovieInFirestore(article.id, score);
      } catch (err) {
        console.warn('Error saving user rating:', err);
      }
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const created: Review = {
      id: `rev-${Date.now()}`,
      author: 'You (Verified Viewer)',
      comment: newReviewText.trim(),
      date: 'Just now',
      likes: 1,
      dislikes: 0,
      userRating: newReviewRating,
    };

    setReviews([created, ...reviews]);
    setNewReviewText('');
    setShowReviewForm(false);

    if (article?.id) {
      try {
        await submitMovieReviewToFirestore(article.id, {
          author: 'You (Verified Viewer)',
          comment: created.comment,
          rating: newReviewRating,
          likes: 1,
          dislikes: 0,
        });
      } catch (err) {
        console.warn('Error saving movie review:', err);
      }
    }
  };


  const director = article?.director || 'Director';
  const castNames = article?.cast || 'Star Cast';
  const musicDirector = article?.musicDirector || 'Music Director';
  const cinematography = article?.cinematography || 'Cinematography';
  const runtime = article?.runtime || article?.duration || '';
  const year = article?.year || '2026';
  const certificate = article?.certificate || 'U/A';
  const genres = article?.genres && article.genres.length > 0 ? article.genres : ['Cinema'];
  const summaryText = article?.summary || article?.fullContent || '';

  return (
    <div
      className={`rounded-3xl p-4 sm:p-6 border shadow-2xl space-y-6 my-4 transition-all ${
        isWhiteMode
          ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          : 'bg-[#0E1015] border-zinc-800/90 text-white shadow-black/80'
      }`}
    >
      {/* Modern Cinema Header Banner (Clean & High-Impact, Top Duration Removed) */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border space-y-3 relative overflow-hidden ${
          isWhiteMode
            ? 'bg-gradient-to-br from-amber-50/70 via-white to-slate-50 border-amber-200/60 shadow-xs'
            : 'bg-gradient-to-br from-amber-950/20 via-zinc-900/90 to-zinc-900 border-amber-500/20'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${
                isWhiteMode
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                Official Cinema Breakdown
              </span>
              <h3 className={`text-base sm:text-lg font-black tracking-tight ${isWhiteMode ? 'text-slate-900' : 'text-white'}`}>
                {article?.title || 'Movie Review'}
              </h3>
            </div>
          </div>

          {/* Certificate & Release Year Badges (No Duration Here) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {year && (
              <span
                className={`text-[11px] font-extrabold px-3 py-1 rounded-lg border flex items-center gap-1 ${
                  isWhiteMode
                    ? 'bg-white text-slate-700 border-slate-300'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                <Calendar className="w-3 h-3 text-amber-500" />
                <span>{year}</span>
              </span>
            )}
            {certificate && (
              <span
                className={`text-[11px] font-black px-3 py-1 rounded-lg flex items-center gap-1 ${
                  isWhiteMode
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-950/90 text-emerald-400 border border-emerald-700/60'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{certificate}</span>
              </span>
            )}
          </div>
        </div>

        {/* Genres Pill List */}
        {genres.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-dashed border-zinc-700/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Genres:</span>
            </span>
            {genres.map((g) => (
              <span
                key={g}
                className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isWhiteMode
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-zinc-800 text-amber-200 border border-zinc-700'
                }`}
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FRONTEND STAR RATING SECTION OUT OF 10 */}
      {/* ========================================================================= */}
      <div
        id="movie-star-rating-section"
        className={`p-4 sm:p-5 rounded-2xl border space-y-4 relative overflow-hidden transition-all ${
          isWhiteMode
            ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-amber-200/90 shadow-sm'
            : 'bg-gradient-to-br from-amber-950/30 via-zinc-900/90 to-zinc-900 border-amber-500/30 shadow-lg'
        }`}
      >
        {/* Rating Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
              <Star className="w-6 h-6 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                  Audience & Editorial Score
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  OUT OF 10
                </span>
              </div>
              <h4 className={`text-sm sm:text-base font-black tracking-tight ${isWhiteMode ? 'text-slate-900' : 'text-white'}`}>
                People's Average Rating
              </h4>
            </div>
          </div>

          {/* Average Rating Score Display */}
          <div className="flex items-baseline gap-1.5 self-start sm:self-auto bg-black/40 dark:bg-black/60 px-4 py-2 rounded-2xl border border-amber-500/30 backdrop-blur-md">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {displayAvgRating}
            </span>
            <span className="text-xs font-bold text-zinc-400">
              / 10
            </span>
          </div>
        </div>

        {/* 10-Star Visual & Rating Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold ${isWhiteMode ? 'text-slate-700' : 'text-zinc-300'}`}>
              Average Rating ({displayAvgRating} / 10)
            </span>
            <span className="text-amber-500 font-extrabold text-[11px]">
              {Number(displayAvgRating) >= 8.5 ? '⭐ Masterpiece / Must-Watch' : Number(displayAvgRating) >= 7.0 ? '⭐ Blockbuster Hit' : '⭐ Decent Watch'}
            </span>
          </div>

          {/* Progress fill bar out of 10 */}
          <div className="w-full h-3 rounded-full bg-zinc-800/80 overflow-hidden p-0.5 border border-zinc-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 shadow-sm transition-all duration-700"
              style={{ width: `${Math.min(100, (Number(displayAvgRating) / 10) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold pt-0.5">
            <span>0</span>
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
            <span>10</span>
          </div>
        </div>

        {/* Interactive "Rate this Movie out of 10" Section */}
        <div
          className={`p-3.5 sm:p-4 rounded-xl border space-y-2.5 ${
            isWhiteMode
              ? 'bg-white border-amber-200/80 shadow-2xs'
              : 'bg-[#0B0D12] border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span className={`text-xs font-black uppercase tracking-wider ${isWhiteMode ? 'text-slate-900' : 'text-white'}`}>
                {userHasRated ? 'Your Rating Recorded!' : 'Rate This Movie (Out of 10)'}
              </span>
            </div>
            {userRating && (
              <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                You gave: {userRating}/10 ⭐
              </span>
            )}
          </div>

          {/* 10 Interactive Star Buttons */}
          <div className="flex items-center justify-between gap-1 sm:gap-1.5 pt-1 overflow-x-auto no-scrollbar py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starIndex) => {
              const isFilled = (hoverRating !== null ? hoverRating : (userRating || 0)) >= starIndex;
              return (
                <button
                  key={starIndex}
                  type="button"
                  onClick={() => handleUserRate(starIndex)}
                  onMouseEnter={() => setHoverRating(starIndex)}
                  onMouseLeave={() => setHoverRating(null)}
                  className={`flex-1 min-w-[28px] sm:min-w-[32px] py-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border active:scale-95 ${
                    isFilled
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-xs'
                      : isWhiteMode
                      ? 'bg-slate-50 border-slate-200 text-slate-400 hover:border-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-amber-500/50'
                  }`}
                  title={`Rate ${starIndex}/10`}
                >
                  <Star
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      isFilled ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'
                    }`}
                  />
                  <span className="text-[10px] font-black">{starIndex}</span>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-zinc-400 flex items-center justify-between pt-0.5">
            <span>Tap any star from 1 to 10 to submit your rating score</span>
            <span>{totalRatingsCount.toLocaleString()}+ verified ratings</span>
          </p>
        </div>
      </div>

      {/* Modern Synopsis in a Dedicated Box Container */}
      {summaryText && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 transition-all relative overflow-hidden ${
            isWhiteMode
              ? 'bg-amber-50/40 border-amber-200/80 shadow-xs text-slate-800'
              : 'bg-gradient-to-b from-zinc-900/90 to-zinc-900/60 border-zinc-800 text-zinc-200 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">
                Story Synopsis & Overview
              </h4>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isWhiteMode ? 'bg-white text-slate-600 border border-slate-200' : 'bg-black/40 text-zinc-400 border border-zinc-800'
              }`}
            >
              Editorial Note
            </span>
          </div>

          <div
            className={`p-3.5 rounded-xl border leading-relaxed text-xs sm:text-sm font-medium ${
              isWhiteMode
                ? 'bg-white border-amber-100 text-slate-800'
                : 'bg-[#0B0D12] border-zinc-800/90 text-zinc-200'
            }`}
          >
            <p className="whitespace-pre-line leading-relaxed">{summaryText}</p>
          </div>
        </div>
      )}

      {/* Modern Detailed Cast & Crew Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Clapperboard className="w-3.5 h-3.5 text-amber-500" />
          <span>Cast & Technical Crew</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
              isWhiteMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Director</p>
              <p className="text-xs font-extrabold truncate">{director}</p>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
              isWhiteMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Star Cast</p>
              <p className="text-xs font-extrabold truncate">{castNames}</p>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
              isWhiteMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-purple-400 tracking-wider">Music & BGM</p>
              <p className="text-xs font-extrabold truncate">{musicDirector}</p>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
              isWhiteMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Cinematography</p>
              <p className="text-xs font-extrabold truncate">{cinematography}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Cinema Specs & Time Duration Bar */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
          isWhiteMode
            ? 'bg-gradient-to-r from-amber-50 via-slate-50 to-amber-50/50 border-amber-200'
            : 'bg-gradient-to-r from-zinc-900 via-[#141820] to-zinc-900 border-amber-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
              Screening Duration & Specs
            </span>
            <p className={`text-xs font-black ${isWhiteMode ? 'text-slate-900' : 'text-white'}`}>
              {runtime ? `Total Runtime: ${runtime}` : 'Feature Film Screening'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {runtime && (
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm ${
                isWhiteMode
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{runtime}</span>
            </span>
          )}
          {certificate && (
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                isWhiteMode
                  ? 'bg-white text-slate-800 border-slate-300'
                  : 'bg-zinc-800 text-zinc-200 border-zinc-700'
              }`}
            >
              {certificate}
            </span>
          )}
        </div>
      </div>

      {/* Audience Reviews & Community Discussion */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audience Thoughts & Discussion ({reviews.length})</span>
          </h4>
          <button
            type="button"
            onClick={() => setShowReviewForm(true)}
            className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
          >
            + Share Your Thoughts
          </button>
        </div>

        {/* Inline Feedback Form */}
        {showReviewForm && (
          <form
            onSubmit={handleAddReview}
            className={`p-4 rounded-xl border space-y-3 animate-fade-in ${
              isWhiteMode
                ? 'bg-white border-amber-300 shadow-md'
                : 'bg-zinc-900 border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-black text-amber-400 uppercase tracking-wide">
                Share Your Thoughts
              </h5>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-zinc-400 font-bold mr-1">Your Rate:</span>
                <select
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(Number(e.target.value))}
                  className={`text-xs font-black px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                    isWhiteMode
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-zinc-800 border-amber-500/40 text-amber-400'
                  }`}
                >
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      ★ {num}/10
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              rows={3}
              placeholder="Share your feedback on direction, acting, music, and standout scenes..."
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              className={`w-full text-xs rounded-lg p-2.5 border focus:outline-none leading-relaxed ${
                isWhiteMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600'
                  : 'bg-zinc-800 border-zinc-700 text-white focus:border-amber-400'
              }`}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-sm transition-all"
              >
                Post Feedback
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className={`px-3 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                  isWhiteMode ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-2.5">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-3.5 rounded-xl border space-y-2 ${
                isWhiteMode
                  ? 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                  : 'bg-zinc-900/70 border-zinc-800/80 text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black">{rev.author}</span>
                  <span className="text-[10px] text-zinc-400">• {rev.date}</span>
                </div>
                {rev.userRating && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-400 text-[11px] font-black border border-amber-400/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{rev.userRating}/10</span>
                  </span>
                )}
              </div>

              <p
                className={`text-xs leading-relaxed ${
                  isWhiteMode ? 'text-slate-700' : 'text-zinc-300'
                }`}
              >
                {rev.comment}
              </p>

              <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-400">
                <button
                  type="button"
                  onClick={() => handleVoteHelpful(rev.id, true)}
                  className="flex items-center gap-1 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{rev.likes}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVoteHelpful(rev.id, false)}
                  className="flex items-center gap-1 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{rev.dislikes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
