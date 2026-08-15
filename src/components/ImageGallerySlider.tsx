import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Images } from 'lucide-react';
import khalifaPoster from '../assets/images/khalifa_movie_poster_1786627482287.jpg';

export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  tag: string;
}

const GALLERY_IMAGES: GalleryItem[] = [
  {
    id: '1',
    url: khalifaPoster,
    caption: "'Khalifa' Official First Look Mass Teaser Poster featuring luxury aesthetics",
    tag: 'Official Poster',
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
    caption: 'High-voltage Dubai Desert Chase sequence shot in 8K IMAX format',
    tag: 'Action Stills',
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop',
    caption: 'Behind the Scenes: Director Vysakh reviewing cinematography shots on set',
    tag: 'BTS',
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000&auto=format&fit=crop',
    caption: 'Night Sequence: Neon illuminated street fight choreography in Kochi harbour',
    tag: 'Location Still',
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1518676599626-5cd8c2d3f85f?q=80&w=1000&auto=format&fit=crop',
    caption: 'Grand audio launch event featuring lead cast and musical performance',
    tag: 'Audio Launch',
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=1000&auto=format&fit=crop',
    caption: 'Anamorphic lens film camera setup for high stakes climax shootout',
    tag: 'Behind the Scenes',
  },
  {
    id: '7',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop',
    caption: 'Packed Premiere Show: Audience reactions during high-energy interval scene',
    tag: 'Fans Reactions',
  },
  {
    id: '8',
    url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1000&auto=format&fit=crop',
    caption: 'Vintage rolls luxury sedan used in main protagonist entry sequence',
    tag: 'Prop Stills',
  },
  {
    id: '9',
    url: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=1000&auto=format&fit=crop',
    caption: 'Color grading and post-production studio setup for Dolby Atmos audio mix',
    tag: 'Post Production',
  },
  {
    id: '10',
    url: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=1000&auto=format&fit=crop',
    caption: 'Character poster unveiling event across major cities in South India',
    tag: 'Promotions',
  },
];

export interface ImageGallerySliderProps {
  images?: string[];
  isWhiteMode?: boolean;
}

export const ImageGallerySlider: React.FC<ImageGallerySliderProps> = ({
  images,
  isWhiteMode = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const activeGallery: GalleryItem[] =
    images && images.length > 0
      ? images.map((url, index) => ({
          id: String(index + 1),
          url,
          caption: `Photo ${index + 1} of ${images.length}`,
          tag: `Slide ${index + 1}`,
        }))
      : GALLERY_IMAGES;

  const currentItem = activeGallery[currentIndex] || activeGallery[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeGallery.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeGallery.length) % activeGallery.length);
  };

  if (!currentItem) return null;

  return (
    <div
      className={`rounded-2xl p-4 border shadow-xl space-y-3 my-2 ${
        isWhiteMode
          ? 'bg-slate-50 border-slate-200 text-slate-900'
          : 'bg-[#12151B] border-zinc-800/90 text-white'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 font-extrabold text-sm sm:text-base ${
            isWhiteMode ? 'text-slate-900' : 'text-white'
          }`}
        >
          <Images className={`w-4 h-4 ${isWhiteMode ? 'text-emerald-600' : 'text-[#A2D5B1]'}`} />
          <span>Photo Gallery</span>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            isWhiteMode
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-zinc-800 text-[#A2D5B1] border-zinc-700/60'
          }`}
        >
          {currentIndex + 1} / {activeGallery.length}
        </span>
      </div>

      {/* Main Image View Card */}
      <div className="relative w-full h-[220px] sm:h-[250px] rounded-xl overflow-hidden bg-black border border-zinc-800 group">
        <img
          src={currentItem.url}
          alt={currentItem.caption}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Top Tag */}
        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-white/10 uppercase tracking-wider">
          {currentItem.tag}
        </div>

        {/* Fullscreen Expand Button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
          title="Open Fullscreen Lightbox"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Navigation Arrows */}
        {activeGallery.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Caption Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 text-xs text-zinc-200 font-medium line-clamp-2">
          {currentItem.caption}
        </div>
      </div>

      {/* Horizontal Thumbnails Strip */}
      {activeGallery.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          {activeGallery.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                idx === currentIndex
                  ? isWhiteMode
                    ? 'border-emerald-600 scale-105 shadow-md opacity-100'
                    : 'border-[#A2D5B1] scale-105 shadow-md opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 animate-fade-in">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white border-b border-zinc-800 pb-3">
            <span className="text-sm font-bold">
              Image {currentIndex + 1} of {activeGallery.length} • {currentItem.tag}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Image */}
          <div className="flex-1 flex items-center justify-center relative my-auto p-2">
            <img
              src={currentItem.url}
              alt={currentItem.caption}
              className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {activeGallery.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-black text-white flex items-center justify-center border border-zinc-700 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-black text-white flex items-center justify-center border border-zinc-700 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Caption */}
          <div className="text-center text-sm font-medium text-zinc-300 max-w-lg mx-auto bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            {currentItem.caption}
          </div>
        </div>
      )}
    </div>
  );
};
