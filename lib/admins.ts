// Super-admins van het dashboard. Deze e-mailadressen kunnen inloggen en zien
// het menu-item "Beheer": alle restaurants inzien en aanpassen.
// Let op: het adres moet een echte mailbox zijn om de inlog-link te ontvangen.
export const ADMIN_EMAILS = ["reemobv@gmail.com", "hello@dinely.nl"];

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
