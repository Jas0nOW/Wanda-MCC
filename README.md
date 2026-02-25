<div align="center">
  <h1>🎛️ WANDA Mission Control Center (MCC)</h1>
  <p><strong>The Visual Intelligence Dashboard for the WANDA Ecosystem.</strong></p>
  <a href="https://github.com/Jas0nOW/Wanda-MCC">View Repository</a>
</div>

---

The **Mission Control Center (MCC)** is a modern Next.js 14 web application providing a centralized, visual dashboard for managing the WANDA AI ecosystem. It interfaces directly with the stateless WANDA Central Hub (`localhost:3000`) and the `Vox-Voice` memory systems.

Designed for efficiency and rapid observability, the MCC allows you to monitor running agents, manage tasks, review system logs, and inspect persistent memory items in real-time.

## ✨ Key Features

- **Real-Time Observability:** Monitor active AI tasks, background processes, and open blockers directly on the dashboard.
- **Agent Oversight:** View all connected subagents (e.g., Kraken, n8n, Supabase) and their current activity status.
- **Memory & File Explorer:** Directly browse and search through the global WANDA memory vaults (`workspace/memory`) and system files without leaving the browser.
- **Secure Access:** Built-in Basic Authentication and environment-based path resolution to protect local and VPS deployments.
- **Modern Tech Stack:** Built with Next.js 14 (App Router), Tailwind CSS, and `shadcn/ui` for a responsive, clean, and highly functional interface.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- A running instance of the [WANDA Central Hub](https://github.com/Jas0nOW/WANDA) (for API interactions).

### Local Setup

```bash
# Clone the repository
git clone https://github.com/Jas0nOW/Wanda-MCC.git
cd Wanda-MCC/app

# Install dependencies
npm install

# Setup environment variables (copy from template if available, else standard paths are assumed)
# See Configuration section below

# Start the dev server
npm run dev
```
Open `http://localhost:3000` in your browser.

## 🔐 Configuration & Security

The MCC relies on specific paths to read logs, memory, and tasks. These paths should be defined in a `.env.local` file at the `app/` directory root:

```env
WORKSPACE_PATH=/data/.openclaw/workspace
OPENCLAW_ROOT=/data/.openclaw
OPENCLAW_AGENTS_DIR=/data/.openclaw/agents

# Basic Authentication Credentials
MCC_BASIC_AUTH_USER="jannis"
MCC_BASIC_AUTH_PASS="your_secure_password"
```

## 🏗️ Build & Deployment (VPS)

```bash
# Create an optimized production build
npm run build

# Start the production server
npm run start
```
*Tip: For production usage on a VPS, it is recommended to run the app behind a reverse proxy like Nginx or Caddy with SSL enabled.*

---
*Built under the JANNIS PROTOCOL — The Visual Face of the AI Ecosystem.*
