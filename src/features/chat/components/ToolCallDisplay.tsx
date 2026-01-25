import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Wrench,
  Check,
  Loader2,
  AlertCircle,
  Database,
  Key,
  Shield,
  FileText,
  List,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolCall } from '@/types/mcp';

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

// Tool metadata for better display
const toolMeta: Record<string, { name: string; icon: typeof Wrench; color: string }> = {
  list_mounts: { name: 'List Mounts', icon: Database, color: 'text-blue-600 bg-blue-50' },
  list_secrets: { name: 'List Secrets', icon: List, color: 'text-emerald-600 bg-emerald-50' },
  read_secret: { name: 'Read Secret', icon: Key, color: 'text-amber-600 bg-amber-50' },
  write_secret: { name: 'Write Secret', icon: FileText, color: 'text-violet-600 bg-violet-50' },
  delete_secret: { name: 'Delete Secret', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
  create_mount: { name: 'Create Mount', icon: Database, color: 'text-blue-600 bg-blue-50' },
  delete_mount: { name: 'Delete Mount', icon: Database, color: 'text-red-600 bg-red-50' },
  enable_pki: { name: 'Enable PKI', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  create_pki_issuer: { name: 'Create PKI Issuer', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  list_pki_issuers: { name: 'List PKI Issuers', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  read_pki_issuer: { name: 'Read PKI Issuer', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  create_pki_role: { name: 'Create PKI Role', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  read_pki_role: { name: 'Read PKI Role', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  list_pki_roles: { name: 'List PKI Roles', icon: Shield, color: 'text-purple-600 bg-purple-50' },
  delete_pki_role: { name: 'Delete PKI Role', icon: Shield, color: 'text-red-600 bg-red-50' },
  issue_pki_certificate: { name: 'Issue Certificate', icon: Shield, color: 'text-green-600 bg-green-50' },
};

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const meta = toolMeta[toolCall.name] || {
    name: toolCall.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: Wrench,
    color: 'text-gray-600 bg-gray-50',
  };

  const Icon = meta.icon;

  const StatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 text-blue-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs font-medium">Running</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Complete</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Failed</span>
          </div>
        );
    }
  };

  // Format the result for display
  const formatResult = (result: unknown): string => {
    if (result === null || result === undefined) return 'No data';
    if (typeof result === 'string') return result;
    return JSON.stringify(result, null, 2);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
      >
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', meta.color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="flex-1 text-sm font-medium text-gray-700">{meta.name}</span>
        <StatusIcon />
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-3 space-y-3">
          {Object.keys(toolCall.arguments).length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Parameters
              </div>
              <div className="space-y-1">
                {Object.entries(toolCall.arguments).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-sm">
                    <span className="font-medium text-gray-500">{key}:</span>
                    <span className="font-mono text-xs text-gray-700">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {toolCall.result !== undefined && (
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Result
              </div>
              <pre
                className={cn(
                  'overflow-x-auto rounded-md p-2.5 text-xs font-mono',
                  toolCall.status === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                )}
              >
                {formatResult(toolCall.result)}
              </pre>
            </div>
          )}

          {toolCall.error && (
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-red-400">
                Error
              </div>
              <pre className="overflow-x-auto rounded-md border border-red-200 bg-red-50 p-2.5 text-xs font-mono text-red-700">
                {toolCall.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
