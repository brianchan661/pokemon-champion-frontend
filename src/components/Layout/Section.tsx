import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  ariaLabel: string;
  containerClassName?: string;
}

export const Section = ({ 
  children, 
  className = '', 
  ariaLabel, 
  containerClassName = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' 
}: SectionProps) => {
  return (
    <section className={className} aria-label={ariaLabel}>
      <div className={containerClassName}>
        {children}
      </div>
    </section>
  );
};