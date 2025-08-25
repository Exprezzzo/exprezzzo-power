'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Smile, 
  Plus, 
  X, 
  Camera,
  Image as ImageIcon,
  FileText,
  Zap,
  Sparkles,
  Heart,
  ThumbsUp,
  Laugh,
  Sad,
  Angry
} from 'lucide-react';
import { VEGAS_THEME_COLORS } from '@/types/ai-playground';

interface MobileInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string, attachments?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  onVoiceStart?: () => void;
  onVoiceStop?: (transcript: string) => void;
  onFileAttach?: (files: File[]) => void;
  className?: string;
}

interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
}

interface Reaction {
  emoji: string;
  label: string;
  action?: string;
}

const REACTIONS: Reaction[] = [
  { emoji: '👍', label: 'Like', action: 'thumbs_up' },
  { emoji: '❤️', label: 'Love', action: 'heart' },
  { emoji: '😂', label: 'Laugh', action: 'laugh' },
  { emoji: '😮', label: 'Wow', action: 'wow' },
  { emoji: '😢', label: 'Sad', action: 'sad' },
  { emoji: '😡', label: 'Angry', action: 'angry' },
  { emoji: '🔥', label: 'Fire', action: 'fire' },
  { emoji: '🎉', label: 'Party', action: 'party' }
];

const QUICK_ACTIONS = [
  { icon: Zap, label: 'Improve', action: 'improve', prompt: 'Please improve this:' },
  { icon: Sparkles, label: 'Summarize', action: 'summarize', prompt: 'Please summarize:' },
  { icon: FileText, label: 'Explain', action: 'explain', prompt: 'Please explain:' },
  { icon: Heart, label: 'Creative', action: 'creative', prompt: 'Make this more creative:' }
];

export default function MobileInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your message...',
  disabled = false,
  maxLength = 4000,
  onVoiceStart,
  onVoiceStop,
  onFileAttach,
  className = ''
}: MobileInputProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    confidence: 0
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('navigator' in window && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onstart = () => {
          setVoiceState(prev => ({ ...prev, isListening: true }));
          if (onVoiceStart) onVoiceStart();
        };
        
        recognitionRef.current.onresult = (event: any) => {
          let transcript = '';
          let confidence = 0;
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            transcript += result[0].transcript;
            confidence = result[0].confidence;
          }
          
          setVoiceState(prev => ({
            ...prev,
            transcript,
            confidence
          }));
        };
        
        recognitionRef.current.onend = () => {
          const finalTranscript = voiceState.transcript;
          setVoiceState(prev => ({
            ...prev,
            isListening: false,
            transcript: '',
            confidence: 0
          }));
          
          if (finalTranscript && onVoiceStop) {
            onVoiceStop(finalTranscript);
            onChange(value + (value ? ' ' : '') + finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = () => {
          setVoiceState(prev => ({ ...prev, isListening: false }));
        };
        
        setVoiceState(prev => ({ ...prev, isSupported: true }));
      }
    }
  }, [value, onChange, onVoiceStart, onVoiceStop, voiceState.transcript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Handle voice recording
  const toggleVoiceRecording = useCallback(() => {
    if (!voiceState.isSupported) return;
    
    triggerHaptic('medium');
    
    if (voiceState.isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  }, [voiceState.isSupported, voiceState.isListening, triggerHaptic]);

  // Handle file attachment
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
      if (onFileAttach) onFileAttach(files);
      triggerHaptic('light');
    }
  }, [onFileAttach, triggerHaptic]);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    triggerHaptic('light');
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, [triggerHaptic]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    triggerHaptic('light');
    onChange(value + emoji);
    setShowEmoji(false);
  }, [value, onChange, triggerHaptic]);

  // Handle quick action
  const handleQuickAction = useCallback((action: typeof QUICK_ACTIONS[0]) => {
    triggerHaptic('medium');
    const newValue = action.prompt + (value ? '\n\n' + value : '');
    onChange(newValue);
    setShowQuickActions(false);
  }, [value, onChange, triggerHaptic]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!value.trim() && attachments.length === 0) return;
    
    triggerHaptic('heavy');
    onSubmit(value, attachments.length > 0 ? attachments : undefined);
    onChange('');
    setAttachments([]);
    setIsExpanded(false);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, attachments, onSubmit, onChange, triggerHaptic]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className={`relative ${className}`}>
      {/* Quick Actions Panel */}
      {showQuickActions && (
        <div className="absolute bottom-full left-0 right-0 mb-2">
          <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
              <button
                onClick={() => setShowQuickActions(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={16} className="text-white/70" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.action}
                  onClick={() => handleQuickAction(action)}
                  className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  style={{ minHeight: '48px' }}
                >
                  <action.icon size={18} color={VEGAS_THEME_COLORS.primary} />
                  <span className="text-sm font-medium text-white">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-full left-0 right-0 mb-2">
          <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Reactions</h3>
              <button
                onClick={() => setShowEmoji(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={16} className="text-white/70" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {REACTIONS.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(reaction.emoji)}
                  className="flex flex-col items-center gap-1 p-3 hover:bg-white/10 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  style={{ minHeight: '48px' }}
                >
                  <span className="text-xl">{reaction.emoji}</span>
                  <span className="text-xs text-white/70">{reaction.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voice Recording Indicator */}
      {voiceState.isListening && (
        <div className="absolute bottom-full left-0 right-0 mb-2">
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="text-red-400 text-sm font-medium">Listening...</div>
                {voiceState.transcript && (
                  <div className="text-white/80 text-sm mt-1">{voiceState.transcript}</div>
                )}
              </div>
              <div className="text-red-400 text-xs">
                {Math.round(voiceState.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-t-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip size={16} className="text-white/70" />
            <span className="text-sm text-white/70">{attachments.length} file(s)</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg"
              >
                <span className="text-sm text-white truncate max-w-32">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  style={{ minHeight: '24px', minWidth: '24px' }}
                >
                  <X size={12} className="text-white/70" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div
        className={`bg-black/20 backdrop-blur-md border border-white/20 transition-all duration-200 ${
          attachments.length > 0 ? 'rounded-b-2xl' : 'rounded-2xl'
        } ${isExpanded ? 'border-amber-400/50' : ''}`}
      >
        <div className="flex items-end gap-2 p-4">
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors self-end"
            style={{ minHeight: '48px', minWidth: '48px' }}
          >
            <Plus
              size={20}
              className={`text-white/70 transition-transform duration-200 ${
                isExpanded ? 'rotate-45' : ''
              }`}
            />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsExpanded(true)}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              rows={1}
              className="w-full bg-transparent text-white placeholder-white/50 border-none outline-none resize-none text-base leading-6"
              style={{
                minHeight: '24px',
                maxHeight: '120px'
              }}
            />
            
            {/* Character count */}
            {maxLength && value.length > maxLength * 0.8 && (
              <div className="absolute bottom-0 right-0 text-xs text-white/50">
                {value.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Voice Recording */}
            {voiceState.isSupported && (
              <button
                onClick={toggleVoiceRecording}
                disabled={disabled}
                className={`p-2 rounded-full transition-all duration-200 ${
                  voiceState.isListening 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'hover:bg-white/10 text-white/70'
                }`}
                style={{ minHeight: '48px', minWidth: '48px' }}
              >
                {voiceState.isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={disabled || (!value.trim() && attachments.length === 0)}
              className={`p-2 rounded-full transition-all duration-200 ${
                value.trim() || attachments.length > 0
                  ? 'text-white shadow-lg active:scale-[0.95]'
                  : 'text-white/30'
              }`}
              style={{
                minHeight: '48px',
                minWidth: '48px',
                background: value.trim() || attachments.length > 0
                  ? `linear-gradient(45deg, ${VEGAS_THEME_COLORS.primary}, #FFA500)`
                  : 'transparent'
              }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* Extended Actions */}
        {isExpanded && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* File Attachment */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,text/*,.pdf,.doc,.docx,.json,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  <Paperclip size={20} className="text-white/70" />
                </button>

                {/* Camera */}
                <button
                  onClick={() => {
                    // Trigger camera input
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length > 0) handleFileSelect({ target: { files } } as any);
                    };
                    input.click();
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  <Camera size={20} className="text-white/70" />
                </button>

                {/* Image Gallery */}
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      if (files.length > 0) handleFileSelect({ target: { files } } as any);
                    };
                    input.click();
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  <ImageIcon size={20} className="text-white/70" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick Actions */}
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  <Zap size={20} className="text-white/70" />
                </button>

                {/* Emoji Picker */}
                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  <Smile size={20} className="text-white/70" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}