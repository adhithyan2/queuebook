import { useState, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import IntroScreen from './components/Intro/IntroScreen';

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const handleIntroComplete = useCallback(() => setIntroDone(true), []);

  return (
    <>
      {!introDone && <IntroScreen onComplete={handleIntroComplete} />}
      <div style={{ opacity: introDone ? 1 : 0, transition: 'opacity 600ms ease-in' }}>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <AppRoutes />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </>
  );
}
