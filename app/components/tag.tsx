import { type ReactNode } from "react";

/** Etiqueta discreta usada em atributos, poderes, magias e itens. */
export default function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-borda px-2 py-0.5 text-[11px] font-semibold opacity-80">
      {children}
    </span>
  );
}
