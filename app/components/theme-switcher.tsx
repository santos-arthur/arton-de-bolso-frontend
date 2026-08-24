"use client";

import { useTheme, type Theme } from "../theme-provider";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex items-center gap-1 rounded-full border border-foreground/15 bg-foreground/5 p-1"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
