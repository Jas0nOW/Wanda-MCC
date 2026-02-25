
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Typdefinition basierend auf active_tasks.json
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

export async function GET() {
  try {
    const workspacePath = (process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT) || "/data/.openclaw/workspace";
    const tasksFilePath = path.join(workspacePath, "active_tasks.json");

    // Prüfen ob Datei existiert
    try {
      await fs.access(tasksFilePath);
    } catch {
      // Falls nicht existiert, leeres Ergebnis zurückgeben
      return NextResponse.json({ tasks: [], blockers: [], open: [] });
    }

    const fileContent = await fs.readFile(tasksFilePath, "utf-8");
    const data: TasksData = JSON.parse(fileContent);
    const tasks = data.tasks || [];

    const blockers = tasks.filter((t) => t.status === "blocked");
    const open = tasks.filter((t) => t.status === "open" || t.status === "in_progress");

    return NextResponse.json({
      tasks,
      blockers,
      open,
    });
  } catch (error) {
    console.error("Error reading tasks:", error);
    return NextResponse.json(
      { error: "Failed to load tasks" },
      { status: 500 }
    );
  }
}
