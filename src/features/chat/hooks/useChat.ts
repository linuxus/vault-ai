import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/stores/chatStore';
import { useMCPConnection } from './useMCPConnection';
import type { StreamCallbacks, ToolCall } from '@/types/mcp';

// Tools that modify secrets and should trigger cache invalidation
const WRITE_TOOLS = [
  'write_secret',
  'delete_secret',
  'create_mount',
  'delete_mount',
  'enable_pki',
  'create_pki_issuer',
  'create_pki_role',
  'issue_pki_certificate',
];

export function useChat() {
  const queryClient = useQueryClient();
  const { getClient, isConnected } = useMCPConnection();
  const {
    messages,
    isStreaming,
    addUserMessage,
    addAssistantMessage,
    appendToLastMessage,
    addToolCallToLastMessage,
    updateToolCallResult,
    setStreaming,
    setError,
  } = useChatStore();

  const sendMessage = useCallback(
    async (content: string) => {
      const client = getClient();

      if (!client) {
        setError('Not connected to AI assistant. Please log in.');
        return;
      }

      if (isStreaming) {
        return;
      }

      // Add user message
      addUserMessage(content);

      // Create assistant message placeholder
      addAssistantMessage();

      // Set streaming state
      setStreaming(true);
      setError(null);

      // Track if any write operations occurred for cache invalidation
      let hasWriteOperation = false;

      // Define callbacks for streaming
      const callbacks: StreamCallbacks = {
        onText: (text: string) => {
          appendToLastMessage(text);
        },
        onToolCall: (toolCall: ToolCall) => {
          addToolCallToLastMessage(toolCall);
          // Check if this is a write operation
          if (WRITE_TOOLS.includes(toolCall.name)) {
            hasWriteOperation = true;
          }
        },
        onToolResult: (toolCallId: string, result: unknown) => {
          updateToolCallResult(toolCallId, result);
        },
        onError: (error: string) => {
          setError(error);
        },
        onDone: () => {
          setStreaming(false);
          // Invalidate caches if any write operations occurred
          if (hasWriteOperation) {
            queryClient.invalidateQueries({ queryKey: ['secrets'] });
            queryClient.invalidateQueries({ queryKey: ['secret'] });
            queryClient.invalidateQueries({ queryKey: ['mounts'] });
          }
        },
      };

      // Send message and stream response
      // Pass only previous messages (exclude the current user message and assistant placeholder)
      const historyForRequest = messages.slice(0, -1);

      try {
        await client.sendMessage(content, historyForRequest, callbacks);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to send message');
        setStreaming(false);
      }
    },
    [
      queryClient,
      getClient,
      isStreaming,
      messages,
      addUserMessage,
      addAssistantMessage,
      appendToLastMessage,
      addToolCallToLastMessage,
      updateToolCallResult,
      setStreaming,
      setError,
    ]
  );

  const cancelStream = useCallback(() => {
    const client = getClient();
    if (client) {
      client.cancel();
      setStreaming(false);
    }
  }, [getClient, setStreaming]);

  return {
    sendMessage,
    cancelStream,
    isConnected,
    isStreaming,
  };
}
