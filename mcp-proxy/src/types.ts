// Chat message types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Request from frontend
export interface ChatRequest {
  message: string;
  session_id?: string;
  history?: ChatMessage[];
}

// Stream event types sent to frontend
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

// Vault tool definitions
export interface VaultTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

// Vault tool execution context
export interface ToolContext {
  vaultToken: string;
  vaultAddr: string;
  dockerImage?: string;
}

// Tool execution result
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Anthropic tool types (for type safety)
export interface AnthropicToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AnthropicToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}
