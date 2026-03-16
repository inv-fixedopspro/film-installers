import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  href?: string;
  className?: string;
  textClassName?: string;
}

const sizeStyles: Record<LogoSize, { container: string; text: string; logoText: string }> = {
  sm: { container: "h-6 w-6", text: "text-xs", logoText: "text-sm" },
  md: { container: "h-8 w-8", text: "text-sm", logoText: "font-semibold" },
  lg: { container: "h-10 w-10", text: "text-base", logoText: "text-lg font-semibold" },
};

export function Logo({
  size = "md",
  showText = true,
  href,
  className,
  textClassName,
}: LogoProps) {
  const sizeStyle = sizeStyles[size];

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-lg bg-foreground flex items-center justify-center",
          sizeStyle.container
        )}
      >
        <span className={cn("text-primary-foreground/80 font-bold", sizeStyle.text)}>FI</span>
      </div>
      {showText && (
        <span className={cn("text-foreground", sizeStyle.logoText, textClassName)}>
          {APP_NAME}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
