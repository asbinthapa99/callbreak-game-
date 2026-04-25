import type { PlayerPublic } from '@callbreak/shared';

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
const BOT_EMOJIS = ['🤖', '👾', '🎮', '🃏'];

interface PlayerSlotProps {
  seat: number;
  player?: PlayerPublic;
  isYou: boolean;
  isHost: boolean;
  canKick: boolean;
  onKick?: () => void;
  onAddBot?: () => void;
}

export default function PlayerSlot({ seat, player, isYou, canKick, onKick, onAddBot }: PlayerSlotProps) {
  if (!player) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border-2 border-dashed border-white/20">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
          ❓
        </div>
        <div className="flex-1">
          <div className="text-white/30 font-body text-sm">Waiting for player...</div>
        </div>
        {canKick && onAddBot && (
          <button
            onClick={onAddBot}
            className="text-xs bg-cb-gold/20 hover:bg-cb-gold/40 border border-cb-gold/40
                       text-cb-gold rounded-lg px-3 py-1.5 font-body font-bold transition-colors whitespace-nowrap"
          >
            + Add Bot
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2
      ${player.isBot ? 'bg-white/5 border-white/20' : 'bg-white/10 border-cb-gold/30'}`}>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-display flex-shrink-0
                   text-xl border-2 border-white/20"
        style={{ backgroundColor: AVATAR_COLORS[seat] }}
      >
        {player.isBot ? BOT_EMOJIS[seat] : player.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-body font-bold text-base truncate">
          {player.name}
          {isYou && <span className="text-cb-gold text-xs ml-2">(you)</span>}
          {player.isHost && <span className="text-cb-gold text-xs ml-2">👑</span>}
          {player.isBot && <span className="text-white/40 text-xs ml-1">AI Bot</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className={`w-2 h-2 rounded-full ${player.connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white/50 font-body text-xs">
            {player.isBot ? 'Ready' : player.connected ? 'Online' : 'Reconnecting...'}
          </span>
        </div>
      </div>
      {canKick && (
        <button
          onClick={onKick}
          className="text-white/30 hover:text-red-400 transition-colors text-lg px-2 leading-none"
          title={player.isBot ? 'Remove bot' : 'Kick player'}
        >
          ✕
        </button>
      )}
    </div>
  );
}
