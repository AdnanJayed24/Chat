import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcrypt';
import { prisma } from '../db';
import { env } from '../config/env';

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

const SYSTEM_PROMPT =
  'You are a friendly AI assistant embedded in a chat application. ' +
  'Keep responses concise and conversational. Use plain text only — no markdown.';

let _aiUserId: string | null = null;

export const getAiUserId = () => _aiUserId;

export const seedAiUser = async () => {
  const existing = await prisma.user.findUnique({ where: { email: env.aiUserEmail } });
  if (existing) {
    _aiUserId = existing.id;
    return;
  }
  const password = await bcrypt.hash(`ai-disabled-${Date.now()}`, 10);
  const user = await prisma.user.create({
    data: { name: 'AI Assistant', email: env.aiUserEmail, password },
  });
  _aiUserId = user.id;
};

export const streamAiResponse = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onToken: (accumulated: string) => void
): Promise<string> => {
  console.log('[AI] streamAiResponse called, messages:', messages.length);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContentStream({
    contents,
    generationConfig: { maxOutputTokens: 1024 } as object,
  });

  let accumulated = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      accumulated += text;
      onToken(accumulated);
    }
  }

  return accumulated;
};

export const summarizeMessages = async (
  messages: Array<{ senderName: string; content: string }>
): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const formatted = messages.map((m) => `${m.senderName}: ${m.content}`).join('\n');

  const result = await model.generateContent(
    `Summarize this chat conversation in 2-3 sentences. Be concise and capture the key points:\n\n${formatted}`
  );

  return result.response.text();
};
