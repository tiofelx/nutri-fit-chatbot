import OpenAI from 'openai';
import type { Response } from 'express';
import { buildSystemPrompt } from '../prompts/promptBuilder';
import { addMessage, getMessagesForLLM, Session } from './sessionService';

// ─── NVIDIA NIM client (OpenAI-compatible) ────────────────────────────────────

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY ?? '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_NAME = 'meta/llama-3.1-8b-instruct';
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 2_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMessages(session: Session) {
  const systemPrompt = buildSystemPrompt(session.profile);
  const history = getMessagesForLLM(session.id);

  return [
    { role: 'system' as const, content: systemPrompt },
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];
}

async function attemptStream(session: Session, res: Response): Promise<string> {
  const messages = buildMessages(session);

  const streamPromise = client.chat.completions.create({
    model: MODEL_NAME,
    messages,
    stream: true,
    max_tokens: 1024,
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS),
  );

  const stream = await Promise.race([streamPromise, timeoutPromise]);

  let fullResponse = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      fullResponse += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }
  return fullResponse;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function streamChatResponse(
  session: Session,
  res: Response,
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const fullResponse = await attemptStream(session, res);

      // Save assistant response to session history so it's included in future context
      if (fullResponse) {
        addMessage(session.id, { role: 'assistant', content: fullResponse });
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[llmService] Attempt ${attempt + 1} failed:`, error.message);

      if (error.message === 'timeout') {
        res.write(`data: ${JSON.stringify({ error: 'timeout' })}\n\n`);
        res.end();
        return;
      }

      await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt));
    }
  }

  res.write(`data: ${JSON.stringify({ error: 'llm_unavailable' })}\n\n`);
  res.end();
}
