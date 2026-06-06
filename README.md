# Vervice Admin Panel

Admin panel for managing Vervice car cleaning service operations.

## Features

- **Dashboard** — Overview of users, bookings, payments, and revenue
- **Payments** — Verify/reject UPI payments, bulk verify, duplicate detection
- **Bookings** — Manage subscriptions, suspend/reactivate, view payment history
- **Users** — View user profiles, restrict/unrestrict accounts
- **Communities** — CRUD for communities, manage blocks and features
- **Audit Log** — Track all admin actions

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Get your Firebase Admin SDK service account key from:
**Firebase Console → Project Settings → Service Accounts → Generate new private key**

### 3. Create first admin user

Instead of manually creating database entries, you can run the helper script in the repository:

```bash
node scripts/create-admin.js <path-to-service-account.json> <admin-email> <admin-password> [admin-name]
```

Example:
```bash
node scripts/create-admin.js "path/to/key.json" "admin@vervice.com" "yourpassword" "Super Admin"
```

This script will automatically:
1. Create the user in Firebase Authentication (or update the password if the user already exists).
2. Authorize the user in Firestore with the `super_admin` role in the `admins` collection.


### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
npx vercel --prod
```

Add environment variables in Vercel dashboard:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`

## Firestore Collections Used

| Collection | Purpose |
|---|---|
| `users` | User profiles |
| `bookings` | Service subscriptions |
| `payments` | Payment transactions |
| `invoices` | Billing records |
| `communities` | Community data |
| `config` | App configuration |
| `admins` | Admin user whitelist |
| `admin_audit_log` | Admin action audit trail |
