/*
  # Advertising System -- Core Tables

  ## Purpose
  Creates the full data layer for the first-party advertising system.
  This is an admin-managed, invoice-based ad platform with no self-service.
  All campaign management, creative uploads, and slot assignments go through admin.

  ## New Tables

  ### 1. advertisers
  Companies or individuals purchasing ad space on the platform.
  - `id` (uuid, PK)
  - `name` (text, required) -- company or advertiser name
  - `contact_email` (text, required)
  - `contact_phone` (text, nullable)
  - `company_url` (text, nullable)
  - `notes` (text, nullable) -- internal admin notes
  - `is_active` (boolean, default true)
  - `created_at`, `updated_at` (timestamptz)

  ### 2. ad_packages
  Purchasable tiers defining what an advertiser gets.
  - `id` (uuid, PK)
  - `name` (text, required) -- human-readable package name
  - `tier` (text, check constraint) -- starter | professional | premium | elite
  - `price_cents` (integer) -- price in cents for invoice-based billing
  - `duration_days` (integer) -- campaign length: 7, 14, 30, or 90
  - `max_creatives` (integer) -- max number of creative assets per campaign
  - `included_slot_types` (jsonb) -- array of slot types included in this package
  - `included_page_contexts` (jsonb) -- array of page contexts this package covers
  - `target_audience` (text, check constraint) -- all | installer | employer
  - `rotation_interval_seconds` (integer, default 4) -- how fast ads rotate in a slot
  - `priority_weight` (integer, default 1) -- higher = more rotation priority
  - `is_active` (boolean, default true)
  - `created_at`, `updated_at` (timestamptz)

  ### 3. ad_slots
  Every physical ad placement on the platform.
  - `id` (uuid, PK)
  - `slot_key` (text, unique) -- machine-readable identifier like "home_banner_top"
  - `display_name` (text) -- human-readable name
  - `slot_type` (text, check constraint) -- leaderboard | banner | sidebar | inline | sticky_footer
  - `page_context` (text, check constraint) -- home | jobs | forum | network | marketplace | blog | shop | dashboard
  - `width_px` (integer) -- standard width in pixels
  - `height_px` (integer) -- standard height in pixels
  - `max_file_size_kb` (integer, default 2048) -- 2MB
  - `allowed_formats` (text[], default JPEG/PNG/WebP/GIF)
  - `is_public_page` (boolean, default false) -- whether this slot is on a public (unauthenticated) page
  - `traffic_tier` (text, check constraint) -- high | medium | low
  - `target_audience` (text, check constraint) -- all | installer | employer
  - `is_active` (boolean, default true)
  - `sort_order` (integer, default 0) -- display ordering
  - `created_at`, `updated_at` (timestamptz)

  ### 4. ad_campaigns
  Each sold advertising engagement.
  - `id` (uuid, PK)
  - `advertiser_id` (uuid, FK -> advertisers)
  - `ad_package_id` (uuid, FK -> ad_packages)
  - `campaign_name` (text)
  - `status` (text, check constraint) -- draft | scheduled | active | paused | completed | cancelled
  - `starts_at` (timestamptz, nullable)
  - `ends_at` (timestamptz, nullable)
  - `admin_notes` (text, nullable)
  - `total_price_cents` (integer, default 0)
  - `payment_status` (text, check constraint) -- unpaid | invoiced | paid | refunded
  - `invoice_reference` (text, nullable)
  - `paid_at` (timestamptz, nullable)
  - `created_by` (uuid, FK -> profiles) -- admin who created it
  - `created_at`, `updated_at` (timestamptz)

  ### 5. ad_creatives
  The actual image files for campaigns.
  - `id` (uuid, PK)
  - `campaign_id` (uuid, FK -> ad_campaigns)
  - `label` (text) -- admin-friendly label
  - `image_storage_path` (text) -- path in ad-creatives storage bucket
  - `destination_url` (text) -- click-through URL
  - `alt_text` (text, default '') -- accessibility alt text
  - `slot_type` (text, check constraint) -- must match a slot type
  - `width_px` (integer)
  - `height_px` (integer)
  - `file_size_bytes` (integer, default 0)
  - `is_active` (boolean, default true)
  - `created_at`, `updated_at` (timestamptz)

  ### 6. ad_campaign_slots
  Junction table linking campaigns to slots.
  - `id` (uuid, PK)
  - `campaign_id` (uuid, FK -> ad_campaigns)
  - `ad_slot_id` (uuid, FK -> ad_slots)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)
  - Unique constraint on (campaign_id, ad_slot_id)

  ## Modified Tables

  ### ad_impressions
  - Adds `ad_campaign_id` (uuid, nullable) -- links impression to specific campaign
  - Adds `ad_creative_id` (uuid, nullable) -- links impression to specific creative

  ### ad_clicks
  - Adds `ad_campaign_id` (uuid, nullable) -- links click to specific campaign
  - Adds `ad_creative_id` (uuid, nullable) -- links click to specific creative

  ## Security
  - RLS enabled on all 6 new tables
  - All new tables are admin-only (service role access); no authenticated user policies
  - Existing ad_impressions and ad_clicks remain service-role-only

  ## Indexes
  - ad_campaigns: status, starts_at, ends_at, advertiser_id
  - ad_creatives: campaign_id + is_active composite
  - ad_campaign_slots: ad_slot_id + campaign_id composite
  - ad_impressions: ad_campaign_id, ad_creative_id
  - ad_clicks: ad_campaign_id, ad_creative_id
*/

-- ────────────────────────────────────────────────────────────
-- 1. advertisers
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advertisers (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  contact_email  text        NOT NULL,
  contact_phone  text,
  company_url    text,
  notes          text,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 2. ad_packages
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_packages (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      text        NOT NULL,
  tier                      text        NOT NULL DEFAULT 'starter'
                                        CHECK (tier IN ('starter', 'professional', 'premium', 'elite')),
  price_cents               integer     NOT NULL DEFAULT 0,
  duration_days             integer     NOT NULL DEFAULT 30
                                        CHECK (duration_days > 0),
  max_creatives             integer     NOT NULL DEFAULT 1
                                        CHECK (max_creatives > 0),
  included_slot_types       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  included_page_contexts    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  target_audience           text        NOT NULL DEFAULT 'all'
                                        CHECK (target_audience IN ('all', 'installer', 'employer')),
  rotation_interval_seconds integer     NOT NULL DEFAULT 4
                                        CHECK (rotation_interval_seconds > 0),
  priority_weight           integer     NOT NULL DEFAULT 1
                                        CHECK (priority_weight > 0),
  is_active                 boolean     NOT NULL DEFAULT true,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_packages ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 3. ad_slots
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_slots (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key        text        NOT NULL UNIQUE,
  display_name    text        NOT NULL,
  slot_type       text        NOT NULL
                              CHECK (slot_type IN ('leaderboard', 'banner', 'sidebar', 'inline', 'sticky_footer')),
  page_context    text        NOT NULL
                              CHECK (page_context IN ('home', 'jobs', 'forum', 'network', 'marketplace', 'blog', 'shop', 'dashboard')),
  width_px        integer     NOT NULL,
  height_px       integer     NOT NULL,
  max_file_size_kb integer    NOT NULL DEFAULT 2048,
  allowed_formats text[]      NOT NULL DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  is_public_page  boolean     NOT NULL DEFAULT false,
  traffic_tier    text        NOT NULL DEFAULT 'medium'
                              CHECK (traffic_tier IN ('high', 'medium', 'low')),
  target_audience text        NOT NULL DEFAULT 'all'
                              CHECK (target_audience IN ('all', 'installer', 'employer')),
  is_active       boolean     NOT NULL DEFAULT true,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 4. ad_campaigns
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id     uuid        NOT NULL REFERENCES advertisers(id),
  ad_package_id     uuid        NOT NULL REFERENCES ad_packages(id),
  campaign_name     text        NOT NULL,
  status            text        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  starts_at         timestamptz,
  ends_at           timestamptz,
  admin_notes       text,
  total_price_cents integer     NOT NULL DEFAULT 0,
  payment_status    text        NOT NULL DEFAULT 'unpaid'
                                CHECK (payment_status IN ('unpaid', 'invoiced', 'paid', 'refunded')),
  invoice_reference text,
  paid_at           timestamptz,
  created_by        uuid        NOT NULL REFERENCES profiles(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 5. ad_creatives
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_creatives (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id        uuid        NOT NULL REFERENCES ad_campaigns(id),
  label              text        NOT NULL DEFAULT '',
  image_storage_path text        NOT NULL,
  destination_url    text        NOT NULL,
  alt_text           text        NOT NULL DEFAULT '',
  slot_type          text        NOT NULL
                                 CHECK (slot_type IN ('leaderboard', 'banner', 'sidebar', 'inline', 'sticky_footer')),
  width_px           integer     NOT NULL,
  height_px          integer     NOT NULL,
  file_size_bytes    integer     NOT NULL DEFAULT 0,
  is_active          boolean     NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 6. ad_campaign_slots
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_campaign_slots (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid        NOT NULL REFERENCES ad_campaigns(id),
  ad_slot_id  uuid        NOT NULL REFERENCES ad_slots(id),
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, ad_slot_id)
);

ALTER TABLE ad_campaign_slots ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 7. Add campaign/creative tracking columns to ad_impressions
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_impressions' AND column_name = 'ad_campaign_id'
  ) THEN
    ALTER TABLE ad_impressions ADD COLUMN ad_campaign_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_impressions' AND column_name = 'ad_creative_id'
  ) THEN
    ALTER TABLE ad_impressions ADD COLUMN ad_creative_id uuid;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 8. Add campaign/creative tracking columns to ad_clicks
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_clicks' AND column_name = 'ad_campaign_id'
  ) THEN
    ALTER TABLE ad_clicks ADD COLUMN ad_campaign_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_clicks' AND column_name = 'ad_creative_id'
  ) THEN
    ALTER TABLE ad_clicks ADD COLUMN ad_creative_id uuid;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 9. Indexes for ad_campaigns
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_starts_at ON ad_campaigns(starts_at);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_ends_at ON ad_campaigns(ends_at);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);

-- ────────────────────────────────────────────────────────────
-- 10. Indexes for ad_creatives
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_creatives_campaign_active ON ad_creatives(campaign_id, is_active);

-- ────────────────────────────────────────────────────────────
-- 11. Indexes for ad_campaign_slots
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_campaign_slots_slot ON ad_campaign_slots(ad_slot_id, campaign_id);

-- ────────────────────────────────────────────────────────────
-- 12. Indexes for ad_impressions new columns
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign ON ad_impressions(ad_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_creative ON ad_impressions(ad_creative_id);

-- ────────────────────────────────────────────────────────────
-- 13. Indexes for ad_clicks new columns
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign ON ad_clicks(ad_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_creative ON ad_clicks(ad_creative_id);

-- ────────────────────────────────────────────────────────────
-- 14. updated_at triggers for new tables
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_advertisers'
  ) THEN
    CREATE TRIGGER set_updated_at_advertisers
      BEFORE UPDATE ON advertisers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_ad_packages'
  ) THEN
    CREATE TRIGGER set_updated_at_ad_packages
      BEFORE UPDATE ON ad_packages
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_ad_slots'
  ) THEN
    CREATE TRIGGER set_updated_at_ad_slots
      BEFORE UPDATE ON ad_slots
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_ad_campaigns'
  ) THEN
    CREATE TRIGGER set_updated_at_ad_campaigns
      BEFORE UPDATE ON ad_campaigns
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_ad_creatives'
  ) THEN
    CREATE TRIGGER set_updated_at_ad_creatives
      BEFORE UPDATE ON ad_creatives
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
