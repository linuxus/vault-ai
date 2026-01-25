import { ReactNode } from 'react';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { Toaster } from '@/components/ui/Toast';
import { ChatPanel } from '@/features/chat/components';
import { useUIStore } from '@/stores/uiStore';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { chatPanelOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Main content area */}
          <main
            className={`flex-1 overflow-y-auto p-4 transition-all duration-300 lg:p-6 ${
              chatPanelOpen ? 'pb-0' : ''
            }`}
          >
            {children}
          </main>
          {/* Chat panel at bottom */}
          <ChatPanel />
        </div>
      </div>
      <Toaster />
    </div>
  );
}
