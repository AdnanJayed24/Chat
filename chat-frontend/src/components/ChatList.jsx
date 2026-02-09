import { useState } from "react";

export default function ChatList({ chats, openChat, createChat }) {
  const [identifier, setIdentifier] = useState("");

  return (
    <div className="flex h-full w-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-lg font-semibold">Chats</h3>
        <p className="text-xs text-slate-500">Create or open a conversation</p>
      </div>
      <div className="p-4">
        <input
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400"
          placeholder="User email or ID"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <button
          className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => {
            const trimmed = identifier.trim();
            if (!trimmed) return;
            createChat(trimmed);
            setIdentifier("");
          }}
        >
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {chats.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            No chats yet
          </div>
        )}
        <div className="space-y-2">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => openChat(chat)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              <div className="font-medium text-slate-900">
                Chat {chat.id.slice(0, 8)}
              </div>
              <div className="text-xs text-slate-500">Click to open</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
