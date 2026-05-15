import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { env } from './config/env';
import { setupSocket } from './socket/handlers';
import { seedAiUser } from './services/ai.service';
import { prisma } from './db';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: env.frontendOrigins, credentials: true },
});

setupSocket(io);

const start = async () => {
  await seedAiUser();
  httpServer.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port} [Gemini build]`);
  });
};

start().catch(console.error);

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
