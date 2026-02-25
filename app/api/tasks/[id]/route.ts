import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  notes?: string;
  [key: string]: unknown;
};

type TasksData = {
  updatedAt: string;
  mode: string;
  tasks: Task[];
  archived_done?: string[];
};

const TASKS_FILE = () => {
  const workspacePath = process.env.WORKSPACE_PATH ?? process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace";
  return path.join(workspacePath, "active_tasks.json");
};

async function readTasks(): Promise<TasksData> {
  const raw = await fs.readFile(TASKS_FILE(), "utf-8");
  return JSON.parse(raw);
}

async function writeTasks(data: TasksData): Promise<void> {
  data.updatedAt = new Date().toISOString();
  await fs.writeFile(TASKS_FILE(), JSON.stringify(data, null, 2));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const data = await readTasks();
    const task = data.tasks.find((t) => t.id === id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (body.status) task.status = body.status;
    if (body.title) task.title = body.title;
    if (body.priority) task.priority = body.priority;
    if (body.notes !== undefined) task.notes = body.notes;
    await writeTasks(data);
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await readTasks();
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    data.tasks.splice(idx, 1);
    await writeTasks(data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
