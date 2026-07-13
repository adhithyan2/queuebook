import { useState, useEffect, useRef } from 'react';

const INTRO_KEY = 'queuebook_intro_seen';

export default function IntroScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const seen = sessionStorage.getItem(INTRO_KEY) || localStorage.getItem(INTRO_KEY);
    if (seen) {
      onComplete();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      localStorage.setItem(INTRO_KEY, '1');
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 700);
    };

    const handleError = () => {
      onComplete();
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    video.play().catch(() => {
      onComplete();
    });

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 700ms ease-in-out',
        pointerEvents: fadeOut ? 'none' : 'auto',
        overflow: 'hidden',
      }}
    >
      <style>{`
        * { overflow: hidden !important; }
        html, body { overflow: hidden !important; height: 100% !important; }
      `}</style>
      <video
        ref={videoRef}
        src="/intro.mp4"
        playsInline
        muted
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
        }}
      />
    </div>
  );
}
