// Chat message types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

// Tool call representation
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

// Stream event types from MCP proxy
export type StreamEventType = 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';

export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  name?: string;
  arguments?: Record<string, unknown>;
  tool_call_id?: string;
  result?: unknown;
  error?: string;
}

// Request payload for chat endpoint
export interface ChatRequest {
  message: string;
  session_id?: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// MCP Client configuration
export interface MCPClientConfig {
  baseUrl: string;
  vaultToken: string;
}

// Callback types for streaming
export interface StreamCallbacks {
  onText?: (text: string) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  onToolResult?: (toolCallId: string, result: unknown) => void;
  onError?: (error: string) => void;
  onDone?: () => void;
}
