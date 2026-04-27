import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSocketEvents } from './socket/hooks.js';
import { useRoomStore } from './store/room.js';
import Toast from './components/ui/Toast.js';

const Home = lazy(() => import('./pages/Home.js'));
const Room = lazy(() => import('./pages/Room.js'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-white font-display text-2xl animate-pulse">Loading...</div>
    </div>
  );
}

export default function App() {
  useSocketEvents();
  const toast = useRoomStore(s => s.toast);
  const clearToast = useRoomStore(s => s.clearToast);

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:code" element={<Room />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {toast && (
        <Toast kind={toast.kind} message={toast.message} onClose={clearToast} />
      )}
    </>
  );
}
