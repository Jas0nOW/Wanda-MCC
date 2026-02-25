
import { NextResponse } from "next/server";
import fs from "fs/promises";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

async function getCpuUsage(): Promise<{ usagePercent: number }> {
  try {
    const readStat = async () => {
      const content = await fs.readFile("/proc/stat", "utf-8");
      const lines = content.split("\n");
      const cpuLine = lines.find((l) => l.startsWith("cpu "));
      if (!cpuLine) return null;
      const parts = cpuLine.split(/\s+/).filter((p) => p !== "");
      // user, nice, system, idle, iowait, irq, softirq, steal
      const user = parseInt(parts[1], 10);
      const nice = parseInt(parts[2], 10);
      const system = parseInt(parts[3], 10);
      const idle = parseInt(parts[4], 10);
      const iowait = parseInt(parts[5], 10);
      const irq = parseInt(parts[6], 10);
      const softirq = parseInt(parts[7], 10);
      const steal = parseInt(parts[8], 10);
      
      const total = user + nice + system + idle + iowait + irq + softirq + steal;
      const active = total - idle - iowait;
      return { total, active };
    };

    const start = await readStat();
    if (!start) return { usagePercent: 0 };
    
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const end = await readStat();
    if (!end) return { usagePercent: 0 };

    const totalDiff = end.total - start.total;
    const activeDiff = end.active - start.active;
    
    if (totalDiff === 0) return { usagePercent: 0 };
    
    const usagePercent = (activeDiff / totalDiff) * 100;
    return { usagePercent: Math.round(usagePercent * 10) / 10 };
  } catch (error) {
    console.error("Error reading CPU stats:", error);
    return { usagePercent: 0 };
  }
}

async function getMemInfo() {
  try {
    const content = await fs.readFile("/proc/meminfo", "utf-8");
    const lines = content.split("\n");
    const getVal = (key: string) => {
      const line = lines.find((l) => l.startsWith(key));
      if (!line) return 0;
      const parts = line.split(/\s+/);
      // Value is in kB, convert to bytes
      return parseInt(parts[1], 10) * 1024;
    };

    const total = getVal("MemTotal:");
    const free = getVal("MemFree:");
    const available = getVal("MemAvailable:");
    const cached = getVal("Cached:");
    
    // Use MemAvailable as "free" memory for practical purposes
    const used = total - available;
    const usedPercent = total > 0 ? (used / total) * 100 : 0;

    return {
      used,
      total,
      free: available,
      usedPercent: Math.round(usedPercent * 10) / 10
    };
  } catch (error) {
    console.error("Error reading memory info:", error);
    return { used: 0, total: 0, free: 0, usedPercent: 0 };
  }
}

async function getDiskInfo() {
  try {
    const { stdout } = await execAsync("df -BG /");
    const lines = stdout.trim().split("\n");
    // Filesystem     1G-blocks  Used Available Use% Mounted on
    // /dev/sda1      100G       20G  80G       20%  /
    if (lines.length < 2) return {};
    
    const parts = lines[1].split(/\s+/);
    // Parse '100G' -> 100
    const parseSize = (s: string) => parseFloat(s.replace("G", ""));
    
    return {
      filesystem: parts[0],
      size: parts[1].replace("G", ""),
      used: parts[2].replace("G", ""),
      available: parts[3].replace("G", ""),
      usePercent: parts[4].replace("%", ""),
      mountedOn: parts[5]
    };
  } catch (error) {
    console.error("Error reading disk info:", error);
    return {};
  }
}

async function getUptime() {
  try {
    const content = await fs.readFile("/proc/uptime", "utf-8");
    const parts = content.split(/\s+/);
    return parseFloat(parts[0]);
  } catch (error) {
    console.error("Error reading uptime:", error);
    return 0;
  }
}

async function checkGateway() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    
    const res = await fetch("http://localhost:63362/api/status", {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const [cpu, memory, disk, uptimeSeconds, gatewayOnline] = await Promise.all([
      getCpuUsage(),
      getMemInfo(),
      getDiskInfo(),
      getUptime(),
      checkGateway()
    ]);

    return NextResponse.json({
      cpu,
      memory,
      disk,
      uptimeSeconds,
      gatewayOnline
    });
  } catch (error) {
    console.error("Error getting system stats:", error);
    return NextResponse.json(
      { error: "Failed to get system stats" },
      { status: 500 }
    );
  }
}
