// components/ContextManager.tsx
// Visual context hierarchy editor with drag-drop reordering and syntax highlighting

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ContextItem {
  id: string;
  content: string;
  type: 'message' | 'file' | 'summary' | 'reference' | 'note';
  priority: number;
  tokens: number;
  relevanceScore?: number;
  source: string;
  sessionId?: string;
  timestamp: Date;
  tags?: string[];
  compressed?: boolean;
  originalLength?: number;
}

interface ContextManagerProps {
  projectId: string;
  contextItems: ContextItem[];
  totalTokens: number;
  maxTokens: number;
  onContextUpdate: (items: ContextItem[]) => void;
  onContextDelete: (itemIds: string[]) => void;
  onContextOptimize: () => void;
  className?: string;
}

interface DragState {
  isDragging: boolean;
  draggedItemId: string | null;
  dragOverIndex: number | null;
}

const ContextManager: React.FC<ContextManagerProps> = ({
  projectId,
  contextItems,
  totalTokens,
  maxTokens,
  onContextUpdate,
  onContextDelete,
  onContextOptimize,
  className = ''
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ContextItem['type'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'timestamp' | 'tokens' | 'relevance'>('priority');
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItemId: null,
    dragOverIndex: null
  });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const dragItemRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter and sort items
  const filteredAndSortedItems = contextItems
    .filter(item => filterType === 'all' || item.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority;
        case 'timestamp':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'tokens':
          return b.tokens - a.tokens;
        case 'relevance':
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        default:
          return b.priority - a.priority;
      }
    });

  // Calculate usage percentage
  const usagePercent = (totalTokens / maxTokens) * 100;

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', itemId);
    
    setDragState({
      isDragging: true,
      draggedItemId: itemId,
      dragOverIndex: null
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    setDragState(prev => ({
      ...prev,
      dragOverIndex: index
    }));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItemId: null,
      dragOverIndex: null
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!dragState.draggedItemId) return;

    const draggedIndex = filteredAndSortedItems.findIndex(
      item => item.id === dragState.draggedItemId
    );

    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    // Calculate new priorities based on position
    const updatedItems = [...filteredAndSortedItems];
    const draggedItem = updatedItems[draggedIndex];
    
    // Remove dragged item
    updatedItems.splice(draggedIndex, 1);
    
    // Insert at new position
    updatedItems.splice(dropIndex, 0, draggedItem);
    
    // Recalculate priorities
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      priority: 100 - index // Higher priority for items at top
    }));

    onContextUpdate(reorderedItems);
    handleDragEnd();
  }, [dragState.draggedItemId, filteredAndSortedItems, onContextUpdate, handleDragEnd]);

  // Item selection handlers
  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id)));
    }
  }, [selectedItems.size, filteredAndSortedItems]);

  const deleteSelected = useCallback(() => {
    if (selectedItems.size > 0) {
      onContextDelete(Array.from(selectedItems));
      setSelectedItems(new Set());
    }
  }, [selectedItems, onContextDelete]);

  // Edit handlers
  const startEditing = useCallback((item: ContextItem) => {
    setEditingItem(item.id);
    setEditContent(item.content);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingItem) return;

    const updatedItems = contextItems.map(item =>
      item.id === editingItem ? { ...item, content: editContent } : item
    );

    onContextUpdate(updatedItems);
    setEditingItem(null);
    setEditContent('');
  }, [editingItem, editContent, contextItems, onContextUpdate]);

  const cancelEdit = useCallback(() => {
    setEditingItem(null);
    setEditContent('');
  }, []);

  // Content preview
  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const getTypeIcon = (type: ContextItem['type']) => {
    const icons = {
      message: '💬',
      file: '📄',
      summary: '📋',
      reference: '🔗',
      note: '📝'
    };
    return icons[type] || '📄';
  };

  const getTypeColor = (type: ContextItem['type']) => {
    const colors = {
      message: 'text-blue-400',
      file: 'text-green-400',
      summary: 'text-purple-400',
      reference: 'text-yellow-400',
      note: 'text-gray-400'
    };
    return colors[type] || 'text-gray-400';
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const detectLanguage = (content: string, filename?: string): string => {
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();
      const extMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'jsx',
        'ts': 'typescript',
        'tsx': 'tsx',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'go': 'go',
        'rs': 'rust',
        'php': 'php',
        'rb': 'ruby',
        'swift': 'swift',
        'kt': 'kotlin',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'md': 'markdown',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'sql': 'sql'
      };
      if (ext && extMap[ext]) return extMap[ext];
    }

    // Simple content detection
    if (content.includes('function ') || content.includes('const ') || content.includes('let ')) {
      return 'javascript';
    }
    if (content.includes('def ') || content.includes('import ')) {
      return 'python';
    }
    if (content.includes('<') && content.includes('>')) {
      return 'html';
    }

    return 'text';
  };

  return (
    <div className={`flex flex-col h-full bg-vegas-gradient ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-vegas-gradient">Context Manager</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">
              {formatTokens(totalTokens)}/{formatTokens(maxTokens)} tokens
            </span>
            <div className={`w-3 h-3 rounded-full ${
              usagePercent < 70 ? 'bg-green-400' : 
              usagePercent < 90 ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mb-4">
          <div className="w-full bg-[var(--glass-border)] rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(usagePercent, 100)}%`,
                backgroundColor: usagePercent < 70 ? '#10B981' : 
                               usagePercent < 90 ? '#F59E0B' : '#EF4444'
              }}
            />
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {usagePercent.toFixed(1)}% of context window used
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ContextItem['type'] | 'all')}
            className="input-vegas text-sm flex-1 min-w-[120px]"
          >
            <option value="all">All Types</option>
            <option value="message">Messages</option>
            <option value="file">Files</option>
            <option value="summary">Summaries</option>
            <option value="reference">References</option>
            <option value="note">Notes</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="input-vegas text-sm flex-1 min-w-[120px]"
          >
            <option value="priority">Priority</option>
            <option value="timestamp">Date</option>
            <option value="tokens">Size</option>
            <option value="relevance">Relevance</option>
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="btn-vegas-secondary text-xs px-3 py-1"
          >
            {selectedItems.size === filteredAndSortedItems.length ? 'Deselect All' : 'Select All'}
          </button>
          
          {selectedItems.size > 0 && (
            <button
              onClick={deleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-lg transition-colors"
            >
              Delete ({selectedItems.size})
            </button>
          )}

          <button
            onClick={onContextOptimize}
            className="btn-vegas-primary text-xs px-3 py-1 ml-auto"
            disabled={usagePercent < 80}
          >
            Optimize Context
          </button>
        </div>
      </div>

      {/* Context Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-8">
            No context items found
          </div>
        ) : (
          filteredAndSortedItems.map((item, index) => {
            const isSelected = selectedItems.has(item.id);
            const isExpanded = expandedItems.has(item.id);
            const isDraggedOver = dragState.dragOverIndex === index;
            const isEditing = editingItem === item.id;

            return (
              <div
                key={item.id}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`glass-card p-4 transition-all cursor-move ${
                  isSelected ? 'ring-2 ring-[var(--vegas-gold)] bg-[var(--glass-bg-active)]' : ''
                } ${isDraggedOver ? 'border-[var(--vegas-gold)] border-2' : ''} ${
                  dragState.isDragging && dragState.draggedItemId === item.id ? 'opacity-50' : ''
                }`}
              >
                {/* Item Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.id)}
                      className="w-4 h-4 text-[var(--vegas-gold)] rounded focus:ring-[var(--vegas-gold)]"
                    />
                    
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium capitalize ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                          <span className="text-xs bg-[var(--glass-bg)] px-2 py-0.5 rounded text-[var(--text-muted)]">
                            Priority: {item.priority}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                          <span>{formatTokens(item.tokens)} tokens</span>
                          {item.relevanceScore && (
                            <span>Relevance: {(item.relevanceScore * 100).toFixed(0)}%</span>
                          )}
                          {item.compressed && (
                            <span className="text-orange-400">Compressed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--vegas-gold)] transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    
                    <button
                      onClick={() => startEditing(item)}
                      className="text-[var(--text-muted)] hover:text-[var(--vegas-gold)] transition-colors text-sm"
                      title="Edit"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => onContextDelete([item.id])}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors text-sm"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="mb-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="input-vegas w-full h-32 resize-none font-mono text-sm"
                        placeholder="Edit content..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="btn-vegas-primary text-xs px-3 py-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="btn-vegas-secondary text-xs px-3 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : isExpanded ? (
                    <div className="code-block-vegas">
                      <SyntaxHighlighter
                        language={detectLanguage(item.content, item.source)}
                        style={oneDark}
                        customStyle={{
                          background: 'transparent',
                          padding: 0,
                          margin: 0,
                          fontSize: '12px',
                          maxHeight: '300px',
                          overflow: 'auto'
                        }}
                        wrapLongLines
                      >
                        {item.content}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--text-secondary)] line-clamp-2">
                      {item.content}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-3">
                    <span>Source: {item.source}</span>
                    {item.sessionId && (
                      <span>Session: {item.sessionId.slice(0, 8)}...</span>
                    )}
                  </div>
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[var(--glass-bg)] text-xs text-[var(--text-muted)] rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-[var(--glass-border)] p-4">
        <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>{filteredAndSortedItems.length} items</span>
          <div className="flex gap-2">
            <button
              onClick={() => setExpandedItems(new Set())}
              className="hover:text-[var(--vegas-gold)] transition-colors"
            >
              Collapse All
            </button>
            <button
              onClick={() => setExpandedItems(new Set(filteredAndSortedItems.map(item => item.id)))}
              className="hover:text-[var(--vegas-gold)] transition-colors"
            >
              Expand All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextManager;