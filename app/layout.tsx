import type { Metadata, Viewport } from "next";
import Link from "next/link";
import {
  Brain,
  Bot,
  CheckSquare,
  Clock3,
  Files,
  LayoutDashboard,
  MessageSquare,
  MessageCircle,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCC — Wanda System",
  description: "Mission Control Center",
  manifest: "/mcc/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MCC",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
};

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agenten", icon: Bot },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/files", label: "Dateien", icon: Files },
  { href: "/cron", label: "Cron Jobs", icon: Clock3 },
  { href: "/comms", label: "Comms", icon: MessageSquare },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/todo", label: "TODO", icon: CheckSquare },
];

async function getGatewayStatus() {
  try {
    const res = await fetch(
      `${process.env.OPENCLAW_GATEWAY_URL ?? "http://localhost:63362"}/health`,
      { cache: "no-store" }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const online = await getGatewayStatus();

  return (
    <html lang="de">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased overflow-x-hidden max-w-[100vw]">
        <div className="flex min-h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-zinc-800/60 glass md:flex">
            <div className="flex items-center gap-3 border-b border-zinc-800/60 px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                <Zap className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-zinc-100">Mission Control</p>
                <p className="text-[10px] font-medium text-zinc-500">Wanda System v5.0</p>
              </div>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`key-${i}-${item.href}`}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-all duration-150 hover:bg-zinc-800/60 hover:text-zinc-100"
                  >
                    <Icon className="h-[18px] w-[18px] text-zinc-500 transition-colors group-hover:text-violet-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-zinc-800/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-violet-400">J</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300 truncate">Jannis</p>
                  <p className="text-[10px] text-zinc-500">Administrator</p>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex min-h-screen flex-1 flex-col md:pl-[260px] min-w-0 overflow-x-hidden">
            <header className="sticky top-0 z-20 border-b border-zinc-800/60 glass px-4 py-3 md:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:hidden">
                  <Zap className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-semibold">MCC</span>
                </div>
                <div className="hidden md:block" />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-full border border-zinc-800/60 bg-zinc-900/60 px-3 py-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${online ? "bg-emerald-500 pulse-online" : "bg-red-500 pulse-offline"}`} />
                    <span className="text-xs text-zinc-400">{online ? "Online" : "Offline"}</span>
                    {online ? <Wifi className="h-3 w-3 text-emerald-500/70" /> : <WifiOff className="h-3 w-3 text-red-500/70" />}
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6 min-w-0 overflow-x-hidden">{children}</main>
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/mcc/sw.js')}`,
          }}
        />
      </body>
    </html>
  );
}
