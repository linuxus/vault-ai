import { LogOut, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { formatTTL } from '@/utils/format';

export function Header() {
  const { tokenInfo, logout } = useAuth();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="flex h-header items-center justify-between border-b bg-white px-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {tokenInfo && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{tokenInfo.display_name || 'Token'}</span>
            {tokenInfo.ttl > 0 && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                TTL: {formatTTL(tokenInfo.ttl)}
              </span>
            )}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
