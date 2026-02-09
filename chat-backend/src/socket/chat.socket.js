const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch {
      next(new Error("Auth error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.id);

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
    });

    socket.on("send_message", async ({ chatId, content }) => {
      const message = await prisma.message.create({
        data: {
          chatId,
          content,
          senderId: socket.user.id
        }
      });

      io.to(chatId).emit("receive_message", message);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
