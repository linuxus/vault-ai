import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSecretsList } from '../hooks/useSecrets';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { PathBrowser, keysToPathItems } from '@/components/common/PathBrowser';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Plus, RefreshCw } from 'lucide-react';
import { SecretEditModal } from './SecretEditModal';
import { decodeMountPath } from '@/utils/format';

export function SecretsListPage() {
  const { mount: encodedMount = '', '*': pathParam = '' } = useParams();
  const navigate = useNavigate();
  // Decode mount name to handle slashes (e.g., "team~api-keys" -> "team/api-keys")
  const mount = decodeMountPath(encodedMount);
  const path = pathParam || '';

  const { data: keys = [], isLoading, refetch, isRefetching } = useSecretsList(mount, path);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Build breadcrumbs (use encoded mount for URLs)
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Secrets', href: '/secrets' },
    { label: mount, href: `/secrets/${encodedMount}` },
  ];

  if (path) {
    const pathParts = path.split('/').filter(Boolean);
    pathParts.forEach((part, index) => {
      const href = `/secrets/${encodedMount}/${pathParts.slice(0, index + 1).join('/')}`;
      breadcrumbs.push({ label: part, href });
    });
  }

  const handleNavigate = (item: { name: string; isFolder: boolean }) => {
    const newPath = path ? `${path}/${item.name}` : item.name;
    if (item.isFolder) {
      navigate(`/secrets/${encodedMount}/${newPath.replace(/\/$/, '')}`);
    } else {
      navigate(`/secrets/${encodedMount}/${newPath}?view=true`);
    }
  };

  const pathItems = keysToPathItems(keys);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {path ? path.split('/').pop() : mount}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Secret
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {path || 'Root'} ({keys.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PathBrowser
            items={pathItems}
            loading={isLoading}
            onNavigate={handleNavigate}
            emptyMessage="No secrets found in this path"
          />
        </CardContent>
      </Card>

      <SecretEditModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        mount={mount}
        basePath={path}
        mode="create"
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />
    </div>
  );
}
