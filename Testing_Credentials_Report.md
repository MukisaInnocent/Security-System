# DDBMS v1.1.4: Testing Credentials Report
## System Access and Role-Based Simulation Data

> **Important:** These credentials are demo-only values for local development and staging use. They should not be reused in production environments.

This report contains a catalog of all pre-configured testing accounts and biometric credentials available in the DDBMS ecosystem for staging and demonstration purposes.

---

### 1. Executive & Administrative Roles
These roles provide high-level access to global company metrics, payroll approval, and system configuration.

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **CEO** | `ceo@security.com` | `ceo123` |
| **System Admin** | `admin@security.com` | `admin123` |
| **Ops Manager** | `ops@security.com` | `ops123` |
| **Regional Manager** | `regional@security.com` | `regional123` |
| **M&E Analyst** | `analyst@security.com` | `analyst123` |

---

### 2. Departmental Operations
Accounts configured for specialized back-office workflows such as HR, Finance, Armoury, and Procurement.

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **HR Officer** | `hr@security.com` | `hr123` |
| **Finance Officer** | `finance@security.com` | `finance123` |
| **Armoury Officer** | `armoury@security.com` | `armoury123` |
| **Procurement** | `procurement@security.com` | `proc123` |
| **Logistics** | `logistics@security.com` | `log123` |

---

### 3. Field Operations & Supervision
Accounts used for deployment, attendance tracking, and field audits.

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Supervisor (A)** | `supervisor@security.com` | `sup123` |
| **Supervisor (B)** | `supervisor2@security.com` | `sup123` |
| **Guard 1** | `guard1@security.com` | `guard123` |
| **Guard 2** | `guard2@security.com` | `guard123` |
| **Guard 3-8** | `guard[3-8]@security.com` | `guard123` |

---

### 4. Portals & Third-Party Integrations
Dedicated access for clients and external service providers.

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Client Site 1** | `client@company.com` | `client123` |
| **Client Site 2** | `client2@company.com` | `client123` |
| **Food Supplier** | `food@supplier.com` | `food123` |

---

### 5. Biometric Verification Credentials
For any action requiring biometric proof (Check-In, Check-Out, Spot Checks), the following PIN is globally configured for all Guard and Supervisor profiles:

> [!IMPORTANT]
> **Global Biometric PIN**: `1234`

---

### 6. Technical Usage Note
All passwords are encrypted using **bcrypt** (salt rounds: 10) on the backend. The values above are the plain-text demo credentials used when seeding local data, typically through the backend seed workflow (`npm run prisma:seed`).

**Local Environment**: Frontend runs on `http://localhost:3000`, backend on `http://localhost:3001`.

**Security note**: Reset or replace these accounts before any production or shared environment use.