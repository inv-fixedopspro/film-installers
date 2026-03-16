import {
  BookOpen,
  Newspaper,
  Lightbulb,
  Video,
  TrendingUp,
  Wrench,
  Users,
  Star,
} from "lucide-react";
import { AppHeader } from "@/components/shared";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: Lightbulb,
    title: "Install Guides",
    description: "Step-by-step technique write-ups from experienced installers.",
  },
  {
    icon: Newspaper,
    title: "Industry News",
    description: "Product launches, brand updates, and market trends.",
  },
  {
    icon: Wrench,
    title: "Tool Reviews",
    description: "In-depth reviews of squeegees, plotters, films, and accessories.",
  },
  {
    icon: Video,
    title: "Video Content",
    description: "Embedded tutorials and install walkthroughs from the community.",
  },
  {
    icon: TrendingUp,
    title: "Business Tips",
    description: "Pricing strategies, client acquisition, and shop management advice.",
  },
  {
    icon: Users,
    title: "Community Spotlights",
    description: "Featured installer and shop owner stories from across the network.",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-secondary">
      <AppHeader variant="public" />
      <main className="container mx-auto px-4 py-8">
        <ComingSoonPage
          icon={BookOpen}
          title="Blog"
          subtitle="Guides, news, and insights for film professionals"
          description="Resources for installers and shop owners at every level. From install technique guides to business advice, the Film Installers blog covers everything in the industry."
          features={features}
          backHref="/"
          backLabel="Back to Home"
        />
      </main>
    </div>
  );
}
