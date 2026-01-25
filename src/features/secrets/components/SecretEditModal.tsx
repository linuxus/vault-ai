import { useState, useEffect, useRef } from 'react';
import { useWriteSecret } from '../hooks/useSecrets';
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
import { JsonEditor, type JsonEditorRef } from '@/components/common/JsonEditor';
import { getErrorMessage } from '@/types/errors';
import { joinPath } from '@/utils/format';

interface SecretEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mount: string;
  basePath?: string;
  path?: string;
  mode: 'create' | 'edit';
  initialData?: Record<string, string>;
  currentVersion?: number;
  onSuccess?: () => void;
}

export function SecretEditModal({
  open,
  onOpenChange,
  mount,
  basePath = '',
  path = '',
  mode,
  initialData = {},
  currentVersion,
  onSuccess,
}: SecretEditModalProps) {
  const toast = useToast();
  const writeSecret = useWriteSecret(mount);
  const jsonEditorRef = useRef<JsonEditorRef>(null);

  const [secretPath, setSecretPath] = useState('');
  const [data, setData] = useState<Record<string, string>>({});
  const [pathError, setPathError] = useState('');

  // Reset form when modal opens (only depend on `open` to avoid resetting while typing)
  useEffect(() => {
    if (open) {
      if (mode === 'edit') {
        setSecretPath(path);
        setData(initialData);
      } else {
        setSecretPath('');
        setData({});
      }
      setPathError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Flush any pending entry from JsonEditor and get the final data
    const finalData = jsonEditorRef.current?.flushPendingEntry() ?? data;

    const finalPath = mode === 'create' ? joinPath(basePath, secretPath) : path;

    if (mode === 'create' && !secretPath.trim()) {
      setPathError('Path is required');
      return;
    }

    if (Object.keys(finalData).length === 0) {
      toast.error('Validation error', 'At least one key-value pair is required');
      return;
    }

    try {
      await writeSecret.mutateAsync({
        path: finalPath,
        data: finalData,
        cas: mode === 'edit' ? currentVersion : undefined,
      });
      toast.success(
        mode === 'create' ? 'Secret created' : 'Secret updated',
        `Successfully ${mode === 'create' ? 'created' : 'updated'} secret at ${finalPath}`
      );
      onSuccess?.();
    } catch (error) {
      toast.error(
        mode === 'create' ? 'Failed to create secret' : 'Failed to update secret',
        getErrorMessage(error)
      );
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>
              {mode === 'create' ? 'Create New Secret' : 'Edit Secret'}
            </ModalTitle>
            <ModalDescription>
              {mode === 'create'
                ? `Create a new secret in ${mount}/${basePath || 'root'}`
                : `Edit secret at ${mount}/${path}`}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            {mode === 'create' && (
              <Input
                label="Secret Path"
                value={secretPath}
                onChange={(e) => {
                  setSecretPath(e.target.value);
                  setPathError('');
                }}
                placeholder="my-secret or folder/my-secret"
                error={pathError}
                hint={`Full path: ${mount}/${joinPath(basePath, secretPath) || '<path>'}`}
              />
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Secret Data
              </label>
              <JsonEditor ref={jsonEditorRef} data={data} onChange={setData} />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={writeSecret.isPending}>
              {mode === 'create' ? 'Create Secret' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
