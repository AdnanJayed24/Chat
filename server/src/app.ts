import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { ApiError } from './utils/ApiError';

const app = express();

app.use(cors({ origin: env.frontendOrigins, credentials: true }));
app.use(express.json());

app.use('/api', routes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
