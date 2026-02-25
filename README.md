<div align="center">

# WANDA Mission Control Center

**Operational dashboard for observability and control in the WANDA stack**

[![Status](https://img.shields.io/badge/status-active-brightgreen)](../README.md)
[![Next.js](https://img.shields.io/badge/next.js-14-black)](./package.json)
[![Node](https://img.shields.io/badge/node-18%2B-green)](./package.json)

</div>

Mission Control Center (MCC) is the web control plane for WANDA.  
It gives operators one place to inspect runtime health, tasks, memory, and agent activity.

## Key Capabilities

- Real-time dashboard for active processes and operational state
- Agent visibility for connected tools and service bridges
- Browser-first access to memory/log context
- Basic auth support for local and remote deployment

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- shadcn/ui
- Node.js runtime

## Quick Start

```bash
npm install
npm run dev
```

Default dev URL: `http://localhost:3000`.

## Production

```bash
npm run build
npm run start
```

Production start script binds to port `3002` by default.

## Configuration

Create `.env.local` in this directory and configure your runtime paths and auth:

```env
WORKSPACE_PATH=/data/.openclaw/workspace
OPENCLAW_ROOT=/data/.openclaw
OPENCLAW_AGENTS_DIR=/data/.openclaw/agents
MCC_BASIC_AUTH_USER=admin
MCC_BASIC_AUTH_PASS=change_me
```

## Validation

```bash
npm run lint
npm run build
```

## Security Notes

- Never commit `.env` files
- Run behind a reverse proxy with TLS in production
- Rotate basic auth credentials regularly
