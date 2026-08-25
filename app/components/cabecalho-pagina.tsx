import { type ReactNode } from "react";

/**
 * Topo de cada aba da ficha. Existe pra que todas as telas comecem na mesma
 * altura e com a mesma tipografia — antes cada página inventava o seu (umas
 * com <h1>, outras direto no conteúdo).
 */
export default function CabecalhoPagina({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h1 className="text-3xl font-bold">{titulo}</h1>
      {children}
    </div>
  );
}

/** Divisor de assunto dentro de uma página (Atributos, Dinheiro, Armas...). */
export function TituloSecao({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold uppercase tracking-wide opacity-70">{children}</h2>;
}

/** Caixa de "não há nada aqui" — mesmo desenho em toda a aplicação. */
export function EstadoVazio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-red-900/50 px-4 py-6 text-center text-sm opacity-70">
      {children}
    </div>
  );
}
