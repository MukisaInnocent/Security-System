# DDBMS v1.1.4: Comprehensive Technical & Operational Documentation
## Prepared for the Board of Governors — April 13, 2026

**Digital Deployment & Business Management System (DDBMS)** is a high-availability, multi-tenant ecosystem designed to enforce absolute accountability in private security operations. This document details the granular logic, proprietary algorithms, and integrated modules of version 1.1.4.

---

### 1. The Operational Core (Deployment Logic)

The heart of the system is the **Deployment Engine**, which transitions personnel through high-integrity states.
- **Transition States**: `SCHEDULED` → `ACTIVE` (Verified) → `COMPLETED` (Signed-Out) or `VOIDED` (Fraud-Striken).
- **Deployment Categories**:
  - **Standard**: Routine assigned post.
  - **Permanent**: Fixed long-term site attachments.
  - **Cross-Site / Overtime**: Temporary dispatch with automatic pay-bonus calculation.
- **Metric: Coverage Percentage**: Calculated per site as `(Actual Deployed / Total Required Across All Posts) * 100`.

### 2. High-Integrity Attendance (Geofencing & Biometrics)

To eliminate "Ghost Deployments" (the industry practice of billing for guards not present), DDBMS enforces two layers of digital proof:

#### I. GPS Geofencing (Haversine Algorithm)
The system calculates the distance between the Guard's mobile device and the Site's central coordinates using the **Haversine Formula**:
- **Algorithm**: $d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lon}}{2}\right)}\right)$
- **Enforcement**: Records are tagged as `isWithinGeofence`. Admins receive real-time "Anomaly Alerts" if a guard checks in >100m from their post.

#### II. Biometric Verification
- Current implementation uses a **Hashed Biometric PIN** system.
- Biometric verification is required for **Check-In**, **Check-Out**, and unannounced **Spot Checks**.
- Any failed biometric verification during a Spot Check triggers a `CRITICAL` incident for the Command Center.

### 3. Financial & Payroll Algorithms

The system removes manual error from the billing and payroll cycle through direct integration with operational data.

#### I. Payroll Calculation
- **Daily Rate**: `Contracted Monthly Salary / Days in Current month`.
- **Verified Net Pay**: `Daily Rate * Total COMPLETED Shifts (where BiometricVerified = True)`.
- **Special Bonuses**: Special duty "Top-ups" are added to the payroll run upon completion and approval by Finance.

#### II. Automated Invoicing
- Invoices are generated at the end of a billing period (Monthly/Fortnightly).
- **Billing Logic**: Only `COMPLETED` deployments are tallied.
- **Client Transparency**: Clients can login to a dedicated portal to view the exactly verified hours they are being billed for.

### 4. Specialised Management Modules

#### Armoury & Weapon Control
- **Inventory Tracking**: Every firearm is recorded with Serial Number, Make, Model, and Licence Expiry.
- **Issuance Chain**: `Armoury Guard Scan` → `Supervisor Approval` → `Deployment Assignment`.
- **Ammunition**: Managed as a "Site Inventory" item with minimum thresholds (minStock). The system alerts Logistics when stock falls below 50 rounds at any site.

#### Procurement & Logistics
- **Procurement Cycle**: `Employee Purchase Request` → `Admin Approval` → `Automated PO Generation` → `Supplier Delivery` → `Site Inventory Update`.
- **Asset Distribution**: Tracks high-value assets (Radios, Vehicles, Uniforms) assigned to specific sites or individual guards.

#### Security & Compliance
- **Incident Escalation**: `LOW` and `MEDIUM` incidents alert the local Supervisor. `HIGH` and `CRITICAL` incidents trigger instant mobile push notifications and deep-linked alerts to the **CEO** and **OPS Manager**.
- **Deployment Voiding**: A unique security feature allowing Admins to "strike out" fraudulent deployments. This voids the associated payroll and billing record instantly, maintaining fiscal integrity.

---

### 5. Role-Based Access Control (RBAC) Matrix

| Role | Primary Visibility | Capabilities |
| :--- | :--- | :--- |
| **Board / CEO** | Global Enterprise | Overall P&L, High-level compliance, Regional Trends. |
| **OPS Manager** | National Operations | Deployment Reports, Incident investigation, Geofence overlaps. |
| **Supervisor** | Specific Region/Sites | Live guard statuses, Spot checks, Incident reporting. |
| **Finance** | Invoicing / Payroll | Generating Invoices, Approving Payroll, Special Duty payments. |
| **HR** | Personnel | Guard Profiles, Leave Approvals, Rank/Salary changes. |
| **Armoury** | Weapons / Ammo | Issuance/Return, Maintenance logs, Licence tracking. |
| **Guard** | Personal Dashboard | Shift viewing, Geofenced Sign-in, Payroll summary. |
| **Client** | Dedicated Portal | Real-time site view, Verified attendance logs, PDF Invoices. |

---

### 6. Technical Resilience Features

- **Nuclear SW Bypass**: Designed to prevent browser caching from serving stale operational data, ensuring every user sees the absolute "ground truth".
- **Real-Time Contextual Chat**: Built on a reactive event system, allowing Command Center operators to chat with supervisors inside the context of a specific `Incident` or `Site`.
- **Offline-First Resilience**: An internal database on the mobile app stores check-ins if the 4G/3G signal is lost, synchronising automatically with the cloud once a connection is restored.

---
**Approval Status:** Version 1.1.4 — Production Ready  
**Technical Lead:** DDBMS Engineering Team
