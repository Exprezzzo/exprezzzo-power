import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
  latency?: number;
  error?: string;
  branches?: string[]; // For conversation branching
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  tags?: string[];
  settings?: {
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  conversations: string[]; // Conversation IDs
  createdAt: Date;
  context?: string; // Project-specific context
  color?: string;
  icon?: string;
}

interface ChatStore {
  // State
  conversations: Record<string, Conversation>;
  projects: Record<string, Project>;
  activeConversationId: string | null;
  activeProjectId: string | null;
  
  // Actions
  createConversation: (title?: string, projectId?: string) => string;
  deleteConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  
  createProject: (name: string, description?: string) => string;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  
  setActiveConversation: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  
  // Branch management
  branchConversation: (conversationId: string, fromMessageId: string) => string;
  
  // Search and filters
  searchConversations: (query: string) => Conversation[];
  getRecentConversations: (limit?: number) => Conversation[];
  
  // Export/Import
  exportConversation: (id: string) => string;
  importConversation: (data: string) => string;
  
  // Clear all data
  clearAll: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    immer((set, get) => ({
      conversations: {},
      projects: {},
      activeConversationId: null,
      activeProjectId: null,

      createConversation: (title, projectId) => {
        const id = uuidv4();
        const conversation: Conversation = {
          id,
          title: title || `New Chat ${Object.keys(get().conversations).length + 1}`,
          messages: [],
          model: 'gpt-4o',
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId,
          settings: {
            temperature: 0.7,
            maxTokens: 2000,
          }
        };
        
        set((state) => {
          state.conversations[id] = conversation;
          if (projectId && state.projects[projectId]) {
            state.projects[projectId].conversations.push(id);
          }
          state.activeConversationId = id;
        });
        
        return id;
      },

      deleteConversation: (id) => {
        set((state) => {
          const conversation = state.conversations[id];
          if (conversation?.projectId && state.projects[conversation.projectId]) {
            const project = state.projects[conversation.projectId];
            project.conversations = project.conversations.filter(cId => cId !== id);
          }
          delete state.conversations[id];
          if (state.activeConversationId === id) {
            state.activeConversationId = null;
          }
        });
      },

      updateConversation: (id, updates) => {
        set((state) => {
          if (state.conversations[id]) {
            Object.assign(state.conversations[id], updates);
            state.conversations[id].updatedAt = new Date();
          }
        });
      },

      addMessage: (conversationId, message) => {
        set((state) => {
          if (state.conversations[conversationId]) {
            state.conversations[conversationId].messages.push({
              ...message,
              id: uuidv4(),
              timestamp: new Date(),
            });
            state.conversations[conversationId].updatedAt = new Date();
          }
        });
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            const message = conversation.messages.find(m => m.id === messageId);
            if (message) {
              Object.assign(message, updates);
            }
          }
        });
      },

      deleteMessage: (conversationId, messageId) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (conversation) {
            conversation.messages = conversation.messages.filter(m => m.id !== messageId);
          }
        });
      },

      createProject: (name, description) => {
        const id = uuidv4();
        const project: Project = {
          id,
          name,
          description,
          conversations: [],
          createdAt: new Date(),
          color: '#FFD700', // Vegas gold
        };
        
        set((state) => {
          state.projects[id] = project;
          state.activeProjectId = id;
        });
        
        return id;
      },

      deleteProject: (id) => {
        set((state) => {
          // Delete all conversations in project
          const project = state.projects[id];
          if (project) {
            project.conversations.forEach(cId => {
              delete state.conversations[cId];
            });
          }
          delete state.projects[id];
          if (state.activeProjectId === id) {
            state.activeProjectId = null;
          }
        });
      },

      updateProject: (id, updates) => {
        set((state) => {
          if (state.projects[id]) {
            Object.assign(state.projects[id], updates);
          }
        });
      },

      setActiveConversation: (id) => {
        set((state) => {
          state.activeConversationId = id;
        });
      },

      setActiveProject: (id) => {
        set((state) => {
          state.activeProjectId = id;
        });
      },

      branchConversation: (conversationId, fromMessageId) => {
        const conversation = get().conversations[conversationId];
        if (!conversation) return '';
        
        const messageIndex = conversation.messages.findIndex(m => m.id === fromMessageId);
        if (messageIndex === -1) return '';
        
        const newId = uuidv4();
        const branchedConversation: Conversation = {
          ...conversation,
          id: newId,
          title: `${conversation.title} (Branch)`,
          messages: conversation.messages.slice(0, messageIndex + 1),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => {
          state.conversations[newId] = branchedConversation;
          state.activeConversationId = newId;
        });
        
        return newId;
      },

      searchConversations: (query) => {
        const conversations = Object.values(get().conversations);
        const lowerQuery = query.toLowerCase();
        return conversations.filter(conv => 
          conv.title.toLowerCase().includes(lowerQuery) ||
          conv.messages.some(m => m.content.toLowerCase().includes(lowerQuery))
        );
      },

      getRecentConversations: (limit = 10) => {
        const conversations = Object.values(get().conversations);
        return conversations
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, limit);
      },

      exportConversation: (id) => {
        const conversation = get().conversations[id];
        if (!conversation) return '';
        return JSON.stringify(conversation, null, 2);
      },

      importConversation: (data) => {
        try {
          const conversation = JSON.parse(data) as Conversation;
          const newId = uuidv4();
          conversation.id = newId;
          conversation.createdAt = new Date(conversation.createdAt);
          conversation.updatedAt = new Date();
          
          set((state) => {
            state.conversations[newId] = conversation;
          });
          
          return newId;
        } catch (error) {
          console.error('Failed to import conversation:', error);
          return '';
        }
      },

      clearAll: () => {
        set((state) => {
          state.conversations = {};
          state.projects = {};
          state.activeConversationId = null;
          state.activeProjectId = null;
        });
      },
    })),
    {
      name: 'exprezzzo-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        projects: state.projects,
      }),
    }
  )
);