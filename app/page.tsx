import { ThemeSwitcher } from "./components/theme-switcher";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      Olá
      <ThemeSwitcher />
    </div>
  );
}
