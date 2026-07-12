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

## Getting Started (Evaluator Guide)

We have created a simple startup script to automatically spin up the database, install dependencies, set up the schema, seed the data, and start the development server.

1. **Run the Startup Script:**
   Navigate to the `assetflow` folder and run the `start.bat` script:
   ```bash
   cd assetflow
   .\start.bat
   ```
   *(Or just double-click the `start.bat` file inside the `assetflow` folder in File Explorer!)*

2. **Access the Application:**
   Once the server is running, open your browser and navigate to `http://localhost:3000`.

3. **Super Admin Credentials:**
   The `start.bat` script automatically creates an admin user for you to test with:
   - **Email:** `admin@gmail.com`
   - **Password:** `admin123`

4. **Demo Data Included:**
   The script also seeds the database with a robust set of realistic test data so you can immediately explore the app's features:
   - **3 Departments:** HR, Finance, IT
   - **10 Asset Categories:** Laptops, Monitors, Keyboards, Mice, Phones, Servers, Desks, Chairs, Projectors, Vehicles
   - **27 Employees:** 9 users per department (including roles for Department Head, Asset Manager, and regular Employees).
     *All employee accounts use the password: `password123`*
   - **10 Sample Assets** ready to be allocated or transferred.

## Roles & Permissions

AssetFlow is designed with four strict roles, which dictate user capabilities. Role assignment is centralized and secure.

- **Employee:** Can view their own allocated assets, book shared resources, raise maintenance requests, and initiate transfer/return requests. New signups default to this role.
- **Department Head:** Same as Employee, plus they can view all assets allocated to their department, approve intra-department transfers, and book resources on behalf of the department.
- **Asset Manager:** Has global view of assets. Registers new assets, allocates them globally, and acts as the final approver for transfers, maintenance requests, returns, and audit discrepancies.
- **Admin:** Has master control over the organizational structure. The Admin creates Departments, Asset Categories, and manages the Employee Directory. **Crucially, the Admin is the ONLY role that can promote an Employee to a Department Head or Asset Manager.**

## UI Design System & Styling

To maintain a consistent, premium aesthetic across the app, we used an **Odoo-inspired Design System**. All core styles are defined as CSS variables.
- **Colors**: Dark Purple (`#714B67`), Teal (`#017E84`), Light Gray (`#F9F9F9`), Pure White (`#FFFFFF`).
- **Features**: Glassmorphism (`glass-panel`), crisp inputs (`input-field`), and robust card layouts (`card`).

## Hackathon Submission Notes

Thank you for evaluating AssetFlow! 
Our team focused heavily on creating a robust role-based access control (RBAC) system and a clean, premium "Odoo-inspired" user interface. The Next.js App Router provides a modular structure, and our custom JWT authentication ensures that users cannot elevate their own privileges. 

We hope you enjoy exploring the system!
