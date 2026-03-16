"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Cookie, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "cookie_consent";
const CONSENT_VERSION = "2026-03-14-v2";

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  advertising: boolean;
  version: string;
  timestamp: string;
}

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as CookiePreferences;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePreferences(analytics: boolean, advertising: boolean): CookiePreferences {
  const prefs: CookiePreferences = {
    essential: true,
    analytics,
    advertising,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  return prefs;
}

function detectGdprRegion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (
      tz.startsWith("Europe/") ||
      tz === "Atlantic/Azores" ||
      tz === "Atlantic/Canary" ||
      tz === "Atlantic/Madeira"
    );
  } catch {
    return false;
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const [isGdpr, setIsGdpr] = useState(false);

  useEffect(() => {
    const prefs = getCookiePreferences();
    if (!prefs) {
      setVisible(true);
      const gdpr = detectGdprRegion();
      setIsGdpr(gdpr);
      if (gdpr) {
        setExpanded(true);
      }
    }
  }, []);

  if (!visible) return null;

  function handleAcceptAll() {
    savePreferences(true, true);
    setVisible(false);
  }

  function handleRejectNonEssential() {
    savePreferences(false, false);
    setVisible(false);
  }

  function handleSavePreferences() {
    savePreferences(analytics, advertising);
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-2xl shadow-black/10 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center mt-0.5">
              <Cookie className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground text-sm mb-1">
                We use cookies
              </h2>
              {isGdpr ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use essential cookies to operate the platform. We would also like your
                  consent to use optional analytics and advertising cookies. You can manage your
                  choices below &mdash; you can withdraw consent at any time.{" "}
                  <Link
                    href="/legal/cookies"
                    className="text-foreground underline underline-offset-4 hover:no-underline"
                  >
                    Cookie Policy
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use essential cookies to operate the platform. With your consent, we also use
                  analytics and advertising cookies.{" "}
                  <Link
                    href="/legal/cookies"
                    className="text-foreground underline underline-offset-4 hover:no-underline"
                  >
                    Cookie Policy
                  </Link>
                </p>
              )}
            </div>
            <button
              onClick={handleRejectNonEssential}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Reject non-essential and close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isGdpr && !expanded && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3 w-3 flex-shrink-0" />
              <span>
                You appear to be in the EU/UK. Your preferences are expanded below as required by
                the ePrivacy Directive.
              </span>
            </div>
          )}

          {expanded && (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Essential</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Required for login, sessions, and security. Cannot be disabled.
                  </p>
                </div>
                <Switch checked={true} disabled aria-label="Essential cookies always on" />
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Analytics</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Help us understand how the platform is used so we can improve it.
                  </p>
                </div>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  aria-label="Toggle analytics cookies"
                />
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Advertising</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Show relevant ads from the film installation industry. First-party only.
                  </p>
                </div>
                <Switch
                  checked={advertising}
                  onCheckedChange={setAdvertising}
                  aria-label="Toggle advertising cookies"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {expanded ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSavePreferences}
                  className="flex-1 sm:flex-none bg-gradient-primary hover:opacity-90"
                >
                  Save Preferences
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none"
                >
                  Accept All
                </Button>
                {isGdpr ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRejectNonEssential}
                    className="flex-1 sm:flex-none text-muted-foreground"
                  >
                    Reject Non-Essential
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpanded(false)}
                    className="flex-1 sm:flex-none text-muted-foreground"
                  >
                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                    Less
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none bg-gradient-primary hover:opacity-90"
                >
                  Accept All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRejectNonEssential}
                  className="flex-1 sm:flex-none"
                >
                  Reject Non-Essential
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpanded(true)}
                  className="flex-1 sm:flex-none text-muted-foreground"
                >
                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  Manage
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
