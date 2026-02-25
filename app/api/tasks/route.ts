import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Task = {
  id: string;
  title: string;
  status: "open" | "in_progress" | "blocked" | "done" | "archived";
  priority: "low" | "medium" | "high";
  source: "user" | "ai";
  notes?: string;
  createdAt?: string;
  [key: string]: unknown;
};

type TasksData = {
  updatedAt: string;
  mode: string;
  tasks: Task[];
  archived_done?: string[];
};

const TASKS_FILE = () => {
  const workspacePath = process.env.WORKSPACE_PATH || process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace";
  return path.join(workspacePath, "active_tasks.json");
};

async function readTasks(): Promise<TasksData> {
  try {
    const filePath = TASKS_FILE();
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("readTasks error:", err);
    return { updatedAt: new Date().toISOString(), mode: "manual", tasks: [] };
  }
}

async function writeTasks(data: TasksData): Promise<void> {
  data.updatedAt = new Date().toISOString();
  await fs.writeFile(TASKS_FILE(), JSON.stringify(data, null, 2));
}

export async function GET(req: NextRequest) {
  try {
    const data = await readTasks();
    const tasks = data.tasks || [];
    const source = req.nextUrl.searchParams.get("source");
    const filtered = source ? tasks.filter((t) => t.source === source) : tasks;
    return NextResponse.json({
      tasks: filtered,
      blockers: filtered.filter((t) => t.status === "blocked"),
      open: filtered.filter((t) => t.status === "open" || t.status === "in_progress"),
    });
  } catch (err) {
    console.error("GET tasks error:", err);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, priority, source, notes } = body;
    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    const data = await readTasks();
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      status: "open",
      priority: priority ?? "medium",
      source: source ?? "user",
      notes: notes ?? undefined,
      createdAt: new Date().toISOString(),
    };
    if (!data.tasks) data.tasks = [];
    data.tasks.push(task);
    await writeTasks(data);
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("POST task error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";