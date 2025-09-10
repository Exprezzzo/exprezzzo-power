'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2, Radio } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onStreamingTranscript?: (text: string) => void;
  className?: string;
  provider?: 'whisper' | 'assembly' | 'deepgram';
}

export const VoiceInput = ({ 
  onTranscript, 
  onStreamingTranscript,
  className = '',
  provider = 'whisper' 
}: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const visualizeAudio = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);
    analyzerRef.current = analyzer;

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    
    const animate = () => {
      if (!analyzerRef.current) return;
      analyzerRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      visualizeAudio(stream);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        setAudioLevel(0);
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('provider', provider);

        try {
          const response = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) throw new Error('Transcription failed');
          
          const { transcript } = await response.json();
          onTranscript(transcript);
        } catch (error) {
          console.error('Transcription error:', error);
          onTranscript('[Transcription failed. Please try again.]');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Please enable microphone access to use voice input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`relative p-3 rounded-full transition-all transform hover:scale-105 ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50' 
            : 'bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {/* Audio level visualizer ring */}
        {isRecording && (
          <div 
            className="absolute inset-0 rounded-full border-4 border-red-300 opacity-50"
            style={{
              transform: `scale(${1 + audioLevel * 0.5})`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        )}
        
        {/* Icon */}
        <div className="relative z-10">
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5 text-white animate-pulse" />
          ) : (
            <Mic className="w-5 h-5 text-black" />
          )}
        </div>
      </button>
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute -top-1 -right-1">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}
      
      {/* Status text */}
      {(isRecording || isProcessing) && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs text-gray-400">
            {isProcessing ? 'Processing...' : 'Recording...'}
          </span>
        </div>
      )}
    </div>
  );
};