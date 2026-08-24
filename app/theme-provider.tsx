"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  } catch {
    return "system";
  }
}

// Store externo mínimo para o tema escolhido: mantém o useSyncExternalStore
// hidratando com um valor consistente entre servidor e cliente ("system"),
// corrigindo para o valor real do localStorage logo após a hidratação, sem
// os re-renders em cascata de um setState dentro de efeito.
let currentTheme: Theme = "system";
const themeListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  currentTheme = readStoredTheme();
}

function subscribeTheme(onChange: () => void) {
  themeListeners.add(onChange);
  return () => themeListeners.delete(onChange);
}

function getThemeSnapshot(): Theme {
  return currentTheme;
}

function getServerThemeSnapshot(): Theme {
  return "system";
}

function writeTheme(next: Theme) {
  currentTheme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // localStorage indisponível — o tema não persiste entre sessões.
  }
  themeListeners.forEach((listener) => listener());
}

function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia(MEDIA_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSystemThemeSnapshot(): ResolvedTheme {
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function getServerSystemThemeSnapshot(): ResolvedTheme {
  return "light";
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getServerSystemThemeSnapshot,
  );

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  // Mantém o atributo do <html> em dia com o tema resolvido. O flash inicial
  // já é evitado pelo script inline no <head>; este efeito cobre trocas
  // subsequentes (clique no switcher, mudança do SO, remount do Strict Mode).
  useLayoutEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    writeTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de <ThemeProvider>");
  }
  return context;
}
