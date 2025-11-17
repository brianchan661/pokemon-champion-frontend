import Link from 'next/link';
import { memo } from 'react';
import { CategoryColor } from '@/types/home';

interface NewsListItemProps {
  href: string;
  date: string;
  title: string;
  category?: string;
  categoryColor?: CategoryColor;
  thumbnail?: string | null;
}

// Move outside component to prevent recreation on each render
const CATEGORY_STYLES = {
  primary: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  orange: 'bg-orange-100 text-orange-800'
} as const;

export const NewsListItem = memo(({
  href,
  date,
  title,
  category,
  categoryColor = 'primary',
  thumbnail
}: NewsListItemProps) => {
  return (
    <Link
      href={href}
      className="group block py-4 px-6 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors duration-200 border-b border-gray-100 dark:border-dark-border last:border-b-0"
    >
      <div className="flex items-center gap-4 min-h-[5rem]">
        {/* Thumbnail Image or Placeholder */}
        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-bg-tertiary">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400 dark:text-dark-text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-500 dark:text-dark-text-secondary font-mono">
              {date}
            </span>
            {category && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[categoryColor]}`}>
                {category}
              </span>
            )}
          </div>
          <h3 className="text-gray-900 dark:text-dark-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 line-clamp-2">
            {title}
          </h3>
        </div>

        {/* Arrow Icon */}
        <div className="ml-4 flex-shrink-0">
          <svg
            className="w-5 h-5 text-gray-400 dark:text-dark-text-secondary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
});

NewsListItem.displayName = 'NewsListItem';