import Anthropic from '@anthropic-ai/sdk';
import type { Response } from 'express';
import type { ChatMessage, StreamEvent, ToolContext, AnthropicToolResult } from './types.js';
import { getNativeTools, executeNativeTool } from './tools/native-vault.js';

const SYSTEM_PROMPT = `You are a helpful assistant for HashiCorp Vault. You help users manage secrets, PKI certificates, and Vault operations.

Guidelines:
- Explain what you're doing before using a tool
- After reading a secret, summarize keys present but DO NOT reveal values unless explicitly asked
- If an operation fails, explain the error and suggest solutions
- Be concise but helpful

Response Formatting:
- Use ## headers to organize major sections of your response
- Use ### for subsections when needed
- Use bullet lists (- item) for listing related items or features
- Use numbered lists (1. step) for sequential instructions or steps
- Use **bold** for important terms, values, and key information
- Use \`inline code\` for paths, commands, mount names, and technical terms
- Use tables (| Col1 | Col2 |) when comparing options or showing structured data
- Use code blocks with language labels for multi-line code or JSON
- Keep paragraphs short (2-3 sentences max) for easy scanning
- Add horizontal rules (---) between major sections when appropriate

Tool Parameter Reference:
- mount: secrets engine path (e.g., "secret", "kv", "team/api-keys")
- path: path within the mount (e.g., "myapp/config")

KV Secrets:
- write_secret: {mount, path, data: {key1: val1, key2: val2}}
- read_secret: {mount, path}
- delete_secret: {mount, path}
- list_secrets: {mount, path}

Mounts:
- create_mount: {path, type: "kv-v2"|"pki", description?, config?: {default_lease_ttl?, max_lease_ttl?}}
- delete_mount: {path}
- list_mounts: {}

PKI:
- enable_pki: {path, description?, config?: {max_lease_ttl?}}
- create_pki_issuer: {mount, issuer_name, type: "internal"|"exported", common_name, ttl?, key_type?, key_bits?}
- create_pki_role: {mount, name, allowed_domains: [...], allow_subdomains?, max_ttl?, ttl?}
- issue_pki_certificate: {mount, role, common_name, ttl?, alt_names?: [...]}
- list_pki_issuers: {mount}
- list_pki_roles: {mount}`;

// Send SSE event to client
function sendEvent(res: Response, event: StreamEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// Process a chat message with Claude and stream the response
export async function processChat(
  message: string,
  history: ChatMessage[],
  ctx: ToolContext,
  res: Response
): Promise<void> {
  const anthropic = new Anthropic();

  // Get available tools (native implementation)
  const vaultTools = getNativeTools();
  const tools: Anthropic.Tool[] = vaultTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema as Anthropic.Tool['input_schema'],
  }));

  console.log(`Available tools: ${vaultTools.map((t) => t.name).join(', ')}`);

  // Build messages array from history, filtering out empty messages
  const messages: Anthropic.MessageParam[] = history
    .filter((msg) => msg.content && msg.content.trim() !== '')
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  // Add the new user message
  if (message && message.trim() !== '') {
    messages.push({ role: 'user', content: message });
  } else {
    sendEvent(res, { type: 'error', error: 'Message cannot be empty' });
    sendEvent(res, { type: 'done' });
    return;
  }

  try {
    // Create initial message with streaming
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
      stream: true,
    });

    let fullText = '';
    let toolUseBlocks: Anthropic.ToolUseBlock[] = [];
    let currentToolUse: { id: string; name: string; input: string } | null = null;

    // Process the stream
    for await (const event of response) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'text') {
          // Text block starting
        } else if (event.content_block.type === 'tool_use') {
          currentToolUse = {
            id: event.content_block.id,
            name: event.content_block.name,
            input: '',
          };
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          fullText += event.delta.text;
          sendEvent(res, { type: 'text', content: event.delta.text });
        } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
          currentToolUse.input += event.delta.partial_json;
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolUse) {
          // Parse the accumulated input JSON
          let input: Record<string, unknown> = {};
          try {
            if (currentToolUse.input) {
              input = JSON.parse(currentToolUse.input);
            }
          } catch {
            console.error('Failed to parse tool input:', currentToolUse.input);
          }

          toolUseBlocks.push({
            type: 'tool_use',
            id: currentToolUse.id,
            name: currentToolUse.name,
            input,
          });
          currentToolUse = null;
        }
      }
    }

    // Process tool calls if any
    while (toolUseBlocks.length > 0) {
      const toolResults: AnthropicToolResult[] = [];

      for (const toolUse of toolUseBlocks) {
        // Send tool call event
        sendEvent(res, {
          type: 'tool_call',
          tool_call_id: toolUse.id,
          name: toolUse.name,
          arguments: toolUse.input as Record<string, unknown>,
        });

        // Execute the tool using native implementation
        const result = await executeNativeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          ctx
        );

        // Send tool result event
        sendEvent(res, {
          type: 'tool_result',
          tool_call_id: toolUse.id,
          name: toolUse.name,
          result: result.success ? result.data : { error: result.error },
        });

        // Prepare result for Claude
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result.success ? result.data : { error: result.error }),
          is_error: !result.success,
        });
      }

      // Add assistant message with tool uses
      messages.push({
        role: 'assistant',
        content: [
          ...(fullText ? [{ type: 'text' as const, text: fullText }] : []),
          ...toolUseBlocks,
        ],
      });

      // Add tool results
      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Reset for next iteration
      fullText = '';
      toolUseBlocks = [];

      // Continue conversation with tool results
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools,
        messages,
        stream: true,
      });

      // Process the continuation
      for await (const event of response) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            currentToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              input: '',
            };
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            fullText += event.delta.text;
            sendEvent(res, { type: 'text', content: event.delta.text });
          } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
            currentToolUse.input += event.delta.partial_json;
          }
        } else if (event.type === 'content_block_stop') {
          if (currentToolUse) {
            let input: Record<string, unknown> = {};
            try {
              if (currentToolUse.input) {
                input = JSON.parse(currentToolUse.input);
              }
            } catch {
              console.error('Failed to parse tool input:', currentToolUse.input);
            }

            toolUseBlocks.push({
              type: 'tool_use',
              id: currentToolUse.id,
              name: currentToolUse.name,
              input,
            });
            currentToolUse = null;
          }
        }
      }
    }

    // Send done event
    sendEvent(res, { type: 'done' });
  } catch (error) {
    console.error('Agent error:', error);
    sendEvent(res, {
      type: 'error',
      error: error instanceof Error ? error.message : 'An error occurred',
    });
    sendEvent(res, { type: 'done' });
  }
}
