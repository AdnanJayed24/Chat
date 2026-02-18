require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const chatSocket = require("./socket/chat.socket");

const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_ORIGINS ||
  "https://chat-2iuj.vercel.app,http://localhost:5173,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

chatSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
