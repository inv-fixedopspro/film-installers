import { randomBytes } from "crypto";

export function generateToken(length = 32): string {
  return randomBytes(length).toString("hex");
}

export function generateVerificationToken(): string {
  return generateToken(32);
}

export function generateInvitationToken(): string {
  return generateToken(32);
}

export function getExpiryDate(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

export function isTokenExpired(expiresAt: string | Date): boolean {
  const expiry = new Date(expiresAt);
  return expiry < new Date();
}
