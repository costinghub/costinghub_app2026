export interface AIProviderConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  geminiKey: string;
  geminiModel: string;
  openaiKey: string;
  openaiModel: string;
  anthropicKey: string;
  anthropicModel: string;
}

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  provider: 'gemini',
  geminiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  anthropicKey: '',
  anthropicModel: 'claude-3-5-sonnet-latest',
};

export const getAIConfig = (): AIProviderConfig => {
  try {
    const saved = localStorage.getItem('costinghub_ai_config');
    const parsed = saved ? JSON.parse(saved) : {};
    
    // Check if there is a logged in user with keys synced from Supabase
    const userStr = localStorage.getItem('costinghub_current_user');
    const userKeys: Partial<AIProviderConfig> = {};
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.gemini_api_key) userKeys.geminiKey = user.gemini_api_key;
        if (user.claude_api_key) userKeys.anthropicKey = user.claude_api_key;
        if (user.openai_api_key) userKeys.openaiKey = user.openai_api_key;
      } catch (innerErr) {
        console.error('Failed to parse current user keys:', innerErr);
      }
    }

    return { ...DEFAULT_AI_CONFIG, ...userKeys, ...parsed };
  } catch (e) {
    console.error('Failed to parse AI config:', e);
  }
  return DEFAULT_AI_CONFIG;
};

export const saveAIConfig = (config: AIProviderConfig) => {
  localStorage.setItem('costinghub_ai_config', JSON.stringify(config));
};

export const hasAnyAIKey = (config: AIProviderConfig): boolean => {
  if (config.provider === 'gemini' && config.geminiKey) return true;
  if (config.provider === 'openai' && config.openaiKey) return true;
  if (config.provider === 'anthropic' && config.anthropicKey) return true;
  return false;
};
