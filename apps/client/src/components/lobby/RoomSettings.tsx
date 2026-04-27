import { useEffect, useState } from 'react';
import { DEFAULT_CONFIG } from '@callbreak/shared';
import type { RoomConfig } from '@callbreak/shared';
import { socket } from '../../socket/client.js';
import { useRoomStore } from '../../store/room.js';

interface RoomSettingsProps {
  config: RoomConfig;
  isHost: boolean;
}

const TURN_TIMEOUT_OPTIONS = [
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '15s', value: 15000 },
  { label: '30s', value: 30000 },
  { label: '45s', value: 45000 },
  { label: '60s', value: 60000 },
];

const ROUND_OPTIONS = [1, 3, 5, 7, 10];

export default function RoomSettings({ config, isHost }: RoomSettingsProps) {
  const showToast = useRoomStore(s => s.showToast);
  const [penalty, setPenalty] = useState(config.loserPenalty);

  useEffect(() => {
    setPenalty(config.loserPenalty);
  }, [config.loserPenalty]);

  function updateConfig(next: Partial<RoomConfig>) {
    socket.emit('room:updateConfig', { config: next }, (result) => {
      if (!result.ok) {
        showToast({ kind: 'error', message: result.error });
      }
    });
  }

  const customEnabled = config.customSettingsEnabled;
  const controlsDisabled = !isHost || !customEnabled;

  return (
    <div className="space-y-4">
      <label className="bg-white/5 border-2 border-cb-gold/25 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <span className="block text-white font-body text-sm">Custom settings</span>
          <span className="block text-white/45 font-body text-xs">
            {customEnabled ? 'Host controls the match setup' : 'Auto mode uses default settings'}
          </span>
        </div>
        <input
          type="checkbox"
          className="h-4 w-4 accent-cb-gold"
          checked={customEnabled}
          disabled={!isHost}
          onChange={e => updateConfig(e.target.checked ? { customSettingsEnabled: true } : { ...DEFAULT_CONFIG })}
        />
      </label>

      <div>
        <label className="block text-cb-gold font-display text-sm uppercase tracking-wide mb-2">
          Rounds
        </label>
        <select
          className="input-field w-full"
          value={customEnabled ? config.totalRounds : DEFAULT_CONFIG.totalRounds}
          disabled={controlsDisabled}
          onChange={e => updateConfig({ totalRounds: Number(e.target.value) })}
        >
          {ROUND_OPTIONS.map(rounds => (
            <option key={rounds} value={rounds}>
              {rounds} round{rounds === 1 ? '' : 's'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-cb-gold font-display text-sm uppercase tracking-wide mb-2">
          Loser&apos;s Penalty
        </label>
        {isHost ? (
          <textarea
            className="input-field w-full resize-none text-sm"
            rows={2}
            maxLength={200}
            placeholder="Optional"
            value={penalty}
            disabled={controlsDisabled}
            onChange={e => {
              const value = e.target.value;
              setPenalty(value);
              updateConfig({ loserPenalty: value });
            }}
          />
        ) : (
          <div className="bg-white/5 border-2 border-white/20 rounded-xl px-4 py-3 text-white/70 font-body text-sm min-h-[60px]">
            {config.loserPenalty || <span className="text-white/30 italic">No penalty set</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="bg-white/5 border-2 border-white/15 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-white font-body text-sm">Auto-fill bots</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-cb-gold"
            checked={config.fillWithBots}
            disabled={controlsDisabled}
            onChange={e => updateConfig({ fillWithBots: e.target.checked })}
          />
        </label>

        <label className="bg-white/5 border-2 border-white/15 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-white font-body text-sm">Spade breaking</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-cb-gold"
            checked={config.spadeBreakingEnabled}
            disabled={controlsDisabled}
            onChange={e => updateConfig({ spadeBreakingEnabled: e.target.checked })}
          />
        </label>
      </div>

      <div>
        <label className="block text-cb-gold font-display text-sm uppercase tracking-wide mb-2">
          Turn Timer
        </label>
        <select
          className="input-field w-full"
          value={config.turnTimeoutMs}
          disabled={controlsDisabled}
          onChange={e => updateConfig({ turnTimeoutMs: Number(e.target.value) })}
        >
          {TURN_TIMEOUT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} per turn
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
