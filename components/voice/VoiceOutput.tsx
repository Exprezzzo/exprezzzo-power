'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2, Pause, Play } from 'lucide-react';

interface VoiceOutputProps {
  text: string;
  voice?: string;
  provider?: 'openai' | 'elevenlabs' | 'azure';
  className?: string;
  autoPlay?: boolean;
}

export const VoiceOutput = ({ 
  text, 
  voice = 'nova',
  provider = 'openai',
  className = '',
  autoPlay = false
}: VoiceOutputProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (autoPlay && text) {
      playAudio();
    }
  }, [text, autoPlay]);

  const playAudio = async () => {
    if (audioRef.current && !isPaused) {
      audioRef.current.currentTime = 0;
    }
    
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text.slice(0, 4000), // Limit text length
          voice, 
          provider 
        })
      });
      
      if (!response.ok) throw new Error('TTS failed');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
      } else {
        audioRef.current = new Audio(audioUrl);
      }
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(prog || 0);
        }
      };
      
      audioRef.current.onerror = () => {
        console.error('Audio playback error');
        setIsPlaying(false);
        setIsLoading(false);
      };
      
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('TTS error:', error);
      alert('Text-to-speech failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={isPlaying ? pauseAudio : playAudio}
        disabled={isLoading || !text}
        className="relative p-2 rounded-lg bg-gradient-to-r from-gold/20 to-gold-dark/20 
                   hover:from-gold/40 hover:to-gold-dark/40 
                   transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {/* Progress background */}
        {(isPlaying || isPaused) && (
          <div 
            className="absolute inset-0 bg-gold/20 rounded-lg transition-all"
            style={{ width: `${progress}%` }}
          />
        )}
        
        {/* Icon */}
        <div className="relative z-10">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 text-gold" />
          ) : isPaused ? (
            <Play className="w-4 h-4 text-gold" />
          ) : (
            <Volume2 className="w-4 h-4 text-gold" />
          )}
        </div>
      </button>
      
      {isPlaying && (
        <button
          onClick={stopAudio}
          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition-all"
          aria-label="Stop"
        >
          <VolumeX className="w-3 h-3 text-red-400" />
        </button>
      )}
    </div>
  );
};