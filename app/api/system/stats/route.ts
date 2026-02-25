import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

async function getCpuUsage() {
  try {
    const content = await fs.readFile("/proc/stat", "utf-8");
    const cpuLine = content.split("\n").find((l) => l.startsWith("cpu "));
    const parts = cpuLine!.split(/\s+/).filter(Boolean);
    const total = parts.slice(1, 9).reduce((a, b) => a + parseInt(b), 0);
    const idle = parseInt(parts[4]);
    return { usagePercent: Math.round(((total - idle) / total) * 100 * 10) / 10 };
  } catch { return { usagePercent: 0 }; }
}

async function getMemInfo() {
  try {
    const content = await fs.readFile("/proc/meminfo", "utf-8");
    const lines = content.split("\n");
    const total = parseInt(lines.find(l => l.startsWith("MemTotal:"))!.split(/\s+/)[1]) * 1024;
    const available = parseInt(lines.find(l => l.startsWith("MemAvailable:"))!.split(/\s+/)[1]) * 1024;
    return { used: total - available, total, free: available, usedPercent: Math.round(((total - available) / total) * 100 * 10) / 10 };
  } catch { return { used: 0, total: 0, free: 0, usedPercent: 0 }; }
}

async function getVpsDisk() {
  try {
    const { stdout } = await execAsync("df -BG /");
    const parts = stdout.trim().split("\n")[1].split(/\s+/);
    return { size: parts[1].replace("G", ""), used: parts[2].replace("G", "") };
  } catch { return { size: "0", used: "0" }; }
}

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get("source");

  if (source === "pc") {
    try {
      const res = await fetch("http://100.72.162.110:3001/api/system/stats", { 
        headers: { "x-api-key": "846ceaee0ea7adbc8a407c3b222e5fb8" },
        cache: "no-store" 
      });
      const data = await res.json();
      return NextResponse.json({
        cpu: { usagePercent: data.cpu },
        memory: data.memory,
        disk: {
          size: (data.disk.total / 1024 / 1024 / 1024).toFixed(0),
          used: (data.disk.used / 1024 / 1024 / 1024).toFixed(0),
        },
        uptimeSeconds: data.uptime,
        gatewayOnline: true
      });
    } catch { return NextResponse.json({ error: "PC offline" }, { status: 502 }); }
  }

  // VPS Logic (Default)
  const [cpu, memory, disk, uptime] = await Promise.all([
    getCpuUsage(),
    getMemInfo(),
    getVpsDisk(),
    fs.readFile("/proc/uptime", "utf-8").then(c => parseFloat(c.split(/\s+/)[0]))
  ]);

  return NextResponse.json({ cpu, memory, disk, uptimeSeconds: uptime, gatewayOnline: true });
}
