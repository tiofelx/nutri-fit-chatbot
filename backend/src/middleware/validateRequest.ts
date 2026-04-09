import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = (result.error as ZodError).errors.map((e) => e.message).join(', ');
      res.status(422).json({ error: messages });
      return;
    }
    req.body = result.data;
    next();
  };
}
