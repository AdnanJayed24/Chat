const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createChat = async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ message: "userId or email is required" });
    }

    if (userId && userId === req.user.id) {
      return res.status(400).json({ message: "Cannot create chat with yourself" });
    }

    const otherUser = await prisma.user.findUnique({
      where: userId ? { id: userId } : { email }
    });

    if (!otherUser) {
      return res.status(400).json({ message: "User not found" });
    }

    if (otherUser.id === req.user.id) {
      return res.status(400).json({ message: "Cannot create chat with yourself" });
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        members: { some: { userId: req.user.id } },
        AND: [{ members: { some: { userId: otherUser.id } } }]
      }
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    const chat = await prisma.chat.create({
      data: {
        members: {
          create: [
            { userId: req.user.id },
            { userId: otherUser.id }
          ]
        }
      }
    });

    return res.json(chat);
  } catch {
    return res.status(500).json({ message: "Failed to create chat" });
  }
};

exports.getChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        members: { some: { userId: req.user.id } }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json(chats);
  } catch {
    return res.status(500).json({ message: "Failed to load chats" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        chat: { members: { some: { userId: req.user.id } } }
      },
      orderBy: { createdAt: "asc" }
    });

    return res.json(messages);
  } catch {
    return res.status(500).json({ message: "Failed to load messages" });
  }
};
