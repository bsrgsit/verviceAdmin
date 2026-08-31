# Vervice Admin Portal

Central management, operations command, and business intelligence portal for the **Vervice Doorstep Waterless Car Care** ecosystem across Android, iOS, and Partner platforms.

---

## 🌟 Architecture & Design System

### 1. Unified 2-Level Hierarchical Navigation
- **Left Sidebar = MAIN MENU (Level 1)**:
  - Persistent **Community Scope Filter** (`🌐 All Communities Combined` vs individual gated societies like `Prestige City`).
  - High-level navigation categories:
    1. **Overview** (`/`, `/reports`)
    2. **Operations** (`/bookings`, `/partners`, `/users`)
    3. **Finance & Billing** (`/payments`, `/invoices`)
    4. **Services & Requests** (`/battery-requests`, `/driver-requests`, `/support-tickets`)
    5. **App & Content** (`/app-config`, `/banners`, `/screen-config`)
    6. **Hubs & Audit** (`/communities`, `/audit-log`)
  - Admin profile, role badge, and session logout.
- **Top Header Bar = BREADCRUMB + HORIZONTAL SUB-MENU TABS (Level 2)**:
  - **Breadcrumbs**: Hierarchical location indicators (`Home > Operations > Cleaning Schedules`).
  - **Active Scope Pill**: Instant visual feedback of active community filter with 1-click reset.
  - **Contextual Sub-Menu Tabs**: Interactive horizontal pills for the currently active primary module.
  - **Global Command Palette**: `⌘K` keyboard shortcut for instant search across societies, cleaners, and residents.

### 2. Uniform Shadcn UI Light Green Theme (`ui.shadcn.com`)
- **Aesthetic**: Harmonious light background (`bg-slate-50` / `bg-white`), crisp slate typography, and official Shadcn Green accents (`emerald-600` / `emerald-50 text-emerald-800 border-emerald-200`).
- **Primitives**: Standard Shadcn UI components located in `components/ui/` (`Button`, `Badge`, `Card`, `Tabs`, `Switch`, `Input`, `Textarea`, `Breadcrumb`, `Table`, `Separator`).

---

## 🚀 Key Modules & Capabilities

### 📊 1. Overview & Business Intelligence
- **Executive Dashboard (`/`)**: Real-time revenue metrics, active daily wash count, pending payment alerts, emergency requests counter, and interactive Society Hub Matrix.
- **Reports & Growth Analytics (`/reports`)**:
  - Month-over-Month (MoM) revenue growth trajectories (+24%).
  - Cleaned car count and active subscription volume.
  - Average Revenue Per Car (ARPU) and subscription retention rates (94.2%).
  - Vehicle segment breakdown (Hatchback, Sedan, SUV, Luxury).
  - Gated society unit economics table with **1-Click CSV Export**.

### ⚙️ 2. Operations & Fleet Command
- **Cleaning Schedules (`/bookings`)**: Real-time daily car wash schedules, assigned cleaner roster, slot numbers, pause/resume subscription controls, and admin notes.
- **Cleaner Fleet & Staff (`/partners`)**: Partner onboarding verification, KYC status (`signup-pending` → `operational`), hub assignments, and gate check-in status.
- **Residents & Vehicles (`/users`)**: Resident profiles, flat/block details, registered vehicles, parking slot mapping, and account restriction controls.

### 💳 3. Finance & Billing
- **Payment Approvals (`/payments`)**: Review manual UPI transactions, verify UTR reference numbers with payment screenshot receipts, and automatically extend customer subscriptions upon approval.
- **Monthly Invoices (`/invoices`)**: Generate monthly recurring invoices, automated overdue tracking, and printable PDF invoices.

### 🚨 4. On-Demand & Emergency Services
- **Battery Jumpstart (`/battery-requests`)**: Emergency jumpstart requests dispatch, technician assignment, customer vehicle location, and resolution status.
- **Driver Hire (`/driver-requests`)**: On-demand verified driver bookings, driver phone allocation, and trip tracking.
- **Support Helpdesk (`/support-tickets`)**: Customer complaint resolution tickets, internal admin notes, and ticket status lifecycle.

### 📱 5. Remote App & Content Control
- **Feature Flags & Config (`/app-config`)**: Real-time switches controlling Android and iOS mobile app features:
  - Enable/disable Battery Jumpstart, Driver Hire, or Insurance concierge.
  - **Today's Clean Status Widget** below home banner (toggle on/off).
  - UPI payment intent vs manual QR code display.
  - Emergency Maintenance mode switch.
  - Minimum supported Android & iOS version enforcement.
- **Home Banners & Announcements (`/banners`)**: Publish and schedule promotional carousel banners with community-level targeting. Includes an **Interactive Live iPhone 15 Pro & Android Galaxy Phone Mockup Preview** to inspect exact mobile layout rendering in real-time.
- **Dynamic Screen & Barrier Config (`/screen-config`)**: Custom text for Locked/Unlaunched community screens, guest user guidance message, and Add Vehicle barrier toggles.

### 🏢 6. Hubs & System Audit
- **Societies & Hubs (`/communities` & `/communities/[id]`)**: Create gated societies, configure blocks/towers, assign cleaner staff, set pricing tiers, and configure gate security passcodes.
- **System Audit Logs (`/audit-log`)**: Centralized security log tracing all admin logins, payment approvals, rejections, banner creations, and configuration changes with timestamps.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components, API Routes)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) (Light Green Theme)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: [Google Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Backend & Database**: [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) (Firestore, Authentication)

---

## 📁 Firestore Database Structure

| Collection | Description |
| :--- | :--- |
| `communities` | Gated society records, blocks, pricing tiers, coordinates, and gate codes |
| `bookings` | Active car cleaning subscriptions, schedules, and assigned cleaner IDs |
| `users` | Registered resident profiles, flats, and vehicle details |
| `partners` | Cleaner staff profiles, KYC status, and assigned community hubs |
| `payments` | UPI payment transactions, UTR numbers, amounts, and verification statuses |
| `invoices` | Monthly recurring invoices and payment due dates |
| `banners` | Promotional carousel announcement banners with community targeting |
| `battery_requests` | Emergency jumpstart service bookings and technician assignments |
| `driver_requests` | On-demand driver hire requests |
| `support_tickets` | Resident complaints, inquiry tickets, and admin resolution logs |
| `settings/app_config` | Dynamic remote feature flags, maintenance mode, and app versions |
| `admins` | Authorized admin users and role permissions (`super_admin`, `community_admin`) |
| `admin_audit_log` | Central audit trail of administrative actions |

---

## 🚀 Setup & Local Development

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
