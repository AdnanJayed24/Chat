export interface User {
  id: string;
  name: string;
  email: string;
}

export interface MessageRead {
  userId: string;
  readAt: string;
}

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface Message {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  sender: { id: string; name: string };
  createdAt: string;
  reads: MessageRead[];
  reactions: Reaction[];
}

export interface Chat {
  id: string;
  isGroup: boolean;
  name?: string;
  members: Array<{ user: User }>;
  messages: Message[];
  updatedAt: string;
  unreadCount?: number;
}
