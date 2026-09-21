# Vervice Admin Portal

Central management, operations command, and business intelligence portal for the **Vervice Doorstep Waterless Car Care** ecosystem across Android, iOS, and Partner platforms.

---

## Architecture & Design System

### 1. Unified 2-Level Hierarchical Navigation
- **Left Sidebar - MAIN MENU (Level 1)**:
  - Persistent **Community Scope Filter** (`All Communities Combined` vs individual gated societies like `Prestige City`).
  - High-level navigation categories:
    1. **Overview** (`/`, `/reports`)
    2. **Operations** (`/bookings`, `/partners`, `/users`)
    3. **Finance & Billing** (`/payments`, `/invoices`)
    4. **Services & Requests** (`/battery-requests`, `/driver-requests`, `/support-tickets`)
    5. **App & Content** (`/app-config`, `/banners`, `/screen-config`, `/services-catalog`, `/mobile-layout`)
    6. **Hubs & Audit** (`/communities`, `/audit-log`)
  - Admin profile, role badge, and session logout.
- **Top Header Bar - BREADCRUMB + HORIZONTAL SUB-MENU TABS (Level 2)**:
  - **Breadcrumbs**: Hierarchical location indicators (`Home > Operations > Cleaning Schedules`).
  - **Active Scope Pill**: Instant visual feedback of active community filter with 1-click reset.
  - **Contextual Sub-Menu Tabs**: Interactive horizontal pills for the currently active primary module.
  - **Global Command Palette**: `Cmd+K` keyboard shortcut for instant search across societies, cleaners, and residents.

### 2. Uniform Shadcn UI Light Green Theme
- **Aesthetic**: Harmonious light background (`bg-slate-50` / `bg-white`), crisp slate typography, and official Shadcn Green accents (`emerald-600` / `emerald-50 text-emerald-800 border-emerald-200`).
- **Primitives**: Standard Shadcn UI components located in `components/ui/` (`Button`, `Badge`, `Card`, `Tabs`, `Switch`, `Input`, `Textarea`, `Breadcrumb`, `Table`, `Separator`, `Dialog`).

---

## Key Modules & Capabilities

### 1. Operations Command Dashboard (`/`)
- **Urgent Action Inbox Queue**: Unified operational triage desk for immediate pending items:
  - Manual UPI payment verification with UTR numbers and receipt review.
  - Cancellation requests with customer reason inspection and approve/reject workflows.
  - Emergency battery jumpstart technician dispatches.
  - On-demand verified driver requests.
  - Open customer support tickets.
- **Today's Operations Pulse**: Real-time daily wash progress bar, completion percentage, and active daily subscriptions count.
- **Society & Hub Matrix**: High-level status cards for each registered community displaying active subscriptions, assigned cleaners, gate pass requirements, and 1-click shortcuts to edit details and manage flats.
- **Central Operations Hub**:
  - **Cleaner Staff**: Staff on duty, active community assignment, phone numbers, and direct staff management shortcut.
  - **Verified Activity**: Live audit feed of settled and verified payments with UTR references and resident links.
  - **Emergency Services**: Pending metrics and fast navigation for roadside and parking bay assistance.
  - **Audit Trail**: Real-time administrative audit logs tracking operations and system updates.

### 2. Gated Communities, Blocks & Flats Management (`/communities`, `/communities/[id]`)
- **Society Details Management**:
  - Comprehensive society editor: Name, City, Address, PIN Code, Total Residential Units.
  - Gate Pass Configuration: Gate passcode requirement, cleaner gate codes, and access policies.
  - Parking Structure: Basement, podium, and multi-level parking floor mapping.
  - Active/Inactive society status toggle.
- **Blocks & Flats Architecture**:
  - **Dedicated Blocks & Flats Tab (`?tab=blocks_flats`)**:
    - **Add Block / Tower**: Create new tower records with instant parent synchronization.
    - **Bulk Floor Range Generator**: Automatically generate flat numbers by specifying start floor, end floor, units per floor, and custom block prefixes (e.g., Prefix `A-` + Floors 1-10 x 4 flats = `A-101` to `A-1004`).
    - **Manual Flat Adder**: Add individual flats or comma-separated lists of flat numbers.
    - **Search & Filter**: Real-time filtering within blocks.
    - **Floor-Grouped Flat Chips**: Visual chips organized by floor with 1-click removal and bulk clear tools.
  - **Mobile App Synchronization**:
    - Real-time mapping to mobile app schema `communities/{communityId}/flats/{blockName}` (`{ blockName, flats: string[] }`).
    - Atomic updates ensuring parent document `blocks` array remains strictly synchronized using Firestore `arrayUnion` and `arrayRemove`.

### 3. Overview & Growth Analytics (`/reports`)
- Month-over-Month (MoM) revenue growth trajectories.
- Cleaned car count and active subscription volume.
- Average Revenue Per Car (ARPU) and subscription retention rates.
- Vehicle segment breakdown (Hatchback, Sedan, SUV, Luxury).
- Gated society unit economics table with **1-Click CSV Export**.

### 4. Operations & Fleet Command
- **Cleaning Schedules (`/bookings`)**: Real-time daily car wash schedules, assigned cleaner roster, slot numbers, pause/resume subscription controls, and admin notes.
- **Cleaner Fleet & Staff (`/partners`)**: Partner onboarding verification, KYC status (`signup-pending` to `operational`), hub assignments, and gate check-in status.
- **Residents & Vehicles (`/users`)**: Resident profiles, flat/block details, registered vehicles, parking slot mapping, and account restriction controls.

### 5. Finance & Billing
- **Payment Approvals (`/payments`)**: Review manual UPI transactions, verify UTR reference numbers with payment screenshot receipts, and automatically extend customer subscriptions upon approval.
- **Monthly Invoices (`/invoices`)**: Generate monthly recurring invoices, automated overdue tracking, and printable PDF invoices.

### 6. On-Demand & Emergency Services
- **Battery Jumpstart (`/battery-requests`)**: Emergency jumpstart dispatch, technician assignment, customer vehicle location, and resolution status.
- **Driver Hire (`/driver-requests`)**: On-demand verified driver bookings, driver phone allocation, and trip tracking.
- **Support Helpdesk (`/support-tickets`)**: Customer complaint resolution tickets, internal admin notes, and ticket status lifecycle.

### 7. Services Catalog & Pricing (`/services-catalog`)
- Create and edit doorstep wash and detailing plans.
- Vehicle category-specific pricing tiers (Hatchback, Sedan, SUV, Luxury).
- Feature inclusions, wash frequencies (Daily, Alternate Days, Weekly), and active plan toggles.

### 8. Remote App & Content Control
- **Feature Flags & Config (`/app-config`)**: Real-time switches controlling Android and iOS mobile app features:
  - Enable/disable Battery Jumpstart, Driver Hire, or Insurance concierge.
  - Today's Clean Status Widget below home banner (toggle on/off).
  - UPI payment intent vs manual QR code display.
  - Emergency Maintenance mode switch.
  - Minimum supported Android and iOS version enforcement.
- **Home Banners & Announcements (`/banners`)**: Publish and schedule promotional carousel banners with community-level targeting. Includes an **Interactive Live iPhone 15 Pro & Android Galaxy Phone Mockup Preview** to inspect exact mobile layout rendering in real-time.
- **Mobile Layout Customization (`/mobile-layout`)**: Configure home screen tile order, visibility, and quick action buttons.
- **Dynamic Screen & Barrier Config (`/screen-config`)**: Custom text for Locked/Unlaunched community screens, guest user guidance message, and Add Vehicle barrier toggles.

### 9. Security & System Audit (`/audit-log`)
- Centralized security audit log tracing all admin logins, payment approvals, rejections, community modifications, banner updates, and configuration changes with timestamps and admin emails.

---

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components, Route Handlers)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) (Light Green Theme)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: [Google Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Backend & Database**: [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) (Firestore, Authentication)
- **Deployment**: [Vercel](https://vercel.com/) with automated CI/CD branch controls via `vercel.json`

---

## Firestore Database Structure

| Collection | Description |
| :--- | :--- |
| `communities` | Gated society records, blocks, parking floors, coordinates, and gate passcodes |
| `communities/{id}/flats/{block}` | Block-specific flat numbers list mapped for mobile resident onboarding |
| `bookings` | Active car cleaning subscriptions, schedules, and assigned cleaner IDs |
| `users` | Registered resident profiles, flats, and vehicle details |
| `partners` | Cleaner staff profiles, KYC status, and assigned community hubs |
| `payments` | UPI payment transactions, UTR numbers, amounts, and verification statuses |
| `invoices` | Monthly recurring invoices and payment due dates |
| `services` | Doorstep wash catalog, plan details, and pricing tiers by vehicle class |
| `banners` | Promotional carousel announcement banners with community targeting |
| `battery_requests` | Emergency jumpstart service bookings and technician assignments |
| `driver_requests` | On-demand driver hire requests |
| `support_tickets` | Resident complaints, inquiry tickets, and admin resolution logs |
| `settings/app_config` | Dynamic remote feature flags, maintenance mode, and app versions |
| `admins` | Authorized admin users and role permissions (`super_admin`, `community_admin`) |
| `admin_audit_log` | Central audit trail of administrative actions |

---

## Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account-email"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
```

### 3. Create First Admin User
Run the helper script to initialize an admin user in Firebase Auth & Firestore:
```bash
node scripts/create-admin.js "<path-to-service-account.json>" "admin@vervice.com" "password123" "Super Admin"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## Continuous Integration & Deployment (Vercel)

The repository includes a root `vercel.json` configured with an **Ignored Build Step**:
- **`main` branch**: Always triggers full automated production deployments.
- **Working branches (such as `prod1.0`)**: Whenever the commit message includes `[skip ci]` or `[skip vercel]`, Vercel automatically skips the build, preventing unnecessary build runs and deployment queues.
