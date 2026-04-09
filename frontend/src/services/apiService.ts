import type { IMCResult } from '../types';

// Custom error classes for typed error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, 'Sessão expirada. Reiniciando...');
    this.name = 'SessionExpiredError';
  }
}

export class InvalidWeightError extends ApiError {
  constructor() {
    super(422, 'Peso inválido. Por favor, confirme o valor informado (entre 20 kg e 500 kg).');
    this.name = 'InvalidWeightError';
  }
}

export class AgeTooYoungError extends ApiError {
  constructor() {
    super(403, 'Este serviço é destinado a usuários com 14 anos ou mais.');
    this.name = 'AgeTooYoungError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;

  switch (res.status) {
    case 401:
      throw new SessionExpiredError();
    case 422:
      throw new InvalidWeightError();
    case 403:
      throw new AgeTooYoungError();
    default:
      throw new ApiError(res.status, `Erro inesperado: ${res.status}`);
  }
}

export const apiService = {
  createSession: (): Promise<{ id: string }> =>
    fetch('/api/session', { method: 'POST' }).then((r) => handleResponse(r)),

  calculateIMC: (weightKg: number, heightCm: number): Promise<IMCResult> =>
    fetch('/api/imc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg, heightCm }),
    }).then((r) => handleResponse(r)),

  // Chat is handled via SSE directly in useChat
};
