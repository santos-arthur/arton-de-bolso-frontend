"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PiTreasureChest } from "react-icons/pi";
import BarraEspacos from "../components/barra-espacos";
import CabecalhoPagina, { TituloSecao } from "../components/cabecalho-pagina";
import ListaInventario, { recortarInventario } from "../components/lista-inventario";
import PaginaFicha from "../components/pagina-ficha";
import { useCampoNumerico } from "../lib/campo-numerico";
import { useFoundry } from "../lib/foundry-provider";
import type { GrupoInventario, Moeda } from "../lib/foundry-types";

/** Referência estável: `?? []` criaria um array novo a cada render e invalidaria o memo. */
const SEM_INVENTARIO: GrupoInventario[] = [];

/** Campo de moeda — grava só ao sair da edição (ver useCampoNumerico). */
function CampoMoeda({
  moeda,
  somenteLeitura,
  aoSalvar
}: {
  moeda: Moeda;
  somenteLeitura: boolean;
  aoSalvar: (valor: number) => void;
}) {
  const campo = useCampoNumerico(moeda.valor, aoSalvar);

  return (
    <label className="flex min-w-0 flex-1 flex-row items-center justify-between gap-2 rounded-xl border border-borda bg-superficie-alta px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-wider opacity-60" title={moeda.label}>
        {moeda.sigla}
      </span>
      {somenteLeitura ? (
        <span className="numero text-lg font-bold">{moeda.valor}</span>
      ) : (
        <input
          type="number"
          min={0}
          inputMode="numeric"
          aria-label={moeda.label}
          {...campo}
          className="input-numero-sem-setas numero w-20 bg-transparent text-right text-lg font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
        />
      )}
    </label>
  );
}

export default function Page() {
  const { ficha, somenteLeitura, ajustarDinheiro } = useFoundry();

  const inventario = ficha?.inventario ?? SEM_INVENTARIO;
  const naMochila = useMemo(() => recortarInventario(inventario, true), [inventario]);
  const noBau = useMemo(() => recortarInventario(inventario, false), [inventario]);

  if (!ficha) return null;

  const totalItens = naMochila.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  const totalNoBau = noBau.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  // Total na unidade base (T$), pra não somar 1 TO = 10 T$ de cabeça.
  const totalEmTibar = ficha.dinheiro.reduce((soma, moeda) => soma + moeda.valor * moeda.emTibar, 0);

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Inventário">
        {totalItens} {totalItens === 1 ? "item" : "itens"}
      </CabecalhoPagina>

      <BarraEspacos carga={ficha.carga} />

      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-baseline justify-between gap-3">
          <TituloSecao>Dinheiro</TituloSecao>
          <span className="numero text-xs opacity-60">{totalEmTibar} T$ no total</span>
        </div>
        <div className="flex flex-row flex-wrap gap-2">
          {ficha.dinheiro.map((moeda) => (
            <CampoMoeda
              key={moeda.chave}
              moeda={moeda}
              somenteLeitura={somenteLeitura}
              aoSalvar={(valor) => ajustarDinheiro(moeda.chave, valor)}
            />
          ))}
        </div>
      </div>

      {/* O baú é o resto da mochila, não outra seção da ficha: por isso o
          caminho para ele é daqui, e não uma aba a mais no dock. */}
      <Link
        href="/inventario/bau"
        className="flex flex-row items-center justify-between gap-3 rounded-2xl border border-borda bg-superficie-alta px-3 py-2.5 transition-colors hover:bg-foreground/5"
      >
        <span className="flex flex-row items-center gap-2 text-sm font-bold">
          <PiTreasureChest aria-hidden="true" className="size-4! opacity-70" />
          Baú
        </span>
        <span className="numero text-xs opacity-60">
          {totalNoBau} {totalNoBau === 1 ? "item guardado" : "itens guardados"}
        </span>
      </Link>

      <ListaInventario grupos={naMochila} vazio="A mochila está vazia." />
    </PaginaFicha>
  );
}
