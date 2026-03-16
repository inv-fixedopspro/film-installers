"use client";

import {
  Briefcase,
  Search,
  MapPin,
  Bell,
  BookmarkCheck,
  SlidersHorizontal,
  TrendingUp,
  Building2,
} from "lucide-react";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: Search,
    title: "Smart Job Search",
    description: "Filter by service type, location, experience level, and pay range.",
  },
  {
    icon: MapPin,
    title: "Location-Based Listings",
    description: "Find opportunities near you or search any city and state.",
  },
  {
    icon: Building2,
    title: "Employer Profiles",
    description: "See shop size, services offered, and company culture before applying.",
  },
  {
    icon: Bell,
    title: "Job Alerts",
    description: "Get notified when new jobs matching your criteria are posted.",
  },
  {
    icon: BookmarkCheck,
    title: "Saved Jobs",
    description: "Bookmark listings and track your application history in one place.",
  },
  {
    icon: SlidersHorizontal,
    title: "Advanced Filters",
    description: "Narrow results by service type, employment type, and more.",
  },
];

export default function JobsPage() {
  return (
    <div className="max-w-4xl mx-auto py-4">
      <ComingSoonPage
        icon={Briefcase}
        title="Job Board"
        subtitle="Find your next installer opportunity"
        description="Browse open positions from shops across the country, filter by your specialty, and apply directly through the platform. Employers can post listings and search our installer network."
        features={features}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />
    </div>
  );
}
