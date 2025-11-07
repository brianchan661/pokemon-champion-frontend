import Link from 'next/link';
import { ReactNode, memo } from 'react';

interface NewsCardProps {
  href: string;
  icon: ReactNode;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readMoreText: string;
  categoryColor: 'primary' | 'green' | 'orange';
}

const categoryClasses = {
  primary: 'bg-primary-100 text-primary-800',
  green: 'bg-green-100 text-green-800',
  orange: 'bg-orange-100 text-orange-800'
};

const gradientClasses = {
  primary: 'from-primary-400 to-primary-600',
  green: 'from-green-400 to-green-600',
  orange: 'from-orange-400 to-orange-600'
};

export const NewsCard = memo(({
  href,
  icon,
  category,
  title,
  excerpt,
  date,
  readMoreText,
  categoryColor
}: NewsCardProps) => {
  return (
    <article className="card hover:shadow-lg transition-shadow duration-300">
      <div className={`aspect-video bg-gradient-to-br ${gradientClasses[categoryColor]} rounded-lg mb-4 flex items-center justify-center`}>
        {icon}
      </div>
      <div className="space-y-2">
        <span className={`inline-block px-3 py-1 ${categoryClasses[categoryColor]} text-sm font-medium rounded-full`}>
          {category}
        </span>
        <h3 className="text-xl font-semibold text-gray-900">
          {title}
        </h3>
        <p className="text-gray-600">
          {excerpt}
        </p>
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-500">
            {date}
          </span>
          <Link href={href} className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            {readMoreText}
          </Link>
        </div>
      </div>
    </article>
  );
});

NewsCard.displayName = 'NewsCard';