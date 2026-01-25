/**
 * Native Vault Tools - Direct HTTP API implementation
 * Replaces the Docker-based vault-mcp-server for Kubernetes compatibility
 */

import type { VaultTool, ToolContext, ToolResult } from '../types.js';

// Tool definitions matching vault-mcp-server
export const VAULT_TOOLS: VaultTool[] = [
  {
    name: 'list_mounts',
    description: 'List all mounted secrets engines in Vault',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_mount',
    description: 'Create a new secrets engine mount',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Mount path (e.g., "secret", "kv")' },
        type: { type: 'string', description: 'Secrets engine type (e.g., "kv-v2", "pki")' },
        description: { type: 'string', description: 'Human-readable description' },
        config: {
          type: 'object',
          description: 'Mount configuration options',
          properties: {
            default_lease_ttl: { type: 'string' },
            max_lease_ttl: { type: 'string' },
          },
        },
      },
      required: ['path', 'type'],
    },
  },
  {
    name: 'delete_mount',
    description: 'Delete a secrets engine mount',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Mount path to delete' },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_secrets',
    description: 'List secrets at a path within a KV secrets engine',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'KV mount path (e.g., "secret")' },
        path: { type: 'string', description: 'Path within the mount (e.g., "myapp/config")' },
      },
      required: ['mount'],
    },
  },
  {
    name: 'read_secret',
    description: 'Read a secret from a KV secrets engine',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'KV mount path' },
        path: { type: 'string', description: 'Secret path within the mount' },
      },
      required: ['mount', 'path'],
    },
  },
  {
    name: 'write_secret',
    description: 'Write a secret to a KV secrets engine',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'KV mount path' },
        path: { type: 'string', description: 'Secret path within the mount' },
        data: {
          type: 'object',
          description: 'Secret data as key-value pairs',
          additionalProperties: true,
        },
      },
      required: ['mount', 'path', 'data'],
    },
  },
  {
    name: 'delete_secret',
    description: 'Delete a secret from a KV secrets engine',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'KV mount path' },
        path: { type: 'string', description: 'Secret path to delete' },
      },
      required: ['mount', 'path'],
    },
  },
  {
    name: 'enable_pki',
    description: 'Enable a PKI secrets engine',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Mount path for PKI engine' },
        description: { type: 'string', description: 'Human-readable description' },
        config: {
          type: 'object',
          properties: {
            max_lease_ttl: { type: 'string', description: 'Maximum TTL for certificates' },
          },
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'create_pki_issuer',
    description: 'Create a PKI issuer (root or intermediate CA)',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'PKI mount path' },
        issuer_name: { type: 'string', description: 'Name for the issuer' },
        type: { type: 'string', enum: ['internal', 'exported'], description: 'Key type' },
        common_name: { type: 'string', description: 'Common name for the CA' },
        ttl: { type: 'string', description: 'TTL for the CA certificate' },
        key_type: { type: 'string', enum: ['rsa', 'ec', 'ed25519'], description: 'Key algorithm' },
        key_bits: { type: 'number', description: 'Key size in bits' },
      },
      required: ['mount', 'issuer_name', 'type', 'common_name'],
    },
  },
  {
    name: 'list_pki_issuers',
    description: 'List PKI issuers',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'PKI mount path' },
      },
      required: ['mount'],
    },
  },
  {
    name: 'read_pki_issuer',
    description: 'Read a PKI issuer',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'PKI mount path' },
        issuer_ref: { type: 'string', description: 'Issuer name or ID' },
      },
      required: ['mount', 'issuer_ref'],
    },
  },
  {
    name: 'create_pki_role',
    description: 'Create a PKI role for issuing certificates',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'PKI mount path' },
        name: { type: 'string', description: 'Role name' },
        allowed_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allowed domains for certificates',
        },
        allow_subdomains: { type: 'boolean', description: 'Allow subdomains' },
        max_ttl: { type: 'string', description: 'Maximum TTL for issued certificates' },
        ttl: { type: 'string', description: 'Default TTL for issued certificates' },
      },
      required: ['mount', 'name', 'allowed_domains'],
    },
  },
  {
    name: 'list_pki_roles',
    description: 'List PKI roles',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'PKI mount path' },
      },
      required: ['mount'],
    },
  },
  {
    name: 'read_pki_role',
    description: 'Read a PKI role configuration',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'PKI mount path' },
        name: { type: 'string', description: 'Role name' },
      },
      required: ['mount', 'name'],
    },
  },
  {
    name: 'delete_pki_role',
    description: 'Delete a PKI role',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'PKI mount path' },
        name: { type: 'string', description: 'Role name to delete' },
      },
      required: ['mount', 'name'],
    },
  },
  {
    name: 'issue_pki_certificate',
    description: 'Issue a certificate from a PKI role',
    input_schema: {
      type: 'object',
      properties: {
        mount: { type: 'string', description: 'PKI mount path' },
        role: { type: 'string', description: 'Role name to use' },
        common_name: { type: 'string', description: 'Common name for the certificate' },
        ttl: { type: 'string', description: 'TTL for the certificate' },
        alt_names: {
          type: 'array',
          items: { type: 'string' },
          description: 'Subject alternative names',
        },
      },
      required: ['mount', 'role', 'common_name'],
    },
  },
];

// Helper to make Vault API requests
async function vaultRequest(
  ctx: ToolContext,
  method: string,
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const url = `${ctx.vaultAddr}/v1/${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'X-Vault-Token': ctx.vaultToken,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data: unknown;

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      const errorData = data as { errors?: string[] };
      return {
        ok: false,
        status: response.status,
        error: errorData.errors?.join(', ') || `HTTP ${response.status}`,
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Normalize mount path (remove trailing slash)
function normalizePath(path: string): string {
  return path.replace(/\/+$/, '');
}

// Tool implementations
async function listMounts(ctx: ToolContext): Promise<ToolResult> {
  const result = await vaultRequest(ctx, 'GET', 'sys/mounts');

  if (!result.ok) {
    return { success: false, error: `Failed to list mounts: ${result.error}` };
  }

  // Vault API returns mounts in result.data.data (nested data wrapper)
  const response = result.data as { data?: Record<string, unknown> };
  const mountsData = response.data || response;  // Handle both wrapped and unwrapped responses

  const mounts = Object.entries(mountsData)
    .filter(([, config]) => config !== null && typeof config === 'object')
    .map(([name, config]) => {
      const cfg = config as Record<string, unknown>;
      return {
        name,
        type: cfg.type,
        description: cfg.description || '',
        default_lease_ttl: (cfg.config as Record<string, unknown>)?.default_lease_ttl || 0,
        max_lease_ttl: (cfg.config as Record<string, unknown>)?.max_lease_ttl || 0,
      };
    });

  return { success: true, data: mounts };
}

async function createMount(
  ctx: ToolContext,
  args: { path: string; type: string; description?: string; config?: Record<string, unknown> }
): Promise<ToolResult> {
  const path = normalizePath(args.path);
  const body = {
    type: args.type,
    description: args.description || '',
    config: args.config || {},
  };

  // For KV v2, set the version option
  if (args.type === 'kv-v2' || args.type === 'kv') {
    body.type = 'kv';
    (body as Record<string, unknown>).options = { version: '2' };
  }

  const result = await vaultRequest(ctx, 'POST', `sys/mounts/${path}`, body);

  if (!result.ok) {
    return { success: false, error: `Failed to create mount: ${result.error}` };
  }

  return { success: true, data: { message: `Mount '${path}' created successfully` } };
}

async function deleteMount(ctx: ToolContext, args: { path: string }): Promise<ToolResult> {
  const path = normalizePath(args.path);
  const result = await vaultRequest(ctx, 'DELETE', `sys/mounts/${path}`);

  if (!result.ok) {
    return { success: false, error: `Failed to delete mount: ${result.error}` };
  }

  return { success: true, data: { message: `Mount '${path}' deleted successfully` } };
}

async function listSecrets(
  ctx: ToolContext,
  args: { mount: string; path?: string }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const path = args.path ? normalizePath(args.path) : '';
  const fullPath = path ? `${mount}/metadata/${path}` : `${mount}/metadata`;

  const result = await vaultRequest(ctx, 'LIST', fullPath);

  if (!result.ok) {
    if (result.status === 404) {
      return { success: true, data: { keys: [] } };
    }
    return { success: false, error: `Failed to list secrets: ${result.error}` };
  }

  const data = result.data as { data?: { keys?: string[] } };
  return { success: true, data: { keys: data.data?.keys || [] } };
}

async function readSecret(
  ctx: ToolContext,
  args: { mount: string; path: string }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const path = normalizePath(args.path);

  const result = await vaultRequest(ctx, 'GET', `${mount}/data/${path}`);

  if (!result.ok) {
    return { success: false, error: `Failed to read secret: ${result.error}` };
  }

  const data = result.data as { data?: { data?: Record<string, unknown>; metadata?: unknown } };
  return {
    success: true,
    data: {
      data: data.data?.data || {},
      metadata: data.data?.metadata,
    },
  };
}

async function writeSecret(
  ctx: ToolContext,
  args: { mount: string; path: string; data: Record<string, unknown> }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const path = normalizePath(args.path);

  // Check if secret is soft-deleted and undelete if needed
  await undeleteIfNeeded(ctx, mount, path);

  const result = await vaultRequest(ctx, 'POST', `${mount}/data/${path}`, {
    data: args.data,
  });

  if (!result.ok) {
    return { success: false, error: `Failed to write secret: ${result.error}` };
  }

  return { success: true, data: { message: `Secret written to '${mount}/${path}'` } };
}

async function undeleteIfNeeded(ctx: ToolContext, mount: string, path: string): Promise<void> {
  try {
    const metaResult = await vaultRequest(ctx, 'GET', `${mount}/metadata/${path}`);
    if (!metaResult.ok) return;

    const metadata = metaResult.data as {
      data?: { current_version?: number; versions?: Record<string, { deletion_time?: string }> };
    };

    const currentVersion = metadata.data?.current_version;
    const versions = metadata.data?.versions;

    if (!currentVersion || !versions) return;

    const versionData = versions[String(currentVersion)];
    if (versionData?.deletion_time) {
      await vaultRequest(ctx, 'POST', `${mount}/undelete/${path}`, {
        versions: [currentVersion],
      });
    }
  } catch {
    // Ignore errors - this is just a workaround
  }
}

async function deleteSecret(
  ctx: ToolContext,
  args: { mount: string; path: string }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const path = normalizePath(args.path);

  const result = await vaultRequest(ctx, 'DELETE', `${mount}/data/${path}`);

  if (!result.ok) {
    return { success: false, error: `Failed to delete secret: ${result.error}` };
  }

  return { success: true, data: { message: `Secret '${mount}/${path}' deleted` } };
}

async function enablePki(
  ctx: ToolContext,
  args: { path: string; description?: string; config?: { max_lease_ttl?: string } }
): Promise<ToolResult> {
  const path = normalizePath(args.path);
  const body = {
    type: 'pki',
    description: args.description || 'PKI secrets engine',
    config: args.config || {},
  };

  const result = await vaultRequest(ctx, 'POST', `sys/mounts/${path}`, body);

  if (!result.ok) {
    return { success: false, error: `Failed to enable PKI: ${result.error}` };
  }

  return { success: true, data: { message: `PKI enabled at '${path}'` } };
}

async function createPkiIssuer(
  ctx: ToolContext,
  args: {
    mount: string;
    issuer_name: string;
    type: 'internal' | 'exported';
    common_name: string;
    ttl?: string;
    key_type?: string;
    key_bits?: number;
  }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const body: Record<string, unknown> = {
    common_name: args.common_name,
    issuer_name: args.issuer_name,
    ttl: args.ttl || '87600h',
    key_type: args.key_type || 'rsa',
    key_bits: args.key_bits || 2048,
  };

  const endpoint = args.type === 'internal' ? 'root/generate/internal' : 'root/generate/exported';
  const result = await vaultRequest(ctx, 'POST', `${mount}/${endpoint}`, body);

  if (!result.ok) {
    return { success: false, error: `Failed to create PKI issuer: ${result.error}` };
  }

  return { success: true, data: result.data };
}

async function listPkiIssuers(ctx: ToolContext, args: { mount: string }): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const result = await vaultRequest(ctx, 'LIST', `${mount}/issuers`);

  if (!result.ok) {
    if (result.status === 404) {
      return { success: true, data: { keys: [] } };
    }
    return { success: false, error: `Failed to list PKI issuers: ${result.error}` };
  }

  const data = result.data as { data?: { keys?: string[] } };
  return { success: true, data: { keys: data.data?.keys || [] } };
}

async function readPkiIssuer(
  ctx: ToolContext,
  args: { mount: string; issuer_ref: string }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const result = await vaultRequest(ctx, 'GET', `${mount}/issuer/${args.issuer_ref}`);

  if (!result.ok) {
    return { success: false, error: `Failed to read PKI issuer: ${result.error}` };
  }

  return { success: true, data: result.data };
}

async function createPkiRole(
  ctx: ToolContext,
  args: {
    mount: string;
    name: string;
    allowed_domains: string[];
    allow_subdomains?: boolean;
    max_ttl?: string;
    ttl?: string;
  }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const body = {
    allowed_domains: args.allowed_domains,
    allow_subdomains: args.allow_subdomains ?? true,
    max_ttl: args.max_ttl || '72h',
    ttl: args.ttl || '24h',
  };

  const result = await vaultRequest(ctx, 'POST', `${mount}/roles/${args.name}`, body);

  if (!result.ok) {
    return { success: false, error: `Failed to create PKI role: ${result.error}` };
  }

  return { success: true, data: { message: `PKI role '${args.name}' created` } };
}

async function listPkiRoles(ctx: ToolContext, args: { mount: string }): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const result = await vaultRequest(ctx, 'LIST', `${mount}/roles`);

  if (!result.ok) {
    if (result.status === 404) {
      return { success: true, data: { keys: [] } };
    }
    return { success: false, error: `Failed to list PKI roles: ${result.error}` };
  }

  const data = result.data as { data?: { keys?: string[] } };
  return { success: true, data: { keys: data.data?.keys || [] } };
}

async function readPkiRole(
  ctx: ToolContext,
  args: { mount: string; name: string }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const result = await vaultRequest(ctx, 'GET', `${mount}/roles/${args.name}`);

  if (!result.ok) {
    return { success: false, error: `Failed to read PKI role: ${result.error}` };
  }

  return { success: true, data: result.data };
}

async function deletePkiRole(
  ctx: ToolContext,
  args: { mount: string; name: string }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const result = await vaultRequest(ctx, 'DELETE', `${mount}/roles/${args.name}`);

  if (!result.ok) {
    return { success: false, error: `Failed to delete PKI role: ${result.error}` };
  }

  return { success: true, data: { message: `PKI role '${args.name}' deleted` } };
}

async function issuePkiCertificate(
  ctx: ToolContext,
  args: {
    mount: string;
    role: string;
    common_name: string;
    ttl?: string;
    alt_names?: string[];
  }
): Promise<ToolResult> {
  const mount = normalizePath(args.mount);
  const body: Record<string, unknown> = {
    common_name: args.common_name,
  };

  if (args.ttl) body.ttl = args.ttl;
  if (args.alt_names?.length) body.alt_names = args.alt_names.join(',');

  const result = await vaultRequest(ctx, 'POST', `${mount}/issue/${args.role}`, body);

  if (!result.ok) {
    return { success: false, error: `Failed to issue certificate: ${result.error}` };
  }

  return { success: true, data: result.data };
}

// Main tool execution function
export async function executeNativeTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  console.log(`Executing native tool: ${toolName}`, JSON.stringify(args));

  switch (toolName) {
    case 'list_mounts':
      return listMounts(ctx);
    case 'create_mount':
      return createMount(ctx, args as Parameters<typeof createMount>[1]);
    case 'delete_mount':
      return deleteMount(ctx, args as Parameters<typeof deleteMount>[1]);
    case 'list_secrets':
      return listSecrets(ctx, args as Parameters<typeof listSecrets>[1]);
    case 'read_secret':
      return readSecret(ctx, args as Parameters<typeof readSecret>[1]);
    case 'write_secret':
      return writeSecret(ctx, args as Parameters<typeof writeSecret>[1]);
    case 'delete_secret':
      return deleteSecret(ctx, args as Parameters<typeof deleteSecret>[1]);
    case 'enable_pki':
      return enablePki(ctx, args as Parameters<typeof enablePki>[1]);
    case 'create_pki_issuer':
      return createPkiIssuer(ctx, args as Parameters<typeof createPkiIssuer>[1]);
    case 'list_pki_issuers':
      return listPkiIssuers(ctx, args as Parameters<typeof listPkiIssuers>[1]);
    case 'read_pki_issuer':
      return readPkiIssuer(ctx, args as Parameters<typeof readPkiIssuer>[1]);
    case 'create_pki_role':
      return createPkiRole(ctx, args as Parameters<typeof createPkiRole>[1]);
    case 'list_pki_roles':
      return listPkiRoles(ctx, args as Parameters<typeof listPkiRoles>[1]);
    case 'read_pki_role':
      return readPkiRole(ctx, args as Parameters<typeof readPkiRole>[1]);
    case 'delete_pki_role':
      return deletePkiRole(ctx, args as Parameters<typeof deletePkiRole>[1]);
    case 'issue_pki_certificate':
      return issuePkiCertificate(ctx, args as Parameters<typeof issuePkiCertificate>[1]);
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// Get all available tools
export function getNativeTools(): VaultTool[] {
  return VAULT_TOOLS;
}
