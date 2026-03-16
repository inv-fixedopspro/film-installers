# Film Installers — Build Reference

This document is the authoritative behavioral and architectural contract for the Film Installers platform. Every component, page, API route, and database query built in this project must comply with the rules documented here. Read the relevant sections before building anything new. Update this document at the end of each major phase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User States Reference](#2-user-states-reference)
3. [Role Reference](#3-role-reference)
4. [Profile System](#4-profile-system)
5. [Middleware Logic Map](#5-middleware-logic-map)
6. [Auth System](#6-auth-system)
7. [Moderation System](#7-moderation-system)
8. [Data Privacy and Consent Rules](#8-data-privacy-and-consent-rules)
9. [Component Contracts](#9-component-contracts)
10. [API Route Patterns](#10-api-route-patterns)
11. [Error Handling System](#11-error-handling-system)
12. [Design System](#12-design-system)
13. [Database Schema Quick Reference](#13-database-schema-quick-reference)
14. [Feature Status Map](#14-feature-status-map)
15. [File and Folder Conventions](#15-file-and-folder-conventions)

---

## 1. Project Overview

**App name:** Film Installers
**Domain:** filminstallers.com
**Purpose:** Two-sided platform connecting window tint, PPF, vinyl wrap, and architectural film professionals (installers) with companies hiring them (employers).
**Stack:** Next.js 15, Supabase (Postgres + Auth), Tailwind CSS, shadcn/ui, TypeScript
**Constants file:** `lib/constants/index.ts`
**Types file:** `lib/types/database.ts`

### The Two Sides

| Side | Profile Type | Primary Goal |
|------|-------------|--------------|
| Installer | `installer` | Find jobs, showcase skills, build resume |
| Employer | `employer` | Post jobs, browse installers, hire talent |

A single user account can hold both profile types simultaneously and switch between them using `active_profile_type`.

---

## 2. User States Reference

User state is controlled by two independent columns on the `profiles` table: `account_status` and `content_visibility`. Every component that renders user-generated content or gated actions must check the relevant state.

### 2a. `account_status`

Defined as: `"active" | "warned" | "restricted" | "banned" | "pending_review"`

| Status | User Can Do | User Can See | Redirect Behavior | UI Signal |
|--------|-------------|--------------|-------------------|-----------|
| `active` | Everything their role permits | Everything | None | None |
| `warned` | Everything (no functional restriction) | Everything | None | `ModerationBanner` shows warning |
| `pending_review` | Everything (no functional restriction) | Everything | None | `ModerationBanner` shows review notice |
| `restricted` | Dashboard and own profile only | Own content only | Redirected away from restricted routes | `ModerationBanner` (if applicable) |
| `banned` | Nothing — sign out only | Nothing | Hard redirect to `/banned` on every request | Separate `/banned` page |

**Restricted routes** (users with `restricted` status are redirected from these):
- `/network`
- `/forum`
- `/marketplace`
- `/jobs`
- `/resume`

Enforcement is in `middleware.ts` at the edge — not in components. Components must not duplicate this redirect logic, but they must still check status before rendering action controls (submit, apply, post, message).

### 2b. `content_visibility`

Defined as: `"visible" | "auto_hidden" | "admin_hidden" | "restored"`

| Value | Meaning | Who Set It | Profile Shown to Others |
|-------|---------|-----------|------------------------|
| `visible` | Normal — profile is public to members | System default | Yes |
| `auto_hidden` | Automatically hidden because `unresolved_flag_count` hit the threshold | DB trigger | No |
| `admin_hidden` | Manually hidden by an admin OR set when user is `banned` | Admin action | No |
| `restored` | Admin explicitly cleared a prior hide | Admin action | Yes |

**Critical rule:** Any component that renders another user's profile card, installer listing, or employer card must check the target user's `content_visibility`. Profiles with `auto_hidden` or `admin_hidden` must not be displayed to other users. They remain visible to their own owner (with a `ModerationBanner` warning) and to admins.

### 2c. Auto-Hide Threshold

The auto-hide system runs entirely in the database (no application code involved):
- Threshold is stored in `moderation_config` under key `auto_hide_threshold` (default: `3`)
- Trigger `handle_new_flag` fires on every new flag insert and increments `unresolved_flag_count`
- When `unresolved_flag_count >= threshold` AND `content_visibility = 'visible'`, the trigger sets `content_visibility = 'auto_hidden'`
- Resolving a flag decrements the count but does NOT auto-restore visibility — that requires explicit admin action

### 2d. State Is Cached at the Edge

`middleware.ts` caches `account_status` and `content_visibility` in two `httpOnly` cookies:
- `x-account-status` (5-minute TTL)
- `x-content-visibility` (5-minute TTL)

These cookies are set server-side and are not accessible to client JavaScript. The middleware reads them on repeat requests to avoid a DB hit on every page load. Status changes (bans, restrictions) propagate within 5 minutes to edge enforcement.

---

## 3. Role Reference

`profiles.role` is either `"admin"` or `"user"`. This is the only role distinction in the system.

| Role | Access | How Determined |
|------|--------|---------------|
| `user` | Platform features within their `account_status` limits | Default on registration |
| `admin` | All platform features + `/admin/**` routes + admin API routes | Set in DB by existing admin |

### Admin Route Protection

Admin routes are protected at two layers:
1. **Edge (middleware):** `/admin/**` is under `isProtectedRoute` — unauthenticated users are redirected to `/login`
2. **Layout (client):** `app/(admin)/layout.tsx` checks `userData.role !== "admin"` and redirects to `/dashboard` if not admin
3. **API (server):** All admin API routes use `createAdminRoute()` which verifies role from DB before executing the handler

Do not build admin functionality into non-admin layouts. Do not check role client-side without the layout wrapper.

### Admin Context Detection

In client components, use `useAuthState()`:
```typescript
const { isAdmin } = useAuthState();
```

---

## 4. Profile System

### Profile Types

A user account (`profiles` row) can hold up to three profile contexts:

| Sub-Profile | Table | Key Fields | How Acquired |
|-------------|-------|-----------|-------------|
| Installer | `installer_profiles` + `installer_experience[]` | name, phone, city, state, experience_level, is_actively_interviewing | Onboarding flow |
| Employer | `employer_profiles` + `employer_services[]` | company_name, contact info, hq location, employee_count, is_actively_hiring | Onboarding flow |
| Team Member | `company_team_members` (via `profiles.team_member_id`) | role, employer_profile_id, is_active | Accept team invitation at `/invite/team/[token]` |

A user can have both installer and employer simultaneously. A user can have a team profile in addition to either. The team profile is linked via `profiles.team_member_id` — a nullable FK to `company_team_members.id`.

### Active Profile

`profiles.active_profile_type` (`"installer" | "employer" | "team" | null`) controls which profile context is currently active. Users with multiple profiles can switch via the header `ProfileSwitcher` dropdown.

Switching is done via `PUT /api/profiles/active` and updates the DB. The `switchProfile()` method in `AuthProvider` accepts `ProfileType` (including `"team"`) and calls `refreshUser()` afterward.

### UserData Shape (AuthProvider)

```typescript
interface UserData extends Profile {
  installerProfile: InstallerProfileWithExperience | null;
  employerProfile: EmployerProfileWithServices | null;
  teamProfile: TeamProfile | null;  // { teamMember, employerProfile } or null
}
```

`teamProfile` is fetched in `fetchUserData` when `profile.team_member_id` is set, by joining `company_team_members` → `employer_profiles` → `employer_services`.

`teamProfile` is **distinct** from `employerProfile`: `employerProfile` is the company the user **owns**; `teamProfile` is the company the user is a **member** of.

### useAuthState() Booleans

| Boolean | Meaning |
|---------|---------|
| `hasInstallerProfile` | User has an `installer_profiles` row |
| `hasEmployerProfile` | User has an `employer_profiles` row (they are the owner) |
| `hasTeamProfile` | User has an active `company_team_members` record |
| `isActiveInstaller` | `active_profile_type === "installer"` |
| `isActiveEmployer` | `active_profile_type === "employer"` |
| `isActiveTeamMember` | `active_profile_type === "team"` |

### Onboarding Flow

New users must complete onboarding before accessing the main dashboard:
1. Register → email verification
2. `/onboarding/select-type` → choose from three cards: **Installer**, **Employer**, or **Join a Team**
3. Installer → `/onboarding/installer`; Employer → `/onboarding/employer`; Team → no form (invitation-only — card explains to check email for invite link)
4. `/onboarding/installer` or `/onboarding/employer` → fill profile form
5. `profiles.onboarding_completed = true` → redirected to `/dashboard`

The `needsOnboarding` flag from `useAuthState()` is `true` when: authenticated + email verified + onboarding not complete.

Team members join via `/invite/team/[token]` — this does **not** go through the onboarding flow. The `accept_team_invitation` RPC sets `profiles.team_member_id` and `active_profile_type = 'team'` atomically. The "Join a Team" card on `/onboarding/select-type` is informational only — it has no form and no onward navigation; it explains that the invite link in their email is the correct path.

### Profile Flags

- `is_actively_interviewing` (installer): Surface in search results as "Open to Work"
- `is_actively_hiring` (employer): Surface in search results as "Hiring Now"

---

## 5. Middleware Logic Map

File: `middleware.ts` (project root)

### Route Categories

| Category | Routes | Rule |
|----------|--------|------|
| Public | `/`, `/login`, `/join`, `/forgot-password`, `/verify-email`, `/banned`, `/restricted` | Always accessible |
| Token routes | `/verify-email/[token]`, `/reset-password/[token]`, `/invite/[token]`, `/invite/team/[token]` | Always accessible — all covered by `pathname.startsWith("/invite/")` in middleware |
| Auth routes | `/login`, `/join`, `/forgot-password` | If logged in → redirect to `/dashboard` |
| Protected | `/dashboard/**`, `/onboarding/**`, `/admin/**` | If not logged in → redirect to `/login?redirect={pathname}` |
| Restricted-blocked | `/network/**`, `/forum/**`, `/marketplace/**`, `/jobs/**`, `/resume/**` | If `account_status === "restricted"` → redirect to `/restricted` |

### Decision Flow (in order)

```
1. updateSession() — fetches user + account_status + content_visibility
2. If auth route AND user exists → redirect /dashboard
3. If protected route AND no user → redirect /login?redirect=...
4. If user AND account_status === "banned" → redirect /banned (except /banned and /api/auth/logout)
5. If user AND account_status === "restricted" AND route is restricted-blocked → redirect /restricted
6. Pass through
```

### What Middleware Does NOT Do

- Does not check `content_visibility` for routing (that is a rendering concern)
- Does not enforce admin role (that is the admin layout's job)
- Does not validate tokens (token pages are public)

---

## 6. Auth System

### How Auth Works

Supabase email/password auth. No magic links, no OAuth, no social providers.

### Email Verification — Single System

**`profiles.email_verified_at` is the sole source of truth for email verification.** Supabase's built-in email confirmation gate is intentionally bypassed.

How it works:
- Registration calls `supabase.auth.admin.createUser()` with `email_confirm: true` — this tells Supabase to consider the auth record confirmed immediately, so it never intercepts logins
- A custom token is written to `email_verifications` and a verification email is sent
- Login checks `profiles.email_verified_at` — if null, the user is redirected to `/verify-email` regardless of their auth record state
- When the user clicks the email link, `verify_email_token` RPC sets `email_verifications.verified_at` and `profiles.email_verified_at` atomically

**Never add logic that checks `auth.users.email_confirmed_at` or handles Supabase's "Email not confirmed" error.** That path no longer exists in this codebase.

| Action | Route | Method |
|--------|-------|--------|
| Register | `/api/auth/register` | POST |
| Login | `/api/auth/login` | POST |
| Logout | `/api/auth/logout` | POST |
| Verify email | `/api/auth/verify-email` | POST |
| Resend verification | `/api/auth/resend-verification` | POST |
| Forgot password | `/api/auth/forgot-password` | POST |
| Reset password | `/api/auth/reset-password` | POST |
| Validate reset token | `/api/auth/validate-reset-token` | GET |
| Get session | `/api/auth/session` | GET |

### Client-Side Auth Context

`AuthProvider` (`components/providers/auth-provider.tsx`) wraps layouts that need client-side user data. It provides:

```typescript
const { user, userData, loading, error, refreshUser, signOut, switchProfile, clearError } = useAuth();
```

`userData` extends `Profile` with:
- `installerProfile: InstallerProfileWithExperience | null`
- `employerProfile: EmployerProfileWithServices | null`

### useAuthState Hook

`useAuthState()` (`hooks/use-auth-state.ts`) is the primary hook for components. It wraps `useAuth()` and exposes computed booleans:

```typescript
const {
  isAuthenticated, hasProfile, isEmailVerified, isOnboardingComplete,
  activeProfileType, hasInstallerProfile, hasEmployerProfile, hasBothProfiles,
  canCreateInstallerProfile, canCreateEmployerProfile,
  isAdmin, isUser,
  needsOnboarding, needsEmailVerification,
  activeProfile, displayName,
  userData, user, loading,
  refreshUser, signOut, switchProfile, checkProfileTypeExists,
} = useAuthState();
```

**Always use `useAuthState()` in components, not `useAuth()` directly**, unless you specifically need `clearError` or `error`.

### Which Layouts Wrap AuthProvider

| Layout | AuthProvider? |
|--------|--------------|
| `app/(admin)/layout.tsx` | Yes |
| `app/(protected)/layout.tsx` | Yes (implied) |
| `app/(auth)/layout.tsx` | No |
| `app/(legal)/layout.tsx` | No |
| `app/(public)/layout.tsx` | No |

### Token Expiry

- Email verification tokens: 24 hours (`VERIFICATION_TOKEN_EXPIRY_HOURS`)
- Invitation tokens: 7 days (`INVITATION_TOKEN_EXPIRY_DAYS`)
- Cron cleanup at `/api/cron/cleanup-tokens`

---

## 7. Moderation System

### Overview

The moderation system has three layers:
1. **User-submitted flags** — any authenticated user can report content
2. **DB auto-hide trigger** — Postgres automatically hides profiles that hit the flag threshold
3. **Admin review and action** — admins review flags and apply manual sanctions

### Flag Content Types

```typescript
type FlagContentType = "installer_profile" | "employer_profile" | "user_account" | "resume"
```

**Resume flags are independent of profile flags.** When a flag has `content_type = "resume"`, the system increments `unresolved_flag_count` on `installer_resumes` (targeting the row by `content_id`) rather than on `profiles`. A resume can be auto-hidden without affecting the user's profile visibility, and vice versa. Hiding a resume does not restrict the user's account status. Banning a user (via `moderate_user`) also hides all their resumes as a side effect; unbanning does NOT auto-restore them.

### Flag Categories

```typescript
type FlagCategory =
  | "spam"
  | "fake_profile"
  | "inappropriate_content"
  | "harassment"
  | "misleading_information"
  | "other"
```

### Flag Review Lifecycle

```
submitted → pending → under_review → resolved_actioned | resolved_dismissed | resolved_duplicate
```

| Status | Meaning |
|--------|---------|
| `pending` | New flag, not yet assigned |
| `under_review` | Admin is reviewing |
| `resolved_actioned` | Admin took action against the user |
| `resolved_dismissed` | Admin found no violation |
| `resolved_duplicate` | Flag was a duplicate of an existing one |

### Moderation Action Types

```typescript
type ModerationActionType =
  | "warning"      // account_status → warned
  | "hide"         // content_visibility → admin_hidden
  | "restore"      // content_visibility → restored, unresolved_flag_count → 0
  | "restrict"     // account_status → restricted
  | "unrestrict"   // account_status → active
  | "ban"          // account_status → banned + content_visibility → admin_hidden
  | "unban"        // account_status → active
  | "flag_upheld"  // audit only (no profile change)
  | "flag_dismissed" // audit only (no profile change)
```

### RPC Functions (Database Layer)

All moderation writes go through these RPC functions. Never write to moderation tables directly:

| Function | Purpose | Caller |
|----------|---------|--------|
| `submit_flag(...)` | Submit a content report | Authenticated users via `/api/flags` |
| `review_flag(...)` | Update flag status + optionally log action | Admin via `/api/admin/flags/[id]` |
| `moderate_user(...)` | Apply account-level or resume-level sanctions | Admin via `/api/admin/users/[id]/moderate` |
| `restore_user_content(...)` | Clear profile hide state and reset flag count | Admin via admin panel |
| `restore_resume_content(...)` | Clear resume hide state and reset resume flag count | Admin via admin panel |

TypeScript wrappers for all five are in `lib/db/moderation.ts`.

**`moderate_user` accepts an optional `p_resume_id` parameter.** When supplied with `action_type = "hide"` or `"restore"`, the action is applied to the specific resume rather than the user's profile. When `action_type = "ban"`, all resumes for the user are hidden regardless of whether `p_resume_id` is set.

### Flag Submission Rules (Enforced in DB)

- A user cannot flag their own content (`FLAG_SELF` error)
- A user can submit a duplicate flag — it is recorded but marked `is_duplicate: true` and returns `FLAG_DUPLICATE` as an informational code (not a hard failure)

### ModerationBanner Component

`components/shared/moderation-banner.tsx` — renders inside dashboard layouts for users who are:
- `account_status === "warned"`: shows warning with unresolved flag count
- `account_status === "pending_review"`: shows review notice
- `content_visibility === "auto_hidden"` or `"admin_hidden"`: shows "profile not visible" notice

**This component must be placed at the top of every authenticated dashboard layout that shows user-generated content.** It reads state from `useAuthState()` and is self-contained — it renders nothing if the user has no active moderation state.

### Admin Moderation Lib Functions

```typescript
import { submitFlag, reviewFlag, moderateUser, restoreUserContent } from "@/lib/db/moderation";
```

All four accept a `SupabaseClient` as their first argument. Use the admin client (`createAdminClient()`) for admin actions.

---

## 8. Data Privacy and Consent Rules

### Registration Consent

On registration, two checkboxes are required:
1. Age confirmation: "I am 18 years of age or older"
2. ToS + Privacy: "I agree to the Terms of Service and Privacy Policy"

Both are enforced client-side (disabled submit) and server-side (validated in the register route handler). On successful registration, a record is written to `consent_log` with the current document version numbers from `lib/legal/versions.ts`.

### Cookie Consent

`CookieConsentBanner` is in the root layout and covers all pages. It manages three categories:

| Category | Default | Controls |
|----------|---------|---------|
| `essential` | Always on | Session management, auth cookies |
| `analytics` | Off (opt-in) | Platform analytics |
| `advertising` | Off (opt-in) | First-party ad targeting |

Preferences are stored in `localStorage` as `cookie_preferences` with a version and timestamp. GDPR region detection runs on two layers:

1. **Client-side (banner):** `detectGdprRegion()` in `CookieConsentBanner` uses `Intl.DateTimeFormat().resolvedOptions().timeZone` to detect EU/UK timezones at render time. EU/UK users see stricter defaults and a "Reject Non-Essential" option.
2. **Server-side (persistent):** `lib/geo/region.ts` reads the `cf-ipcountry` (Cloudflare), `x-vercel-ip-country` (Vercel), or `x-country` header and maps it to a `Region` type (`"eu" | "uk" | "us" | "ca" | "other"`). The resolved country code is written to `profiles.country_code` (ISO 3166-1 alpha-2) at login and can be used in any server context via `getRegionFromRequest(request)` and `isGdprRegion(region)`.

The `CookiePreferencesTrigger` component in the footer allows users to revisit preferences at any time.

**Do not serve analytics or advertising scripts unless the user has opted into the respective category.**

### Data Export

Users can request a full export of their data from `/dashboard/settings`. This queues a `data_export_requests` record. Status values: `pending → processing → ready → expired | failed`. Download URLs expire after 48 hours. Rate limit: one request per 24 hours (application-level enforcement).

### Account Deletion

Users can request deletion from `/dashboard/settings`. This:
1. Creates a `deletion_requests` record
2. Sets a `scheduled_delete_at` 30 days out
3. Logs the user out
4. Shows the `/banned` page (or a dedicated confirmation page)

The user can cancel during the 30-day grace period. After 30 days, hard deletion removes all PII.

**On hard deletion:**
- Deleted: profile data, installer/employer profile, experience records, all PII
- Anonymized (retained for integrity): moderation_actions rows (target_user_id anonymized), job posting history references, consent_log records (converted to anonymized format)
- Reason: audit log integrity must be preserved without retaining PII

### Advertising Preferences

Separate from cookie consent — this is the CCPA "Do Not Sell/Share" right. Users can opt out of targeted advertising at any time from settings regardless of their cookie consent status. This preference is recorded in `consent_log` and checked before any ad targeting logic runs.

### Consent Log

`consent_log` table records all consent events: initial registration consent, re-consent events, cookie preference changes, and advertising opt-out/in. This is a read-only audit trail — users can view their history in settings but cannot modify it.

**Retention:** Consent log records and DPA records are retained for **7 years** after account deletion for legal compliance. They are anonymized on hard delete (PII stripped, `user_id` nulled) but the event records themselves are kept.

### EU/UK Users and GDPR

The platform is live for EU and UK users. The following additional rules apply:

**Region detection:** `lib/geo/region.ts` is the authoritative server-side region resolver. Always use `getRegionFromRequest(request)` and `isGdprRegion(region)` for server-side gating. Never hardcode country codes in route handlers.

**Cookie consent:** EU/UK users (detected via timezone on the client, IP header on the server) get stricter cookie consent defaults. "Reject Non-Essential" is surfaced prominently. This is enforced in `CookieConsentBanner`.

**Legal bases:** EU/UK users have explicit GDPR legal bases documented in the Privacy Policy: contract performance (account operation), consent (analytics/advertising cookies), legitimate interests (security, fraud prevention), and legal obligation (record-keeping). Do not process EU/UK user data for any purpose not covered by one of these bases.

**Data subject rights:** EU/UK users have rights to access, rectification, erasure, restriction, portability, and objection. These are fulfilled via existing settings flows (data export, account deletion, advertising preferences). The 30-day deletion grace period satisfies the erasure timeline.

**DPA for employer accounts:** EU/UK employer accounts are required to accept the Data Processing Agreement (DPA) before accessing installer data. The DPA page is at `/legal/dpa`. Acceptance is recorded in the `dpa_requests` table with `accepted_at`, `dpa_version`, `ip_address`, `user_agent`, and `company_name`. The DPA enforcement flow (prompting EU/UK employers at onboarding or first login) is pending implementation.

**International transfers:** All data is stored on US-based infrastructure (Supabase, Resend, Netlify/Vercel). EU/UK transfers are covered by Standard Contractual Clauses (SCCs) and the UK International Data Transfer Agreement (IDTA). Do not add new sub-processors without updating `/legal/dpa` Section 7 and `lib/legal/versions.ts`.

**Breach notification:** Security incidents affecting EU/UK users must be reported to the relevant supervisory authority within 72 hours.

---

## 9. Component Contracts

These are the non-negotiable rules every component must follow. Violating these is a build error, not a style preference.

### 9a. Content Visibility Gate

Any component that renders another user's profile, listing, or any user-generated content card must check the target user's `content_visibility` before rendering:

```typescript
if (user.content_visibility === "auto_hidden" || user.content_visibility === "admin_hidden") {
  return null; // or render a placeholder — never the actual profile data
}
```

The user's own content is always visible to themselves (they see the `ModerationBanner` instead).

### 9b. Account Status Action Gate

Any component that allows a user to perform an action (apply to a job, send a message, post to the forum, submit a flag, create a listing) must verify the user's `account_status` permits that action:

- `banned`: no actions permitted — user should not reach these components (middleware handles it)
- `restricted`: only actions on own profile permitted — block community actions
- `warned` / `pending_review`: actions are permitted — do not block, just show the banner

### 9c. Flagging Components

Any component that adds a "Report" or "Flag" button must:
1. Only show the flag option to authenticated users
2. Never show the flag option on the user's own content (`flaggedUserId !== currentUserId`)
3. Use the existing flag submission flow: `POST /api/flags` with the `submitFlagSchema` body shape
4. Handle the `FLAG_DUPLICATE` response gracefully (user-friendly message, not an error state)
5. Handle the `FLAG_SELF` response (should never appear if rule 2 is followed, but handle it)

Flag categories must come from the defined enum — do not add new categories without updating the DB enum and TypeScript type.

### 9d. ModerationBanner Placement

The `ModerationBanner` component must be placed at the top of the main content area in:
- Dashboard layouts
- Profile view pages (own profile)
- Any authenticated page where the user would expect to see their status

It is self-contained and renders nothing for users with clean status.

### 9e. Shared Components First

Before building a new UI primitive, check `components/shared/index.ts`. The following already exist and must be used:

| Component | Use For |
|-----------|---------|
| `FormField` | Any labeled form input with validation message |
| `FormSection` | Grouping related form fields with a heading |
| `FormPageContainer` | Full-page form layout wrapper |
| `LoadingButton` | Any submit button with loading state |
| `AlertMessage` | Inline success/error/info messages |
| `PageHeader` | Page title + subtitle header |
| `SectionHeader` | Section title within a page |
| `ProfileCard` | User profile summary card |
| `ProfileInfoRow` | Key-value row inside a profile |
| `ProfileInfoSection` | Grouped profile info rows |
| `BadgeList` | List of tags/chips (service types, skills) |
| `ConfirmationDialog` | Any destructive action confirmation modal |
| `ComingSoonPage` | Placeholder for unbuilt feature pages |
| `ModerationBanner` | Account/content status warnings |
| `TokenStatusCard` | Token verification status display |
| `AuthFormCard` | Auth page card wrapper |
| `BaseCard` | Generic card wrapper |
| `PageLoading` | Full-page loading spinner |
| `Logo` | App logo (always use this, never hardcode text) |
| `ImageUpload` | Drag-and-drop image upload with preview, progress bar, and remove control — use for all company logo/banner uploads |

### 9f. No Direct DB Writes from Components

Components must never import Supabase clients and query the database directly. All data operations go through:
- API routes (server-side actions)
- Hooks that call API routes (`useApiMutation`, `useFormSubmit`)

Exception: `AuthProvider` reads profile data directly via the Supabase client — this is intentional and the only approved exception.

### 9g. "use client" Directive

Any component that uses `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, or any hook must have `"use client"` as its first line. Next.js Server Components are the default — do not add `"use client"` to components that do not need it.

---

## 10. API Route Patterns

### Route Wrappers

All API routes must use one of the three wrappers from `lib/api/route-wrapper.ts`. Never write raw `NextRequest` handlers.

```typescript
import { createRoute, createAuthRoute, createAdminRoute } from "@/lib/api/route-wrapper";
```

| Wrapper | Use When | What It Does |
|---------|----------|-------------|
| `createRoute(handler, options)` | Public endpoints | Schema validation, error catching |
| `createAuthRoute(handler, schema?)` | Requires login | All of above + verifies session, provides `userId` |
| `createAdminRoute(handler, schema?)` | Admin only | All of above + verifies `role === "admin"` from DB |

### Handler Shape

```typescript
export const POST = createAuthRoute(async ({ request, data, supabase, userId }) => {
  // data is typed from your Zod schema
  // userId is guaranteed defined
  // return successResponse() or errorResponse()
}, myZodSchema);
```

### Response Helpers

Always use these — never use `NextResponse.json()` directly:

```typescript
import { successResponse, errorResponse, validationErrorResponse, rpcErrorResponse, authErrorResponse } from "@/lib/api/response";

successResponse(data, 200)
errorResponse("message", 400, ERROR_CODES.SOME_CODE)
validationErrorResponse("Validation failed", { field: "error message" })
rpcErrorResponse(rpcResult.error_code, "fallback message")
authErrorResponse(ERROR_CODES.UNAUTHORIZED)
```

### Response Shape

Every API response follows `ApiResponse<T>`:

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  errors?: Record<string, string>;
}
```

### Validation

Zod schemas for API bodies live in `lib/validations/`. Create a new file per domain. Pass the schema as the second argument to `createAuthRoute` or `createAdminRoute`.

### Client-Side API Calls

Use the `useFormSubmit` or `useApiMutation` hooks from `hooks/` for form submissions and mutations. Do not use `fetch` directly inside components.

### Upload Routes Exception

The upload routes at `app/api/upload/company-logo/` and `app/api/upload/company-banner/` use raw `async function POST/DELETE` handlers (not `createAuthRoute`) because they consume `request.formData()` rather than JSON. Auth is resolved manually via `createRouteHandlerClientWithCookies`. Ownership is verified server-side before any storage operation. All other routes use `createAuthRoute`.

### Route Inventory

| Route | Methods | Auth | Schema | Purpose |
|-------|---------|------|--------|---------|
| `/api/profiles/employer` | GET, POST, PUT | Required | `employerProfileSchema` | Employer profile CRUD |
| `/api/upload/company-logo` | POST, DELETE | Manual (formData) | Inline | Upload/remove company logo; updates `logo_storage_path` |
| `/api/upload/company-banner` | POST, DELETE | Manual (formData) | Inline | Upload/remove company banner; updates `banner_storage_path` |
| `/api/upload/signed-url` | GET | Manual (cookies) | `signedUrlSchema` | Generate 1-hour signed URL for private storage path |
| `/api/company/team/invite` | POST | Required | `inviteTeamMemberSchema` | Create invitation record via RPC + dispatch invitation email via `sendTeamInvitationEmail()` |
| `/api/company/team/members` | GET, DELETE | Required | `removeTeamMemberSchema` (DELETE) | List members + pending invitations; remove a member |
| `/api/company/team/leave` | POST | Required | `leaveTeamSchema` | Leave a team (non-owner only) |
| `/api/company/invitations/revoke` | POST | Required | `revokeInvitationSchema` | Revoke a pending invitation (owner only) |
| `/api/company/locations` | GET, POST, PUT | Required | `companyLocationSchema` / `updateCompanyLocationSchema` | List, add, or update locations |
| `/api/company/locations/deactivate` | POST | Required | `deactivateLocationSchema` | Soft-deactivate a location |

All company/* schemas live in `lib/validations/company.ts`. Upload schemas live in `lib/validations/upload.ts`.

---

## 11. Error Handling System

### Error Codes

All error codes are in `lib/errors/index.ts` as `ERROR_CODES`:

```
INVALID_CREDENTIALS, EMAIL_NOT_VERIFIED, EMAIL_ALREADY_EXISTS,
TOKEN_EXPIRED, TOKEN_INVALID, TOKEN_ALREADY_USED,
UNAUTHORIZED, FORBIDDEN, NOT_FOUND,
VALIDATION_ERROR, SERVER_ERROR,
PROFILE_EXISTS, PROFILE_NOT_FOUND,
NETWORK_ERROR, SESSION_EXPIRED,
FLAG_DUPLICATE, FLAG_SELF, FLAG_LIMIT_REACHED,
USER_BANNED, USER_RESTRICTED,
ALREADY_A_MEMBER, ALREADY_ON_TEAM,
INVITATION_NOT_FOUND, INVITATION_EXPIRED, INVITATION_INVALID,
OWNER_CANNOT_LEAVE, NOT_A_MEMBER, SELF_REMOVE_FORBIDDEN,
LOCATION_NOT_FOUND
```

### Helper Functions

```typescript
import {
  getUserFriendlyError,  // string → user-facing message
  getErrorType,          // string → ErrorType enum
  isRecoverableError,    // string → boolean
  getRecoverySuggestion, // string → suggestion string or null
  extractRpcErrorCode,   // raw RPC error message → error code string
} from "@/lib/errors";
```

### RPC Error Handling Pattern

```typescript
const result = await submitFlag(supabase, params);
if (!result.data?.success) {
  return rpcErrorResponse(result.data?.error_code, "Failed to submit flag");
}
```

---

## 12. Design System

### Color Palette

Do not use hardcoded hex or RGB values. Use only CSS custom property tokens via Tailwind classes.

#### Semantic Colors

| Token | Class | Use For |
|-------|-------|---------|
| `--background` | `bg-background` | Page backgrounds |
| `--foreground` | `text-foreground` | Primary text |
| `--card` | `bg-card` | Card surfaces |
| `--primary` | `bg-primary` / `text-primary` | Main CTA buttons, key actions |
| `--secondary` | `bg-secondary` | Secondary buttons, subdued surfaces |
| `--muted` | `bg-muted` | Placeholder backgrounds, tags |
| `--muted-foreground` | `text-muted-foreground` | Subtext, labels, captions |
| `--accent` | `bg-accent` | Hover states, subtle highlights |
| `--destructive` | `bg-destructive` | Delete, ban, danger actions |
| `--success` | `bg-success` | Confirmations, verified states |
| `--warning` | `bg-warning` | Moderation warnings, alerts |
| `--border` | `border-border` | All borders |
| `--ring` | `ring-ring` | Focus rings |

#### Brand Color

| Token | Class | Use For |
|-------|-------|---------|
| `--brand` | `bg-brand` / `text-brand` | Brand accent elements |
| `--brand-foreground` | `text-brand-foreground` | Text on brand backgrounds |
| `--brand-muted` | `bg-brand-muted` | Soft brand backgrounds |
| `--brand-muted-foreground` | `text-brand-muted-foreground` | Text on brand-muted backgrounds |

#### Forbidden Colors

**Never use purple, indigo, or violet in any form** (`purple-*`, `indigo-*`, `violet-*`, `fuchsia-*`). This is a hard constraint.

### Gradient Utilities

Defined in `tailwind.config.ts` — use these class names:

| Class | Use For |
|-------|---------|
| `bg-gradient-hero` | Auth layout background |
| `bg-gradient-primary` | Dark CTA sections |
| `bg-gradient-cta` | Dark call-to-action blocks |
| `bg-gradient-accent` | Light section backgrounds |
| `bg-gradient-card-primary` | Primary card backgrounds |
| `bg-gradient-card-secondary` | Secondary card backgrounds |
| `bg-gradient-dark-section` | Dark informational sections |
| `bg-gradient-icon-primary` | Dark icon box backgrounds |
| `bg-gradient-icon-secondary` | Light icon box backgrounds |
| `bg-gradient-icon-success` | Success state icon backgrounds |
| `bg-gradient-icon-brand` | Brand icon box backgrounds |
| `bg-gradient-brand` | Brand-colored buttons/elements |
| `bg-gradient-brand-hover` | Hover state for brand elements |

### Typography

- Font: Inter (loaded in root layout via `next/font/google`)
- Max 3 font weights in use at once
- Body line-height: 150% (`leading-relaxed`)
- Heading line-height: 120% (`leading-tight`)

### Spacing

8px base unit system. Use Tailwind spacing scale (multiples of 2 in Tailwind = multiples of 8px in practice for larger spacings).

### Dark Mode

CSS variables have `.dark` class overrides defined in `globals.css`. The app supports dark mode automatically through Tailwind's `darkMode: 'class'` config. Always verify both light and dark appearances.

### Radius

`--radius: 0.5rem` — use `rounded-lg`, `rounded-md`, `rounded-sm` which reference the CSS variable.

### Responsive Design

Build mobile-first. All layouts must work at: 320px (minimum), 768px (tablet), 1024px (desktop), 1280px (wide).

---

## 13. Database Schema Quick Reference

### Key Tables

| Table | Purpose | Logic-Driving Columns |
|-------|---------|----------------------|
| `profiles` | One row per user. Master control for status | `account_status`, `content_visibility`, `role`, `unresolved_flag_count`, `active_profile_type`, `onboarding_completed` |
| `installer_profiles` | Installer sub-profile | `is_actively_interviewing`, `experience_level` |
| `installer_experience` | Many-to-one with installer_profiles | `service_type`, `years_experience` |
| `employer_profiles` | Employer sub-profile | `is_actively_hiring`, `employee_count`, `is_vendor`, `is_distributor` |
| `employer_services` | Many-to-one with employer_profiles | `service_type` |
| `installer_resumes` | One resume per installer. Stores all resume sections and template settings | `selected_template`, `accent_color`, `content_visibility`, `unresolved_flag_count`, `auto_hidden_at` |
| `resume_views` | Append-only analytics log of resume views. No UPDATE or DELETE allowed | `resume_id`, `viewer_user_id` (nullable for anonymous), `viewer_ip_hash` |
| `company_locations` | Physical locations belonging to an employer profile. Owner has full CRUD; team members can read; active locations visible to all authenticated users | `employer_profile_id`, `is_active`, `name`, `city`, `state` |
| `company_team_members` | Tracks users who are members (or owners) of a company team. One row per user per company | `employer_profile_id`, `user_id`, `role` (`owner`\|`member`), `is_active` |
| `company_team_invitations` | Pending invitations sent by company owners to prospective team members | `employer_profile_id`, `invited_by`, `email`, `token`, `status`, `expires_at` |
| `content_flags` | All user-submitted reports | `flagger_user_id`, `flagged_user_id`, `flag_category`, `is_duplicate` |
| `flag_reviews` | One-to-one with content_flags; tracks review state | `status`, `priority`, `reviewer_id` |
| `moderation_actions` | Append-only audit log. Never updated, never deleted | `action_type`, `target_user_id`, `admin_user_id`, `reason` |
| `moderation_config` | Key-value config for moderation system | `auto_hide_threshold` (default: 3) |
| `consent_log` | Audit trail of all consent events | `user_id`, `terms_version`, `privacy_version`, `cookie_preferences` |
| `deletion_requests` | Account deletion queue | `status`, `scheduled_delete_at` |
| `data_export_requests` | Data export queue | `status`, `download_url`, `download_expires_at` |
| `email_verifications` | Email verification tokens | `token`, `expires_at`, `verified_at` |
| `invitations` | Admin invitation tokens | `token`, `expires_at`, `accepted_at` |

### Enum Values (DB and TypeScript must stay in sync)

```typescript
ServiceType:     "automotive_tint" | "architectural_glass" | "ppf" | "vinyl_wrap"
ExperienceYears: "less_than_1" | "1_to_3" | "3_to_5" | "5_to_10" | "10_plus"
EmployeeCount:   "1_to_5" | "5_to_10" | "10_to_20" | "25_plus"
UserRole:        "admin" | "user"
ProfileType:     "installer" | "employer" | "team"
ExperienceLevel: "new_to_industry" | "experienced"
AccountStatus:   "active" | "warned" | "restricted" | "banned" | "pending_review"
ContentVisibility: "visible" | "auto_hidden" | "admin_hidden" | "restored"
FlagContentType: "installer_profile" | "employer_profile" | "user_account" | "resume"
FlagCategory:    "spam" | "fake_profile" | "inappropriate_content" | "harassment" | "misleading_information" | "other"
FlagReviewStatus: "pending" | "under_review" | "resolved_actioned" | "resolved_dismissed" | "resolved_duplicate"
FlagReviewPriority: "low" | "normal" | "high" | "critical"
ModerationActionType: "warning" | "hide" | "restore" | "restrict" | "unrestrict" | "ban" | "unban" | "flag_upheld" | "flag_dismissed"
ResumeTemplate:   "standard" | "modern" | "minimal"
ResumeAccentColor: "charcoal" | "navy" | "forest"
TeamMemberRole:   "owner" | "member"
TeamInvitationStatus: "pending" | "accepted" | "expired" | "revoked"
```

### RLS Policy Rules

Every new table must have RLS enabled. Policies must follow these patterns:
- Use `auth.uid()`, never `current_user`
- SELECT policies use `USING` only
- INSERT policies use `WITH CHECK` only
- UPDATE policies use both `USING` and `WITH CHECK`
- DELETE policies use `USING` only
- Never use `USING (true)` — always check ownership or membership
- Use 4 separate policies per operation type — never `FOR ALL`

### Query Conventions

- Always use `.maybeSingle()` when expecting 0 or 1 row (not `.single()` which throws on empty)
- Join related data in a single query using Supabase's embedded select syntax where possible
- All RPC calls go through `callRpc()` from `lib/db/utils.ts`

### RPC Function Reference

All RPC functions use `SECURITY DEFINER`, pass data via `jsonb` params, and return `jsonb`. TypeScript wrappers are in `lib/db/`.

**`search_path` and Extension Functions**

All RPCs declare `SET search_path = public`. This locks the function's schema search path to `public` only. The `pgcrypto` and `uuid-ossp` extensions are installed in the `extensions` schema, not `public`. Any RPC that calls these functions **must use the fully-qualified schema prefix**:

```sql
-- Correct
v_token := encode(extensions.gen_random_bytes(24), 'hex');

-- Wrong — will fail with "function gen_random_bytes(integer) does not exist"
v_token := encode(gen_random_bytes(24), 'hex');
```

This rule applies to any extension-provided function: `extensions.gen_random_bytes()`, `extensions.gen_random_uuid()`, `extensions.pgp_sym_encrypt()`, etc. Never call extension functions without the `extensions.` prefix inside a `SECURITY DEFINER` function that uses `SET search_path = public`.

#### Employer Profile RPCs (`lib/db/profiles.ts`)

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `create_employer_profile_with_services` | `p_user_id`, `p_profile_data` (jsonb), `p_services` (text[]) | `EmployerProfileResult` | Atomically creates profile, owner team member row, sets `team_member_id`; auto-generates `company_slug` |
| `update_employer_profile_with_services` | `p_user_id`, `p_profile_data` (jsonb), `p_services` (text[]) | `EmployerProfileResult` | COALESCE-merge update; replaces services list |
| `get_employer_profile_with_services` | `p_user_id` | `EmployerProfileResult` | Returns full profile + `services` + `active_team_member_count` + nested `locations` array |

#### Team Management RPCs (`lib/db/team.ts`)

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `invite_team_member` | `p_owner_id`, `p_employer_profile_id`, `p_email` | `InviteTeamMemberResult` | Ownership check; duplicate/existing-member guard; creates invitation row with 7-day TTL |
| `accept_team_invitation` | `p_token`, `p_user_id` | `AcceptTeamInvitationResult` | Token lookup, email match, already-on-team guard; creates team member, sets `active_profile_type = 'team'` |
| `leave_team` | `p_user_id`, `p_employer_profile_id` | `LeaveTeamResult` | Owner-leave prevention; deletes member row; sets `active_profile_type` fallback |
| `remove_team_member` | `p_owner_id`, `p_employer_profile_id`, `p_target_user_id` | `RemoveTeamMemberResult` | Owner-only; self-removal prevention; sets fallback profile type on removed user |
| `revoke_team_invitation` | `p_owner_id`, `p_invitation_id` | `RevokeTeamInvitationResult` | Owner-only; only pending invitations can be revoked |

#### Company Location RPCs (`lib/db/team.ts`)

| Function | Params | Returns | Notes |
|----------|--------|---------|-------|
| `add_company_location` | `p_owner_id`, `p_employer_profile_id`, `p_location_data` (jsonb) | `CompanyLocationResult` | Owner validation before insert |
| `update_company_location` | `p_owner_id`, `p_location_id`, `p_location_data` (jsonb) | `CompanyLocationResult` | COALESCE-merge update; owner validated via JOIN to employer_profiles |
| `deactivate_company_location` | `p_owner_id`, `p_location_id` | `DeactivateLocationResult` | Soft deactivation only (sets `is_active = false`) |
| `get_company_locations` | `p_caller_id`, `p_employer_profile_id` | `CompanyLocationResult[]` | Owner sees all; team members see active only |

---

## 14. Feature Status Map

### Built and Functional

| Feature | Routes | Notes |
|---------|--------|-------|
| Registration + Login | `/join`, `/login` | Email/password, verification required |
| Email verification | `/verify-email`, `/verify-email/[token]` | 24h token TTL |
| Password reset | `/forgot-password`, `/reset-password/[token]` | 7d token TTL |
| Admin invitations | `/invite/[token]` | Admin-only send via `/api/invitations/send`; dispatches email via `sendInvitationEmail()` |
| Company team invitations | `/invite/team/[token]` | Owner send via `POST /api/company/team/invite`; RPC creates record + `sendTeamInvitationEmail()` dispatches email to `/invite/team/${token}` accept path; graceful degradation if email delivery fails |
| Onboarding flow | `/onboarding/select-type`, `/onboarding/installer`, `/onboarding/employer` | |
| Installer profile | `/dashboard/installer`, `/dashboard/create-profile/installer` | |
| Employer profile (full management) | `/dashboard/employer`, `/dashboard/create-profile/employer` | Phase E rebuild: logo/banner upload, inline edit, team management, locations; `is_vendor` and `is_distributor` toggles fully wired (DB → RPC → form → dashboard) |
| Team member dashboard | `/dashboard/team` | Read-only company view, role badge, Leave Team action, owner link to employer dashboard |
| Profile switching | Header ProfileSwitcher | |
| Settings page | `/dashboard/settings` | Data export, deletion, consent history, ad prefs |
| Flagging system | `POST /api/flags` | Full DB-level auto-hide |
| Admin panel | `/admin/**` | Users, flags, data requests, system |
| Legal pages | `/terms`, `/privacy`, `/legal/cookies`, `/legal/dpa`, `/legal` | |
| Cookie consent | Root layout | 3-category, GDPR-aware |
| Moderation banner | Shared component | Self-contained, used in dashboard layouts |
| Banned page | `/banned` | |
| Restricted page | `/restricted` | |
| Resume builder | `/dashboard/resume`, `/api/resume` | 3 templates (Standard, Modern, Minimal), live HTML preview |

### Scaffolded (Coming Soon UI)

| Feature | Route | What Exists |
|---------|-------|------------|
| Jobs board | `/jobs` | `ComingSoonPage` placeholder |
| Forum | `/forum` | `ComingSoonPage` placeholder |
| Network | `/network` | `ComingSoonPage` placeholder |
| Marketplace | `/marketplace` | `ComingSoonPage` placeholder |
| Blog | `/blog` | `ComingSoonPage` placeholder |
| Shop | `/shop` | `ComingSoonPage` placeholder |

### Schema + RPC Layer Complete (UI Layer Pending)

| Feature | Phase | Notes |
|---------|-------|-------|
| Employer profile branding + company management schema | Phase A | `company_slug`, `company_description`, `website_url`, `logo_storage_path`, `banner_storage_path`, `social_links`, `is_vendor` added to `employer_profiles`; `location_count` made nullable |
| `is_distributor` column on `employer_profiles` | Phase A (addendum) | Migration `20260315165407`; RPC updated in `20260315165646`; `is_distributor` now stored, returned from all employer RPCs, and surfaced in employer profile form + dashboard |
| Company locations | Phase A | `company_locations` table with full CRUD RLS |
| Company team members | Phase A | `company_team_members` table with owner/member RLS |
| Company team invitations | Phase A | `company_team_invitations` table with owner + invitee RLS |
| Team profile type | Phase A | `team` added to `profile_type` enum; `team_member_id` FK added to `profiles` |
| Employer profile RPCs (create/update/get) | Phase B | Updated to handle all new columns; `create` auto-generates slug + creates owner team member atomically |
| Team management RPCs | Phase B | `invite_team_member`, `accept_team_invitation`, `leave_team`, `remove_team_member`, `revoke_team_invitation` |
| Company location RPCs | Phase B | `add_company_location`, `update_company_location`, `deactivate_company_location`, `get_company_locations` |
| TypeScript wrappers for all team/location RPCs | Phase B | `lib/db/team.ts` |
| New error codes for team/invitation/location flows | Phase B | `lib/errors/index.ts` |
| `company-assets` Storage bucket + RLS | Phase C | Private bucket; owner-scoped 4-policy RLS |
| `lib/storage/company-assets.ts` utilities | Phase C | upload, replace, delete, signed URL helpers |
| `ImageUpload` component | Phase C | `components/shared/image-upload.tsx`; drag-and-drop, preview, progress, remove |
| Upload API routes | Phase C | `POST/DELETE /api/upload/company-logo`, `POST/DELETE /api/upload/company-banner`, `GET /api/upload/signed-url` |
| Company team API routes | Phase C | `/api/company/team/invite` (fully end-to-end: RPC creation + `sendTeamInvitationEmail()` dispatch), `/members`, `/leave`, `/api/company/invitations/revoke` |
| Company location API routes | Phase C | `/api/company/locations` (GET/POST/PUT), `/api/company/locations/deactivate` |
| `rpcErrorResponse` updated for team/location codes | Phase C | `lib/api/response.ts` status + code maps |
| Validation schemas for upload + company routes | Phase C | `lib/validations/upload.ts`, `lib/validations/company.ts` |
| `/invite/team/[token]` accept page | Phase D | All invitation states: invalid, unauthenticated, wrong email, already on team, confirm |
| Team invitation validate + accept API routes | Phase D | `GET /api/invitations/team-validate`, `POST /api/invitations/team-accept` |
| `AuthProvider` — `teamProfile` field in `UserData` | Phase D | Fetches `company_team_members` → `employer_profiles` when `team_member_id` is set |
| `useAuthState()` — team profile booleans | Phase D | `hasTeamProfile`, `isActiveTeamMember`, team-aware `getActiveProfile` and `getProfileDisplayName` |
| `PUT /api/profiles/active` — accepts `"team"` | Phase D | Validates `team_member_id` exists before switching |
| `/dashboard` redirect — routes team profile type | Phase D | Routes `active_profile_type === "team"` → `/dashboard/team` |
| Employer dashboard rebuild | Phase E | `components/employer/`: `CompanyBrandingSection`, `CompanyInfoSection`, `TeamManagementSection`, `LocationsSection` |
| Team member dashboard | Phase E | `/dashboard/team/page.tsx`; read-only company view, Leave Team with `ConfirmationDialog`, owner → employer link |
| Onboarding select-type (3-card) | Phase F | `/onboarding/select-type`: Installer, Employer, Join a Team (informational, invitation-only) |
| `lib/types/database.ts` complete | Phase F | All tables in `Database` interface; `ConsentLog`, `DeletionRequest`, `DataExportRequest`, `DpaRequest` type aliases added; `Database.Enums` matches all 8 actual DB enums |

### Not Started

| Feature | Phase | Dependency |
|---------|-------|-----------|
| Direct messaging | Phase 4 | Standalone |
| Message compliance (delete, block, report) | Phase 4 | Messaging feature |
| First-party ad system | Phase 6 | Business decision |
| Ad consent tracking | Phase 6 | Ad system |
| DPA enforcement flow (EU/UK employer prompt) | Phase 7 | GDPR infrastructure (complete) |
| Public installer/employer profile pages | Phase G | Standalone |
| Network/search scaffolding | Phase G | Profile pages |

### GDPR / EU/UK Infrastructure (Complete)

| Feature | Notes |
|---------|-------|
| Server-side region detection | `lib/geo/region.ts` — IP header → `Region` type; `isGdprRegion()` helper |
| `profiles.country_code` column | ISO 3166-1 alpha-2; populated from CF-IPCountry at login |
| `dpa_requests` table | DPA acceptance tracking with RLS; columns: `accepted_at`, `dpa_version`, `ip_address`, `user_agent`, `company_name` |
| GDPR-aware cookie consent | `CookieConsentBanner` — stricter defaults, "Reject Non-Essential" for EU/UK users |
| Data Processing Agreement page | `/legal/dpa` — full GDPR Article 28 obligations, SCCs, UK IDTA |
| GDPR rights in Privacy Policy | `/privacy` — access, rectification, erasure, portability, objection, supervisory authority complaint |
| ePrivacy/PECR cookie policy | `/legal/cookies` — separate consent per analytics/advertising category |
| Legal document versioning | `lib/legal/versions.ts` — `TERMS_VERSION`, `PRIVACY_VERSION`, `COOKIES_VERSION`, `DPA_VERSION` |
| 7-year retention on consent/DPA records | Anonymized on hard delete, records retained for legal compliance |

---

## 15. File and Folder Conventions

### Where Things Live

| Thing | Location |
|-------|----------|
| Page components | `app/(group)/route/page.tsx` |
| Layout components | `app/(group)/layout.tsx` |
| API routes | `app/api/domain/route.ts` |
| Reusable UI components | `components/shared/` |
| shadcn/ui primitives | `components/ui/` |
| Feature-specific form components | `components/forms/` |
| Settings section components | `components/settings/` |
| Legal page components | `components/legal/` |
| Layout-level components (header, footer) | `components/layout/` |
| Context providers | `components/providers/` |
| Custom hooks | `hooks/` |
| DB access functions | `lib/db/` |
| Supabase client config | `lib/supabase/` |
| API route utilities | `lib/api/` |
| Zod validation schemas | `lib/validations/` |
| Form field definitions | `lib/forms/` |
| TypeScript types | `lib/types/` |
| Application constants | `lib/constants/` |
| Error codes and helpers | `lib/errors/` |
| Utility functions | `lib/utils/` |
| Geographic helpers | `lib/geo/` |
| Legal document versions | `lib/legal/versions.ts` |
| DB migrations | `supabase/migrations/` |
| Storage utilities | `lib/storage/` |

### Naming Conventions

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Hooks: `use-kebab-case.ts`, exported as `useHookName`
- API routes: always named `route.ts`
- DB functions: `camelCase` in TypeScript, `snake_case` in SQL

### Barrel Exports

Every `components/*/` subfolder has an `index.ts` that re-exports all public components. Import from the barrel, not from individual files:

```typescript
import { ModerationBanner, ProfileCard, LoadingButton } from "@/components/shared";
```

### File Size Rule

If a file exceeds ~250 lines, split it. Components with sub-components, helpers, and types should be broken into separate files in a dedicated subfolder.

### New Migrations

- Use `mcp__supabase__apply_migration` tool only — never write raw SQL to the migrations folder manually
- Every migration starts with a detailed multi-line comment block explaining all changes
- Use `IF NOT EXISTS` / `IF EXISTS` guards on all DDL
- Enable RLS immediately on every new table in the same migration
- Never use `DROP` or `DELETE` in migrations — use soft deletes and `ADD COLUMN` patterns only

### Storage Buckets

| Bucket | Visibility | Max File Size | Allowed Types | Path Structure |
|--------|-----------|--------------|--------------|----------------|
| `company-assets` | Private | 5 MB | JPEG, PNG, WebP | `/{employer_profile_id}/{logo\|banner}/{filename}` |

**company-assets RLS rules:**
- All four operations (SELECT, INSERT, UPDATE, DELETE) check: `auth.uid()` must be the `user_id` of the `employer_profiles` row whose `id` matches `split_part(name, '/', 1)` (the first path segment)
- Reads (signed URLs) are generated server-side by the admin client via `lib/storage/company-assets.ts` — never expose raw storage URLs to the client
- All storage operations go through `lib/storage/company-assets.ts` — never call `supabase.storage` from route handlers directly

**Storage utility functions** (`lib/storage/company-assets.ts`):

| Function | Purpose |
|----------|---------|
| `uploadCompanyAsset(profileId, folder, filename, buffer, contentType)` | Upload a new file (upsert mode) |
| `replaceCompanyAsset(profileId, folder, filename, buffer, contentType)` | Delete all existing files in folder then upload |
| `deleteCompanyAsset(profileId, folder, filename)` | Delete a specific file |
| `deleteCompanyFolder(profileId, folder)` | Delete all files in a folder |
| `getSignedUrl(storagePath, ttlSeconds?)` | Generate a 1-hour signed URL (default) |
| `getSignedUrls(paths[], ttlSeconds?)` | Batch signed URL generation |
| `buildStoragePath(profileId, folder, originalFilename)` | Generate a sanitized, timestamped path |

---

*Last updated: Phase 1 + 2 foundation complete. Phase 3 resume builder complete. Phase 3.1 resume-level flagging complete. Employer Phase A–E complete (see above). Employer Phase F complete: `/onboarding/select-type` rebuilt with three cards — Installer (routes to `/onboarding/installer`), Employer (routes to `/onboarding/employer`), Join a Team (informational only — explains invitation-only access, no form, no navigation); `lib/types/database.ts` fully audited and completed — `consent_log`, `deletion_requests`, `data_export_requests`, `dpa_requests` tables added to `Database` interface with Row/Insert/Update shapes from live DB schema, corresponding `ConsentLog`, `DeletionRequest`, `DataExportRequest`, `DpaRequest` type aliases exported; `Database.Enums` block verified to contain only the 8 actual DB pg enum types; all DB enums and TypeScript types confirmed in sync per section 13 rule; BUILDREF section 4 Onboarding Flow paragraph updated to document the three-card select-type flow and the invitation-only team join path. Phase A addendum: `is_distributor` boolean added to `employer_profiles` (migration `20260315165407`, RPC update `20260315165646`); both `is_vendor` and `is_distributor` are now fully wired end-to-end — DB column → RPC → TypeScript type → validation schema → creation form → dashboard display; section 13 employer_profiles logic-driving columns updated; section 14 Feature Status Map updated. GDPR/EU/UK infrastructure addendum: all EU/UK serving infrastructure is live and complete prior to Phase G — server-side IP region detection (`lib/geo/region.ts`), `profiles.country_code` column, `dpa_requests` table with RLS, GDPR-aware `CookieConsentBanner`, DPA page (`/legal/dpa`), GDPR rights in Privacy Policy, ePrivacy/PECR cookie policy, legal document versioning (`lib/legal/versions.ts`), and 7-year anonymized retention for consent/DPA records; section 8 Data Privacy rules updated with EU/UK GDPR subsection, two-layer region detection description, and 7-year retention note; section 14 Feature Status Map corrected — GDPR infrastructure moved to its own "Complete" table, remaining open item (DPA enforcement flow) listed under "Not Started" Phase 7. Auth system fix: dual email verification conflict resolved — `email_confirm: true` used at registration to bypass Supabase's built-in gate entirely; `profiles.email_verified_at` is now the single source of truth; Supabase "Email not confirmed" intercept removed from login route; `auth.users.email_confirmed_at` synced for all existing users via migration; section 6 updated with "Email Verification — Single System" documentation. RPC extension schema fix: `invite_team_member` token generation updated from `gen_random_bytes(24)` to `extensions.gen_random_bytes(24)`; section 13 RPC Function Reference updated with `search_path` + extension schema rule documenting that all extension-provided functions (`pgcrypto`, `uuid-ossp`, etc.) must use the `extensions.` prefix inside `SECURITY DEFINER` RPCs that declare `SET search_path = public`. Next: Phase G (public installer/employer profile pages with visibility gating, installer profile inline-edit parity, and network/search scaffolding). Team invite email fix: `POST /api/company/team/invite` now calls `sendTeamInvitationEmail()` after the RPC succeeds, using the `/invite/team/${token}` accept path and passing `token` and `email` from the `InviteTeamMemberResult`; if email delivery fails the route logs a warning and still returns 201 so the invitation record is never silently lost.*
