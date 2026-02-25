
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

async function getOpenClawLogs() {
  const logDir = process.env.OPENCLAW_ROOT || "/data/.openclaw/logs";
  try {
    const files = await fs.readdir(logDir);
    // Sort by modification time, newest first
    const sortedFiles = await Promise.all(files.map(async (file) => {
      const stats = await fs.stat(path.join(logDir, file));
      return { file, mtime: stats.mtime };
    }));
    sortedFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    if (sortedFiles.length === 0) return null;
    
    const newestLog = sortedFiles[0].file;
    const content = await fs.readFile(path.join(logDir, newestLog), "utf-8");
    const lines = content.split("\n").slice(-100);
    return { source: `File: ${newestLog}`, lines };
  } catch {
    return null;
  }
}

async function getProcessLogs() {
  try {
    // Try to read container logs
    const { stdout } = await execAsync("tail -n 50 /proc/1/fd/1");
    const lines = stdout.split("\n").filter(Boolean);
    return { source: "Container Stdout", lines };
  } catch {
    return { source: "Error", lines: ["Could not read logs"] };
  }
}

export async function GET() {
  try {
    let logs = await getOpenClawLogs();
    if (!logs) {
      logs = await getProcessLogs();
    }
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error reading logs:", error);
    return NextResponse.json(
      { error: "Failed to read logs" },
      { status: 500 }
    );
  }
}
