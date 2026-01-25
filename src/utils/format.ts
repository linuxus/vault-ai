/**
 * Format a date string or timestamp to a human-readable format
 */
export function formatDate(date: string | number | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | number | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/**
 * Format TTL duration in seconds to human-readable format
 */
export function formatTTL(seconds: number): string {
  if (seconds <= 0) return 'expired';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/**
 * Normalize a Vault path (remove leading/trailing slashes, collapse multiples)
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\/+/g, '/')
    .replace(/^\//, '')
    .replace(/\/$/, '');
}

/**
 * Join path segments with proper slash handling
 */
export function joinPath(...segments: string[]): string {
  return normalizePath(segments.join('/'));
}

/**
 * Get parent path from a full path
 */
export function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  parts.pop();
  return parts.join('/');
}

/**
 * Get the last segment (name) from a path
 */
export function getPathName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Check if a path represents a folder (ends with /)
 */
export function isFolder(path: string): boolean {
  return path.endsWith('/');
}

/**
 * Mask a secret value (show first and last chars with dots)
 */
export function maskValue(value: string, showChars: number = 2): string {
  if (value.length <= showChars * 2) {
    return '*'.repeat(value.length);
  }
  const start = value.slice(0, showChars);
  const end = value.slice(-showChars);
  const middle = '*'.repeat(Math.min(value.length - showChars * 2, 8));
  return `${start}${middle}${end}`;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Encode a mount path for use in URLs
 * Replaces slashes with ~ to avoid React Router path splitting
 * Example: "team/api-keys" -> "team~api-keys"
 */
export function encodeMountPath(mount: string): string {
  return mount.replace(/\//g, '~');
}

/**
 * Decode a mount path from URL format back to Vault format
 * Example: "team~api-keys" -> "team/api-keys"
 */
export function decodeMountPath(encoded: string): string {
  return encoded.replace(/~/g, '/');
}
