"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock3, RefreshCw, AlertCircle, CheckCircle2, XCircle, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

type CronJob = {
  id: string;
  name: string;
  schedule: string;
  agentId?: string;
  enabled: boolean;
  lastRun?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
  nextRun?: string | null;
  description?: string | null;
  tz?: string;
};

function CronScheduleLabel({ schedule }: { schedule: string }) {
  const labels: Record<string, string> = {
    "0 * * * *": "Jede Stunde",
    "*/30 * * * *": "Alle 30 Min",
    "*/15 * * * *": "Alle 15 Min",
    "0 6 * * 1,3,5": "Mo/Mi/Fr 06:00",
    "0 0 * * *": "Taeglich 00:00",
    "0 6 * * *": "Taeglich 06:00",
    "0 8 * * *": "Taeglich 08:00",
    "0 9 * * *": "Taeglich 09:00",
    "0 18 * * *": "Taeglich 18:00",
    "0 20 * * *": "Taeglich 20:00",
    "0 9 * * 1": "Montags 09:00",
    "0 0 1 * *": "Monatlich",
    "0 0 * * 0": "Woechentlich",
  };
  return <span className="text-[11px] text-zinc-400">{labels[schedule] ?? schedule}</span>;
}

function StatusIcon({ status }: { status: string | null | undefined }) {
  if (status === "ok" || status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "error" || status === "failed") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  return <AlertCircle className="h-3.5 w-3.5 text-zinc-600" />;
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newJob, setNewJob] = useState({ name: "", schedule: "", agentId: "", description: "" });

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch("/mcc/api/cron", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleJob = async (id: string, enabled: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/mcc/api/cron?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (res.ok) await loadJobs();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Job wirklich loeschen?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/mcc/api/cron?id=${id}`, { method: "DELETE" });
      if (res.ok) await loadJobs();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const createJob = async () => {
    if (!newJob.name || !newJob.schedule) return;
    setSaving(true);
    try {
      const res = await fetch("/mcc/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      if (res.ok) {
        setNewJob({ name: "", schedule: "", agentId: "", description: "" });
        setShowCreate(false);
        await loadJobs();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const enabledCount = jobs.filter((j) => j.enabled).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Cron Jobs</h1>
          <p className="mt-1 text-sm text-zinc-500">{jobs.length} Jobs, {enabledCount} aktiv</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadJobs} className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-700"><RefreshCw className="h-3.5 w-3.5" />Aktualisieren</button>
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-lg bg-violet-500/15 px-3 py-2 text-xs font-medium text-violet-400 hover:bg-violet-500/25"><Plus className="h-3.5 w-3.5" />Neuer Job</button>
        </div>
      </div>

      {showCreate && (
        <div className="glass-card p-4 animate-in">
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Neuen Job erstellen</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Name" value={newJob.name} onChange={(e) => setNewJob({...newJob, name: e.target.value})} className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200" />
            <input placeholder="Schedule (z.B. 0 9 * * *)" value={newJob.schedule} onChange={(e) => setNewJob({...newJob, schedule: e.target.value})} className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200 font-mono" />
            <input placeholder="Agent (optional)" value={newJob.agentId} onChange={(e) => setNewJob({...newJob, agentId: e.target.value})} className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200" />
            <input placeholder="Beschreibung (optional)" value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200" />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="rounded-lg px-3 py-1.5 text-xs text-zinc-500">Abbrechen</button>
            <button onClick={createJob} disabled={saving} className="rounded-lg bg-violet-500/15 px-4 py-1.5 text-xs font-medium text-violet-400 disabled:opacity-50">Erstellen</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((_, i) => <div key={`skeleton-${i}`} className="glass-card h-32 shimmer" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16"><Clock3 className="mb-3 h-8 w-8 text-zinc-700" /><p className="text-sm text-zinc-500">Keine Cron Jobs</p></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job, i) => (
            <div key={`cron-job-${job.id}-${i}`} className="glass-card card-hover p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock3 className="h-4 w-4 shrink-0 text-zinc-600" />
                  <span className="text-sm font-medium text-zinc-200 truncate">{job.name}</span>
                </div>
                <StatusIcon status={job.lastStatus} />
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <CronScheduleLabel schedule={job.schedule} />
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${job.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-700 text-zinc-500"}`}>{job.enabled ? "Aktiv" : "Pausiert"}</span>
              </div>

              {job.agentId && <p className="text-[10px] text-zinc-600 capitalize">Agent: {job.agentId}</p>}
              {job.description && <p className="mt-1 text-[10px] text-zinc-600 line-clamp-1">{job.description}</p>}

              <div className="mt-3 border-t border-zinc-800/40 pt-2 flex items-center justify-between">
                <span className="text-[10px] text-zinc-600">{job.lastRun ? new Date(job.lastRun).toLocaleString("de-DE", {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "Noch nie"}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleJob(job.id ?? job.name, job.enabled)} disabled={saving} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50" title={job.enabled ? "Pausieren" : "Aktivieren"}>{job.enabled ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}</button>
                  <button onClick={() => deleteJob(job.id ?? job.name)} disabled={saving} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50" title="Loeschen"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
