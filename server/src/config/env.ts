import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

export const env = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  frontendOrigins: (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173').split(','),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  geminiApiKey: required('GEMINI_API_KEY'),
  aiUserEmail: process.env.AI_USER_EMAIL ?? 'ai@chatapp.internal',
};
