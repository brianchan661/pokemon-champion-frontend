import { ReactNode, ButtonHTMLAttributes, useMemo } from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  className?: string;
  loading?: boolean;
  loadingText?: string;
  'aria-label'?: string;
}

interface ButtonAsButtonProps extends BaseButtonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  href?: never;
}

interface ButtonAsLinkProps extends BaseButtonProps {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
  loading?: never;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300',
  secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

const baseStyles = 'rounded-lg transition-colors font-medium disabled:cursor-not-allowed inline-flex items-center justify-center';

const LoadingSpinner = () => (
  <svg 
    className="animate-spin -ml-1 mr-2 h-4 w-4" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
    />
  </svg>
);

/**
 * Reusable button component with consistent styling
 * Can render as button or Link based on href prop
 * 
 * @example
 * // Regular button
 * <Button onClick={handleClick}>Click me</Button>
 * 
 * @example
 * // Link button
 * <Button href="/teams">View Teams</Button>
 * 
 * @example
 * // Loading state
 * <Button loading loadingText="Saving...">Save Team</Button>
 * 
 * @example
 * // Icon-only button (requires aria-label)
 * <Button aria-label="Close"><CloseIcon /></Button>
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  href,
  loading,
  loadingText,
  ...props
}: ButtonProps) => {
  // Development warnings
  if (process.env.NODE_ENV === 'development') {
    if (!children && !props['aria-label']) {
      console.warn('Button: Component without children should have aria-label for accessibility');
    }
  }

  const combinedClassName = useMemo(
    () => `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`,
    [variant, size, className]
  );

  // Render as Link
  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  // Render as button
  const buttonContent = loading ? (
    <>
      <LoadingSpinner />
      {loadingText || children}
    </>
  ) : children;

  return (
    <button 
      {...props} 
      className={combinedClassName}
      disabled={props.disabled || loading}
      aria-busy={loading}
    >
      {buttonContent}
    </button>
  );
};
