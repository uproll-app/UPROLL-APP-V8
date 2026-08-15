import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CompleteModalProps {
  onComplete: () => void;
}

export const CompleteModal: React.FC<CompleteModalProps> = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState<number>(5);

  useEffect(() => {
    // Celebratory confetti burst on successful log in
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#A2D5B1', '#61C081', '#FFFFFF', '#34D399'],
    });

    // 5-second countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="w-full flex flex-col items-center justify-end relative z-20">
      {/* Bottom Sheet Modal Card matching Image 1 */}
      <div className="w-full bg-[#F3F7F4] text-slate-900 rounded-t-[36px] sm:rounded-t-[40px] rounded-b-[28px] p-6 sm:p-7 shadow-2xl transition-all duration-300 animate-slide-up border border-slate-200/80">
        {/* Header Title Centered */}
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight text-center mb-5">
          Complete
        </h2>

        {/* Big Circular Green Checkmark Icon */}
        <div className="flex justify-center my-3">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#D4EAD9] flex items-center justify-center p-2.5 shadow-inner">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#82C394] flex items-center justify-center text-slate-950 shadow-sm">
              <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Text Message */}
        <div className="text-center space-y-1.5 my-4">
          <h3 className="text-xl sm:text-22 font-extrabold text-slate-900 tracking-tight">
            Logged in successfully!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Welcome back! Redirecting to feed in <span className="font-bold text-slate-800">{timeLeft}s</span>...
          </p>
        </div>

        {/* Green Complete Button */}
        <button
          onClick={onComplete}
          className="w-full py-3.5 sm:py-4 rounded-full bg-[#91C7A1] hover:bg-[#81BA91] active:scale-[0.98] text-slate-950 font-extrabold text-base transition-all shadow-md cursor-pointer mt-2 flex items-center justify-center"
        >
          <span>Complete ({timeLeft}s)</span>
        </button>
      </div>
    </div>
  );
};
