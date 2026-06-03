@AGENTS.md

# mediGO — Claude Handover File

## Project Overview
**mediGO** is a Pakistan-based telemedicine platform.
- **Live URL:** https://medigo-health.vercel.app (redirects from wafa-health.vercel.app)
- **GitHub:** https://github.com/Usman692z/wafa-health
- **Deployed on:** Vercel (region: sin1)

---

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 (App Router, Turbopack) |
| Language | TypeScript |
| Auth | Firebase Authentication |
| Database | Supabase (PostgreSQL) + Realtime |
| State | Zustand (persisted to localStorage) |
| Video Calls | Agora RTC SDK |
| Styling | Tailwind CSS v4 + Framer Motion |
| PDF | jsPDF + html2canvas |
| Deploy | Vercel |

> **IMPORTANT — Next.js 16 breaking changes:**
> - `middleware.ts` is renamed to `proxy.ts`, function export is `proxy()` not `middleware()`
> - Read `node_modules/next/dist/docs/` before writing any Next.js-specific code

---

## 3 User Roles
```
patient  → books appointments, pays, chats, gets prescriptions, rates doctors
doctor   → confirms/rejects appointments, creates prescriptions, earns commission
admin    → approves doctors, verifies payments, views analytics, manages settings
```

---

## Key Routes
| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Patient + Doctor login |
| `/register` | Patient registration |
| `/admin/login` | Admin-only login portal |
| `/patient/*` | Patient dashboard, doctors, appointments, chat, prescriptions |
| `/doctor/*` | Doctor dashboard, earnings, appointments, prescriptions, chat |
| `/admin/*` | Full admin panel (dashboard, doctors, patients, payments, analytics, settings) |
| `/video-call/[id]` | WebRTC video consultation via Agora |

---

## Important Files
| File | Purpose |
|---|---|
| `src/types/index.ts` | All TypeScript interfaces |
| `src/lib/supabase.ts` | Supabase client + ALL DB operations |
| `src/lib/firebase.ts` | Firebase init (auth only) |
| `src/lib/auth.ts` | Firebase auth functions |
| `src/store/authStore.ts` | Zustand auth store (persisted) |
| `src/hooks/useAuth.ts` | Auth hook + route protection |
| `src/proxy.ts` | Next.js 16 proxy (rate limiting, redirects, security headers) |
| `src/app/admin/layout.tsx` | Admin layout with auth guard |
| `src/components/shared/DashboardLayout.tsx` | Shared dashboard layout (sidebar, notifications) |
| `firestore.rules` | Firebase Firestore security rules |
| `storage.rules` | Firebase Storage security rules |

---

## Environment Variables Required
```env
# Firebase (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin (server-side secret)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Auth Flow
1. User signs in via Firebase Auth (email/password)
2. Profile fetched from Supabase `profiles` table by UID
3. Role checked: `patient` | `doctor` | `admin`
4. Zustand store updated + persisted to localStorage
5. `useRequireAuth(['admin'])` in layout guards protected routes

### IMPORTANT — useRequireAuth behaviour
- `useRequireAuth(['admin'])` → redirects to `/admin/login` if not authenticated
- `useRequireAuth(['patient'])` → redirects to `/login` if not authenticated
- `useRequireAuth(undefined)` → **NO redirect** (used on login pages themselves)

---

## Supabase Tables
`profiles`, `doctors`, `patients`, `appointments`, `chat_rooms`, `messages`,
`prescriptions`, `payments`, `reviews`, `notifications`, `banners`, `faqs`, `settings`

---

## Known Issues & Fixes Applied (Session 1)

### ✅ Fixed
1. **Admin login redirect loop** — `admin/layout.tsx` now skips auth guard on `/admin/login` using `usePathname()`
2. **`useRequireAuth(undefined)` redirect bug** — Now returns early if `allowedRoles` is undefined
3. **Vercel build failure** — `capacitor.config.ts` excluded from `tsconfig.json` (missing `@capacitor/cli` package)
4. **Security headers** — Added CSP, HSTS, X-Frame-Options etc. in `next.config.ts`
5. **Storage rules** — Chat/prescription files restricted to owner only
6. **Firestore rules** — Video call signaling restricted to participants only
7. **Weak password** — Min 8 chars + uppercase + number + special char in `register/page.tsx`
8. **Insecure temp password** — `crypto.getRandomValues()` replaces `Math.random()` in admin/doctors
9. **Patient PII in URLs** — Patient data moved from query params to `sessionStorage`
10. **Rate limiting** — `src/proxy.ts` limits auth endpoints to 10 attempts / 15 min

### ⚠️ Pending (not yet fixed)
- Admin account credentials lost — need to reset via Firebase Console or create new admin in Supabase
- No audit logging for admin actions (compliance issue)
- Supabase RLS policies not verified — check that row-level security is enabled on all tables
- No session timeout implemented
- Payment verification is manual (no automated proof checking)

---

## Admin Account Issue
Admin forgot their credentials. To fix:
1. **Option A:** Go to `medigo-health.vercel.app/forgot-password` with admin email
2. **Option B:** Firebase Console → Authentication → find admin user → reset password
3. **Option C:** If no admin exists, create one:
   - Create user in Firebase Console (Authentication → Add User)
   - In Supabase → `profiles` table → insert row with that UID and `role = 'admin'`

---

## Backup
Full project backup saved at:
`/Users/usmaniii/Downloads/wafa-health-backup-20260530_173002/`

---

## Git History (recent)
```
d341608  Exclude capacitor.config.ts from TypeScript compilation
a7a8f8e  Fix admin login redirect loop — skip auth guard when allowedRoles is undefined
595844b  Security hardening: headers, rules, rate limiting, password strength
```
