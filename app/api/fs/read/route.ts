import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("path") ?? "";
  const fullPath = p.startsWith("/data") ? p : path.join(process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace", p);
  try {
    const content = await fs.readFile(fullPath, "utf-8");
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
