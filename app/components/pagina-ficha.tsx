import { type ReactNode } from "react";

/** Ritmo vertical padrão do conteúdo de qualquer seção da ficha. */
export default function PaginaFicha({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}
