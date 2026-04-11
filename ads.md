Plan: Advertising System -- Core Infrastructure and Admin Management (Phased)

This builds on the existing compliance layer (3 tables already in place: ad_consent_log, ad_impressions, ad_clicks, plus the CCPA opt-out on profiles). The work is broken into 6 sequential phases so each one is self-contained, testable, and buildable without jumping around.

Phase 1 -- Database Schema and Types

This phase creates every table, column addition, and TypeScript type the entire system needs. Nothing else is built until the data layer is solid.

Create a new Supabase migration with the following new tables:
advertisers -- companies/people buying ad space (id, name, contact_email, contact_phone, company_url, notes, is_active, created_at, updated_at)
ad_packages -- purchasable tiers defining what an advertiser gets (id, name, tier ["starter" | "professional" | "premium" | "elite"], price_cents, duration_days [7, 14, 30, 90], max_creatives, included_slot_types [JSONB array], included_page_contexts [JSONB array], target_audience ["all" | "installer" | "employer"], rotation_interval_seconds default 4, priority_weight for rotation ordering, is_active, created_at, updated_at)
ad_slots -- every physical ad placement on the platform (id, slot_key unique string like "home_banner_top", display_name, slot_type ["leaderboard" | "banner" | "sidebar" | "inline" | "sticky_footer"], page_context ["home" | "jobs" | "forum" | "network" | "marketplace" | "blog" | "shop" | "dashboard"], width_px, height_px, max_file_size_kb, allowed_formats text array, is_public_page boolean, traffic_tier ["high" | "medium" | "low"], target_audience ["all" | "installer" | "employer"], is_active, sort_order, created_at, updated_at)
ad_campaigns -- each sold engagement (id, advertiser_id FK, ad_package_id FK, campaign_name, status ["draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled"], starts_at, ends_at, admin_notes, total_price_cents, payment_status ["unpaid" | "invoiced" | "paid" | "refunded"], invoice_reference text nullable, paid_at nullable, created_by FK to profiles for admin user, created_at, updated_at)
ad_creatives -- the actual image files (id, campaign_id FK, label, image_storage_path, destination_url, alt_text, slot_type matching the slot types enum, width_px, height_px, file_size_bytes, is_active, created_at, updated_at)
ad_campaign_slots -- junction table linking campaigns to slots (id, campaign_id FK, ad_slot_id FK, is_active, created_at; unique constraint on campaign_id + ad_slot_id)
Add ad_campaign_id (uuid, nullable) and ad_creative_id (uuid, nullable) columns to the existing ad_impressions and ad_clicks tables so tracking ties back to a specific campaign and creative, not just a package
Enable RLS on all new tables with admin-only (service role) access policies
Add indexes on: campaigns (status, starts_at, ends_at, advertiser_id), creatives (campaign_id, is_active), campaign_slots (ad_slot_id, campaign_id)
Add all new table types to lib/types/database.ts following the existing Row/Insert/Update pattern
Create lib/constants/ad-system.ts defining:
Slot type dimensions: Leaderboard 728x90, Banner 468x60, Sidebar 300x250, Inline 320x100 mobile / 728x90 desktop, Sticky Footer 320x50 mobile / 728x90 desktop
Page context definitions with public/authenticated flag and estimated traffic tier
Target audience options
Package tier definitions with default configurations
Rotation interval default (4000ms)
Max file size (2MB), allowed formats (JPEG, PNG, WebP, GIF only -- no video)
Campaign status labels and colors for UI
Payment status labels and colors for UI
Phase 2 -- Storage Bucket and Database Helper Functions

This phase wires up image storage and creates every data access function the API routes and UI will need.

Create an ad-creatives Supabase Storage bucket (private, not public) with 2MB file size limit and MIME types restricted to image/jpeg, image/png, image/webp, image/gif
Set storage RLS so only service role can upload/delete (all operations are admin-only)
Create lib/storage/ad-creatives.ts with upload, replace, delete, and signed URL helpers (following the exact pattern of the existing lib/storage/company-assets.ts)
Create lib/db/advertising.ts with all data access functions:
Advertiser CRUD: createAdvertiser, updateAdvertiser, getAdvertiser, listAdvertisers
Package CRUD: createPackage, updatePackage, getPackage, listPackages (with active-only filter)
Slot CRUD: createSlot, updateSlot, getSlot, listSlots (filterable by page_context, slot_type, traffic_tier, target_audience)
Campaign management: createCampaign, updateCampaign, getCampaign, listCampaigns (filterable by status, advertiser, date range), updateCampaignStatus (pause/activate/complete/cancel)
Creative management: createCreative (DB insert after storage upload), deleteCreative, listCreativesByCampaign, toggleCreativeActive
Slot assignment: assignCampaignToSlot, removeCampaignFromSlot, listCampaignSlots, listAvailableSlotsForPackage
Ad serving query: getActiveAdsForSlot(slotKey, pageContext, targetAudience) -- returns all active creatives for a slot where the campaign is active and within its date window, ordered by priority weight
Analytics queries: getImpressionsByDateRange, getClicksByDateRange, getCTRByCampaign, getCTRBySlot, getSlotFillRate, getCampaignPerformanceSummary, getRevenueByPeriod
Create lib/validations/advertising.ts with Zod schemas for all API request bodies: advertiser create/update, package create/update, slot create/update, campaign create/update, creative create, slot assignment, analytics query params
Phase 3 -- API Routes

This phase exposes all the admin management operations and the public ad-serving endpoints.

Create admin API routes (all using createAdminRoute wrapper):
app/api/admin/advertising/advertisers/route.ts -- GET (list) and POST (create)
app/api/admin/advertising/advertisers/[id]/route.ts -- GET (single) and PUT (update)
app/api/admin/advertising/packages/route.ts -- GET (list) and POST (create)
app/api/admin/advertising/packages/[id]/route.ts -- PUT (update)
app/api/admin/advertising/slots/route.ts -- GET (list with occupancy counts) and POST (create)
app/api/admin/advertising/slots/[id]/route.ts -- PUT (update)
app/api/admin/advertising/campaigns/route.ts -- GET (list with filters) and POST (create)
app/api/admin/advertising/campaigns/[id]/route.ts -- GET (detail with creatives, slots, metrics) and PUT (update including status changes)
app/api/admin/advertising/campaigns/[id]/creatives/route.ts -- GET (list) and POST (upload with dimension validation against slot type)
app/api/admin/advertising/campaigns/[id]/creatives/[creativeId]/route.ts -- PUT (toggle active) and DELETE (remove file + DB row)
app/api/admin/advertising/campaigns/[id]/slots/route.ts -- POST (assign) and DELETE (remove assignment)
app/api/admin/advertising/analytics/route.ts -- GET (aggregated metrics with date range, campaign, slot, and grouping filters)
Create public ad-serving API routes:
app/api/ads/serve/route.ts -- GET with query params slot, page, audience; returns array of active creatives with signed image URLs, destination URLs, dimensions, and IDs for tracking
app/api/ads/impression/route.ts -- POST to record an impression event (validates session token, respects CCPA opt-out, writes to ad_impressions)
app/api/ads/click/[creativeId]/route.ts -- GET redirect endpoint; records click in ad_clicks then 302 redirects to destination URL
Phase 4 -- Ad Display Component and Session Tracking

This phase builds the reusable front-end pieces that will be dropped into pages later.

Create lib/utils/ad-session.ts -- generates a random UUID session token on first visit, stores in a cookie with 24-hour expiry; provides getAdSessionToken() helper; checks CCPA opt-out status before allowing event recording
Create components/ads/AdSlot.tsx -- client component that:
Accepts slotKey, pageContext, and targetAudience as props
On mount, calls the serve API to get active ads for its slot
If ads exist, renders the first one and starts a rotation timer (using the interval from the campaign's package, default 4 seconds)
Each rotation fires an impression event to the tracking API
Click-through wraps the destination URL through the click tracking redirect endpoint
Handles empty state gracefully (renders absolutely nothing -- no whitespace, no layout shift)
Shows a small "Ad" label for transparency
Responsive: adjusts to mobile dimensions on small screens per the slot type constants
Respects the user's CCPA ad opt-out (still shows ads but does not record tracking events)
Create components/ads/AdSlotSkeleton.tsx -- dimension-matched loading placeholder
Create components/ads/index.ts -- barrel export
These components are built but NOT placed on any pages yet -- they are the plug-and-play building blocks for future page buildouts
Phase 5 -- Admin UI (Ad Space Management)

This phase replaces the "Coming Soon" placeholder at /admin/ad-space with the full management interface.

Dashboard overview (/admin/ad-space/page.tsx) -- replace the ComingSoonPage with a real dashboard showing: active campaigns count, total revenue this month, total impressions this month, overall CTR, number of empty slots (opportunity indicator); below the cards, a quick-glance table of currently active campaigns with status badges, advertiser name, date range, and impression/click/CTR columns
Advertisers management (/admin/ad-space/advertisers/page.tsx) -- list all advertisers with name, contact, campaign count, total spend, active status; includes a create/edit form (modal or inline) for adding new advertisers and updating existing ones
Packages management (/admin/ad-space/packages/page.tsx) -- list all ad packages with tier, price, duration, included slot types, page contexts, target audience, max creatives; create/edit forms with all package configuration fields; ability to deactivate packages
Slots management (/admin/ad-space/slots/page.tsx) -- visual grid/table of all defined slot placements showing slot name, dimensions preview, page context, traffic tier, target audience, number of active campaigns assigned; create/edit forms for defining new slots as pages get built; toggle active/inactive
Campaigns list (/admin/ad-space/campaigns/page.tsx) -- filterable list with status tabs (Draft, Scheduled, Active, Paused, Completed, Cancelled); each row shows advertiser, package tier, date range, creative count, slot count, impressions, clicks, CTR; search by advertiser name or campaign name
Campaign detail (/admin/ad-space/campaigns/[id]/page.tsx) -- full management view:
Header with campaign name, status badge, advertiser link, package info, date range
Status controls with confirmation dialogs (Activate, Pause, Complete, Cancel)
Creatives section: upload images with drag-and-drop (using the existing ImageUpload component pattern), preview at actual slot dimensions, toggle individual creatives on/off, delete; validates uploaded file dimensions against the slot type requirements
Slot assignments section: checkboxes to assign/unassign compatible slots based on the package tier and target audience
Billing section: total price display, payment status selector, invoice reference text field, paid-at date picker
Performance section: impressions, clicks, CTR over the campaign lifetime; breakdown by slot and by individual creative
Analytics page (/admin/ad-space/analytics/page.tsx) -- aggregate performance across all campaigns with date range picker; charts for impressions over time, clicks over time, CTR trend; tables for top-performing slots (by impressions and CTR), top-performing campaigns, slot fill rate percentage, revenue summary by month
Phase 6 -- BUILDREF Update

Add a new section to BUILDREF.md: "Advertising System" covering:
System overview and design philosophy (admin-managed, no self-service)
Database tables and relationships (advertisers, packages, slots, campaigns, creatives, campaign_slots, plus the pre-existing impressions/clicks/consent tables)
New enum values (package tiers, slot types, campaign statuses, payment statuses, traffic tiers, target audiences, duration options)
Slot type dimension reference table
Page context reference with public/authenticated and traffic tier
Target audience targeting rules (all, installer, employer)
Ad rotation behavior (timer-based rotation, impression tracking per rotation)
Click tracking flow (redirect endpoint pattern)
Session token management (24-hour anonymous cookie)
CCPA compliance rules (opt-out respected, no PII in tracking tables)
Storage bucket details for ad-creatives
API route inventory for all advertising endpoints
AdSlot component contract (props, behavior, empty state handling)
Admin UI page inventory under /admin/ad-space
Update the Feature Status Map section:
Move "First-party ad system" and "Ad consent tracking" from "Not Started" to the appropriate status
Add all Phase 1-5 deliverables to the "Schema + RPC Layer Complete" or "Built and Functional" tables as appropriate
Update the Database Schema Quick Reference with all new tables
Update the Storage Buckets table with the ad-creatives bucket
Update the Route Inventory with all new API routes
Update the Enum Values list with new ad system enums
Summary

This six-phase approach builds the advertising engine from the ground up in logical layers: data first (Phase 1), then server-side logic (Phase 2), then API surface (Phase 3), then client-side building blocks (Phase 4), then the admin interface (Phase 5), and finally documentation (Phase 6). Each phase is independently testable -- you can verify the schema before writing helpers, verify helpers before wiring routes, and so on.

The key design decisions carried forward from your answers:

Manual/invoice-based billing (no Stripe yet -- admin marks campaigns as paid)
GIF-only animation support (no video, keeping pages fast)
Target audience field on both packages and slots ("all", "installer", "employer") so advertisers can run campaigns aimed at one side of the marketplace or both
Admin stays heavily involved -- there is no self-service advertiser portal; every campaign, creative upload, and slot assignment goes through admin
The AdSlot component is the single drop-in that handles fetching, rotation, impressions, and clicks -- ready to place on any page as each page gets built out