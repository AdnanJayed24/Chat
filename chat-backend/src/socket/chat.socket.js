const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Auth error"));

      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      return next();
    } catch {
      return next(new Error("Auth error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.id);

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
    });

    socket.on("send_message", async ({ chatId, content }) => {
      try {
        if (!chatId || !content?.trim()) return;

        const chat = await prisma.chat.findFirst({
          where: {
            id: chatId,
            members: { some: { userId: socket.user.id } }
          },
          select: { id: true }
        });

        if (!chat) return;

        const message = await prisma.message.create({
          data: {
            chatId,
            content: content.trim(),
            senderId: socket.user.id
          }
        });

        io.to(chatId).emit("receive_message", message);
      } catch (err) {
        socket.emit("chat_error", { message: "Failed to send message" });
        console.error("send_message error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });
  });
};
