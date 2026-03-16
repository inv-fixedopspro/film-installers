import type { NextRequest } from "next/server";

export type Region = "eu" | "uk" | "us" | "ca" | "other";

const EU_COUNTRY_CODES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU",
  "IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
]);

export function getCountryCode(request: NextRequest): string | null {
  return (
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-country") ??
    null
  );
}

export function getRegion(countryCode: string | null): Region {
  if (!countryCode) return "other";
  const cc = countryCode.toUpperCase();
  if (cc === "US") return "us";
  if (cc === "CA") return "ca";
  if (cc === "GB") return "uk";
  if (EU_COUNTRY_CODES.has(cc)) return "eu";
  return "other";
}

export function isGdprRegion(region: Region): boolean {
  return region === "eu" || region === "uk";
}

export function getRegionFromRequest(request: NextRequest): Region {
  return getRegion(getCountryCode(request));
}
