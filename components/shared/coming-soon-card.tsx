import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComingSoonFeature {
  title: string;
  description: string;
}

interface ComingSoonCardProps {
  title?: string;
  description?: string;
  features: ComingSoonFeature[];
}

export function ComingSoonCard({
  title = "Coming Soon",
  description = "More features are on the way",
  features,
}: ComingSoonCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="p-4 rounded-lg bg-muted text-center">
              <p className="font-medium text-foreground">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
