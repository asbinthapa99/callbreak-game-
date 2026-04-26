import { v4 as uuidv4 } from 'uuid';
import { PLAYER_COUNT } from '@callbreak/shared';
import type { Player, Room, Seat } from '@callbreak/shared';

const BOT_NAMES = ['Arjun', 'Priya', 'Rajan', 'Sita', 'Dev', 'Meena'];
const SEATS: Seat[] = [0, 1, 2, 3];

export function isSeat(value: number): value is Seat {
  return Number.isInteger(value) && value >= 0 && value < PLAYER_COUNT;
}

export function allSeats(): Seat[] {
  return SEATS;
}

export function findSeatForHuman(room: Room): Seat | null {
  const takenSeats = new Set(room.players.map(player => player.seat));
  const emptySeat = SEATS.find(seat => !takenSeats.has(seat));
  if (emptySeat !== undefined) return emptySeat;

  const botSeat = room.players.find(player => player.isBot)?.seat;
  return botSeat ?? null;
}

export function makeBot(seat: Seat, usedNames: Set<string>): Player {
  const botName = BOT_NAMES.find(name => !usedNames.has(name)) ?? `Bot${seat + 1}`;
  usedNames.add(botName);

  return {
    id: `bot-${roomSafeId()}-${seat}`,
    sessionId: `bot-session-${uuidv4()}`,
    name: botName,
    seat,
    isHost: false,
    isBot: true,
    connected: true,
    hand: [],
  };
}

export function fillEmptySeatsWithBots(room: Room): number {
  const occupied = new Set(room.players.map(player => player.seat));
  const usedNames = new Set(room.players.map(player => player.name));
  let added = 0;

  for (const seat of SEATS) {
    if (occupied.has(seat)) continue;
    room.players.push(makeBot(seat, usedNames));
    occupied.add(seat);
    added++;
  }

  return added;
}

export function validateSeating(room: Room): string | null {
  if (room.players.length !== PLAYER_COUNT) {
    return 'Four seated players are required to start';
  }

  const seats = new Set<Seat>();
  for (const player of room.players) {
    if (!isSeat(player.seat)) return 'Invalid player seat';
    if (seats.has(player.seat)) return 'Duplicate player seat';
    seats.add(player.seat);
  }

  for (const seat of SEATS) {
    if (!seats.has(seat)) return 'Every seat must be filled to start';
  }

  return null;
}

function roomSafeId(): string {
  return uuidv4().slice(0, 8);
}
