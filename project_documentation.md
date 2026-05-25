# DDBMS — Complete Project Documentation

> **Digital Deployment & Business Management System v1.1.4**
> Comprehensive technical documentation — generated 25 May 2026

---

## 1. Executive Summary

DDBMS is an **enterprise-grade, multi-tenant security workforce management platform** built as a Progressive Web App (PWA). It manages the full lifecycle of private security operations: guard deployment & scheduling, GPS-validated attendance, incident management, armoury control, payroll, procurement, logistics, finance, food supplier coordination, real-time chat, and automated reporting.

### Project Statistics

| Metric | Value |
|--------|-------|
| Backend source files | **93 TypeScript files** (~200 KB) |
| Frontend source files | **39 TSX/TS files** (~340 KB) |
| Database models | **35 Prisma models** (1,045-line schema) |
| Backend modules | **26 NestJS modules** |
| Frontend pages/routes | **30+ routes** |
| API endpoints | **~100 REST endpoints** + WebSocket |
| User roles | **15 distinct roles** |
| Seed data | 30 days of historical data, 20+ users |
| Git commits | 1 (Initial commit) |

---

## 2. Technology Stack

### Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | [Next.js](file:///c:/Users/USER/Music/security-system/frontend/package.json) (App Router) | 16.2.1 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS + Vanilla CSS (Glassmorphism) | ^4 |
| Icons | lucide-react | ^1.7.0 |
| Charts | Chart.js + react-chartjs-2 | ^4.5.1 / ^5.3.1 |
| Dates | date-fns | ^4.1.0 |
| Real-time | socket.io-client | ^4.8.3 |
| PWA | Custom Service Worker + IndexedDB | — |

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | [NestJS](file:///c:/Users/USER/Music/security-system/backend/package.json) | ^10.3.0 |
| Language | TypeScript | ^5.3.3 |
| ORM | Prisma Client | ^5.9.0 |
| Database | PostgreSQL (prod) / SQLite (dev supported) | — |
| Auth | JWT + Passport.js | ^10.2.0 |
| Passwords | bcrypt | ^5.1.1 |
| Validation | class-validator + class-transformer | ^0.14.1 |
| File Upload | Multer | ^1.4.5 |
| WebSocket | Socket.IO (via @nestjs/websockets) | ^4.8.3 |
| Static Files | @nestjs/serve-static | ^4.0.0 |

### Infrastructure

| Component | Details |
|-----------|---------|
| Database URL | `postgresql://postgres:root@localhost:5432/Security?schema=public` |
| Backend port | 3001 (configurable via `PORT` env) |
| Frontend port | 3000 (Next.js default) |
| CORS | Dynamic origin enabled for LAN testing |
| JWT expiration | 24 hours |
| Upload directory | `./uploads` |

---

## 3. Architecture Overview

```mermaid
graph TB
    subgraph "Frontend — Next.js 16 PWA"
        LOGIN[Login Page]
        GUARD[Guard Panel<br/>Mobile-First]
        SUP[Supervisor Panel]
        DASH[Admin Dashboard]
        ANA[Analytics/M&E]
        CLIENT[Client Portal]
        HR_UI[HR Module]
        FIN_UI[Finance Hub]
        ARM_UI[Armoury]
        PROC_UI[Procurement]
        LOG_UI[Logistics]
        FOOD_UI[Food Supplier]
        CHAT_UI[Chat System]
        REG_UI[Regional View]
    end

    subgraph "Backend — NestJS REST + WebSocket"
        API[API Gateway<br/>JWT + RBAC<br/>port 3001]
        AUTH[Auth]
        USR[Users]
        SITE[Sites]
        POST[Posts]
        REGION[Regions]
        DEP[Deployments]
        ATT[Attendance]
        INC[Incidents]
        DASHB[Dashboard]
        ANALYTICS[Analytics]
        NOTIF[Notifications]
        HR_BE[HR]
        ARM_BE[Armoury]
        PROC_BE[Procurement]
        LOG_BE[Logistics]
        FIN_BE[Finance]
        PAY[Payroll]
        SPOT[Spot Check]
        FOOD_BE[Food Supplier]
        CHAT_BE[Chat + Gateway]
        RPT[Reports]
        CS[Change Sheets]
        PM[Personnel Movements]
        SD[Special Duty]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
        IDB[IndexedDB<br/>Offline Cache]
    end

    LOGIN --> API
    GUARD --> API
    SUP --> API
    DASH --> API
    ANA --> API
    CLIENT --> API
    HR_UI --> API
    FIN_UI --> API
    ARM_UI --> API
    PROC_UI --> API
    LOG_UI --> API
    FOOD_UI --> API
    CHAT_UI --> API
    REG_UI --> API

    API --> AUTH & USR & SITE & POST & REGION
    API --> DEP & ATT & INC & DASHB
    API --> ANALYTICS & NOTIF & HR_BE & ARM_BE
    API --> PROC_BE & LOG_BE & FIN_BE & PAY
    API --> SPOT & FOOD_BE & CHAT_BE & RPT
    API --> CS & PM & SD

    AUTH --> DB
    USR --> DB
    DEP --> DB
    CHAT_BE --> DB

    GUARD -.-> IDB
```

---

## 4. Role-Based Access Control (RBAC)

Defined in [role.enum.ts](file:///c:/Users/USER/Music/security-system/backend/src/common/enums/role.enum.ts):

| # | Role | Code | Primary Interface | Key Capabilities |
|---|------|------|-------------------|------------------|
| 1 | **Admin** | `ADMIN` | Dashboard + All Modules | Full system control |
| 2 | **CEO** | `CEO` | Dashboard + All Modules | Read-heavy, strategic overview |
| 3 | **Ops Manager** | `OPS_MANAGER` | Dashboard + Operations | Deployments, sites, incidents |
| 4 | **Regional Manager** | `REGIONAL_MANAGER` | Regional View | Region-scoped operations |
| 5 | **HR** | `HR` | HR Module | Guard profiles, leave, payroll |
| 6 | **Finance** | `FINANCE` | Finance Hub | Contracts, invoices, payments |
| 7 | **Armoury Officer** | `ARMOURY_OFFICER` | Armoury | Weapons, ammunition, issuances |
| 8 | **Procurement** | `PROCUREMENT_OFFICER` | Procurement | Suppliers, POs, purchase requests |
| 9 | **Logistics** | `LOGISTICS_OFFICER` | Logistics | Distributions, inventory, transfers |
| 10 | **Supervisor** | `SUPERVISOR` | Supervisor Panel | Live monitoring, spot checks |
| 11 | **Guard** | `GUARD` | Guard Panel (PWA) | Check-in/out, incidents, special duty |
| 12 | **Client** | `CLIENT` | Client Portal | Read-only site/attendance/incidents |
| 13 | **M&E** | `M_AND_E` | Analytics | Trends, performance, CSV export |
| 14 | **Food Supplier** | `FOOD_SUPPLIER` | Food Supplier Panel | Meal verification, deliveries |

### Auth Flow
- [auth.service.ts](file:///c:/Users/USER/Music/security-system/backend/src/auth/auth.service.ts) — `bcrypt.compare` password validation → JWT sign → AuditLog entry
- [jwt.strategy.ts](file:///c:/Users/USER/Music/security-system/backend/src/auth/jwt.strategy.ts) — Passport JWT strategy
- [roles.guard.ts](file:///c:/Users/USER/Music/security-system/backend/src/common/guards/roles.guard.ts) — Reflector-based RBAC guard
- [auth.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/lib/auth.tsx) — React context provider (`useAuth` hook)

---

## 5. Database Schema (35 Models)

Full schema: [schema.prisma](file:///c:/Users/USER/Music/security-system/backend/prisma/schema.prisma) (1,045 lines)

### Core Organisation

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Tenant` | Multi-tenant root | `name`, `code` (unique), `currency` (UGX) |
| `Region` | Geographic grouping | `name`, `tenantId`, `managerId` → User |
| `User` | All system users | `email`, `role`, `staffId`, `tenantId`, `nationalId`, `emergencyContact` |

### HR & Personnel

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `GuardProfile` | Extended guard data | `weaponAuthorised`, `biometricPin`, `monthlySalary`, `primarySiteId`, `paymentMode`, `bankDetails` |
| `LeaveRequest` | Leave workflow | `leaveType`, `status` (PENDING→APPROVED/REJECTED), `approverId` |
| `PersonnelMovement` | Transfers & recalls | `movementType`, `fromSiteId`, `toSiteId`, `effectiveDate` |
| `ChangeSheet` | Salary/rank/shift changes | `changeType`, `amount`, `evidence`, `previousValue`, `newValue` |

### Operations

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Site` | Physical locations | `latitude`, `longitude`, `geofenceRadius`, `regionId`, `clientId` |
| `Post` | Guard stations within sites | `shiftType`, `guardsRequired`, `weaponRequired` |
| `Deployment` | Shift assignments | `guardId`, `siteId`, `postId`, `shiftType`, `status`, `biometricVerified`, GPS coords |
| `Attendance` | Check-in/out logs | `type`, `timestamp`, GPS coords, `isWithinGeofence`, `biometricVerified`, `syncedFromOffline` |
| `Incident` | Security events | `category`, `severity`, `status` workflow, `assignedToId`, `resolutionNote`, `mediaUrl` |

### Armoury

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `WeaponRecord` | Firearms registry | `serialNumber`, `weaponType`, `status`, `licenceNumber`, `licenceExpiry` |
| `WeaponIssuance` | Checkout/return log | `weaponId`, `guardId`, `roundsIssued`, `returnCondition`, `isReturned` |
| `AmmunitionStock` | Stock per site | `siteId`, `calibre`, `type`, `quantity`, `minStock` |

### Procurement & Logistics

| Model | Purpose |
|-------|---------|
| `Supplier` | Vendor directory |
| `PurchaseRequest` | Internal requests |
| `PurchaseOrder` | Confirmed orders |
| `OrderItem` | Line items in POs |
| `AssetDistribution` | Equipment dispatches |
| `SiteInventory` | Per-site equipment stock |

### Finance

| Model | Purpose |
|-------|---------|
| `Contract` | Client billing agreements |
| `ContractSite` | Contract–Site mapping |
| `Invoice` | Monthly billing records |
| `Payment` | Payment tracking |
| `ClientSite` | Client–Site mapping |

### Special Operations

| Model | Purpose |
|-------|---------|
| `SpecialDuty` | VIP, event, emergency assignments |
| `SpecialDutyPersonnel` | Per-guard assignment + confirmation |
| `PayrollRecord` | Monthly payroll computation |
| `SpotCheck` | Surprise field audits |
| `GuardCharge` | Disciplinary charges |
| `DeploymentVoid` | Fraud-flagged deployment nullification |

### Food Supplier

| Model | Purpose |
|-------|---------|
| `FoodSupplierAccount` | Supplier profile |
| `FoodSupplierSite` | Supplier–Site links with meal pricing |
| `MealDelivery` | Meal session records |
| `MealVerification` | Per-guard meal verification |

### Communication

| Model | Purpose |
|-------|---------|
| `Conversation` | Chat threads (DIRECT, GROUP, SITE, INCIDENT, BROADCAST) |
| `ConversationParticipant` | Thread membership |
| `Message` | Chat messages (TEXT, IMAGE, SYSTEM) |
| `MessageReadStatus` | Read receipts |

### System

| Model | Purpose |
|-------|---------|
| `Notification` | In-app alerts (ALERT, INFO, WARNING) |
| `AuditLog` | Full audit trail (CREATE, UPDATE, DELETE, LOGIN, etc.) |
| `DeploymentReport` | Generated reports (DAILY_COVERAGE, NIGHT_SHIFT, etc.) |

---

## 6. Backend Modules (26 Modules)

All registered in [app.module.ts](file:///c:/Users/USER/Music/security-system/backend/src/app.module.ts):

### Core Modules

| Module | Directory | Key Service Size | API Prefix |
|--------|-----------|------------------|------------|
| **Prisma** | [prisma/](file:///c:/Users/USER/Music/security-system/backend/src/prisma) | Shared DB service | — |
| **Auth** | [auth/](file:///c:/Users/USER/Music/security-system/backend/src/auth) | 1.6 KB | `/api/auth` |
| **Users** | [users/](file:///c:/Users/USER/Music/security-system/backend/src/users) | 3.1 KB | `/api/users` |
| **Sites** | [sites/](file:///c:/Users/USER/Music/security-system/backend/src/sites) | — | `/api/sites` |
| **Regions** | [regions/](file:///c:/Users/USER/Music/security-system/backend/src/regions) | 2.3 KB | `/api/regions` |
| **Posts** | [posts/](file:///c:/Users/USER/Music/security-system/backend/src/posts) | 1.2 KB | `/api/posts` |

### Operations Modules

| Module | Directory | Key Service Size | API Prefix |
|--------|-----------|------------------|------------|
| **Deployments** | [deployments/](file:///c:/Users/USER/Music/security-system/backend/src/deployments) | 3.3 KB | `/api/deployments` |
| **Attendance** | [attendance/](file:///c:/Users/USER/Music/security-system/backend/src/attendance) | 6.0 KB | `/api/attendance` |
| **Incidents** | [incidents/](file:///c:/Users/USER/Music/security-system/backend/src/incidents) | 6.9 KB | `/api/incidents` |
| **Dashboard** | [dashboard/](file:///c:/Users/USER/Music/security-system/backend/src/dashboard) | 13.4 KB | `/api/dashboard` |
| **Analytics** | [analytics/](file:///c:/Users/USER/Music/security-system/backend/src/analytics) | 6.5 KB | `/api/analytics` |
| **Reports** | [reports/](file:///c:/Users/USER/Music/security-system/backend/src/reports) | 8.9 KB | `/api/reports` |

### HR & Personnel Modules

| Module | Directory | Key Service Size | API Prefix |
|--------|-----------|------------------|------------|
| **HR** | [hr/](file:///c:/Users/USER/Music/security-system/backend/src/hr) | 4.7 KB | `/api/hr` |
| **Payroll** | [payroll/](file:///c:/Users/USER/Music/security-system/backend/src/payroll) | 6.2 KB | `/api/payroll` |
| **Change Sheets** | [change-sheets/](file:///c:/Users/USER/Music/security-system/backend/src/change-sheets) | 1.9 KB | `/api/change-sheets` |
| **Personnel Movements** | [personnel-movements/](file:///c:/Users/USER/Music/security-system/backend/src/personnel-movements) | 2.7 KB | `/api/personnel-movements` |

### Asset & Supply Modules

| Module | Directory | Key Service Size | API Prefix |
|--------|-----------|------------------|------------|
| **Armoury** | [armoury/](file:///c:/Users/USER/Music/security-system/backend/src/armoury) | 5.9 KB | `/api/armoury` |
| **Procurement** | [procurement/](file:///c:/Users/USER/Music/security-system/backend/src/procurement) | 4.3 KB | `/api/procurement` |
| **Logistics** | [logistics/](file:///c:/Users/USER/Music/security-system/backend/src/logistics) | 3.6 KB | `/api/logistics` |

### Finance & Billing

| Module | Directory | Key Service Size | API Prefix |
|--------|-----------|------------------|------------|
| **Finance** | [finance/](file:///c:/Users/USER/Music/security-system/backend/src/finance) | 7.2 KB | `/api/finance` |

### Specialized Modules

| Module | Directory | Key Service Size | API Prefix |
|--------|-----------|------------------|------------|
| **Special Duty** | [special-duty/](file:///c:/Users/USER/Music/security-system/backend/src/special-duty) | 5.8 KB | `/api/special-duty` |
| **Spot Check** | [spot-check/](file:///c:/Users/USER/Music/security-system/backend/src/spot-check) | 8.2 KB | `/api/spot-check` |
| **Food Supplier** | [food-supplier/](file:///c:/Users/USER/Music/security-system/backend/src/food-supplier) | 7.0 KB | `/api/food-supplier` |
| **Notifications** | [notifications/](file:///c:/Users/USER/Music/security-system/backend/src/notifications) | 1.3 KB | `/api/notifications` |
| **Chat** | [chat/](file:///c:/Users/USER/Music/security-system/backend/src/chat) | 17.2 KB (+ 6.7 KB gateway) | `/api/chat` + WebSocket |

---

## 7. API Endpoints (~100 endpoints)

Full client: [api.ts](file:///c:/Users/USER/Music/security-system/frontend/src/lib/api.ts) (295 lines)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Email/password login → JWT |
| `GET` | `/api/auth/me` | Get current user profile |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List users (filterable by role) |
| `POST` | `/api/users` | Create user |
| `PATCH` | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Delete user |

### Sites & Regions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/sites` | List/Create sites |
| `PATCH` | `/api/sites/:id` | Update site |
| `GET/POST` | `/api/regions` | List/Create regions |
| `GET` | `/api/regions/:id` | Get region details |
| `GET` | `/api/regions/:id/dashboard` | Region dashboard |
| `PATCH` | `/api/regions/:id` | Update region |
| `GET/POST` | `/api/posts` | List/Create posts |
| `PATCH` | `/api/posts/:id` | Update post |

### Deployments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/deployments` | List (filterable by guard, site, date, status) |
| `POST` | `/api/deployments` | Create deployment |
| `PATCH` | `/api/deployments/:id` | Update deployment |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/attendance` | List attendance records |
| `POST` | `/api/attendance/check-in` | GPS check-in |
| `POST` | `/api/attendance/check-out` | GPS check-out |
| `POST` | `/api/attendance/sync` | Sync offline records |

### Incidents
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/incidents` | List/Create (FormData for media) |
| `PATCH` | `/api/incidents/:id/assign` | Assign to investigator |
| `PATCH` | `/api/incidents/:id/resolve` | Resolve with note |
| `PATCH` | `/api/incidents/:id/status` | Update status |
| `POST` | `/api/incidents/sync` | Sync offline incidents |

### Dashboard (Role-specific)
| Method | Endpoint | Access |
|--------|----------|--------|
| `GET` | `/api/dashboard/stats` | Admin/Ops stats |
| `GET` | `/api/dashboard/guard` | Guard personal dashboard |
| `GET` | `/api/dashboard/supervisor` | Supervisor overview |
| `GET` | `/api/dashboard/client` | Client-scoped dashboard |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/attendance-trend` | 30-day attendance trends |
| `GET` | `/api/analytics/incident-trend` | 30-day incident trends |
| `GET` | `/api/analytics/guard-performance` | Per-guard metrics |
| `GET` | `/api/analytics/site-summary` | Per-site stats |
| `GET` | `/api/analytics/export` | CSV export |

### HR
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hr/guards` | List guard profiles |
| `GET` | `/api/hr/guards/:id` | Guard profile detail |
| `POST` | `/api/hr/guards/:id/profile` | Upsert guard profile |
| `PATCH` | `/api/hr/guards/:id/weapon-authorisation` | Toggle weapon auth |
| `GET` | `/api/hr/weapon-authorisation` | Weapon auth registry |
| `GET/POST` | `/api/hr/leave-requests` | List/Create leave |
| `PATCH` | `/api/hr/leave-requests/:id/approve` | Approve/reject |

### Armoury
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/armoury/weapons` | Weapon CRUD |
| `GET` | `/api/armoury/weapons/:id` | Weapon detail |
| `PATCH` | `/api/armoury/weapons/:id` | Update weapon |
| `GET/POST` | `/api/armoury/issuances` | Issue/list weapon issuances |
| `PATCH` | `/api/armoury/issuances/:id/return` | Return weapon |
| `GET/POST` | `/api/armoury/ammunition` | Ammo stock CRUD |
| `GET` | `/api/armoury/reports/licence-expiry` | Expiring licences |

### Procurement
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/procurement/suppliers` | Supplier CRUD |
| `PATCH` | `/api/procurement/suppliers/:id` | Update supplier |
| `GET/POST` | `/api/procurement/requests` | Purchase request CRUD |
| `PATCH` | `/api/procurement/requests/:id/approve` | Approve/reject |
| `GET/POST` | `/api/procurement/orders` | Purchase order CRUD |
| `PATCH` | `/api/procurement/orders/:id/deliver` | Confirm delivery |

### Logistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/logistics/distributions` | Distribution CRUD |
| `GET` | `/api/logistics/inventory` | Site inventory |
| `GET` | `/api/logistics/alerts` | Low stock alerts |
| `POST` | `/api/logistics/transfers` | Inter-site transfer |

### Finance
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/finance/contracts` | Contract CRUD |
| `GET` | `/api/finance/contracts/:id` | Contract detail |
| `GET` | `/api/finance/contracts/expiring` | Expiring contracts |
| `PATCH` | `/api/finance/contracts/:id` | Update contract |
| `GET` | `/api/finance/invoices` | List invoices |
| `POST` | `/api/finance/invoices/generate` | Auto-generate invoices |
| `PATCH` | `/api/finance/invoices/:id` | Update invoice |
| `POST` | `/api/finance/invoices/:id/payment` | Record payment |
| `GET` | `/api/finance/reports/monthly` | Monthly report |
| `GET` | `/api/finance/reports/contract-vs-actual` | Variance analysis |

### Payroll
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payroll` | List records |
| `GET` | `/api/payroll/guard/:id` | Guard payroll history |
| `GET` | `/api/payroll/guard/:id/current` | Current month |
| `POST` | `/api/payroll/generate` | Generate payroll run |
| `PATCH` | `/api/payroll/:id/approve` | Approve payroll |
| `GET` | `/api/payroll/reports/monthly` | Monthly report |

### Special Duty
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/special-duty` | List/Create |
| `GET` | `/api/special-duty/:id` | Detail |
| `PATCH` | `/api/special-duty/:id/respond` | Guard accept/decline |
| `PATCH` | `/api/special-duty/:id/attendance` | Mark attendance |
| `PATCH` | `/api/special-duty/:id/complete` | Complete duty |
| `PATCH` | `/api/special-duty/:id/cancel` | Cancel with reason |

### Spot Check & Discipline
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/spot-check/active-guards` | Guards on duty at site |
| `GET/POST` | `/api/spot-check` | List/Record spot checks |
| `GET/POST` | `/api/spot-check/charges` | List/Raise charges |
| `PATCH` | `/api/spot-check/charges/:id/status` | Update charge |
| `POST` | `/api/spot-check/void` | Initiate deployment void |
| `PATCH` | `/api/spot-check/void/:id/approve` | Approve/reject void |

### Food Supplier
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/food-supplier/headcount` | Guards on duty at site |
| `POST` | `/api/food-supplier/verify` | Verify meal delivery |
| `PATCH` | `/api/food-supplier/session/:id/end` | End meal session |
| `GET` | `/api/food-supplier/deliveries` | Delivery history |

### Chat (REST + WebSocket)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/chat/conversations` | List/Create conversations |
| `GET` | `/api/chat/conversations/:id` | Conversation detail |
| `GET/POST` | `/api/chat/conversations/:id/messages` | Messages CRUD |
| `PATCH` | `/api/chat/conversations/:id/read` | Mark read |
| `GET` | `/api/chat/unread-count` | Unread count |
| `GET` | `/api/chat/contacts` | Contacts list |
| `GET` | `/api/chat/context/:type/:id` | Contextual chat |
| `POST` | `/api/chat/broadcast` | Broadcast message |

WebSocket gateway: [chat.gateway.ts](file:///c:/Users/USER/Music/security-system/backend/src/chat/chat.gateway.ts) (Socket.IO on `/chat` namespace)

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | All user notifications |
| `GET` | `/api/notifications/unread-count` | Unread count |
| `PATCH` | `/api/notifications/:id/read` | Mark read |
| `PATCH` | `/api/notifications/read-all` | Mark all read |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/reports/generate-daily` | Generate daily report |
| `POST` | `/api/reports/generate-night-shift` | Night shift report |
| `GET` | `/api/reports/coverage` | Coverage statistics |
| `GET` | `/api/reports/call-card` | Call card data |
| `GET` | `/api/reports/absent-guards` | Absent guards |
| `POST` | `/api/reports/:id/send` | Send to recipients |
| `GET` | `/api/reports` | List reports |
| `GET` | `/api/reports/:id` | Report detail |

### Change Sheets & Personnel Movements
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/change-sheets` | List/Create |
| `GET` | `/api/change-sheets/:id` | Detail |
| `PATCH` | `/api/change-sheets/:id/approve` | Approve/reject |
| `GET/POST` | `/api/personnel-movements` | List/Create |
| `PATCH` | `/api/personnel-movements/:id/approve` | Approve/reject |
| `PATCH` | `/api/personnel-movements/:id/complete` | Mark complete |

---

## 8. Frontend Pages & Routes

### Application Layout
[layout.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/layout.tsx) — 446 lines, includes:
- Collapsible sidebar with role-based navigation (6 sections: Main, Operations, HR & Payroll, Assets & Inventory, Finance, System Config)
- Notification bell with unread badge (polling every 30s)
- Dark/light theme toggle
- Online/offline status indicator
- User profile card with role display
- Mobile hamburger header with safe-area-inset support
- Chat widget integration

### Page Inventory

#### Role-Specific Dashboards

| Route | File | Size | Access |
|-------|------|------|--------|
| `/` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/page.tsx) | 7.3 KB | Login page |
| `/dashboard` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/dashboard/page.tsx) | 9.2 KB | Admin, CEO, Ops |
| `/guard` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/guard/page.tsx) | 24.5 KB | Guards |
| `/supervisor` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/supervisor/page.tsx) | 10.3 KB | Supervisors |
| `/client` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/client/page.tsx) | 16.8 KB | Clients |
| `/analytics` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/analytics/page.tsx) | 13.0 KB | Admin, M&E |
| `/regional` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/regional/page.tsx) | 5.6 KB | Regional Mgrs |
| `/food-supplier` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/food-supplier/page.tsx) | 6.1 KB | Food suppliers |

#### Operations Pages

| Route | File | Size |
|-------|------|------|
| `/admin/deployments` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/admin/deployments/page.tsx) | 9.1 KB |
| `/admin/attendance` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/admin/attendance/page.tsx) | 3.9 KB |
| `/admin/incidents` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/admin/incidents/page.tsx) | 9.4 KB |
| `/admin/spot-check` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/admin/spot-check/page.tsx) | 8.4 KB |
| `/admin/special-duty` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/admin/special-duty/page.tsx) | 7.3 KB |
| `/admin/reports` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/admin/reports/page.tsx) | 11.7 KB |

#### HR & Payroll Pages

| Route | File | Size |
|-------|------|------|
| `/hr/guards` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/hr/guards/page.tsx) | 4.4 KB |
| `/hr/guards/[id]` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/hr/guards/[id]/page.tsx) | 10.7 KB |
| `/hr/leave` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/hr/leave/page.tsx) | 6.5 KB |
| `/hr/payroll` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/hr/payroll/page.tsx) | 6.8 KB |
| `/hr/weapons` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/hr/weapons/page.tsx) | 5.4 KB |
| `/hr/change-sheets` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/hr/change-sheets/page.tsx) | 9.1 KB |
| `/hr/movements` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/hr/movements/page.tsx) | 10.3 KB |

#### Asset & Finance Pages

| Route | File | Size |
|-------|------|------|
| `/armoury` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/armoury/page.tsx) | 4.3 KB |
| `/procurement` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/procurement/page.tsx) | 8.2 KB |
| `/logistics` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/logistics/page.tsx) | 6.7 KB |
| `/finance` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/finance/page.tsx) | 8.0 KB |

#### System Config Pages

| Route | File | Size |
|-------|------|------|
| `/admin/users` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/admin/users/page.tsx) | 8.9 KB |
| `/admin/sites` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/admin/sites/page.tsx) | 8.0 KB |

#### Communication

| Route | File | Size |
|-------|------|------|
| `/chat` | [page.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/app/(app)/chat/page.tsx) | 30.0 KB |

#### Other

| Route | File | Description |
|-------|------|-------------|
| `/offline` | [offline/](file:///c:/Users/USER/Music/security-system/frontend/src/app/offline) | Offline fallback page |

---

## 9. Frontend Library Layer

### API Client
[api.ts](file:///c:/Users/USER/Music/security-system/frontend/src/lib/api.ts) — Singleton `ApiClient` class (295 lines):
- Token management via `localStorage`
- Auto-detects API base URL from hostname (supports LAN testing)
- `FormData` support for file uploads
- ~100 method wrappers covering all backend endpoints

### Auth Context
[auth.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/lib/auth.tsx) — React context:
- `useAuth()` hook → `{ user, loading, login, logout, isRole }`
- Auto-validates stored JWT on mount
- `isRole(...roles)` helper for role checks

### Offline Database
[db.ts](file:///c:/Users/USER/Music/security-system/frontend/src/lib/db.ts) — IndexedDB wrapper (190 lines):
- **Stores**: `offlineQueue`, `cachedData`, `chatQueue`
- Queue operations: `addToOfflineQueue`, `getUnsynced`, `markSynced`, `clearSynced`
- Chat queue: `addChatToQueue`, `getUnsentChatMessages`, `markChatMessageSent`
- Data cache: `cacheData`, `getCachedData`

### Sync Service
[sync.ts](file:///c:/Users/USER/Music/security-system/frontend/src/lib/sync.ts) — Background data synchronization:
- `syncOfflineData()` — syncs attendance + incidents from IndexedDB
- `setupOnlineSync()` — listens for `online` event, Service Worker messages, and periodic 30s interval
- Mutex via `syncInProgress` flag

### Chat Service
[chat.ts](file:///c:/Users/USER/Music/security-system/frontend/src/lib/chat.ts) — Socket.IO client wrapper (4.4 KB)

### Components

| Component | File | Size | Purpose |
|-----------|------|------|---------|
| Providers | [Providers.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/components/Providers.tsx) | 1.2 KB | AuthProvider wrapper |
| ChatWidget | [ChatWidget.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/components/ChatWidget.tsx) | 1.7 KB | Floating chat button |
| ContextualChat | [ContextualChat.tsx](file:///c:/Users/USER/Music/security-system/frontend/src/components/ContextualChat.tsx) | 7.3 KB | Context-linked chat panel |

---

## 10. PWA / Offline Architecture

### Service Worker
[sw.js](file:///c:/Users/USER/Music/security-system/frontend/public/sw.js) (144 lines):
- **Localhost guard** — disabled on `localhost` to prevent dev caching
- **Cache strategies**:
  - API: Network-first, cache fallback
  - Static assets (JS, CSS, images): Cache-first, network fallback
  - HTML pages: Network-first, cache fallback, `/offline` fallback
- **Background sync** — listens for `sync-attendance` and `sync-incidents` tags
- **Push notifications** — skeleton for `push` and `notificationclick` events

### Manifest
[manifest.json](file:///c:/Users/USER/Music/security-system/frontend/public/manifest.json)

### Offline Flow
1. Guard attempts check-in/out while offline
2. Data saved to IndexedDB via `addToOfflineQueue()`
3. `syncOfflineData()` fires when `online` event detected or on 30s interval
4. Batch POST to `/api/attendance/sync` or `/api/incidents/sync`
5. Records marked as synced in IndexedDB, then cleared

---

## 11. Key Business Logic

### Geofencing (Haversine)
The attendance service validates GPS coordinates against site `latitude`, `longitude`, and `geofenceRadius` using the Haversine distance formula. Non-compliant check-ins are flagged with `isWithinGeofence: false`.

### Deployment Lifecycle
```
SCHEDULED → ACTIVE → COMPLETED
              ↓
          CANCELLED / VOIDED
```
Voided deployments go through `DeploymentVoid` with approval workflow (PENDING → APPROVED/REJECTED).

### Incident Workflow
```
OPEN → INVESTIGATING → IN_PROGRESS → RESOLVED → CLOSED
```
Each transition tracked with `assignedToId`, `resolvedById`, and `resolutionNote`.

### Payroll Computation
- `monthlySalary / totalDaysInMonth = dailyRate`
- `dailyRate × totalShiftsWorked = totalPayrollAmount`
- `totalPayrollAmount - deductions = netPay`
- Special duty bonuses tracked separately

### Invoice Auto-Generation
- Based on `Contract.billingRate × verified shifts`
- Status flow: `DRAFT → SENT → PAID / OVERDUE / CANCELLED`

---

## 12. Dashboard Data Architecture

### Admin Dashboard ([dashboard.service.ts](file:///c:/Users/USER/Music/security-system/backend/src/dashboard/dashboard.service.ts))
- Active guards (checked-in but not checked-out today)
- Total guards, sites, deployments
- Today's attendance, incidents, critical incidents
- Geofence compliance percentage
- Recent 10 attendance + 10 incidents
- 7-day sparkline trend

### Guard Dashboard
- Current deployment with site details
- Today's attendance log
- 7-day history (20 most recent records)
- My incidents (10 most recent)
- Payroll summary (current month)
- Leave requests
- Special duty invitations
- 30-day stats (shifts, check-ins, attendance rate)

### Supervisor Dashboard
- Today's deployments with attendance status per guard
- Guard status map (ON_DUTY / OFF_DUTY / PENDING / UNASSIGNED)
- Geofence anomalies
- Active incidents (OPEN + INVESTIGATING)
- Summary KPIs

### Client Dashboard
- My sites (via ClientSite mapping)
- Today's attendance at client sites
- Recent incidents at client sites
- Invoices
- 30-day geofence compliance

---

## 13. Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| CEO | `ceo@security.com` | `ceo123` |
| Admin | `admin@security.com` | `admin123` |
| Ops Manager | `ops@security.com` | `ops123` |
| Regional Manager | `regional@security.com` | `regional123` |
| HR Officer | `hr@security.com` | `hr123` |
| Finance Officer | `finance@security.com` | `finance123` |
| Armoury Officer | `armoury@security.com` | `armoury123` |
| Procurement | `procurement@security.com` | `proc123` |
| Logistics | `logistics@security.com` | `log123` |
| Supervisor 1 | `supervisor@security.com` | `sup123` |
| Supervisor 2 | `supervisor2@security.com` | `sup123` |
| M&E Analyst | `analyst@security.com` | `analyst123` |
| Guards 1–8 | `guard1@security.com` … `guard8@security.com` | `guard123` |
| Client 1 | `client@company.com` | `client123` |
| Client 2 | `client2@company.com` | `client123` |
| Food Supplier | `food@supplier.com` | `food123` |
| Biometric PIN | All guards/supervisors | `1234` |

---

## 14. File Tree (Key Files Only)

```
security-system/
├── README.md
├── implementation_plan.md
├── project_documentation.md
├── DDBMS_Capabilities_Report.md
├── DDBMS_Detailed_Report.md
├── DDBMS_Technical_Development_Report.md
├── Testing_Credentials_Report.md
│
├── backend/
│   ├── .env                          # DB URL, JWT secret, port
│   ├── package.json                  # NestJS + Prisma deps
│   ├── nest-cli.json
│   ├── tsconfig.json / tsconfig.build.json
│   ├── dev-server.js                 # Custom dev server
│   ├── prisma/
│   │   ├── schema.prisma            # 35 models, 1045 lines
│   │   ├── seed.ts                  # 541 lines, 30 days of data
│   │   └── dev.db                   # SQLite dev database
│   └── src/
│       ├── main.ts                  # NestJS bootstrap (CORS, WS, validation)
│       ├── app.module.ts            # 26 module imports
│       ├── prisma/                  # PrismaService
│       ├── common/
│       │   ├── guards/              # jwt-auth.guard.ts, roles.guard.ts
│       │   ├── decorators/          # @CurrentUser, @Roles
│       │   └── enums/               # Role enum (15 roles)
│       ├── auth/                    # Login, JWT strategy
│       ├── users/                   # CRUD + role filter
│       ├── sites/                   # Site CRUD
│       ├── regions/                 # Region CRUD + dashboard
│       ├── posts/                   # Post CRUD
│       ├── deployments/             # Scheduling + status
│       ├── attendance/              # GPS check-in/out, sync
│       ├── incidents/               # Workflow, assign, resolve
│       ├── dashboard/               # 4 role-specific dashboards
│       ├── analytics/               # Trends, performance, export
│       ├── notifications/           # CRUD + unread count
│       ├── hr/                      # Guard profiles, leave, weapon auth
│       ├── armoury/                 # Weapons, issuances, ammo
│       ├── procurement/             # Suppliers, POs, requests
│       ├── logistics/               # Distributions, inventory
│       ├── finance/                 # Contracts, invoices, payments
│       ├── payroll/                 # Generate, approve, report
│       ├── special-duty/            # Full lifecycle
│       ├── spot-check/              # Audits, charges, voids
│       ├── food-supplier/           # Meal verification
│       ├── chat/                    # REST + Socket.IO gateway
│       ├── reports/                 # Daily/nightly/coverage
│       ├── change-sheets/           # Salary/rank changes
│       └── personnel-movements/     # Transfers, recalls
│
├── frontend/
│   ├── package.json                 # Next.js 16 + Chart.js
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── dev-server.js                # Custom dev server
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   ├── sw.js                    # Service Worker (144 lines)
│   │   ├── logo.jpg                 # Brand logo
│   │   └── icons/                   # PWA icons
│   └── src/
│       ├── app/
│       │   ├── layout.tsx           # Root layout + Providers
│       │   ├── globals.css          # 40 KB design system
│       │   ├── page.tsx             # Login page
│       │   ├── favicon.ico
│       │   ├── offline/             # Offline fallback
│       │   └── (app)/
│       │       ├── layout.tsx       # Sidebar + nav (446 lines)
│       │       ├── dashboard/       # Admin dashboard
│       │       ├── guard/           # Guard panel (24.5 KB)
│       │       ├── supervisor/      # Supervisor panel
│       │       ├── client/          # Client portal
│       │       ├── analytics/       # M&E charts
│       │       ├── regional/        # Regional view
│       │       ├── armoury/         # Armoury UI
│       │       ├── procurement/     # Procurement UI
│       │       ├── logistics/       # Logistics UI
│       │       ├── finance/         # Finance hub
│       │       ├── food-supplier/   # Food supplier UI
│       │       ├── chat/            # Full chat UI (30 KB)
│       │       ├── hr/
│       │       │   ├── guards/      # List + [id] detail
│       │       │   ├── leave/
│       │       │   ├── payroll/
│       │       │   ├── weapons/
│       │       │   ├── change-sheets/
│       │       │   └── movements/
│       │       └── admin/
│       │           ├── users/
│       │           ├── sites/
│       │           ├── deployments/
│       │           ├── attendance/
│       │           ├── incidents/
│       │           ├── spot-check/
│       │           ├── special-duty/
│       │           └── reports/
│       ├── components/
│       │   ├── Providers.tsx
│       │   ├── ChatWidget.tsx
│       │   └── ContextualChat.tsx
│       └── lib/
│           ├── api.ts               # API client (295 lines)
│           ├── auth.tsx             # Auth context + useAuth
│           ├── db.ts                # IndexedDB (190 lines)
│           ├── sync.ts              # Offline sync (95 lines)
│           └── chat.ts              # Socket.IO client
```

---

## 15. Setup & Running

### Prerequisites
- Node.js ≥ 18
- PostgreSQL running on `localhost:5432` with database `Security`
- (Or modify `.env` `DATABASE_URL` for your setup)

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init    # Apply schema
npm run prisma:seed                   # Seed 30 days of data
npm run dev                           # Starts on http://0.0.0.0:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev                           # Starts on http://localhost:3000
```

### Production Notes
- Update `DATABASE_URL` in `backend/.env` to a managed PostgreSQL (Supabase, AWS RDS)
- Set `NEXT_PUBLIC_API_URL` for the frontend to point to production backend
- Deploy backend to Render/Railway/AWS, frontend to Vercel
- HTTPS required for PWA Service Worker installation

---

## 16. Design System

[globals.css](file:///c:/Users/USER/Music/security-system/frontend/src/app/globals.css) — **40 KB** comprehensive design system:

- **Glassmorphism** — `backdrop-filter: blur()` translucent cards
- **Dark/Light theme** — CSS custom properties with `.light` class toggle
- **Gradient accents** — Deep slate backgrounds with indigo/violet radial glows
- **Micro-animations** — `animate-fade-in`, hover lifts, scale transitions
- **Responsive grid** — Mobile-first with sidebar collapse
- **Custom components** — buttons, badges, cards, modals, tables, forms, toasts
- **Status colors** — success (emerald), warning (amber), danger (rose), info (blue)

---

> [!NOTE]
> This project is a single-commit codebase representing v1.1.4 of the DDBMS platform. The implementation plan document describes aspirational Phase 1 enterprise upgrades that appear to have been **already completed** — multi-tenancy, analytics, client portal, supervisor interface, and premium UI are all present in the current code.
