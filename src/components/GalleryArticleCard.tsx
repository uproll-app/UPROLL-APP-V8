import React, { useState, useRef } from 'react';
import { Bookmark, Share2, Images, ExternalLink } from 'lucide-react';

interface GalleryArticleCardProps {
  images?: string[];
  featureImage?: string;
  title: string;
  summary?: string;
  category?: string;
  publishedTime?: string;
  isWhiteMode?: boolean;
  headerOverlay?: boolean;
  onShare?: () => void;
  onSelect?: () => void;
  isSponsored?: boolean;
  sponsorName?: string;
  redirectTargetUrl?: string;
  ctaButtonLabel?: string;
  badgeTag?: string;
}

export const GalleryArticleCard: React.FC<GalleryArticleCardProps> = ({
  images = [],
  featureImage,
  title,
  summary,
  category = 'Photo Gallery',
  publishedTime = '15m ago',
  isWhiteMode = false,
  headerOverlay = true,
  onShare,
  onSelect,
  isSponsored = false,
  sponsorName,
  redirectTargetUrl,
  ctaButtonLabel,
  badgeTag,
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);

  const handleAction = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (redirectTargetUrl) {
      window.open(redirectTargetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Normalize image array
  const photoList = images && images.length > 0 ? images : featureImage ? [featureImage] : [
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop',
  ];

  const currentPhoto = photoList[activeIdx] || photoList[0];

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % photoList.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + photoList.length) % photoList.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -40) {
      handleNext();
    } else if (deltaX > 40) {
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
      {/* Full Image Background */}
      <img
        src={currentPhoto}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
      />

      {/* Ambient Dark Gradient Overlays for High Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 via-45% to-black/70 pointer-events-none" />

      {/* Top Control Bar: Category + Bookmark & Share */}
      <div className="relative z-20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {badgeTag ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-[#A2D5B1] border border-white/15 shadow-sm">
              <Images className="w-3 h-3 text-[#A2D5B1]" />
              <span>{badgeTag}</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsBookmarked(!isBookmarked);
            }}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
            title="Bookmark story"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-[#A2D5B1] fill-[#A2D5B1]' : 'text-white'}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onShare) onShare();
            }}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
            title="Share story"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tap Navigation Zones (Left & Right halves) */}
      <div
        onClick={handlePrev}
        className="absolute top-16 bottom-36 left-0 w-1/4 z-10 cursor-pointer"
        title="Previous photo"
      />
      {/* Center Zone: Tap to Open Brand Backlink if present */}
      <div
        onClick={handleAction}
        className="absolute top-16 bottom-36 left-1/4 right-1/4 z-10 cursor-pointer"
        title={redirectTargetUrl ? 'Open brand partner page' : undefined}
      />
      <div
        onClick={handleNext}
        className="absolute top-16 bottom-36 right-0 w-1/4 z-10 cursor-pointer"
        title="Next photo"
      />

      {/* Bottom Overlaid Header: Date, Headline, Summary, CTA & Pagination Dots */}
      <div
        className="relative z-20 p-5 space-y-2.5"
      >
        <div className="space-y-1.5">
          <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-zinc-300/90 block">
            {publishedTime}
          </span>

          {/* Overlaid Headline with Direct Backlink / Open click */}
          <h2
            onClick={(e) => {
              e.stopPropagation();
              if (redirectTargetUrl) {
                window.open(redirectTargetUrl, '_blank', 'noopener,noreferrer');
              } else if (onSelect) {
                onSelect();
              }
            }}
            className="text-base sm:text-lg font-black text-white leading-snug tracking-tight drop-shadow-md line-clamp-2 transition-opacity cursor-pointer hover:opacity-85 active:opacity-70"
            title="Tap headline to read story"
          >
            {title}
          </h2>

          {/* Overlaid Summary (Body part - not clickable) */}
          {summary && (
            <p className="text-sm sm:text-[15px] text-zinc-200/90 leading-relaxed font-normal line-clamp-3 drop-shadow-sm cursor-default">
              {summary}
            </p>
          )}
        </div>

        {/* Bottom Pagination Dots */}
        {photoList.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {photoList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(idx);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === activeIdx
                    ? 'w-6 h-1.5 bg-[#A2D5B1] shadow-md shadow-[#A2D5B1]/40'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                }`}
                title={`Photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
