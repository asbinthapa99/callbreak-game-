import { useState } from 'react';

interface RoomCodeProps {
  code: string;
}

export default function RoomCode({ code }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="text-center">
      <div className="text-white/60 font-body text-sm uppercase tracking-wider mb-1">Room Code</div>
      <button
        onClick={handleCopy}
        className="inline-block bg-cb-gold-dark/30 border-4 border-cb-gold rounded-2xl px-6 py-3
                   hover:bg-cb-gold/20 transition-colors group"
      >
        <span className="font-display text-4xl text-cb-gold tracking-[0.5em] drop-shadow-lg">
          {code}
        </span>
        <div className="text-white/50 text-xs font-body mt-1">
          {copied ? '✓ Link copied!' : 'Click to copy link'}
        </div>
      </button>
    </div>
  );
}
