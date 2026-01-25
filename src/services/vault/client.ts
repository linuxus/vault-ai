import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  VaultResponse,
  TokenInfo,
  MountsResponse,
  KVSecret,
  KVMetadata,
  KVListResponse,
} from '@/types/vault';
import type { VaultAPIError } from '@/types/api';
import {
  VaultError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
} from '@/types/errors';
import { normalizePath } from '@/utils/format';

export interface VaultClientConfig {
  baseUrl: string;
  token: string;
  onUnauthorized?: () => void;
}

export class VaultClient {
  private client: AxiosInstance;
  private onUnauthorized?: () => void;

  constructor(config: VaultClientConfig) {
    this.onUnauthorized = config.onUnauthorized;

    // Always use relative URLs - nginx proxies /v1/ to Vault
    // This works in both development (Vite proxy) and production (nginx proxy)
    const baseURL = '';

    this.client = axios.create({
      baseURL,
      headers: {
        'X-Vault-Token': config.token,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<VaultAPIError>) => this.handleError(error)
    );
  }

  private handleError(error: AxiosError<VaultAPIError>): never {
    const status = error.response?.status;
    const errors = error.response?.data?.errors || [];
    const message = errors[0] || error.message || 'An error occurred';

    switch (status) {
      case 401:
        this.onUnauthorized?.();
        throw new AuthenticationError(message, errors);
      case 403:
        throw new PermissionError(message, errors);
      case 404:
        throw new NotFoundError(message, errors);
      default:
        throw new VaultError(message, status || 500, errors);
    }
  }

  // ============================================
  // Token Operations
  // ============================================

  /**
   * Look up information about the current token
   */
  async lookupSelf(): Promise<TokenInfo> {
    const response = await this.client.get<VaultResponse<TokenInfo>>(
      '/v1/auth/token/lookup-self'
    );
    return response.data.data;
  }

  /**
   * Renew the current token
   */
  async renewSelf(increment?: string): Promise<TokenInfo> {
    const response = await this.client.post<VaultResponse<TokenInfo>>(
      '/v1/auth/token/renew-self',
      increment ? { increment } : {}
    );
    return response.data.data;
  }

  // ============================================
  // Mount Operations
  // ============================================

  /**
   * List all secret mounts
   */
  async listMounts(): Promise<MountsResponse> {
    const response = await this.client.get<VaultResponse<MountsResponse>>(
      '/v1/sys/mounts'
    );
    return response.data.data;
  }

  /**
   * Get KV secret mounts only (v1 and v2)
   */
  async getKVMounts(): Promise<Record<string, { type: string; version: string }>> {
    const mounts = await this.listMounts();
    const kvMounts: Record<string, { type: string; version: string }> = {};

    Object.entries(mounts).forEach(([path, mount]) => {
      if (mount.type === 'kv') {
        const version = mount.options?.version || '1';
        kvMounts[path] = { type: 'kv', version };
      }
    });

    return kvMounts;
  }

  // ============================================
  // KV v2 Operations
  // ============================================

  /**
   * List secrets at a path (supports both KV v1 and v2)
   * Tries v2 API first, falls back to v1 if route not found
   */
  async kvList(mount: string, path: string = ''): Promise<string[]> {
    const normalizedPath = normalizePath(path);

    // Try KV v2 API first
    const v2Url = `/v1/${mount}/metadata/${normalizedPath}`;
    try {
      const response = await this.client.get<VaultResponse<KVListResponse>>(v2Url, {
        params: { list: true },
      });
      return response.data.data.keys;
    } catch (error) {
      // If v2 route not found, try v1 API
      if (error instanceof NotFoundError) {
        const errorMessage = (error as NotFoundError).message || '';
        if (errorMessage.includes('no handler for route')) {
          // This is a KV v1 mount - use v1 API
          return this.kvListV1(mount, normalizedPath);
        }
        // Path doesn't exist in v2 mount
        return [];
      }
      throw error;
    }
  }

  /**
   * List secrets at a path (KV v1)
   */
  private async kvListV1(mount: string, path: string): Promise<string[]> {
    const url = `/v1/${mount}/${path}`;

    try {
      const response = await this.client.get<VaultResponse<KVListResponse>>(url, {
        params: { list: true },
      });
      return response.data.data.keys;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Read a secret (KV v2)
   */
  async kvRead(mount: string, path: string, version?: number): Promise<KVSecret> {
    const normalizedPath = normalizePath(path);
    const url = `/v1/${mount}/data/${normalizedPath}`;
    const params = version ? { version } : {};

    const response = await this.client.get<VaultResponse<KVSecret>>(url, { params });
    return response.data.data;
  }

  /**
   * Write a secret (KV v2)
   */
  async kvWrite(
    mount: string,
    path: string,
    data: Record<string, unknown>,
    cas?: number
  ): Promise<KVSecret> {
    const normalizedPath = normalizePath(path);
    const url = `/v1/${mount}/data/${normalizedPath}`;
    const body: { data: Record<string, unknown>; options?: { cas: number } } = { data };

    if (cas !== undefined) {
      body.options = { cas };
    }

    const response = await this.client.post<VaultResponse<KVSecret>>(url, body);
    return response.data.data;
  }

  /**
   * Delete a secret (soft delete, KV v2)
   */
  async kvDelete(mount: string, path: string, versions?: number[]): Promise<void> {
    const normalizedPath = normalizePath(path);

    if (versions && versions.length > 0) {
      // Delete specific versions
      await this.client.post(`/v1/${mount}/delete/${normalizedPath}`, { versions });
    } else {
      // Delete latest version
      await this.client.delete(`/v1/${mount}/data/${normalizedPath}`);
    }
  }

  /**
   * Permanently delete secret versions (KV v2)
   */
  async kvDestroy(mount: string, path: string, versions: number[]): Promise<void> {
    const normalizedPath = normalizePath(path);
    await this.client.post(`/v1/${mount}/destroy/${normalizedPath}`, { versions });
  }

  /**
   * Read secret metadata (KV v2)
   */
  async kvReadMetadata(mount: string, path: string): Promise<KVMetadata> {
    const normalizedPath = normalizePath(path);
    const url = `/v1/${mount}/metadata/${normalizedPath}`;

    const response = await this.client.get<VaultResponse<KVMetadata>>(url);
    return response.data.data;
  }

  /**
   * Delete all versions and metadata (KV v2)
   */
  async kvDeleteMetadata(mount: string, path: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    await this.client.delete(`/v1/${mount}/metadata/${normalizedPath}`);
  }

  /**
   * Undelete soft-deleted versions (KV v2)
   */
  async kvUndelete(mount: string, path: string, versions: number[]): Promise<void> {
    const normalizedPath = normalizePath(path);
    await this.client.post(`/v1/${mount}/undelete/${normalizedPath}`, { versions });
  }
}

// Singleton instance management
let clientInstance: VaultClient | null = null;

export function createVaultClient(config: VaultClientConfig): VaultClient {
  clientInstance = new VaultClient(config);
  return clientInstance;
}

export function getVaultClient(): VaultClient | null {
  return clientInstance;
}

export function clearVaultClient(): void {
  clientInstance = null;
}
