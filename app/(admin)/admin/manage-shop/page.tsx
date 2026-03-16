"use client";

import { Store, Package, Tags, ShoppingCart, Truck, ChartBar as BarChart3, Star, LayoutGrid } from "lucide-react";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: Package,
    title: "Product Management",
    description: "Add, edit, and archive products with images, descriptions, and pricing.",
  },
  {
    icon: LayoutGrid,
    title: "Category Structure",
    description: "Organize the shop into collections and sub-categories.",
  },
  {
    icon: Tags,
    title: "Pricing & Discounts",
    description: "Set retail prices, member discounts, and promotional pricing.",
  },
  {
    icon: ShoppingCart,
    title: "Order Management",
    description: "View and manage customer orders, fulfillment, and returns.",
  },
  {
    icon: Truck,
    title: "Shipping Rules",
    description: "Configure shipping zones, carriers, and delivery options.",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    description: "Track revenue, top products, and order trends over time.",
  },
];

export default function AdminManageShopPage() {
  return (
    <ComingSoonPage
      icon={Store}
      title="Manage Shop"
      subtitle="Product catalog, orders, and shop configuration"
      description="Full control over the Film Installers shop. Manage the product catalog, configure pricing and discounts, handle orders, and review sales performance in one admin interface."
      features={features}
      backHref="/admin"
      backLabel="Back to Admin"
    />
  );
}
