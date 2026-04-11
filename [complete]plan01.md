Plan: Legal & Compliance Infrastructure — Phased Implementation

Phase 1: Legal Pages, Cookie Consent, and Registration Consent (Foundation — Do First)

This is the minimum viable compliance layer that must exist before real users sign up.

1a. Legal Pages

Create /terms — Terms of Service covering age requirement (18+), US/Canada jurisdiction, acceptable use, content ownership, account termination, disclaimer of liability, and version/effective date
Create /privacy — Privacy Policy covering data collected, how it is used, who it is shared with, US state law (CCPA) and Canadian law (PIPEDA) user rights, data retention, and contact info for data requests
Create /legal/cookies — Cookie Policy covering three categories:
Essential cookies (session management — always on, no consent needed)
Analytics cookies (platform usage analytics — opt-in)
Advertising cookies (for the future first-party ad system — opt-in)
Even though analytics and ads are not built yet, disclosing them now means you never have to re-consent existing users when they go live
Create /legal index page as a hub linking to all three documents
Wire up the existing footer links (currently pointing to #) to these real routes
1b. Cookie Consent Banner

Build a CookieConsentBanner component that appears on first visit for any user who has not yet responded
Banner sits fixed at the bottom of the screen, non-intrusive
Three-category consent with individual toggles: Essential (always on), Analytics (off by default), Advertising (off by default)
"Accept All", "Save Preferences", and "Reject Non-Essential" options
Consent preferences stored in localStorage with a timestamp
A "Manage Cookie Preferences" link added to the footer so users can revisit their choice at any time
Component added to the root layout so it covers all pages
1c. Registration Consent Capture

Add a consent_log table to the database (user ID, terms version, privacy version, cookie preferences, timestamp)
Update the /join registration form with two required checkboxes before the submit button:
"I am 18 years of age or older"
"I agree to the Terms of Service and Privacy Policy" (with inline links)
Both must be checked or form will not submit (enforced client-side and server-side)
On successful registration, write a record to consent_log with current document version numbers
Phase 2: User Data Rights — Settings Page

This replaces the "Coming Soon" placeholder already in the settings page and fulfills legal obligations for data access and deletion.

2a. Database Tables

Add deletion_requests table (user ID, requested at, scheduled delete date 30 days out, status, cancellation timestamp)
Add data_export_requests table (user ID, requested at, completed at, download URL, link expiry timestamp, status)
2b. Download My Data

Build the "Download My Data" UI in settings — a button with a clear explanation of what is included
Create the API route that queues a data_export_requests record on submit
Build the export job that compiles all user data into a structured JSON file: profile info, experience/credentials, messages, job applications, posts, consent history
Send user a notification with a download link valid for 48 hours
Include a status indicator in settings so the user can see if their request is pending, ready, or expired
2c. Account Deletion

Build the "Delete My Account" UI — a button that opens a confirmation modal requiring the user to type "DELETE" before proceeding
On confirm, create a deletion_requests record and soft-flag the account
Log the user out and show a confirmation screen explaining the 30-day grace period
During the grace period, a "Cancel Deletion" option appears prominently in the settings
After 30 days, a scheduled process hard-deletes all personal data (profile, messages, posts) while anonymizing records that must be retained for integrity (job postings history, moderation logs)
2d. Consent History View

Read-only section in settings showing the user a log of their consent events: when they accepted Terms and Privacy, which versions, and any re-consent events
Also shows their current cookie preferences with a link to update them
Phase 3: Resume Privacy Controls

Built alongside the resume feature — no value in building this before resumes exist.

Every resume record gets a visibility field: Public, Members Only, or Private
Employer resume views logged to a resume_views table (employer ID, installer ID, timestamp, page context)
Installer can see a "Who Viewed My Resume" list in their dashboard
Setting a resume to Private immediately removes it from all search and browse indexes
Resume view data included in the user data export (Phase 2)
Resume data wiped as part of account deletion flow (Phase 2)
Phase 4: Direct Messaging Compliance

Built alongside the messaging feature — same rationale as Phase 3.

Individual message delete (removes from sender or recipient view; content purged when both have deleted)
Full conversation delete available to either participant
Block and report controls at the conversation level — flagged messages route into the existing content_flags system
Admin sees only the flagged message snapshot, not full conversation history, to preserve privacy
All message data included in the data export (Phase 2)
Message data wiped as part of account deletion (Phase 2)
Phase 5: Admin Compliance Tooling

Built after Phase 2 exists in the database — gives admins oversight of data rights operations.

Add a "Data Requests" section to the admin panel at /admin/data-requests
Shows a queue of pending deletion requests (with days remaining until hard delete) and pending export requests
Admins can manually fulfill export requests within the 30-day legal deadline if the automated flow fails
Admins can cancel deletion requests if a user contacts support during the grace period
All admin actions on data requests logged to the existing moderation_actions audit table
Dashboard metrics: total pending requests, overdue requests, requests completed this month
Phase 6: First-Party Ad System — Compliance Infrastructure

This phase prepares the legal and tracking groundwork so the ad system launches already compliant. The actual ad system UI and management is a separate product build.

Cookie Policy (written in Phase 1) already discloses advertising cookies — no policy changes needed when ads go live
Add ad_consent_log tracking to ensure ads are only served to users who opted into advertising cookies
Prepare a ad_impressions and ad_clicks schema in the database to support the ad system's analytics from day one (page context, ad package ID, user session ID — no PII attached directly to impression records)
Ad data excluded from personal data exports by default since impression records are anonymized
Build an "Advertising Preferences" section in user settings allowing users to opt out of targeted advertising at any time (separate from cookie consent — this is the CCPA "Do Not Sell or Share My Personal Information" right, even though you are not technically selling data)
Add the opt-out preference to the consent_log schema so it is recorded alongside other consent events
Phase 7: International Expansion Prep

Done when you are ready to expand beyond US and Canada — the earlier phases are structured to make this straightforward.

Audit all consent records and verify GDPR compatibility (the existing checkbox approach and consent_log table already cover the core requirements)
Add a Data Processing Agreement template for employer accounts (B2B legal requirement in the EU)
Upgrade the cookie consent banner to support granular category management if analytics or third-party tools are added
Add country detection to serve region-specific privacy notices
Update Terms and Privacy to add EU/UK jurisdiction language and GDPR-specific rights (right of access, right to erasure, data portability — all already technically implemented by Phases 2 and 3)
Add a dedicated GDPR section to the Privacy Policy
Summary

Phase 1 is the gate — nothing should go live with real users until the legal pages, cookie consent with all three categories disclosed, and registration consent checkboxes are in place. Phase 2 fulfills ongoing legal obligations and can be built immediately after. Phases 3 and 4 are tied to their respective features. Phase 5 is a quick admin layer that gives you operational control. Phase 6 makes sure your ad system is compliance-ready on launch day without requiring retroactive re-consent from existing users (the key reason to disclose advertising cookies in Phase 1 even before ads exist). Phase 7 is a future milestone.