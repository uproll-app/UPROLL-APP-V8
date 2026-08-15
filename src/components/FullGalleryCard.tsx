import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Share2, Sparkles, ExternalLink, Bookmark } from 'lucide-react';

export interface GalleryPhoto {
  id: string;
  url: string;
  title?: string;
  caption?: string;
}

const DEFAULT_FULL_GALLERY_IMAGES: GalleryPhoto[] = [
  {
    id: 'g1',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop',
    title: 'Traditional Bridal Elegance',
    caption: 'Rashmika Mandanna in traditional gold jewellery & silk saree for bridal shoot',
  },
  {
    id: 'g2',
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop',
    title: 'Heritage Gold Craftsmanship',
    caption: 'Intricate temple jewellery and layered gold necklace styling',
  },
  {
    id: 'g3',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
    title: 'Cinematic Portrait',
    caption: 'Expressive close-up capturing radiant smile and royal bridal glow',
  },
  {
    id: 'g4',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop',
    title: 'Royal Wedding Couture',
    caption: 'Designer crimson lehenga with antique zari embroidery details',
  },
  {
    id: 'g5',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
    title: 'High Fashion Still',
    caption: 'Editorial portrait shot under warm studio spotlighting',
  },
];

interface FullGalleryCardProps {
  images?: (GalleryPhoto | string)[];
  publishedTime?: string;
  isWhiteMode?: boolean;
  onShare?: () => void;
  title?: string;
  isSponsored?: boolean;
  sponsorName?: string;
  ctaButtonLabel?: string;
  redirectTargetUrl?: string;
  badgeTag?: string;
}

export const FullGalleryCard: React.FC<FullGalleryCardProps> = ({
  images = DEFAULT_FULL_GALLERY_IMAGES,
  publishedTime = '20m ago',
  isWhiteMode = false,
  onShare,
  title,
  isSponsored = false,
  sponsorName,
  ctaButtonLabel = 'Explore Collection',
  redirectTargetUrl,
  badgeTag,
}) => {
  const normalizedImages: GalleryPhoto[] = (images && images.length > 0 ? images : DEFAULT_FULL_GALLERY_IMAGES)
    .slice(0, 10)
    .map((item, idx) => {
      if (typeof item === 'string') {
        return { id: String(idx + 1), url: item };
      }
      return item;
    });

  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  const touchStartX = useRef<number | null>(null);

  const handleNextImg = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % normalizedImages.length);
  };

  const handlePrevImg = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length);
  };

  // Horizontal touch swipe handling for sliding gallery images
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleCardClick = () => {
    if (redirectTargetUrl) {
      window.open(redirectTargetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -35) {
      handleNextImg();
    } else if (deltaX > 35) {
      handlePrevImg();
    } else if (Math.abs(deltaX) <= 10 && redirectTargetUrl) {
      handleCardClick();
    }
    touchStartX.current = null;
  };

  const currentPhoto = normalizedImages[activeImgIndex] || normalizedImages[0] || DEFAULT_FULL_GALLERY_IMAGES[0];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl select-none flex flex-col justify-between ${
        isWhiteMode ? 'bg-white text-slate-900 shadow-xl' : 'bg-black text-white'
      }`}
      style={{ backgroundColor: isWhiteMode ? '#ffffff' : '#000000' }}
    >
      {/* 1. Full Display Image */}
      <img
        src={currentPhoto.url}
        alt={currentPhoto.caption || 'Gallery photo'}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out"
      />

      {/* Vignette Overlay for top/bottom contrast */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isWhiteMode
            ? 'bg-gradient-to-b from-black/30 via-transparent to-black/70'
            : 'bg-gradient-to-b from-black/60 via-transparent via-50% to-black/85'
        }`}
      />

      {/* Top Header Bar: Bookmark & Share */}
      <div className="relative z-20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {badgeTag && (
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-[#A2D5B1] border border-white/15 shadow-sm">
              {badgeTag}
            </span>
          )}
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

      {/* Subtle Tap Navigation Zones (Left / Right half) */}
      <div
        onClick={handlePrevImg}
        className="absolute top-16 left-0 bottom-24 w-1/4 z-10 cursor-pointer flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border ${
            isWhiteMode
              ? 'bg-white/90 text-slate-900 border-slate-300 shadow-md'
              : 'bg-black/50 backdrop-blur-md text-white border-white/20'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </div>
      </div>

      {/* Center Zone: Tap to Open Brand Backlink if present */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleCardClick();
        }}
        className="absolute top-16 left-1/4 right-1/4 bottom-24 z-10 cursor-pointer"
        title={redirectTargetUrl ? 'Open brand partner page' : undefined}
      />

      <div
        onClick={handleNextImg}
        className="absolute top-16 right-0 bottom-24 w-1/4 z-10 cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border ${
            isWhiteMode
              ? 'bg-white/90 text-slate-900 border-slate-300 shadow-md'
              : 'bg-black/50 backdrop-blur-md text-white border-white/20'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      {/* Bottom Overlaid Footer: Headline & Horizontal Pagination Dots */}
      <div className="relative z-20 p-5 space-y-3">
        {title && (
          <h2
            onClick={(e) => {
              if (redirectTargetUrl) {
                e.stopPropagation();
                window.open(redirectTargetUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            className={`text-sm sm:text-base font-bold text-white leading-snug drop-shadow-md line-clamp-2 transition-none ${
              redirectTargetUrl ? 'cursor-pointer' : ''
            }`}
          >
            {title}
          </h2>
        )}

        {/* Bottom Horizontal Pagination Dots / Pill Indicator Bar */}
        {normalizedImages.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {normalizedImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex(idx);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === activeImgIndex
                    ? 'w-7 h-1.5 bg-[#A2D5B1] shadow-md shadow-[#A2D5B1]/40'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                }`}
                title={`Go to photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
