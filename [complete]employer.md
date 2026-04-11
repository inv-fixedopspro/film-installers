Plan: Employer Profile Foundation — Team Profile Type, Branding, Locations, and Company Management

Phase A: Schema Foundation (Migrations)

This is a major phase boundary. BUILDREF.md update is required at the end.

Add team to the profile_type enum (syncing DB enum and the ProfileType TypeScript type in lib/types/database.ts — the BUILDREF.md enum table must reflect this addition)
Add all new columns to employer_profiles: company_slug, company_description, website_url, logo_storage_path, banner_storage_path, social_links, is_vendor — all additive, no drops
Mark location_count as nullable/optional
Create company_locations table with RLS following the four-policy-per-operation rule (SELECT, INSERT, UPDATE, DELETE as separate policies, no FOR ALL, ownership checked via auth.uid())
Create company_team_members table with RLS covering owner insert/delete, member select, self-select, self-delete
Create company_team_invitations table with RLS covering owner insert/select/update, invited user select by token
Add team_member_id nullable FK to profiles pointing to company_team_members
Add updated_at triggers to all new tables
Every migration starts with a detailed comment block, uses IF NOT EXISTS guards, and enables RLS in the same migration per BUILDREF.md section 15
Update BUILDREF.md: Add all new tables to the Key Tables reference (section 13), update the Enum Values table to include ProfileType: team, update the Feature Status Map (section 14) to show schema phase complete, and update the "last updated" line at the bottom
Phase B: RPC Functions

This is a major phase boundary. BUILDREF.md update is required at the end.

Update create_employer_profile_with_services to handle new fields, auto-generate company_slug, automatically create the owner row in company_team_members, and set team_member_id on the creator's profiles row — all in one atomic transaction following the existing RPC pattern called via callRpc() from lib/db/utils.ts
Update update_employer_profile_with_services to handle all new fields
Update get_employer_profile_with_services to return new fields, active team member count, and active locations as a nested array
Add invite_team_member RPC with ownership validation, duplicate/existing-team checks, and invitation row creation
Add accept_team_invitation RPC with token validation, email match check, already-on-team guard, and atomic acceptance flow
Add leave_team RPC with owner-leave prevention, membership deletion, and active_profile_type fallback logic
Add remove_team_member RPC with owner-only enforcement and self-removal prevention
Add revoke_team_invitation RPC
Add add_company_location, update_company_location, deactivate_company_location, get_company_locations RPCs — all validate caller is owner before acting
Add new error codes to lib/errors/index.ts: ALREADY_A_MEMBER, ALREADY_ON_TEAM, and any other new codes introduced by these RPCs
Add TypeScript wrappers in lib/db/ for all new RPCs following the existing pattern in lib/db/moderation.ts
Update BUILDREF.md: Document all new RPC functions in section 13 (or a dedicated RPC reference section if appropriate), add new error codes to section 11, update the Feature Status Map, update the "last updated" line
Phase C: Storage, Upload Infrastructure, and API Routes

This is a major phase boundary. BUILDREF.md update is required at the end.

Create the company-assets private Supabase Storage bucket with folder structure /{employer_profile_id}/logo/ and /{employer_profile_id}/banner/
Set RLS on the bucket scoped to the user being the owner of the employer profile matching the folder name
Create lib/storage/company-assets.ts with server-side upload, replace, delete, and signed URL utilities
Create the reusable ImageUpload client component in components/shared/ with drag-and-drop, preview, progress bar, file type/size enforcement, and remove control — exported via the barrel (components/shared/index.ts)
Create upload API routes under app/api/upload/: POST and DELETE for company-logo, POST and DELETE for company-banner, and GET for signed-url — all using createAuthRoute per BUILDREF.md section 10, with Zod schemas in lib/validations/
Create team and location API routes under app/api/company/: team invite, team member remove, team leave, team GET, invitation revoke, and location add/update/deactivate — all using createAuthRoute, ownership validated server-side, responses using successResponse/errorResponse/rpcErrorResponse helpers
Update BUILDREF.md: Add new API routes to section 10 (API Route Patterns), add storage bucket rules and the lib/storage/ location to section 15 (File and Folder Conventions), add ImageUpload to the shared components table in section 9e, update the Feature Status Map, update the "last updated" line
Phase D: Team Invitation Accept Page and Auth Provider Updates

Add /invite/team/[token] as a public route — add it to the token routes category in middleware (BUILDREF.md section 5 lists /invite/[token] as already in that category; this extends the same pattern)
Build the invitation accept page with all states: invalid/expired token, unauthenticated visitor with company preview and auth redirect preserving the token, email match confirmation card, already-on-another-team warning card, wrong email message
On successful accept, redirect to /dashboard
Update fetchUserData in components/providers/auth-provider.tsx to fetch the user's company_team_members record if team_member_id is set, joining through to the employer profile data
Add teamProfile field to UserData type — this is distinct from employerProfile (the company they own)
Update switchProfile in AuthProvider to accept 'team' as a valid profile type — the PUT /api/profiles/active route already exists and just needs the enum updated
Update the computed booleans in useAuthState() (hooks/use-auth-state.ts) to reflect the new team profile type where relevant
Phase E: Dashboard — Employer Dashboard Rebuild and Team Profile View

This is a major phase boundary. BUILDREF.md update is required at the end.

Replace the current read-only employer dashboard at /dashboard/employer with a fully managed interface (owner-only): logo/banner with ImageUpload controls, company info inline editing, is_vendor toggle with explanation, locations section (optional, labeled as such), and team management section with active members list, pending invitations list, and invite modal
All mutations happen without full page reloads using useApiMutation or useFormSubmit hooks per BUILDREF.md section 10
Use existing shared components throughout: FormField, FormSection, LoadingButton, AlertMessage, SectionHeader, ConfirmationDialog, BadgeList, ModerationBanner at top per section 9d
Build the team profile dashboard view at /dashboard/team/page.tsx — shows company info read-only, role badge, owner identification, Leave Team button with ConfirmationDialog, and ComingSoonCard placeholders for future features; owner sees a link back to the employer dashboard
Update /dashboard/page.tsx redirect logic to route active_profile_type === 'team' to /dashboard/team
Update BUILDREF.md: Add team profile dashboard to the Feature Status Map as Built and Functional, add /dashboard/team to the routes table in section 14, update the Profile System section (section 4) to document the three-way profile type and the teamProfile field in UserData, update the "last updated" line
Phase F: Onboarding Flow Updates and Type Definitions

Update /onboarding/select-type to show three cards: Installer, Employer, and Join a Team — the Join a Team card explains invitation-only access and links to help text rather than a form
Update the dashboard's create-profile section to reflect the same logic
Update lib/types/database.ts with all new types: CompanyLocation, CompanyTeamMember, CompanyTeamInvitation, expanded EmployerProfile with all new fields, ProfileType updated to include 'team', and new composite type TeamProfile
Ensure all enum values in lib/types/database.ts remain in sync with the DB enums per BUILDREF.md section 13 rule
Summary

The work is organized so that the database is stable before any application code touches it, RPCs are complete before API routes call them, and storage infrastructure is in place before the UI components that use it are built. BUILDREF.md is treated as a first-class deliverable — not an afterthought — with explicit update steps at every major phase boundary exactly as the document requires. Every new piece follows the existing patterns already documented: four separate RLS policies per operation, createAuthRoute wrappers, successResponse/errorResponse helpers, callRpc() for all RPC calls, shared components from the barrel, and "use client" on any component using hooks.