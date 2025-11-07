import { ReactNode } from 'react';

interface ErrorMessageProps {
  message: string | ReactNode;
  className?: string;
  variant?: 'error' | 'warning' | 'info';
}

const variantStyles = {
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

/**
 * Reusable error/warning/info message component
 */
export const ErrorMessage = ({ 
  message, 
  variant = 'error',
  className = '' 
}: ErrorMessageProps) => {
  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]} ${className}`}>
      {message}
    </div>
  );
};
