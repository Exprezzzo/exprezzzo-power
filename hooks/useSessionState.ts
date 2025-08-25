'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AISession, AIMessage, SessionMetadata } from '@/types/ai-playground';

interface SessionState {
  sessions: AISession[];
  currentSession: AISession | null;
  loading: boolean;
  error: string | null;
  syncing: boolean;
  lastSync: Date | null;
}

interface SessionActions {
  createSession: (session: Partial<AISession>) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<AISession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  addMessage: (sessionId: string, message: AIMessage) => Promise<void>;
  forkSession: (sessionId: string, forkPoint?: number) => Promise<string>;
  refreshSessions: () => Promise<void>;
  setCurrentSession: (session: AISession | null) => void;
}

interface UseSessionStateOptions {
  autoSync?: boolean;
  syncInterval?: number;
  enableRealtime?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

type SessionStateHook = SessionState & SessionActions;

const DEFAULT_OPTIONS: Required<UseSessionStateOptions> = {
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  enableRealtime: true,
  maxRetries: 3,
  retryDelay: 1000
};

export function useSessionState(options: UseSessionStateOptions = {}): SessionStateHook {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<SessionState>({
    sessions: [],
    currentSession: null,
    loading: false,
    error: null,
    syncing: false,
    lastSync: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // API call wrapper with retry logic
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < opts.maxRetries) {
          const delay = opts.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`${operationName} failed after ${opts.maxRetries + 1} attempts: ${lastError.message}`);
  }, [opts.maxRetries, opts.retryDelay]);

  // WebSocket connection for real-time sync
  const connectWebSocket = useCallback(() => {
    if (!opts.enableRealtime) return;
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/sessions/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Session sync WebSocket connected');
        retryCountRef.current = 0;
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Session sync WebSocket disconnected');
        
        // Reconnect with exponential backoff
        if (retryCountRef.current < opts.maxRetries) {
          const delay = opts.retryDelay * Math.pow(2, retryCountRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            retryCountRef.current++;
            connectWebSocket();
          }, delay);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Session sync WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [opts.enableRealtime, opts.maxRetries, opts.retryDelay]);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'session_updated':
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(s => 
            s.id === data.sessionId ? { ...s, ...data.updates } : s
          ),
          currentSession: prev.currentSession?.id === data.sessionId 
            ? { ...prev.currentSession, ...data.updates }
            : prev.currentSession
        }));
        break;
        
      case 'session_created':
        setState(prev => ({
          ...prev,
          sessions: [data.session, ...prev.sessions]
        }));
        break;
        
      case 'session_deleted':
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.filter(s => s.id !== data.sessionId),
          currentSession: prev.currentSession?.id === data.sessionId 
            ? null 
            : prev.currentSession
        }));
        break;
        
      case 'message_added':
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(s => 
            s.id === data.sessionId 
              ? { ...s, messages: [...s.messages, data.message] }
              : s
          ),
          currentSession: prev.currentSession?.id === data.sessionId
            ? { ...prev.currentSession, messages: [...prev.currentSession.messages, data.message] }
            : prev.currentSession
        }));
        break;
    }
  }, []);

  // Local storage sync
  const syncToLocalStorage = useCallback((sessions: AISession[], currentSessionId?: string) => {
    try {
      localStorage.setItem('exprezzzo_sessions', JSON.stringify(sessions));
      if (currentSessionId) {
        localStorage.setItem('exprezzzo_current_session', currentSessionId);
      }
    } catch (error) {
      console.warn('Failed to sync to localStorage:', error);
    }
  }, []);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const sessionsData = localStorage.getItem('exprezzzo_sessions');
      const currentSessionId = localStorage.getItem('exprezzzo_current_session');
      
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        const currentSession = currentSessionId 
          ? sessions.find((s: AISession) => s.id === currentSessionId) || null
          : null;
          
        setState(prev => ({
          ...prev,
          sessions,
          currentSession
        }));
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }, []);

  // Server sync
  const syncWithServer = useCallback(async () => {
    if (state.syncing) return;
    
    setState(prev => ({ ...prev, syncing: true, error: null }));
    
    try {
      await withRetry(async () => {
        const response = await fetch('/api/sessions?limit=100');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        setState(prev => ({
          ...prev,
          sessions: data.sessions,
          lastSync: new Date(),
          syncing: false
        }));
        
        syncToLocalStorage(data.sessions, state.currentSession?.id);
      }, 'Server sync');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sync failed',
        syncing: false
      }));
    }
  }, [state.syncing, state.currentSession?.id, syncToLocalStorage, withRetry]);

  // Actions
  const createSession = useCallback(async (session: Partial<AISession>): Promise<string> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const sessionId = await withRetry(async () => {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'create',
            session
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data.sessionId;
      }, 'Create session');
      
      // Optimistic update
      const newSession: AISession = {
        id: sessionId,
        title: session.title || 'New Session',
        messages: session.messages || [],
        modelConfigs: session.modelConfigs || [],
        settings: session.settings || {
          temperature: 0.7,
          maxTokens: 4000,
          systemPrompt: '',
          streamingEnabled: true
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          messageCount: session.messages?.length || 0,
          tokenCount: 0,
          tags: [],
          favorited: false,
          shared: false,
          visibility: 'private',
          forkHistory: [],
          ...session.metadata
        }
      };
      
      setState(prev => ({
        ...prev,
        sessions: [newSession, ...prev.sessions],
        currentSession: newSession,
        loading: false
      }));
      
      syncToLocalStorage([newSession, ...state.sessions], sessionId);
      
      return sessionId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create session',
        loading: false
      }));
      throw error;
    }
  }, [state.sessions, syncToLocalStorage, withRetry]);

  const loadSession = useCallback(async (sessionId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const session = await withRetry(async () => {
        const response = await fetch(`/api/sessions?id=${sessionId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      }, 'Load session');
      
      setState(prev => ({
        ...prev,
        currentSession: session,
        loading: false
      }));
      
      syncToLocalStorage(state.sessions, sessionId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load session',
        loading: false
      }));
    }
  }, [state.sessions, syncToLocalStorage, withRetry]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<AISession>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await withRetry(async () => {
        const response = await fetch(`/api/sessions?id=${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }, 'Update session');
      
      // Optimistic update
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => 
          s.id === sessionId ? { ...s, ...updates } : s
        ),
        currentSession: prev.currentSession?.id === sessionId 
          ? { ...prev.currentSession, ...updates }
          : prev.currentSession,
        loading: false
      }));
      
      syncToLocalStorage(state.sessions, state.currentSession?.id);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update session',
        loading: false
      }));
      throw error;
    }
  }, [state.sessions, state.currentSession?.id, syncToLocalStorage, withRetry]);

  const deleteSession = useCallback(async (sessionId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await withRetry(async () => {
        const response = await fetch(`/api/sessions?id=${sessionId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }, 'Delete session');
      
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== sessionId),
        currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession,
        loading: false
      }));
      
      syncToLocalStorage(state.sessions.filter(s => s.id !== sessionId), 
        state.currentSession?.id === sessionId ? undefined : state.currentSession?.id);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete session',
        loading: false
      }));
      throw error;
    }
  }, [state.sessions, state.currentSession?.id, syncToLocalStorage, withRetry]);

  const addMessage = useCallback(async (sessionId: string, message: AIMessage) => {
    const updatedMetadata: Partial<SessionMetadata> = {
      updatedAt: new Date(),
      messageCount: (state.sessions.find(s => s.id === sessionId)?.metadata.messageCount || 0) + 1
    };
    
    await updateSession(sessionId, {
      messages: [
        ...(state.sessions.find(s => s.id === sessionId)?.messages || []),
        message
      ],
      metadata: updatedMetadata
    });
  }, [state.sessions, updateSession]);

  const forkSession = useCallback(async (sessionId: string, forkPoint?: number): Promise<string> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const sessionId_new = await withRetry(async () => {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'fork',
            sourceSessionId: sessionId,
            forkPointIndex: forkPoint
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data.sessionId;
      }, 'Fork session');
      
      // Refresh sessions to get the new fork
      await syncWithServer();
      
      setState(prev => ({ ...prev, loading: false }));
      
      return sessionId_new;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fork session',
        loading: false
      }));
      throw error;
    }
  }, [syncWithServer, withRetry]);

  const refreshSessions = useCallback(async () => {
    await syncWithServer();
  }, [syncWithServer]);

  const setCurrentSession = useCallback((session: AISession | null) => {
    setState(prev => ({
      ...prev,
      currentSession: session
    }));
    
    syncToLocalStorage(state.sessions, session?.id);
  }, [state.sessions, syncToLocalStorage]);

  // Initialize
  useEffect(() => {
    loadFromLocalStorage();
    
    if (opts.autoSync) {
      syncWithServer();
    }
    
    if (opts.enableRealtime) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Auto sync interval
  useEffect(() => {
    if (opts.autoSync && opts.syncInterval > 0) {
      syncIntervalRef.current = setInterval(syncWithServer, opts.syncInterval);
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [opts.autoSync, opts.syncInterval, syncWithServer]);

  return {
    ...state,
    createSession,
    loadSession,
    updateSession,
    deleteSession,
    addMessage,
    forkSession,
    refreshSessions,
    setCurrentSession
  };
}