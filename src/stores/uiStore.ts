import { create } from 'zustand';

function getInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('vault-ai-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('vault-ai-theme', theme);
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: 'light' | 'dark';

  // Chat panel
  chatPanelOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  toggleChatPanel: () => void;
  setChatPanelOpen: (open: boolean) => void;
}

const initialTheme = getInitialTheme();
applyThemeClass(initialTheme);

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: initialTheme,
  chatPanelOpen: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setTheme: (theme) => {
    applyThemeClass(theme);
    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      applyThemeClass(next);
      return { theme: next };
    }),

  toggleChatPanel: () =>
    set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),

  setChatPanelOpen: (open) => set({ chatPanelOpen: open }),
}));
