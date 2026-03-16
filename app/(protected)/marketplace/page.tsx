"use client";

import {
  ShoppingBag,
  Tag,
  PackageSearch,
  Star,
  Shield,
  Truck,
  Camera,
  Wrench,
} from "lucide-react";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: Tag,
    title: "Buy & Sell Equipment",
    description: "List used tools, plotters, squeegees, and install equipment.",
  },
  {
    icon: PackageSearch,
    title: "Browse Listings",
    description: "Search by category, condition, price, and location.",
  },
  {
    icon: Camera,
    title: "Photo Listings",
    description: "Upload multiple photos to showcase items you have for sale.",
  },
  {
    icon: Star,
    title: "Seller Ratings",
    description: "Build trust with buyer and seller feedback and ratings.",
  },
  {
    icon: Shield,
    title: "Verified Sellers",
    description: "Transact with confidence using verified community members.",
  },
  {
    icon: Wrench,
    title: "Film & Supplies",
    description: "Leftover rolls, pre-cut kits, and hard-to-find materials.",
  },
];

export default function MarketplacePage() {
  return (
    <div className="max-w-4xl mx-auto py-4">
      <ComingSoonPage
        icon={ShoppingBag}
        title="Marketplace"
        subtitle="Buy and sell tools, film, and equipment"
        description="A peer-to-peer marketplace built for film professionals. Buy and sell used tools, leftover rolls, plotters, and supplies directly with other members in the community."
        features={features}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />
    </div>
  );
}
