"use client";

import { useEffect, useState, useCallback } from "react";
import { Files, Folder, File, ChevronRight, Home, Save, RefreshCw, ArrowLeft, Settings } from "lucide-react";

type FileEntry = { name: string; path: string; isDirectory: boolean; size?: number; mtime?: string; };

export default function FilesPage() {
  const [currentPath, setCurrentPath] = useState(process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async (dirPath: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/mcc/api/fs/list?path=${encodeURIComponent(dirPath)}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setCurrentPath(dirPath);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFile = async (file: FileEntry) => {
    setLoading(true);
    try {
      const res = await fetch(`/mcc/api/fs/read?path=${encodeURIComponent(file.path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || "");
        setSelectedFile(file);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const res = await fetch("/mcc/api/fs/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedFile.path, content: fileContent }),
      });
      if (res.ok) {
        alert("Gespeichert!");
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { loadEntries(currentPath); }, []);

  const breadcrumbs = currentPath.split("/").filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Dateiverwaltung</h1>
          <p className="mt-1 text-sm text-zinc-500">Workspace & System-Konfiguration</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadEntries(process.env.WORKSPACE_PATH || process.env.OPENCLAW_ROOT || "/data/.openclaw/workspace")} className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all"><Home className="h-3.5 w-3.5" />Workspace</button>
          <button onClick={() => loadEntries(process.env.OPENCLAW_ROOT || "/data/.openclaw")} className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-400 hover:bg-violet-500/20 transition-all"><Settings className="h-3.5 w-3.5" />System (.openclaw)</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="glass-card flex flex-col overflow-hidden max-h-[70vh]">
          <div className="flex items-center gap-2 border-b border-zinc-800/40 px-4 py-3 text-xs text-zinc-500 overflow-x-auto">
            <Home className="h-3 w-3 shrink-0" />
            {breadcrumbs.map((segment, i) => (
              <span key={`item-${i}`} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="whitespace-nowrap truncate max-w-[80px]">{segment}</span>
              </span>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading && entries.length === 0 ? (
              <div className="space-y-1">{[1,2,3,4,5,6].map((i) => <div key={`skeleton-${i}`} className="h-9 shimmer rounded-lg" />)}</div>
            ) : (
              entries.map((entry, i) => (
                <button
                  key={`file-${entry.path}-${i}`}
                  onClick={() => entry.isDirectory ? loadEntries(entry.path) : loadFile(entry)}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-zinc-800/60"
                >
                  {entry.isDirectory ? <Folder className="h-4 w-4 text-violet-400" /> : <File className="h-4 w-4 text-zinc-500" />}
                  <span className="flex-1 truncate text-zinc-300">{entry.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="glass-card flex flex-col overflow-hidden h-[70vh]">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-800/40 px-5 py-3">
                <div className="flex items-center gap-3">
                  <File className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-zinc-200">{selectedFile.name}</span>
                </div>
                <button onClick={saveFile} disabled={saving} className="flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-violet-400 disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? "Speichert..." : "Speichern"}</button>
              </div>
              <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} className="flex-1 bg-zinc-950/50 p-5 text-xs font-mono text-zinc-300 outline-none resize-none" />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-zinc-900 p-4"><Files className="h-8 w-8 text-zinc-700" /></div>
              <h3 className="text-sm font-medium text-zinc-300">Keine Datei ausgewählt</h3>
              <p className="mt-1 text-xs text-zinc-500 text-pretty max-w-xs">Wähle links eine Datei aus dem Workspace oder den Systemdateien aus, um sie zu bearbeiten.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
