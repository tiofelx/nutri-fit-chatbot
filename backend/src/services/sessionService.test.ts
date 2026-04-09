import {
  createSession,
  getSession,
  updateSession,
  addMessage,
  getMessagesForLLM,
  estimateTokens,
  Session,
  ChatMessage,
} from './sessionService';

// ─── estimateTokens ───────────────────────────────────────────────────────────

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates ~1 token per 4 chars', () => {
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcde')).toBe(2); // ceil(5/4)
    expect(estimateTokens('a'.repeat(100))).toBe(25);
  });
});

// ─── createSession ────────────────────────────────────────────────────────────

describe('createSession', () => {
  it('creates a session with a unique id', () => {
    const s1 = createSession();
    const s2 = createSession();
    expect(s1.id).toBeTruthy();
    expect(s2.id).toBeTruthy();
    expect(s1.id).not.toBe(s2.id);
  });

  it('initialises with empty profile and messages', () => {
    const session = createSession();
    expect(session.profile).toEqual({});
    expect(session.profileComplete).toBe(false);
    expect(session.messages).toEqual([]);
  });

  it('sets createdAt to a recent date', () => {
    const before = new Date();
    const session = createSession();
    const after = new Date();
    expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(session.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

// ─── getSession ───────────────────────────────────────────────────────────────

describe('getSession', () => {
  it('returns the session by id', () => {
    const session = createSession();
    expect(getSession(session.id)).toEqual(session);
  });

  it('returns undefined for unknown id', () => {
    expect(getSession('non-existent-id')).toBeUndefined();
  });
});

// ─── updateSession ────────────────────────────────────────────────────────────

describe('updateSession', () => {
  it('updates fields on the session', () => {
    const session = createSession();
    const updated = updateSession(session.id, { profileComplete: true });
    expect(updated.profileComplete).toBe(true);
    expect(getSession(session.id)?.profileComplete).toBe(true);
  });

  it('merges partial profile updates', () => {
    const session = createSession();
    updateSession(session.id, { profile: { age: 30 } });
    const result = getSession(session.id);
    expect(result?.profile.age).toBe(30);
  });

  it('throws for unknown session id', () => {
    expect(() => updateSession('bad-id', {})).toThrow('Session not found: bad-id');
  });
});

// ─── addMessage ───────────────────────────────────────────────────────────────

describe('addMessage', () => {
  it('appends a message with generated id and timestamp', () => {
    const session = createSession();
    const updated = addMessage(session.id, { role: 'user', content: 'Hello' });
    expect(updated.messages).toHaveLength(1);
    const msg = updated.messages[0];
    expect(msg.id).toBeTruthy();
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('Hello');
    expect(msg.timestamp).toBeInstanceOf(Date);
  });

  it('appends multiple messages in order', () => {
    const session = createSession();
    addMessage(session.id, { role: 'user', content: 'First' });
    addMessage(session.id, { role: 'assistant', content: 'Second' });
    const result = getSession(session.id)!;
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe('First');
    expect(result.messages[1].content).toBe('Second');
  });

  it('throws for unknown session id', () => {
    expect(() =>
      addMessage('bad-id', { role: 'user', content: 'Hi' }),
    ).toThrow('Session not found: bad-id');
  });
});

// ─── getMessagesForLLM ────────────────────────────────────────────────────────

describe('getMessagesForLLM', () => {
  it('returns all messages when below compression threshold', () => {
    const session = createSession();
    addMessage(session.id, { role: 'user', content: 'Hello' });
    addMessage(session.id, { role: 'assistant', content: 'Hi there' });
    const msgs = getMessagesForLLM(session.id);
    expect(msgs).toHaveLength(2);
  });

  it('throws for unknown session id', () => {
    expect(() => getMessagesForLLM('bad-id')).toThrow('Session not found: bad-id');
  });

  it('compresses when total tokens exceed 80% of 8000 (6400)', () => {
    const session = createSession();

    // Each message ~400 chars → ~100 tokens. 70 messages = 7000 tokens > 6400
    const longContent = 'a'.repeat(400);
    for (let i = 0; i < 70; i++) {
      addMessage(session.id, { role: 'user', content: longContent });
    }

    const msgs = getMessagesForLLM(session.id);

    // Should have: 1 summary + 10 recent messages
    expect(msgs).toHaveLength(11);
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toContain('Resumo da conversa anterior');
  });

  it('compressed result keeps the last 10 messages in order', () => {
    const session = createSession();
    const longContent = 'a'.repeat(400);

    for (let i = 0; i < 70; i++) {
      addMessage(session.id, { role: 'user', content: `msg-${i}-${longContent}` });
    }

    const msgs = getMessagesForLLM(session.id);
    // msgs[0] is the summary; msgs[1..10] are the last 10 original messages
    const recent = msgs.slice(1);
    expect(recent).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(recent[i].content).toContain(`msg-${60 + i}-`);
    }
  });

  it('summary includes profile data when present', () => {
    const session = createSession();
    updateSession(session.id, {
      profile: { age: 25, objective: 'weight_loss' },
      mealPlan: 'Café da manhã: ovos',
    });

    const longContent = 'a'.repeat(400);
    for (let i = 0; i < 70; i++) {
      addMessage(session.id, { role: 'user', content: longContent });
    }

    const msgs = getMessagesForLLM(session.id);
    expect(msgs[0].content).toContain('Perfil do usuário');
    expect(msgs[0].content).toContain('Plano alimentar gerado');
  });
});
