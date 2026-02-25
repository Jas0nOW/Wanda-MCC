import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  const root = process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace";
  const results: any[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
        await walk(full);
      } else if (/\.(md|json|txt|yaml|yml)$/.test(entry.name)) {
        const content = await fs.readFile(full, "utf-8");
        const lines = content.split("\n");
        const matched = lines.filter(l => l.toLowerCase().includes(query.toLowerCase()));
        if (matched.length > 0) {
          results.push({ path: path.relative(root, full), name: entry.name, matches: matched.slice(0, 5) });
        }
      }
    }
  }
  try {
    await walk(root);
    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
