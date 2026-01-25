import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import os from 'os';

export interface MCPClientConfig {
  vaultAddr: string;
  vaultToken: string;
  dockerImage?: string;
}

/**
 * Convert localhost/127.0.0.1 addresses to host.docker.internal for Docker compatibility.
 * On macOS and Windows, Docker containers can't use --network=host to access host services,
 * so we need to use the special host.docker.internal DNS name.
 */
function getDockerVaultAddr(vaultAddr: string): string {
  const platform = os.platform();

  // On Linux, --network=host works, so no translation needed
  if (platform === 'linux') {
    return vaultAddr;
  }

  // On macOS and Windows, translate localhost to host.docker.internal
  return vaultAddr
    .replace(/localhost/gi, 'host.docker.internal')
    .replace(/127\.0\.0\.1/g, 'host.docker.internal');
}

export class VaultMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private config: MCPClientConfig;
  private tools: Tool[] = [];

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const dockerImage = this.config.dockerImage || 'hashicorp/vault-mcp-server:latest';
    const platform = os.platform();
    const dockerVaultAddr = getDockerVaultAddr(this.config.vaultAddr);

    console.log(`Platform: ${platform}`);
    console.log(`Original VAULT_ADDR: ${this.config.vaultAddr}`);
    console.log(`Docker VAULT_ADDR: ${dockerVaultAddr}`);

    // Build Docker args - use --network=host on Linux only
    const dockerArgs = [
      'run',
      '-i',
      '--rm',
    ];

    // On Linux, --network=host works properly
    if (platform === 'linux') {
      dockerArgs.push('--network=host');
    }

    dockerArgs.push(
      '-e', `VAULT_ADDR=${dockerVaultAddr}`,
      '-e', `VAULT_TOKEN=${this.config.vaultToken}`,
      dockerImage,
    );

    // Create stdio transport that spawns the Docker container
    this.transport = new StdioClientTransport({
      command: 'docker',
      args: dockerArgs,
    });

    // Create MCP client
    this.client = new Client(
      {
        name: 'vault-ai-proxy',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect to the server
    await this.client.connect(this.transport);

    // Fetch available tools
    const toolsResult = await this.client.listTools();
    this.tools = toolsResult.tools;

    console.log('Connected to vault-mcp server');
    console.log('Available tools:', this.tools.map((t) => t.name).join(', '));
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    this.transport = null;
  }

  getTools(): Tool[] {
    return this.tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name,
        arguments: args,
      });

      // Extract content from the result
      if (result.content && Array.isArray(result.content)) {
        const textContent = result.content.find((c) => c.type === 'text');
        if (textContent && 'text' in textContent) {
          try {
            return JSON.parse(textContent.text);
          } catch {
            return textContent.text;
          }
        }
      }

      return result;
    } catch (error) {
      // Mark connection as dead so it gets recreated
      console.error('Tool call failed, marking connection as dead:', error);
      this.markAsDead();
      throw error;
    }
  }

  isConnected(): boolean {
    return this.client !== null && !this._isDead;
  }

  private _isDead = false;

  markAsDead(): void {
    this._isDead = true;
  }
}

// Connection pool for managing per-token connections
const clientPool = new Map<string, VaultMCPClient>();

export async function getOrCreateClient(config: MCPClientConfig): Promise<VaultMCPClient> {
  const key = `${config.vaultAddr}:${config.vaultToken}`;

  let client = clientPool.get(key);
  if (client && client.isConnected()) {
    return client;
  }

  // Clean up old/dead client if exists
  if (client) {
    console.log('Cleaning up stale connection...');
    try {
      await client.disconnect();
    } catch (e) {
      console.error('Error disconnecting stale client:', e);
    }
    clientPool.delete(key);
  }

  // Create new client
  console.log('Creating new MCP client connection...');
  client = new VaultMCPClient(config);
  await client.connect();
  clientPool.set(key, client);

  return client;
}

export function removeClientFromPool(vaultAddr: string, vaultToken: string): void {
  const key = `${vaultAddr}:${vaultToken}`;
  const client = clientPool.get(key);
  if (client) {
    client.markAsDead();
    clientPool.delete(key);
    console.log('Removed dead client from pool');
  }
}

export async function disconnectClient(vaultAddr: string, vaultToken: string): Promise<void> {
  const key = `${vaultAddr}:${vaultToken}`;
  const client = clientPool.get(key);
  if (client) {
    await client.disconnect();
    clientPool.delete(key);
  }
}
