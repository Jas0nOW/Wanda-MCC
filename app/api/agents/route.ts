import { NextResponse } from "next/server";
import fs from "fs/promises";

const CONFIG_PATH = process.env.CONFIG_PATH ?? process.env.OPENCLAW_ROOT || "/data/.openclaw/openclaw.json";

export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = JSON.parse(raw);
    const agents = (config.agents?.list ?? []).map((a: Record<string, unknown>) => {
      const model = a.model as Record<string, unknown> | undefined;
      const subs = a.subagents as Record<string, unknown> | undefined;
      return {
        id: a.id,
        name: a.name,
        model: (model?.primary as string) ?? "unknown",
        fallbacks: (model?.fallbacks as string[]) ?? [],
        subagents: (subs?.allowAgents as string[]) ?? [],
        isDefault: (a.default as boolean) ?? false,
      };
    });
    return NextResponse.json({ agents });
  } catch {
    return NextResponse.json({ agents: [] });
  }
}

export const dynamic = "force-dynamic";
