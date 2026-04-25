import { useEffect } from 'react';
import { socket } from './client.js';
import { useRoomStore } from '../store/room.js';
import { useSessionStore } from '../store/session.js';

export function useSocketEvents() {
  const setRoomView = useRoomStore(s => s.setRoomView);
  const addChatMessage = useRoomStore(s => s.addChatMessage);
  const setConnected = useRoomStore(s => s.setConnected);
  const showToast = useRoomStore(s => s.showToast);
  const { sessionId } = useSessionStore();

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      // Try to resume existing session
      socket.emit('session:resume', { sessionId }, (result) => {
        if (result.ok && result.data.code) {
          // Will receive room:state from server
        }
      });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('room:state', (view) => setRoomView(view));

    socket.on('room:playerLeft', ({ seat }) => {
      const name = useRoomStore.getState().roomView?.players.find(player => player.seat === seat)?.name ?? 'A player';
      showToast({ kind: 'warn', message: `${name} disconnected` });
    });

    socket.on('chat:message', (msg) => addChatMessage(msg));

    socket.on('system:toast', (t) => showToast(t));

    socket.on('system:error', ({ message }) => showToast({ kind: 'error', message }));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:state');
      socket.off('room:playerLeft');
      socket.off('chat:message');
      socket.off('system:toast');
      socket.off('system:error');
      socket.disconnect();
    };
  }, [sessionId, setRoomView, addChatMessage, setConnected, showToast]);
}
