import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/uiStore';
import { useVaultClient } from '@/hooks/useVaultClient';
import { encodeMountPath } from '@/utils/format';
import {
  Key,
  ChevronRight,
  Loader2,
  X,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getMountIcon } from '@/utils/mountIcons';

interface KVMount {
  path: string;
  version: string;
}

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, chatPanelOpen, toggleChatPanel } = useUIStore();
  const client = useVaultClient();
  const [mounts, setMounts] = useState<KVMount[]>([]);
  const [loading, setLoading] = useState(true);
  const [enginesExpanded, setEnginesExpanded] = useState(false);

  useEffect(() => {
    async function loadMounts() {
      if (!client) return;

      try {
        const kvMounts = await client.getKVMounts();
        setMounts(
          Object.entries(kvMounts).map(([path, info]) => ({
            path: path.replace(/\/$/, ''),
            version: info.version,
          }))
        );
      } catch (error) {
        console.error('Failed to load mounts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMounts();
  }, [client]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-sidebar flex-col bg-sidebar-bg text-white',
          'transition-transform duration-300 lg:relative lg:z-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo/Brand */}
        <div className="flex h-header items-center gap-3 border-b border-gray-700 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-vault-purple shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">Vault AI</span>
            <span className="text-xs text-gray-400">Secrets Manager</span>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-white hover:bg-sidebar-hover lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* AI Assistant - Prominent placement */}
          <div className="mb-6">
            <button
              onClick={() => {
                toggleChatPanel();
                setSidebarOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200',
                chatPanelOpen
                  ? 'bg-vault-purple text-white shadow-lg shadow-vault-purple/30'
                  : 'bg-gradient-to-r from-vault-purple/20 to-vault-purple/10 text-white hover:from-vault-purple/30 hover:to-vault-purple/20'
              )}
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                chatPanelOpen ? 'bg-white/20' : 'bg-vault-purple'
              )}>
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">AI Assistant</span>
                <span className="text-xs opacity-70">Ask anything about Vault</span>
              </div>
            </button>
          </div>

          {/* Secrets Engines */}
          <div className="mb-6">
            <button
              onClick={() => setEnginesExpanded((prev) => !prev)}
              className="mb-3 flex w-full items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 transition-colors"
            >
              <span>Secrets Engines</span>
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  enginesExpanded && 'rotate-90'
                )}
              />
            </button>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : mounts.length === 0 ? (
              <p className="px-2 text-sm text-gray-400">No KV mounts found</p>
            ) : enginesExpanded ? (
              <ul className="space-y-1">
                {mounts.map((mount) => {
                  // Encode mount path to handle slashes in mount names (/ -> ~)
                  const encodedPath = encodeMountPath(mount.path);
                  const MountIcon = getMountIcon(mount.path);
                  return (
                    <li key={mount.path}>
                      <NavLink
                        to={`/secrets/${encodedPath}`}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                          isActive(`/secrets/${encodedPath}`)
                            ? 'bg-sidebar-active text-white shadow-md'
                            : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                        )}
                      >
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg',
                          isActive(`/secrets/${encodedPath}`)
                            ? 'bg-vault-purple/30'
                            : 'bg-gray-700'
                        )}>
                          <MountIcon className="h-5 w-5" />
                        </div>
                        <span className="flex-1 truncate font-medium">{mount.path}</span>
                        <span className="shrink-0 rounded-full bg-gray-700 px-2 py-0.5 text-xs font-medium">
                          v{mount.version}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {/* Quick Access */}
          <div>
            <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Quick Access
            </h3>
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/secrets"
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                    location.pathname === '/secrets'
                      ? 'bg-sidebar-active text-white shadow-md'
                      : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    location.pathname === '/secrets'
                      ? 'bg-vault-purple/30'
                      : 'bg-gray-700'
                  )}>
                    <Key className="h-5 w-5" />
                  </div>
                  <span className="font-medium">All Secrets</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-xs text-gray-400">Connected to Vault</p>
          </div>
        </div>
      </aside>
    </>
  );
}
