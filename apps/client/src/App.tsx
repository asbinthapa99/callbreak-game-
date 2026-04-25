import { Routes, Route, Navigate } from 'react-router-dom';
import { useSocketEvents } from './socket/hooks.js';
import { useRoomStore } from './store/room.js';
import Home from './pages/Home.js';
import Room from './pages/Room.js';
import Toast from './components/ui/Toast.js';

export default function App() {
  useSocketEvents();
  const toast = useRoomStore(s => s.toast);
  const clearToast = useRoomStore(s => s.clearToast);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {toast && (
        <Toast kind={toast.kind} message={toast.message} onClose={clearToast} />
      )}
    </>
  );
}
