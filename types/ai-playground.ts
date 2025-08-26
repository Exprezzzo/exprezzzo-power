// types/ai-playground.ts
// Comprehensive type definitions for Exprezzzo AI Playground

export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'huggingface';

export type ModelId = 
  | 'gpt-4o' 
  | 'gpt-4o-mini' 
  | 'gpt-3.5-turbo' 
  | 'claude-3-5-sonnet' 
  | 'claude-3-opus' 
  | 'claude-3-haiku'
  | 'gemini-pro' 
  | 'gemini-flash'
  | 'llama-3.1-70b'
  | 'mixtral-8x7b';

export interface ModelConfig {
  id: ModelId;
  provider: ModelProvider;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  costPer1kTokens: number;
  strengths: string[];
  weaknesses: string[];
  color: string;
  icon: string;
  availability: ModelAvailability;
}

export type ModelAvailability = 'online' | 'offline' | 'degraded' | 'maintenance';

export type MessageRole = 'user' | 'assistant' | 'system' | 'function';

export interface BaseMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  modelId?: ModelId;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  tokens?: number;
  cost?: number;
  latency?: number;
  finishReason?: 'stop' | 'length' | 'function_call' | 'content_filter';
  requestId?: string;
  cached?: boolean;
}

export interface StreamingMessage extends BaseMessage {
  isStreaming: boolean;
  streamingContent?: string;
  chunks?: StreamChunk[];
}

export interface StreamChunk {
  id: string;
  content: string;
  timestamp: number;
  delta?: number;
}

export type VoteType = 'upvote' | 'downvote' | 'neutral';

export interface MessageVote {
  messageId: string;
  vote: VoteType;
  reason?: string;
  timestamp: Date;
}

export interface RoundtableResponse {
  messageId: string;
  modelId: ModelId;
  content: string;
  metadata: MessageMetadata;
  vote?: MessageVote;
  ranking?: number;
}

export interface RoundtableResult {
  id: string;
  prompt: string;
  responses: RoundtableResponse[];
  winner?: ModelId;
  consensus?: string;
  timestamp: Date;
  totalCost: number;
  totalLatency: number;
}

export interface PlaygroundSession {
  id: string;
  name: string;
  description?: string;
  messages: BaseMessage[];
  settings: SessionSettings;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  isArchived?: boolean;
  roundtableResults?: RoundtableResult[];
}

export interface SessionSettings {
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  streaming: boolean;
  modelId: ModelId;
  systemPrompt?: string;
  jsonMode?: boolean;
  functionCalling?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  sessions: PlaygroundSession[];
  sharedWith?: string[];
  owner: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  tags?: string[];
}

export interface ModelHealthStatus {
  modelId: ModelId;
  status: ModelAvailability;
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  incidents?: ModelIncident[];
}

export interface ModelIncident {
  id: string;
  modelId: ModelId;
  type: 'outage' | 'degradation' | 'rate_limit' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date;
  endTime?: Date;
  description: string;
  affectedRegions?: string[];
}

export interface QueryComplexity {
  score: number; // 0-100
  factors: {
    length: number;
    technicalTerms: number;
    codeBlocks: number;
    multipleQuestions: number;
    reasoning: number;
    creativity: number;
  };
  recommendedModel: ModelId;
  fallbackChain: ModelId[];
}

export interface StreamingConfig {
  chunkSize: number;
  batchInterval: number;
  enableBuffering: boolean;
  maxBufferSize: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerHour: number;
  burstLimit: number;
  windowSize: number;
}

export interface OrchestrationConfig {
  fallbackEnabled: boolean;
  fallbackChain: ModelId[];
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  failureThreshold: number;
}

export interface StorageConfig {
  localStorage: boolean;
  firebase: boolean;
  conflictResolution: 'local' | 'remote' | 'merge' | 'prompt';
  syncInterval: number;
  offlineSupport: boolean;
}

export interface UIConfig {
  theme: 'dark' | 'light' | 'auto' | 'vegas';
  layout: 'single' | 'dual' | 'artifacts';
  paneSplit: number; // 0-100
  touchTargetSize: number;
  animations: boolean;
  glassmorphism: boolean;
}

export interface PlaygroundConfig {
  streaming: StreamingConfig;
  rateLimit: RateLimitConfig;
  orchestration: OrchestrationConfig;
  storage: StorageConfig;
  ui: UIConfig;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    modelUsed?: ModelId;
    tokensUsed?: number;
    cost?: number;
  };
}

export interface StreamResponse {
  id: string;
  type: 'chunk' | 'metadata' | 'error' | 'done';
  content?: string;
  metadata?: MessageMetadata;
  error?: string;
}

export interface RoundtableRequest {
  prompt: string;
  models: ModelId[];
  settings: Partial<SessionSettings>;
  includeVoting?: boolean;
}

export interface ModelRoutingRequest {
  prompt: string;
  context?: string[];
  preferences?: {
    speed?: number; // 0-100
    quality?: number; // 0-100
    cost?: number; // 0-100
  };
  fallbackEnabled?: boolean;
}

// Event Types for Real-time Updates
export type PlaygroundEvent = 
  | { type: 'message_start'; messageId: string; modelId: ModelId }
  | { type: 'message_chunk'; messageId: string; chunk: StreamChunk }
  | { type: 'message_complete'; messageId: string; metadata: MessageMetadata }
  | { type: 'message_error'; messageId: string; error: string }
  | { type: 'model_status_change'; modelId: ModelId; status: ModelAvailability }
  | { type: 'session_updated'; sessionId: string; changes: Partial<PlaygroundSession> }
  | { type: 'roundtable_start'; roundtableId: string; models: ModelId[] }
  | { type: 'roundtable_complete'; roundtableId: string; result: RoundtableResult };

// Hook Types
export interface UsePlaygroundState {
  sessions: PlaygroundSession[];
  currentSession: PlaygroundSession | null;
  models: ModelConfig[];
  config: PlaygroundConfig;
  loading: boolean;
  error: string | null;
}

export interface UsePlaygroundActions {
  createSession: (name: string, settings?: Partial<SessionSettings>) => Promise<PlaygroundSession>;
  updateSession: (id: string, updates: Partial<PlaygroundSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (content: string, sessionId?: string) => Promise<BaseMessage>;
  startRoundtable: (prompt: string, models: ModelId[]) => Promise<RoundtableResult>;
  updateConfig: (config: Partial<PlaygroundConfig>) => void;
  exportSession: (sessionId: string, format: 'json' | 'markdown' | 'txt') => string;
  importSession: (data: string, format: 'json' | 'markdown') => Promise<PlaygroundSession>;
}

// Component Props Types
export interface DualPaneLayoutProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  initialSplit?: number;
  minSize?: number;
  maxSize?: number;
  onSplitChange?: (split: number) => void;
  className?: string;
}

export interface MessageBubbleProps {
  message: BaseMessage | StreamingMessage;
  onVote?: (vote: VoteType) => void;
  onCopy?: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModel: ModelId;
  onModelChange: (modelId: ModelId) => void;
  showHealth?: boolean;
  layout?: 'grid' | 'list' | 'compact';
}

export interface SessionTabsProps {
  sessions: PlaygroundSession[];
  currentSessionId: string | null;
  onSessionChange: (sessionId: string) => void;
  onNewSession: () => void;
  onCloseSession: (sessionId: string) => void;
  maxTabs?: number;
}

// Validation and Error Types
export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

export interface FormErrors {
  [key: string]: ValidationError[];
}

export type PlaygroundError = 
  | { type: 'network'; message: string; retryable: boolean }
  | { type: 'api'; message: string; code: string; retryable: boolean }
  | { type: 'validation'; errors: ValidationError[] }
  | { type: 'storage'; message: string; recoverable: boolean }
  | { type: 'model'; modelId: ModelId; message: string; temporary: boolean };

// Constants and Enums
export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    description: 'Most capable model for complex reasoning',
    maxTokens: 4096,
    contextWindow: 128000,
    costPer1kTokens: 0.015,
    strengths: ['Reasoning', 'Code', 'Analysis'],
    weaknesses: ['Cost', 'Speed'],
    color: '#10B981',
    icon: '🧠',
    availability: 'online'
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient for most tasks',
    maxTokens: 4096,
    contextWindow: 16384,
    costPer1kTokens: 0.001,
    strengths: ['Speed', 'Cost', 'Versatile'],
    weaknesses: ['Complex reasoning'],
    color: '#06B6D4',
    icon: '⚡',
    availability: 'online'
  },
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    description: 'Excellent for analysis and writing',
    maxTokens: 4096,
    contextWindow: 200000,
    costPer1kTokens: 0.015,
    strengths: ['Analysis', 'Writing', 'Safety'],
    weaknesses: ['Code generation'],
    color: '#F97316',
    icon: '🎭',
    availability: 'online'
  },
  'gemini-pro': {
    id: 'gemini-pro',
    provider: 'gemini',
    name: 'Gemini Pro',
    description: 'Google\'s most capable model',
    maxTokens: 2048,
    contextWindow: 32768,
    costPer1kTokens: 0.0005,
    strengths: ['Cost', 'Multimodal', 'Knowledge'],
    weaknesses: ['Context length'],
    color: '#8B5CF6',
    icon: '💎',
    availability: 'online'
  },
  'mixtral-8x7b': {
    id: 'mixtral-8x7b',
    provider: 'groq',
    name: 'Mixtral 8x7B',
    description: 'Ultra-fast inference with Groq',
    maxTokens: 2048,
    contextWindow: 32768,
    costPer1kTokens: 0.0008,
    strengths: ['Speed', 'Cost', 'Open source'],
    weaknesses: ['Context length', 'Complex reasoning'],
    color: '#EC4899',
    icon: '🚀',
    availability: 'online'
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    description: 'Smaller, faster version of GPT-4o',
    maxTokens: 4096,
    contextWindow: 128000,
    costPer1kTokens: 0.00015,
    strengths: ['Speed', 'Cost', 'Reasoning'],
    weaknesses: ['Complex tasks'],
    color: '#22C55E',
    icon: '⚡',
    availability: 'online'
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    description: 'Most powerful Claude model',
    maxTokens: 4096,
    contextWindow: 200000,
    costPer1kTokens: 0.015,
    strengths: ['Reasoning', 'Analysis', 'Safety'],
    weaknesses: ['Cost', 'Speed'],
    color: '#F59E0B',
    icon: '🎪',
    availability: 'online'
  },
  'claude-3-haiku': {
    id: 'claude-3-haiku',
    provider: 'anthropic',
    name: 'Claude 3 Haiku',
    description: 'Fastest Claude model',
    maxTokens: 4096,
    contextWindow: 200000,
    costPer1kTokens: 0.00025,
    strengths: ['Speed', 'Cost', 'Concise'],
    weaknesses: ['Complex reasoning'],
    color: '#EF4444',
    icon: '🏃',
    availability: 'online'
  },
  'gemini-flash': {
    id: 'gemini-flash',
    provider: 'gemini',
    name: 'Gemini Flash',
    description: 'Fast, lightweight Gemini model',
    maxTokens: 2048,
    contextWindow: 1048576,
    costPer1kTokens: 0.0001,
    strengths: ['Speed', 'Cost', 'Large context'],
    weaknesses: ['Complex reasoning'],
    color: '#A855F7',
    icon: '⚡',
    availability: 'online'
  },
  'llama-3.1-70b': {
    id: 'llama-3.1-70b',
    provider: 'groq',
    name: 'Llama 3.1 70B',
    description: 'Meta\'s powerful open-source model',
    maxTokens: 4096,
    contextWindow: 128000,
    costPer1kTokens: 0.0008,
    strengths: ['Open source', 'Reasoning', 'Speed'],
    weaknesses: ['Availability'],
    color: '#06B6D4',
    icon: '🦙',
    availability: 'online'
  }
};

export const DEFAULT_FALLBACK_CHAIN: ModelId[] = [
  'gpt-4o',
  'claude-3-5-sonnet', 
  'gpt-3.5-turbo',
  'gemini-pro'
];

export const VEGAS_THEME_COLORS = {
  primary: '#FFD700', // Vegas Gold
  secondary: '#1A1A1A', // Rich Black
  accent: '#FF6B35', // Vegas Orange
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  background: {
    dark: '#0A0A0A',
    card: 'rgba(255, 215, 0, 0.05)', // Gold tint
    glass: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    muted: '#6B7280',
  },
  border: {
    primary: 'rgba(255, 215, 0, 0.2)',
    secondary: 'rgba(255, 255, 255, 0.1)',
  }
} as const;