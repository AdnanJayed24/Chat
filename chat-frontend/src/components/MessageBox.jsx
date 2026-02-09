import { useState } from "react";

export default function MessageBox({ chat, messages, send }) {
  const [text, setText] = useState("");

  if (!chat) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
          <div className="text-lg font-semibold">Select a chat</div>
          <div className="mt-1 text-sm text-slate-500">
            Choose a conversation from the left.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="text-sm text-slate-500">Chat</div>
        <div className="text-lg font-semibold">
          {chat.id.slice(0, 8)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            No messages yet.
          </div>
        )}
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className="max-w-[70%] rounded-lg bg-white px-3 py-2 shadow-sm">
              <div className="text-sm text-slate-800">{m.content}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
          />
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => {
              const trimmed = text.trim();
              if (!trimmed) return;
              send(trimmed);
              setText("");
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
