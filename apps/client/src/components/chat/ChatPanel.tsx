import { useRef, useEffect, useState } from 'react';
import { socket } from '../../socket/client.js';
import { useRoomStore } from '../../store/room.js';
import type { ChatMessage } from '@callbreak/shared';

const SEAT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

interface ChatPanelProps {
  onClose?: () => void;
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const messages = useRoomStore(s => s.chatMessages);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit('chat:send', { text: trimmed });
    setText('');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-cb-gold/30">
        <span className="text-cb-gold font-display text-lg">Chat</span>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        )}
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <div className="text-white/30 font-body text-sm text-center py-8">
            No messages yet
          </div>
        )}
        {messages.map(msg => (
          <ChatMessageRow key={msg.id} msg={msg} />
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t-2 border-cb-gold/30">
        <input
          className="flex-1 bg-white/10 border-2 border-white/20 rounded-xl px-3 py-2
                     text-white font-body text-sm placeholder-white/40
                     focus:outline-none focus:border-cb-gold transition-colors"
          placeholder="Say something..."
          value={text}
          maxLength={200}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-cb-gold text-gray-900 font-bold px-3 rounded-xl
                     hover:bg-cb-gold-dark transition-colors text-sm"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function ChatMessageRow({ msg }: { msg: ChatMessage }) {
  const color = msg.seat !== null ? SEAT_COLORS[msg.seat] : '#aaa';
  const isSystem = msg.seat === null;

  if (isSystem) {
    return (
      <div className="text-white/40 font-body text-xs text-center italic">{msg.text}</div>
    );
  }

  return (
    <div className="flex gap-2 items-start">
      <div
        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5"
        style={{ backgroundColor: color }}
      >
        {msg.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-bold text-xs" style={{ color }}>{msg.name}</span>
        <p className="text-white/80 font-body text-sm break-words leading-snug">{msg.text}</p>
      </div>
    </div>
  );
}
