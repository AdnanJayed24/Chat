import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) throw new Error('Socket not initialized');
  return socket;
};

export const initSocket = (token: string): Socket => {
  if (socket?.connected) socket.disconnect();

  socket = io(import.meta.env.VITE_SOCKET_URL ?? '', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
