"use client";

import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";

/**
 * Busca das listas longas (perícias, poderes, magias, itens). Numa mesa,
 * percorrer 20+ linhas com o dedo para achar "Percepção" é lento demais —
 * digitar três letras não é.
 */
export default function CampoBusca({
  valor,
  aoMudar,
  placeholder,
  children
}: {
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder: string;
  /** Filtros extras (chips) exibidos ao lado da busca. */
  children?: React.ReactNode;
}) {
  return (
    // A única coisa presa no topo da ficha: o resto do cabeçalho (retrato,
    // nome, PV, PM, Defesa) rola para fora, e a busca fica — é ela que serve
    // para percorrer uma lista de 40 linhas com o dedo.
    <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-2 bg-background/95 px-4 py-2 backdrop-blur-md">
      <div className="relative flex flex-row items-center">
        <FaMagnifyingGlass
          aria-hidden="true"
          className="pointer-events-none absolute left-3 size-3.5! opacity-40"
        />
        <input
          type="search"
          value={valor}
          onChange={(evento) => aoMudar(evento.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-borda bg-superficie-alta py-2.5 pl-9 pr-9 text-sm outline-none transition-colors placeholder:opacity-50 focus:border-acento"
        />
        {valor && (
          <button
            type="button"
            onClick={() => aoMudar("")}
            aria-label="Limpar busca"
            className="absolute right-2 rounded-full p-1.5 transition-colors hover:bg-foreground/5"
          >
            <FaXmark aria-hidden="true" className="size-3.5!" />
          </button>
        )}
      </div>
      {children && <div className="flex flex-row flex-wrap gap-1.5">{children}</div>}
    </div>
  );
}

/** Chip de filtro ligado/desligado. */
export function ChipFiltro({
  ativo,
  onClick,
  children
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        ativo
          ? "border-acento bg-acento text-white"
          : "border-borda bg-superficie-alta hover:bg-foreground/5"
      }`}
    >
      {children}
    </button>
  );
}

/** Normaliza para busca tolerante a acento e caixa ("pericia" acha "Perícia"). */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
