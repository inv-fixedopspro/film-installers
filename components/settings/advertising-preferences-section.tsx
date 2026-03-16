"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, ShieldOff, ShieldCheck, Clock, Loader as Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AdConsentRecord {
  id: string;
  opted_out: boolean;
  source: string;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  settings: "Account Settings",
  cookie_banner: "Cookie Banner",
  registration: "Registration",
};

export function AdvertisingPreferencesSection() {
  const [optedOut, setOptedOut] = useState<boolean | null>(null);
  const [history, setHistory] = useState<AdConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/advertising-preferences");
      const json = await res.json();
      if (json.success) {
        setOptedOut(json.data.targeted_ads_opted_out);
        setHistory(json.data.history);
      }
    } catch {
      // silently fail on fetch error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  async function handleToggle(newOptedOut: boolean) {
    if (saving || optedOut === newOptedOut) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/advertising-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opted_out: newOptedOut }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to update preference");
        return;
      }
      setOptedOut(json.data.targeted_ads_opted_out);
      await fetchPreferences();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Advertising Preferences
        </CardTitle>
        <CardDescription>
          Control how your activity is used for targeted advertising
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-background border border-border flex-shrink-0 mt-0.5">
              <ShieldOff className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Do Not Sell or Share My Personal Information</p>
              <p className="text-xs text-muted-foreground mt-1">
                Under CCPA and applicable privacy law, you have the right to opt out of the use of your data for targeted advertising. This applies to interest-based and behaviorally targeted ads. Non-targeted (contextual) ads may still appear.
              </p>
            </div>
          </div>

          <Separator />

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your preferences...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {optedOut ? (
                    <ShieldOff className="w-4 h-4 text-warning" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-success" />
                  )}
                  <span className="text-sm font-medium">
                    {optedOut
                      ? "You have opted out of targeted advertising"
                      : "Targeted advertising is enabled"}
                  </span>
                </div>
                <Badge
                  variant={optedOut ? "secondary" : "default"}
                  className="flex-shrink-0 text-xs"
                >
                  {optedOut ? "Opted Out" : "Opted In"}
                </Badge>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={optedOut ? "default" : "outline"}
                  disabled={saving || optedOut === true}
                  onClick={() => handleToggle(true)}
                  className="flex-1"
                >
                  {saving && optedOut !== true ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Opt Out
                </Button>
                <Button
                  size="sm"
                  variant={!optedOut ? "default" : "outline"}
                  disabled={saving || optedOut === false}
                  onClick={() => handleToggle(false)}
                  className="flex-1"
                >
                  {saving && optedOut !== false ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Opt In
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border">
          <p>
            <strong className="text-foreground">What this controls:</strong> Whether your browsing activity within the Film Installers Network may be used to show you ads that are tailored to your interests. Ad impression and click data is anonymized and not linked to your account.
          </p>
          <p>
            <strong className="text-foreground">Cookie preferences</strong> for advertising cookies are separate and managed via the{" "}
            <Link href="/legal/cookies" className="underline underline-offset-2 hover:no-underline inline-flex items-center gap-0.5">
              Cookie Policy
              <ExternalLink className="w-3 h-3" />
            </Link>
            .
          </p>
        </div>

        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Preference Change Log</p>
            <div className="space-y-1.5">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {new Date(record.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" via "}
                      {SOURCE_LABELS[record.source] ?? record.source}
                    </span>
                  </div>
                  <Badge
                    variant={record.opted_out ? "secondary" : "default"}
                    className="text-xs flex-shrink-0"
                  >
                    {record.opted_out ? "Opted Out" : "Opted In"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
