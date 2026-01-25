import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { VaultTool, ToolContext, ToolResult } from '../types.js';
import { getOrCreateClient } from '../mcp-client.js';

/**
 * Workaround for vault-mcp-server bug: undelete a secret before writing.
 * The server panics when writing to a soft-deleted KV v2 secret because
 * it tries to read the current data which is null.
 */
async function undeleteSecretIfNeeded(
  mount: string,
  path: string,
  ctx: ToolContext
): Promise<void> {
  try {
    // First check if the secret exists and is deleted by reading metadata
    const metadataUrl = `${ctx.vaultAddr}/v1/${mount}/metadata/${path}`;
    const metadataRes = await fetch(metadataUrl, {
      headers: { 'X-Vault-Token': ctx.vaultToken },
    });

    if (!metadataRes.ok) {
      // Secret doesn't exist at all, nothing to undelete
      return;
    }

    const metadata = await metadataRes.json();
    const currentVersion = metadata.data?.current_version;
    const versions = metadata.data?.versions;

    if (!currentVersion || !versions) {
      return;
    }

    // Check if current version is deleted
    const currentVersionData = versions[String(currentVersion)];
    if (currentVersionData?.deletion_time) {
      console.log(`Secret ${mount}/${path} is deleted, undeleting version ${currentVersion}...`);

      // Undelete the current version
      const undeleteUrl = `${ctx.vaultAddr}/v1/${mount}/undelete/${path}`;
      const undeleteRes = await fetch(undeleteUrl, {
        method: 'POST',
        headers: {
          'X-Vault-Token': ctx.vaultToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ versions: [currentVersion] }),
      });

      if (undeleteRes.ok) {
        console.log(`Successfully undeleted secret ${mount}/${path}`);
      } else {
        console.warn(`Failed to undelete secret: ${undeleteRes.status}`);
      }
    }
  } catch (error) {
    // Ignore errors - this is just a workaround
    console.warn('Error in undelete workaround:', error);
  }
}

// Convert MCP tools to Anthropic tool format
export function convertMCPToolsToAnthropic(mcpTools: Tool[]): VaultTool[] {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description || '',
    input_schema: tool.inputSchema as VaultTool['input_schema'],
  }));
}

// Execute a tool via MCP client
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  try {
    const client = await getOrCreateClient({
      vaultAddr: ctx.vaultAddr,
      vaultToken: ctx.vaultToken,
      dockerImage: ctx.dockerImage,
    });

    console.log(`Executing ${toolName} with args:`, JSON.stringify(args));

    // Workaround for vault-mcp-server bug: undelete secret before writing
    if (toolName === 'write_secret') {
      const mount = args.mount as string;
      const path = args.path as string;
      if (mount && path) {
        await undeleteSecretIfNeeded(mount, path, ctx);
      }
    }

    // Route all tool calls to the MCP server
    const result = await client.callTool(toolName, args);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Get all available tools from MCP server
export async function getAllTools(ctx: ToolContext): Promise<VaultTool[]> {
  try {
    const client = await getOrCreateClient({
      vaultAddr: ctx.vaultAddr,
      vaultToken: ctx.vaultToken,
      dockerImage: ctx.dockerImage,
    });

    const mcpTools = client.getTools();
    return convertMCPToolsToAnthropic(mcpTools);
  } catch (error) {
    console.error('Failed to get MCP tools:', error);
    return [];
  }
}
