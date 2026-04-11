const AD_SESSION_COOKIE = "ad_session_token";
const AD_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function generateUUID(): string {
  return crypto.randomUUID();
}

function setCookie(name: string, value: string, maxAgeMs: number): void {
  const maxAgeSec = Math.floor(maxAgeMs / 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAdSessionToken(): string {
  if (typeof window === "undefined") return "ssr";

  const existing = getCookie(AD_SESSION_COOKIE);
  if (existing) return existing;

  const token = generateUUID();
  setCookie(AD_SESSION_COOKIE, token, AD_SESSION_TTL_MS);
  return token;
}

export function isAdTrackingAllowed(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const stored = localStorage.getItem("cookie_consent");
    if (!stored) return false;
    const prefs = JSON.parse(stored);
    return prefs.advertising === true;
  } catch {
    return false;
  }
}

export async function recordImpression(params: {
  creative_id: string;
  campaign_id: string;
  page_context: string;
  ad_slot: string;
}): Promise<void> {
  if (!isAdTrackingAllowed()) return;

  try {
    await fetch("/api/ads/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        session_token: getAdSessionToken(),
      }),
    });
  } catch {
    // silently fail -- tracking should never break the UI
  }
}

export function buildClickUrl(
  creativeId: string,
  pageContext: string,
  impressionId?: string
): string {
  const params = new URLSearchParams({
    st: typeof window !== "undefined" ? getAdSessionToken() : "ssr",
    ctx: pageContext,
  });
  if (impressionId) params.set("imp", impressionId);
  return `/api/ads/click/${creativeId}?${params.toString()}`;
}
