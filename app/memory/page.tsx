"use client";

import { useEffect, useState, useCallback } from "react";
import { Brain, Search, FileText, BookOpen, Clock, ChevronRight, X, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type MemoryFile = { name: string; path: string; type: string };
type SearchResult = { path: string; name: string; matches: string[] };
type MemorySection = { title: string; content: string };

function parseMemorySections(content: string): MemorySection[] {
  const sections: MemorySection[] = [];
  const lines = content.split("\n");
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
      }
      currentTitle = line.replace("## ", "").trim();
      currentContent = [];
    } else if (currentTitle) {
      currentContent.push(line);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
  }
  return sections;
}

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<"dateien" | "langzeit">("dateien");
  const [memorySections, setMemorySections] = useState<MemorySection[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/mcc/api/fs/list?path=memory");
      if (res.ok) {
        const data = await res.json();
        setFiles(Array.isArray(data.entries) ? data.entries.filter((f: MemoryFile) => f.name.endsWith(".md")) : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFile = async (filePath: string) => {
    setSelectedFile(filePath);
    setIsEditing(false);
    try {
      const res = await fetch(`/mcc/api/fs/read?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setContent(data.content ?? "");
        setEditedContent(data.content ?? "");
      }
    } catch {
      setContent("Fehler beim Laden der Datei.");
    }
  };

  const loadMemory = async () => {
    try {
      const res = await fetch("/mcc/api/fs/read?path=MEMORY.md");
      if (res.ok) {
        const data = await res.json();
        setMemorySections(parseMemorySections(data.content ?? ""));
      }
    } catch {
      setMemorySections([]);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await fetch("/mcc/api/fs/write", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: selectedFile, content: editedContent }),
      });
      setContent(editedContent);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch("/mcc/api/fs/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: searchQuery, path: "memory" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results ?? []);
      }
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => { loadFiles(); loadMemory(); }, [loadFiles]);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Memory</h1>
          <p className="mt-1 text-sm text-zinc-500">Wissen & Langzeit-Gedaechtnis</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-1">
          <button
            onClick={() => setTab("dateien")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${tab === "dateien" ? "bg-violet-500/15 text-violet-400" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <FileText className="mr-1.5 inline h-3 w-3" />Dateien
          </button>
          <button
            onClick={() => setTab("langzeit")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${tab === "langzeit" ? "bg-violet-500/15 text-violet-400" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <BookOpen className="mr-1.5 inline h-3 w-3" />Langzeit
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Memory durchsuchen..."
          className="w-full rounded-lg border border-zinc-800/60 bg-zinc-900/40 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-400" />
          </button>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="glass-card divide-y divide-zinc-800/40">
          <div className="px-5 py-3">
            <span className="text-xs font-medium text-zinc-400">{searchResults.length} Treffer</span>
          </div>
          {searchResults.map((r, i) => (
            <button key={`key-${i}-${r.path}`} onClick={() => loadFile(r.path)} className="w-full px-5 py-3 text-left transition-colors hover:bg-zinc-800/20">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <span className="text-sm font-medium text-zinc-200">{r.name}</span>
              </div>
              {r.matches.slice(0, 2).map((m, i) => (
                <p key={`key-${i}-${`item-${i}`}`} className="mt-1 ml-5.5 text-[11px] text-zinc-500 truncate">{m}</p>
              ))}
            </button>
          ))}
        </div>
      )}

      {tab === "dateien" ? (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="glass-card divide-y divide-zinc-800/40 overflow-hidden">
            <div className="px-4 py-3">
              <span className="text-xs font-medium text-zinc-400">{files.length} Dateien</span>
            </div>
            {loading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`key-${i}-${`item-${i}`}`} className="h-9 shimmer rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto p-2">
                {files.map((file, i) => (
                  <button
                    key={`key-${i}-${file.path}`}
                    onClick={() => loadFile(file.path)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                      selectedFile === file.path
                        ? "bg-violet-500/10 text-violet-400"
                        : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                    }`}
                  >
                    <Brain className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <ChevronRight className="ml-auto h-3 w-3 shrink-0 opacity-40" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card overflow-hidden">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between border-b border-zinc-800/40 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium text-zinc-200">{selectedFile.split("/").pop()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => { setIsEditing(false); setEditedContent(content); }} className="rounded-md px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300">
                          Abbrechen
                        </button>
                        <button
                          onClick={saveFile}
                          disabled={saving}
                          className="flex items-center gap-1.5 rounded-md bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-400 hover:bg-violet-500/25 disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" />{saving ? "..." : "Speichern"}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="rounded-md px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300">
                        Bearbeiten
                      </button>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="h-[500px] w-full resize-none bg-zinc-950/30 p-5 font-mono text-xs text-zinc-300 focus:outline-none"
                  />
                ) : (
                  <div className="max-h-[500px] overflow-y-auto p-5">
                    <pre className="terminal whitespace-pre-wrap text-zinc-400">{content}</pre>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Brain className="mb-3 h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">Datei auswaehlen</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {memorySections.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-16">
              <BookOpen className="mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">Keine MEMORY.md Sektionen gefunden</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {memorySections.map((section, i) => (
                <div key={`key-${i}-${section.title}`} className="glass-card card-hover p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="default" className="text-[10px]">
                      <Clock className="mr-1 h-2.5 w-2.5" />{section.title}
                    </Badge>
                  </div>
                  <pre className="terminal whitespace-pre-wrap text-zinc-400 max-h-40 overflow-y-auto">{section.content}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}