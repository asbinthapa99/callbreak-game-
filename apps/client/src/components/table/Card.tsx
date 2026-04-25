import type { Card } from '@callbreak/shared';
import { suitClass, suitSymbol } from '../../lib/card-art.js';

interface CardProps {
  card: Card;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const FACE_RANKS = new Set(['J', 'Q', 'K', 'A']);

export default function CardComponent({ card, selectable, selected, disabled, onClick, size = 'md' }: CardProps) {
  const sc = suitClass(card.suit);
  const sym = suitSymbol(card.suit);
  const isFace = FACE_RANKS.has(card.rank);

  const classes = [
    'card',
    size === 'sm' ? 'card-sm' : '',
    selectable && !disabled ? 'card-selectable' : '',
    selected ? 'card-selected' : '',
    disabled ? 'card-disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={!disabled ? onClick : undefined}>
      <div className={`card-corner tl ${sc}`}>
        <span className="rank">{card.rank}</span>
        <span className="suit-icon">{sym}</span>
      </div>
      {isFace ? (
        <div className={`card-face-letter ${sc}`}>{card.rank}</div>
      ) : (
        <div className={`card-center-suit ${sc}`}>{sym}</div>
      )}
      <div className={`card-corner br ${sc}`}>
        <span className="rank">{card.rank}</span>
        <span className="suit-icon">{sym}</span>
      </div>
    </div>
  );
}

export function CardBack({ count = 1, fan = false, size = 'md' }: { count?: number; fan?: boolean; size?: 'sm' | 'md' }) {
  const items = Math.min(count, 7);
  const sm = size === 'sm';
  const w = sm ? 50 : 62;

  if (!fan) {
    return (
      <div className={`card-back ${sm ? 'card-back-sm' : ''}`} />
    );
  }

  return (
    <div className="relative" style={{ width: w + (items - 1) * 8, height: sm ? 74 : 92 }}>
      {Array.from({ length: items }).map((_, i) => {
        const angle = (i - (items - 1) / 2) * 6;
        return (
          <div
            key={i}
            className={`card-back ${sm ? 'card-back-sm' : ''} absolute`}
            style={{
              position: 'absolute',
              left: i * 8,
              top: 0,
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'bottom center',
              zIndex: i,
            }}
          />
        );
      })}
    </div>
  );
}
