import { z } from "zod";

const adSlotTypeEnum = z.enum(["leaderboard", "banner", "sidebar", "inline", "sticky_footer"]);
const adPageContextEnum = z.enum(["home", "jobs", "forum", "network", "marketplace", "blog", "shop", "dashboard"]);
const adTargetAudienceEnum = z.enum(["all", "installer", "employer"]);
const adTrafficTierEnum = z.enum(["high", "medium", "low"]);
const adPackageTierEnum = z.enum(["starter", "professional", "premium", "elite"]);
const adCampaignStatusEnum = z.enum(["draft", "scheduled", "active", "paused", "completed", "cancelled"]);
const adPaymentStatusEnum = z.enum(["unpaid", "invoiced", "paid", "refunded"]);

export const createAdvertiserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  contact_email: z.string().email("Valid email is required"),
  contact_phone: z.string().max(30, "Phone too long").optional().nullable(),
  company_url: z.string().url("Must be a valid URL").max(500, "URL too long").optional().nullable().or(z.literal("")),
  notes: z.string().max(2000, "Notes too long").optional().nullable(),
  is_active: z.boolean().optional(),
});

export const updateAdvertiserSchema = z.object({
  id: z.string().uuid("Invalid advertiser ID"),
  name: z.string().min(1, "Name is required").max(200, "Name too long").optional(),
  contact_email: z.string().email("Valid email is required").optional(),
  contact_phone: z.string().max(30, "Phone too long").optional().nullable(),
  company_url: z.string().url("Must be a valid URL").max(500, "URL too long").optional().nullable().or(z.literal("")),
  notes: z.string().max(2000, "Notes too long").optional().nullable(),
  is_active: z.boolean().optional(),
});

export const createPackageSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  tier: adPackageTierEnum.optional(),
  price_cents: z.number().int().min(0, "Price must be non-negative"),
  duration_days: z.number().int().min(1, "Duration must be at least 1 day").optional(),
  max_creatives: z.number().int().min(1, "Must allow at least 1 creative").optional(),
  included_slot_types: z.array(adSlotTypeEnum).optional(),
  included_page_contexts: z.array(adPageContextEnum).optional(),
  target_audience: adTargetAudienceEnum.optional(),
  rotation_interval_seconds: z.number().int().min(1).optional(),
  priority_weight: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const updatePackageSchema = z.object({
  id: z.string().uuid("Invalid package ID"),
  name: z.string().min(1, "Name is required").max(200, "Name too long").optional(),
  tier: adPackageTierEnum.optional(),
  price_cents: z.number().int().min(0, "Price must be non-negative").optional(),
  duration_days: z.number().int().min(1).optional(),
  max_creatives: z.number().int().min(1).optional(),
  included_slot_types: z.array(adSlotTypeEnum).optional(),
  included_page_contexts: z.array(adPageContextEnum).optional(),
  target_audience: adTargetAudienceEnum.optional(),
  rotation_interval_seconds: z.number().int().min(1).optional(),
  priority_weight: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const createSlotSchema = z.object({
  slot_key: z
    .string()
    .min(1, "Slot key is required")
    .max(100, "Slot key too long")
    .regex(/^[a-z0-9_]+$/, "Slot key must be lowercase alphanumeric with underscores"),
  display_name: z.string().min(1, "Display name is required").max(200, "Display name too long"),
  slot_type: adSlotTypeEnum,
  page_context: adPageContextEnum,
  width_px: z.number().int().min(1, "Width must be positive"),
  height_px: z.number().int().min(1, "Height must be positive"),
  max_file_size_kb: z.number().int().min(1).optional(),
  allowed_formats: z.array(z.string()).optional(),
  is_public_page: z.boolean().optional(),
  traffic_tier: adTrafficTierEnum.optional(),
  target_audience: adTargetAudienceEnum.optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const updateSlotSchema = z.object({
  id: z.string().uuid("Invalid slot ID"),
  slot_key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Slot key must be lowercase alphanumeric with underscores")
    .optional(),
  display_name: z.string().min(1).max(200).optional(),
  slot_type: adSlotTypeEnum.optional(),
  page_context: adPageContextEnum.optional(),
  width_px: z.number().int().min(1).optional(),
  height_px: z.number().int().min(1).optional(),
  max_file_size_kb: z.number().int().min(1).optional(),
  allowed_formats: z.array(z.string()).optional(),
  is_public_page: z.boolean().optional(),
  traffic_tier: adTrafficTierEnum.optional(),
  target_audience: adTargetAudienceEnum.optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const createCampaignSchema = z.object({
  advertiser_id: z.string().uuid("Invalid advertiser ID"),
  ad_package_id: z.string().uuid("Invalid package ID"),
  campaign_name: z.string().min(1, "Campaign name is required").max(300, "Name too long"),
  status: adCampaignStatusEnum.optional(),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  admin_notes: z.string().max(5000, "Notes too long").optional().nullable(),
  total_price_cents: z.number().int().min(0).optional(),
  payment_status: adPaymentStatusEnum.optional(),
  invoice_reference: z.string().max(200, "Reference too long").optional().nullable(),
  paid_at: z.string().datetime().optional().nullable(),
});

export const updateCampaignSchema = z.object({
  id: z.string().uuid("Invalid campaign ID"),
  advertiser_id: z.string().uuid("Invalid advertiser ID").optional(),
  ad_package_id: z.string().uuid("Invalid package ID").optional(),
  campaign_name: z.string().min(1).max(300).optional(),
  status: adCampaignStatusEnum.optional(),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  admin_notes: z.string().max(5000).optional().nullable(),
  total_price_cents: z.number().int().min(0).optional(),
  payment_status: adPaymentStatusEnum.optional(),
  invoice_reference: z.string().max(200).optional().nullable(),
  paid_at: z.string().datetime().optional().nullable(),
});

export const createCreativeSchema = z.object({
  campaign_id: z.string().uuid("Invalid campaign ID"),
  label: z.string().max(200, "Label too long").optional(),
  destination_url: z.string().url("Must be a valid URL").max(2000, "URL too long"),
  alt_text: z.string().max(500, "Alt text too long").optional(),
  slot_type: adSlotTypeEnum,
  width_px: z.number().int().min(1),
  height_px: z.number().int().min(1),
});

export const slotAssignmentSchema = z.object({
  campaign_id: z.string().uuid("Invalid campaign ID"),
  ad_slot_id: z.string().uuid("Invalid slot ID"),
});

export const slotRemovalSchema = z.object({
  campaign_id: z.string().uuid("Invalid campaign ID"),
  ad_slot_id: z.string().uuid("Invalid slot ID"),
});

export const analyticsQuerySchema = z.object({
  start_date: z.string().datetime({ message: "Valid start date is required" }),
  end_date: z.string().datetime({ message: "Valid end date is required" }),
  granularity: z.enum(["day", "week", "month"]).optional(),
});

export type CreateAdvertiserData = z.infer<typeof createAdvertiserSchema>;
export type UpdateAdvertiserData = z.infer<typeof updateAdvertiserSchema>;
export type CreatePackageData = z.infer<typeof createPackageSchema>;
export type UpdatePackageData = z.infer<typeof updatePackageSchema>;
export type CreateSlotData = z.infer<typeof createSlotSchema>;
export type UpdateSlotData = z.infer<typeof updateSlotSchema>;
export type CreateCampaignData = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignData = z.infer<typeof updateCampaignSchema>;
export type CreateCreativeData = z.infer<typeof createCreativeSchema>;
export type SlotAssignmentData = z.infer<typeof slotAssignmentSchema>;
export type SlotRemovalData = z.infer<typeof slotRemovalSchema>;
export type AnalyticsQueryData = z.infer<typeof analyticsQuerySchema>;
