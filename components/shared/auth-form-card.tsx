import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBox } from "./icon-box";

interface AuthFormCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconVariant?: "primary" | "secondary" | "muted" | "success" | "highlight";
  children: React.ReactNode;
}

export function AuthFormCard({
  title,
  description,
  icon: Icon,
  iconVariant = "highlight",
  children,
}: AuthFormCardProps) {
  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="space-y-1 text-center">
        {Icon && (
          <IconBox
            icon={Icon}
            size="xl"
            variant={iconVariant}
            shape="circle"
            className="mx-auto mb-4"
          />
        )}
        <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
