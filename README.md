# Mission Control Center (MCC)
**Repo:** [https://github.com/Jas0nOW/Wanda-MCC](https://github.com/Jas0nOW/Wanda-MCC)

Initiales Next.js 14 Setup für das MCC mit:

- App Router
- Tailwind CSS
- shadcn/ui Basis-Konfiguration
- Basic Auth Middleware
- Dashboard unter `/`
- API Route `/api/tasks` (liest `active_tasks.json`)

## Voraussetzungen

- Node.js 20+
- npm

## Installation

```bash
npm install
```

## Development starten

```bash
npm run dev
```

Danach öffnen: `http://localhost:3000`

## Basic Auth

Default Credentials:

- Username: `jannis`
- Password: `wanda2026`

Optional via ENV überschreiben:

- `MCC_BASIC_AUTH_USER`
- `MCC_BASIC_AUTH_PASS`

## Build & Production

```bash
npm run build
npm run start
```

## Deployment (VPS)

Minimaler Ablauf:

1. Projekt auf den Server kopieren (z. B. per git clone/scp)
2. Im Projektverzeichnis ausführen:
   - `npm install`
   - `npm run build`
3. App starten:
   - `npm run start`
4. Optional über Reverse Proxy (Nginx/Caddy) unter Domain bereitstellen.

## Projektstruktur

```txt
app/
├── app/
│   ├── api/
│   │   ├── system/route.ts
│   │   └── tasks/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/ui/
│   ├── badge.tsx
│   └── card.tsx
├── lib/utils.ts
├── middleware.ts
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```
