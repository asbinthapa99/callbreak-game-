import type { Seat } from '../types/player.js';
import type { ScoreRow } from '../types/game.js';

// Scores are stored as integer tenths to avoid float drift.
// 3.2 points = 32, -4 points = -40
export function scoreRound(
  bids: Record<Seat, number | null>,
  tricksWon: Record<Seat, number>,
  roundIndex: number
): ScoreRow {
  const perSeat = {} as Record<Seat, number>;

  for (const seatKey of [0, 1, 2, 3] as Seat[]) {
    const bid = bids[seatKey] ?? 1;
    const won = tricksWon[seatKey];

    if (won >= bid) {
      const extra = won - bid;
      perSeat[seatKey] = bid * 10 + extra; // 3 bid + 2 extra = 32 (= 3.2)
    } else {
      perSeat[seatKey] = -bid * 10;
    }
  }

  return { roundIndex, perSeat };
}

export function cumulativeScores(rows: ScoreRow[]): Record<Seat, number> {
  const totals: Record<Seat, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const row of rows) {
    for (const s of [0, 1, 2, 3] as Seat[]) {
      totals[s] += row.perSeat[s];
    }
  }
  return totals;
}

export function formatScore(tenths: number): string {
  return (tenths / 10).toFixed(1);
}
