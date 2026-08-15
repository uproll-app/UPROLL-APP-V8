import React from 'react';

interface StoryProgressProps {
  totalSteps?: number;
  activeStep: number; // 0-indexed
  progressPercent?: number; // 0-100 for active step
  onStepClick?: (step: number) => void;
  className?: string;
}

export const StoryProgress: React.FC<StoryProgressProps> = ({
  totalSteps = 3,
  activeStep = 1,
  progressPercent = 100,
  onStepClick,
  className = '',
}) => {
  return (
    <div className={`w-full flex items-center gap-1.5 px-4 pt-3 pb-1 ${className}`}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        let isCompleted = index < activeStep;
        let isActive = index === activeStep;

        return (
          <button
            key={index}
            onClick={() => onStepClick?.(index)}
            className="flex-1 h-1 bg-[#27272A] rounded-full overflow-hidden relative cursor-pointer group focus:outline-none focus:ring-1 focus:ring-[#A2D5B1]"
            aria-label={`Go to story slide ${index + 1}`}
          >
            <div
              className="h-full bg-[#A2D5B1] rounded-full transition-all duration-300 ease-out group-hover:brightness-110"
              style={{
                width: isCompleted
                  ? '100%'
                  : isActive
                  ? `${progressPercent}%`
                  : '0%',
              }}
            />
          </button>
        );
      })}
    </div>
  );
};
