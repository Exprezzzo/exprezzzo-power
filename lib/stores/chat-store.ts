import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatStore {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  createConversation: () => string;
  addMessage: (conversationId: string, message: Omit<Message, 'id'>) => void;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: {},
      activeConversationId: null,

      createConversation: () => {
        const id = uuidv4();
        const now = Date.now();
        set((state) => ({
          conversations: {
            ...state.conversations,
            [id]: {
              id,
              title: 'New Chat',
              messages: [],
              createdAt: now,
              updatedAt: now
            }
          },
          activeConversationId: id
        }));
        return id;
      },

      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...state.conversations[conversationId],
              messages: [
                ...state.conversations[conversationId].messages,
                { ...message, id: uuidv4() }
              ],
              updatedAt: Date.now()
            }
          }
        }));
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) => set((state) => {
        const { [id]: deleted, ...rest } = state.conversations;
        return {
          conversations: rest,
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId
        };
      }),

      updateConversationTitle: (id, title) => set((state) => ({
        conversations: {
          ...state.conversations,
          [id]: {
            ...state.conversations[id],
            title,
            updatedAt: Date.now()
          }
        }
      }))
    }),
    {
      name: 'exprezzzo-chat-store'
    }
  )
);