"use client";

import { ThemeSwitcher } from "../components/theme-switcher";
import { useFoundry } from "../lib/foundry-provider";

export default function Page() {
  const { logout } = useFoundry();

  return (
    <div className="flex flex-col gap-4 py-6 text-olive-800 dark:text-olive-400">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide opacity-70">
          Tema
        </span>
        <ThemeSwitcher />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide opacity-70">
          Conta
        </span>
        <button
          type="button"
          onClick={() => logout()}
          className="w-fit rounded-full border-2 border-red-900 px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
