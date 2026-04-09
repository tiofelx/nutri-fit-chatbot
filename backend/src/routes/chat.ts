import { Router } from 'express';
import { z } from 'zod';
import { addMessage, getSession } from '../services/sessionService';
import { streamChatResponse } from '../services/llmService';
import { validateBody } from '../middleware/validateRequest';

const router = Router();

const ChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

router.post('/', validateBody(ChatRequestSchema), async (req, res, next) => {
  const { sessionId, message } = req.body as z.infer<typeof ChatRequestSchema>;

  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  // Add user message to session
  const updatedSession = addMessage(sessionId, { role: 'user', content: message });

  try {
    await streamChatResponse(updatedSession, res);
  } catch (err) {
    next(err);
  }
});

export default router;
