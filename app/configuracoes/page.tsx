import { ThemeSwitcher } from "../components/theme-switcher";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 p-6 text-olive-800 dark:text-olive-400">
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
