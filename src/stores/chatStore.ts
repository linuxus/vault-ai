import { create } from 'zustand';
import type { ChatMessage, ToolCall } from '@/types/mcp';

const SESSION_CHAT_KEY = 'vault_chat_messages';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sessionId: string;

  // Actions
  addUserMessage: (content: string) => string;
  addAssistantMessage: () => string;
  appendToLastMessage: (text: string) => void;
  addToolCallToLastMessage: (toolCall: ToolCall) => void;
  updateToolCallResult: (toolCallId: string, result: unknown) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  restoreChat: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function persistMessages(messages: ChatMessage[]): void {
  try {
    // Convert Date objects to ISO strings for storage
    const serializable = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));
    sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore storage errors
  }
}

function loadMessages(): ChatMessage[] {
  try {
    const stored = sessionStorage.getItem(SESSION_CHAT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((msg: ChatMessage & { timestamp: string }) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  error: null,
  sessionId: generateId(),

  addUserMessage: (content: string) => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set((state) => {
      const newMessages = [...state.messages, message];
      persistMessages(newMessages);
      return { messages: newMessages, error: null };
    });

    return id;
  },

  addAssistantMessage: () => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      toolCalls: [],
    };

    set((state) => {
      const newMessages = [...state.messages, message];
      return { messages: newMessages };
    });

    return id;
  },

  appendToLastMessage: (text: string) => {
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMessage,
          content: lastMessage.content + text,
        };
        persistMessages(messages);
        return { messages };
      }

      return state;
    });
  },

  addToolCallToLastMessage: (toolCall: ToolCall) => {
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.role === 'assistant') {
        const toolCalls = [...(lastMessage.toolCalls || []), toolCall];
        messages[messages.length - 1] = {
          ...lastMessage,
          toolCalls,
        };
        persistMessages(messages);
        return { messages };
      }

      return state;
    });
  },

  updateToolCallResult: (toolCallId: string, result: unknown) => {
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.toolCalls) {
        const toolCalls = lastMessage.toolCalls.map((tc) =>
          tc.id === toolCallId ? { ...tc, result, status: 'success' as const } : tc
        );
        messages[messages.length - 1] = {
          ...lastMessage,
          toolCalls,
        };
        persistMessages(messages);
        return { messages };
      }

      return state;
    });
  },

  setStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearChat: () => {
    sessionStorage.removeItem(SESSION_CHAT_KEY);
    set({
      messages: [],
      error: null,
      sessionId: generateId(),
    });
  },

  restoreChat: () => {
    const messages = loadMessages();
    if (messages.length > 0) {
      set({ messages });
    }
  },
}));
