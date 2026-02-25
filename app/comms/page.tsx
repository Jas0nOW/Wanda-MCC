"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Bot, User, Calendar, Filter, ChevronDown, ArrowDown } from "lucide-react";
import { VoicePlayer } from "@/components/mcc/voice-player";
import { Badge } from "@/components/ui/badge";

type Session = {
  id: string;
  agent?: string;
  created_at?: string;
  updatedAt?: string;
  messageCount?: number;
};

type Message = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  created_at?: string;
};

const AGENT_IDS = [
  "wanda", "cto", "coo", "cfo", "cmo", "cso",
  "builder", "reviewer", "scout", "customer-success",
  "accountant", "copywriter", "sdr", "closer", "partner",
];

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const time = message.timestamp ?? message.created_at;

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-zinc-800/60 px-3 py-1 text-[10px] text-zinc-500">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-violet-500/15" : "bg-zinc-800"}`}>
        {isUser ? <User className="h-3.5 w-3.5 text-violet-400" /> : <Bot className="h-3.5 w-3.5 text-zinc-400" />}
      </div>
      <div className={`group max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-4 py-2.5 ${
          isUser
            ? "rounded-br-md bg-violet-500/15 border border-violet-500/20 text-zinc-200"
            : "rounded-bl-md bg-zinc-800/60 border border-zinc-800/40 text-zinc-300"
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`mt-1 flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
          {time && (
            <span className="text-[10px] text-zinc-600">
              {new Date(time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {!isUser && message.content.length > 20 && (
            <VoicePlayer text={message.content} />
          )}
        </div>
      </div>
    </div>
  );
}

function CommsContent() {
  const searchParams = useSearchParams();
  const prefilterAgent = searchParams.get("agent");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [agentFilter, setAgentFilter] = useState(prefilterAgent ?? "all");
  const [showFilter, setShowFilter] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (sessionId: string) => {
    setSelectedSession(sessionId);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/mcc/api/sessions?id=${sessionId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.messages ?? []);
      }
    } catch {
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const url = agentFilter !== "all"
        ? `/mcc/api/sessions?agent=${agentFilter}`
        : "/mcc/api/sessions";
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.sessions ?? [];
        setSessions(list);
        if (list.length > 0 && !selectedSession) {
          loadMessages(list[0].id);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [agentFilter, selectedSession, loadMessages]);

  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Comms Center</h1>
          <p className="mt-1 text-sm text-zinc-500">Agent-Unterhaltungen & Nachrichten</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400 transition-all hover:border-zinc-700"
          >
            <Filter className="h-3.5 w-3.5" />
            {agentFilter === "all" ? "Alle Agenten" : agentFilter}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showFilter && (
            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-zinc-800/60 bg-zinc-900 p-1 shadow-xl animate-in">
              <button
                onClick={() => { setAgentFilter("all"); setShowFilter(false); setSelectedSession(null); }}
                className={`w-full rounded-md px-3 py-2 text-left text-xs transition-colors ${agentFilter === "all" ? "bg-violet-500/10 text-violet-400" : "text-zinc-400 hover:bg-zinc-800/60"}`}
              >
                Alle Agenten
              </button>
              {AGENT_IDS.map((id, i) => (
                <button
                  key={`agent-filter-${id}-${i}`}
                  onClick={() => { setAgentFilter(id); setShowFilter(false); setSelectedSession(null); }}
                  className={`w-full rounded-md px-3 py-2 text-left text-xs capitalize transition-colors ${agentFilter === id ? "bg-violet-500/10 text-violet-400" : "text-zinc-400 hover:bg-zinc-800/60"}`}
                >
                  {id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]" style={{ height: "calc(100vh - 220px)" }}>
        <div className="glass-card flex flex-col overflow-hidden">
          <div className="border-b border-zinc-800/40 px-4 py-3">
            <span className="text-xs font-medium text-zinc-400">{sessions.length} Sessions</span>
          </div>
          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="h-14 shimmer rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2">
              {sessions.map((session, i) => (
                <button
                  key={`session-${session.id}-${i}`}
                  onClick={() => loadMessages(session.id)}
                  className={`mb-1 flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-all ${
                    selectedSession === session.id
                      ? "bg-violet-500/10 border border-violet-500/20"
                      : "hover:bg-zinc-800/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200 capitalize">{session.agent ?? "System"}</span>
                    {session.messageCount && (
                      <Badge variant="secondary" className="text-[10px] px-1.5">{session.messageCount}</Badge>
                    )}
                  </div>
                  {(session.created_at ?? session.updatedAt) && (
                    <div className="mt-1 flex items-center gap-1 text-zinc-600">
                      <Calendar className="h-2.5 w-2.5" />
                      <span className="text-[10px]">
                        {new Date(session.updatedAt ?? session.created_at ?? "").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </span>
                    </div>
                  )}
                </button>
              ))}
              {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="mb-2 h-6 w-6 text-zinc-700" />
                  <p className="text-xs text-zinc-600">Keine Sessions</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-card flex flex-col overflow-hidden">
          {selectedSession ? (
            <>
              <div className="border-b border-zinc-800/40 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-zinc-200">{messages.length} Nachrichten</span>
                </div>
                <button
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="rounded-md p-1.5 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`skeleton-msg-${i}`} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <div className={`h-16 shimmer rounded-2xl ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
                      </div>
                    ))}
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg, i) => <ChatBubble key={`msg-${msg.id ?? i}-${i}`} message={msg} />)
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <MessageSquare className="mb-3 h-8 w-8 text-zinc-700" />
                    <p className="text-sm text-zinc-500">Keine Nachrichten in dieser Session</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center">
              <MessageSquare className="mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">Session auswaehlen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommsPage() {
  return (
    <Suspense fallback={<div className="animate-in space-y-4"><div className="glass-card h-12 shimmer" /><div className="glass-card h-96 shimmer" /></div>}>
      <CommsContent />
    </Suspense>
  );
}
