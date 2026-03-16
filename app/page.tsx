import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconBox, AppHeader } from "@/components/shared";
import { Footer } from "@/components/layout";
import { SERVICE_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  Users,
  ShoppingBag,
  MessageSquare,
  BookOpen,
  Store,
  ChevronRight,
  Car,
  Building2,
  Shield,
  Layers,
  LucideIcon,
} from "lucide-react";

const SERVICE_TYPE_ICONS: Record<string, LucideIcon> = {
  automotive_tint: Car,
  architectural_glass: Building2,
  ppf: Shield,
  vinyl_wrap: Layers,
};

const PLATFORM_FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Users,
    title: "Professional Network",
    description: "Connect with installers, shop owners, and industry contacts across the country.",
  },
  {
    icon: MessageSquare,
    title: "Forum",
    description: "Get answers, share techniques, and talk shop with other pros in your specialty.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description: "Buy and sell tools, equipment, and supplies directly from other installers.",
  },
  {
    icon: Store,
    title: "Shop",
    description: "Curated products and gear sourced specifically for the trade.",
  },
  {
    icon: BookOpen,
    title: "Blog & Resources",
    description: "Industry news, installation guides, job search tips, and career advice.",
  },
];

async function getPlatformStats() {
  try {
    const supabase = await createClient();
    const [installersResult, employersResult] = await Promise.all([
      supabase.from("installer_profiles").select("id", { count: "exact", head: true }),
      supabase.from("employer_profiles").select("id", { count: "exact", head: true }),
    ]);
    return {
      installers: installersResult.count ?? 0,
      employers: employersResult.count ?? 0,
    };
  } catch {
    return { installers: 0, employers: 0 };
  }
}

export default async function HomePage() {
  const stats = await getPlatformStats();
  return (
    <div className="min-h-screen bg-background">

      <AppHeader variant="public" />

      <main>

        {/* ── HERO ── */}
        <section className="bg-background pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-widest uppercase text-brand mb-5">
                Window Tint &bull; PPF &bull; Vinyl Wrap &bull; Architectural Film
              </p>
              <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6">
                The Job Board for
                <br />
                <span className="text-muted-foreground">Film Installers.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl">
                Find jobs. Hire talent. Build your resume. The only platform built specifically for window tint, PPF, vinyl wrap, and architectural film pros.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Link href="/join">
                  <Button size="lg" className="text-base px-8 h-12 rounded-md">
                    Join Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-base px-8 h-12 rounded-md">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── DARK DIVIDER STATS ── */}
        <section className="bg-foreground py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x md:divide-primary-foreground/10">
              <div className="md:px-8 first:pl-0">
                <p className="text-3xl font-bold text-brand/80 mb-1">
                  {stats.installers > 0 ? `${stats.installers.toLocaleString()}+` : "Free"}
                </p>
                <p className="text-sm text-primary-foreground/50">
                  {stats.installers > 0 ? "Verified film installers" : "Always free to join"}
                </p>
              </div>
              <div className="md:px-8">
                <p className="text-3xl font-bold text-brand/80 mb-1">
                  {stats.employers > 0 ? `${stats.employers.toLocaleString()}+` : "Now"}
                </p>
                <p className="text-sm text-primary-foreground/50">
                  {stats.employers > 0 ? "Shops & employers posting jobs" : "Accepting new members"}
                </p>
              </div>
              <div className="md:px-8">
                <p className="text-3xl font-bold text-brand/80 mb-1">{SERVICE_TYPES.length}</p>
                <p className="text-sm text-primary-foreground/50">Film &amp; wrap trade specialties</p>
              </div>
              <div className="md:px-8 last:pr-0">
                <p className="text-3xl font-bold text-brand/80 mb-1">$0</p>
                <p className="text-sm text-primary-foreground/50">To post jobs or apply</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOR INSTALLERS / FOR EMPLOYERS ── */}
        <section className="py-24 bg-secondary">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden shadow-sm">

              {/* Installers */}
              <div className="bg-background p-10 md:p-12">
                <p className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">For Installers</p>
                <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">
                  Build your resume. Get found by shops hiring near you.
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Create a professional profile that showcases your skills. Browse job listings, apply directly, and connect with shops looking for talent in your area.
                </p>
                <ul className="space-y-3 mb-10 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                    Free resume builder designed for installers
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                    Browse and apply to job listings
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                    Get contacted by employers directly
                  </li>
                </ul>
                <Link href="/join">
                  <Button className="px-6 h-10 text-sm">
                    Create Installer Profile
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Employers */}
              <div className="bg-foreground/60 p-10 md:p-12">
                <p className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">For Employers</p>
                <h2 className="text-3xl font-bold text-primary-foreground mb-4 leading-tight">
                  Post jobs. Find skilled installers fast.
                </h2>
                <p className="text-primary-foreground/60 mb-8 leading-relaxed">
                  Post job listings for free and reach qualified candidates actively looking for work. Browse resumes by specialty and location to find the right fit for your shop.
                </p>
                <ul className="space-y-3 mb-10 text-sm text-primary-foreground/60">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                    Post job listings at no cost
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                    Browse installer resumes by specialty
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                    Manage applicants in one place
                  </li>
                </ul>
                <Link href="/join">
                  <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/40 px-6 h-10 text-sm bg-transparent">
                    Create Employer Profile
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-24 bg-primary">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16">
              <p className="text-xs font-semibold tracking-widest uppercase text-brand/80 mb-3">How It Works</p>
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground leading-tight max-w-lg">
                Get started in minutes.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-12 md:gap-16">
              <div>
                <p className="text-5xl font-bold text-brand/80 mb-5 leading-none">01</p>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">Create your profile</h3>
                <p className="text-primary-foreground/50 text-sm leading-relaxed">
                  Sign up free. Add your specialty, experience, and location so the right people can find you.
                </p>
              </div>
              <div>
                <p className="text-5xl font-bold text-brand/80 mb-5 leading-none">02</p>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">Browse or post jobs</h3>
                <p className="text-primary-foreground/50 text-sm leading-relaxed">
                  Installers browse job listings and apply directly. Employers post openings and search resumes by location.
                </p>
              </div>
              <div>
                <p className="text-5xl font-bold text-brand/80 mb-5 leading-none">03</p>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">Connect and grow</h3>
                <p className="text-primary-foreground/50 text-sm leading-relaxed">
                  Make the hire or land the job. Then stick around for the network, forum, and marketplace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PLATFORM SCOPE ── */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">

              {/* Specialties */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">More Than a Job Board</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
                  Built for the film and wrap industry.
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-10">
                  Jobs, networking, forum, and marketplace &mdash; everything in one place for window tint, PPF, vinyl wrap, and architectural film pros.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_TYPES.map((specialty) => {
                    const Icon = SERVICE_TYPE_ICONS[specialty.value];
                    return (
                      <div
                        key={specialty.value}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-border bg-muted/30 text-sm font-medium text-foreground"
                      >
                        <IconBox icon={Icon} size="sm" variant="none" shape="rounded" className="w-7 h-7 flex-shrink-0" />
                        {specialty.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Platform features */}
              <div className="divide-y divide-border">
                {PLATFORM_FEATURES.map((item) => (
                  <div key={item.title} className="py-5 flex gap-4">
                    <div className="mt-0.5 flex-shrink-0">
                      <item.icon className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 bg-foreground">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-5 leading-tight">
                Ready to get started?
              </h2>
              <p className="text-lg text-primary-foreground/50 mb-10 leading-relaxed">
                Join free. Build your resume or post your first job listing. No fees, no friction.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/join">
                  <Button
                    size="lg"
                    className="bg-primary-foreground hover:bg-primary-foreground/90 text-foreground text-base px-8 h-12 rounded-md font-semibold"
                  >
                    Join Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/40 text-base px-8 h-12 rounded-md bg-transparent"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
