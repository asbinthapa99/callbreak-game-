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

const FACE_RANKS = new Set(['J', 'Q', 'K']);
const PIP_COUNTS: Record<string, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
};

function pipSlots(rank: string): string[] {
  switch (rank) {
    case '2':
      return ['top-center', 'bottom-center'];
    case '3':
      return ['top-center', 'middle-center', 'bottom-center'];
    case '4':
      return ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    case '5':
      return ['top-left', 'top-right', 'middle-center', 'bottom-left', 'bottom-right'];
    case '6':
      return ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'];
    case '7':
      return ['top-left', 'top-right', 'upper-center', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'];
    case '8':
      return ['top-left', 'top-right', 'upper-center', 'middle-left', 'middle-right', 'lower-center', 'bottom-left', 'bottom-right'];
    case '9':
      return ['top-left', 'top-right', 'upper-center', 'middle-left', 'middle-right', 'center', 'lower-center', 'bottom-left', 'bottom-right'];
    case '10':
      return ['top-left', 'top-right', 'upper-left', 'upper-right', 'middle-left', 'middle-right', 'lower-left', 'lower-right', 'bottom-left', 'bottom-right'];
    default:
      return [];
  }
}

export default function CardComponent({ card, selectable, selected, disabled, onClick, size = 'md' }: CardProps) {
  const sc = suitClass(card.suit);
  const sym = suitSymbol(card.suit);
  const isFace = FACE_RANKS.has(card.rank);
  const isAce = card.rank === 'A';

  const classes = [
    'card',
    `card-${card.suit}`,
    `card-rank-${card.rank.toLowerCase()}`,
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
      <div className={`card-center-mark ${sc}`}>{sym}</div>
      {isAce ? (
        <div className={`card-ace ${sc}`}>{sym}</div>
      ) : isFace ? (
        <div className={`card-face ${sc}`}>
          <span className="card-face-suit">{sym}</span>
          <span className="card-face-letter">{card.rank}</span>
          <span className="card-face-suit inverted">{sym}</span>
        </div>
      ) : (
        <div className={`card-pips card-pips-${PIP_COUNTS[card.rank] ?? 1} ${sc}`}>
          {pipSlots(card.rank).map((slot, index) => (
            <span key={`${slot}-${index}`} className={`card-pip ${slot}`}>
              {sym}
            </span>
          ))}
        </div>
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
