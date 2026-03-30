/**
 * Generate a stable device fingerprint from properties that don't change
 * with browser/OS updates: screen resolution, timezone, and language.
 */
export function generateDeviceFingerprint(): string {
  const resolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;

  const raw = `${resolution}|${timezone}|${language}`;
  const encoded = btoa(raw);

  // Trim to 32 alphanumeric characters
  return encoded.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}
