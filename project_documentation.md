# SecureGuard Pro
**Enterprise Digital Deployment & Security Management Information System**

SecureGuard Pro is a full-scale, enterprise-grade web application designed to manage security operations, mobile guard deployments, attendance tracking via GPS geofencing, and real-time incident reporting.

## 🚀 Technology Stack

### Frontend (Client Application)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: React 18
- **Language**: TypeScript
- **Styling**: Vanilla CSS with modern Glassmorphism UI patterns
- **Icons**: [Lucide React](https://lucide.dev/) (Professional SVGs)
- **Data Visualization**: Chart.js & react-chartjs-2
- **PWA Capabilities**: Custom Service Worker (`sw.js`) for offline caching and background synchronization.

### Backend (REST API)
- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: TypeScript
- **Database ORM**: Prisma ORM
- **Database Engine**: SQLite (Development) / Ready for PostgreSQL (Production)
- **Authentication**: JWT (JSON Web Tokens) & Passport.js
- **Security**: Bcrypt password hashing, custom `RolesGuard` for endpoint authorization.
- **File Uploads**: Multer (for incident evidence media)

---

## 🏗️ System Architecture

The system utilizes a **Multi-Tenant Architecture** to ensure data isolation. All core operational data is tied to a specific `Tenant`.

### Key Database Models (Prisma)
1. **Tenant**: Root entity for multi-tenancy.
2. **User**: System users with predefined roles.
3. **ClientSite**: Physical locations where guards are deployed. Geofence radius and coordinates are stored here.
4. **Deployment**: Scheduling assignments linking Guards to Sites.
5. **Attendance**: Time logs (Check-In/Out) including GPS coordinates, timestamp, and geofence validation status.
6. **Incident**: Security incident reports with workflow statuses (`OPEN`, `INVESTIGATING`, `RESOLVED`, `CLOSED`), severity levels, and resolution notes.
7. **Notification**: In-app alerts for users (e.g., geofence anomalies, critical incidents).

---

## 👥 Role-Based Access Control (RBAC)

The system ships with distinct dashboards tailored to specific operational roles:

| Role | Interface | Key Capabilities |
| :--- | :--- | :--- |
| **Admin / Ops Manager** | Command Center Dashboard | Full system control. KPI overview, User Management, Site Management, Deployment scheduling, and system-wide reporting. |
| **Supervisor** | Command View | Real-time field operations. Monitor guard statuses (On Duty, Pending), track anomalies, and verify active incidents. |
| **Guard** | Mobile-First PWA | Offline-capable mobile interface. GPS-validated Check-In/Check-Out, Incident Reporting with media attachments. |
| **Client** | Client Portal | Read-only transparency portal. View site-specific deployments, attendance logs, and resolved incidents. |
| **M&E Analyst** | Analytics Dashboard | Extrapolate 30-day trends, geofence compliance rates, incident severity charts, and export data via CSV. |

---

## ✨ Core Features

### 1. Offline-First Guard Mobile Panel (PWA)
Guards operate in areas with poor connectivity. The frontend utilizes a Service Worker to cache static assets. If a guard checks in/out or reports an incident while offline, the payload is stored in `localStorage` and synchronized automatically when the connection is restored via the `syncOfflineData` daemon.

### 2. Location Intelligence & Geofencing
Sites are defined with a strict GPS coordinate and a radius (e.g., 100 meters). When a Guard attempts to Check-In, their device's GPS coordinate is measured against the Site's geofence using the Haversine formula. Anomalies (checking in outside the fence) are recorded and instantly trigger notifications for Supervisors.

### 3. Incident Management Workflow
Incidents can be reported from the field with attached media (photos/videos). They enter an `OPEN` state. Admins and Supervisors can review, assign to specific investigators, transition the status to `INVESTIGATING`, and finally `RESOLVED` with a documented resolution note.

### 4. Enterprise Aesthetics
The UI discards standard templates in favor of a bespoke, premium **Glassmorphism** design. 
- Deep gradient backgrounds (`#0f172a` slates with indigo/violet radial glows).
- Translucent, frosted-glass cards (`backdrop-filter: blur(12px)`).
- Fluid micro-animations (`animate-fade-in`, hover lifts).
- Professional `Lucide-React` uniform iconography.

---

## 🛠️ Setup & Deployment

### Local Development

**1. Database Configuration**
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed  # Generates 30 days of realistic test data
```

**2. Start Backend**
```bash
cd backend
npm run start:dev
# API runs on http://localhost:3001
```

**3. Start Frontend**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### Production Readiness
- **Database**: Update `.env` in the backend to point to a managed PostgreSQL instance (e.g., Supabase or AWS RDS). Run `npx prisma migrate deploy`.
- **Backend Host**: Deploy NestJS to Render, Railway, or AWS. Ensure `CORS` is configured to accept requests from the frontend domain.
- **Frontend Host**: Deploy Next.js to Vercel. Set `NEXT_PUBLIC_API_URL` to point to the production backend URL. Ensure HTTPS is active for the PWA Service Worker to install correctly.

---

## 🧪 Demo Credentials

The `npm run seed` command automatically provisions the following default accounts for testing all access levels (Password for all: `password123` or indicated):

- **Admin**: `admin@security.com` / `admin123`
- **Supervisor**: `supervisor@security.com` / `sup123`
- **Guard**: `guard1@security.com` / `guard123`
- **Client**: `client@company.com` / `client123`
- **M&E Analyst**: `analyst@security.com` / `analyst123`
