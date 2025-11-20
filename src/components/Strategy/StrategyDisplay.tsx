import { MentionChip } from './MentionChip';
import { StrategySegment, MentionToken } from './MentionTextarea';

interface StrategyDisplayProps {
  strategy: string; // JSON string or plain text
  className?: string;
}

export function StrategyDisplay({ strategy, className = '' }: StrategyDisplayProps) {
  // Parse strategy (could be JSON or plain text)
  const parseStrategy = (str: string): StrategySegment[] => {
    if (!str) return [];

    try {
      const parsed = JSON.parse(str);
      if (parsed.segments && Array.isArray(parsed.segments)) {
        return parsed.segments;
      }
    } catch (e) {
      // Plain text - return as single text segment
      return [{ type: 'text', content: str }];
    }

    // Fallback to plain text
    return [{ type: 'text', content: str }];
  };

  const segments = parseStrategy(strategy);

  if (segments.length === 0) {
    return (
      <p className={`text-gray-500 dark:text-dark-text-tertiary italic ${className}`}>
        No strategy provided
      </p>
    );
  }

  return (
    <div className={`text-gray-700 dark:text-dark-text-primary whitespace-pre-wrap ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.content as string}</span>;
        } else {
          return (
            <MentionChip
              key={index}
              mention={segment.content as MentionToken}
              className="mx-0.5"
            />
          );
        }
      })}
    </div>
  );
}
