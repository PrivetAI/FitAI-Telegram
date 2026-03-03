import { createOpenAIProvider } from './openai';
import { createGeminiProvider } from './gemini';
import type {
  AIConfig, AIProviderInterface, ChatMessage,
  FoodAnalysisResult, WorkoutGenerationParams, GeneratedWorkout,
  SupplementRecommendation, LabValue, LabAnalysisResult,
} from './types';
import {
  FOOD_ANALYSIS_PROMPT, WORKOUT_GENERATION_PROMPT,
  nutritionCoachSystem, trainingCoachSystem,
  supplementRecommendationPrompt, labAnalysisPrompt,
} from './prompts';

export type { ChatMessage } from './types';
export type { FoodAnalysisResult, GeneratedWorkout, SupplementRecommendation, LabValue, LabAnalysisResult } from './types';

function getProvider(config: AIConfig): AIProviderInterface {
  if (config.provider === 'openai') {
    return createOpenAIProvider(config.apiKey, config.model as 'gpt-4o' | 'gpt-4o-mini');
  }
  return createGeminiProvider(config.apiKey, config.model as 'gemini-2.0-flash' | 'gemini-2.0-pro' | 'gemini-2.5-flash');
}

function getConfig(): AIConfig {
  const provider = (localStorage.getItem('fitai-ai-provider') || 'openai') as AIConfig['provider'];
  const apiKey = localStorage.getItem(`fitai-ai-key-${provider}`) || '';
  const model = localStorage.getItem(`fitai-ai-model-${provider}`) || (provider === 'openai' ? 'gpt-4o' : 'gemini-2.0-flash');
  return { provider, apiKey, model: model as AIConfig['model'] };
}

function ensureConfigured(): AIConfig {
  const config = getConfig();
  if (!config.apiKey) {
    throw new Error('API key not configured. Go to Profile > AI Settings to set up your API key.');
  }
  return config;
}

export async function testConnection(): Promise<boolean> {
  const config = ensureConfigured();
  return getProvider(config).testConnection();
}

export async function analyzeFoodPhoto(imageBase64: string, mimeType: string): Promise<FoodAnalysisResult> {
  const config = ensureConfigured();
  const provider = getProvider(config);
  const raw = await provider.chatWithImage(
    [{ role: 'user', content: FOOD_ANALYSIS_PROMPT }],
    imageBase64, mimeType, true
  );
  return JSON.parse(raw) as FoodAnalysisResult;
}

export async function generateWorkout(params: WorkoutGenerationParams): Promise<GeneratedWorkout> {
  const config = ensureConfigured();
  const provider = getProvider(config);
  const userMsg = `Generate a workout with these parameters:
- Target muscles: ${params.targetMuscles.join(', ')}
- Available equipment: ${params.equipment.join(', ')}
- Time limit: ${params.timeLimitMinutes} minutes
- Goal: ${params.goal}
- Experience level: ${params.experienceLevel}`;

  const raw = await provider.chat([
    { role: 'system', content: WORKOUT_GENERATION_PROMPT },
    { role: 'user', content: userMsg },
  ], true);
  return JSON.parse(raw) as GeneratedWorkout;
}

export async function nutritionChat(
  messages: ChatMessage[],
  profile: { tdee: number; targetCalories: number; macros: { protein: number; fat: number; carbs: number }; goal: string; weight: number },
  todayTotals: { calories: number; protein: number; fat: number; carbs: number }
): Promise<string> {
  const config = ensureConfigured();
  const provider = getProvider(config);
  const systemMsg = nutritionCoachSystem(profile, todayTotals);
  return provider.chat([{ role: 'system', content: systemMsg }, ...messages]);
}

export async function trainingChat(
  messages: ChatMessage[],
  profile: { experienceLevel: string; goal: string; weight: number },
  recentWorkouts: Array<{ name: string; date: string; durationMinutes?: number }>
): Promise<string> {
  const config = ensureConfigured();
  const provider = getProvider(config);
  const systemMsg = trainingCoachSystem(profile, recentWorkouts);
  return provider.chat([{ role: 'system', content: systemMsg }, ...messages]);
}

export async function getSupplementRecommendations(
  goal: string, currentSupplements: string[], labData?: string
): Promise<SupplementRecommendation[]> {
  const config = ensureConfigured();
  const provider = getProvider(config);
  const raw = await provider.chat([
    { role: 'user', content: supplementRecommendationPrompt(goal, currentSupplements, labData) },
  ], true);
  const parsed = JSON.parse(raw);
  return parsed.recommendations as SupplementRecommendation[];
}

export async function analyzeLabResults(labValues: LabValue[]): Promise<LabAnalysisResult> {
  const config = ensureConfigured();
  const provider = getProvider(config);
  const raw = await provider.chat([
    { role: 'user', content: labAnalysisPrompt(labValues) },
  ], true);
  return JSON.parse(raw) as LabAnalysisResult;
}

export function isConfigured(): boolean {
  const config = getConfig();
  return !!config.apiKey;
}

export { getConfig };
