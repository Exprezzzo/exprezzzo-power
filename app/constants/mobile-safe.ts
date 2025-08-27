// MOBILE SAFE: Edit these values from GitHub mobile

export const PRICING = {
  groq: { perToken: 0.001, label: "75% cheaper" },
  openai: { perToken: 0.002, label: "40% cheaper" },
  anthropic: { perToken: 0.003, label: "40% cheaper" },
  gemini: { perToken: 0.0025, label: "45% cheaper" }
} as const;

export const UI_TEXT = {
  hero: "AI for Everyone",
  tagline: "Premium AI access at community prices",
  savings: "40% cheaper than direct APIs",
  community: "Powered by community"
} as const;

// DO NOT EDIT BELOW FROM MOBILE
export const SYSTEM_CONFIG = Object.freeze({
  maxRetries: 3,
  timeout: 30000,
  version: '5.0.0'
});
