import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Smartphone, Maximize2, RotateCcw, Code2 } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  activeScreen: string;
  onReset?: () => void;
  onOpenFlutterCode?: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  activeScreen,
  onReset,
  onOpenFlutterCode,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('9:41');
  const [isMobileMode, setIsMobileMode] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours % 12 || 12}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-2 sm:p-6 relative select-none overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Floating Control Toolbar */}
      <div className="fixed top-3 z-50 flex items-center gap-2 bg-[#12141A]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 shadow-xl text-xs font-semibold text-zinc-300">
        <button
          onClick={() => setIsMobileMode(!isMobileMode)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors cursor-pointer ${
            isMobileMode
              ? 'bg-[#A2D5B1] text-slate-900 font-bold'
              : 'hover:bg-zinc-800 text-zinc-400'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Device View</span>
        </button>

        <button
          onClick={() => setIsMobileMode(!isMobileMode)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors cursor-pointer ${
            !isMobileMode
              ? 'bg-[#A2D5B1] text-slate-900 font-bold'
              : 'hover:bg-zinc-800 text-zinc-400'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Full Width</span>
        </button>

        {onOpenFlutterCode && (
          <button
            onClick={onOpenFlutterCode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 font-bold transition-colors cursor-pointer border border-sky-500/30"
            title="View Flutter Dart Code"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Flutter Dart</span>
          </button>
        )}

        {onReset && (
          <button
            onClick={onReset}
            className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
            title="Reset Flow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 flex items-center justify-center my-6 ${
          isMobileMode ? 'max-w-[465px]' : 'max-w-2xl'
        }`}
      >
        {/* Device Wrapper matching the dark curved phone border in the user's images */}
        <div
          className={`w-full bg-black relative flex flex-col justify-between overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] transition-all ${
            isMobileMode
              ? 'rounded-[40px] sm:rounded-[44px] border-[6px] sm:border-[8px] border-[#1A1D24] aspect-[9/18.5] min-h-[760px] sm:min-h-[820px]'
              : 'rounded-3xl border border-zinc-800 min-h-[700px]'
          }`}
        >
          {/* Status Bar */}
          <div className="w-full flex items-center justify-between px-7 pt-3.5 pb-2 text-xs text-white font-semibold tracking-tight z-30 select-none">
            <span className="text-xs font-bold pl-1">{currentTime}</span>

            {/* Dynamic Island / Speaker Pill */}
            <div className="w-20 h-4 bg-black rounded-full border border-zinc-800/50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-zinc-900/80 mr-3"></div>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-300 pr-1">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4 fill-white text-white" />
            </div>
          </div>

          {/* Screen Body */}
          <div className="flex-1 flex flex-col relative w-full overflow-y-auto no-scrollbar">
            {children}
          </div>

          {/* Home Indicator Bar */}
          <div className="w-full py-2 flex items-center justify-center z-30 pointer-events-none">
            <div className="w-32 h-1 bg-zinc-600/70 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
