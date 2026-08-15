import React from 'react';

interface UprollLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  blurred?: boolean;
}

export const UprollLogo: React.FC<UprollLogoProps> = ({
  size = 'lg',
  className = '',
  blurred = false,
}) => {
  const sizeClasses = {
    sm: 'text-2xl tracking-tighter',
    md: 'text-4xl tracking-tighter',
    lg: 'text-5xl sm:text-6xl tracking-tighter',
    xl: 'text-6xl sm:text-7xl tracking-tighter',
  };

  return (
    <div
      className={`inline-flex items-center justify-center font-extrabold text-white select-none transition-all duration-300 ${
        blurred ? 'blur-md opacity-30 scale-95' : 'blur-none opacity-100 scale-100'
      } ${sizeClasses[size]} ${className}`}
    >
      <span className="font-extrabold text-white tracking-tighter">uproll</span>
      <span className="text-[#A2D5B1] font-bold ml-0.5 tracking-normal transition-colors duration-200">
        //
      </span>
    </div>
  );
};
