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

## Hackathon Team Work Distribution

* **Frontend Lead:** Auth logic, UI design system, Dashboard (Screen 1 & 2)
* **Admin Lead:** Organization master data, Role Management, Database Schema (Screen 3)
* **Assets Lead:** Asset Lifecycle (Registration, Allocation, Audits) (Screens 4, 5, 8)
* **Operations Lead:** Resource Bookings, Maintenance Workflow, Reports (Screens 6, 7, 9, 10)

## Team Collaboration Workflow

To ensure the team can work on their separate roles simultaneously without Git conflicts:

1. **Clone the Repository:** Everyone should pull this initialized codebase to their local machine.
2. **Create Feature Branches:** When starting your designated task, create a separate branch. For example:
   * Frontend Lead: `git checkout -b feature/auth-dashboard`
   * Admin Lead: `git checkout -b feature/org-setup`
   * Assets Lead: `git checkout -b feature/asset-registration`
   * Operations Lead: `git checkout -b feature/resource-bookings`
3. **Modular Development:** Because Next.js App Router uses folder-based routing, you will naturally be working in different directories under `app/`. E.g., The Admin lead will work in `app/admin/`, the Operations lead in `app/bookings/`, etc. This minimizes merge conflicts.
4. **Merge to Main:** Once a screen is complete and tested, create a Pull Request on GitHub and merge it back into `main`.

## UI Design System & Styling

To maintain a consistent, premium aesthetic across the app, we are using an **Odoo-inspired Design System**. All core styles are defined as CSS variables in `src/app/globals.css`. 

**Please use these pre-defined classes and variables rather than hardcoding colors!**

### CSS Variables (Colors)
Use these via the `var(--variable-name)` syntax in your CSS modules or inline styles:
- `var(--color-primary)`: Dark Purple (`#714B67`) - Use for active states and primary buttons.
- `var(--color-secondary)`: Teal (`#017E84`) - Use for accents.
- `var(--color-background)`: Light Gray (`#F9F9F9`) - Main app background.
- `var(--color-surface)`: Pure White (`#FFFFFF`) - Use for cards, modals, and input backgrounds.
- `var(--color-text-main)`: Dark Text (`#111827`)
- `var(--color-text-muted)`: Gray Text (`#6B7280`) - Use for subtitles/labels.
- **Status Colors:** `var(--color-success)`, `var(--color-warning)`, `var(--color-danger)`, `var(--color-info)`.

### Reusable Global Classes
Just add these class names to your HTML elements (no extra CSS required):
- `card`: Creates a white surface with a subtle border and hover shadow. Perfect for dashboard widgets or forms.
- `input-field`: A clean, bordered text input that highlights purple on focus.
- `btn-primary`: A solid purple button with hover effects.
- `btn-secondary`: An outlined purple button with subtle hover effects.
- `glass-panel`: A translucent, blurred background effect for modern overlapping UI elements.
