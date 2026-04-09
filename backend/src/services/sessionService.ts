import { IMCClassification } from './imcService';

// ─── Data Models ────────────────────────────────────────────────────────────

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
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
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

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_LIMIT = 8000;
const COMPRESSION_THRESHOLD = 0.8; // 80%
const MESSAGES_TO_KEEP = 10;

// ─── In-memory store ─────────────────────────────────────────────────────────

const sessions = new Map<string, Session>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Simple token estimator: ~1 token per 4 characters.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older Node versions
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildSummaryContent(session: Session): string {
  const profile = session.profile;
  const parts: string[] = [];

  if (Object.keys(profile).length > 0) {
    parts.push(`Perfil do usuário: ${JSON.stringify(profile)}`);
  }
  if (session.mealPlan) {
    parts.push(`Plano alimentar gerado: ${session.mealPlan}`);
  }
  if (session.workoutPlan) {
    parts.push(`Plano de treino gerado: ${session.workoutPlan}`);
  }

  return `Resumo da conversa anterior: ${parts.join('. ')}`;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export function createSession(): Session {
  const session: Session = {
    id: generateId(),
    createdAt: new Date(),
    profile: {},
    profileComplete: false,
    messages: [],
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function updateSession(id: string, updates: Partial<Session>): Session {
  const session = sessions.get(id);
  if (!session) {
    throw new Error(`Session not found: ${id}`);
  }
  const updated: Session = { ...session, ...updates };
  sessions.set(id, updated);
  return updated;
}

export function addMessage(
  sessionId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>,
): Session {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  const newMessage: ChatMessage = {
    ...message,
    id: generateId(),
    timestamp: new Date(),
  };
  const updated: Session = {
    ...session,
    messages: [...session.messages, newMessage],
  };
  sessions.set(sessionId, updated);
  return updated;
}

/**
 * Returns the messages to send to the LLM, applying compression when the
 * total token count exceeds 80% of TOKEN_LIMIT (6400 tokens).
 *
 * When compression is needed:
 *  - Keep the last MESSAGES_TO_KEEP messages
 *  - Prepend a system summary message containing the full user profile + plans
 */
export function getMessagesForLLM(sessionId: string): ChatMessage[] {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const { messages } = session;
  const totalTokens = messages.reduce(
    (sum, msg) => sum + estimateTokens(msg.content),
    0,
  );

  const compressionLimit = TOKEN_LIMIT * COMPRESSION_THRESHOLD; // 6400

  if (totalTokens <= compressionLimit) {
    return messages;
  }

  // Compress: keep last N messages + prepend a summary
  const recentMessages = messages.slice(-MESSAGES_TO_KEEP);
  const summaryContent = buildSummaryContent(session);

  const summaryMessage: ChatMessage = {
    id: generateId(),
    role: 'system',
    content: summaryContent,
    timestamp: new Date(),
  };

  return [summaryMessage, ...recentMessages];
}
