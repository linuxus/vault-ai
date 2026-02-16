import { useState } from 'react';
import { cn } from '@/utils/cn';
import { maskValue } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Copy, Eye, EyeOff, Check } from 'lucide-react';

interface SecretViewerProps {
  data: Record<string, unknown>;
  className?: string;
}

export function SecretViewer({ data, className }: SecretViewerProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const copyValue = async (key: string, value: unknown) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <div className={cn('rounded-md border p-4 text-center text-gray-500', className)}>
        No data
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border divide-y dark:border-gray-700 dark:divide-gray-700', className)}>
      {entries.map(([key, value]) => {
        const stringValue = formatValue(value);
        const isVisible = visibleKeys.has(key);
        const isCopied = copiedKey === key;

        return (
          <div key={key} className="flex items-start gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{key}</div>
              <div
                className={cn(
                  'break-all font-mono text-sm',
                  !isVisible && 'text-gray-500'
                )}
              >
                {isVisible ? stringValue : maskValue(stringValue, 3)}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleVisibility(key)}
                title={isVisible ? 'Hide value' : 'Show value'}
              >
                {isVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyValue(key, value)}
                title="Copy value"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
