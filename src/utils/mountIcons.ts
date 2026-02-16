import {
  Blocks,
  FileKey2,
  Globe,
  Lock,
  Network,
  Server,
  Share2,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * Map a mount path name to an appropriate icon based on common naming patterns.
 *
 * Current enterprise mounts:
 *   applications/   → Blocks        (app modules / building blocks)
 *   infrastructure/ → Server        (servers & platform)
 *   teams/          → Users         (team / people)
 *   third-party/    → Globe         (external services)
 *   certificates/   → FileKey2      (certs & keys)
 *   shared/         → Share2        (shared resources)
 */
export function getMountIcon(path: string): LucideIcon {
  const name = path.toLowerCase();

  if (/\b(app|apps|application)/i.test(name)) return Blocks;
  if (/\b(infra|infrastructure|server|compute|node)\b/.test(name)) return Server;
  if (/\b(team|teams|group|org)\b/.test(name)) return Users;
  if (/\b(third.party|external|vendor|integration)\b/.test(name)) return Globe;
  if (/\b(cert|certs|certificate|pki|tls|ssl)\b/.test(name)) return FileKey2;
  if (/\b(shared|common|global|org.wide)\b/.test(name)) return Share2;
  if (/\b(network|vpc|subnet|firewall)\b/.test(name)) return Network;

  return Lock;
}
