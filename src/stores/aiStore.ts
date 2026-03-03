import { create } from 'zustand';
import type { AIProvider, AIModel } from '../services/ai/types';

interface AIState {
  provider: AIProvider;
  model: AIModel;
  setProvider: (p: AIProvider) => void;
  setModel: (m: AIModel) => void;
  getApiKey: () => string;
  setApiKey: (key: string) => void;
  isConfigured: () => boolean;
}

function loadProvider(): AIProvider {
  return (localStorage.getItem('fitai-ai-provider') as AIProvider) || 'openai';
}

function loadModel(provider: AIProvider): AIModel {
  return (localStorage.getItem(`fitai-ai-model-${provider}`) as AIModel) || (provider === 'openai' ? 'gpt-4o' : 'gemini-2.0-flash');
}

export const useAIStore = create<AIState>()((set, get) => ({
  provider: loadProvider(),
  model: loadModel(loadProvider()),

  setProvider: (p) => {
    localStorage.setItem('fitai-ai-provider', p);
    const model = loadModel(p);
    set({ provider: p, model });
  },

  setModel: (m) => {
    const p = get().provider;
    localStorage.setItem(`fitai-ai-model-${p}`, m);
    set({ model: m });
  },

  getApiKey: () => {
    const p = get().provider;
    return localStorage.getItem(`fitai-ai-key-${p}`) || '';
  },

  setApiKey: (key) => {
    const p = get().provider;
    localStorage.setItem(`fitai-ai-key-${p}`, key);
  },

  isConfigured: () => {
    const p = get().provider;
    return !!(localStorage.getItem(`fitai-ai-key-${p}`));
  },
}));
