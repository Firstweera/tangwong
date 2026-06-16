import { cn } from '@/lib/utils';

export interface EmojiReactionBarProps {
  emojis?: string[];
  onReact?: (emoji: string) => void;
  className?: string;
}

const DEFAULT_EMOJIS = ['👍', '😂', '😮', '❤️', '🔥', '🤔'];

/**
 * EmojiReactionBar — quick emoji reactions for the table. Lightweight social
 * affordance reused across lobby chat and in-game moments.
 */
export function EmojiReactionBar({ emojis = DEFAULT_EMOJIS, onReact, className }: EmojiReactionBarProps) {
  return (
    <div className={cn('row gap8', className)} role="group" aria-label="reactions">
      {emojis.map((e) => (
        <button
          key={e}
          aria-label={`react ${e}`}
          onClick={() => onReact?.(e)}
          className="row center"
          style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 19 }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
