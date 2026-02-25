import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { createReadStream, existsSync } from "fs";
import readline from "readline";

const AGENTS_DIR = process.env.OPENCLAW_AGENTS_DIR ?? process.env.OPENCLAW_ROOT || "/data/.openclaw/agents";

type SessionMeta = {
  id: string;
  sessionKey: string;
  agent: string;
  label?: string;
  updatedAt?: string;
  model?: string;
};

type MessageBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: string; [key: string]: unknown };

interface JournalMessage {
  role: "user" | "assistant" | "system";
  content: MessageBlock[] | string;
}

interface JournalEntry {
  type: string;
  id: string;
  timestamp: string;
  message?: JournalMessage;
}

function extractText(content: MessageBlock[] | string): string {
  if (typeof content === "string") return content;
  return content
    .filter((b) => b.type === "text" && "text" in b)
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n")
    .trim();
}

async function parseJSONL(filePath: string, limit = 300) {
  if (!existsSync(filePath)) return [];
  const messages: {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: string;
    id?: string;
  }[] = [];
  const rl = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });
  let count = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry: JournalEntry = JSON.parse(line);
      if (entry.type === "message" && entry.message) {
        const text = extractText(entry.message.content);
        if (text) {
          messages.push({
            role: entry.message.role,
            content: text,
            timestamp: entry.timestamp,
            id: entry.id,
          });
          if (++count >= limit) break;
        }
      }
    } catch {
      /* skip malformed lines */
    }
  }
  return messages;
}

async function listAgentSessions(agentId: string): Promise<SessionMeta[]> {
  const sessionsFile = path.join(
    AGENTS_DIR,
    agentId,
    "sessions",
    "sessions.json"
  );
  try {
    const raw = await fs.readFile(sessionsFile, "utf-8");
    const store: Record<
      string,
      { sessionId: string; updatedAt: number; label?: string; model?: string }
    > = JSON.parse(raw);
    return Object.entries(store)
      .filter(([, v]) => v?.sessionId)
      .map(([key, v]) => ({
        id: v.sessionId,
        sessionKey: key,
        agent: agentId,
        label: v.label,
        updatedAt: v.updatedAt
          ? new Date(v.updatedAt).toISOString()
          : undefined,
        model: v.model,
      }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("id");
  const agentFilter = req.nextUrl.searchParams.get("agent");
  const agentHint = req.nextUrl.searchParams.get("agentHint");

  // Read all agent directories
  let agentIds: string[] = [];
  try {
    const entries = await fs.readdir(AGENTS_DIR, { withFileTypes: true });
    agentIds = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return NextResponse.json({ sessions: [], messages: [] });
  }

  // Fetch messages for a specific session
  if (sessionId) {
    const searchAgents = agentHint ? [agentHint] : agentIds;
    for (const agentId of searchAgents) {
      const sessionsFile = path.join(
        AGENTS_DIR,
        agentId,
        "sessions",
        "sessions.json"
      );
      try {
        const raw = await fs.readFile(sessionsFile, "utf-8");
        const store: Record<string, { sessionId: string }> = JSON.parse(raw);
        const found = Object.values(store).find(
          (v) => v.sessionId === sessionId
        );
        if (found) {
          const jsonlPath = path.join(
            AGENTS_DIR,
            agentId,
            "sessions",
            `${sessionId}.jsonl`
          );
          return NextResponse.json({
            messages: await parseJSONL(jsonlPath),
          });
        }
      } catch {
        /* continue searching */
      }
    }
    return NextResponse.json({ messages: [] });
  }

  // List all sessions across agents
  const filterList =
    agentFilter && agentFilter !== "all" ? [agentFilter] : agentIds;
  const all: SessionMeta[] = [];
  for (const agentId of filterList) {
    all.push(...(await listAgentSessions(agentId)));
  }

  // Sort by most recent first
  all.sort(
    (a, b) =>
      new Date(b.updatedAt ?? 0).getTime() -
      new Date(a.updatedAt ?? 0).getTime()
  );

  return NextResponse.json({ sessions: all.slice(0, 100) });
}

export const dynamic = "force-dynamic";
