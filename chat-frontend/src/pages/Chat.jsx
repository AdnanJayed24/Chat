import { useContext, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import socket from "../socket/socket";
import ChatList from "../components/ChatList";
import MessageBox from "../components/MessageBox";
import { AuthContext } from "../context/auth-context";

export default function Chat() {
  const { logout } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const activeChatRef = useRef(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    api.get("/chat").then(res => setChats(res.data));
  }, []);

  useEffect(() => {
    socket.auth = { token: localStorage.getItem("token") };
    socket.connect();

    socket.on("receive_message", (msg) => {
      const current = activeChatRef.current;
      if (!current || msg.chatId !== current.id) return;
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, []);

  const openChat = async (chat) => {
    setActiveChat(chat);
    setMessages([]);
    socket.emit("join_chat", chat.id);
    try {
      const res = await api.get(`/chat/${chat.id}/messages`);
      setMessages(res.data);
    } catch {
      setMessages([]);
    }
  };

  const createChat = async (identifier) => {
    try {
      const isEmail = identifier.includes("@");
      const payload = isEmail ? { email: identifier } : { userId: identifier };
      const res = await api.post("/chat", payload);
      setChats((prev) => [res.data, ...prev]);
    } catch {
      // ignore for now
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto min-h-screen max-w-6xl border-x border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <div className="text-xs text-slate-500">Chat App</div>
            <div className="text-lg font-semibold text-slate-900">Inbox</div>
          </div>
          <button
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={logout}
          >
            Logout
          </button>
        </div>
        <div className="flex min-h-[calc(100vh-64px)] gap-0">
        <div className="w-full max-w-sm">
          <ChatList chats={chats} openChat={openChat} createChat={createChat} />
        </div>
        <div className="flex-1">
          <MessageBox
            chat={activeChat}
            messages={messages}
            send={(content) => {
              if (!activeChat) return;
              socket.emit("send_message", {
                chatId: activeChat.id,
                content
              });
            }}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
