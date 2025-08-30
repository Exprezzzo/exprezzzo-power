/**
 * Feature Flags Configuration
 * 🚀 = Active features for EXPREZZZ POWER launch
 * 🏠 = Prep features for EXPRESSO LLM HOUSE integration
 */

export const FEATURES = {
  // 🚀 Launch Now Features (can be enabled today)
  voice: process.env.NEXT_PUBLIC_ENABLE_VOICE === 'true',
  cohere: process.env.NEXT_PUBLIC_ENABLE_COHERE === 'true',
  replicate: process.env.NEXT_PUBLIC_ENABLE_REPLICATE === 'true',
  costTracking: process.env.NEXT_PUBLIC_ENABLE_COST_TRACKING !== 'false',
  experimentalUI: process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL_UI === 'true',
  
  // 🏠 House Prep Features (for tomorrow's sovereign integration)
  sovereign: process.env.NEXT_PUBLIC_ENABLE_SOVEREIGN === 'true',
  localFirst: process.env.NEXT_PUBLIC_ENABLE_LOCAL_FIRST === 'true',
  houseIntegration: process.env.NEXT_PUBLIC_ENABLE_HOUSE === 'true',
  kaniModel: process.env.NEXT_PUBLIC_ENABLE_KANI === 'true',
  sovereignDashboard: process.env.NEXT_PUBLIC_ENABLE_SOVEREIGN_DASHBOARD === 'true',
};

export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] || false;
}

export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
}

// 🏠 House Prep: Check if running in sovereign mode
export function isSovereignMode(): boolean {
  return FEATURES.sovereign && FEATURES.localFirst;
}

// 🏠 House Prep: Get sovereign configuration
export function getSovereignConfig() {
  if (!isSovereignMode()) return null;
  
  return {
    endpoint: process.env.NEXT_PUBLIC_HOUSE_ENDPOINT || 'http://localhost:7860',
    model: process.env.NEXT_PUBLIC_HOUSE_MODEL || 'kani',
    maxTokens: parseInt(process.env.NEXT_PUBLIC_HOUSE_MAX_TOKENS || '2048'),
    temperature: parseFloat(process.env.NEXT_PUBLIC_HOUSE_TEMPERATURE || '0.7'),
  };
}