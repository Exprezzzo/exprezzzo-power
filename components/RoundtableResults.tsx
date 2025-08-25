// components/RoundtableResults.tsx
// Side-by-side comparison view with export options and sharing

'use client';

import React, { useState, useRef } from 'react';
import { RoundtableResult, RoundtableResponse, ModelId } from '@/types/ai-playground';
import { MODEL_CONFIGS } from '@/types/ai-playground';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import confetti from 'canvas-confetti';

interface RoundtableResultsProps {
  result: RoundtableResult;
  responses: RoundtableResponse[];
  onExport: (format: 'pdf' | 'md' | 'json') => void;
  onShare: () => void;
  className?: string;
}

type ViewMode = 'side-by-side' | 'diff' | 'consensus' | 'metrics';
type ExportFormat = 'pdf' | 'md' | 'json';

const RoundtableResults: React.FC<RoundtableResultsProps> = ({
  result,
  responses,
  onExport,
  onShare,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [selectedModels, setSelectedModels] = useState<Set<ModelId>>(
    new Set(responses.map(r => r.modelId))
  );
  const [showDiffDetails, setShowDiffDetails] = useState(false);
  const [expandedResponse, setExpandedResponse] = useState<ModelId | null>(null);
  const [highlightSimilarities, setHighlightSimilarities] = useState(true);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Trigger confetti for unanimous results
  React.useEffect(() => {
    if (result.consensus === 'unanimous' && responses.length >= 3) {
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6B35'],
          shapes: ['star', 'circle'],
          scalar: 1.2
        });
      }, 500);
    }
  }, [result.consensus, responses.length]);

  const filteredResponses = responses.filter(r => selectedModels.has(r.modelId));
  const sortedResponses = [...filteredResponses].sort((a, b) => (a.ranking || 999) - (b.ranking || 999));

  const handleExport = async (format: ExportFormat) => {
    switch (format) {
      case 'md':
        await exportAsMarkdown();
        break;
      case 'json':
        await exportAsJSON();
        break;
      case 'pdf':
        await exportAsPDF();
        break;
    }
    onExport(format);
  };

  const exportAsMarkdown = async () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roundtable-${result.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = async () => {
    const data = {
      result,
      responses: filteredResponses,
      exportedAt: new Date().toISOString(),
      metadata: {
        version: '1.0',
        viewMode,
        selectedModels: Array.from(selectedModels)
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roundtable-${result.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    // In a real implementation, you'd use a library like jsPDF or Puppeteer
    // For now, we'll create a printable HTML version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintHTML());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const generateMarkdown = (): string => {
    const lines = [
      `# Roundtable Comparison Results`,
      ``,
      `**Prompt:** ${result.prompt}`,
      `**Models:** ${responses.map(r => r.modelId).join(', ')}`,
      `**Timestamp:** ${new Date(result.timestamp).toLocaleString()}`,
      `**Winner:** ${result.winner || 'No clear winner'}`,
      `**Consensus:** ${result.consensus || 'No consensus reached'}`,
      ``,
      `## Summary`,
      `- Total Cost: $${result.totalCost.toFixed(4)}`,
      `- Total Latency: ${result.totalLatency}ms`,
      `- Responses: ${responses.length}`,
      ``,
      `## Responses`,
      ``
    ];

    sortedResponses.forEach((response, index) => {
      const modelConfig = MODEL_CONFIGS[response.modelId];
      lines.push(
        `### ${index + 1}. ${modelConfig?.name || response.modelId} ${response.ranking ? `(Rank #${response.ranking})` : ''}`,
        ``,
        `**Model:** ${response.modelId}`,
        `**Cost:** $${(response.metadata?.cost || 0).toFixed(4)}`,
        `**Latency:** ${response.metadata?.latency || 0}ms`,
        `**Tokens:** ${response.metadata?.tokens || 0}`,
        ``,
        `#### Response:`,
        ``,
        response.content,
        ``,
        `---`,
        ``
      );
    });

    return lines.join('\n');
  };

  const generatePrintHTML = (): string => {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #FFD700; margin-bottom: 20px; padding-bottom: 10px; }
        .response-card { border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 8px; }
        .response-header { background: #f5f5f5; margin: -15px -15px 15px -15px; padding: 10px 15px; border-radius: 8px 8px 0 0; }
        .response-content { white-space: pre-wrap; line-height: 1.6; }
        .metadata { font-size: 0.9em; color: #666; margin-top: 10px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
        @media print { body { margin: 0; } }
      </style>
    `;

    const content = `
      <div class="header">
        <h1>🎭 Roundtable Comparison Results</h1>
        <p><strong>Prompt:</strong> ${result.prompt}</p>
        <p><strong>Models:</strong> ${responses.map(r => r.modelId).join(', ')}</p>
        <p><strong>Date:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
        ${result.winner ? `<p><strong>Winner:</strong> ${result.winner}</p>` : ''}
        ${result.consensus ? `<p><strong>Consensus:</strong> ${result.consensus}</p>` : ''}
      </div>
      
      ${sortedResponses.map((response, index) => {
        const modelConfig = MODEL_CONFIGS[response.modelId];
        return `
          <div class="response-card">
            <div class="response-header">
              <h3>${modelConfig?.icon || '🤖'} ${modelConfig?.name || response.modelId} ${response.ranking ? `(Rank #${response.ranking})` : ''}</h3>
            </div>
            <div class="response-content">${response.content}</div>
            <div class="metadata">
              Cost: $${(response.metadata?.cost || 0).toFixed(4)} | 
              Latency: ${response.metadata?.latency || 0}ms | 
              Tokens: ${response.metadata?.tokens || 0}
            </div>
          </div>
        `;
      }).join('')}
    `;

    return `<!DOCTYPE html><html><head><title>Roundtable Results</title>${styles}</head><body>${content}</body></html>`;
  };

  const calculateSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  };

  const getConsensusColor = (consensus?: string) => {
    switch (consensus) {
      case 'unanimous': return 'text-green-400';
      case 'majority': return 'text-blue-400';
      case 'split': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  const renderSideBySideView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedResponses.map((response) => {
        const modelConfig = MODEL_CONFIGS[response.modelId];
        const isExpanded = expandedResponse === response.modelId;

        return (
          <div key={response.modelId} className="glass-card border border-[var(--glass-border)]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{modelConfig?.icon || '🤖'}</span>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {modelConfig?.name || response.modelId}
                    </h3>
                    {response.ranking && (
                      <div className="text-sm text-[var(--vegas-gold)]">
                        Rank #{response.ranking}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setExpandedResponse(isExpanded ? null : response.modelId)}
                  className="text-[var(--text-muted)] hover:text-[var(--vegas-gold)] transition-colors"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>

              <div className="text-xs text-[var(--text-muted)] space-y-1">
                <div>Cost: ${(response.metadata?.cost || 0).toFixed(4)}</div>
                <div>Latency: {response.metadata?.latency || 0}ms</div>
                <div>Tokens: {response.metadata?.tokens || 0}</div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className={`text-sm text-[var(--text-primary)] ${!isExpanded ? 'line-clamp-6' : ''}`}>
                {response.content.includes('```') ? (
                  <SyntaxHighlighter
                    language="text"
                    style={oneDark}
                    customStyle={{
                      background: 'rgba(0,0,0,0.3)',
                      fontSize: '12px',
                      borderRadius: '6px'
                    }}
                    wrapLongLines
                  >
                    {response.content}
                  </SyntaxHighlighter>
                ) : (
                  <div className="whitespace-pre-wrap">{response.content}</div>
                )}
              </div>
              
              {!isExpanded && response.content.length > 300 && (
                <button
                  onClick={() => setExpandedResponse(response.modelId)}
                  className="text-[var(--vegas-gold)] hover:underline text-sm mt-2"
                >
                  Show more...
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDiffView = () => {
    if (sortedResponses.length < 2) {
      return (
        <div className="glass-card p-8 text-center">
          <div className="text-[var(--text-muted)]">
            Need at least 2 responses to show differences
          </div>
        </div>
      );
    }

    const baseResponse = sortedResponses[0];
    const comparisons = sortedResponses.slice(1);

    return (
      <div className="space-y-6">
        <div className="glass-card p-4">
          <h3 className="font-semibold text-[var(--vegas-gold)] mb-4">
            📊 Difference Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Base Response */}
            <div className="space-y-4">
              <div className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-lg">{MODEL_CONFIGS[baseResponse.modelId]?.icon}</span>
                {MODEL_CONFIGS[baseResponse.modelId]?.name} (Baseline)
              </div>
              
              <div className="bg-[var(--glass-bg)] p-4 rounded-lg">
                <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {baseResponse.content}
                </div>
              </div>
            </div>

            {/* Comparisons */}
            <div className="space-y-4">
              {comparisons.map((comparison) => {
                const similarity = calculateSimilarity(baseResponse.content, comparison.content);
                const similarityPercent = Math.round(similarity * 100);
                
                return (
                  <div key={comparison.modelId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <span className="text-lg">{MODEL_CONFIGS[comparison.modelId]?.icon}</span>
                        {MODEL_CONFIGS[comparison.modelId]?.name}
                      </div>
                      
                      <div className={`text-sm px-2 py-1 rounded ${
                        similarityPercent > 80 ? 'bg-green-600/20 text-green-400' :
                        similarityPercent > 60 ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-red-600/20 text-red-400'
                      }`}>
                        {similarityPercent}% similar
                      </div>
                    </div>
                    
                    <div className="bg-[var(--glass-bg)] p-4 rounded-lg">
                      <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {comparison.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConsensusView = () => (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-[var(--vegas-gold)] mb-2">
            {result.consensus === 'unanimous' ? '🎉' : result.consensus === 'majority' ? '👥' : '🤔'} 
            {' '}Consensus Analysis
          </h3>
          <div className={`text-lg capitalize ${getConsensusColor(result.consensus)}`}>
            {result.consensus || 'No consensus'}
          </div>
        </div>

        {result.consensus === 'unanimous' && (
          <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 mb-6">
            <div className="font-semibold text-green-400 mb-2">🎊 Unanimous Agreement!</div>
            <div className="text-[var(--text-primary)]">
              All models provided very similar responses, indicating high confidence in the answer.
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="font-semibold text-[var(--text-primary)]">Key Similarities:</div>
          {highlightSimilarities && (
            <div className="bg-[var(--glass-bg)] p-4 rounded-lg">
              <div className="text-sm text-[var(--text-primary)]">
                {result.consensus || 'Analyzing common themes across responses...'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Response Grid with Similarity Highlighting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedResponses.map((response) => (
          <div key={response.modelId} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{MODEL_CONFIGS[response.modelId]?.icon}</span>
                <span className="font-medium">{MODEL_CONFIGS[response.modelId]?.name}</span>
              </div>
              {response.ranking && (
                <div className="text-sm text-[var(--vegas-gold)]">#{response.ranking}</div>
              )}
            </div>
            
            <div className="text-sm text-[var(--text-primary)] line-clamp-6">
              {response.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMetricsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Overall Stats */}
      <div className="glass-card p-6">
        <h4 className="font-semibold text-[var(--vegas-gold)] mb-4">📊 Overall Stats</h4>
        <div className="space-y-2 text-sm">
          <div>Total Cost: <span className="text-[var(--vegas-gold)]">${result.totalCost.toFixed(4)}</span></div>
          <div>Total Time: <span className="text-[var(--vegas-gold)]">{result.totalLatency}ms</span></div>
          <div>Responses: <span className="text-[var(--vegas-gold)]">{responses.length}</span></div>
          <div>Winner: <span className="text-[var(--vegas-gold)]">{result.winner || 'None'}</span></div>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="glass-card p-6">
        <h4 className="font-semibold text-[var(--vegas-gold)] mb-4">⚡ Performance</h4>
        <div className="space-y-3">
          {sortedResponses.map(response => {
            const latency = response.metadata?.latency || 0;
            const maxLatency = Math.max(...responses.map(r => r.metadata?.latency || 0));
            const percentage = maxLatency > 0 ? (latency / maxLatency) * 100 : 0;
            
            return (
              <div key={response.modelId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{response.modelId}</span>
                  <span>{latency}ms</span>
                </div>
                <div className="w-full bg-[var(--glass-border)] rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-red-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="glass-card p-6">
        <h4 className="font-semibold text-[var(--vegas-gold)] mb-4">💰 Cost Analysis</h4>
        <div className="space-y-3">
          {sortedResponses.map(response => {
            const cost = response.metadata?.cost || 0;
            const totalCost = result.totalCost;
            const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0;
            
            return (
              <div key={response.modelId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{response.modelId}</span>
                  <span>${cost.toFixed(4)}</span>
                </div>
                <div className="w-full bg-[var(--glass-border)] rounded-full h-1.5">
                  <div 
                    className="bg-[var(--vegas-gold)] h-1.5 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quality Rankings */}
      <div className="glass-card p-6">
        <h4 className="font-semibold text-[var(--vegas-gold)] mb-4">🏆 Rankings</h4>
        <div className="space-y-3">
          {sortedResponses.map((response, index) => (
            <div key={response.modelId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-[var(--glass-bg)] text-[var(--text-muted)]'
                }`}>
                  {index + 1}
                </div>
                <span className="text-sm">{response.modelId}</span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {response.metadata?.tokens || 0} tokens
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={resultsRef} className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-vegas-gradient">
            🎭 Roundtable Results
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onShare}
              className="btn-vegas-secondary text-sm px-3 py-2"
              title="Share roundtable session"
            >
              🔗 Share
            </button>
            
            <div className="relative group">
              <button className="btn-vegas-primary text-sm px-3 py-2">
                📄 Export
              </button>
              <div className="absolute right-0 top-full mt-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('md')}
                  className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] rounded-t-lg"
                >
                  📝 Markdown
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)]"
                >
                  📊 JSON Data
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] rounded-b-lg"
                >
                  📄 PDF Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { mode: 'side-by-side', label: '📋 Side by Side', icon: '📋' },
            { mode: 'diff', label: '🔍 Differences', icon: '🔍' },
            { mode: 'consensus', label: '🤝 Consensus', icon: '🤝' },
            { mode: 'metrics', label: '📊 Metrics', icon: '📊' }
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as ViewMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                viewMode === mode
                  ? 'bg-[var(--vegas-gold)] text-[var(--vegas-black)]'
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Model Filter */}
        <div className="flex flex-wrap gap-2">
          {responses.map(response => {
            const isSelected = selectedModels.has(response.modelId);
            const modelConfig = MODEL_CONFIGS[response.modelId];
            
            return (
              <button
                key={response.modelId}
                onClick={() => {
                  const newSelected = new Set(selectedModels);
                  if (isSelected) {
                    newSelected.delete(response.modelId);
                  } else {
                    newSelected.add(response.modelId);
                  }
                  setSelectedModels(newSelected);
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all ${
                  isSelected
                    ? 'bg-[var(--vegas-gold)] text-[var(--vegas-black)]'
                    : 'bg-[var(--glass-bg)] text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]'
                }`}
              >
                <span>{modelConfig?.icon || '🤖'}</span>
                <span>{response.modelId}</span>
                {response.ranking && (
                  <span className={`text-xs ${isSelected ? 'text-[var(--vegas-black)]' : 'text-[var(--vegas-gold)]'}`}>
                    #{response.ranking}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {viewMode === 'side-by-side' && renderSideBySideView()}
        {viewMode === 'diff' && renderDiffView()}
        {viewMode === 'consensus' && renderConsensusView()}
        {viewMode === 'metrics' && renderMetricsView()}
      </div>

      {filteredResponses.length === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="text-[var(--text-muted)]">
            No models selected for comparison
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundtableResults;