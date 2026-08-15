import React, { useState, useRef } from 'react';
import { Bookmark, Share2, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';

const DEFAULT_BACKGROUND_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1000&auto=format&fit=crop',
];

interface BackgroundArticleCardProps {
  image?: string;
  images?: string[];
  bgImage?: string;
  title?: string;
  publishedTime?: string;
  isWhiteMode?: boolean;
  onShare?: () => void;
  onSelect?: () => void;
  isSponsored?: boolean;
  sponsorName?: string;
  ctaButtonLabel?: string;
  redirectTargetUrl?: string;
}

export const BackgroundArticleCard: React.FC<BackgroundArticleCardProps> = ({
  image,
  images = DEFAULT_BACKGROUND_IMAGES,
  bgImage,
  title = 'Rasmika Weeding Photos',
  publishedTime = '15m ago',
  isWhiteMode = false,
  onShare,
  onSelect,
  isSponsored = false,
  sponsorName,
  ctaButtonLabel = 'Visit Brand',
  redirectTargetUrl,
}) => {
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);

  // Combine fallback image or full images list
  const photoList = images && images.length >= 10 ? images : [image || DEFAULT_BACKGROUND_IMAGES[0], ...DEFAULT_BACKGROUND_IMAGES.slice(1)];
  const currentPhoto = photoList[activeImgIndex] || photoList[0];
  const displayBg = bgImage || currentPhoto;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % photoList.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + photoList.length) % photoList.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -35) {
      handleNext();
    } else if (deltaX > 35) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full flex-1 h-full rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl select-none flex flex-col justify-between transition-colors ${
        isWhiteMode ? 'bg-white text-slate-900 shadow-xl' : 'bg-black text-white'
      }`}
      style={{ backgroundColor: isWhiteMode ? '#ffffff' : '#000000' }}
    >
      {/* 1. Background Layer (Solid in white mode, blurred backdrop with vignette in dark mode) */}
      {!isWhiteMode && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={displayBg}
            alt="Background visual"
            className="w-full h-full object-cover scale-110 filter blur-md brightness-[0.65]"
          />
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/85" />
        </div>
      )}

      {/* 2. Top Right Floating Controls (Bookmark & Share Buttons) */}
      <div className="relative z-20 p-4 flex justify-end items-center">
        <div className="flex items-center gap-2.5 ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsBookmarked(!isBookmarked);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md border cursor-pointer active:scale-95 ${
              isWhiteMode
                ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                : 'bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border-white/15'
            }`}
            title="Bookmark"
          >
            <Bookmark
              className={`w-4 h-4 ${
                isBookmarked
                  ? isWhiteMode
                    ? 'text-emerald-600 fill-emerald-600'
                    : 'text-[#A2D5B1] fill-[#A2D5B1]'
                  : isWhiteMode
                  ? 'text-slate-700'
                  : 'text-white'
              }`}
            />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onShare) onShare();
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md border cursor-pointer active:scale-95 ${
              isWhiteMode
                ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                : 'bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border-white/15'
            }`}
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Centered Inner Featured Image Card with Left/Right Touch Tap Controls */}
      <div className="relative z-10 px-5 flex-1 flex items-center justify-center">
        <div
          className={`relative w-full h-[360px] sm:h-[400px] rounded-[32px] overflow-hidden shadow-2xl border ${
            isWhiteMode ? 'border-slate-200' : 'border-white/15'
          }`}
        >
          <img
            src={currentPhoto}
            alt={title}
            className="w-full h-full object-cover"
          />

          {/* Left Arrow Tap Overlay */}
          <button
            onClick={handlePrev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border opacity-80 hover:opacity-100 transition-opacity cursor-pointer z-20 ${
              isWhiteMode
                ? 'bg-white/90 text-slate-900 border-slate-300 shadow-md'
                : 'bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border-white/10'
            }`}
            title="Previous Photo"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow Tap Overlay */}
          <button
            onClick={handleNext}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border opacity-80 hover:opacity-100 transition-opacity cursor-pointer z-20 ${
              isWhiteMode
                ? 'bg-white/90 text-slate-900 border-slate-300 shadow-md'
                : 'bg-black/40 hover:bg-black/70 backdrop-blur-md text-white border-white/10'
            }`}
            title="Next Photo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 4. Bottom Title & 10 Pagination Indicator Dots */}
      <div className="relative z-20 pb-6 pt-3 px-6 flex flex-col items-center space-y-3.5 text-center">
        {/* Title & Published Time */}
        <div className="space-y-1">
          <h2
            onClick={(e) => {
              e.stopPropagation();
              if (redirectTargetUrl) {
                window.open(redirectTargetUrl, '_blank', 'noopener,noreferrer');
              } else if (onSelect) {
                onSelect();
              }
            }}
            className={`text-lg sm:text-xl font-extrabold tracking-wide capitalize cursor-pointer hover:opacity-85 active:opacity-70 transition-opacity ${
              isWhiteMode ? 'text-slate-900 hover:text-indigo-600' : 'text-white hover:text-emerald-300 drop-shadow-md'
            }`}
            title="Tap headline to read story"
          >
            {title}
          </h2>
          <p
            className={`text-[10px] sm:text-[11px] tracking-wider ${
              isWhiteMode ? 'text-zinc-500 font-medium' : 'text-zinc-400 font-thin'
            }`}
          >
            {publishedTime}
          </p>
        </div>

        {/* 10 Pagination Dots Indicator (Matching image.png: Active Lime pill + remaining dots) */}
        <div className="flex items-center justify-center gap-1.5 max-w-full overflow-x-auto no-scrollbar py-1">
          {photoList.map((_, idx) => {
            const isActive = idx === activeImgIndex;
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex(idx);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? isWhiteMode
                      ? 'w-7 h-2 bg-emerald-600 shadow-md'
                      : 'w-7 h-2 bg-[#A2D5B1] shadow-md shadow-[#A2D5B1]/40'
                    : isWhiteMode
                    ? 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
                title={`Go to photo ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

