import { useState } from 'react';
import { useDeleteSecret } from '../hooks/useSecrets';
import { useToast } from '@/hooks/useToast';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertTriangle } from 'lucide-react';
import { getErrorMessage } from '@/types/errors';

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mount: string;
  path: string;
  onSuccess?: () => void;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  mount,
  path,
  onSuccess,
}: DeleteConfirmModalProps) {
  const toast = useToast();
  const deleteSecret = useDeleteSecret(mount);
  const [confirmText, setConfirmText] = useState('');
  const [permanent, setPermanent] = useState(false);

  const secretName = path.split('/').pop() || path;
  const canDelete = confirmText === secretName;

  const handleDelete = async () => {
    try {
      await deleteSecret.mutateAsync({ path, permanent });
      toast.success(
        'Secret deleted',
        permanent
          ? 'Secret and all versions have been permanently deleted'
          : 'Secret has been soft-deleted'
      );
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to delete secret', getErrorMessage(error));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText('');
      setPermanent(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent>
        <ModalHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <ModalTitle className="text-center">Delete Secret</ModalTitle>
          <ModalDescription className="text-center">
            This action cannot be undone. This will delete the secret at{' '}
            <span className="font-mono font-medium">{mount}/{path}</span>
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Input
            label={`Type "${secretName}" to confirm`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={secretName}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-vault-purple focus:ring-vault-purple"
            />
            <span className="text-sm text-gray-700">
              Permanently delete all versions (cannot be recovered)
            </span>
          </label>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!canDelete}
            loading={deleteSecret.isPending}
          >
            Delete Secret
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
