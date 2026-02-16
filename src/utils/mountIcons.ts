import {
  Database,
  AppWindow,
  ShieldCheck,
  Server,
  KeyRound,
  Cloud,
  Settings,
  Lock,
  type LucideIcon,
} from 'lucide-react';

/**
 * Map a mount path name to an appropriate icon based on common naming patterns.
 */
export function getMountIcon(path: string): LucideIcon {
  const name = path.toLowerCase();

  if (/\b(app|apps|application)\b/.test(name)) return AppWindow;
  if (/\b(cert|certs|certificate|pki|tls|ssl)\b/.test(name)) return ShieldCheck;
  if (/\b(infra|infrastructure|server|compute|node)\b/.test(name)) return Server;
  if (/\b(db|database|mysql|postgres|mongo|redis)\b/.test(name)) return Database;
  if (/\b(api|token|tokens|key|keys|auth)\b/.test(name)) return KeyRound;
  if (/\b(cloud|aws|gcp|azure|s3)\b/.test(name)) return Cloud;
  if (/\b(config|configuration|settings|env)\b/.test(name)) return Settings;

  return Lock;
}
