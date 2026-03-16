"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Cookie, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCookiePreferences } from "@/components/shared/cookie-consent-banner";

interface ConsentRecord {
  id: string;
  terms_version: string;
  privacy_version: string;
  age_confirmed: boolean;
  cookie_essential: boolean;
  cookie_analytics: boolean;
  cookie_advertising: boolean;
  created_at: string;
}

export function ConsentHistorySection() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const cookiePrefs = getCookiePreferences();

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/user/consent-history");
      const json = await res.json();
      if (json.success) setRecords(json.data.records);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Consent History
        </CardTitle>
        <CardDescription>
          A record of your legal agreements and privacy preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Current Cookie Preferences</p>
          {cookiePrefs ? (
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
              <div className="flex flex-wrap gap-2">
                <PreferenceBadge label="Essential" active={true} />
                <PreferenceBadge label="Analytics" active={cookiePrefs.analytics} />
                <PreferenceBadge label="Advertising" active={cookiePrefs.advertising} />
              </div>
              <p className="text-xs text-muted-foreground">
                Last updated{" "}
                {new Date(cookiePrefs.timestamp).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {" "}(version {cookiePrefs.version})
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">No cookie preferences saved in this browser.</p>
            </div>
          )}
          <Link
            href="/legal/cookies"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Cookie className="h-3 w-3" />
            Manage cookie preferences
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Legal Agreement Log</p>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">No consent records found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-3 rounded-lg bg-muted/50 border border-border space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(record.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0">Initial Consent</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Terms v{record.terms_version}
                      {" — "}
                      <Link href="/terms" className="underline underline-offset-2 hover:no-underline">
                        view
                      </Link>
                    </span>
                    <span>
                      Privacy v{record.privacy_version}
                      {" — "}
                      <Link href="/privacy" className="underline underline-offset-2 hover:no-underline">
                        view
                      </Link>
                    </span>
                    {record.age_confirmed && <span>Age 18+ confirmed</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PreferenceBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
      active
        ? "bg-success/10 text-success border-success/20"
        : "bg-muted text-muted-foreground border-border"
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-success" : "bg-muted-foreground/50"}`} />
      {label}
      <span className="opacity-70">{active ? "On" : "Off"}</span>
    </div>
  );
}
