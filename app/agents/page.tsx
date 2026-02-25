"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Crown,
  Briefcase,
  Code2,
  Search,
  Shield,
  PenTool,
  Handshake,
  Users,
  Calculator,
  TrendingUp,
  RefreshCw,
  Star,
  Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AgentAPI = {
  id: string;
  name: string;
  model: string;
  fallbacks: string[];
  subagents: string[];
  isDefault: boolean;
};

type AgentDisplay = AgentAPI & {
  role: string;
  layer: "CEO" | "C-Suite" | "Specialist";
  icon: React.ElementType;
  color: string;
};

const AGENT_META: Record<string, { role: string; layer: "CEO" | "C-Suite" | "Specialist"; icon: React.ElementType; color: string }> = {
  wanda: { role: "CEO & Orchestrator", layer: "CEO", icon: Crown, color: "violet" },
  cto: { role: "Tech Lead", layer: "C-Suite", icon: Code2, color: "blue" },
  coo: { role: "Operations", layer: "C-Suite", icon: Briefcase, color: "emerald" },
  cfo: { role: "Finance", layer: "C-Suite", icon: Calculator, color: "amber" },
  cmo: { role: "Marketing", layer: "C-Suite", icon: TrendingUp, color: "pink" },
  cso: { role: "Sales", layer: "C-Suite", icon: Star, color: "orange" },
  builder: { role: "Developer", layer: "Specialist", icon: Code2, color: "cyan" },
  reviewer: { role: "QA", layer: "Specialist", icon: Shield, color: "emerald" },
  scout: { role: "Research", layer: "Specialist", icon: Search, color: "blue" },
  "customer-success": { role: "CS Manager", layer: "Specialist", icon: Users, color: "teal" },
  accountant: { role: "Bookkeeper", layer: "Specialist", icon: Calculator, color: "amber" },
  copywriter: { role: "Content", layer: "Specialist", icon: PenTool, color: "pink" },
  sdr: { role: "Lead Gen", layer: "Specialist", icon: TrendingUp, color: "violet" },
  closer: { role: "AE / Deals", layer: "Specialist", icon: Handshake, color: "emerald" },
  partner: { role: "Partnerships", layer: "Specialist", icon: Handshake, color: "blue" },
  "update-strategist": { role: "System Evolutionist", layer: "Specialist", icon: RefreshCw, color: "blue" },
  "crypto-trader": { role: "Quant Trader", layer: "Specialist", icon: TrendingUp, color: "emerald" },
};

const DELEGATION: Record<string, string[]> = {
  wanda: ["cto", "coo", "cfo", "cmo", "cso"],
  cto: ["builder", "reviewer"],
  coo: ["scout", "customer-success"],
  cfo: ["accountant"],
  cmo: ["copywriter", "scout"],
  cso: ["sdr", "closer", "partner"],
};

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
  violet: { bg: "bg-violet-500/10", text: "text-violet-400", ring: "ring-violet-500/20", glow: "shadow-violet-500/20" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", ring: "ring-blue-500/20", glow: "shadow-blue-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/20", glow: "shadow-emerald-500/20" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/20", glow: "shadow-amber-500/20" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-400", ring: "ring-pink-500/20", glow: "shadow-pink-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", ring: "ring-orange-500/20", glow: "shadow-orange-500/20" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", ring: "ring-cyan-500/20", glow: "shadow-cyan-500/20" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-400", ring: "ring-teal-500/20", glow: "shadow-teal-500/20" },
};

function PyramidCard({ agent, size = "normal" }: { agent: AgentDisplay; size?: "large" | "normal" | "small" }) {
  const Icon = agent.icon;
  const colors = COLOR_MAP[agent.color] ?? COLOR_MAP.violet;
  const delegatesTo = DELEGATION[agent.id] ?? [];

  const sizeClasses = {
    large: "p-5",
    normal: "p-4",
    small: "p-3",
  };
  const iconSize = {
    large: "h-12 w-12",
    normal: "h-10 w-10",
    small: "h-8 w-8",
  };
  const iconInner = {
    large: "h-6 w-6",
    normal: "h-5 w-5",
    small: "h-4 w-4",
  };

  return (
    <Link
      href={`/comms?agent=${agent.id}`}
      className={`glass-card card-hover group block ${sizeClasses[size]} ${size === "large" ? `shadow-lg ${colors.glow}` : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex ${iconSize[size]} shrink-0 items-center justify-center rounded-xl ${colors.bg} ring-1 ${colors.ring}`}>
          <Icon className={`${iconInner[size]} ${colors.text}`} />
        </div>
        <div className="min-w-0">
          <h3 className={`font-semibold capitalize text-zinc-100 ${size === "large" ? "text-base" : "text-sm"}`}>{agent.id}</h3>
          <p className="text-[11px] text-zinc-500">{agent.role}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="px-2 py-0.5 text-[10px]">{agent.model}</Badge>
        <Badge variant={agent.layer === "CEO" ? "default" : "secondary"} className="px-2 py-0.5 text-[10px]">{agent.layer}</Badge>
      </div>
      {delegatesTo.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {delegatesTo.map((sub, i) => (
            <span key={`key-${i}-${sub}`} className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-500 capitalize">{sub}</span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/mcc/api/agents", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const list: AgentDisplay[] = (data.agents ?? []).map((a: AgentAPI, i) => {
            const meta = AGENT_META[a.id] ?? { role: a.name ?? a.id, layer: "Specialist" as const, icon: Bot, color: "violet" };
            return { ...a, ...meta };
          });
          setAgents(list);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const ceo = agents.find((a) => a.layer === "CEO");
  const cSuite = agents.filter((a) => a.layer === "C-Suite");
  const specialists = agents.filter((a) => a.layer === "Specialist");

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Agenten-Hierarchie</h1>
        <p className="mt-1 text-sm text-zinc-500">{agents.length} Agenten in 3 Layern</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="flex justify-center"><div className="glass-card h-32 w-64 shimmer" /></div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={`key-${i}-${`item-${i}`}`} className="glass-card h-28 shimmer" />)}</div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={`key-${i}-${`item-${i}`}`} className="glass-card h-24 shimmer" />)}</div>
        </div>
      ) : (
        <div className="space-y-8">
          {ceo && (
            <div className="flex flex-col items-center">
              <span className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600">Layer 1 — CEO</span>
              <div className="w-full max-w-xs">
                <PyramidCard agent={ceo} size="large" />
              </div>
              <div className="mt-2 h-6 w-px bg-gradient-to-b from-violet-500/40 to-transparent" />
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center justify-center">
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Layer 2 — C-Suite</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {cSuite.map((agent, i) => (
                <PyramidCard key={`key-${i}-${agent.id}`} agent={agent} size="normal" />
              ))}
            </div>
            <div className="mt-3 flex justify-center">
              <div className="h-6 w-px bg-gradient-to-b from-zinc-700/40 to-transparent" />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-center">
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">Layer 3 — Spezialisten</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {specialists.map((agent, i) => (
                <PyramidCard key={`key-${i}-${agent.id}`} agent={agent} size="small" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}