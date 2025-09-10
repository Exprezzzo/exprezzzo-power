// Feature flags for progressive rollout
export const FEATURES = {
  // Voice features
  voice: process.env.NEXT_PUBLIC_ENABLE_VOICE === 'true',
  whisper: process.env.NEXT_PUBLIC_ENABLE_WHISPER === 'true',
  elevenlabs: process.env.NEXT_PUBLIC_ENABLE_ELEVENLABS === 'true',
  realtime: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
  
  // Other features
  auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
  payments: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
  admin: process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
  consensus: process.env.NEXT_PUBLIC_ENABLE_CONSENSUS === 'true',
  artifacts: process.env.NEXT_PUBLIC_ENABLE_ARTIFACTS === 'true',
  
  // Experimental
  experimental: process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL === 'true'
};

// Voice configuration
export const VOICE_CONFIG = {
  providers: {
    whisper: {
      enabled: FEATURES.whisper,
      models: ['whisper-1'],
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
    },
    openai: {
      enabled: true,
      voices: ['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'],
      defaultVoice: 'nova'
    },
    elevenlabs: {
      enabled: FEATURES.elevenlabs,
      voices: ['rachel', 'adam', 'antoni', 'arnold', 'bella', 'domi', 'elli'],
      defaultVoice: 'rachel'
    }
  },
  maxRecordingTime: 300, // 5 minutes
  maxTranscriptLength: 4000,
  autoPlayResponses: false
};