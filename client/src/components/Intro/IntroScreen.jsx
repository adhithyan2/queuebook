import { useState, useEffect, useRef, useCallback } from 'react';

const INTRO_KEY = 'queuebook_intro_seen';

export default function IntroScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const completedRef = useRef(false);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    sessionStorage.setItem(INTRO_KEY, '1');
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 700);
  }, [onComplete]);

  useEffect(() => {
    const forcePlay = new URLSearchParams(window.location.search).has('intro');
    const seen = sessionStorage.getItem(INTRO_KEY);
    if (!forcePlay && seen) {
      onComplete();
      return;
    }
  }, [onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => finishIntro();
    const handleError = () => finishIntro();

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    video.muted = true;
    video.play().catch(() => finishIntro());

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [finishIntro]);

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
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
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <button
        onClick={handleToggleMute}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isMuted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M16.5 12A4.5 4.5 0 0014 8.18v1.7l2.39 2.39c.07-.2.11-.41.11-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.89 8.89 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.18v7.64c1.48-.73 2.5-2.25 2.5-3.82zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
