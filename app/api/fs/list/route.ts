import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("path") || "";
  const root = process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace";
  const fullPath = p.startsWith("/data") ? p : path.join(root, p);
  
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return NextResponse.json({
      entries: entries.map((e) => ({
        name: e.name,
        path: p === "" ? e.name : path.join(p, e.name),
        isDirectory: e.isDirectory()
      }))
    });
  } catch (e: any) {
    return NextResponse.json({ entries: [], error: e.message });
  }
}
