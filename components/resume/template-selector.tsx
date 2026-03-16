"use client";

import { cn } from "@/lib/utils";
import type { ResumeTemplate, ResumeAccentColor } from "@/lib/types/database";

const TEMPLATES: { value: ResumeTemplate; label: string; description: string }[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Clean, traditional layout trusted by recruiters",
  },
  {
    value: "modern",
    label: "Modern",
    description: "Bold header with accent color sidebar",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Understated design — content first",
  },
];

const ACCENT_COLORS: { value: ResumeAccentColor; label: string; bg: string; ring: string }[] = [
  { value: "charcoal", label: "Charcoal", bg: "bg-[#3a3a3a]", ring: "ring-[#3a3a3a]" },
  { value: "navy", label: "Navy", bg: "bg-[#1e3a5f]", ring: "ring-[#1e3a5f]" },
  { value: "forest", label: "Forest", bg: "bg-[#2d5a3d]", ring: "ring-[#2d5a3d]" },
];

interface TemplateSelectorProps {
  selectedTemplate: ResumeTemplate;
  accentColor: ResumeAccentColor;
  onTemplateChange: (template: ResumeTemplate) => void;
  onAccentColorChange: (color: ResumeAccentColor) => void;
}

function StandardThumbnail() {
  return (
    <svg viewBox="0 0 120 80" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="80" rx="2" fill="#f8f9fa" />
      <rect x="8" y="8" width="104" height="10" rx="1" fill="#1a1a1a" opacity="0.85" />
      <rect x="8" y="22" width="60" height="3" rx="1" fill="#888" />
      <rect x="8" y="30" width="104" height="1" rx="0.5" fill="#e0e0e0" />
      <rect x="8" y="36" width="40" height="3" rx="1" fill="#555" />
      <rect x="8" y="43" width="104" height="2" rx="1" fill="#ddd" />
      <rect x="8" y="48" width="90" height="2" rx="1" fill="#ddd" />
      <rect x="8" y="53" width="96" height="2" rx="1" fill="#ddd" />
      <rect x="8" y="62" width="40" height="3" rx="1" fill="#555" />
      <rect x="8" y="69" width="104" height="2" rx="1" fill="#ddd" />
      <rect x="8" y="74" width="80" height="2" rx="1" fill="#ddd" />
    </svg>
  );
}

function ModernThumbnail({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 80" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="80" rx="2" fill="#f8f9fa" />
      <rect width="38" height="80" rx="0" fill={color} />
      <rect x="5" y="10" width="28" height="6" rx="1" fill="white" opacity="0.9" />
      <rect x="5" y="20" width="20" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="5" y="30" width="28" height="2" rx="1" fill="white" opacity="0.5" />
      <rect x="5" y="35" width="22" height="2" rx="1" fill="white" opacity="0.5" />
      <rect x="5" y="40" width="25" height="2" rx="1" fill="white" opacity="0.5" />
      <rect x="5" y="50" width="28" height="2" rx="1" fill="white" opacity="0.3" />
      <rect x="5" y="55" width="20" height="2" rx="1" fill="white" opacity="0.3" />
      <rect x="48" y="10" width="64" height="5" rx="1" fill="#1a1a1a" opacity="0.8" />
      <rect x="48" y="20" width="40" height="2" rx="1" fill="#888" />
      <rect x="48" y="28" width="64" height="1" rx="0.5" fill="#e0e0e0" />
      <rect x="48" y="33" width="64" height="2" rx="1" fill="#ddd" />
      <rect x="48" y="38" width="50" height="2" rx="1" fill="#ddd" />
      <rect x="48" y="48" width="30" height="3" rx="1" fill="#555" />
      <rect x="48" y="55" width="64" height="2" rx="1" fill="#ddd" />
      <rect x="48" y="60" width="55" height="2" rx="1" fill="#ddd" />
    </svg>
  );
}

function MinimalThumbnail() {
  return (
    <svg viewBox="0 0 120 80" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="80" rx="2" fill="white" />
      <rect x="12" y="10" width="96" height="7" rx="1" fill="#1a1a1a" opacity="0.9" />
      <rect x="12" y="21" width="50" height="2" rx="1" fill="#aaa" />
      <rect x="12" y="31" width="96" height="0.5" rx="0.25" fill="#e8e8e8" />
      <rect x="12" y="37" width="35" height="2.5" rx="1" fill="#444" />
      <rect x="12" y="44" width="96" height="1.5" rx="0.75" fill="#e0e0e0" />
      <rect x="12" y="49" width="82" height="1.5" rx="0.75" fill="#e0e0e0" />
      <rect x="12" y="54" width="88" height="1.5" rx="0.75" fill="#e0e0e0" />
      <rect x="12" y="63" width="35" height="2.5" rx="1" fill="#444" />
      <rect x="12" y="70" width="96" height="1.5" rx="0.75" fill="#e0e0e0" />
      <rect x="12" y="75" width="70" height="1.5" rx="0.75" fill="#e0e0e0" />
    </svg>
  );
}

const ACCENT_HEX: Record<ResumeAccentColor, string> = {
  charcoal: "#3a3a3a",
  navy: "#1e3a5f",
  forest: "#2d5a3d",
};

export function TemplateSelector({
  selectedTemplate,
  accentColor,
  onTemplateChange,
  onAccentColorChange,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onTemplateChange(t.value)}
            className={cn(
              "group flex flex-col rounded-lg border-2 overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedTemplate === t.value
                ? "border-primary shadow-md"
                : "border-border hover:border-muted-foreground"
            )}
          >
            <div className="bg-white p-2 w-full">
              {t.value === "standard" && <StandardThumbnail />}
              {t.value === "modern" && (
                <ModernThumbnail color={ACCENT_HEX[accentColor]} />
              )}
              {t.value === "minimal" && <MinimalThumbnail />}
            </div>
            <div
              className={cn(
                "px-2 py-1.5 text-center transition-colors",
                selectedTemplate === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
              )}
            >
              <p className="text-xs font-semibold">{t.label}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedTemplate === "modern" && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Accent Color</p>
          <div className="flex gap-3">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onAccentColorChange(c.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md border-2 text-sm transition-all",
                  accentColor === c.value
                    ? "border-foreground"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <span className={cn("w-4 h-4 rounded-full shrink-0", c.bg)} />
                <span className="text-xs font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
