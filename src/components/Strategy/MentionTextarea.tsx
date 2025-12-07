import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { useMentions, MentionOption } from '@/hooks/useMentions';
import { MentionAutocomplete } from './MentionAutocomplete';
import { StrategyDisplay } from './StrategyDisplay';

export interface MentionToken {
  type: 'pokemon' | 'move' | 'item' | 'ability';
  id: number;
  name: string;
  sprite?: string;
  nationalNumber?: string; // For Pokemon URLs
  moveType?: string;
  moveCategory?: string;
}

export interface StrategySegment {
  type: 'text' | 'mention';
  content: string | MentionToken;
}

interface MentionTextareaProps {
  value: string; // JSON string or plain text
  onChange: (value: string) => void; // Returns JSON string
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 8,
  maxLength = 2000,
  className = '',
}: MentionTextareaProps) {
  const { t } = useTranslation('common');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const { options, loading, searchMentions } = useMentions();

  // Parse value (could be JSON or plain text)
  const parseValue = useCallback((val: string): StrategySegment[] => {
    if (!val) return [];

    try {
      const parsed = JSON.parse(val);
      if (parsed.segments && Array.isArray(parsed.segments)) {
        return parsed.segments;
      }
    } catch (e) {
      // Plain text - convert to single text segment
      return [{ type: 'text', content: val }];
    }

    return [{ type: 'text', content: val }];
  }, []);

  // Convert segments to display text
  const segmentsToDisplayText = useCallback((segments: StrategySegment[]): string => {
    return segments
      .map((seg) => {
        if (seg.type === 'text') {
          return seg.content as string;
        } else {
          const mention = seg.content as MentionToken;
          return `@${mention.name}`;
        }
      })
      .join('');
  }, []);

  // Get current display text
  const [displayText, setDisplayText] = useState(() => segmentsToDisplayText(parseValue(value)));

  // Update display text when value changes externally
  useEffect(() => {
    setDisplayText(segmentsToDisplayText(parseValue(value)));
  }, [value, parseValue, segmentsToDisplayText]);

  // Search mentions with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMentions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMentions]);

  // Handle text input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const cursorPos = e.target.selectionStart;

    setDisplayText(newText);

    // Check for @ character to show autocomplete
    const beforeCursor = newText.slice(0, cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if @ is at start or after whitespace
      const charBeforeAt = lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) {
        const query = beforeCursor.slice(lastAtIndex + 1);

        // Check if there's a space after @ (means mention is complete)
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionStart(lastAtIndex);
          setSearchQuery(query);
          setShowAutocomplete(true);
          setSelectedIndex(0);

          // Calculate dropdown position
          if (textareaRef.current) {
            const textarea = textareaRef.current;
            const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
            const lines = beforeCursor.split('\n');
            const currentLine = lines.length;
            const top = textarea.offsetTop + currentLine * lineHeight + lineHeight;
            const left = textarea.offsetLeft + 10;

            setAutocompletePosition({ top, left });
          }

          // Don't update segments yet, waiting for selection
          return;
        }
      }
    }

    setShowAutocomplete(false);

    // Parse existing segments to preserve mentions
    const currentSegments = parseValue(value);
    const updatedSegments = updateSegmentsFromText(currentSegments, newText);

    // Save updated segments
    const jsonValue = JSON.stringify({ segments: updatedSegments });
    onChange(jsonValue);
  };

  // Update segments based on text changes while preserving mentions
  const updateSegmentsFromText = (currentSegments: StrategySegment[], newText: string): StrategySegment[] => {
    // Build a map of mention positions in the current display text
    let currentDisplayText = '';
    const mentionMap: { start: number; end: number; segment: StrategySegment }[] = [];

    currentSegments.forEach((seg) => {
      const startPos = currentDisplayText.length;
      if (seg.type === 'text') {
        currentDisplayText += seg.content as string;
      } else {
        const mention = seg.content as MentionToken;
        const mentionText = `@${mention.name}`;
        mentionMap.push({
          start: startPos,
          end: startPos + mentionText.length,
          segment: seg,
        });
        currentDisplayText += mentionText;
      }
    });

    // If text matches current display text, no change needed
    if (newText === currentDisplayText) {
      return currentSegments;
    }

    // Build new segments by checking which mentions are still intact
    const newSegments: StrategySegment[] = [];
    let lastIndex = 0;

    mentionMap.forEach((mention) => {
      const mentionToken = mention.segment.content as MentionToken;
      const mentionText = `@${mentionToken.name}`;
      const mentionIndex = newText.indexOf(mentionText, lastIndex);

      if (mentionIndex !== -1 && mentionIndex >= lastIndex) {
        // Add text before mention
        if (mentionIndex > lastIndex) {
          newSegments.push({
            type: 'text',
            content: newText.slice(lastIndex, mentionIndex),
          });
        }

        // Add mention
        newSegments.push(mention.segment);
        lastIndex = mentionIndex + mentionText.length;
      }
    });

    // Add remaining text
    if (lastIndex < newText.length) {
      newSegments.push({
        type: 'text',
        content: newText.slice(lastIndex),
      });
    }

    // If no segments, treat as plain text
    if (newSegments.length === 0) {
      return [{ type: 'text', content: newText }];
    }

    return newSegments;
  };

  // Handle mention selection
  const handleSelectMention = useCallback(
    (option: MentionOption) => {
      if (!textareaRef.current || mentionStart === -1) return;

      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBefore = displayText.slice(0, mentionStart);
      const textAfter = displayText.slice(cursorPos);

      // Create mention token
      const mentionToken: MentionToken = {
        type: option.type,
        id: option.id,
        name: option.name,
        sprite: option.sprite,
        nationalNumber: option.nationalNumber, // For Pokemon URLs
        moveType: option.moveType,
        moveCategory: option.moveCategory,
      };

      // Parse existing segments and merge with new mention
      const currentSegments = parseValue(value);
      const newSegments: StrategySegment[] = [];

      // Build current display text to find position
      let currentPos = 0;
      let mentionInserted = false;

      currentSegments.forEach((seg) => {
        const segStart = currentPos;
        const segText = seg.type === 'text'
          ? (seg.content as string)
          : `@${(seg.content as MentionToken).name}`;
        const segEnd = segStart + segText.length;

        if (!mentionInserted && mentionStart >= segStart && mentionStart <= segEnd) {
          // This segment contains the mention point
          if (seg.type === 'text') {
            const textContent = seg.content as string;
            const relativePos = mentionStart - segStart;
            const beforeText = textContent.slice(0, relativePos);
            const afterPos = cursorPos - segStart;
            const afterText = textContent.slice(afterPos);

            // Add text before mention
            if (beforeText) {
              newSegments.push({ type: 'text', content: beforeText });
            }

            // Add mention
            newSegments.push({ type: 'mention', content: mentionToken });

            // Add text after mention
            if (afterText) {
              newSegments.push({ type: 'text', content: afterText });
            }

            mentionInserted = true;
          }
        } else if (mentionInserted || mentionStart > segEnd) {
          // Keep existing segment
          newSegments.push(seg);
        } else if (mentionStart < segStart) {
          // Insert mention before this segment
          if (!mentionInserted) {
            newSegments.push({ type: 'mention', content: mentionToken });
            mentionInserted = true;
          }
          newSegments.push(seg);
        }

        currentPos = segEnd;
      });

      // If mention wasn't inserted (shouldn't happen), add it at the end
      if (!mentionInserted) {
        if (textBefore) {
          newSegments.push({ type: 'text', content: textBefore });
        }
        newSegments.push({ type: 'mention', content: mentionToken });
        if (textAfter) {
          newSegments.push({ type: 'text', content: textAfter });
        }
      }

      // Update display text
      const newDisplayText = textBefore + `@${option.name}` + textAfter;
      setDisplayText(newDisplayText);

      // Save as JSON
      const jsonValue = JSON.stringify({ segments: newSegments });
      onChange(jsonValue);

      // Close autocomplete
      setShowAutocomplete(false);
      setMentionStart(-1);

      // Move cursor after mention
      setTimeout(() => {
        const newCursorPos = textBefore.length + option.name.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    },
    [displayText, mentionStart, onChange, value, parseValue]
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showAutocomplete) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && options.length > 0) {
      e.preventDefault();
      handleSelectMention(options[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowAutocomplete(false);
    }
  };

  return (
    <div className="relative">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-border">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'write'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary'
              }`}
          >
            {t('strategy.write', 'Write')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary'
              }`}
          >
            {t('strategy.preview', 'Preview')}
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-2">
        {activeTab === 'write' ? (
          <>
            <textarea
              ref={textareaRef}
              value={displayText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              className={`w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary ${className}`}
            />

            {showAutocomplete && (
              <MentionAutocomplete
                options={options}
                selectedIndex={selectedIndex}
                onSelect={handleSelectMention}
                position={autocompletePosition}
                loading={loading}
              />
            )}
          </>
        ) : (
          <div className="min-h-[200px] px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary">
            <StrategyDisplay strategy={value} />
          </div>
        )}
      </div>
    </div>
  );
}
