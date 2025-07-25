// types/index.ts - Centralized type definitions
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  isPro: boolean;
  plan: 'free' | 'monthly' | 'yearly';
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'groq';
  model: string;
  description: string;
  contextWindow: number;
  maxTokens: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  capabilities: string[];
  isAvailable: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
  cost?: number;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired';
  plan: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface Usage {
  userId: string;
  date: string;
  apiCalls: number;
  tokensUsed: number;
  cost: number;
  modelBreakdown: {
    [model: string]: {
      calls: number;
      tokens: number;
      cost: number;
    };
  };
}

export interface ReferralInfo {
  code: string;
  referredUsers: number;
  creditsEarned: number;
  totalSavings: number;
}
