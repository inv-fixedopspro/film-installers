"use client";

import { useState, useEffect } from "react";
import { Cookie, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getCookiePreferences, type CookiePreferences } from "./cookie-consent-banner";
import Link from "next/link";

const STORAGE_KEY = "cookie_consent";
const CONSENT_VERSION = "2026-03-14";

function savePreferences(analytics: boolean, advertising: boolean): void {
  const prefs: CookiePreferences = {
    essential: true,
    analytics,
    advertising,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function CookiePreferencesTrigger() {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    if (open) {
      const prefs = getCookiePreferences();
      if (prefs) {
        setAnalytics(prefs.analytics);
        setAdvertising(prefs.advertising);
      }
    }
  }, [open]);

  function handleSave() {
    savePreferences(analytics, advertising);
    setOpen(false);
  }

  function handleAcceptAll() {
    setAnalytics(true);
    setAdvertising(true);
    savePreferences(true, true);
    setOpen(false);
  }

  function handleRejectAll() {
    setAnalytics(false);
    setAdvertising(false);
    savePreferences(false, false);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hover:text-primary-foreground/80 transition-colors"
      >
        Manage Cookie Preferences
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-4 w-4" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie settings. Essential cookies are always active.{" "}
              <Link href="/legal/cookies" className="underline underline-offset-4 hover:no-underline">
                Learn more
              </Link>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
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

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-primary hover:opacity-90"
              size="sm"
            >
              Save Preferences
            </Button>
            <Button
              onClick={handleAcceptAll}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Accept All
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="ghost"
              size="sm"
              className="flex-1 text-muted-foreground"
            >
              Reject Non-Essential
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
