/**
 * Base Vault API response wrapper
 */
export interface VaultResponse<T> {
  request_id: string;
  lease_id?: string;
  renewable?: boolean;
  lease_duration?: number;
  data: T;
  wrap_info?: WrapInfo;
  warnings?: string[];
  auth?: AuthInfo;
}

export interface WrapInfo {
  token: string;
  accessor: string;
  ttl: number;
  creation_time: string;
  creation_path: string;
}

export interface AuthInfo {
  client_token: string;
  accessor: string;
  policies: string[];
  token_policies: string[];
  metadata?: Record<string, string>;
  lease_duration: number;
  renewable: boolean;
  entity_id: string;
  token_type: string;
  orphan: boolean;
}

/**
 * Token lookup response
 */
export interface TokenInfo {
  accessor: string;
  creation_time: number;
  creation_ttl: number;
  display_name: string;
  entity_id: string;
  expire_time: string | null;
  explicit_max_ttl: number;
  id: string;
  issue_time: string;
  meta: Record<string, string> | null;
  num_uses: number;
  orphan: boolean;
  path: string;
  policies: string[];
  renewable: boolean;
  ttl: number;
  type: string;
}

/**
 * Secret mount (engine) information
 */
export interface SecretMount {
  type: string;
  description: string;
  accessor: string;
  config: MountConfig;
  options: Record<string, string> | null;
  local: boolean;
  seal_wrap: boolean;
  external_entropy_access: boolean;
  uuid: string;
}

export interface MountConfig {
  default_lease_ttl: number;
  max_lease_ttl: number;
  force_no_cache: boolean;
}

/**
 * KV v2 secret data
 */
export interface KVSecret {
  data: Record<string, unknown>;
  metadata: KVSecretMetadata;
}

export interface KVSecretMetadata {
  created_time: string;
  custom_metadata: Record<string, string> | null;
  deletion_time: string;
  destroyed: boolean;
  version: number;
}

/**
 * KV v2 metadata (for a path, includes version history)
 */
export interface KVMetadata {
  cas_required: boolean;
  created_time: string;
  current_version: number;
  custom_metadata: Record<string, string> | null;
  delete_version_after: string;
  max_versions: number;
  oldest_version: number;
  updated_time: string;
  versions: Record<string, KVVersionInfo>;
}

export interface KVVersionInfo {
  created_time: string;
  deletion_time: string;
  destroyed: boolean;
}

/**
 * KV list response (keys)
 */
export interface KVListResponse {
  keys: string[];
}

/**
 * Mounts list response
 */
export type MountsResponse = Record<string, SecretMount>;
