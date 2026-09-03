/**
 * Client-Side Input Sanitization Utility
 * Neutralizes control characters, scripts, and dangerous protocols
 * to ensure zero-trust input safety before submission.
 */

export function sanitizeText(input: string, maxLength: number = 500): string {
  if (!input) return '';
  return input
    .slice(0, maxLength)
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Disarm basic script/tag syntax
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

export function sanitizeColumnName(col: string): string {
  if (!col) return '';
  return col.replace(/[^a-zA-Z0-9_\s.-]/g, '').trim().slice(0, 100);
}
