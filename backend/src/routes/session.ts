import { Router } from 'express';
import { createSession, getSession } from '../services/sessionService';

const router = Router();

// POST /api/session — create a new session
router.post('/', (_req, res) => {
  const session = createSession();
  res.status(201).json({ sessionId: session.id });
});

// POST /api/session/:id/message — add a message to session (for syncing welcome message)
router.post('/:id/message', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  const { role, content } = req.body;
  if (!role || !content) {
    res.status(422).json({ error: 'role and content are required' });
    return;
  }
  addMessage(req.params.id, { role, content });
  res.status(201).json({ ok: true });
});

// GET /api/session/:id — retrieve session state
router.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json(session);
});

export default router;
