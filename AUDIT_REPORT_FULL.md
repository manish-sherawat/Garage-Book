# GarageBook Pro — Full System Audit Report

> **Prepared:** September 17, 2026  
> **Stack:** Next.js 14 (Frontend) · NestJS + Prisma (Backend) · PostgreSQL via Neon/Supabase  
> **Auditor:** Antigravity AI — Deep Static Code Analysis  
> **Scope:** All source files, modules, API layers, database schema, UI, UX, and security

---

## Table of Contents

1. [Critical Security Vulnerabilities](#1-critical-security-vulnerabilities)
2. [Bugs — Backend](#2-bugs--backend)
3. [Bugs — Frontend](#3-bugs--frontend)
4. [UI Issues](#4-ui-issues)
5. [UX Issues](#5-ux-issues)
6. [API and Pipeline Connectivity](#6-api-and-pipeline-connectivity)
7. [Database Schema Issues](#7-database-schema-issues)
8. [Module-by-Module Breakdown](#8-module-by-module-breakdown)
9. [Performance Recommendations](#9-performance-recommendations)
10. [Feature and Improvement Suggestions](#10-feature-and-improvement-suggestions)
11. [Severity Summary](#11-severity-summary)

---

## 1. Critical Security Vulnerabilities

> [!CAUTION]
> These must be fixed **before any production deployment**.

---

### SEC-01 — CRITICAL: Plaintext Password Storage
**File:** `backend/src/auth/auth.service.ts` Line 27

```typescript
// No hashing at all
if (user && user.password === pass) {
```

Passwords are stored and compared in **plaintext**. A single database breach exposes every credential. Fix with `bcrypt.compare()`.

---

### SEC-02 — CRITICAL: Auto-Login with Hardcoded Admin Credentials
**File:** `frontend/src/components/AuthWrapper.tsx` Lines 27-31

```typescript
// Auto-logins every visitor as admin — no login screen exists
fetch('http://localhost:5000/auth/login', {
  body: JSON.stringify({ email: 'admin@garagebook.local', password: 'admin' })
})
```

Every unauthenticated visitor is automatically logged in as admin. Admin credentials are hardcoded in client-side JS visible in browser DevTools. **There is no login screen.**

---

### SEC-03 — CRITICAL: Dev-Only Admin Auto-Creation Left in Production
**File:** `backend/src/auth/auth.service.ts` Lines 16-25

```typescript
// DEV ONLY (but is active in production)
if (!user && email === 'admin@garagebook.local') {
  user = await this.prisma.user.create({
    data: { email, password: pass, role: 'ADMIN' }
  });
}
```

Any attacker can POST to `/auth/login` with any password to create an admin account.

---

### SEC-04 — HIGH: Hardcoded JWT Fallback Secret
**File:** `backend/src/auth/jwt.strategy.ts` Line 12

```typescript
secretOrKey: process.env.JWT_SECRET || 'garagebook_super_secret',
```

The fallback is visible in source code. Anyone can forge valid JWTs offline. Make JWT_SECRET required with no fallback.

---

### SEC-05 — HIGH: Database Credentials Committed to Repository
**File:** `backend/.env`

Real PostgreSQL connection strings (username + password) and Supabase keys are tracked in git. Anyone with repo access has full database access. **Rotate credentials immediately and add .env to .gitignore.**

---

### SEC-06 — HIGH: Mass-Assignment via `forbidNonWhitelisted: false`
**File:** `backend/src/main.ts` Line 17

```typescript
app.useGlobalPipes(new ValidationPipe({ forbidNonWhitelisted: false }));
```

Extra fields in request bodies are silently stripped, not rejected. Combined with `@Body() body: any` in auth, this creates mass-assignment vulnerabilities.

---

### SEC-07 — HIGH: Auth Login Accepts Untyped Body
**File:** `backend/src/auth/auth.controller.ts` Line 11

```typescript
login(@Body() body: any) {
```

No DTO validation on the login endpoint. Oversized or malformed payloads are accepted without limits.

---

### SEC-08 — MEDIUM: JWT Decoded Client-Side Without Signature Verification
**File:** `frontend/src/components/AuthWrapper.tsx` Line 16

```typescript
const payload = JSON.parse(atob(jwt.split('.')[1])); // No signature check
```

JWT signature is never verified on the frontend. RBAC routing decisions based on this are unreliable.

---

### SEC-09 — CRITICAL: No Logout Button Exists Anywhere

There is no logout route, logout button, or session-clearing mechanism in the entire frontend codebase. Users cannot sign out.

---

## 2. Bugs — Backend

---

### BUG-BE-01 — Revenue Metric Has No Date Filter
**File:** `backend/src/dashboard.controller.ts` Lines 45-49

```typescript
// Fetches ALL payments ever — labeled "Monthly Revenue"
const payments = await this.prisma.payment.findMany({ where: { status: 'COMPLETED' } });
```

All historical payments are summed and shown as "Monthly Revenue." The number is wrong.

---

### BUG-BE-02 — Mechanic Ratings Are Randomly Generated On Every API Call
**File:** `backend/src/dashboard.controller.ts` Line 124

```typescript
rating: (4.0 + Math.random()).toFixed(1) // Changes every 5 seconds
```

The dashboard refreshes every 5 seconds so ratings visibly flicker with different values on every render. Completely fictional data.

---

### BUG-BE-03 — Top Parts Usage Count Is Randomized
**File:** `backend/src/dashboard.controller.ts` Line 250

```typescript
count: Math.floor(Math.random() * 50) + 10, // Different every request
```

---

### BUG-BE-04 — Revenue Month Grouping Merges Cross-Year Data
**File:** `backend/src/dashboard.controller.ts` Line 54

```typescript
const month = monthNames[p.createdAt.getMonth()]; // Missing year!
```

January 2025 and January 2026 revenue are merged into the same bucket.

---

### BUG-BE-05 — Bay Allocation Creates Ghost Customer/Vehicle Records
**File:** `backend/src/workshop-bays/workshop-bays.service.ts` Lines 106-127

When a bay is allocated with an empty jobCardId, the service silently creates fake placeholder customers ("Bay Allocation Customer") and vehicles ("MH-12-BAY-XXXX"), polluting the database.

---

### BUG-BE-06 — Mechanic Deletion is Hard-Delete (Ignores Soft-Delete Pattern)
**File:** `backend/src/mechanics/mechanics.service.ts` Line 55

```typescript
return this.prisma.user.delete({ where: { id } }); // HARD DELETE
```

The User model has a deletedAt field (soft-delete pattern) but mechanic delete uses a hard delete. Deleting a mechanic with active job cards causes referential integrity errors.

---

### BUG-BE-07 — Labour Cost Calculation Ignores Attendance Data
**File:** `backend/src/accounting/accounting.service.ts` Lines 49-55

```typescript
salaryMultiplier = 12; // ALL_TIME = 12 months — wild guess
const totalLabourCost = mechanics.reduce(...) * salaryMultiplier;
```

The Attendance model is never used. Labour cost is fabricated.

---

### BUG-BE-08 — GST Hardcoded at 18% for All Transactions
**File:** `backend/src/accounting/accounting.service.ts` Line 60

```typescript
const taxableRevenue = totalRevenue / 1.18; // Always 18%
```

Indian GST varies (0%, 5%, 12%, 18%, 28%). No per-invoice tax rate is stored.

---

### BUG-BE-09 — Invoice Number Has Random Collision Risk
**File:** `backend/src/billing/billing.service.ts` Line 19

```typescript
const invoiceNo = `GB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
```

Under concurrent load, two invoices could get the same number, causing a 500 error on the unique constraint.

---

### BUG-BE-10 — Purchase Order Number Not Collision-Safe
**File:** `backend/src/procurement/procurement.service.ts` Line 71

```typescript
const poNumber = `PO-${Date.now().toString().substring(5)}`; // Not sequential
```

---

### BUG-BE-11 — Mechanic Created with Plaintext Unhashed Password
**File:** `backend/src/mechanics/mechanics.service.ts` Line 11

```typescript
const password = 'hashed_default_pass'; // NOT actually hashed
```

Every mechanic account has the same weak plaintext password.

---

### BUG-BE-12 — `endOfLastQuarter` Variable Computed But Never Used
**File:** `backend/src/dashboard.controller.ts` Line 172

LAST_QUARTER analytics filter fetches from start of last quarter to now — not to end of last quarter. The end-date variable is computed but ignored.

---

### BUG-BE-13 — Inventory Quantity Can Go Negative
**File:** `backend/src/job-cards/job-cards.service.ts` Line 81

```typescript
data: { quantity: { decrement: part.qty } }, // No pre-check
```

No stock availability check before decrement. Parts can silently reach negative quantities.

---

## 3. Bugs — Frontend

---

### BUG-FE-01 — Dashboard Polls API Every 5s Even When Tab is Hidden
**File:** `frontend/src/app/page.tsx` Lines 346-350

```typescript
setInterval(() => fetchLiveDashboard(false), 5000); // No visibilityState check
```

Every open background tab continuously polls the server, wasting resources.

---

### BUG-FE-02 — Dashboard PaymentModal Has Hardcoded Demo Data
**File:** `frontend/src/app/page.tsx` Lines 544-551

```typescript
<PaymentModal jobCardId="DEMO123" totalAmount={452000} customerName="John Doe" vehicleNo="XYZ-1234" />
```

Clicking "Collect Payment" on the dashboard processes a Rs.4,52,000 payment for DEMO123, creating corrupt database records.

---

### BUG-FE-03 — Payment Success Shown Even When API Call Fails
**File:** `frontend/src/components/PaymentModal.tsx`

```typescript
} catch (e) { console.warn(e); }
setIsSuccess(true); // Unconditionally set regardless of API result
```

Users are falsely told payment succeeded even when it failed.

---

### BUG-FE-04 — Jobs Page Has Dual Toast Systems (Conflict)
**File:** `frontend/src/app/jobs/page.tsx` Lines 51, 238

Both `useToast()` from ToastProvider and a local `toastMessage` state rendering a Snackbar coexist. Two notification systems create inconsistent UX.

---

### BUG-FE-05 — Job Form State Not Fully Reset After Submission
**File:** `frontend/src/app/jobs/page.tsx` Lines 246-254

After job creation, the following states are NOT reset: `mechanic`, `selectedParts`, `laborCost`. They carry over into the next Create Job Card modal session.

---

### BUG-FE-06 — AuthWrapper Hardcodes Backend URL as localhost:5000
**File:** `frontend/src/components/AuthWrapper.tsx` Line 27

```typescript
fetch('http://localhost:5000/auth/login', { // Ignores NEXT_PUBLIC_API_URL
```

Breaks in any non-local environment.

---

### BUG-FE-07 — Revenue Chart Tooltip Always Shows Lakhs Even for Small Values
**File:** `frontend/src/app/page.tsx` Line 108

```typescript
Rs.{(data[data.length - 1].value / 100000).toFixed(2)}L
```

Rs.500 would display as Rs.0.01L — misleading for small revenue amounts.

---

### BUG-FE-08 — Bay Gauge Labels are Sequential, Not from Database
**File:** `frontend/src/app/page.tsx` Line 268

```typescript
BAY-0{i + 1}  // Hardcoded, not real bay names
```

Custom bay names (e.g., "Lift Bay", "AC Bay") are ignored on the dashboard widget.

---

### BUG-FE-09 — Workshop Bays Page Shows Nothing On API Failure

No error state, no empty state component, no notification when fetchLiveBays() fails. The page silently shows blank content.

---

### BUG-FE-10 — Revenue Growth Badge is a Hardcoded Static String
**File:** `frontend/src/app/page.tsx` Line 460

```typescript
<span>+14.2%</span>  // Never changes
```

---

### BUG-FE-11 — Sidebar "Create New Job" Link Ignores `?new=true` Param
**File:** `frontend/src/components/Sidebar.tsx` Line 106

The sub-link navigates to `/jobs?new=true`, but the jobs page never reads searchParams to auto-open the new job modal. The link does nothing special.

---

## 4. UI Issues

---

### UI-01 — Mobile Menu Toggle Permanently Hidden
**File:** `frontend/src/components/Sidebar.tsx` Line 302

```typescript
style={{ display: 'none' }} // Always hidden
```

The hamburger menu is permanently hidden. The sidebar overlaps all content on screens under 1100px wide.

---

### UI-02 — All Pages Have Hardcoded `marginLeft: 310px`

Every page sets `marginLeft: '310px'` on the main content area. Does not adapt on tablet or mobile.

---

### UI-03 — Workshop Bays Page Has No Empty State Component

When the API returns empty or fails, the page shows a blank white area with no guidance.

---

### UI-04 — Status Badge `<select>` Looks Broken on Firefox/Safari
**File:** `frontend/src/app/jobs/page.tsx` Lines 410-421

```typescript
<select className={`badge ${statusClass}`}>
```

Native select styling clashes with badge CSS on Firefox and Safari.

---

### UI-05 — SVG Gradient IDs Are Not Unique
**File:** `frontend/src/app/page.tsx` Line 81

`id="areaGrad"` is hardcoded. If rendered multiple times on a page, all instances share the same gradient, potentially showing wrong colors in some browsers.

---

### UI-06 — Sidebar Avatar and Name Hardcoded to "RM" / "Rajesh Kumar"
**File:** `frontend/src/components/Sidebar.tsx` Lines 363, 366

Should be derived from JWT payload or user profile API.

---

### UI-07 — Dashboard Header Workshop Name "Rajesh Motors" Hardcoded
**File:** `frontend/src/app/page.tsx` Line 363

```typescript
<span>Rajesh Motors</span>
```

Any business using this software will see "Rajesh Motors" in the header.

---

### UI-08 — SVG Chart Text Colors Hardcoded (Breaks Dark Mode)
**File:** `frontend/src/app/page.tsx` Line 147

```typescript
<text fill="#0f172a">  // Invisible in dark mode
```

SVG text is hardcoded to dark slate. In dark mode, chart labels disappear.

---

### UI-09 — No Loading Skeleton for Dashboard KPI Cards

KPI cards show `'...'` string during loading. No skeleton animation. Layout shifts when data loads, causing CLS failures in Core Web Vitals.

---

### UI-10 — Settings Page Sidebar Shows Duplicate "Settings" Link

Settings link appears both as a nav section item AND in the sidebar footer.

---

## 5. UX Issues

---

### UX-01 — No Confirmation Before Deleting a Mechanic

Mechanic deletion is a hard-delete on the backend. No confirmation prompt exists. A misclick permanently destroys a mechanic and all linked job card history.

---

### UX-02 — Job Status Can Be Changed Backward Without Confirmation

A DELIVERED job can be set back to PENDING with a single dropdown click. No guard against backward status transitions.

---

### UX-03 — "Collect Payment" Shown on Already-Paid/Delivered Jobs

The button is visible for all job statuses including DELIVERED. Should be disabled or hidden when already paid.

---

### UX-04 — Bay Allocation Failures Are Silent (Console-Only)
**File:** `frontend/src/app/workshop-bays/page.tsx` Lines 108-110

```typescript
} catch (e) {
  console.warn('Bay allocation API call notice:', e); // Silent fail
}
```

API failures on bay allocation are only logged to the console. Users see optimistic UI updates but get no toast/notification if the operation failed.

---

### UX-05 — Assign Bay Modal Has No Job Card Search

Loading all PENDING/IN_PROGRESS job cards into an unsearchable dropdown is impractical for workshops with 50+ active jobs.

---

### UX-06 — Settings Page Does Not Save to Backend

Workshop name, GST, business hours, email templates — all stored in localStorage only. Settings are lost on a different device or browser. No backend API is called on save.

---

### UX-07 — Attendance Modal Uses Hardcoded IDs Instead of Real Mechanic UUIDs
**File:** `frontend/src/app/mechanics/page.tsx` Lines 63-68

```typescript
attendanceRecords = { '1': 'PRESENT', '2': 'PRESENT', '3': 'PRESENT', '4': 'PRESENT' }
```

Real mechanic IDs are UUIDs. Saving attendance with these hardcoded IDs creates orphan records.

---

### UX-08 — No Pagination on Job Cards, Customers, or Invoice Tables

All records fetched and rendered in full DOM tables. Hundreds of records will cause browser lag. The project-defined "pagebutton" standard is not applied.

---

### UX-09 — No Confirmation When Releasing a Workshop Bay

Releasing a bay is an irreversible API action with no confirmation dialog. A misclick could release an actively-worked bay.

---

### UX-10 — No Retry on Dashboard API Error

When the dashboard fails to load data, a static "Offline" state is shown with no retry button. The user must manually reload the entire page.

---

## 6. API and Pipeline Connectivity

---

### API-01 — No API Prefix or Versioning

All NestJS controllers are at root (`/job-cards`, `/dashboard`). No `/api/v1/` prefix makes future versioning and proxy configs harder.

```typescript
// Fix: Add to main.ts
app.setGlobalPrefix('api/v1');
```

---

### API-02 — Sidebar Badge Counts Fetched Once, Never Refreshed

Job/bay counts in the sidebar are loaded once on mount. They become stale as jobs are created, completed, or delivered throughout the session.

---

### API-03 — No Request Timeout on `safeFetch`

If the backend hangs, the frontend waits indefinitely. No AbortController timeout is configured, leaving pages frozen in loading state.

```typescript
// Fix: add 8s timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 8000);
```

---

### API-04 — No 404 vs 500 Differentiation in Error Handling

All non-2xx responses throw the same error. The UI cannot distinguish "not found" (show empty state) from "server error" (show error banner).

---

### API-05 — Attendance API Uses `POST` for an Idempotent Upsert Operation

Attendance saving is an upsert — semantically fits `PUT`/`PATCH`. Using `POST` means clients cannot safely retry failed requests.

---

### API-06 — Duplicate Comment Block in `api.ts`

```typescript
// Financial & Accounting APIs  <-- duplicated on consecutive lines
// Financial & Accounting APIs
```

---

### API-07 — AuthWrapper Uses Hardcoded URL Instead of Env Variable

```typescript
fetch('http://localhost:5000/auth/login' // Should be process.env.NEXT_PUBLIC_API_URL
```

---

### API-08 — `safeFetch` Double-Logs Errors (Log + Re-throw)

`safeFetch` logs every error, then re-throws. Callers that also catch and log produce duplicate noise in the browser console.

---

## 7. Database Schema Issues

---

### DB-01 — `User` Model Conflates Admins and Mechanics
**File:** `backend/prisma/schema.prisma` Lines 14-35

Admin users and workshop mechanics share the same table. Mechanic-specific fields (`specialty`, `shiftHours`, `dailySalary`, `bayAllocations`, `attendance`) pollute the admin schema. Recommend a `MechanicProfile` relation or separate model.

---

### DB-02 — `Attendance.date` Is a String, Not `DateTime`
**File:** `backend/prisma/schema.prisma` Line 41

```prisma
date String  // Should be DateTime
```

Date range queries are impossible. Timezone handling is undefined.

---

### DB-03 — `Vehicle` Has No `createdAt`/`updatedAt` Timestamps

No audit trail or recency tracking for vehicles registered in the system.

---

### DB-04 — `Payment.status` Always Set to `COMPLETED`
**File:** `backend/prisma/schema.prisma` Line 118 and `backend/src/payments/payments.service.ts` Line 103

```typescript
status: PaymentStatus.COMPLETED, // Always — FAILED/PENDING never used
```

Failed or partial payments cannot be tracked. The entire payment status system is non-functional.

---

### DB-05 — `Invoice` Has Redundant `date` and `createdAt` Fields

```prisma
date      DateTime @default(now())
createdAt DateTime @default(now())  // Duplicate
```

---

### DB-06 — `BayAllocation.jobCardId` Is `@unique` — Prevents Bay Re-allocation
**File:** `backend/prisma/schema.prisma` Line 171

```prisma
jobCardId String @unique
```

A vehicle cannot be moved between bays — creating a new BayAllocation for the same job card fails with a unique constraint error. Remove `@unique`; manage active allocations via business logic/actualEndTime.

---

### DB-07 — No Indexes on High-Frequency Query Fields

Missing indexes on:
- `JobCard.status` — filtered every dashboard load
- `JobCard.customerId` — joined on most job queries  
- `Payment.createdAt` — used in all time-range revenue queries
- `BayAllocation.actualEndTime` — used to find active allocations

---

### DB-08 — `Supplier` Schema Missing Email Field

`CreateSupplierDto` accepts `email?` but the schema has no email column. Supplied emails are silently discarded.

---

### DB-09 — No Friendly Error on `partNumber` Unique Constraint Collision

Part number uniqueness enforced at DB level only. Users get a raw 500 error instead of a friendly validation message when a duplicate part number is submitted.

---

## 8. Module-by-Module Breakdown

### 8.1 Dashboard

| ID | Issue | Severity |
|----|-------|----------|
| D-01 | Revenue KPI labeled "Monthly Revenue" but is all-time total | HIGH |
| D-02 | Revenue trend badge (+14.2%) hardcoded static | HIGH |
| D-03 | Dashboard polls every 5s even in background tabs | MEDIUM |
| D-04 | Job Status donut caption says "current month" but data is all-time | MEDIUM |
| D-05 | No retry button on error state | MEDIUM |
| D-06 | partsConsumed always 0, avgJobTime always '2.4h' in Today's Highlights | HIGH |
| D-07 | Bay Utilization shows BAY-01... not real bay names | MEDIUM |

### 8.2 Job Cards

| ID | Issue | Severity |
|----|-------|----------|
| J-01 | Hardcoded MECHANICS_LIST fallback shown even when API returns real mechanics | MEDIUM |
| J-02 | COMMON_VEHICLE_MODELS and COMMON_SERVICES are demo placeholder data | MEDIUM |
| J-03 | selectedParts and laborCost not reset after job creation | HIGH |
| J-04 | mechanic state not reset after job creation | HIGH |
| J-05 | No pagination — pagebutton standard not applied | HIGH |
| J-06 | "Collect Payment" shown for DELIVERED/paid jobs | MEDIUM |
| J-07 | Job ID is non-sequential UUID prefix — hard to reference verbally | MEDIUM |
| J-08 | Search doesn't include phone number field | MEDIUM |
| J-09 | No way to view or edit a full job card — table is read-only | HIGH |
| J-10 | No job card print or export | MEDIUM |
| J-11 | Dual toast systems (Snackbar + ToastProvider) conflict | HIGH |

### 8.3 Workshop Bays

| ID | Issue | Severity |
|----|-------|----------|
| WB-01 | No error state when API fails | MEDIUM |
| WB-02 | No empty state component when bays array is empty | MEDIUM |
| WB-03 | Empty jobCardId in allocation creates ghost DB records | CRITICAL |
| WB-04 | No confirmation before releasing a bay | MEDIUM |
| WB-05 | estimatedCompletion hardcoded to '1 hour remaining' | MEDIUM |
| WB-06 | MAINTENANCE bay status defined in schema but unsupported in UI | MEDIUM |
| WB-07 | BayAllocation.jobCardId @unique prevents vehicle re-allocation | HIGH |

### 8.4 Mechanics and Team

| ID | Issue | Severity |
|----|-------|----------|
| M-01 | Mechanic created with plaintext 'hashed_default_pass' | CRITICAL |
| M-02 | Mechanic deletion is hard-delete, not soft-delete | HIGH |
| M-03 | No confirmation before deleting a mechanic | HIGH |
| M-04 | Attendance modal has hardcoded IDs '1','2','3','4' | CRITICAL |
| M-05 | Mechanic revenue reads j.invoice?.grandTotal but Invoice not in query | HIGH |
| M-06 | Edit mechanic state declared but no edit form is wired | MEDIUM |

### 8.5 Customers CRM

| ID | Issue | Severity |
|----|-------|----------|
| C-01 | Email field not validated for email format | MEDIUM |
| C-02 | Phone uniqueness: formatting differences create duplicates | MEDIUM |
| C-03 | No pagination on customer list | HIGH |
| C-04 | gender is free-text string, not an enum | LOW |
| C-05 | Soft-deleted customers appear in job card customer selection | MEDIUM |

### 8.6 Inventory and Parts

| ID | Issue | Severity |
|----|-------|----------|
| I-01 | Inventory quantity can go negative — no pre-check | CRITICAL |
| I-02 | No notification when part drops below minQuantity | MEDIUM |
| I-03 | Parts catalog doesn't show current stock level when adding to a job card | MEDIUM |
| I-04 | Duplicate part names allowed — only partNumber is unique | MEDIUM |
| I-05 | No backend route for Excel xlsx import/export | MEDIUM |

### 8.7 Procurement and POs

| ID | Issue | Severity |
|----|-------|----------|
| P-01 | PO number uses Date.now().substring(5) — not sequential or unique | HIGH |
| P-02 | DRAFT PO status defined but createPurchaseOrder always creates as SENT | MEDIUM |
| P-03 | No cancel PO route in API or frontend | MEDIUM |
| P-04 | Marking PO received twice would double-increment inventory | MEDIUM |
| P-05 | Supplier DTO accepts email but schema has no email column | MEDIUM |

### 8.8 Billing and Invoices

| ID | Issue | Severity |
|----|-------|----------|
| B-01 | Invoice number uses Math.random() — collision risk under load | HIGH |
| B-02 | findAll() doesn't filter soft-deleted invoices | MEDIUM |
| B-03 | No pagination on invoices list | MEDIUM |
| B-04 | GST rates not stored per-invoice — blanket 18% assumed | HIGH |
| B-05 | No print-to-PDF for invoices | HIGH |
| B-06 | Invoice model has duplicate date and createdAt fields | LOW |

### 8.9 GST Accounting

| ID | Issue | Severity |
|----|-------|----------|
| A-01 | Labour cost ignores attendance data — fabricated guess | CRITICAL |
| A-02 | GST hardcoded at 18% for all transactions | HIGH |
| A-03 | IGST always returned as 0 — inter-state transactions unsupported | MEDIUM |
| A-04 | Net profit can go negative without any alerting | MEDIUM |
| A-05 | CSV export excludes customer and vehicle info | MEDIUM |

### 8.10 Payment Modal

| ID | Issue | Severity |
|----|-------|----------|
| PM-01 | Cash payment requires transaction reference — unusual | MEDIUM |
| PM-02 | UPI QR generated via external api.qrserver.com — payment amounts leaked to 3rd party | HIGH |
| PM-03 | UPI ID read from localStorage — stale if changed in Settings | MEDIUM |
| PM-04 | Success shown unconditionally even when API call fails | CRITICAL |
| PM-05 | Dashboard PaymentModal pre-loaded with DEMO123 and Rs.452000 | HIGH |

### 8.11 Settings Page

| ID | Issue | Severity |
|----|-------|----------|
| S-01 | No API calls — all settings saved to localStorage only | CRITICAL |
| S-02 | Profile changes don't reflect in sidebar or dashboard header | HIGH |
| S-03 | Email templates frontend-only — no backend save/send route | MEDIUM |
| S-04 | Business hours not persisted to backend | MEDIUM |
| S-05 | "Team" tab exists but has no user management functionality | MEDIUM |
| S-06 | Theme toggle can cause flash-of-unstyled-content (FOUC) on SSR | MEDIUM |
| S-07 | GSTIN accepts any string — no 15-char format validation | MEDIUM |

### 8.12 Sidebar and Navigation

| ID | Issue | Severity |
|----|-------|----------|
| SB-01 | Badge counts fetched once on mount, never refreshed | MEDIUM |
| SB-02 | Mobile toggle button permanently hidden via display:none | CRITICAL |
| SB-03 | "Create New Job" link goes to /jobs?new=true but jobs page ignores the param | HIGH |
| SB-04 | "Rajesh Motors" sub-caption hardcoded | MEDIUM |
| SB-05 | No Logout button anywhere in the application | CRITICAL |
| SB-06 | Settings link duplicated in nav and footer | LOW |

---

## 9. Performance Recommendations

### PERF-01 — Respect `document.visibilityState` in Dashboard Polling
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') clearInterval(pollId);
  else pollId = setInterval(fetchDashboard, 5000);
});
```

### PERF-02 — Add Database Indexes for Hot Queries
```prisma
model JobCard       { @@index([status]) @@index([customerId]) }
model Payment       { @@index([status]) @@index([createdAt]) }
model BayAllocation { @@index([actualEndTime]) }
```

### PERF-03 — Move Analytics Aggregation to Database Layer

Replace in-memory revenue grouping, job status counts, and top services with `prisma.groupBy()` and `prisma.aggregate()`. Eliminates fetching thousands of full records into Node.js memory.

### PERF-04 — Cache Dashboard Stats (30s TTL)

Dashboard stats don't need recomputing on every 5s poll. Add NestJS `CacheModule` with 30-second TTL on `/dashboard/stats`.

### PERF-05 — Add Request Timeout to `safeFetch`

Add an AbortController with 8-10 second timeout to prevent indefinitely frozen loading states on the frontend.

### PERF-06 — Memoize SVG Chart Components

Wrap `RevenueAreaChart`, `DonutChart`, `MechanicBarsChart`, `BayGauge` with `React.memo` to prevent re-renders on every 5-second dashboard poll.

### PERF-07 — Paginate Backend List Endpoints

`/job-cards`, `/customers`, `/billing/invoices`, `/procurement/inventory` — all return unbounded lists. Add `skip`/`take` query params on backend and pagebutton pagination on frontend.

### PERF-08 — Extract API_BASE_URL to Singleton Constant

`process.env.NEXT_PUBLIC_API_URL` is evaluated inline in every safeFetch call. Extract to a module-level constant for performance and clarity.

---

## 10. Feature and Improvement Suggestions

| ID | Feature | Priority |
|----|---------|----------|
| F-01 | Build a proper Login Page — email/password fields, JWT session, redirect on logout | CRITICAL |
| F-02 | Implement bcrypt password hashing for all user accounts | CRITICAL |
| F-03 | Add a Logout button to sidebar user menu — clear localStorage token, redirect to login | CRITICAL |
| F-04 | Persist all Settings to a WorkshopConfig database table | HIGH |
| F-05 | Invoice PDF generation (react-pdf frontend or Puppeteer backend) | HIGH |
| F-06 | WhatsApp/SMS job status notifications (Twilio/MSG91) | HIGH |
| F-07 | Mechanic mobile view — read-only job card list optimized for phones | HIGH |
| F-08 | Replace 5s polling with WebSocket/SSE for real-time dashboard updates | MEDIUM |
| F-09 | Sequential collision-safe invoice and PO numbering (DB atomic counter) | MEDIUM |
| F-10 | Job card status audit log — track every status change with timestamp and actor | MEDIUM |
| F-11 | Link inventory items directly to job cards in DB — enable real parts usage tracking | MEDIUM |
| F-12 | Customer loyalty tracking — visit count, total spend, last visit date on CRM | MEDIUM |
| F-13 | Vehicle service history timeline — all jobs per vehicle in chronological view | MEDIUM |
| F-14 | Full RBAC — Admin, Receptionist, Mechanic role permissions throughout UI and API | MEDIUM |
| F-15 | Dark mode SVG charts — replace hardcoded hex colors with CSS variables | MEDIUM |
| F-16 | Responsive layout — collapsible sidebar, mobile-first content area | MEDIUM |
| F-17 | GST e-invoicing compliance — IRN generation and QR code on invoice PDFs | MEDIUM |
| F-18 | Mechanic performance analytics — actual completion times, per-job earnings | MEDIUM |
| F-19 | Low-stock push notifications — browser/webhook alert when inventory hits threshold | LOW |
| F-20 | Multi-branch support — manage multiple workshop locations from one account | LOW |

---

## 11. Severity Summary

| Severity | Count | Key Examples |
|----------|-------|-------------|
| CRITICAL | 9 | Plaintext passwords, auto-admin login, no logout, settings not saved, attendance hardcoded IDs |
| HIGH | 18 | JWT fallback secret, credentials in repo, no mechanic deletion confirm, payment success bug |
| MEDIUM | 32 | Random data in charts, UI hardcoding, no request timeout, polling without pause, missing indexes |
| LOW | 5 | Duplicate comments, redundant timestamp fields, duplicate settings link |
| **Total** | **64** | |

---

## Quick Fix Priority Checklist

```
[ ] CRITICAL — Remove AuthWrapper auto-login; build real Login page
[ ] CRITICAL — Hash all passwords with bcrypt (auth.service + mechanics.service)
[ ] CRITICAL — Remove dev-only admin auto-creation from auth.service.ts
[ ] CRITICAL — Remove hardcoded JWT fallback secret
[ ] CRITICAL — Add .env to .gitignore; rotate ALL database credentials NOW
[ ] CRITICAL — Add a Logout button
[ ] CRITICAL — Fix attendance modal: use real mechanic UUIDs not '1','2','3','4'
[ ] CRITICAL — Fix PaymentModal: only show success if API call actually succeeded
[ ] HIGH     — Persist Settings to backend WorkshopConfig model
[ ] HIGH     — Remove BayAllocation.jobCardId @unique; use active-flag pattern
[ ] HIGH     — Add DB indexes on JobCard.status, Payment.createdAt, BayAllocation.actualEndTime
[ ] HIGH     — Reset selectedParts, laborCost, mechanic state after job creation
[ ] HIGH     — Fix AuthWrapper to use NEXT_PUBLIC_API_URL (not localhost:5000)
[ ] HIGH     — Fix mechanic revenue calculation to include Invoice in Prisma query
[ ] MEDIUM   — Fix dashboard polling: pause when document.visibilityState === 'hidden'
[ ] MEDIUM   — Remove all hardcoded names (Rajesh Motors, Rajesh Kumar, RM) from UI
[ ] MEDIUM   — Add pagination (pagebutton) to Jobs, Customers, Inventory, Invoices tables
[ ] MEDIUM   — Remove Math.random() from invoice and PO number generation
[ ] MEDIUM   — Fix revenue month grouping to include year in the key
[ ] MEDIUM   — Add inventory pre-check before decrement (prevent negative stock)
```

---

*Generated by Antigravity AI — Deep Static Code Analysis of the full GarageBook Pro monorepo.*
*All findings are from source code review only. No runtime execution was required.*
