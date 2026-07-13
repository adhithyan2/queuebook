import { useState, useEffect, useRef, useCallback } from 'react';

const INTRO_KEY = 'queuebook_intro_seen';

export default function IntroScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [showPlayBtn, setShowPlayBtn] = useState(false);
  const videoRef = useRef(null);
  const completedRef = useRef(false);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    localStorage.setItem(INTRO_KEY, '1');
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 700);
  }, [onComplete]);

  useEffect(() => {
    const seen = localStorage.getItem(INTRO_KEY);
    if (seen) {
      onComplete();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('ended', finishIntro);
    video.addEventListener('error', finishIntro);

    video.play().then(() => {
      video.muted = false;
    }).catch(() => {
      video.muted = true;
      video.play().then(() => {
        setShowPlayBtn(true);
      }).catch(() => {
        finishIntro();
      });
    });

    return () => {
      video.removeEventListener('ended', finishIntro);
      video.removeEventListener('error', finishIntro);
    };
  }, [finishIntro, onComplete]);

  const handleUnmute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      video.play();
      setShowPlayBtn(false);
    }
  };

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
      <video
        ref={videoRef}
        src="/intro.mp4"
        playsInline
        muted
        preload="auto"
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
        }}
      />
      {showPlayBtn && (
        <button
          onClick={handleUnmute}
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '14px 36px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#fff',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50px',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
        >
          ▶ Play with Sound
        </button>
      )}
    </div>
  );
}
