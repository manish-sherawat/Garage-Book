# 🔍 GarageBook — Full Software Audit Report
> **Generated:** 2026-09-16 | **Auditor:** Antigravity AI | **Version:** Next.js 16.2.4 (Turbopack) + NestJS Backend (Port 5000)

---

## 📋 Table of Contents
1. [🔴 Critical Issues (Data / Pipeline)](#-critical-issues-data--pipeline)
2. [📊 Dashboard (Home Screen)](#-dashboard--home-screen)
3. [👥 Customer CRM](#-customer-crm)
4. [🚗 Vehicle Registry](#-vehicle-registry)
5. [📋 Job Cards](#-job-cards)
6. [🔧 Workshop Bays](#-workshop-bays)
7. [🧑‍🔧 Mechanics & Technicians](#-mechanics--technicians)
8. [📦 Parts & Inventory](#-parts--inventory)
9. [🛒 Procurement & Purchase Orders](#-procurement--purchase-orders)
10. [💳 Billing & GST Invoicing](#-billing--gst-invoicing)
11. [🏦 Accounting & Taxes](#-accounting--taxes)
12. [📈 Reports & Analytics](#-reports--analytics)
13. [⚙️ Settings](#-settings)
14. [🔌 Backend API & Service Layer](#-backend-api--service-layer)
15. [🗄️ Database & Schema](#-database--schema)
16. [🧩 Cross-Module / Global Issues](#-cross-module--global-issues)
17. [✅ Summary Table](#-summary-table)

---

## 🔴 Critical Issues (Data / Pipeline)

| # | Issue | Severity |
|---|-------|----------|
| C1 | **Duplicate Registration Number Collision**: When adding a customer without entering a vehicle plate, the default fallback was hardcoded to `'MH12 XX 0000'`. Any second customer saved without a plate caused a silent DB unique-constraint fail, resulting in the vehicle never being created. **FIXED** (randomized fallback added). | 🔴 Critical |
| C2 | **Data Not Refreshing After Add/Edit**: After adding or editing a Customer or Mechanic, the frontend used **optimistic local state only** (`setCustomers([newCust, ...customers])`). If the DB returned a proper UUID, the displayed list showed a fake temp ID. **FIXED** (re-fetch added after mutations). | 🔴 Critical |
| C3 | **Customer 360 Tabs Used Hardcoded Mock Data**: The Services and Payments tabs inside Customer 360 view fetched from `MOCK_CUSTOMER_SERVICES` / `MOCK_CUSTOMER_PAYMENTS` keyed by mock IDs like `CUST-101`. Real DB customers have UUIDs — tabs always showed empty for real data. **FIXED.** | 🔴 Critical |
| C4 | **Vehicles Tab Completely Disconnected From DB**: The Vehicle Registry page populated from `INITIAL_VEHICLE_REGISTRY` (empty static array). It never fetched vehicles from the database at all. **FIXED** (now hydrates from live customer API vehicles). | 🔴 Critical |
| C5 | **Job Cards Not Re-Fetched After Create**: `handleCreateJob` adds a local optimistic entry but **never calls `getJobCards()` after saving** to the backend. If the backend assigns a different ID or the request fails silently, the local state diverges permanently from the DB. | 🔴 Critical |
| C6 | **Billing Page Is Fully Disconnected**: The Billing page has **no API call** — neither on page load nor on invoice creation. Invoices created in the Billing tab are pure client-side state (lost on refresh). No backend endpoint is connected. | 🔴 Critical |
| C7 | **Procurement "Mark Received" Not Persisted**: `handleMarkReceived` in Procurement only mutates local React state but **never calls `receivePurchaseOrder(po.id)` to the backend**. After page refresh, the PO reverts to its original status from the DB. | 🔴 Critical |
| C8 | **Inventory Edit Does Not Persist to Backend**: `handleSaveEditPart` in the Inventory page modifies only local React state. No PATCH/PUT API call is made to the backend. All inventory edits are lost on page refresh. | 🔴 Critical |

---

## 📊 Dashboard / Home Screen

**File:** `frontend/src/app/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| D1 | **NaN in SVG Charts**: `RevenueAreaChart`, `DonutChart`, `HorizontalBarChart` received division-by-zero values when dataset was empty, causing SVG `y1`/`y2` attributes to be `NaN` and React console errors. **FIXED.** | Bug | 🟠 High |
| D2 | **KPI Badge Counts Are Static Fallbacks**: Dashboard badge counts silently show `0` with no error state or loading indicator if backend is offline. | UX | 🟡 Medium |
| D3 | **Revenue Chart Shows Zero When DB Is Empty**: The revenue area chart renders zero-value lines when no payments exist, giving a confusing visual instead of an empty-state placeholder. | UX | 🟡 Medium |
| D4 | **Donut Chart Proportions Wrong at Zero**: When all values are `0`, the donut chart renders all segments as `NaN` or equal size. | Bug | 🟡 Medium |
| D5 | **Dashboard Does Not Auto-Refresh**: KPIs only load once on mount. There is no polling or WebSocket connection to show live bay/job updates without a manual page reload. | Feature Gap | 🟢 Low |
| D6 | **`suppressHydrationWarning` Overused**: Multiple currency displays use `suppressHydrationWarning` unnecessarily, potentially masking real SSR hydration issues. | Code Quality | 🟢 Low |

---

## 👥 Customer CRM

**File:** `frontend/src/app/customers/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| CU1 | **Customer Gender Not Saved to Database**: The `gender` field is collected in the Add Customer form but the backend `CreateCustomerDto` and Prisma `Customer` model **have no `gender` field**. Gender is always silently discarded. | Data Loss | 🔴 Critical |
| CU2 | **Edit Customer Always Shows Gender as "Male"**: `fetchLiveCustomers` hardcodes `gender: 'Male'` for every customer returned from the API. Since gender isn't in the DB, this is always wrong. | Bug | 🟠 High |
| CU3 | **Fake Temp ID Briefly Visible**: `handleAddCustomer` still creates a local `newCust` with a fake `id: CUST-${random}` before refetching. For the split-second before `fetchLiveCustomers()` resolves, the list shows a fake ID that may cause flicker or key collisions. | UX | 🟡 Medium |
| CU4 | **Vehicle Reg Plate Has Random Fallback**: When no registration plate is provided, a random `MH12 XX XXXX` is generated. This creates junk data in the DB. Users should be warned or vehicle creation should be skipped if no plate is given. | UX | 🟡 Medium |
| CU5 | **Customer 360 — Vehicles Tab Shows "34,250 km" Hardcoded**: Every vehicle card in the 360 view shows odometer as hardcoded `34,250 km` rather than real data. | Bug | 🟡 Medium |
| CU6 | **Customer 360 — `lastVisit` Is Just `createdAt`**: The "Last Workshop Visit" card uses `createdAt` of the customer record, not the date of their most recent job card or payment. | Bug | 🟡 Medium |
| CU7 | **Delete Customer Cascades Not Handled**: Deleting a customer will fail at the DB level if that customer has any linked Vehicles, JobCards, or Payments. No cascade delete is configured in Prisma schema. The frontend will get a 500 error silently (safeFetch returns null). | Bug | 🟠 High |
| CU8 | **No Pagination on Customer List**: The full customer list is rendered in one pass with no pagination. On large datasets this will cause browser lag. | Performance | 🟡 Medium |
| CU9 | **Excel Import — Customer Vehicles Not Linked**: The bulk XLSX import creates customers but does not map imported vehicle data to the backend `vehicles` field, so imported customers have no vehicles attached. | Bug | 🟠 High |
| CU10 | **Dead Mock Variables Still Referenced**: `MOCK_CUSTOMER_SERVICES` and `MOCK_CUSTOMER_PAYMENTS` variables are still imported/referenced in the file even after the fix, causing potential TypeScript warnings. | Code Quality | 🟢 Low |

---

## 🚗 Vehicle Registry

**File:** `frontend/src/app/vehicles/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| VH1 | **No Dedicated Vehicles Backend Endpoint**: Vehicles are fetched by unwrapping the `vehicles` array from the customers endpoint (`GET /customers`). There is no `GET /vehicles` endpoint. | Architecture | 🟠 High |
| VH2 | **Vehicle Odometer Always Shows 0**: The vehicle list shows `odometerKm: 0` for every vehicle because no odometer data is stored or returned from the API. | Bug | 🟡 Medium |
| VH3 | **"Total Fleet Count" Is Hardcoded**: The "Registered Fleet" KPI card adds a hardcoded `+ 151` to the real count (`vehicles.length + 151`), displaying fake inflated numbers. | Bug | 🟠 High |
| VH4 | **Vehicle Status Always "SERVICED"**: Every vehicle returned from the API is mapped with `status: 'SERVICED'`. Real statuses (IN_WORKSHOP, SERVICE_DUE) are never pulled from the backend. | Bug | 🟡 Medium |
| VH5 | **"+ Job Card" Button Is a Placeholder**: The action button on each vehicle row calls `alert(...)` instead of navigating to the Jobs page or opening a job card modal. | Feature Gap | 🟠 High |
| VH6 | **"History" Button Is a Placeholder**: The "History" button calls `alert(...)` with no real service history shown. | Feature Gap | 🟠 High |
| VH7 | **Register Vehicle — Links to Wrong Customer**: When a vehicle is registered for an existing customer name with a different phone number, a duplicate customer may be created. | Data Integrity | 🟠 High |
| VH8 | **Fleet Lifetime Value Is Hardcoded**: The "Fleet Lifetime Value" card shows a static `₹14.8L` regardless of actual payment totals. | Bug | 🟡 Medium |

---

## 📋 Job Cards

**File:** `frontend/src/app/jobs/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| JC1 | **Job Cards Not Fetched From DB on Load**: `useEffect` calls `getJobCards()` but the result is **never mapped into the `jobCards` state array**. The page always shows an empty list on initial load, regardless of how many job cards exist in the database. | Bug | 🔴 Critical |
| JC2 | **Mechanic Selection Is a Hardcoded List**: The mechanic dropdown uses a static `MECHANICS_LIST` array, completely disconnected from the Mechanics database. | Data Integrity | 🟠 High |
| JC3 | **Job Card Status Cannot Be Updated**: There is no UI action to change a job card status from PENDING → IN_PROGRESS → COMPLETED → DELIVERED. | Feature Gap | 🔴 Critical |
| JC4 | **Job Card Creation May Duplicate Vehicles**: When creating a job card, only `registrationNo` is sent. If the vehicle doesn't exist, a new one is created — potentially duplicating vehicles already registered. | Data Integrity | 🟡 Medium |
| JC5 | **"Collect Payment" Opens Modal Without Real Job Card ID**: The PaymentModal is opened with the selected `JobCardItem`, but the frontend's `JobCardItem` uses a fake local `id` (not the DB UUID). Payments submitted from this modal may fail or attach to wrong job cards. | Bug | 🔴 Critical |
| JC6 | **Parts Added to Job Card Are Lost**: The "Spare Parts" section calculates `totalEstimatedCost` but does not serialize or POST the parts list to the backend. No parts are linked in the DB. | Feature Gap | 🟠 High |
| JC7 | **Barcode Scanner Returns `alert()` Only**: Scanning a barcode shows an alert with the scanned code but takes no real action (does not auto-fill a part, attach to a job, or update inventory). | Feature Gap | 🟡 Medium |
| JC8 | **No Delete / Cancel Job Card Function**: There is no way to delete or cancel a job card from the UI. | Feature Gap | 🟡 Medium |

---

## 🔧 Workshop Bays

**File:** `frontend/src/app/workshop-bays/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| WB1 | **Bay Allocation Uses Fake Job Card ID**: `handleConfirmAllocation` calls `allocateWorkshopBay` with a fake jobCardId string that doesn't correspond to any real job card UUID. The backend will throw a foreign key error. | Bug | 🔴 Critical |
| WB2 | **Bay Data Falls Back to Hardcoded Defaults**: If `getWorkshopBays()` returns `null` or an empty array, the page falls back to 5 hardcoded bays with no IDs matching any DB records. Releasing or allocating these sends invalid IDs to the backend. | Bug | 🟠 High |
| WB3 | **Live Elapsed Timer Not Persisted**: The `assignedAt` timestamp is set with `Date.now()` in local state only. After page refresh, all elapsed timers reset to `0m 0s`. | Bug | 🟡 Medium |
| WB4 | **API Polling Every 4 Seconds Continuously**: A 4-second polling interval runs forever while on the Workshop Bays page. This creates excessive API traffic. | Performance | 🟡 Medium |
| WB5 | **"Add Bay" Button Is Missing**: There is no UI to create new workshop bays. Bay data can only be seeded into the database manually. | Feature Gap | 🟠 High |

---

## 🧑‍🔧 Mechanics & Technicians

**File:** `frontend/src/app/mechanics/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| ME1 | **Mechanic Phone Always Shows Dummy Number**: All mechanics fetched from the API show `phone: '+91 98000 00000'` — hardcoded. The backend `User` model does not store phone numbers. | Data Gap | 🟠 High |
| ME2 | **Mechanic Specialty Always "Senior Mechanic"**: API mapping hardcodes `specialty: 'Senior Mechanic'` for every mechanic, ignoring actual role data. | Bug | 🟡 Medium |
| ME3 | **Rating Always 4.9**: Every mechanic is shown with `rating: 4.9`. No ratings engine exists in the backend. | Bug | 🟡 Medium |
| ME4 | **Daily/Monthly Salary Always Hardcoded**: `dailySalary: 850, monthlySalary: 25500` is hardcoded in the mapping. The backend `User` model has no salary fields. | Data Gap | 🟡 Medium |
| ME5 | **Attendance Record Is Local State Only**: `handleSaveAttendance` updates `attendanceStatus` in local state only. There is no backend endpoint for attendance. All attendance records are lost on refresh. | Feature Gap | 🔴 Critical |
| ME6 | **Performance Modal Is Fully Static**: The performance view shows only hardcoded data with no real job metrics from the DB. | Bug | 🟡 Medium |
| ME7 | **No Update Mechanic API**: There is no "Edit Mechanic" functionality in the UI or API (`PATCH /mechanics/:id` is missing). | Feature Gap | 🟡 Medium |

---

## 📦 Parts & Inventory

**File:** `frontend/src/app/inventory/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| IN1 | **Inventory Edit Not Persisted**: `handleSaveEditPart` only mutates local state. No PATCH API call is made. All edits are lost on refresh. | Bug | 🔴 Critical |
| IN2 | **Inventory Delete Missing**: There is no delete button or API call for removing inventory items. | Feature Gap | 🟠 High |
| IN3 | **API URL Hardcoded**: `fetch('http://localhost:5000/procurement/inventory')` — hardcoded `localhost:5000` instead of using the `API_BASE_URL` constant from `api.ts`. Will break in production. | Pipeline | 🟠 High |
| IN4 | **Imported Excel Does Not Sync With Backend**: After importing an Excel file, new inventory items are added to local state only. No POST to the backend inventory endpoint is made. Items are lost on refresh. | Bug | 🔴 Critical |
| IN5 | **Inventory Quantity Not Decremented on Job Card Use**: When parts are added to a job card, inventory stock quantities are never reduced in the backend. | Data Integrity | 🔴 Critical |
| IN6 | **Low Stock Alert Is Visual Only**: The red badge for items below `minQuantity` is UI-only. No notification, email, or reorder trigger is fired. | Feature Gap | 🟡 Medium |
| IN7 | **`useSearchParams` Without Suspense Boundary**: `InventoryPage` uses `useSearchParams()` directly without wrapping in a `<Suspense>` boundary, which can cause Next.js build warnings or hydration failures. | Bug | 🟡 Medium |

---

## 🛒 Procurement & Purchase Orders

**File:** `frontend/src/app/procurement/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| PR1 | **"Mark Received" Not Persisted**: `handleMarkReceived(id)` only updates local state. `receivePurchaseOrder(id)` is never called. PO status reverts on refresh. | Bug | 🔴 Critical |
| PR2 | **Create PO Backend Payload Missing Required Fields**: `createPurchaseOrder({ vendorName, itemsSummary, totalAmount })` is called, but the backend endpoint expects a `supplierId` (linked to a `Supplier` model). The call likely silently fails. | Pipeline | 🔴 Critical |
| PR3 | **PO Number Generation Has Collision Risk**: `poNumber: \`PO-2026-0${orders.length + 90}\`` — purely sequential based on local state count. Collisions are possible if orders are already loaded from the DB. | Bug | 🟡 Medium |
| PR4 | **"Reorder Suggestions" KPI Is Hardcoded**: The "3 Parts Below Safety Stock" card is a hardcoded string — not calculated from real inventory `minQuantity` thresholds. | Bug | 🟠 High |
| PR5 | **No PO Items Submitted**: The Create PO modal collects vendor name and total but no line items. The backend `PurchaseOrderItem` children are never populated. | Feature Gap | 🟠 High |
| PR6 | **PO Refetch Not Triggered After Create**: `handleCreatePO` adds a local item then silently POSTs, but does not call `fetchLivePOList()` afterward to re-sync with DB-assigned IDs. | Bug | 🟡 Medium |

---

## 💳 Billing & GST Invoicing

**File:** `frontend/src/app/billing/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| BI1 | **No API Connection — Entire Page Is Client-Side Only**: The Billing page has zero API calls. Invoices are not fetched from or saved to the database. All data is lost on refresh. | Bug | 🔴 Critical |
| BI2 | **GST Rate Is Hardcoded at 18%**: The tax rate is hardcoded as `subtotal * 0.18`. There is no configuration option for different HSN codes, 5%/12%/28% GST slabs, or exempt items. | Feature Gap | 🟠 High |
| BI3 | **Invoice Number Format Includes Full UUID**: Invoice number is formatted as `` `GB-2026-${nextId}` `` where `nextId` is a full UUID — resulting in a very long invoice number string. | UX | 🟡 Medium |
| BI4 | **Print Invoice Is a Placeholder**: The "Print Invoice" button and `selectedPrintInvoice` state exist but are never rendered — no print view or PDF generation is connected. | Feature Gap | 🟠 High |
| BI5 | **"Record Payment" Opens PaymentModal Without Job Card ID**: Any submitted payment creates an orphaned general payment with a dummy customer in the DB. | Bug | 🟡 Medium |
| BI6 | **No Link Between Billing Invoices and Job Cards**: Billing invoices are standalone — they have no FK relationship to job cards, so payments on invoices don't appear in job card history or customer 360. | Architecture | 🔴 Critical |

---

## 🏦 Accounting & Taxes

**File:** `frontend/src/app/accounting/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| AC1 | **IGST Displays Without `formatCurrency`**: Line 153 renders `₹{financialSummary.igst}` — missing `formatCurrency()` wrapper. Will display raw decimal numbers (e.g. `₹2500.5`). | Bug | 🟡 Medium |
| AC2 | **Time Range Filter Has No Effect**: The `timeRange` dropdown is set but never passed to the API call. The backend always returns all-time data regardless of selected filter. | Bug | 🟠 High |
| AC3 | **"Record Payment" Without Job Card Context**: Payment recorded from Accounting has no associated job card — the backend auto-creates orphaned job cards and customers to satisfy FK constraints. | Data Integrity | 🟡 Medium |
| AC4 | **CSV Export Exports Empty Array on First Load**: If payments haven't loaded yet when "Export CSV" is clicked, it exports an empty CSV. No loading state guard is in place. | Bug | 🟡 Medium |
| AC5 | **No Labour/Salary Cost Tracking**: Net Profit calculation only subtracts ProcurementExpense. Salary costs, utilities, and labour costs are not factored in, making the profit figure inaccurate. | Feature Gap | 🟡 Medium |

---

## 📈 Reports & Analytics

**File:** `frontend/src/app/reports/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| RE1 | **All Data Arrays Are Empty — Entire Page Is Placeholder**: `fullRevenueData`, `baseMechanics`, and `baseParts` are all initialized as empty arrays `[]`. The entire Reports page displays EmptyState placeholders with **zero real data**. No API calls are made. | Bug | 🔴 Critical |
| RE2 | **"This Month" Filter Is Hardcoded to July**: `timeRange === 'THIS_MONTH'` filters for `d.month === 'Jul'` — hardcoded to July 2026, not dynamic relative to the current month. | Bug | 🟠 High |
| RE3 | **"+14.2% YoY" Growth Badge Is Hardcoded**: The Year-over-Year growth badge always shows `+14.2%` regardless of actual revenue. | Bug | 🟡 Medium |
| RE4 | **Export CSV Exports Nothing**: Since all data arrays are empty, "Export Analytics CSV" downloads a CSV with headers only. | Bug | 🟡 Medium |
| RE5 | **Mechanic Leaderboard Never Populated**: The technician productivity leaderboard would show an EmptyState even if mechanics and job cards exist in the DB. | Bug | 🔴 Critical |

---

## ⚙️ Settings

**File:** `frontend/src/app/settings/page.tsx`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| SE1 | **Settings Are Not Persisted Anywhere**: All settings (workshop name, GST number, business hours, email templates, etc.) are stored in local React `useState`. None are saved to a backend endpoint or `localStorage`. All changes are lost on page refresh. | Bug | 🔴 Critical |
| SE2 | **"Save Changes" Has No Backend Call**: The "Save" buttons throughout the settings page call `alert('Settings saved successfully!')` with no actual API call. | Bug | 🔴 Critical |
| SE3 | **Logo Upload Is Visual Only**: The logo upload preview stores the file as a local `FileReader` data URL in state. It is never uploaded to a storage service or backend. | Bug | 🟠 High |
| SE4 | **Dark/Light Mode Theme Toggle Does Nothing**: The theme toggle switches a `themeMode` state variable but does not apply any class or CSS variable to the document root. The actual theme never changes. | Bug | 🟠 High |
| SE5 | **Email Template Customization Has No SMTP Config**: Email templates can be edited, but there is no SMTP configuration section and no backend email-sending service wired up. | Feature Gap | 🟡 Medium |
| SE6 | **GST Number Field Has No Validation**: The GSTIN field accepts any string without regex validation for the Indian GST format. | UX | 🟢 Low |

---

## 🔌 Backend API & Service Layer

**Files:** `backend/src/**`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| BE1 | **No Authentication / Authorization**: The entire backend API has **no guards, no JWT middleware, no authentication**. Any user on the network can read/write/delete all data. | Security | 🔴 Critical |
| BE2 | **No CORS Configuration**: `main.ts` likely has wildcard `*` CORS. This allows any origin to make API calls, posing a security risk in production. | Security | 🟠 High |
| BE3 | **Payment Creation Auto-Creates Orphaned Records**: `payments.service.ts` auto-creates a fallback customer (`'General Customer'`) and vehicle if a valid job card ID is not found. This pollutes the DB with junk records. | Data Integrity | 🟠 High |
| BE4 | **No Vehicles CRUD Endpoint**: There is no `VehiclesModule` or `GET/POST /vehicles` endpoint. Vehicles can only be created as a side-effect of customer or job card creation. | Architecture | 🟠 High |
| BE5 | **Mechanics Backend Silently Drops Extra Fields**: `createMechanic` accepts `specialty`, `shiftHours`, `dailySalary`, `monthlySalary` from the frontend, but the `User` model only stores `name`, `email`, `password`, `role`. All extra fields are silently dropped. | Data Loss | 🟠 High |
| BE6 | **No Input Validation / DTOs Decorated**: Most DTOs lack `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, etc.). Invalid payloads reach Prisma and cause cryptic 500 errors. | Stability | 🟠 High |
| BE7 | **`safeFetch` Swallows All Errors**: The frontend's `safeFetch` returns `null` on any non-OK response without surfacing the error message to the user. Users have no idea why an operation failed. | UX | 🟡 Medium |
| BE8 | **Job Cards Mechanic Assignment Missing**: `createJobCard` DTO accepts `mechanicName` as a string but doesn't look up the actual `User` UUID to set `mechanicId`. Mechanics are never properly assigned to job cards. | Bug | 🟠 High |
| BE9 | **Accounting Summary Has No Time-Range Filter**: The dashboard `paymentBreakdown` always returns all-time totals with no time-range parameter. | Feature Gap | 🟡 Medium |
| BE10 | **No Rate Limiting**: The API has no rate limiting middleware. Endpoints like `POST /customers` and `POST /payments` can be called unlimited times. | Security | 🟡 Medium |

---

## 🗄️ Database & Schema

**File:** `backend/prisma/schema.prisma`

| # | Issue | Type | Severity |
|---|-------|------|----------|
| DB1 | **No Cascade Deletes Configured**: Deleting a Customer with linked Vehicles, JobCards, or Payments throws a Prisma FK constraint error. No `onDelete: Cascade` is set on any relation. | Stability | 🔴 Critical |
| DB2 | **Vehicle Has No Year, Color, Odometer Fields**: The `Vehicle` model only has `registrationNo`, `make`, `model`, `fuelType`, `customerId`. Many fields collected in the frontend forms (year, color, odometer, variant) are never stored. | Data Gap | 🟠 High |
| DB3 | **Customer Has No Gender Field**: The gender field is shown prominently in the UI but doesn't exist in the schema. | Data Gap | 🟠 High |
| DB4 | **User Model Has No Phone / Salary / Specialty Fields**: The `User` (Mechanic) model only stores basic auth fields. Mechanic-specific HR data (phone, specialty, daily salary, shift hours) cannot be stored. | Data Gap | 🟠 High |
| DB5 | **No `Attendance` Model**: Mechanic attendance tracking has no schema table. Cannot be stored. | Data Gap | 🟠 High |
| DB6 | **JobCard Has No `estimatedCost` Field**: The job card form calculates an `estimatedCost` but the `JobCard` schema has no such column. This value is never persisted. | Data Gap | 🟡 Medium |
| DB7 | **No `Invoice` Model**: The Billing page creates invoices, but there is no `Invoice` table in the schema. Billing data has nowhere to go. | Architecture | 🔴 Critical |
| DB8 | **`InventoryItem.supplier` Is a Duplicate String Field**: The schema has both `supplierId String?` (FK) and `supplier String?` (plain text). This is redundant and creates inconsistency. | Schema | 🟡 Medium |
| DB9 | **No Soft Deletes / Audit Trail**: All deletions are hard deletes with no `deletedAt` timestamp or audit log. Accidental deletions cannot be recovered. | Feature Gap | 🟡 Medium |
| DB10 | **PurchaseOrder Has No `expectedDelivery` Field**: The frontend sends and displays `expectedDelivery` but the `PurchaseOrder` schema has no such column. | Data Gap | 🟡 Medium |

---

## 🧩 Cross-Module / Global Issues

| # | Issue | Type | Severity |
|---|-------|------|----------|
| GL1 | **No Loading Spinner on Initial Page Loads**: All pages that fetch from API have no loading skeleton or spinner. User sees an empty table/list for 1–3 seconds before data arrives. | UX | 🟡 Medium |
| GL2 | **`INITIAL_VEHICLE_REGISTRY` and `INITIAL_CUSTOMER_REGISTRY` Are Dead Code**: These legacy static arrays are imported across multiple pages but serve no purpose now that API fetching is used. | Code Quality | 🟢 Low |
| GL3 | **No Error Boundary**: If any API call throws an unhandled exception (e.g. backend is down), there is no `ErrorBoundary` component to catch it. The entire page can crash. | Stability | 🟠 High |
| GL4 | **`Snackbar` Toast Auto-Dismiss Not Consistent**: Some pages clear toasts with `setTimeout`, others rely on `onClose` callback. There is no centralized toast/notification system. | UX | 🟢 Low |
| GL5 | **API Base URL Not Configurable for Production**: `API_BASE_URL` defaults to `http://localhost:5000`. There is no `.env.production` or deployment-specific override documented. | Pipeline | 🟠 High |
| GL6 | **No Offline / Disconnected State Detection**: If the backend goes offline mid-session, users receive no indication. Forms submit silently and data is lost. | UX | 🟡 Medium |
| GL7 | **`alert()` Used for Validation Errors**: Multiple forms use browser `alert()` for validation. These are blocking, non-styled, and poor UX on mobile. | UX | 🟢 Low |
| GL8 | **Sidebar Active State May Desync**: The sidebar uses `usePathname()` for active link detection. If a user navigates via browser back/forward, the active highlight may not update correctly. | Bug | 🟢 Low |
| GL9 | **No Role-Based Access Control in Frontend**: All pages are accessible to any user. There is no concept of admin vs. mechanic vs. receptionist roles in the UI routing. | Security | 🟠 High |

---

## ✅ Summary Table

| Screen / Module | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | Total |
|----------------|------------|---------|----------|--------|-------|
| Global / Pipeline | 1 | 3 | 3 | 3 | **10** |
| Dashboard | 0 | 1 | 3 | 2 | **6** |
| Customer CRM | 2 | 3 | 4 | 1 | **10** |
| Vehicle Registry | 0 | 4 | 3 | 0 | **7** |
| Job Cards | 4 | 2 | 2 | 0 | **8** |
| Workshop Bays | 1 | 2 | 2 | 0 | **5** |
| Mechanics | 1 | 1 | 5 | 0 | **7** |
| Inventory | 3 | 2 | 2 | 0 | **7** |
| Procurement | 2 | 3 | 1 | 0 | **6** |
| Billing | 2 | 2 | 2 | 0 | **6** |
| Accounting | 0 | 1 | 4 | 0 | **5** |
| Reports & Analytics | 2 | 1 | 2 | 0 | **5** |
| Settings | 2 | 2 | 1 | 1 | **6** |
| Backend API | 2 | 6 | 2 | 0 | **10** |
| Database / Schema | 2 | 5 | 3 | 0 | **10** |
| **TOTAL** | **24** | **38** | **39** | **7** | **108** |

---

## 🎯 Recommended Fix Priority Order

### Phase 1 — Immediate (Data Integrity)
1. Add cascade deletes to Prisma schema (`DB1`)
2. Connect Job Cards page to DB fetch and re-fetch on create (`JC1`, `C5`)
3. Persist Inventory edits and Excel imports to backend (`IN1`, `IN4`)
4. Fix Procurement "Mark Received" to call backend (`PR1`)
5. Add `gender`, `year`, `odometer`, `salary` fields to schema (`DB2`, `DB3`, `DB4`)
6. Fix Workshop Bay allocation fake job card ID (`WB1`)

### Phase 2 — Architecture & API
1. Add Authentication (JWT Guards) to all endpoints (`BE1`)
2. Create dedicated `/vehicles` CRUD endpoints (`BE4`)
3. Create `Invoice` model and connect Billing page (`DB7`, `BI1`)
4. Add `class-validator` to all DTOs (`BE6`)
5. Connect Reports page to real API data (`RE1`)

### Phase 3 — UX & Polish
1. Add loading skeletons / spinners to all data pages (`GL1`)
2. Add pagination to Customer and Vehicle lists (`CU8`)
3. Implement Settings persistence (localStorage or DB) (`SE1`, `SE2`)
4. Replace `alert()` with proper inline validation UI (`GL7`)
5. Connect Mechanics page to real phone/specialty/salary data (`ME1`–`ME4`)

---

*Report generated by Antigravity AI. All line references are approximate to the version reviewed on 2026-09-16.*
