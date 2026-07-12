# AssetFlow

**Enterprise Asset & Resource Management System**

## Mission
The vision for AssetFlow is to simplify and digitize how organizations track, allocate, and maintain their physical assets and shared resources through a centralized ERP platform.

## Features
- **Authentication:** Custom JWT with realistic, non-self-elevating account creation.
- **Dashboard:** Real-time KPI snapshot.
- **Organization Setup:** Manage departments, asset categories, and the employee directory.
- **Asset Registration:** Register and track assets centrally.
- **Allocation & Transfers:** Manage asset possession with strict conflict rules (no double allocation).
- **Resource Booking:** Calendar-based booking for shared rooms/equipment without overlaps.
- **Maintenance:** Workflow-driven repair approvals.
- **Audits:** Structured verification cycles.
- **Reporting & Analytics:** Utilization trends and asset history.

## Tech Stack
- **Frontend:** Next.js (App Router), Vanilla CSS Modules
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Language:** JavaScript

## Getting Started

1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run database migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed the database (Creates Super Admin):**
   ```bash
   node seed.js
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Roles & Permissions

AssetFlow is designed with four strict roles, which dictate user capabilities. Role assignment is centralized and secure.

- **Employee:** Can view their own allocated assets, book shared resources, raise maintenance requests, and initiate transfer/return requests. New signups default to this role.
- **Department Head:** Same as Employee, plus they can view all assets allocated to their department, approve intra-department transfers, and book resources on behalf of the department.
- **Asset Manager:** Has global view of assets. Registers new assets, allocates them globally, and acts as the final approver for transfers, maintenance requests, returns, and audit discrepancies.
- **Admin:** Has master control over the organizational structure. The Admin creates Departments, Asset Categories, and manages the Employee Directory. **Crucially, the Admin is the ONLY role that can promote an Employee to a Department Head or Asset Manager.**

## Hackathon Submission Notes

Thank you for evaluating AssetFlow! 
Our team focused heavily on creating a robust role-based access control (RBAC) system and a clean, premium "Odoo-inspired" user interface. The Next.js App Router provides a modular structure, and our custom JWT authentication ensures that users cannot elevate their own privileges. 

We hope you enjoy exploring the system!
