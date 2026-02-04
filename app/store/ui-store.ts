import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface UiState {
  theme: ThemeMode;
  isSidebarCollapsed: boolean;
  setTheme: (theme: ThemeMode) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'light',
  isSidebarCollapsed: false,
  setTheme: (theme) => set({ theme }),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
