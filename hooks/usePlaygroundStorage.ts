// hooks/usePlaygroundStorage.ts
// Hybrid storage hook combining localStorage and Firebase with offline support

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  PlaygroundSession, 
  Project, 
  SessionSettings,
  PlaygroundConfig,
  StorageConfig,
  ModelId 
} from '@/types/ai-playground';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
  getFirestore
} from 'firebase/firestore';
import { app } from '@/lib/firebase';

const STORAGE_KEYS = {
  sessions: 'exprezzzo_playground_sessions',
  projects: 'exprezzzo_playground_projects',
  config: 'exprezzzo_playground_config',
  lastSync: 'exprezzzo_playground_last_sync',
  pendingSync: 'exprezzzo_playground_pending_sync'
};

const DEFAULT_CONFIG: PlaygroundConfig = {
  streaming: {
    chunkSize: 1024,
    batchInterval: 50,
    enableBuffering: true,
    maxBufferSize: 8192
  },
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerHour: 100000,
    burstLimit: 10,
    windowSize: 60000
  },
  orchestration: {
    fallbackEnabled: true,
    fallbackChain: ['gpt-4o', 'claude-3-5-sonnet', 'gpt-3.5-turbo'],
    retryAttempts: 3,
    retryDelay: 1000,
    healthCheckInterval: 60000,
    failureThreshold: 3
  },
  storage: {
    localStorage: true,
    firebase: true,
    conflictResolution: 'merge',
    syncInterval: 30000,
    offlineSupport: true
  },
  ui: {
    theme: 'vegas',
    layout: 'dual',
    paneSplit: 50,
    touchTargetSize: 48,
    animations: true,
    glassmorphism: true
  }
};

interface StorageState {
  sessions: PlaygroundSession[];
  projects: Project[];
  config: PlaygroundConfig;
  currentSession: PlaygroundSession | null;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
  lastSync: Date | null;
}

interface StorageActions {
  // Session management
  createSession: (name: string, settings?: Partial<SessionSettings>) => Promise<PlaygroundSession>;
  updateSession: (sessionId: string, updates: Partial<PlaygroundSession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  setCurrentSession: (sessionId: string | null) => void;
  duplicateSession: (sessionId: string, newName?: string) => Promise<PlaygroundSession>;
  
  // Project management
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addSessionToProject: (projectId: string, sessionId: string) => Promise<void>;
  
  // Configuration
  updateConfig: (updates: Partial<PlaygroundConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  
  // Sync and backup
  forcSync: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  
  // Offline support
  enableOfflineMode: () => Promise<void>;
  disableOfflineMode: () => Promise<void>;
}

export function usePlaygroundStorage(): StorageState & StorageActions {
  const [state, setState] = useState<StorageState>({
    sessions: [],
    projects: [],
    config: DEFAULT_CONFIG,
    currentSession: null,
    loading: true,
    error: null,
    isOnline: true,
    syncStatus: 'idle',
    lastSync: null
  });

  const [user, setUser] = useState<User | null>(null);
  const [db] = useState(() => getFirestore(app));
  const [unsubscribes, setUnsubscribes] = useState<(() => void)[]>([]);

  // Initialize storage and auth
  useEffect(() => {
    const auth = getAuth(app);
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        initializeFirebaseSync(user.uid);
      } else {
        // User signed out - cleanup subscriptions
        unsubscribes.forEach(unsub => unsub());
        setUnsubscribes([]);
      }
    });

    // Initialize with localStorage data immediately
    initializeLocalStorage();
    
    // Setup online/offline detection
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      enableNetwork(db);
    };
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, syncStatus: 'offline' }));
      disableNetwork(db);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial online state
    setState(prev => ({ ...prev, isOnline: navigator.onLine }));

    return () => {
      unsubscribeAuth();
      unsubscribes.forEach(unsub => unsub());
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync with Firebase when online
  useEffect(() => {
    if (user && state.isOnline && state.config.storage.firebase) {
      const syncInterval = setInterval(() => {
        syncWithFirebase();
      }, state.config.storage.syncInterval);

      return () => clearInterval(syncInterval);
    }
  }, [user, state.isOnline, state.config.storage]);

  const initializeLocalStorage = useCallback(() => {
    try {
      const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.sessions) || '[]');
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || '[]');
      const config = JSON.parse(localStorage.getItem(STORAGE_KEYS.config) || 'null') || DEFAULT_CONFIG;
      const lastSyncStr = localStorage.getItem(STORAGE_KEYS.lastSync);
      
      setState(prev => ({
        ...prev,
        sessions: sessions.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        })),
        projects: projects.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        })),
        config,
        lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load stored data',
        loading: false 
      }));
    }
  }, []);

  const initializeFirebaseSync = useCallback(async (userId: string) => {
    if (!state.config.storage.firebase) return;

    try {
      setState(prev => ({ ...prev, syncStatus: 'syncing' }));

      // Setup real-time listeners
      const sessionsQuery = query(
        collection(db, 'users', userId, 'playground_sessions'),
        orderBy('updatedAt', 'desc')
      );
      
      const projectsQuery = query(
        collection(db, 'users', userId, 'playground_projects'),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
        const sessions: PlaygroundSession[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          sessions.push({
            ...data,
            id: doc.id,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            messages: data.messages.map((m: any) => ({
              ...m,
              timestamp: m.timestamp.toDate()
            }))
          } as PlaygroundSession);
        });
        
        setState(prev => ({ ...prev, sessions }));
        
        // Update localStorage
        if (state.config.storage.localStorage) {
          localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
        }
      });

      const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
        const projects: Project[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          projects.push({
            ...data,
            id: doc.id,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          } as Project);
        });
        
        setState(prev => ({ ...prev, projects }));
        
        // Update localStorage
        if (state.config.storage.localStorage) {
          localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
        }
      });

      setUnsubscribes([unsubscribeSessions, unsubscribeProjects]);
      
      setState(prev => ({ 
        ...prev, 
        syncStatus: 'idle',
        lastSync: new Date()
      }));

    } catch (error) {
      console.error('Firebase sync failed:', error);
      setState(prev => ({ 
        ...prev, 
        syncStatus: 'error',
        error: 'Sync failed - working offline'
      }));
    }
  }, [db, state.config.storage]);

  const syncWithFirebase = useCallback(async () => {
    if (!user || !state.isOnline || !state.config.storage.firebase) return;

    try {
      setState(prev => ({ ...prev, syncStatus: 'syncing' }));

      // Sync pending changes
      const pendingSync = JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingSync) || '[]');
      
      for (const change of pendingSync) {
        await applyFirebaseChange(change);
      }

      // Clear pending sync
      localStorage.removeItem(STORAGE_KEYS.pendingSync);
      
      setState(prev => ({ 
        ...prev, 
        syncStatus: 'idle',
        lastSync: new Date()
      }));
      
      localStorage.setItem(STORAGE_KEYS.lastSync, new Date().toISOString());

    } catch (error) {
      console.error('Sync failed:', error);
      setState(prev => ({ 
        ...prev, 
        syncStatus: 'error',
        error: 'Sync failed'
      }));
    }
  }, [user, state.isOnline, state.config.storage.firebase]);

  const applyFirebaseChange = async (change: any) => {
    const { type, collection: collectionName, id, data } = change;
    const docRef = doc(db, 'users', user!.uid, collectionName, id);

    switch (type) {
      case 'create':
      case 'update':
        await setDoc(docRef, data, { merge: true });
        break;
      case 'delete':
        await deleteDoc(docRef);
        break;
    }
  };

  const saveToLocalStorage = useCallback((key: string, data: any) => {
    if (state.config.storage.localStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    }
  }, [state.config.storage.localStorage]);

  const queueForSync = useCallback((change: any) => {
    if (!state.config.storage.firebase) return;

    try {
      const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingSync) || '[]');
      pending.push({ ...change, timestamp: Date.now() });
      localStorage.setItem(STORAGE_KEYS.pendingSync, JSON.stringify(pending));
    } catch (error) {
      console.error('Failed to queue sync:', error);
    }
  }, [state.config.storage.firebase]);

  // Session management
  const createSession = useCallback(async (name: string, settings?: Partial<SessionSettings>): Promise<PlaygroundSession> => {
    const session: PlaygroundSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      messages: [],
      settings: {
        temperature: 0.7,
        maxTokens: 2048,
        streaming: true,
        modelId: 'gpt-4o' as ModelId,
        ...settings
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false
    };

    setState(prev => ({ 
      ...prev, 
      sessions: [session, ...prev.sessions],
      currentSession: session
    }));

    saveToLocalStorage(STORAGE_KEYS.sessions, [session, ...state.sessions]);
    queueForSync({
      type: 'create',
      collection: 'playground_sessions',
      id: session.id,
      data: {
        ...session,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return session;
  }, [state.sessions, saveToLocalStorage, queueForSync]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<PlaygroundSession>): Promise<void> => {
    const updatedSession = {
      ...state.sessions.find(s => s.id === sessionId)!,
      ...updates,
      updatedAt: new Date()
    };

    const newSessions = state.sessions.map(s => 
      s.id === sessionId ? updatedSession : s
    );

    setState(prev => ({ 
      ...prev, 
      sessions: newSessions,
      currentSession: prev.currentSession?.id === sessionId ? updatedSession : prev.currentSession
    }));

    saveToLocalStorage(STORAGE_KEYS.sessions, newSessions);
    queueForSync({
      type: 'update',
      collection: 'playground_sessions',
      id: sessionId,
      data: {
        ...updatedSession,
        updatedAt: new Date()
      }
    });
  }, [state.sessions, saveToLocalStorage, queueForSync]);

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    const newSessions = state.sessions.filter(s => s.id !== sessionId);

    setState(prev => ({ 
      ...prev, 
      sessions: newSessions,
      currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession
    }));

    saveToLocalStorage(STORAGE_KEYS.sessions, newSessions);
    queueForSync({
      type: 'delete',
      collection: 'playground_sessions',
      id: sessionId
    });
  }, [state.sessions, saveToLocalStorage, queueForSync]);

  const setCurrentSession = useCallback((sessionId: string | null) => {
    const session = sessionId ? state.sessions.find(s => s.id === sessionId) || null : null;
    setState(prev => ({ ...prev, currentSession: session }));
  }, [state.sessions]);

  const duplicateSession = useCallback(async (sessionId: string, newName?: string): Promise<PlaygroundSession> => {
    const original = state.sessions.find(s => s.id === sessionId);
    if (!original) throw new Error('Session not found');

    return createSession(
      newName || `${original.name} (Copy)`,
      original.settings
    );
  }, [state.sessions, createSession]);

  // Project management
  const createProject = useCallback(async (name: string, description?: string): Promise<Project> => {
    const project: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      sessions: [],
      owner: user?.uid || 'anonymous',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false
    };

    setState(prev => ({ 
      ...prev, 
      projects: [project, ...prev.projects]
    }));

    saveToLocalStorage(STORAGE_KEYS.projects, [project, ...state.projects]);
    queueForSync({
      type: 'create',
      collection: 'playground_projects',
      id: project.id,
      data: {
        ...project,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return project;
  }, [state.projects, user, saveToLocalStorage, queueForSync]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<void> => {
    const updatedProject = {
      ...state.projects.find(p => p.id === projectId)!,
      ...updates,
      updatedAt: new Date()
    };

    const newProjects = state.projects.map(p => 
      p.id === projectId ? updatedProject : p
    );

    setState(prev => ({ ...prev, projects: newProjects }));

    saveToLocalStorage(STORAGE_KEYS.projects, newProjects);
    queueForSync({
      type: 'update',
      collection: 'playground_projects',
      id: projectId,
      data: {
        ...updatedProject,
        updatedAt: new Date()
      }
    });
  }, [state.projects, saveToLocalStorage, queueForSync]);

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    const newProjects = state.projects.filter(p => p.id !== projectId);

    setState(prev => ({ ...prev, projects: newProjects }));

    saveToLocalStorage(STORAGE_KEYS.projects, newProjects);
    queueForSync({
      type: 'delete',
      collection: 'playground_projects',
      id: projectId
    });
  }, [state.projects, saveToLocalStorage, queueForSync]);

  const addSessionToProject = useCallback(async (projectId: string, sessionId: string): Promise<void> => {
    const project = state.projects.find(p => p.id === projectId);
    const session = state.sessions.find(s => s.id === sessionId);
    
    if (!project || !session) {
      throw new Error('Project or session not found');
    }

    const updatedSessions = [...project.sessions];
    if (!updatedSessions.find(s => s.id === sessionId)) {
      updatedSessions.push(session);
    }

    await updateProject(projectId, { sessions: updatedSessions });
  }, [state.projects, state.sessions, updateProject]);

  // Configuration
  const updateConfig = useCallback(async (updates: Partial<PlaygroundConfig>): Promise<void> => {
    const newConfig = { ...state.config, ...updates };
    
    setState(prev => ({ ...prev, config: newConfig }));
    saveToLocalStorage(STORAGE_KEYS.config, newConfig);
  }, [state.config, saveToLocalStorage]);

  const resetConfig = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, config: DEFAULT_CONFIG }));
    saveToLocalStorage(STORAGE_KEYS.config, DEFAULT_CONFIG);
  }, [saveToLocalStorage]);

  // Sync and backup
  const forcSync = useCallback(async (): Promise<void> => {
    if (user && state.isOnline) {
      await syncWithFirebase();
    }
  }, [user, state.isOnline, syncWithFirebase]);

  const exportData = useCallback(async (): Promise<string> => {
    const exportData = {
      sessions: state.sessions,
      projects: state.projects,
      config: state.config,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.sessions, state.projects, state.config]);

  const importData = useCallback(async (data: string): Promise<void> => {
    try {
      const imported = JSON.parse(data);
      
      if (!imported.sessions || !imported.projects || !imported.config) {
        throw new Error('Invalid export format');
      }

      // Merge with existing data based on conflict resolution
      let mergedSessions = imported.sessions;
      let mergedProjects = imported.projects;

      if (state.config.storage.conflictResolution === 'merge') {
        const existingSessionIds = new Set(state.sessions.map(s => s.id));
        const existingProjectIds = new Set(state.projects.map(p => p.id));

        mergedSessions = [
          ...state.sessions,
          ...imported.sessions.filter((s: PlaygroundSession) => !existingSessionIds.has(s.id))
        ];

        mergedProjects = [
          ...state.projects,
          ...imported.projects.filter((p: Project) => !existingProjectIds.has(p.id))
        ];
      }

      setState(prev => ({
        ...prev,
        sessions: mergedSessions,
        projects: mergedProjects,
        config: imported.config
      }));

      saveToLocalStorage(STORAGE_KEYS.sessions, mergedSessions);
      saveToLocalStorage(STORAGE_KEYS.projects, mergedProjects);
      saveToLocalStorage(STORAGE_KEYS.config, imported.config);

      // Queue all for sync
      mergedSessions.forEach((session: PlaygroundSession) => {
        queueForSync({
          type: 'create',
          collection: 'playground_sessions',
          id: session.id,
          data: session
        });
      });

      mergedProjects.forEach((project: Project) => {
        queueForSync({
          type: 'create',
          collection: 'playground_projects',
          id: project.id,
          data: project
        });
      });

    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [state.sessions, state.projects, state.config, saveToLocalStorage, queueForSync]);

  const clearAllData = useCallback(async (): Promise<void> => {
    setState(prev => ({
      ...prev,
      sessions: [],
      projects: [],
      currentSession: null,
      config: DEFAULT_CONFIG
    }));

    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear Firebase data if user is signed in
    if (user && state.isOnline) {
      const userSessions = await getDocs(collection(db, 'users', user.uid, 'playground_sessions'));
      const userProjects = await getDocs(collection(db, 'users', user.uid, 'playground_projects'));

      const deletions = [
        ...userSessions.docs.map(doc => deleteDoc(doc.ref)),
        ...userProjects.docs.map(doc => deleteDoc(doc.ref))
      ];

      await Promise.all(deletions);
    }
  }, [user, state.isOnline, db]);

  // Offline support
  const enableOfflineMode = useCallback(async (): Promise<void> => {
    await disableNetwork(db);
    setState(prev => ({ ...prev, isOnline: false, syncStatus: 'offline' }));
  }, [db]);

  const disableOfflineMode = useCallback(async (): Promise<void> => {
    await enableNetwork(db);
    setState(prev => ({ ...prev, isOnline: true }));
    if (user) {
      await syncWithFirebase();
    }
  }, [db, user, syncWithFirebase]);

  return {
    // State
    ...state,
    
    // Actions
    createSession,
    updateSession,
    deleteSession,
    setCurrentSession,
    duplicateSession,
    createProject,
    updateProject,
    deleteProject,
    addSessionToProject,
    updateConfig,
    resetConfig,
    forcSync,
    exportData,
    importData,
    clearAllData,
    enableOfflineMode,
    disableOfflineMode
  };
}