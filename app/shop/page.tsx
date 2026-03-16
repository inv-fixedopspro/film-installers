import {
  ShoppingCart,
  Package,
  Star,
  Truck,
  Tag,
  Shield,
  Gift,
  Layers,
} from "lucide-react";
import { AppHeader } from "@/components/shared";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: Package,
    title: "Curated Products",
    description: "Hand-picked tools, squeegees, films, and install accessories.",
  },
  {
    icon: Tag,
    title: "Pro Pricing",
    description: "Member discounts and exclusive deals for verified installers.",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "Quick delivery so your supplies arrive before your next job.",
  },
  {
    icon: Star,
    title: "Reviewed by Pros",
    description: "Products rated and reviewed by working installers like you.",
  },
  {
    icon: Layers,
    title: "Film & Materials",
    description: "Window tint, PPF, vinyl, and specialty films from top brands.",
  },
  {
    icon: Gift,
    title: "Bundle Deals",
    description: "Starter kits and bundles designed for new and veteran installers.",
  },
];

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-secondary">
      <AppHeader variant="public" />
      <main className="container mx-auto px-4 py-8">
        <ComingSoonPage
          icon={ShoppingCart}
          title="Shop"
          subtitle="Tools, film, and supplies for film professionals"
          description="A curated store for window tint, PPF, and vinyl wrap professionals. Quality tools and materials sourced and reviewed by installers, with pro pricing for community members."
          features={features}
          backHref="/"
          backLabel="Back to Home"
        />
      </main>
    </div>
  );
}
