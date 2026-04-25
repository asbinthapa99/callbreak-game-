import { useEffect, useState } from 'react';

interface TurnTimerProps {
  deadline: number | null;  // epoch ms
  timeoutMs: number;
}

export default function TurnTimer({ deadline, timeoutMs }: TurnTimerProps) {
  const [remaining, setRemaining] = useState(1);

  useEffect(() => {
    if (!deadline) { setRemaining(1); return; }

    const update = () => {
      const pct = Math.max(0, Math.min(1, (deadline - Date.now()) / timeoutMs));
      setRemaining(pct);
    };

    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [deadline, timeoutMs]);

  if (!deadline) return null;

  const size = 44;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * remaining;
  const secsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

  // Color: green → yellow → red
  const color = remaining > 0.5 ? '#22c55e' : remaining > 0.25 ? '#FBBF24' : '#ef4444';
  const urgent = remaining < 0.25;

  return (
    <div
      className={`relative flex items-center justify-center ${urgent ? 'animate-timer-pulse' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute rotate-[-90deg]">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.1s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span
        className="font-mono font-bold text-xs z-10"
        style={{ color, fontSize: 11 }}
      >
        {secsLeft}
      </span>
    </div>
  );
}
