export type ServiceType = "automotive_tint" | "architectural_glass" | "ppf" | "vinyl_wrap";
export type ExperienceYears = "less_than_1" | "1_to_3" | "3_to_5" | "5_to_10" | "10_plus";
export type EmployeeCount = "1_to_5" | "5_to_10" | "10_to_20" | "25_plus";
export type UserRole = "admin" | "user";
export type ProfileType = "installer" | "employer" | "team";
export type ExperienceLevel = "new_to_industry" | "experienced";
export type AccountStatus = "active" | "warned" | "restricted" | "banned" | "pending_review";
export type ContentVisibility = "visible" | "auto_hidden" | "admin_hidden" | "restored";
export type FlagContentType = "installer_profile" | "employer_profile" | "user_account" | "resume";
export type TeamMemberRole = "owner" | "member";
export type TeamInvitationStatus = "pending" | "accepted" | "expired" | "revoked";
export type ResumeTemplate = "standard" | "modern" | "minimal";
export type ResumeAccentColor = "charcoal" | "navy" | "forest";

export interface ResumeWorkHistory {
  id: string;
  company_name: string;
  job_title: string;
  city: string;
  state: string;
  start_month: string;
  start_year: string;
  end_month: string | null;
  end_year: string | null;
  is_current: boolean;
  is_self_employed: boolean;
  description: string;
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuing_org: string;
  issue_year: string;
  expiry_year: string | null;
  no_expiry: boolean;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  graduation_year: string | null;
  in_progress: boolean;
}

export type FlagCategory =
  | "spam"
  | "fake_profile"
  | "inappropriate_content"
  | "harassment"
  | "misleading_information"
  | "other";
export type FlagReviewStatus =
  | "pending"
  | "under_review"
  | "resolved_actioned"
  | "resolved_dismissed"
  | "resolved_duplicate";
export type FlagReviewPriority = "low" | "normal" | "high" | "critical";
export type ModerationActionType =
  | "warning"
  | "hide"
  | "restore"
  | "restrict"
  | "unrestrict"
  | "ban"
  | "unban"
  | "flag_upheld"
  | "flag_dismissed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          email_verified_at: string | null;
          onboarding_completed: boolean;
          active_profile_type: ProfileType | null;
          account_status: AccountStatus;
          content_visibility: ContentVisibility;
          unresolved_flag_count: number;
          auto_hidden_at: string | null;
          team_member_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          email_verified_at?: string | null;
          onboarding_completed?: boolean;
          active_profile_type?: ProfileType | null;
          account_status?: AccountStatus;
          content_visibility?: ContentVisibility;
          unresolved_flag_count?: number;
          auto_hidden_at?: string | null;
          team_member_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          email_verified_at?: string | null;
          onboarding_completed?: boolean;
          active_profile_type?: ProfileType | null;
          account_status?: AccountStatus;
          content_visibility?: ContentVisibility;
          unresolved_flag_count?: number;
          auto_hidden_at?: string | null;
          team_member_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      installer_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          city: string;
          state: string;
          is_actively_interviewing: boolean;
          experience_level: ExperienceLevel;
          photo_storage_path: string | null;
          resume_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          city: string;
          state: string;
          is_actively_interviewing?: boolean;
          experience_level?: ExperienceLevel;
          photo_storage_path?: string | null;
          resume_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          city?: string;
          state?: string;
          is_actively_interviewing?: boolean;
          experience_level?: ExperienceLevel;
          photo_storage_path?: string | null;
          resume_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      installer_resumes: {
        Row: {
          id: string;
          user_id: string;
          installer_profile_id: string;
          selected_template: ResumeTemplate;
          accent_color: ResumeAccentColor;
          headline: string;
          summary: string;
          skills: string[];
          work_history: ResumeWorkHistory[];
          certifications: ResumeCertification[];
          education: ResumeEducation[];
          content_visibility: ContentVisibility;
          unresolved_flag_count: number;
          auto_hidden_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          installer_profile_id: string;
          selected_template?: ResumeTemplate;
          accent_color?: ResumeAccentColor;
          headline?: string;
          summary?: string;
          skills?: string[];
          work_history?: ResumeWorkHistory[];
          certifications?: ResumeCertification[];
          education?: ResumeEducation[];
          content_visibility?: ContentVisibility;
          unresolved_flag_count?: number;
          auto_hidden_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          installer_profile_id?: string;
          selected_template?: ResumeTemplate;
          accent_color?: ResumeAccentColor;
          headline?: string;
          summary?: string;
          skills?: string[];
          work_history?: ResumeWorkHistory[];
          certifications?: ResumeCertification[];
          education?: ResumeEducation[];
          content_visibility?: ContentVisibility;
          unresolved_flag_count?: number;
          auto_hidden_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      resume_views: {
        Row: {
          id: string;
          resume_id: string;
          viewer_user_id: string | null;
          viewer_ip_hash: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          viewer_user_id?: string | null;
          viewer_ip_hash?: string | null;
          viewed_at?: string;
        };
        Update: never;
      };
      installer_experience: {
        Row: {
          id: string;
          installer_profile_id: string;
          service_type: ServiceType;
          years_experience: ExperienceYears;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          installer_profile_id: string;
          service_type: ServiceType;
          years_experience: ExperienceYears;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          installer_profile_id?: string;
          service_type?: ServiceType;
          years_experience?: ExperienceYears;
          created_at?: string;
          updated_at?: string;
        };
      };
      employer_profiles: {
        Row: {
          id: string;
          user_id: string;
          contact_first_name: string;
          contact_last_name: string;
          contact_phone: string;
          company_name: string;
          company_email: string;
          company_phone: string;
          hq_city: string;
          hq_state: string;
          employee_count: EmployeeCount;
          location_count: string | null;
          is_actively_hiring: boolean;
          company_slug: string | null;
          company_description: string | null;
          website_url: string | null;
          logo_storage_path: string | null;
          banner_storage_path: string | null;
          social_links: Record<string, string> | null;
          is_vendor: boolean;
          is_distributor: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_first_name: string;
          contact_last_name: string;
          contact_phone: string;
          company_name: string;
          company_email: string;
          company_phone: string;
          hq_city: string;
          hq_state: string;
          employee_count: EmployeeCount;
          location_count?: string | null;
          is_actively_hiring?: boolean;
          company_slug?: string | null;
          company_description?: string | null;
          website_url?: string | null;
          logo_storage_path?: string | null;
          banner_storage_path?: string | null;
          social_links?: Record<string, string> | null;
          is_vendor?: boolean;
          is_distributor?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contact_first_name?: string;
          contact_last_name?: string;
          contact_phone?: string;
          company_name?: string;
          company_email?: string;
          company_phone?: string;
          hq_city?: string;
          hq_state?: string;
          employee_count?: EmployeeCount;
          location_count?: string | null;
          is_actively_hiring?: boolean;
          company_slug?: string | null;
          company_description?: string | null;
          website_url?: string | null;
          logo_storage_path?: string | null;
          banner_storage_path?: string | null;
          social_links?: Record<string, string> | null;
          is_vendor?: boolean;
          is_distributor?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      employer_services: {
        Row: {
          id: string;
          employer_profile_id: string;
          service_type: ServiceType;
          created_at: string;
        };
        Insert: {
          id?: string;
          employer_profile_id: string;
          service_type: ServiceType;
          created_at?: string;
        };
        Update: {
          id?: string;
          employer_profile_id?: string;
          service_type?: ServiceType;
          created_at?: string;
        };
      };
      email_verifications: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          expires_at: string;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          expires_at?: string;
          verified_at?: string | null;
          created_at?: string;
        };
      };
      company_locations: {
        Row: {
          id: string;
          employer_profile_id: string;
          name: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          zip_code: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_profile_id: string;
          name?: string;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string;
          zip_code?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employer_profile_id?: string;
          name?: string;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string;
          zip_code?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      company_team_members: {
        Row: {
          id: string;
          employer_profile_id: string;
          user_id: string;
          role: TeamMemberRole;
          is_active: boolean;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_profile_id: string;
          user_id: string;
          role?: TeamMemberRole;
          is_active?: boolean;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employer_profile_id?: string;
          user_id?: string;
          role?: TeamMemberRole;
          is_active?: boolean;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      company_team_invitations: {
        Row: {
          id: string;
          employer_profile_id: string;
          invited_by: string;
          email: string;
          token: string;
          status: TeamInvitationStatus;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employer_profile_id: string;
          invited_by: string;
          email: string;
          token: string;
          status?: TeamInvitationStatus;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employer_profile_id?: string;
          invited_by?: string;
          email?: string;
          token?: string;
          status?: TeamInvitationStatus;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          invited_by: string | null;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: UserRole;
          invited_by?: string | null;
          token: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          invited_by?: string | null;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      content_flags: {
        Row: {
          id: string;
          flagger_user_id: string;
          flagged_user_id: string;
          content_type: FlagContentType;
          content_id: string;
          flag_category: FlagCategory;
          flag_reason_detail: string | null;
          content_snapshot: Record<string, unknown> | null;
          content_url: string | null;
          metadata: Record<string, unknown> | null;
          is_duplicate: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          flagger_user_id: string;
          flagged_user_id: string;
          content_type: FlagContentType;
          content_id: string;
          flag_category: FlagCategory;
          flag_reason_detail?: string | null;
          content_snapshot?: Record<string, unknown> | null;
          content_url?: string | null;
          metadata?: Record<string, unknown> | null;
          is_duplicate?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          flagger_user_id?: string;
          flagged_user_id?: string;
          content_type?: FlagContentType;
          content_id?: string;
          flag_category?: FlagCategory;
          flag_reason_detail?: string | null;
          content_snapshot?: Record<string, unknown> | null;
          content_url?: string | null;
          metadata?: Record<string, unknown> | null;
          is_duplicate?: boolean;
          created_at?: string;
        };
      };
      flag_reviews: {
        Row: {
          id: string;
          flag_id: string;
          status: FlagReviewStatus;
          assigned_to: string | null;
          priority: FlagReviewPriority;
          reviewer_id: string | null;
          reviewer_notes: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          flag_id: string;
          status?: FlagReviewStatus;
          assigned_to?: string | null;
          priority?: FlagReviewPriority;
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          flag_id?: string;
          status?: FlagReviewStatus;
          assigned_to?: string | null;
          priority?: FlagReviewPriority;
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      moderation_actions: {
        Row: {
          id: string;
          flag_id: string | null;
          target_user_id: string;
          admin_user_id: string;
          action_type: ModerationActionType;
          content_type: FlagContentType | null;
          content_id: string | null;
          reason: string;
          notes: string | null;
          expires_at: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          flag_id?: string | null;
          target_user_id: string;
          admin_user_id: string;
          action_type: ModerationActionType;
          content_type?: FlagContentType | null;
          content_id?: string | null;
          reason: string;
          notes?: string | null;
          expires_at?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: never;
      };
      moderation_config: {
        Row: {
          key: string;
          value: string;
          description: string;
        };
        Insert: {
          key: string;
          value: string;
          description?: string;
        };
        Update: {
          key?: string;
          value?: string;
          description?: string;
        };
      };
      consent_log: {
        Row: {
          id: string;
          user_id: string;
          terms_version: string;
          privacy_version: string;
          age_confirmed: boolean;
          cookie_essential: boolean;
          cookie_analytics: boolean;
          cookie_advertising: boolean;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          terms_version?: string;
          privacy_version?: string;
          age_confirmed?: boolean;
          cookie_essential?: boolean;
          cookie_analytics?: boolean;
          cookie_advertising?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      deletion_requests: {
        Row: {
          id: string;
          user_id: string;
          requested_at: string;
          scheduled_delete_at: string;
          status: string;
          cancelled_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          requested_at?: string;
          scheduled_delete_at?: string;
          status?: string;
          cancelled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          requested_at?: string;
          scheduled_delete_at?: string;
          status?: string;
          cancelled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      data_export_requests: {
        Row: {
          id: string;
          user_id: string;
          requested_at: string;
          status: string;
          download_url: string | null;
          download_expires_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          requested_at?: string;
          status?: string;
          download_url?: string | null;
          download_expires_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          requested_at?: string;
          status?: string;
          download_url?: string | null;
          download_expires_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      dpa_requests: {
        Row: {
          id: string;
          user_id: string;
          employer_profile_id: string | null;
          accepted_at: string;
          dpa_version: string;
          ip_address: string | null;
          user_agent: string | null;
          company_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employer_profile_id?: string | null;
          accepted_at?: string;
          dpa_version: string;
          ip_address?: string | null;
          user_agent?: string | null;
          company_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employer_profile_id?: string | null;
          accepted_at?: string;
          dpa_version?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          company_name?: string;
          created_at?: string;
        };
      };
    };
    Enums: {
      service_type: ServiceType;
      experience_years: ExperienceYears;
      employee_count: EmployeeCount;
      user_role: UserRole;
      profile_type: ProfileType;
      experience_level: ExperienceLevel;
      resume_template: ResumeTemplate;
      resume_accent_color: ResumeAccentColor;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type InstallerProfile = Database["public"]["Tables"]["installer_profiles"]["Row"];
export type InstallerExperience = Database["public"]["Tables"]["installer_experience"]["Row"];
export type InstallerResume = Database["public"]["Tables"]["installer_resumes"]["Row"];
export type ResumeView = Database["public"]["Tables"]["resume_views"]["Row"];
export type EmployerProfile = Database["public"]["Tables"]["employer_profiles"]["Row"];
export type EmployerService = Database["public"]["Tables"]["employer_services"]["Row"];
export type EmailVerification = Database["public"]["Tables"]["email_verifications"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type ContentFlag = Database["public"]["Tables"]["content_flags"]["Row"];
export type FlagReview = Database["public"]["Tables"]["flag_reviews"]["Row"];
export type ModerationAction = Database["public"]["Tables"]["moderation_actions"]["Row"];
export type ModerationConfig = Database["public"]["Tables"]["moderation_config"]["Row"];
export type CompanyLocation = Database["public"]["Tables"]["company_locations"]["Row"];
export type CompanyTeamMember = Database["public"]["Tables"]["company_team_members"]["Row"];
export type CompanyTeamInvitation = Database["public"]["Tables"]["company_team_invitations"]["Row"];
export type ConsentLog = Database["public"]["Tables"]["consent_log"]["Row"];
export type DeletionRequest = Database["public"]["Tables"]["deletion_requests"]["Row"];
export type DataExportRequest = Database["public"]["Tables"]["data_export_requests"]["Row"];
export type DpaRequest = Database["public"]["Tables"]["dpa_requests"]["Row"];

export interface InstallerProfileWithExperience extends InstallerProfile {
  installer_experience: InstallerExperience[];
  resume?: InstallerResume | null;
}

export interface EmployerProfileWithServices extends EmployerProfile {
  employer_services: EmployerService[];
}

export interface EmployerProfileFull extends EmployerProfileWithServices {
  locations: CompanyLocation[];
  team_members: CompanyTeamMember[];
}

export interface CompanyTeamMemberWithProfile extends CompanyTeamMember {
  profile?: Profile | null;
}

export interface TeamProfile {
  teamMember: CompanyTeamMember;
  employerProfile: EmployerProfileWithServices;
}

export interface UserWithProfiles extends Profile {
  installer_profile?: InstallerProfileWithExperience | null;
  employer_profile?: EmployerProfileWithServices | null;
}
