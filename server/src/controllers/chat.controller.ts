import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service';
import { summarizeMessages } from '../services/ai.service';

export const createOrGetChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail) return res.status(400).json({ message: 'targetEmail is required' });
    const chat = await chatService.getOrCreateDirectChat(req.userId, targetEmail);
    res.json(chat);
  } catch (err) {
    next(err);
  }
};

export const getUserChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chats = await chatService.getUserChats(req.userId);
    res.json(chats);
  } catch (err) {
    next(err);
  }
};

export const getChatMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
    const messages = await chatService.getChatMessages(chatId, req.userId);
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

export const getAiChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chat = await chatService.getOrCreateAiChat(req.userId);
    res.json(chat);
  } catch (err) {
    next(err);
  }
};

export const summarizeChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
    const messages = await chatService.getMessagesForSummary(chatId, req.userId);
    if (messages.length < 2) {
      return res.json({ summary: 'Not enough messages to summarize yet.' });
    }
    const summary = await summarizeMessages(messages);
    res.json({ summary });
  } catch (err) {
    next(err);
  }
};
