# 🚗 Garage Book  

> **A Smart Garage Management System**  
> A modern, digital solution designed to efficiently manage garage operations, replacing traditional manual record-keeping with a fast, organized, and user-friendly system.

---

## 📖 Overview

**Garage Book** is a comprehensive garage management web application tailored to streamline daily workshop activities. It empowers garage owners to seamlessly manage customer information, track vehicle service history, handle billing processes, and maintain parts inventory in a structured and efficient way.

Built with modern web technologies, this project focuses on improving productivity, minimizing human errors, and providing a professional workflow for automobile workshops of all sizes.

---

## 🚀 Key Features

- **👤 Customer Management**: Easily add, update, and track customer profiles and service history.
- **🚗 Vehicle & Service Management**: Store multiple vehicles per customer, track repair histories, and maintain detailed job cards.
- **💰 Billing & Invoicing**: Generate accurate invoices automatically, track payments, and manage service charges without manual calculation errors.
- **📦 Inventory Management**: Maintain a parts catalog with built-in barcode/SKU generation and bulk Excel import/export functionality.
- **🛠️ Workshop Bays & Mechanics**: Assign jobs to specific mechanics and manage workshop bay utilization.
- **⚡ Built for Speed**: Includes zero-lag pagination (`pagebutton`) and live multi-field auto-fill (`Autofill 2`) to ensure data entry is lightning fast.

---

## 🛠️ Tech Stack

This project is built using a modern, full-stack JavaScript/TypeScript architecture.

### **Frontend**
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Language**: TypeScript
- **Styling**: CSS / UI Components
- **State Management & Data Fetching**: React Hooks, Axios
- **Other Tools**: Lucide React (Icons), SheetJS (Excel parsing)

### **Backend**
- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: TypeScript
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: JWT (JSON Web Tokens), Passport
- **Database**: SQLite / PostgreSQL (Configurable via Prisma)

---

## 📂 Project Structure

```text
GarageBook/
│
├── frontend/             # Next.js web application
│   ├── src/app/          # Next.js App Router pages
│   ├── src/components/   # Reusable React components
│   └── public/           # Static assets
│
├── backend/              # NestJS API server
│   ├── src/              # Controllers, Services, and Modules
│   └── prisma/           # Database schema and migrations
│
├── .agents/              # Custom AI Agent configurations and rules
└── README.md             # Project documentation
```

---

## 🏗️ Architecture

```mermaid
flowchart TD

subgraph group_frontend["Next.js Client"]
  node_next_shell["Application shell<br/>Next.js app<br/>[layout.tsx]"]
  node_operator_screens["Operations screens<br/>Next.js routes<br/>[page.tsx]"]
  node_finance_screens["Finance screens<br/>Next.js routes<br/>[page.tsx]"]
  node_session_gate["Session gate<br/>auth component<br/>[AuthWrapper.tsx]"]
  node_api_client{{"HTTP client<br/>API boundary<br/>[api.ts]"}}
  node_offline_pwa["Offline/PWA support<br/>service worker<br/>[sw.js]"]
  node_barcode_capture["Barcode capture<br/>client component"]
end

subgraph group_backend["NestJS API"]
  node_nest_bootstrap["API bootstrap<br/>NestJS runtime<br/>[main.ts]"]
  node_app_composition["Application modules<br/>NestJS root module<br/>[app.module.ts]"]
  node_auth_api["Authentication API<br/>NestJS controller/service<br/>[auth.controller.ts]"]
  node_jwt_enforcement{{"JWT enforcement<br/>guard and strategy<br/>[jwt-auth.guard.ts]"}}
  node_master_data_api["Workshop master data<br/>NestJS domain APIs"]
  node_job_cards_api["Job-card lifecycle<br/>NestJS controller/service"]
  node_billing_api["Billing<br/>NestJS controller/service<br/>[billing.service.ts]"]
  node_payments_api["Payments<br/>NestJS controller/service"]
  node_accounting_api["Accounting<br/>NestJS controller/service"]
  node_procurement_api["Procurement<br/>NestJS controller/service"]
  node_admin_api["Dashboard and settings<br/>NestJS controllers"]
end

subgraph group_data["Persistence"]
  node_prisma_service{{"Prisma access layer<br/>Prisma service<br/>[prisma.service.ts]"}}
  node_prisma_schema["Data model<br/>Prisma schema<br/>[schema.prisma]"]
  node_sqlite_db[("Local SQLite database<br/>[dev.db]")]
end

node_next_shell -->|"gates routes"| node_session_gate
node_next_shell -->|"hosts"| node_operator_screens
node_next_shell -->|"hosts"| node_finance_screens
node_next_shell -->|"enables"| node_offline_pwa
node_operator_screens -->|"API calls"| node_api_client
node_finance_screens -->|"API calls"| node_api_client
node_barcode_capture -->|"supplies scan input"| node_operator_screens
node_session_gate -.->|"authenticates via"| node_auth_api
node_api_client -->|"HTTP requests"| node_nest_bootstrap
node_nest_bootstrap -->|"starts"| node_app_composition
node_app_composition -->|"registers"| node_auth_api
node_app_composition -->|"registers"| node_master_data_api
node_app_composition -->|"registers"| node_job_cards_api
node_app_composition -->|"registers"| node_billing_api
node_app_composition -->|"registers"| node_payments_api
node_app_composition -->|"registers"| node_accounting_api
node_app_composition -->|"registers"| node_procurement_api
node_auth_api -->|"issues protected access"| node_jwt_enforcement
node_jwt_enforcement -.->|"protects"| node_master_data_api
node_master_data_api -->|"provides service references"| node_job_cards_api
node_job_cards_api -->|"creates billable work"| node_billing_api
node_billing_api -->|"creates obligations"| node_payments_api
node_payments_api -->|"records financial activity"| node_accounting_api
node_procurement_api -->|"feeds acquisition records"| node_accounting_api
node_master_data_api -->|"reads and writes"| node_prisma_service
node_job_cards_api -->|"reads and writes"| node_prisma_service
node_billing_api -->|"reads and writes"| node_prisma_service
node_payments_api -->|"reads and writes"| node_prisma_service
node_accounting_api -->|"queries"| node_prisma_service
node_procurement_api -->|"reads and writes"| node_prisma_service
node_prisma_service -->|"uses model"| node_prisma_schema
node_prisma_schema -->|"maps to"| node_sqlite_db

click node_next_shell "https://github.com/manish-sherawat/garage-book/blob/main/frontend/src/app/layout.tsx"
click node_operator_screens "https://github.com/manish-sherawat/garage-book/blob/main/frontend/src/app/jobs/page.tsx"
click node_finance_screens "https://github.com/manish-sherawat/garage-book/blob/main/frontend/src/app/billing/page.tsx"
click node_session_gate "https://github.com/manish-sherawat/garage-book/blob/main/frontend/src/components/AuthWrapper.tsx"
click node_api_client "https://github.com/manish-sherawat/garage-book/blob/main/frontend/src/utils/api.ts"
click node_offline_pwa "https://github.com/manish-sherawat/garage-book/blob/main/frontend/public/sw.js"
click node_barcode_capture "https://github.com/manish-sherawat/garage-book/blob/main/frontend/src/components/BarcodeScannerModal.tsx"
click node_nest_bootstrap "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/main.ts"
click node_app_composition "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/app.module.ts"
click node_auth_api "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/auth/auth.controller.ts"
click node_jwt_enforcement "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/auth/jwt-auth.guard.ts"
click node_master_data_api "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/customers/customers.controller.ts"
click node_job_cards_api "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/job-cards/job-cards.service.ts"
click node_billing_api "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/billing/billing.service.ts"
click node_payments_api "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/payments/payments.service.ts"
click node_accounting_api "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/accounting/accounting.service.ts"
click node_procurement_api "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/procurement/procurement.service.ts"
click node_admin_api "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/dashboard.controller.ts"
click node_prisma_service "https://github.com/manish-sherawat/garage-book/blob/main/backend/src/prisma/prisma.service.ts"
click node_prisma_schema "https://github.com/manish-sherawat/garage-book/blob/main/backend/prisma/schema.prisma"
click node_sqlite_db "https://github.com/manish-sherawat/garage-book/blob/main/backend/prisma/dev.db"

classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
class node_next_shell,node_operator_screens,node_finance_screens,node_session_gate,node_api_client,node_offline_pwa,node_barcode_capture toneBlue
class node_nest_bootstrap,node_app_composition,node_auth_api,node_jwt_enforcement,node_master_data_api,node_job_cards_api,node_billing_api,node_payments_api,node_accounting_api,node_procurement_api,node_admin_api toneAmber
class node_prisma_service,node_prisma_schema,node_sqlite_db toneMint
```

---

## ⚙️ Getting Started

### 🔧 Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher)
- **npm** (or yarn/pnpm)
- **Git**

### 📥 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/manish-sherawat/Garage-Book.git
   cd Garage-Book
   ```

2. **Setup the Backend**
   ```bash
   cd backend
   npm install
   # Set up your environment variables (create a .env file)
   # Run Prisma migrations
   npx prisma migrate dev
   # Start the backend server
   npm run start:dev
   ```

3. **Setup the Frontend**
   ```bash
   cd ../frontend
   npm install
   # Start the Next.js development server
   npm run dev
   ```

4. **Access the Application**
   Open your browser and navigate to `http://localhost:3000` (or the port specified by Next.js). The API will typically be running on `http://localhost:3001` (or as configured).

---

## 📄 License

This project is licensed under the MIT License.
