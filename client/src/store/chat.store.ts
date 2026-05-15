import { create } from 'zustand';
import type { Chat, Message, Reaction } from '../types';

interface TypingUser {
  userId: string;
  userName: string;
}

interface ChatStore {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  onlineUsers: Set<string>;
  typingUsers: Map<string, TypingUser[]>;
  streamingMessage: { chatId: string; content: string } | null;
  setChats: (chats: Chat[]) => void;
  addOrUpdateChat: (chat: Chat) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageReads: (messageIds: string[], userId: string) => void;
  updateMessageReactions: (messageId: string, reactions: Reaction[]) => void;
  setStreamingMessage: (msg: { chatId: string; content: string } | null) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setTyping: (chatId: string, user: TypingUser) => void;
  clearTyping: (chatId: string, userId: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: new Set(),
  typingUsers: new Map(),
  streamingMessage: null,

  setChats: (chats) => set({ chats }),

  addOrUpdateChat: (chat) =>
    set((state) => {
      const idx = state.chats.findIndex((c) => c.id === chat.id);
      if (idx === -1) return { chats: [chat, ...state.chats] };
      const updated = [...state.chats];
      updated[idx] = chat;
      return { chats: updated };
    }),

  setActiveChat: (chat) =>
    set((state) => ({
      activeChat: chat,
      chats: chat
        ? state.chats.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
        : state.chats,
    })),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) return state;

      const isActive = state.activeChat?.id === message.chatId;
      const chats = state.chats
        .map((c) =>
          c.id === message.chatId
            ? {
                ...c,
                messages: [message],
                updatedAt: message.createdAt,
                unreadCount: isActive ? 0 : (c.unreadCount ?? 0) + 1,
              }
            : c
        )
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      const messages = isActive ? [...state.messages, message] : state.messages;

      return { messages, chats };
    }),

  updateMessageReads: (messageIds, userId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        messageIds.includes(m.id) && !m.reads.some((r) => r.userId === userId)
          ? { ...m, reads: [...m.reads, { userId, readAt: new Date().toISOString() }] }
          : m
      ),
    })),

  updateMessageReactions: (messageId, reactions) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, reactions } : m
      ),
    })),

  setStreamingMessage: (msg) => set({ streamingMessage: msg }),

  setUserOnline: (userId) =>
    set((s) => ({ onlineUsers: new Set([...s.onlineUsers, userId]) })),

  setUserOffline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  setTyping: (chatId, user) =>
    set((s) => {
      const map = new Map(s.typingUsers);
      const list = map.get(chatId) ?? [];
      if (!list.some((u) => u.userId === user.userId)) {
        map.set(chatId, [...list, user]);
      }
      return { typingUsers: map };
    }),

  clearTyping: (chatId, userId) =>
    set((s) => {
      const map = new Map(s.typingUsers);
      map.set(chatId, (map.get(chatId) ?? []).filter((u) => u.userId !== userId));
      return { typingUsers: map };
    }),

  reset: () =>
    set({ chats: [], activeChat: null, messages: [], onlineUsers: new Set(), typingUsers: new Map(), streamingMessage: null }),
}));
