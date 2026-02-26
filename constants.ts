
// Configuration for Google Gemini Models

export const MODEL_NAMES = {
  // Basic Text Tasks (summarization, Q&A)
  FLASH: 'gemini-3-flash-preview',
  // Complex Text Tasks (reasoning, coding)
  PRO: 'gemini-3-pro-preview',
  // Image Generation
  IMAGE_GEN: 'gemini-2.5-flash-image',
  // High-Quality Image Generation
  IMAGE_GEN_PRO: 'gemini-3-pro-image-preview',
} as const;

export const APP_CONFIG = {
  appName: 'Sermon-AI비서',
  maxOutputTokens: 1024,
};

// Admin
export const ADMIN_EMAIL = 'issacma70@gmail.com';
