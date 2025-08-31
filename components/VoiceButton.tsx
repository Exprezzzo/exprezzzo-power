'use client';
import { useEffect, useRef, useState } from 'react';

export function VoiceButton() {
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SR && process.env.NEXT_PUBLIC_ENABLE_VOICE === 'true') {
      setSupported(true);
      recRef.current = new SR();
      recRef.current.continuous = false;
      recRef.current.lang = 'en-US';
    }
  }, []);

  const toggle = () => {
    if (!supported) return;
    if (!recording) {
      recRef.current.start();
      setRecording(true);
      recRef.current.onresult = (e: any) => {
        const txt = e.results[0][0].transcript;
        const ev = new CustomEvent('ep:voice', { detail: txt });
        window.dispatchEvent(ev);
      };
      recRef.current.onend = () => setRecording(false);
    } else {
      recRef.current.stop();
    }
  };

  return (
    <button 
      aria-label="Voice" 
      onClick={toggle} 
      className="px-3 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-black hover:from-gold-dark hover:to-gold transition-all"
    >
      {supported ? (recording ? '■ Stop' : '🎤 Voice') : '🎤 N/A'}
    </button>
  );
}