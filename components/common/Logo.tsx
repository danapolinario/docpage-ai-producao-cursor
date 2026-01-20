import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true,
  textClassName = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg shadow-lg shadow-blue-900/20 flex items-center justify-center relative overflow-hidden group`}>
        {/* Background gradient animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* AI Icon - Sparkles/Neural Network */}
        <svg 
          className={`${iconSizes[size]} relative z-10 text-white`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={2}
        >
          {/* Neural network / AI nodes */}
          <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
          <circle cx="16" cy="8" r="1.5" fill="currentColor" opacity="0.9" />
          <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.9" />
          
          {/* Connections */}
          <path 
            d="M8 8 L12 16 M16 8 L12 16 M8 8 L16 8" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            opacity="0.6"
          />
          
          {/* Sparkles */}
          <circle cx="6" cy="6" r="0.5" fill="currentColor" opacity="0.7">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="18" cy="6" r="0.5" fill="currentColor" opacity="0.7">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="12" cy="18" r="0.5" fill="currentColor" opacity="0.7">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold text-xl tracking-tight text-gray-800 ${textClassName}`}>
          DocPage AI
        </span>
      )}
    </div>
  );
};
