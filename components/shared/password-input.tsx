"use client";

import { useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  showHint?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showHint, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1">
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {showHint && (
          <p className="text-xs text-muted-foreground">
            At least 8 characters with uppercase, lowercase, and a number
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
