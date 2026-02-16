import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Trash2, MessageSquare, GripHorizontal, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useChatStore } from '@/stores/chatStore';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

const MIN_HEIGHT = 200;
const DEFAULT_HEIGHT = 350;
const MAX_HEIGHT_RATIO = 0.7; // 70% of viewport

export function ChatPanel() {
  const { chatPanelOpen, setChatPanelOpen } = useUIStore();
  const { messages, isStreaming, error, clearChat, restoreChat } = useChatStore();
  const { sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Restore chat on mount
  useEffect(() => {
    restoreChat();
  }, [restoreChat]);

  // Track scroll position to determine if user is near bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 100; // pixels from bottom
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setShouldAutoScroll(isNearBottom);
  }, []);

  // Auto-scroll to bottom when messages change (only if user is near bottom)
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const maxHeight = window.innerHeight * MAX_HEIGHT_RATIO;
      const newHeight = window.innerHeight - e.clientY;
      setHeight(Math.max(MIN_HEIGHT, Math.min(newHeight, maxHeight)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const toggleMaximize = () => {
    if (isMaximized) {
      setHeight(DEFAULT_HEIGHT);
      setIsMaximized(false);
    } else {
      setHeight(window.innerHeight * MAX_HEIGHT_RATIO);
      setIsMaximized(true);
    }
  };

  if (!chatPanelOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      style={{ height: `${height}px` }}
      className="relative flex flex-col border-t-2 border-vault-purple bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute -top-1 left-0 right-0 flex h-3 cursor-ns-resize items-center justify-center transition-colors ${
          isResizing ? 'bg-vault-purple/20' : 'hover:bg-vault-purple/10'
        }`}
      >
        <GripHorizontal className="h-4 w-4 text-gray-400" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-vault-purple">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Vault AI Assistant</h2>
            <p className="text-xs text-gray-500">AI-Powered Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMaximize}
            title={isMaximized ? 'Minimize' : 'Maximize'}
            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            title="Clear chat"
            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setChatPanelOpen(false)}
            title="Close"
            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-md text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-vault-purple/10">
                <MessageSquare className="h-6 w-6 text-vault-purple" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900">
                How can I help you today?
              </h3>
              <p className="mb-4 text-sm text-gray-500">
                Ask me to manage secrets, read values, create new entries, or explain Vault concepts.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'List all mounts',
                  'Show secrets in kv/',
                  'Create a new secret',
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => sendMessage(example)}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-vault-purple hover:bg-vault-purple/5 hover:text-vault-purple"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} isStreaming={isStreaming} />
    </div>
  );
}
