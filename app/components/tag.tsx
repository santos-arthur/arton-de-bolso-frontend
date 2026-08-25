import { type ReactNode } from "react";

/** Etiqueta arredondada usada em atributos, poderes, magias e itens. */
export default function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border-2 border-red-900 px-2.5 py-0.5 text-xs font-semibold">{children}</span>
  );
}
