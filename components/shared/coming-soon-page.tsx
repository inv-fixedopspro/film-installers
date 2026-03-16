import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ComingSoonFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ComingSoonPageProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  features: ComingSoonFeature[];
  backHref?: string;
  backLabel?: string;
}

export function ComingSoonPage({
  icon: Icon,
  title,
  subtitle,
  description,
  features,
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
}: ComingSoonPageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      <div className="flex flex-col items-start gap-4">
        <Badge variant="secondary" className="text-xs font-semibold uppercase tracking-widest px-3 py-1">
          Coming Soon
        </Badge>

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-muted border border-border">
            <Icon className="h-7 w-7 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
          {description}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const FeatureIcon = feature.icon;
          return (
            <div
              key={index}
              className="group p-5 rounded-xl border border-border bg-card hover:bg-accent transition-colors duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted border border-border flex-shrink-0 group-hover:border-border/60 transition-colors">
                  <FeatureIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            We&apos;re actively building this feature. Stay tuned for updates.
          </p>
          <Link href={backHref}>
            <Button variant="outline" size="sm">
              {backLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
