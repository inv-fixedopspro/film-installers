export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function generateId(): string {
  return crypto.randomUUID();
}
