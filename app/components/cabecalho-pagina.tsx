import { type ReactNode } from "react";

/** Topo de cada seção da ficha: mesmo ritmo e tipografia em todas as telas. */
export default function CabecalhoPagina({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-5">
      <h2 className="font-display text-2xl font-bold">{titulo}</h2>
      {children && <span className="numero text-sm opacity-60">{children}</span>}
    </div>
  );
}

/** Divisor de assunto dentro de uma seção (Atributos, Dinheiro, Armas...). */
export function TituloSecao({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] font-bold uppercase tracking-wider opacity-55">{children}</h3>;
}

/** Caixa de "não há nada aqui" — mesmo desenho em toda a aplicação. */
export function EstadoVazio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-borda px-4 py-8 text-center text-sm opacity-60">
      {children}
    </div>
  );
}

/** Cartão base das listas e blocos. */
export function Cartao({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-borda bg-superficie-alta ${className}`}>{children}</div>
  );
}
