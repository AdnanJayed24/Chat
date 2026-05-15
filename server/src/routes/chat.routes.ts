import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as chat from '../controllers/chat.controller';

const router = Router();
router.use(authenticate);
router.post('/', chat.createOrGetChat);
router.get('/', chat.getUserChats);
router.post('/ai', chat.getAiChat);
router.get('/:chatId/messages', chat.getChatMessages);
router.post('/:chatId/summarize', chat.summarizeChat);
export default router;
