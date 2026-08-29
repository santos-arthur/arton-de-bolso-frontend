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
export type Palette = "olive" | "neutral" | "slate";
export type Accent = "red" | "amber" | "green" | "cyan" | "blue" | "purple" | "pink";
type ResolvedTheme = "light" | "dark";

export const PALETTES: Palette[] = ["olive", "neutral", "slate"];
// Na ordem do círculo cromático — a mesma do globals.css e do seletor.
export const ACCENTS: Accent[] = ["red", "amber", "green", "cyan", "blue", "purple", "pink"];

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  palette: Palette;
  setPalette: (palette: Palette) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Cada preferência de aparência é um store externo mínimo: mantém o
 * useSyncExternalStore hidratando com um valor consistente entre servidor e
 * cliente (o padrão), corrigindo para o valor real do localStorage logo após
 * a hidratação, sem os re-renders em cascata de um setState dentro de efeito.
 *
 * Os três padrões daqui repetem o que o `:root` do globals.css pinta e o que o
 * script inline do <head> assume — os quatro lugares precisam concordar, ou o
 * app troca de cara no meio da hidratação.
 */
function createPreference<T extends string>(key: string, fallback: T, valid: readonly T[]) {
  function read(): T {
    try {
      const stored = localStorage.getItem(key);
      return valid.includes(stored as T) ? (stored as T) : fallback;
    } catch {
      return fallback;
    }
  }

  let current: T = typeof window === "undefined" ? fallback : read();
  const listeners = new Set<() => void>();

  return {
    subscribe(onChange: () => void) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    getSnapshot: () => current,
    getServerSnapshot: () => fallback,
    write(next: T) {
      current = next;
      try {
        localStorage.setItem(key, next);
      } catch {
        // localStorage indisponível — a escolha não persiste entre sessões.
      }
      listeners.forEach((listener) => listener());
    },
  };
}

const themeStore = createPreference<Theme>("theme", "system", ["light", "dark", "system"]);
const paletteStore = createPreference<Palette>("palette", "olive", PALETTES);
const accentStore = createPreference<Accent>("accent", "red", ACCENTS);

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

function applyAppearance(resolved: ResolvedTheme, palette: Palette, accent: Accent) {
  const html = document.documentElement;
  html.setAttribute("data-theme", resolved);
  html.setAttribute("data-palette", palette);
  html.setAttribute("data-accent", accent);

  // O `themeColor` declarado no layout segue o tema do *sistema* e só conhece
  // a paleta Olive; quando a escolha aqui diverge (claro num aparelho escuro,
  // ou Slate no lugar de Olive), o topo da tela destoa do app. A cor sai do
  // próprio CSS pra não existir um segundo lugar guardando `--superficie`.
  const cor = getComputedStyle(html).getPropertyValue("--superficie").trim();
  if (!cor) return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = cor;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );

  const palette = useSyncExternalStore(
    paletteStore.subscribe,
    paletteStore.getSnapshot,
    paletteStore.getServerSnapshot,
  );

  const accent = useSyncExternalStore(
    accentStore.subscribe,
    accentStore.getSnapshot,
    accentStore.getServerSnapshot,
  );

  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getServerSystemThemeSnapshot,
  );

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  // Mantém os atributos do <html> em dia com o que foi escolhido. O flash
  // inicial já é evitado pelo script inline no <head>; este efeito cobre
  // trocas subsequentes (clique num seletor, mudança do SO, remount do
  // Strict Mode).
  useLayoutEffect(() => {
    applyAppearance(resolvedTheme, palette, accent);
  }, [resolvedTheme, palette, accent]);

  const setTheme = useCallback((next: Theme) => themeStore.write(next), []);
  const setPalette = useCallback((next: Palette) => paletteStore.write(next), []);
  const setAccent = useCallback((next: Accent) => accentStore.write(next), []);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, palette, setPalette, accent, setAccent }}
    >
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
