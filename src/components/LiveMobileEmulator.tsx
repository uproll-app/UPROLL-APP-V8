import React, { useState } from 'react';
import {
  Flame,
  TrendingUp,
  Zap,
  Bookmark,
  Share2,
  Heart,
  MessageCircle,
  ChevronUp,
  Play,
  Volume2,
  VolumeX,
  Eye,
  Radio,
  Star,
  Layers,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  Film,
  Sparkles,
  ArrowRight,
  Clock,
  Clapperboard,
  Users
} from 'lucide-react';
import { ExtendedArticleData } from '../lib/newsService';

export interface LiveMobileEmulatorProps {
  headline: string;
  category: string;
  summary: string;
  fullContent: string;
  mediaType: 'image' | 'video' | 'youtube';
  imageUrl: string;
  videoUrl?: string;
  youtubeUrl?: string;
  youtubeId?: string | null;
  author: string;
  storyId: string;
  isPinned?: boolean;
  sendPush?: boolean;
  formatType?: 'standard' | 'poll' | 'gallery' | 'full_gallery' | 'ask_reader' | 'movie_review';
  headerOverlay?: boolean;
  pollOptions?: Array<{ id: string; text: string; votes?: number }>;
  galleryImages?: string[];
  movieRating?: string;
  movieVerdict?: string;
  movieDirector?: string;
  movieCast?: string;
  movieMusicDirector?: string;
  movieCinematography?: string;
  movieRuntime?: string;
  movieYear?: string;
  movieCertificate?: string;
  askReaderPrompt?: string;
  isSponsored?: boolean;
  sponsorName?: string;
  ctaButtonLabel?: string;
  redirectTargetUrl?: string;
}

export function LiveMobileEmulator({
  headline,
  category,
  summary,
  fullContent,
  mediaType,
  imageUrl,
  videoUrl,
  youtubeUrl,
  youtubeId,
  author,
  storyId,
  isPinned,
  sendPush,
  formatType = 'standard',
  headerOverlay = true,
  pollOptions = [],
  galleryImages = [],
  movieRating = '8.8 / 10',
  movieVerdict = 'MUST WATCH',
  movieDirector = 'Director',
  movieCast = '',
  movieMusicDirector = '',
  movieCinematography = '',
  movieRuntime = '2h 30m',
  movieYear = '2026',
  movieCertificate = 'U/A',
  askReaderPrompt = 'What is your perspective on this topic?',
  isSponsored = false,
  sponsorName,
  ctaButtonLabel,
  redirectTargetUrl,
}: LiveMobileEmulatorProps) {
  const [previewTab, setPreviewTab] = useState<'card' | 'full' | 'push'>('card');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Category badge styling helper
  const getCategoryBadge = (cat: string) => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('hot') || cat === 'Hot News') {
      return {
        bg: 'bg-rose-500 text-white',
        icon: Flame,
        label: 'HOT NEWS',
        border: 'border-rose-600'
      };
    }
    if (lower.includes('break') || cat === 'Breaking') {
      return {
        bg: 'bg-red-600 text-white animate-pulse',
        icon: Zap,
        label: 'BREAKING NEWS',
        border: 'border-red-700'
      };
    }
    if (lower.includes('trend') || cat === 'Trending') {
      return {
        bg: 'bg-amber-500 text-white',
        icon: TrendingUp,
        label: 'TRENDING',
        border: 'border-amber-600'
      };
    }
    return {
      bg: 'bg-slate-900 text-white',
      icon: Layers,
      label: cat.toUpperCase() || 'NEWS',
      border: 'border-slate-800'
    };
  };

  const badgeInfo = getCategoryBadge(category);
  const BadgeIcon = badgeInfo.icon;

  const displayHeadline = headline.trim() || 'Breaking: Tap to Edit News Headline in CMS';
  const displaySummary = summary.trim() || 'This is where your real-time standard 190-character feed summary will appear. Updates sync instantly with live Malayalam character validation.';
  const displayFullContent = fullContent.trim() || summary.trim() || 'Full article text body revealed when user taps the headline.';
  const displayAuthor = author.trim() || 'UPROLL Editorial Desk';

  // Word count helper for summary
  const summaryWordCount = displaySummary.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Emulator Top Controls */}
      <div className="w-full max-w-[380px] mb-2.5 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setPreviewTab('card')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              previewTab === 'card' || ((formatType === 'full_gallery' || formatType === 'gallery') && previewTab === 'full')
                ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {formatType === 'full_gallery' ? 'Full Image Lookbook' : formatType === 'gallery' ? 'Gallery Reel' : 'Feed Card'}
          </button>
          {formatType !== 'full_gallery' && formatType !== 'gallery' && (
            <button
              type="button"
              onClick={() => setPreviewTab('full')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewTab === 'full'
                  ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Article
            </button>
          )}
          {sendPush && (
            <button
              type="button"
              onClick={() => setPreviewTab('push')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                previewTab === 'push'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <Bell className="w-3 h-3" />
              <span>Push</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Sync</span>
        </div>
      </div>

      {/* Minimalist White Viewport Emulator Frame - No Bulky Mockups */}
      <div
        id="live-emulator-viewport"
        className="w-full max-w-[380px] h-[660px] bg-white text-slate-900 rounded-2xl border border-slate-900 shadow-xl flex flex-col overflow-hidden relative select-none"
      >
        {/* Minimal Mobile Status Bar */}
        <div className="w-full h-8 bg-white px-4 flex items-center justify-between text-[11px] font-bold text-slate-900 border-b border-slate-100 shrink-0 z-20">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="text-[10px] tracking-tight">5G</span>
            <div className="w-5 h-2.5 border border-slate-800 rounded-xs p-0.5 flex items-center">
              <div className="h-full w-3.5 bg-slate-900 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: FEED CARD PREVIEW (60-Word Card, Gallery Header Overlay or Full Image Gallery) */}
        {/* ========================================================================= */}
        {previewTab === 'card' && formatType === 'full_gallery' ? (
          <div className="relative w-full h-full bg-black text-white flex flex-col justify-between overflow-hidden select-none">
            {/* Background Full Photo */}
            {(() => {
              const photos = (galleryImages && galleryImages.length > 0 ? galleryImages : [imageUrl]).slice(0, 10);
              const currentPhotoUrl = photos[activeGalleryIndex] || photos[0] || imageUrl;
              return (
                <>
                  <img
                    src={currentPhotoUrl}
                    alt={displayHeadline}
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Top and bottom subtle gradients for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

                  {/* Tap Navigation Areas (Full screen height) */}
                  <div
                    onClick={() => setActiveGalleryIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                    className="absolute top-0 bottom-24 left-0 w-1/3 z-10 cursor-pointer"
                    title="Previous photo"
                  />
                  <div
                    onClick={() => setActiveGalleryIndex((prev) => (prev + 1) % photos.length)}
                    className="absolute top-0 bottom-24 right-0 w-1/3 z-10 cursor-pointer"
                    title="Next photo"
                  />

                  {/* Bottom Dots (No Text or CTA for Full Gallery) */}
                  <div className="relative z-10 p-4">
                    {/* Bottom Horizontal Pagination Dots */}
                    <div className="flex items-center justify-center gap-1.5">
                      {photos.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveGalleryIndex(idx)}
                          className={`transition-all duration-300 rounded-full cursor-pointer ${
                            idx === activeGalleryIndex
                              ? 'w-6 h-1.5 bg-[#A2D5B1] shadow-md'
                              : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : previewTab === 'card' && formatType === 'gallery' && headerOverlay !== false ? (
          <div className="relative w-full h-full bg-black text-white flex flex-col justify-between overflow-hidden select-none">
            {/* Background Full Photo with Header Overlay */}
            {(() => {
              const photos = (galleryImages && galleryImages.length > 0 ? galleryImages : [imageUrl]).slice(0, 10);
              const currentPhotoUrl = photos[activeGalleryIndex] || photos[0] || imageUrl;
              return (
                <>
                  <img
                    src={currentPhotoUrl}
                    alt={displayHeadline}
                    className="absolute inset-0 w-full h-full object-cover transition-all"
                    referrerPolicy="no-referrer"
                  />
                  {/* Top and bottom dark gradients for high contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 via-45% to-black/75 pointer-events-none" />

                  {/* Top Bar: Category badge + Bookmark / Share */}
                  <div className="relative z-20 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-[#A2D5B1] border border-white/15">
                        <Layers className="w-2.5 h-2.5 text-[#A2D5B1]" />
                        <span>{category || 'Gallery'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                        <Bookmark className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                        <Share2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Tap Navigation Areas */}
                  <div
                    onClick={() => setActiveGalleryIndex((prev) => (prev - 1 + photos.length) % photos.length)}
                    className="absolute top-12 bottom-28 left-0 w-1/3 z-10 cursor-pointer"
                    title="Previous photo"
                  />
                  <div
                    onClick={() => setActiveGalleryIndex((prev) => (prev + 1) % photos.length)}
                    className="absolute top-12 bottom-28 right-0 w-1/3 z-10 cursor-pointer"
                    title="Next photo"
                  />

                  {/* Overlaid Bottom Header: Published Date, Headline Title, Summary, CTA & Pagination */}
                  <div className="relative z-20 p-3.5 space-y-1.5">
                    <span className="text-[9px] font-medium tracking-wider text-zinc-300 block">
                      Just now • {author || 'UPROLL'}
                    </span>
                    <h2
                      onClick={(e) => {
                        if (redirectTargetUrl) {
                          e.stopPropagation();
                          window.open(redirectTargetUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className={`text-xs font-black text-white leading-tight line-clamp-2 drop-shadow-md ${
                        redirectTargetUrl ? 'cursor-pointer hover:underline decoration-amber-400 hover:text-[#A2D5B1]' : ''
                      }`}
                    >
                      {displayHeadline}
                    </h2>
                    {summary && (
                      <p className="text-[12.5px] text-zinc-200 leading-snug line-clamp-2 font-normal drop-shadow-xs">
                        {summary}
                      </p>
                    )}

                    {photos.length > 1 && (
                      <div className="flex items-center justify-center gap-1 pt-1">
                        {photos.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveGalleryIndex(idx)}
                            className={`transition-all duration-300 rounded-full cursor-pointer ${
                              idx === activeGalleryIndex
                                ? 'w-5 h-1.5 bg-[#A2D5B1]'
                                : 'w-1.5 h-1.5 bg-white/40'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : previewTab === 'card' && (
          <div className="flex-1 flex flex-col justify-between p-3.5 overflow-y-auto bg-white">
            {/* Top Category & Pinned Tag Bar */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-2xs ${badgeInfo.bg}`}>
                  <BadgeIcon className="w-3 h-3" />
                  <span>{badgeInfo.label}</span>
                </span>
                {isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    ★ PINNED #1
                  </span>
                )}
              </div>

              <span className="text-[10px] font-mono text-slate-400 font-bold">
                {storyId || '#8492'}
              </span>
            </div>

            {/* Media Area (Raw Image, Raw Video, YouTube, or Gallery) */}
            <div className="w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative aspect-video mb-2.5 group">
              {mediaType === 'youtube' && youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : mediaType === 'video' && videoUrl ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white backdrop-blur-sm"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : formatType === 'gallery' && galleryImages.length > 0 ? (
                <div className="relative w-full h-full">
                  <img
                    src={galleryImages[activeGalleryIndex] || imageUrl}
                    alt=""
                    className="w-full h-full object-cover transition-all"
                    referrerPolicy="no-referrer"
                  />
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                      {activeGalleryIndex + 1} / {galleryImages.length}
                    </div>
                  )}
                  {galleryImages.length > 1 && (
                    <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1">
                      {galleryImages.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveGalleryIndex(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            activeGalleryIndex === idx ? 'bg-white w-3' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Headline Title */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setPreviewTab('full')}
                className="text-left cursor-pointer w-full"
                title="Tap to preview full article"
              >
                <h3 className="text-[15px] font-black text-slate-900 leading-snug line-clamp-3">
                  {displayHeadline}
                </h3>
              </button>
            </div>

            {/* Format Specific Interactive Embeds */}
            {formatType === 'poll' && pollOptions.length > 0 && (
              <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 mb-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-black text-purple-900 uppercase">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-purple-600" />
                    Live Reader Poll
                  </span>
                  <span>Vote Now</span>
                </div>
                <div className="space-y-1">
                  {pollOptions.map((opt, idx) => {
                    const isSelected = selectedPollOption === opt.id;
                    return (
                      <button
                        key={opt.id || idx}
                        type="button"
                        onClick={() => setSelectedPollOption(opt.id)}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-white text-slate-800 border-purple-100 hover:border-purple-300'
                        }`}
                      >
                        <span className="truncate">{opt.text || `Option ${idx + 1}`}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {formatType === 'movie_review' && (
              <div className="space-y-2 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/90 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                      <Film className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-amber-950 truncate">
                        {movieDirector ? `Dir: ${movieDirector}` : 'Cinema Review'}
                      </div>
                      <div className="text-[9.5px] text-amber-800 font-medium">
                        {movieYear} • {movieCertificate}
                      </div>
                    </div>
                  </div>
                  {/* People Average Rate Chip */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black shadow-xs shrink-0">
                    <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                    <span>{movieRating || '8.6'}/10</span>
                  </div>
                </div>
              </div>
            )}

            {formatType === 'ask_reader' && (
              <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 mb-2 space-y-1">
                <div className="text-[10px] font-black text-indigo-900 uppercase flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-indigo-600" />
                  <span>Ask Reader Prompt</span>
                </div>
                <div className="text-[11px] font-bold text-slate-800">
                  {askReaderPrompt}
                </div>
              </div>
            )}

            {/* Card Summary / Synopsis Body - In a Modern Box if Movie Review */}
            {formatType === 'movie_review' ? (
              <div className="flex-1 min-h-[70px] mb-2 p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1 overflow-y-auto no-scrollbar">
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Synopsis</span>
                </div>
                <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                  {displaySummary}
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-[70px] mb-2 overflow-y-auto no-scrollbar space-y-1">
                <p className="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                  {displaySummary}
                </p>
              </div>
            )}

            {/* Bottom Meta Chips with Duration for Movie Review */}
            {formatType === 'movie_review' && (
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {movieRuntime && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                    <span>{movieRuntime}</span>
                  </span>
                )}
                {movieDirector && (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                    <Clapperboard className="w-2.5 h-2.5 text-amber-600" />
                    <span>Dir: {movieDirector}</span>
                  </span>
                )}
                {movieCast && (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[120px] flex items-center gap-1">
                    <Users className="w-2.5 h-2.5 text-amber-600" />
                    <span>Cast: {movieCast}</span>
                  </span>
                )}
              </div>
            )}

            {/* Dedicated Arrow Button for Movie Review in Emulator */}
            {formatType === 'movie_review' && (
              <button
                type="button"
                onClick={() => setPreviewTab('full')}
                className="w-full py-2 px-3 mb-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-between text-xs font-bold transition-all cursor-pointer shadow-sm group active:scale-[0.98]"
              >
                <span className="text-[11px] font-black text-amber-300">
                  View Full Movie Review, Cast & Specs
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Bottom Meta & Action Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="text-[10px] text-slate-500">
                <span className="font-bold text-slate-800">{displayAuthor}</span>
                <span className="mx-1">•</span>
                <span>Just now</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 text-slate-600">
                <button
                  type="button"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    isLiked ? 'text-rose-600 bg-rose-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsSaved(!isSaved)}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    isSaved ? 'text-amber-600 bg-amber-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Swipe Up Navigation Hint */}
            <div className="mt-1 pt-1 flex items-center justify-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <ChevronUp className="w-3 h-3 animate-bounce" />
              <span>Swipe up for next card</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: FULL ARTICLE VIEW (Detailed Body on Headline Tap) */}
        {/* ========================================================================= */}
        {previewTab === 'full' && (
          <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-white">
            {/* Top Back Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewTab('card')}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Card</span>
              </button>
              <span className="text-[10px] font-bold text-slate-400">2 min read</span>
            </div>

            {/* Category and Headline */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mb-2 self-start ${badgeInfo.bg}`}>
              <BadgeIcon className="w-3 h-3" />
              <span>{badgeInfo.label}</span>
            </span>

            <h2 className="text-base font-black text-slate-900 leading-snug mb-2.5">
              {displayHeadline}
            </h2>

            {/* Author info */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center">
                {displayAuthor.charAt(0)}
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-900">{displayAuthor}</div>
                <div className="text-[9px] text-slate-400">Published live • Full Story</div>
              </div>
            </div>

            {/* Feature Media */}
            <div className="w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3 aspect-video">
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Full Story Content Body (No character limit) */}
            <div className="prose prose-sm text-slate-800 text-xs leading-relaxed space-y-3 pb-6 font-normal">
              {displayFullContent.split('\n\n').map((para, i) => (
                <p key={i} className="text-slate-700 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: PUSH NOTIFICATION PREVIEW BANNER */}
        {/* ========================================================================= */}
        {previewTab === 'push' && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-100">
            <div className="w-full max-w-[320px] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200 shadow-xl space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black">
                    U
                  </div>
                  <span className="text-slate-900">UPROLL NEWS</span>
                </div>
                <span>now</span>
              </div>
              <div className="text-xs font-black text-slate-900 leading-tight">
                {displayHeadline}
              </div>
              <div className="text-[11px] text-slate-600 line-clamp-2 leading-snug">
                {displaySummary}
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-[11px] text-slate-500 font-medium">
                Push Notification Device Preview
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
