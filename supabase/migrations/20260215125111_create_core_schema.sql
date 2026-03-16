/*
  # Film Installers Network - Core Database Schema

  1. Overview
    - Creates the foundation for user authentication and profile management
    - Supports one user having both Installer and Employer profiles
    - Includes invitation system for admin-created accounts

  2. Enums Created
    - `service_type`: Automotive Window Tint, Architectural/Flat Glass, PPF/Vinyl Wrap
    - `experience_years`: <1, 1-3, 3-5, 5-10, 10+
    - `employee_count`: 1-5, 5-10, 10-20, 25+
    - `user_role`: admin, user
    - `profile_type`: installer, employer

  3. Tables Created
    - `profiles`: Extends auth.users with app-specific data
    - `installer_profiles`: Installer professional information
    - `installer_experience`: Experience details per service type
    - `employer_profiles`: Company and contact information
    - `employer_services`: Services offered by employers
    - `email_verifications`: Email verification tokens
    - `invitations`: Admin invitation system

  4. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - Admins have elevated access for invitations
*/

-- Create enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
    CREATE TYPE service_type AS ENUM (
      'automotive_tint',
      'architectural_glass',
      'ppf',
      'vinyl_wrap'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_years') THEN
    CREATE TYPE experience_years AS ENUM (
      'less_than_1',
      '1_to_3',
      '3_to_5',
      '5_to_10',
      '10_plus'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_count') THEN
    CREATE TYPE employee_count AS ENUM (
      '1_to_5',
      '5_to_10',
      '10_to_20',
      '25_plus'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_type') THEN
    CREATE TYPE profile_type AS ENUM ('installer', 'employer');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level') THEN
    CREATE TYPE experience_level AS ENUM ('new_to_industry', 'experienced');
  END IF;
END $$;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  email_verified_at timestamptz,
  onboarding_completed boolean NOT NULL DEFAULT false,
  active_profile_type profile_type,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Installer profiles table
CREATE TABLE IF NOT EXISTS installer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  is_actively_interviewing boolean NOT NULL DEFAULT false,
  experience_level experience_level NOT NULL DEFAULT 'new_to_industry',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installer_profiles_user_id_unique UNIQUE (user_id)
);

-- Installer experience junction table
CREATE TABLE IF NOT EXISTS installer_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_profile_id uuid NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  years_experience experience_years NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installer_experience_unique UNIQUE (installer_profile_id, service_type)
);

-- Employer profiles table
CREATE TABLE IF NOT EXISTS employer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_first_name text NOT NULL,
  contact_last_name text NOT NULL,
  contact_phone text NOT NULL,
  company_name text NOT NULL,
  company_email text NOT NULL,
  company_phone text NOT NULL,
  hq_city text NOT NULL,
  hq_state text NOT NULL,
  employee_count employee_count NOT NULL,
  location_count text NOT NULL,
  is_actively_hiring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employer_profiles_user_id_unique UNIQUE (user_id)
);

-- Employer services junction table
CREATE TABLE IF NOT EXISTS employer_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_profile_id uuid NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employer_services_unique UNIQUE (employer_profile_id, service_type)
);

-- Email verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_installer_profiles_user_id ON installer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_installer_profiles_state ON installer_profiles(state);
CREATE INDEX IF NOT EXISTS idx_installer_profiles_actively_interviewing ON installer_profiles(is_actively_interviewing);
CREATE INDEX IF NOT EXISTS idx_installer_experience_profile_id ON installer_experience(installer_profile_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON employer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_state ON employer_profiles(hq_state);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_actively_hiring ON employer_profiles(is_actively_hiring);
CREATE INDEX IF NOT EXISTS idx_employer_services_profile_id ON employer_services(employer_profile_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE installer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE installer_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Installer profiles policies
CREATE POLICY "Users can view own installer profile"
  ON installer_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own installer profile"
  ON installer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own installer profile"
  ON installer_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own installer profile"
  ON installer_profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Installer experience policies
CREATE POLICY "Users can view own installer experience"
  ON installer_experience FOR SELECT
  TO authenticated
  USING (
    installer_profile_id IN (
      SELECT id FROM installer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own installer experience"
  ON installer_experience FOR INSERT
  TO authenticated
  WITH CHECK (
    installer_profile_id IN (
      SELECT id FROM installer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own installer experience"
  ON installer_experience FOR UPDATE
  TO authenticated
  USING (
    installer_profile_id IN (
      SELECT id FROM installer_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    installer_profile_id IN (
      SELECT id FROM installer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own installer experience"
  ON installer_experience FOR DELETE
  TO authenticated
  USING (
    installer_profile_id IN (
      SELECT id FROM installer_profiles WHERE user_id = auth.uid()
    )
  );

-- Employer profiles policies
CREATE POLICY "Users can view own employer profile"
  ON employer_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own employer profile"
  ON employer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own employer profile"
  ON employer_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own employer profile"
  ON employer_profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Employer services policies
CREATE POLICY "Users can view own employer services"
  ON employer_services FOR SELECT
  TO authenticated
  USING (
    employer_profile_id IN (
      SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own employer services"
  ON employer_services FOR INSERT
  TO authenticated
  WITH CHECK (
    employer_profile_id IN (
      SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own employer services"
  ON employer_services FOR UPDATE
  TO authenticated
  USING (
    employer_profile_id IN (
      SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    employer_profile_id IN (
      SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own employer services"
  ON employer_services FOR DELETE
  TO authenticated
  USING (
    employer_profile_id IN (
      SELECT id FROM employer_profiles WHERE user_id = auth.uid()
    )
  );

-- Email verifications policies
CREATE POLICY "Users can view own email verifications"
  ON email_verifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own email verifications"
  ON email_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email verifications"
  ON email_verifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Invitations policies (admins can manage, users can view their own accepted invitations)
CREATE POLICY "Admins can view all invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_installer_profiles_updated_at ON installer_profiles;
CREATE TRIGGER update_installer_profiles_updated_at
  BEFORE UPDATE ON installer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_installer_experience_updated_at ON installer_experience;
CREATE TRIGGER update_installer_experience_updated_at
  BEFORE UPDATE ON installer_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employer_profiles_updated_at ON employer_profiles;
CREATE TRIGGER update_employer_profiles_updated_at
  BEFORE UPDATE ON employer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();