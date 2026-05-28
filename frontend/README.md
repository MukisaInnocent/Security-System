# Security System Frontend

This workspace contains the Next.js frontend for the Security System platform, including the mobile-first guard interface, supervisor dashboards, analytics screens, client portal, and PWA support.

## Getting Started

Run the frontend locally from this folder:

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default. The workspace uses a custom local dev server, so `npm run dev` is the primary command here. If you want the standard Next.js development server, use `npm run dev:local`.

## Key areas

- `src/app/page.tsx` — landing/login experience
- `src/app/(app)` — authenticated dashboard routes for guards, supervisors, clients, analytics, and admin areas
- `src/lib` — API client, auth context, offline database, sync, and chat helpers
- `public/` — PWA assets, service worker, and manifest

## Local workflow

1. Copy the local frontend environment template first:
   `cp .env.example .env.local`
2. Start the backend first so the frontend can talk to API endpoints on `http://localhost:3001`.
3. Run `npm run dev` from this folder to launch the local UI.
4. Verify the app with browser testing and offline/PWA checks as needed.

## Useful references

- [project_documentation.md](../project_documentation.md) — complete workspace architecture and route coverage
- [Testing_Credentials_Report.md](../Testing_Credentials_Report.md) — demo accounts and biometric test values
