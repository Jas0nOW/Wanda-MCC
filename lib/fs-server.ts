import { promises as fs } from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace";

export async function listDir(p: string) {
  try {
    const fullPath = (p && p.length > 1) ? p : WORKSPACE_ROOT;
    console.log("LIST DIR:", fullPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return {
      entries: entries.map((e) => ({
        name: e.name,
        path: path.join(fullPath, e.name),
        isDirectory: e.isDirectory()
      })
    };
  } catch (err: any) {
    console.error("listDir error:", err.message);
    return { entries: [] };
  }
}

export async function readFileContent(p: string) {
  console.log("READ FILE:", p);
  return fs.readFile(p, "utf-8");
}

export async function writeFileContent(p: string, content: string) {
  console.log("WRITE FILE:", p);
  const dir = path.dirname(p);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(p, content, "utf-8");
}
