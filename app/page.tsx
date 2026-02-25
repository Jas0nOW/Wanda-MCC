import { promises as fs } from "node:fs";
import path from "node:path";
import { format } from "date-fns";
import DashboardClient from "@/components/mcc/dashboard-client";

const WORKSPACE_ROOT = process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace";

type Task = { id?: string; title?: string; status?: "open" | "blocked" | "done" | string; priority?: string;[key: string]: unknown };

async function getActiveTasks(): Promise<Task[]> {
  try {
    const p = path.join(WORKSPACE_ROOT, "active_tasks.json");
    console.log("Reading tasks from:", p);
    const file = await fs.readFile(p, "utf-8");
    const parsed = JSON.parse(file);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.tasks)) return parsed.tasks;
    return [];
  } catch (e) {
    console.error("Error reading tasks:", e);
    return [];
  }
}

async function getMemoryFiles() {
  try {
    const dir = path.join(WORKSPACE_ROOT, "memory");
    const files = await fs.readdir(dir, { withFileTypes: true });
    const md = files.filter((f) => f.isFile() && f.name.endsWith(".md"));
    const enriched = await Promise.all(
      md.map(async (file) => {
        const p = path.join(dir, file.name);
        const stat = await fs.stat(p);
        return {
          name: file.name,
          path: p,
          date: stat.mtime.toISOString(),
          displayDate: format(stat.mtime, "yyyy-MM-dd HH:mm")
        };
      })
    );
    return enriched.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 20);
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const [tasks, memoryFiles] = await Promise.all([getActiveTasks(), getMemoryFiles()]);
  return <DashboardClient tasks={tasks} memoryFiles={memoryFiles} />;
}
