"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Sparkles, Trash2, User, Send, X, Pencil } from "lucide-react";

type Task = {
  id: string;
  title: string;
  status: "open" | "in_progress" | "blocked" | "done" | "archived";
  source: "user" | "ai";
  priority?: "low" | "medium" | "high";
  notes?: string;
  createdAt?: string;
};

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"user" | "ai">("user");
  const [newTodo, setNewTodo] = useState("");
  const [saving, setSaving] = useState(false);
  const [forwardTask, setForwardTask] = useState<Task | null>(null);
  const [forwardNote, setForwardNote] = useState("");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<string>("medium");
  const [editStatus, setEditStatus] = useState<string>("open");

  const loadTasks = async () => {
    try {
      const res = await fetch("/mcc/api/tasks", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async () => {
    if (!newTodo.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/mcc/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTodo,
          source: activeTab,
          priority: "medium",
        }),
      });
      if (res.ok) {
        setNewTodo("");
        await loadTasks();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "open" : "done";
    try {
      const res = await fetch("/mcc/api/tasks/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await loadTasks();
    } catch {
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const res = await fetch("/mcc/api/tasks/" + id, { method: "DELETE" });
      if (res.ok) await loadTasks();
    } catch {
    }
  };

  const startEdit = (task: Task) => {
    setEditTask(task);
    setEditTitle(task.title);
    setEditPriority(task.priority || "medium");
    setEditStatus(task.status || "open");
  };

  const saveEdit = async () => {
    if (!editTask || !editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/mcc/api/tasks/" + editTask.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: editTitle,
          priority: editPriority,
          status: editStatus
        }),
      });
      if (res.ok) {
        setEditTask(null);
        setEditTitle("");
        await loadTasks();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const forwardToAI = async () => {
    if (!forwardTask) return;
    setSaving(true);
    try {
      const res = await fetch("/mcc/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Follow-up: " + forwardTask.title,
          source: "ai",
          priority: "medium",
          notes: "Erledigt von Jannis: " + (forwardNote || "Aufgabe abgeschlossen, KI kann weiterarbeiten"),
        }),
      });
      if (res.ok) {
        setForwardTask(null);
        setForwardNote("");
        await loadTasks();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredTasks = tasks.filter(
    (t) => (t.source === activeTab || (!t.source && activeTab === "user"))
  );
  const openTasks = filteredTasks.filter((t) => t.status !== "done");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in">
      {forwardTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-md p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100">An KI weiterleiten</h3>
              <button onClick={() => setForwardTask(null)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-3 text-sm text-zinc-400">Aufgabe: <span className="text-zinc-200">{forwardTask.title}</span></p>
            <textarea value={forwardNote} onChange={(e) => setForwardNote(e.target.value)} placeholder="Was hast du erledigt?" className="mb-4 w-full rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200" rows={4} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setForwardTask(null)} className="rounded-lg px-3 py-2 text-xs text-zinc-500">Abbrechen</button>
              <button onClick={forwardToAI} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-4 py-2 text-xs font-medium text-violet-400"><Send className="h-3.5 w-3.5" />An KI senden</button>
            </div>
          </div>
        </div>
      )}

      {editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card w-full max-w-md p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100">Todo bearbeiten</h3>
              <button onClick={() => setEditTask(null)} className="rounded p-1 text-zinc-500 hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="space-y-3 mb-4">
              <input 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                className="w-full rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200" 
                placeholder="Titel"
              />
              
              <div className="flex gap-2">
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditTask(null)} className="rounded-lg px-3 py-2 text-xs text-zinc-500">Abbrechen</button>
              <button onClick={saveEdit} disabled={saving} className="rounded-lg bg-violet-500/15 px-4 py-2 text-xs font-medium text-violet-400">Speichern</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">TODO Liste</h1>
          <p className="mt-1 text-sm text-zinc-500">{openTasks.length} offen, {doneTasks.length} erledigt</p>
        </div>
      </div>

      <div className="glass-card border-l-4 border-l-violet-500 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <h2 className="text-base font-bold text-zinc-100">Aufgaben verwalten</h2>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-1">
            <button onClick={() => setActiveTab("user")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeTab === "user" ? "bg-violet-500/15 text-violet-400" : "text-zinc-500"}`}><User className="h-3 w-3" />Meine</button>
            <button onClick={() => setActiveTab("ai")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeTab === "ai" ? "bg-violet-500/15 text-violet-400" : "text-zinc-500"}`}><Sparkles className="h-3 w-3" />KI</button>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createTodo()} placeholder={`Neue ${activeTab === "user" ? "Aufgabe" : "KI-Aufgabe"}...`} className="flex-1 rounded-lg border border-zinc-800/60 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-200" />
          <button onClick={createTodo} disabled={saving || !newTodo.trim()} className="flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-3 py-2 text-xs font-medium text-violet-400"><Plus className="h-3.5 w-3.5" />Hinzufuegen</button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <div key={`todo-skeleton-${i}`} className="h-12 shimmer rounded-lg" />)}</div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {openTasks.length === 0 && doneTasks.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Noch keine Todos.</p>}
            
            {openTasks.map((task, i) => (
              <div key={`todo-${task.id}-${i}`} className={`group rounded-lg border p-3 ${
                task.status === "blocked" ? "border-red-500/30 bg-red-950/10" : 
                task.priority === "high" ? "border-violet-500/30 bg-violet-950/10" : 
                "border-zinc-800/60 bg-zinc-950/40"
              }`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleTodo(task.id, task.status)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${task.status === "blocked" ? "border-red-500/50 bg-red-500/20" : "border-zinc-700 bg-zinc-900 hover:border-violet-500/50"}`}>
                    {task.status === "blocked" && <X className="h-3 w-3 text-red-400" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm truncate ${task.status === "blocked" ? "text-red-200" : "text-zinc-200"}`}>{task.title}</span>
                      {task.priority === "high" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300">HIGH</span>}
                      {task.status === "blocked" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300">BLOCKED</span>}
                    </div>
                    {task.notes && <p className="text-xs text-zinc-500 truncate">{task.notes}</p>}
                  </div>

                  <button onClick={() => startEdit(task)} className="opacity-0 rounded p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-violet-400 group-hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteTodo(task.id)} className="opacity-0 rounded p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}

            {doneTasks.map((task, i) => (
              <div key={`todo-${task.id}-${i}`} className="group rounded-lg border border-zinc-800/40 bg-zinc-950/20 p-3 opacity-60">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleTodo(task.id, task.status)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-emerald-500/50 bg-emerald-500/10"><Check className="h-3 w-3 text-emerald-400" /></button>
                  <span className="flex-1 text-sm text-zinc-500 line-through">{task.title}</span>
                  <button onClick={() => startEdit(task)} className="opacity-0 rounded p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-violet-400 group-hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></button>
                  {activeTab === "user" && <button onClick={() => setForwardTask(task)} className="opacity-0 rounded p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-violet-400 group-hover:opacity-100" title="An KI weiterleiten"><Send className="h-4 w-4" /></button>}
                  <button onClick={() => deleteTodo(task.id)} className="opacity-0 rounded p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                </div>
                {task.notes && <p className="mt-1 pl-8 text-xs text-zinc-600">{task.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
