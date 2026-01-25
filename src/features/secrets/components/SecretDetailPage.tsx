import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSecret, useSecretMetadata } from '../hooks/useSecrets';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { SecretViewer } from '@/components/common/SecretViewer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Edit, Trash2, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { formatDate, decodeMountPath } from '@/utils/format';
import { SecretEditModal } from './SecretEditModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export function SecretDetailPage() {
  const { mount: encodedMount = '', '*': pathParam = '' } = useParams();
  const navigate = useNavigate();
  // Decode mount name to handle slashes (e.g., "team~api-keys" -> "team/api-keys")
  const mount = decodeMountPath(encodedMount);
  const path = pathParam || '';

  const { data: secret, isLoading, refetch, isRefetching } = useSecret(mount, path);
  const { data: metadata } = useSecretMetadata(mount, path);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const goBack = () => {
    const parentPath = path.split('/').slice(0, -1).join('/');
    navigate(`/secrets/${encodedMount}${parentPath ? '/' + parentPath : ''}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-vault-purple" />
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbs} />
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Secret not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{path.split('/').pop()}</h1>
        </div>
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
          <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Secret Data</CardTitle>
          </CardHeader>
          <CardContent>
            <SecretViewer data={secret.data} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs text-gray-500">Version</div>
              <div className="text-sm font-medium">{secret.metadata.version}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Created</div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                {formatDate(secret.metadata.created_time)}
              </div>
            </div>
            {metadata && (
              <>
                <div>
                  <div className="text-xs text-gray-500">Total Versions</div>
                  <div className="text-sm font-medium">{metadata.current_version}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Last Updated</div>
                  <div className="text-sm">{formatDate(metadata.updated_time)}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <SecretEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        mount={mount}
        path={path}
        mode="edit"
        initialData={secret.data as Record<string, string>}
        currentVersion={secret.metadata.version}
        onSuccess={() => {
          setShowEditModal(false);
          refetch();
        }}
      />

      <DeleteConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        mount={mount}
        path={path}
        onSuccess={() => {
          setShowDeleteModal(false);
          goBack();
        }}
      />
    </div>
  );
}
