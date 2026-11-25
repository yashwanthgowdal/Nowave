# No Wave Company — Digital QR Menu & Real-Time Availability Engine

> *"No Wave. Just Tilt. Dining, Redefined."*  
> A mobile-first, production-ready hospitality web application featuring an interactive view-only customer digital QR menu synchronized in real-time with a live Manager Admin Control Panel.

---

## 🍽️ System Overview

### 1. Customer Flow (`/` or `/menu?table=5`)
- **Frictionless QR Table Access:** Diners scan a QR code placed on their table (e.g. `?table=5`) which launches the mobile web app directly in their smartphone browser (zero login, zero app install, no checkout carts or payment gateways).
- **Strict Availability Rule:** Any dish marked **Out of Stock (`isAvailable: false`)** by the restaurant manager **is immediately hidden from the customer DOM in real time** without requiring page refresh.
- **Warm Minimalist Luxury Aesthetic:** Deep obsidian dark mode (`#0F0F11`), frosted glass cards (`#18181B`), and warm amber brass accents (`#F59E0B` / `#D97706`).
- **Smart Search & Dietary Filters:** Instant dish search plus quick filters for `All`, `Veg 🟢`, `Non-Veg 🔴`, `Chef's Special ⭐`, and `Bestseller 🔥`.
- **Sticky Category Navigation:** Smooth-scrolling sticky bar for **Starters & Snacks**, **Main Course**, **Breads & Rice**, **Desserts**, and **Cold Drinks & Beverages**.
- **Customer "My Table Shortlist" Helper (Non-Ordering):** Diners tap `+ Note` to save dishes they like into an expandable verbal order notepad to tell their server when they arrive at the table.
- **Service Reminder:** *"Ready to order? Simply tilt your table lamp or call your server."* + discreet lock icon link to the staff portal.

### 2. Manager Admin Dashboard (`/admin`)
- **Live Stock Overview:** Metric cards showing **Total Dishes**, **Currently Available (Green)**, and **Out of Stock / Hidden (Red)** with live status indicators.
- **Instant 1-Tap Availability Toggles:** High-contrast, tactile ON/OFF toggle switches for every dish. Toggling OFF instantly removes the dish from all connected customer screens in real time.
- **Rush Hour Bulk Actions:**
  - *"Filter: Show Only Out-of-Stock Items"* switch to review everything currently disabled today in 1 second.
  - *"Reset All to Available (Start of Day)"* button with confirmation modal to restore the entire menu with one click every morning.
- **Full Menu CRUD Management:** Create, edit (prices, descriptions, categories, spice levels, chef's specials, bestsellers, image URLs), and delete dishes.
- **Built-in Table QR Code Studio (`/admin/qr`):** Generate, preview, and download print-ready table QR stand cards for Table 1 to 20 or custom table identifiers.

---

## ⚡ Parallel Real-Time Synchronization Architecture

The platform uses a layered synchronization architecture ensuring **immediate, zero-latency updates**:

1. **BroadcastChannel (`nowave_menu_realtime_bus`):** Provides instant (< 2ms) cross-tab communication on the same browser (perfect for testing Admin in Tab 1 and Customer in Tab 2).
2. **`localStorage` Event Bus (`nowave_menu_sync_event`):** Cross-tab fallback for browsers with restricted BroadcastChannel or WebViews.
3. **Server-Sent Events (`/api/events`):** Persistent HTTP SSE stream for server-to-client broadcast across distinct mobile devices and Wi-Fi networks.
4. **Cloud Database Plug-in (Firebase Firestore / Supabase):**
   - Both options are pre-architected in the modular `MenuService.ts`.
   - To connect Firebase Firestore across cloud networks, add your Firebase config in `.env` and initialize the `onSnapshot(collection(db, "menu_items"), ...)` listener.
   - To connect Supabase, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to attach Supabase Realtime channel postgres changes.

---

## 🚀 Quick Start Guide

### 1. Start the Server
```bash
npm start
```
The application runs on `http://localhost:3000`.

To run in development mode with hot-reloading:
```bash
npm run dev
```

### 2. Database Commands
```bash
# Push Prisma schema updates to SQLite database
npx prisma db push

# Seed 21 handcrafted menu items across 5 categories
npm run db:seed
```

### 3. Demo Manager Credentials
- **URL:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Email:** `manager@nowave.cafe`
- **Password:** `NoWave2024!`
- *(Or click the **"⚡ One-Click Demo Manager Login"** button on the login screen)*

---

## 🧪 Automated End-to-End Test Suite

Run the full automated E2E test suite covering categories, dishes, DOM availability exclusion, manager login, toggle switches, bulk reset, and SSE streams:

```bash
node test-e2e.js
```
*(All 21 test assertions pass successfully).*

---

## 📂 Project Architecture

```
FinallWAve/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Root route (renders CustomerMenu)
│   │   ├── menu/page.tsx          # Customer Menu view (supports ?table=X)
│   │   ├── admin/
│   │   │   ├── page.tsx           # Manager Admin Dashboard
│   │   │   ├── login/page.tsx     # Manager Login (with 1-click demo login)
│   │   │   └── qr/page.tsx        # Dedicated Table QR Studio
│   │   ├── api/
│   │   │   ├── auth/              # Manager login & logout (JWT cookie)
│   │   │   ├── categories/        # Category management
│   │   │   ├── events/            # Server-Sent Events (SSE) real-time stream
│   │   │   └── menu-items/        # Menu CRUD, availability toggle, bulk reset
│   │   └── globals.css            # Dark obsidian palette & luxury glass styling
│   ├── components/
│   │   ├── CustomerMenu.tsx       # Main public customer menu
│   │   ├── AdminDashboard.tsx     # Manager control panel
│   │   ├── DishCard.tsx           # Dish card with image fallback & note button
│   │   ├── TableShortlistDrawer.tsx # Non-ordering verbal order notepad
│   │   └── QRGenerator.tsx        # High-res Table QR code generator
│   ├── lib/
│   │   ├── MenuService.ts         # Multi-layer real-time engine & API client
│   │   ├── useRealtimeMenu.ts     # Reactive menu synchronization React hook
│   │   ├── types.ts               # Shared TypeScript data models
│   │   ├── db.ts                  # Prisma client instance
│   │   └── auth.ts                # Session verification & JWT
│   └── middleware.ts              # Route protection for /admin routes
├── prisma/
│   ├── schema.prisma              # SQLite schema (Category, MenuItem, AdminUser)
│   └── seed.ts                    # 21 pre-populated authentic menu items
└── test-e2e.js                    # Automated verification suite
```

---

## 🛡️ License
Proprietary — Built for **No Wave Company** hospitality establishments.
