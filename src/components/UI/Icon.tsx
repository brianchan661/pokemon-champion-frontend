import { memo } from 'react';

interface IconProps {
  path: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
} as const;

export const Icon = memo(({ path, size = 'md', className = '' }: IconProps) => {
  const sizeClass = sizeClasses[size];
  
  return (
    <svg 
      className={`${sizeClass} ${className}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
});

Icon.displayName = 'Icon';