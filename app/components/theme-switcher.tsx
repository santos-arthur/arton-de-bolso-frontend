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
      className="flex w-full max-w-sm items-center gap-1 rounded-xl border border-borda bg-superficie-alta p-1"
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
            className={`min-h-9 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors ${
              active ? "bg-acento text-white" : "hover:bg-foreground/5"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
