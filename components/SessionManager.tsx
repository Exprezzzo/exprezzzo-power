'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Archive, 
  Star, 
  Share2, 
  Trash2, 
  GitBranch, 
  GitMerge, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Tag,
  Download,
  RefreshCw,
  Grid,
  List,
  Calendar,
  MessageSquare,
  Clock
} from 'lucide-react';
import { AISession, SessionMetadata } from '@/types/ai-playground';
import { VEGAS_THEME_COLORS } from '@/types/ai-playground';

interface SessionManagerProps {
  onSessionSelect?: (session: AISession) => void;
  currentSessionId?: string;
  className?: string;
}

interface SessionListItem extends AISession {
  selected?: boolean;
}

interface FilterState {
  status: 'all' | 'active' | 'archived' | 'favorited' | 'shared';
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
  search: string;
  tags: string[];
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function SessionManager({ 
  onSessionSelect, 
  currentSessionId, 
  className = '' 
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    search: '',
    tags: []
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [showFilters, setShowFilters] = useState(false);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.status !== 'all' && { filter: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.tags.length > 0 && { tags: filters.tags.join(',') })
      });

      const response = await fetch(`/api/sessions?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }
      
      const data = await response.json();
      
      setSessions(data.sessions.map((s: AISession) => ({
        ...s,
        selected: selectedSessions.has(s.id)
      })));
      
      setPagination(prev => ({
        ...prev,
        total: data.total,
        pages: data.pages
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, selectedSessions]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSessionClick = (session: AISession) => {
    if (onSessionSelect) {
      onSessionSelect(session);
    }
  };

  const handleSessionSelect = (sessionId: string, selected: boolean) => {
    const newSelected = new Set(selectedSessions);
    if (selected) {
      newSelected.add(sessionId);
    } else {
      newSelected.delete(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(sessions.map(s => s.id)));
    }
  };

  const handleBulkOperation = async (operation: string, params?: any) => {
    if (selectedSessions.size === 0) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'batch',
          sessionIds: Array.from(selectedSessions),
          operation: operation,
          params
        })
      });
      
      if (!response.ok) {
        throw new Error('Bulk operation failed');
      }
      
      const result = await response.json();
      
      if (result.failed > 0) {
        setError(`${result.failed} operations failed`);
      }
      
      setSelectedSessions(new Set());
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk operation failed');
    } finally {
      setLoading(false);
      setBulkMenuOpen(false);
    }
  };

  const handleForkSession = async (sessionId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'fork',
          sourceSessionId: sessionId,
          newTitle: `${sessions.find(s => s.id === sessionId)?.title} (Fork)`
        })
      });
      
      if (!response.ok) {
        throw new Error('Fork failed');
      }
      
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fork failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (createdAt: Date | string, updatedAt: Date | string) => {
    const start = new Date(createdAt).getTime();
    const end = new Date(updatedAt).getTime();
    const minutes = Math.floor((end - start) / 60000);
    return minutes > 0 ? `${minutes}m` : '<1m';
  };

  return (
    <div className={`bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: VEGAS_THEME_COLORS.primary }}>
          Session Manager
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Filter size={20} />
          </button>
          <button
            onClick={loadSessions}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-amber-400 focus:outline-none"
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
            >
              <option value="all">All Sessions</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="favorited">Favorited</option>
              <option value="shared">Shared</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
            >
              <option value="updatedAt">Last Modified</option>
              <option value="createdAt">Created</option>
              <option value="title">Title</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedSessions.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg mb-4">
          <span className="text-amber-400 text-sm font-medium">
            {selectedSessions.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkOperation('favorite', { favorited: true })}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Add to favorites"
            >
              <Star size={16} />
            </button>
            <button
              onClick={() => handleBulkOperation('archive')}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Archive"
            >
              <Archive size={16} />
            </button>
            <button
              onClick={() => handleBulkOperation('export', { format: 'json' })}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Export"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => handleBulkOperation('delete')}
              className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-red-400"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4 text-red-400">
          {error}
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-2 mb-6">
        {loading && sessions.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <MessageSquare className="mx-auto mb-2" size={24} />
            No sessions found
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 bg-white/5 hover:bg-white/10 border rounded-lg transition-all cursor-pointer ${
                currentSessionId === session.id ? 'border-amber-400' : 'border-white/10'
              }`}
              onClick={() => handleSessionClick(session)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedSessions.has(session.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSessionSelect(session.id, e.target.checked);
                  }}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-white truncate">
                      {session.title}
                    </h3>
                    {session.metadata.favorited && (
                      <Star className="text-amber-400" size={16} fill="currentColor" />
                    )}
                    {session.metadata.shared && (
                      <Share2 className="text-blue-400" size={16} />
                    )}
                    {session.metadata.parentSessionId && (
                      <GitBranch className="text-green-400" size={16} />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-white/70">
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      {session.metadata.messageCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDuration(session.metadata.createdAt, session.metadata.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(session.metadata.updatedAt)}
                    </div>
                  </div>
                  
                  {session.metadata.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag size={12} />
                      <div className="flex gap-1">
                        {session.metadata.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-white/10 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleForkSession(session.id);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="Fork session"
                  >
                    <GitBranch size={16} />
                  </button>
                  <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/70">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} sessions
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 rounded bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="px-3 py-1 bg-white/5 rounded">
              {pagination.page} / {pagination.pages}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}