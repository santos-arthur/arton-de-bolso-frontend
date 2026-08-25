import { type ReactNode } from "react";

/** Espaçamento padrão do conteúdo de qualquer aba da ficha. */
export default function PaginaFicha({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 py-6 text-olive-800 dark:text-olive-400">{children}</div>;
}
