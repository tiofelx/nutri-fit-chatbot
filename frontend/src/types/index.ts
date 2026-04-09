export type IMCClassification =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obesity_grade_1'
  | 'obesity_grade_2'
  | 'obesity_grade_3';

export interface UserProfile {
  objective: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'conditioning';
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'male' | 'female' | 'other';
  imc: number;
  imcClassification: IMCClassification;
  dietaryRestrictions: string[];
  healthConditions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface IMCResult {
  imc: number;
  classification: IMCClassification;
  label: string;
  range: string;
}

export interface Session {
  id: string;
  createdAt: Date;
  profile: Partial<UserProfile>;
  profileComplete: boolean;
  messages: ChatMessage[];
  summaryMessages?: ChatMessage[];
  mealPlan?: string;
  workoutPlan?: string;
}
