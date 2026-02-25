import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

const CRON_PATH = process.env.CRON_PATH ?? process.env.OPENCLAW_ROOT || "/data/.openclaw/cron/jobs.json";

type CronJob = {
  id: string;
  name: string;
  agentId?: string;
  enabled: boolean;
  schedule: { kind: string; expr: string; tz: string } | string;
  payload?: { message?: string; model?: string };
  description?: string;
  state?: Record<string, unknown>;
};

type JobsData = {
  version: number;
  jobs: CronJob[];
};

async function readJobs(): Promise<JobsData> {
  try {
    const raw = await fs.readFile(CRON_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { version: 1, jobs: [] };
  }
}

async function writeJobs(data: JobsData): Promise<void> {
  await fs.writeFile(CRON_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = await readJobs();
    const jobs = data.jobs.map((j) => {
      const schedule = j.schedule as Record<string, unknown> | string;
      const state = j.state;
      return {
        id: j.id,
        name: j.name,
        agentId: j.agentId,
        enabled: j.enabled ?? true,
        schedule: typeof schedule === "object" && schedule ? schedule.expr : String(schedule ?? ""),
        tz: typeof schedule === "object" && schedule ? schedule.tz : "Europe/Berlin",
        lastRun: state?.lastRunAtMs ? new Date(state.lastRunAtMs as number).toISOString() : null,
        lastStatus: state?.lastStatus ?? null,
        lastError: state?.lastError ?? null,
        nextRun: state?.nextRunAtMs ? new Date(state.nextRunAtMs as number).toISOString() : null,
        description: j.description ?? null,
      };
    });
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ jobs: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, schedule, agentId, description, message } = body;
    
    if (!name || !schedule) {
      return NextResponse.json({ error: "name and schedule required" }, { status: 400 });
    }
    
    const data = await readJobs();
    const newJob: CronJob = {
      id: "job-" + Date.now(),
      name,
      agentId: agentId ?? "wanda",
      enabled: true,
      schedule: { kind: "cron", expr: schedule, tz: "Europe/Berlin" },
      description: description ?? "",
      payload: { message: message ?? "", model: "google-antigravity/gemini-3-flash" },
      state: { nextRunAtMs: Date.now() + 3600000 },
    };
    
    data.jobs.push(newJob);
    await writeJobs(data);
    return NextResponse.json(newJob, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    
    const body = await req.json();
    const data = await readJobs();
    const job = data.jobs.find((j) => j.id === id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    
    if (body.enabled !== undefined) job.enabled = body.enabled;
    if (body.name) job.name = body.name;
    if (body.schedule) job.schedule = { kind: "cron", expr: body.schedule, tz: "Europe/Berlin" };
    if (body.description !== undefined) job.description = body.description;
    if (body.message && job.payload) job.payload.message = body.message;
    
    await writeJobs(data);
    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    
    const data = await readJobs();
    const idx = data.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    
    data.jobs.splice(idx, 1);
    await writeJobs(data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
