"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { id: makeId(), role: "user", content: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/mcc/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();
      const replyText = res.ok
        ? String(data.reply ?? "")
        : String(data.error ?? "Fehler bei der Anfrage.");

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: replyText || "(Leere Antwort erhalten)",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: "Gateway nicht erreichbar. Bitte pruefe, ob OpenClaw laeuft.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-120px)] glass-card flex flex-col overflow-hidden animate-in">
      <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
            <Bot className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">Chat mit Wanda</h1>
            <p className="text-[10px] text-zinc-500">openclaw:wanda</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-emerald-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          online
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-zinc-500">
              <Bot className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p className="text-sm">Starte eine Unterhaltung mit Wanda</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message, i) => {
            const isUser = message.role === "user";
            return (
              <div key={`key-${i}-${message.id}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[85%] items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      isUser ? "bg-violet-500/20" : "bg-zinc-800"
                    }`}
                  >
                    {isUser ? (
                      <User className="h-3.5 w-3.5 text-violet-300" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? "rounded-br-md border border-violet-500/30 bg-violet-500/15 text-zinc-100"
                        : "rounded-bl-md border border-zinc-800/70 bg-zinc-800/60 text-zinc-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="border-t border-zinc-800/60 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht an Wanda..."
            className="h-10 flex-1 bg-transparent px-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex h-10 items-center gap-1 rounded-lg bg-violet-500 px-4 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Senden
          </button>
        </div>
      </form>
    </div>
  );
}
