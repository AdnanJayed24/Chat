const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createChat = async (req, res) => {
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

  res.json(chat);
};

exports.getChats = async (req, res) => {
  const chats = await prisma.chat.findMany({
    where: {
      members: { some: { userId: req.user.id } }
    }
  });
  res.json(chats);
};

exports.getMessages = async (req, res) => {
  const { chatId } = req.params;

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      chat: { members: { some: { userId: req.user.id } } }
    },
    orderBy: { createdAt: "asc" }
  });

  res.json(messages);
};
