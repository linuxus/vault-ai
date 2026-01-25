import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRequiredVaultClient } from '@/hooks/useVaultClient';

/**
 * Query key factory for secrets
 */
export const secretsKeys = {
  all: ['secrets'] as const,
  list: (mount: string, path: string) => [...secretsKeys.all, 'list', mount, path] as const,
  detail: (mount: string, path: string) => [...secretsKeys.all, 'detail', mount, path] as const,
  metadata: (mount: string, path: string) => [...secretsKeys.all, 'metadata', mount, path] as const,
};

/**
 * Hook to list secrets at a path
 */
export function useSecretsList(mount: string, path: string = '') {
  const client = useRequiredVaultClient();

  return useQuery({
    queryKey: secretsKeys.list(mount, path),
    queryFn: () => client.kvList(mount, path),
    // Always refetch when component mounts or query key changes
    refetchOnMount: true,
    staleTime: 0,
  });
}

/**
 * Hook to read a secret
 */
export function useSecret(mount: string, path: string, version?: number) {
  const client = useRequiredVaultClient();

  return useQuery({
    queryKey: secretsKeys.detail(mount, path),
    queryFn: () => client.kvRead(mount, path, version),
    enabled: !!path,
  });
}

/**
 * Hook to read secret metadata
 */
export function useSecretMetadata(mount: string, path: string) {
  const client = useRequiredVaultClient();

  return useQuery({
    queryKey: secretsKeys.metadata(mount, path),
    queryFn: () => client.kvReadMetadata(mount, path),
    enabled: !!path,
  });
}

/**
 * Hook to write a secret
 */
export function useWriteSecret(mount: string) {
  const client = useRequiredVaultClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      path,
      data,
      cas,
    }: {
      path: string;
      data: Record<string, unknown>;
      cas?: number;
    }) => client.kvWrite(mount, path, data, cas),
    onSuccess: (_, variables) => {
      // Invalidate the specific secret
      queryClient.invalidateQueries({
        queryKey: secretsKeys.detail(mount, variables.path),
      });
      queryClient.invalidateQueries({
        queryKey: secretsKeys.metadata(mount, variables.path),
      });
      // Invalidate the list at parent path
      const parentPath = variables.path.split('/').slice(0, -1).join('/');
      queryClient.invalidateQueries({
        queryKey: secretsKeys.list(mount, parentPath),
      });
    },
  });
}

/**
 * Hook to delete a secret
 */
export function useDeleteSecret(mount: string) {
  const client = useRequiredVaultClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      path,
      versions,
      permanent,
    }: {
      path: string;
      versions?: number[];
      permanent?: boolean;
    }) => {
      if (permanent) {
        return client.kvDeleteMetadata(mount, path);
      }
      return client.kvDelete(mount, path, versions);
    },
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: secretsKeys.detail(mount, variables.path),
      });
      queryClient.invalidateQueries({
        queryKey: secretsKeys.metadata(mount, variables.path),
      });
      // Invalidate parent list
      const parentPath = variables.path.split('/').slice(0, -1).join('/');
      queryClient.invalidateQueries({
        queryKey: secretsKeys.list(mount, parentPath),
      });
    },
  });
}
