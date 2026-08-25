"use client";

import { faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import CabecalhoPagina, { EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import LinhaItem from "../components/linha-item";
import PaginaFicha from "../components/pagina-ficha";
import { useFoundry } from "../lib/foundry-provider";
import type { Moeda } from "../lib/foundry-types";

/**
 * Campo de moeda com rascunho local: enquanto o campo está sendo editado ele
 * ignora o valor que vem do servidor, senão um push do Foundry (o mestre
 * mexendo na ficha, outro item mudando) apagaria o que está sendo digitado no
 * meio da digitação. Ao sair do campo, o valor é enviado e o controle volta a
 * espelhar o servidor.
 */
function CampoMoeda({
  moeda,
  somenteLeitura,
  aoSalvar
}: {
  moeda: Moeda;
  somenteLeitura: boolean;
  aoSalvar: (valor: number) => void;
}) {
  const [rascunho, setRascunho] = useState<string | null>(null);

  function salvar() {
    if (rascunho === null) return;
    const valor = Math.max(0, Number(rascunho) || 0);
    if (valor !== moeda.valor) aoSalvar(valor);
    setRascunho(null);
  }

  return (
    <fieldset className="flex min-w-0 flex-1 basis-28 flex-col items-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide opacity-70" title={moeda.label}>
        {moeda.sigla}
      </legend>
      {somenteLeitura ? (
        <span className="text-xl font-bold">{moeda.valor}</span>
      ) : (
        <input
          type="number"
          min={0}
          inputMode="numeric"
          aria-label={moeda.label}
          value={rascunho ?? moeda.valor}
          onFocus={() => setRascunho(String(moeda.valor))}
          onChange={(evento) => setRascunho(evento.target.value)}
          onBlur={salvar}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") evento.currentTarget.blur();
            if (evento.key === "Escape") setRascunho(null);
          }}
          className="input-numero-sem-setas w-full bg-transparent text-center text-xl font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900"
        />
      )}
    </fieldset>
  );
}

export default function Page() {
  const { ficha, somenteLeitura, alternarEquipado, ajustarDinheiro } = useFoundry();

  if (!ficha) return null;

  const { inventario, dinheiro } = ficha;
  const totalItens = inventario.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  // Total na unidade base (T$), pra não precisar somar 1 TO = 10 T$ de cabeça.
  const totalEmTibar = dinheiro.reduce((soma, moeda) => soma + moeda.valor * moeda.emTibar, 0);

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Inventário">
        <span className="text-sm opacity-70">
          {totalItens} {totalItens === 1 ? "item" : "itens"}
        </span>
      </CabecalhoPagina>

      <div className="flex flex-row flex-wrap items-baseline justify-between gap-x-4">
        <TituloSecao>
          <FontAwesomeIcon icon={faCoins} className="mr-2 size-4!" />
          Dinheiro
        </TituloSecao>
        <span className="text-sm opacity-70">Total: {totalEmTibar} T$</span>
      </div>
      <div className="flex flex-row flex-wrap gap-3 md:gap-4">
        {dinheiro.map((moeda) => (
          <CampoMoeda
            key={moeda.chave}
            moeda={moeda}
            somenteLeitura={somenteLeitura}
            aoSalvar={(valor) => ajustarDinheiro(moeda.chave, valor)}
          />
        ))}
      </div>

      {inventario.length === 0 ? (
        <>
          <hr className="my-2 border border-red-900" />
          <EstadoVazio>A mochila está vazia.</EstadoVazio>
        </>
      ) : (
        inventario.map((grupo) => (
          <section key={grupo.tipo} className="flex flex-col gap-3">
            <hr className="my-2 border border-red-900" />
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
