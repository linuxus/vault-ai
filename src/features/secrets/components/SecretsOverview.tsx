import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaultClient } from '@/hooks/useVaultClient';
import { encodeMountPath } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { ChevronRight, Loader2 } from 'lucide-react';
import { getMountIcon } from '@/utils/mountIcons';

interface KVMount {
  path: string;
  version: string;
}

export function SecretsOverview() {
  const client = useVaultClient();
  const navigate = useNavigate();
  const [mounts, setMounts] = useState<KVMount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMounts() {
      if (!client) return;

      try {
        const kvMounts = await client.getKVMounts();
        setMounts(
          Object.entries(kvMounts).map(([path, info]) => ({
            path: path.replace(/\/$/, ''),
            version: info.version,
          }))
        );
      } catch (error) {
        console.error('Failed to load mounts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMounts();
  }, [client]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vault-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Secrets Engines</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Select a secrets engine to browse and manage its secrets.
        </p>
      </div>

      {mounts.length === 0 ? (
        <p className="text-gray-500">No KV secrets engines found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mounts.map((mount) => {
            const encodedPath = encodeMountPath(mount.path);
            const MountIcon = getMountIcon(mount.path);
            return (
              <Card
                key={mount.path}
                className={cn(
                  'cursor-pointer transition-all duration-200',
                  'hover:border-vault-purple/40 hover:shadow-md'
                )}
                onClick={() => navigate(`/secrets/${encodedPath}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-vault-purple/10">
                    <MountIcon className="h-6 w-6 text-vault-purple" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{mount.path}</p>
                    <span className="inline-block mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      KV v{mount.version}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
