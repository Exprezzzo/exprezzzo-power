// components/ModelResponse.tsx
// Streaming model response with voting, timing, and cost display

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ModelId, RoundtableResponse, VoteType } from '@/types/ai-playground';
import { MODEL_CONFIGS } from '@/types/ai-playground';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ModelResponseProps {
  modelId: ModelId;
  response?: RoundtableResponse;
  status: 'waiting' | 'executing' | 'streaming' | 'completed' | 'error';
  onVote: (vote: VoteType) => void;
  showRanking?: boolean;
  className?: string;
}

interface StreamingState {
  displayText: string;
  isTyping: boolean;
  currentIndex: number;
}

const ModelResponse: React.FC<ModelResponseProps> = ({
  modelId,
  response,
  status,
  onVote,
  showRanking = false,
  className = ''
}) => {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    displayText: '',
    isTyping: false,
    currentIndex: 0
  });
  const [currentVote, setCurrentVote] = useState<VoteType>('neutral');
  const [copied, setCopied] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);

  const typewriterRef = useRef<NodeJS.Timeout>();
  const responseRef = useRef<HTMLDivElement>(null);

  const modelConfig = MODEL_CONFIGS[modelId];

  // Handle streaming text animation
  useEffect(() => {
    if (response && status === 'streaming' && response.content) {
      setStreamingState(prev => ({
        ...prev,
        isTyping: true
      }));

      // Typewriter effect
      const targetText = response.content;
      let currentIndex = streamingState.displayText.length;

      const typeInterval = setInterval(() => {
        if (currentIndex < targetText.length) {
          setStreamingState(prev => ({
            ...prev,
            displayText: targetText.substring(0, currentIndex + 1),
            currentIndex: currentIndex + 1
          }));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setStreamingState(prev => ({ ...prev, isTyping: false }));
        }
      }, 30); // Typing speed

      typewriterRef.current = typeInterval;

      return () => {
        if (typewriterRef.current) {
          clearInterval(typewriterRef.current);
        }
      };
    } else if (response && status === 'completed') {
      setStreamingState({
        displayText: response.content,
        isTyping: false,
        currentIndex: response.content.length
      });
    }
  }, [response, status]);

  const handleVote = (vote: VoteType) => {
    setCurrentVote(vote);
    onVote(vote);
    
    // Send vote to API
    if (response) {
      fetch('/api/roundtable/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: response.messageId,
          modelId,
          vote,
          anonymous: true
        })
      }).catch(console.error);
    }
  };

  const handleCopy = async () => {
    if (streamingState.displayText) {
      try {
        await navigator.clipboard.writeText(streamingState.displayText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const detectLanguage = (content: string): string => {
    // Simple language detection for code blocks
    if (content.includes('```')) {
      const match = content.match(/```(\w+)/);
      return match ? match[1] : 'text';
    }
    
    if (content.includes('function ') || content.includes('const ') || content.includes('let ')) {
      return 'javascript';
    }
    if (content.includes('def ') || content.includes('import ')) {
      return 'python';
    }
    
    return 'text';
  };

  const formatCost = (cost: number): string => {
    if (cost < 0.001) return '<$0.001';
    return `$${cost.toFixed(3)}`;
  };

  const formatLatency = (latency: number): string => {
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'waiting': return 'border-gray-500';
      case 'executing': return 'border-blue-500 animate-pulse';
      case 'streaming': return 'border-green-500 shadow-lg shadow-green-500/20';
      case 'completed': return 'border-[var(--vegas-gold)] shadow-lg shadow-yellow-500/20';
      case 'error': return 'border-red-500 shadow-lg shadow-red-500/20';
      default: return 'border-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'executing': return '🔄';
      case 'streaming': return '📡';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const renderCodeBlock = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <div key={lastIndex} className="whitespace-pre-wrap">
            {content.substring(lastIndex, match.index)}
          </div>
        );
      }

      // Add code block
      const language = match[1] || detectLanguage(match[2]);
      parts.push(
        <div key={match.index} className="my-4">
          <div className="bg-black/30 rounded-t-lg px-3 py-2 text-xs text-[var(--text-muted)] border-b border-[var(--glass-border)]">
            <span className="font-mono">{language}</span>
          </div>
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: '0 0 8px 8px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              fontSize: '14px'
            }}
          >
            {match[2]}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <div key={lastIndex} className="whitespace-pre-wrap">
          {content.substring(lastIndex)}
        </div>
      );
    }

    return parts.length > 0 ? parts : <div className="whitespace-pre-wrap">{content}</div>;
  };

  const truncateText = (text: string, maxLength: number = 500) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className={`glass-card transition-all duration-300 ${getStatusColor()} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{modelConfig?.icon || '🤖'}</span>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                {modelConfig?.name || modelId}
              </h3>
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                <span className="capitalize">{status}</span>
                <span>{getStatusIcon()}</span>
                {showRanking && response?.ranking && (
                  <span className="text-[var(--vegas-gold)]">
                    #{response.ranking}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-[var(--text-muted)]">
            {response?.metadata && (
              <div className="space-y-1">
                <div>Tokens: {response.metadata.tokens}</div>
                <div>Cost: {formatCost(response.metadata.cost || 0)}</div>
                <div>Latency: {formatLatency(response.metadata.latency || 0)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar for streaming */}
        {status === 'streaming' && (
          <div className="w-full bg-[var(--glass-border)] rounded-full h-1">
            <div 
              className="bg-green-400 h-1 rounded-full transition-all duration-300"
              style={{ 
                width: response?.content 
                  ? `${Math.min((streamingState.displayText.length / response.content.length) * 100, 100)}%`
                  : '0%'
              }}
            />
          </div>
        )}
      </div>

      {/* Response Content */}
      <div className="p-4 min-h-[200px]" ref={responseRef}>
        {status === 'waiting' && (
          <div className="flex items-center justify-center h-32 text-[var(--text-muted)]">
            <div className="text-center">
              <div className="text-2xl mb-2">⏳</div>
              <div>Waiting to start...</div>
            </div>
          </div>
        )}

        {status === 'executing' && (
          <div className="flex items-center justify-center h-32 text-[var(--text-muted)]">
            <div className="text-center">
              <div className="animate-spin text-2xl mb-2">🔄</div>
              <div>Processing request...</div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-center h-32 text-red-400">
            <div className="text-center">
              <div className="text-2xl mb-2">❌</div>
              <div>Request failed</div>
              <div className="text-sm text-[var(--text-muted)] mt-1">
                Please try again
              </div>
            </div>
          </div>
        )}

        {(status === 'streaming' || status === 'completed') && streamingState.displayText && (
          <div className="space-y-4">
            <div className="text-[var(--text-primary)] leading-relaxed">
              {showFullResponse ? (
                renderCodeBlock(streamingState.displayText)
              ) : (
                <div>
                  {renderCodeBlock(truncateText(streamingState.displayText))}
                  {streamingState.displayText.length > 500 && (
                    <button
                      onClick={() => setShowFullResponse(true)}
                      className="text-[var(--vegas-gold)] hover:underline text-sm mt-2"
                    >
                      Show more...
                    </button>
                  )}
                </div>
              )}
              
              {streamingState.isTyping && (
                <span className="inline-block w-2 h-5 bg-[var(--vegas-gold)] animate-pulse ml-1" />
              )}
            </div>

            {showFullResponse && streamingState.displayText.length > 500 && (
              <button
                onClick={() => setShowFullResponse(false)}
                className="text-[var(--vegas-gold)] hover:underline text-sm"
              >
                Show less
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {(status === 'completed' || (status === 'streaming' && streamingState.displayText)) && (
        <div className="p-4 border-t border-[var(--glass-border)]">
          <div className="flex items-center justify-between">
            {/* Voting */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">Rate:</span>
              <button
                onClick={() => handleVote('upvote')}
                className={`p-2 rounded-lg transition-all ${
                  currentVote === 'upvote' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-[var(--glass-bg)] text-[var(--text-muted)] hover:bg-green-600/20 hover:text-green-400'
                }`}
                title="Good response"
              >
                👍
              </button>
              <button
                onClick={() => handleVote('downvote')}
                className={`p-2 rounded-lg transition-all ${
                  currentVote === 'downvote' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-[var(--glass-bg)] text-[var(--text-muted)] hover:bg-red-600/20 hover:text-red-400'
                }`}
                title="Poor response"
              >
                👎
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                copied 
                  ? 'bg-green-600/20 text-green-400' 
                  : 'bg-[var(--glass-bg)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--vegas-gold)]'
              }`}
            >
              {copied ? '✅' : '📋'}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Model-specific insights */}
          {status === 'completed' && response && (
            <div className="mt-3 pt-3 border-t border-[var(--glass-border)] text-xs text-[var(--text-muted)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold mb-1">Strengths:</div>
                  <div className="space-y-0.5">
                    {modelConfig?.strengths.slice(0, 3).map(strength => (
                      <div key={strength} className="flex items-center gap-1">
                        <span className="text-green-400">•</span>
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Response Stats:</div>
                  <div className="space-y-0.5">
                    <div>Words: {streamingState.displayText.split(/\s+/).length}</div>
                    <div>Lines: {streamingState.displayText.split('\n').length}</div>
                    <div>Size: {streamingState.displayText.length} chars</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vegas-style loading animation */}
      {status === 'streaming' && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--vegas-gold)] to-transparent animate-pulse" />
      )}
    </div>
  );
};

export default ModelResponse;