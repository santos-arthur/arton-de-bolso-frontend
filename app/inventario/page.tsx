"use client";

import { useMemo, useState } from "react";
import CabecalhoPagina, { EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import BarraEspacos from "../components/barra-espacos";
import CampoBusca, { normalizar } from "../components/campo-busca";
import LinhaItem from "../components/linha-item";
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
  const { ficha, somenteLeitura, alternarEquipado, ajustarDinheiro } = useFoundry();
  const [busca, setBusca] = useState("");

  const inventario = ficha?.inventario ?? SEM_INVENTARIO;
  const grupos = useMemo(() => {
    const alvo = normalizar(busca);
    if (!alvo) return inventario;
    return inventario
      .map((grupo) => ({ ...grupo, itens: grupo.itens.filter((i) => normalizar(i.nome).includes(alvo)) }))
      .filter((grupo) => grupo.itens.length);
  }, [inventario, busca]);

  if (!ficha) return null;

  const totalItens = inventario.reduce((soma, grupo) => soma + grupo.itens.length, 0);
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

      {totalItens > 8 && <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar item..." />}

      {grupos.length === 0 ? (
        <EstadoVazio>{totalItens ? "Nenhum item encontrado." : "A mochila está vazia."}</EstadoVazio>
      ) : (
        grupos.map((grupo) => (
          <section key={grupo.tipo} className="flex flex-col gap-2">
            <TituloSecao>{grupo.label}</TituloSecao>
            <ul className="flex flex-col gap-2">
              {grupo.itens.map((item) => (
                <LinhaItem
                  key={item.id}
                  item={item}
                  somenteLeitura={somenteLeitura}
                  aoAlternarEquipado={() => alternarEquipado(item.id)}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </PaginaFicha>
  );
}
