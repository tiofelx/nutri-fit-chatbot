import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';

import chatRouter from './routes/chat';
import imcRouter from './routes/imc';
import sessionRouter from './routes/session';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/chat', chatRouter);
app.use('/api/imc', imcRouter);
app.use('/api/session', sessionRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export default app;
