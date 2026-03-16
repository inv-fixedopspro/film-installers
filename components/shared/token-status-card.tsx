"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BaseCard } from "./base-card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, LucideIcon } from "lucide-react";

type TokenStatus = "loading" | "success" | "error";

interface TokenStatusCardProps {
  status: TokenStatus;
  title?: string;
  message: string;
  helpText?: ReactNode;
  icon?: LucideIcon;
  buttonText?: string;
  buttonHref?: string;
  buttonVariant?: "default" | "outline";
  onButtonClick?: () => void;
  showButton?: boolean;
}

const defaultConfig: Record<TokenStatus, { title: string; icon: LucideIcon; iconVariant: "success" | "destructive" | "primary" }> = {
  loading: { title: "Processing", icon: Loader2, iconVariant: "primary" },
  success: { title: "Success", icon: CheckCircle, iconVariant: "success" },
  error: { title: "Something went wrong", icon: XCircle, iconVariant: "destructive" },
};

export function TokenStatusCard({
  status,
  title,
  message,
  helpText,
  icon,
  buttonText,
  buttonHref = "/login",
  buttonVariant = "default",
  onButtonClick,
  showButton = true,
}: TokenStatusCardProps) {
  const router = useRouter();
  const config = defaultConfig[status];

  const displayTitle = title || config.title;
  const DisplayIcon = icon || config.icon;
  const isLoading = status === "loading";

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else if (buttonHref) {
      router.push(buttonHref);
    }
  };

  if (isLoading) {
    return (
      <BaseCard maxWidth="md" showHeader={false} contentClassName="pt-10 pb-10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">{message}</p>
        </div>
      </BaseCard>
    );
  }

  const buttonStyles = status === "success"
    ? "bg-gradient-primary hover:opacity-90"
    : undefined;

  return (
    <BaseCard
      maxWidth="md"
      title={displayTitle}
      icon={DisplayIcon}
      iconVariant={config.iconVariant}
      iconSize="xl"
      iconShape="circle"
      headerLayout="centered"
    >
      <p className="text-base text-muted-foreground text-center mb-4">{message}</p>

      {helpText && (
        <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground mb-4">
          {helpText}
        </div>
      )}

      {showButton && buttonText && (
        buttonVariant === "outline" ? (
          <a href={buttonHref} className="block">
            <Button variant="outline" className="w-full">
              {buttonText}
            </Button>
          </a>
        ) : (
          <Button onClick={handleButtonClick} className={`w-full ${buttonStyles}`}>
            {buttonText}
          </Button>
        )
      )}
    </BaseCard>
  );
}
