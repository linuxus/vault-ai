/**
 * MCP HTTP Client for vault-mcp-server
 *
 * Communicates with vault-mcp-server via Streamable HTTP transport.
 * Reference: https://modelcontextprotocol.io/legacy/concepts/transports
 */

import type { VaultTool, ToolResult, ToolContext, JsonSchemaProperty } from './types.js';

// MCP JSON-RPC types
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

// Notification (no id field = no response expected)
interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface MCPToolListResult {
  tools: MCPTool[];
}

interface MCPToolCallResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  isError?: boolean;
}

/**
 * MCP HTTP Client for communicating with vault-mcp-server
 */
export class MCPHttpClient {
  private baseUrl: string;
  private endpoint: string;
  private requestId: number = 0;
  private sessionId: string | null = null;

  constructor(baseUrl: string, endpoint: string = '/mcp') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.endpoint = endpoint;
  }

  /**
   * Get the full URL for MCP requests
   */
  private get url(): string {
    return `${this.baseUrl}${this.endpoint}`;
  }

  /**
   * Send a JSON-RPC request to the MCP server
   */
  private async sendRequest(
    method: string,
    params: Record<string, unknown> | undefined,
    vaultToken: string
  ): Promise<JsonRpcResponse> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      ...(params && { params }),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Vault-Token': vaultToken,
    };

    // Include session ID if we have one
    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    console.log(`[MCP] Sending ${method} to ${this.url}`);

    const response = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    // Capture session ID from response
    const sessionId = response.headers.get('Mcp-Session-Id');
    if (sessionId) {
      this.sessionId = sessionId;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`MCP request failed: ${response.status} ${text}`);
    }

    const result = (await response.json()) as JsonRpcResponse;

    if (result.error) {
      throw new Error(`MCP error: ${result.error.message}`);
    }

    return result;
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   */
  private async sendNotification(
    method: string,
    params: Record<string, unknown> | undefined,
    vaultToken: string
  ): Promise<void> {
    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      ...(params && { params }),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Vault-Token': vaultToken,
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    console.log(`[MCP] Sending notification ${method} to ${this.url}`);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(notification),
      });

      // Capture session ID even from notification responses
      const sessionId = response.headers.get('Mcp-Session-Id');
      if (sessionId) {
        this.sessionId = sessionId;
      }

      // Notifications may return 202 Accepted or similar, ignore response body
    } catch (error) {
      console.warn(`[MCP] Notification ${method} failed (non-critical):`, error);
    }
  }

  /**
   * Initialize the MCP session
   */
  async initialize(vaultToken: string): Promise<void> {
    console.log('[MCP] Initializing session...');

    await this.sendRequest(
      'initialize',
      {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        clientInfo: {
          name: 'vault-ai-mcp-proxy',
          version: '1.0.0',
        },
      },
      vaultToken
    );

    // Send initialized notification (no response expected)
    await this.sendNotification('notifications/initialized', undefined, vaultToken);

    console.log('[MCP] Session initialized');
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(vaultToken: string): Promise<VaultTool[]> {
    console.log('[MCP] Listing tools...');

    const response = await this.sendRequest('tools/list', {}, vaultToken);
    const result = response.result as MCPToolListResult;

    const tools: VaultTool[] = result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description || '',
      input_schema: {
        type: 'object' as const,
        properties: (tool.inputSchema.properties || {}) as Record<string, JsonSchemaProperty>,
        required: tool.inputSchema.required,
      },
    }));

    console.log(`[MCP] Found ${tools.length} tools: ${tools.map((t) => t.name).join(', ')}`);

    return tools;
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
    vaultToken: string
  ): Promise<ToolResult> {
    console.log(`[MCP] Calling tool: ${toolName}`, JSON.stringify(args));

    try {
      const response = await this.sendRequest(
        'tools/call',
        {
          name: toolName,
          arguments: args,
        },
        vaultToken
      );

      const result = response.result as MCPToolCallResult;

      // Check if the result indicates an error
      if (result.isError) {
        const errorText = result.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('\n');
        return {
          success: false,
          error: errorText || 'Tool execution failed',
        };
      }

      // Extract text content from result
      const textContent = result.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n');

      // Try to parse as JSON if it looks like JSON
      let data: unknown;
      try {
        data = JSON.parse(textContent);
      } catch {
        data = { message: textContent };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`[MCP] Tool call failed: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Close the MCP session
   */
  async close(): Promise<void> {
    this.sessionId = null;
    console.log('[MCP] Session closed');
  }
}

// Singleton instance for the MCP client
let mcpClient: MCPHttpClient | null = null;
let mcpTools: VaultTool[] | null = null;

/**
 * Get or create the MCP client
 */
export function getMCPClient(): MCPHttpClient {
  if (!mcpClient) {
    const mcpServerUrl =
      process.env.VAULT_MCP_SERVER_URL || 'http://vault-mcp-server.vault-ai.svc.cluster.local:8080';
    const mcpEndpoint = process.env.VAULT_MCP_ENDPOINT || '/mcp';
    mcpClient = new MCPHttpClient(mcpServerUrl, mcpEndpoint);
  }
  return mcpClient;
}

/**
 * Get tools from vault-mcp-server
 */
export async function getMCPTools(ctx: ToolContext): Promise<VaultTool[]> {
  // Cache tools for the session
  if (mcpTools) {
    return mcpTools;
  }

  const client = getMCPClient();

  try {
    // Initialize session if needed
    await client.initialize(ctx.vaultToken);

    // List available tools
    mcpTools = await client.listTools(ctx.vaultToken);
    return mcpTools;
  } catch (error) {
    console.error('[MCP] Failed to get tools from vault-mcp-server:', error);
    // Return empty array - agent will fall back to native tools
    return [];
  }
}

/**
 * Execute a tool via vault-mcp-server
 */
export async function executeMCPTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const client = getMCPClient();

  try {
    return await client.callTool(toolName, args, ctx.vaultToken);
  } catch (error) {
    console.error(`[MCP] Failed to execute tool ${toolName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if vault-mcp-server is available
 */
export async function isMCPServerAvailable(): Promise<boolean> {
  const client = getMCPClient();

  try {
    const response = await fetch(client['url'], {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return response.ok || response.status === 405; // 405 is expected for GET on POST endpoint
  } catch {
    return false;
  }
}

/**
 * Clear cached tools (useful for reconnection)
 */
export function clearMCPCache(): void {
  mcpTools = null;
  if (mcpClient) {
    mcpClient.close();
  }
}
