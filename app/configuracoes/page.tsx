"use client";

import { ThemeSwitcher } from "../components/theme-switcher";

// "Sair" mora na <BarraPrincipal /> (menu do topo), junto com a navegação
// entre telas — não é repetido aqui.
export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-6 text-olive-800 dark:text-olive-400">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide opacity-70">
          Tema
        </span>
        <ThemeSwitcher />
      </div>
    </div>
  );
}
