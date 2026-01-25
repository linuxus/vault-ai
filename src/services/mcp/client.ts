import type {
  MCPClientConfig,
  ChatRequest,
  StreamEvent,
  StreamCallbacks,
  ToolCall,
  ChatMessage,
} from '@/types/mcp';

export class MCPClient {
  private baseUrl: string;
  private vaultToken: string;
  private abortController: AbortController | null = null;

  constructor(config: MCPClientConfig) {
    this.baseUrl = config.baseUrl;
    this.vaultToken = config.vaultToken;
  }

  /**
   * Update the Vault token (e.g., after renewal)
   */
  setVaultToken(token: string): void {
    this.vaultToken = token;
  }

  /**
   * Send a chat message and stream the response
   */
  async sendMessage(
    message: string,
    history: ChatMessage[],
    callbacks: StreamCallbacks
  ): Promise<void> {
    // Create abort controller for this request
    this.abortController = new AbortController();

    // Convert ChatMessage[] to the simpler format for the API
    const historyPayload = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const request: ChatRequest = {
      message,
      history: historyPayload,
    };

    try {
      const response = await fetch(`${this.baseUrl}/mcp/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Vault-Token': this.vaultToken,
        },
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process the SSE stream
      await this.processStream(response.body, callbacks);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't report as error
        return;
      }
      callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
      callbacks.onDone?.();
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Process the SSE stream from the server
   */
  private async processStream(
    body: ReadableStream<Uint8Array>,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Track tool calls for updating with results
    const toolCalls = new Map<string, ToolCall>();

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const event: StreamEvent = JSON.parse(data);
              this.handleEvent(event, callbacks, toolCalls);
            } catch {
              // Ignore invalid JSON
            }
          }
        }
      }

      // Process any remaining data
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        try {
          const event: StreamEvent = JSON.parse(data);
          this.handleEvent(event, callbacks, toolCalls);
        } catch {
          // Ignore invalid JSON
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Handle a single stream event
   */
  private handleEvent(
    event: StreamEvent,
    callbacks: StreamCallbacks,
    toolCalls: Map<string, ToolCall>
  ): void {
    switch (event.type) {
      case 'text':
        if (event.content) {
          callbacks.onText?.(event.content);
        }
        break;

      case 'tool_call':
        if (event.tool_call_id && event.name) {
          const toolCall: ToolCall = {
            id: event.tool_call_id,
            name: event.name,
            arguments: event.arguments || {},
            status: 'pending',
          };
          toolCalls.set(event.tool_call_id, toolCall);
          callbacks.onToolCall?.(toolCall);
        }
        break;

      case 'tool_result':
        if (event.tool_call_id) {
          const toolCall = toolCalls.get(event.tool_call_id);
          if (toolCall) {
            toolCall.status = 'success';
            toolCall.result = event.result;
          }
          callbacks.onToolResult?.(event.tool_call_id, event.result);
        }
        break;

      case 'error':
        callbacks.onError?.(event.error || 'Unknown error');
        break;

      case 'done':
        callbacks.onDone?.();
        break;
    }
  }

  /**
   * Cancel the current request
   */
  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  /**
   * Check if a request is in progress
   */
  isStreaming(): boolean {
    return this.abortController !== null;
  }
}

// Singleton instance management
let clientInstance: MCPClient | null = null;

export function createMCPClient(config: MCPClientConfig): MCPClient {
  clientInstance = new MCPClient(config);
  return clientInstance;
}

export function getMCPClient(): MCPClient | null {
  return clientInstance;
}

export function clearMCPClient(): void {
  clientInstance?.cancel();
  clientInstance = null;
}
