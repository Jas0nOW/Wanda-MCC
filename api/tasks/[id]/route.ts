
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Task = {
  id: string;
  title: string;
  status: "open" | "in_progress" | "blocked" | "done" | "archived";
  priority: "low" | "medium" | "high";
  notes?: string;
  [key: string]: unknown;
};

type TasksData = {
  updatedAt: string;
  mode: string;
  tasks: Task[];
  archived_done?: string[];
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const workspacePath = process.env.WORKSPACE_PATH ?? process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace";
    const tasksFilePath = path.join(workspacePath, "active_tasks.json");

    try {
      await fs.access(tasksFilePath);
    } catch {
      return NextResponse.json(
        { error: "Tasks file not found" },
        { status: 404 }
      );
    }

    const fileContent = await fs.readFile(tasksFilePath, "utf-8");
    const data: TasksData = JSON.parse(fileContent);
    const tasks = data.tasks || [];

    const taskIndex = tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Task aktualisieren
    tasks[taskIndex].status = status;
    
    // UpdatedAt aktualisieren
    data.updatedAt = new Date().toISOString();
    
    // Datei schreiben
    await fs.writeFile(tasksFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json(tasks[taskIndex]);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
