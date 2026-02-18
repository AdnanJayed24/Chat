import { io } from "socket.io-client";

const trimTrailingSlash = (value = "") => value.replace(/\/$/, "");

const configuredSocketUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL || "");
const inferredProdSocketUrl =
  typeof window !== "undefined" ? window.location.origin : "";

const socketUrl = configuredSocketUrl ||
  (import.meta.env.DEV ? "http://localhost:5000" : inferredProdSocketUrl);

const socket = io(socketUrl, {
  autoConnect: false,
});

export default socket;
