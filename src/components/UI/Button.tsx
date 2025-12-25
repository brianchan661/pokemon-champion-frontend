import { ReactNode, ButtonHTMLAttributes } from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  isLoading?: boolean;
}

interface ButtonAsButtonProps extends BaseButtonProps, ButtonHTMLAttributes<HTMLButtonElement> {
  href?: never;
}

interface ButtonAsLinkProps extends BaseButtonProps {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
  children?: ReactNode;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300 dark:bg-primary-500 dark:hover:bg-primary-600 dark:disabled:bg-primary-800',
  secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 dark:bg-dark-bg-secondary dark:text-dark-text-primary dark:hover:bg-dark-bg-tertiary dark:disabled:bg-dark-bg-primary',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 dark:bg-red-700 dark:hover:bg-red-800 dark:disabled:bg-red-900',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400 dark:text-dark-text-primary dark:hover:bg-dark-bg-tertiary dark:disabled:text-dark-text-tertiary',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

const baseStyles = 'rounded-lg transition-colors font-medium disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

/**
 * Reusable button component with consistent styling
 * Can render as button or Link based on href prop
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  isLoading = false,
  ...props
}: ButtonProps) => {
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={combinedClassName}>
        {isLoading && <span className="animate-spin">⏳</span>}
        {children}
      </Link>
    );
  }

  return (
    <button
      {...props as ButtonHTMLAttributes<HTMLButtonElement>}
      className={combinedClassName}
      disabled={props.disabled || isLoading}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
