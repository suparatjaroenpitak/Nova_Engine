import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeConfig } from '@/types';

const DARK_THEME: ThemeConfig = {
  mode: 'dark',
  accent: '#e94560',
  background: '#0a0a1a',
  surface: '#12122a',
  surface2: '#1a1a35',
  text: '#e8e8f0',
  muted: '#6a6a8a',
  border: '#2a2a4a',
  hover: '#1e1e3a',
  active: '#2a2a5a',
};

const LIGHT_THEME: ThemeConfig = {
  mode: 'light',
  accent: '#e94560',
  background: '#f5f5fa',
  surface: '#ffffff',
  surface2: '#eaeaf0',
  text: '#1a1a2e',
  muted: '#8a8aa0',
  border: '#d0d0e0',
  hover: '#e8e8f0',
  active: '#dcdce8',
};

interface ThemeState {
  theme: ThemeConfig;
  isDark: boolean;
  toggleTheme: () => void;
  setDark: () => void;
  setLight: () => void;
  setAccent: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: DARK_THEME,
      isDark: true,

      toggleTheme: () => {
        const isDark = !get().isDark;
        set({ theme: isDark ? DARK_THEME : LIGHT_THEME, isDark });

        document.documentElement.style.setProperty('--nova-bg', isDark ? '#0a0a1a' : '#f5f5fa');
        document.documentElement.style.setProperty('--nova-surface', isDark ? '#12122a' : '#ffffff');
        document.documentElement.style.setProperty('--nova-text', isDark ? '#e8e8f0' : '#1a1a2e');
        document.documentElement.style.setProperty('--nova-muted', isDark ? '#6a6a8a' : '#8a8aa0');
        document.documentElement.style.setProperty('--nova-border', isDark ? '#2a2a4a' : '#d0d0e0');
        document.body.style.background = isDark ? '#0a0a1a' : '#f5f5fa';
        document.body.style.color = isDark ? '#e8e8f0' : '#1a1a2e';
        document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      },

      setDark: () => {
        set({ theme: DARK_THEME, isDark: true });
        document.documentElement.style.colorScheme = 'dark';
      },

      setLight: () => {
        set({ theme: LIGHT_THEME, isDark: false });
        document.documentElement.style.colorScheme = 'light';
      },

      setAccent: (color) => set((s) => ({ theme: { ...s.theme, accent: color } })),
    }),
    { name: 'nova-theme', partialize: (s) => ({ isDark: s.isDark, theme: { accent: s.theme.accent } }) }
  )
);
