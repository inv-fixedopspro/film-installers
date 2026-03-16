"use client";

import {
  Network,
  UserPlus,
  Users,
  Search,
  MessageCircle,
  BadgeCheck,
  MapPin,
  Handshake,
} from "lucide-react";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: Search,
    title: "Installer Directory",
    description: "Search verified installers by service type, location, and experience.",
  },
  {
    icon: UserPlus,
    title: "Connect with Peers",
    description: "Send connection requests and build your professional network.",
  },
  {
    icon: MessageCircle,
    title: "Direct Messaging",
    description: "Communicate privately with connections and potential collaborators.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Profiles",
    description: "Trust indicators and verified status for professional credibility.",
  },
  {
    icon: MapPin,
    title: "Local Connections",
    description: "Find professionals in your area for referrals and collaboration.",
  },
  {
    icon: Handshake,
    title: "Referral Network",
    description: "Pass work to trusted contacts when you are booked out.",
  },
];

export default function NetworkPage() {
  return (
    <div className="max-w-4xl mx-auto py-4">
      <ComingSoonPage
        icon={Network}
        title="Network"
        subtitle="Connect with film professionals across the country"
        description="Build your professional network within the film installation industry. Connect with other installers, find referral partners, and grow your presence in the community."
        features={features}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />
    </div>
  );
}
