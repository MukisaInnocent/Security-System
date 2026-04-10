# Security System MVP

A **Progressive Web App (PWA)** for digital guard deployment, GPS-based attendance, incident reporting, and real-time monitoring.

## 🏗️ Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Backend | NestJS + Prisma ORM |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (Bearer token) |
| Offline | Service Worker + IndexedDB |

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
# API runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

## 📋 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@security.com | admin123 |
| Ops Manager | ops@security.com | ops123 |
| Supervisor | supervisor@security.com | sup123 |
| Guard 1 | guard1@security.com | guard123 |
| Guard 2 | guard2@security.com | guard123 |
| Client | client@company.com | client123 |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user profile |
| GET/POST | /api/users | List / Create users |
| GET/POST | /api/sites | List / Create sites |
| GET/POST | /api/deployments | List / Create shift assignments |
| POST | /api/attendance/check-in | GPS check-in |
| POST | /api/attendance/check-out | GPS check-out |
| POST | /api/attendance/sync | Sync offline records |
| GET/POST | /api/incidents | List / Create incidents |
| POST | /api/incidents/sync | Sync offline incidents |
| GET | /api/dashboard/stats | Dashboard statistics |

## 📱 PWA Features

- **Installable** — "Add to Home Screen" on mobile
- **Offline-first** — Check-in/out and incident reports work offline
- **Background sync** — Data syncs automatically when online
- **GPS geofencing** — Validates guard location against site radius

## 🔐 Roles

- **Admin** — Full access
- **Ops Manager** — Manage sites, users, deployments
- **Supervisor** — Manage deployments, view reports
- **Guard** — Check-in/out, report incidents (mobile-first UI)
- **Client** — Read-only dashboard access
