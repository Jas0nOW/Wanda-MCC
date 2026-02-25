import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";

const GATEWAY_URL = "http://localhost:63362";
const CONFIG_PATH = process.env.OPENCLAW_ROOT || "/data/.openclaw/openclaw.json";

async function readConfig() {
  const raw = await fs.readFile(CONFIG_PATH, "utf8");
  return JSON.parse(raw);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body?.message ?? "").trim();

    if (!message) {
      return NextResponse.json({ error: "message ist erforderlich." }, { status: 400 });
    }

    const config = await readConfig();
    const token = config?.gateway?.auth?.token as string | undefined;

    if (!token) {
      return NextResponse.json({ error: "Gateway-Token fehlt in /data/.openclaw/openclaw.json" }, { status: 500 });
    }

    const upstream = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openclaw:wanda",
        messages: [{ role: "user", content: message }],
        stream: false,
      }),
      cache: "no-store",
    });

    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error:
            payload?.error?.message ??
            payload?.message ??
            "Gateway hat die Anfrage abgelehnt. Bitte pruefe Token und Chat-Endpoint.",
        },
        { status: upstream.status }
      );
    }

    const reply = payload?.choices?.[0]?.message?.content;
    return NextResponse.json({ reply: typeof reply === "string" ? reply : "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    const unreachable = /fetch failed|ECONNREFUSED|network|ENOTFOUND/i.test(message);

    return NextResponse.json(
      {
        error: unreachable
          ? "Gateway nicht erreichbar auf http://localhost:63362. Bitte pruefe, ob der Gateway-Service laeuft und chatCompletions aktiviert ist."
          : message,
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
