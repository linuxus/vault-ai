import { User, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ChatMessage as ChatMessageType } from '@/types/mcp';
import { ToolCallDisplay } from './ToolCallDisplay';
import { FormattedMessage } from './FormattedMessage';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-4',
        isUser
          ? 'bg-white'
          : 'bg-gradient-to-r from-gray-50 to-white'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm',
          isUser
            ? 'bg-vault-purple text-white'
            : 'bg-gradient-to-br from-vault-purple to-vault-purple-dark text-white'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className={cn(
            'text-xs font-semibold',
            isUser ? 'text-gray-600' : 'text-vault-purple'
          )}>
            {isUser ? 'You' : 'Vault AI'}
          </span>
          {!isUser && (
            <span className="rounded-full bg-vault-purple/10 px-2 py-0.5 text-[10px] font-medium text-vault-purple">
              Assistant
            </span>
          )}
        </div>

        {/* Tool calls displayed above text response */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-3 space-y-2">
            {message.toolCalls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}

        {message.content && (
          isUser ? (
            <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800">
              {message.content}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <FormattedMessage content={message.content} />
            </div>
          )
        )}
      </div>
    </div>
  );
}
