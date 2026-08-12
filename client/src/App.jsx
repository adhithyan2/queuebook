import { useState, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import IntroScreen from './components/Intro/IntroScreen';

export default function App() {
  const [introDone, setIntroDone] = useState(() => {
    const isScanRoute = /^\/queue\/[^/]+\/scan$/.test(window.location.pathname);
    return isScanRoute;
  });
  const handleIntroComplete = useCallback(() => setIntroDone(true), []);

  return (
    <>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <div style={{
                opacity: introDone ? 1 : 0,
                pointerEvents: introDone ? 'auto' : 'none',
                transition: 'opacity 500ms ease-in',
              }}>
                <AppRoutes />
              </div>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      {!introDone && <IntroScreen onComplete={handleIntroComplete} />}
    </>
  );
}
