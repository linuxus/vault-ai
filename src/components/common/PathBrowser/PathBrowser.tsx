import { cn } from '@/utils/cn';
import { isFolder } from '@/utils/format';
import { Folder, FileKey, ChevronRight, Loader2 } from 'lucide-react';

export interface PathItem {
  name: string;
  isFolder: boolean;
}

interface PathBrowserProps {
  items: PathItem[];
  loading?: boolean;
  onNavigate: (item: PathItem) => void;
  className?: string;
  emptyMessage?: string;
}

export function PathBrowser({
  items,
  loading,
  onNavigate,
  className,
  emptyMessage = 'No items found',
}: PathBrowserProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn('py-8 text-center text-gray-500', className)}>
        {emptyMessage}
      </div>
    );
  }

  // Sort: folders first, then alphabetically
  const sortedItems = [...items].sort((a, b) => {
    if (a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={cn('rounded-md border divide-y dark:border-gray-700 dark:divide-gray-700', className)}>
      {sortedItems.map((item) => (
        <button
          key={item.name}
          onClick={() => onNavigate(item)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          {item.isFolder ? (
            <Folder className="h-5 w-5 shrink-0 text-vault-purple" />
          ) : (
            <FileKey className="h-5 w-5 shrink-0 text-gray-400" />
          )}
          <span className="flex-1 truncate text-sm font-medium">
            {item.name.replace(/\/$/, '')}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      ))}
    </div>
  );
}

/**
 * Convert raw Vault keys to PathItem array
 */
export function keysToPathItems(keys: string[]): PathItem[] {
  return keys.map((key) => ({
    name: key,
    isFolder: isFolder(key),
  }));
}
