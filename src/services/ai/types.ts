export type AIProvider = 'openai' | 'gemini';

export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini';
export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.0-pro' | 'gemini-2.5-flash';
export type AIModel = OpenAIModel | GeminiModel;

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: AIModel;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  portionSize: string;
  confidence: number;
}

export interface WorkoutGenerationParams {
  targetMuscles: string[];
  equipment: string[];
  timeLimitMinutes: number;
  goal: string;
  experienceLevel: string;
}

export interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface GeneratedWorkout {
  name: string;
  category: string;
  targetMuscles: string[];
  exercises: GeneratedExercise[];
}

export interface SupplementRecommendation {
  name: string;
  dosage: string;
  timing: string;
  reasoning: string;
}

export interface LabValue {
  name: string;
  value: number;
  unit: string;
  referenceRange?: string;
}

export interface LabAnalysisResult {
  summary: string;
  flags: Array<{ name: string; status: 'normal' | 'low' | 'high' | 'critical'; note: string }>;
  recommendations: string[];
}

export interface AIProviderInterface {
  chat(messages: ChatMessage[], jsonMode?: boolean): Promise<string>;
  chatWithImage(messages: ChatMessage[], imageBase64: string, mimeType: string, jsonMode?: boolean): Promise<string>;
  testConnection(): Promise<boolean>;
}
