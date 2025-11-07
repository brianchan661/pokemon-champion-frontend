import { memo } from 'react';

interface AdPlaceholderProps {
  width?: string;
  height?: string;
  className?: string;
}

export const AdPlaceholder = memo(({ 
  width = '100%',
  height = '250px',
  className = ''
}: AdPlaceholderProps) => {
  return (
    <div 
      className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg ${className}`}
      style={{ width, height }}
    >
      <div className="text-center text-gray-500">
        <div className="text-lg font-semibold mb-2">Advertisement</div>
        <div className="text-sm">Google AdSense</div>
        <div className="text-xs mt-1 opacity-75">{width} × {height}</div>
      </div>
    </div>
  );
});

AdPlaceholder.displayName = 'AdPlaceholder';