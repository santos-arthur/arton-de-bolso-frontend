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
      className="flex w-full items-center gap-1 rounded-full border-2 border-red-900 p-1"
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
            className={`flex-1 rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
              active
                ? "bg-red-900 text-olive-50"
                : "text-olive-800 hover:bg-black/5 dark:text-olive-400 dark:hover:bg-white/5"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
