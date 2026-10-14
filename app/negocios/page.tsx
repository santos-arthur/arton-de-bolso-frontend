"use client";

import { useState } from "react";
import { FaArrowDown, FaArrowUp, FaCoins, FaDiceD20, FaStore } from "react-icons/fa6";
import CabecalhoPagina, { Cartao, EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import ModalCofreNegocio from "../components/modal-cofre-negocio";
import ModalRenderNegocio from "../components/modal-render-negocio";
import PaginaFicha from "../components/pagina-ficha";
import { useFoundry } from "../lib/foundry-provider";
import type { Negocio, OperacaoCofre, PericiaDeNegocio } from "../lib/foundry-types";
import { tibares, useNegocios } from "../lib/negocios";

const BOTAO =
  "flex min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors";

/** Quantas linhas do histórico aparecem fechadas — o resto abre no "ver tudo". */
const REGISTRO_RESUMIDO = 3;

function CartaoNegocio({
  negocio,
  pericias,
  tibaresNaMao,
  nomePersonagem,
  somenteLeitura
}: {
  negocio: Negocio;
  pericias: PericiaDeNegocio[];
  tibaresNaMao: number | null;
  nomePersonagem: string;
  somenteLeitura: boolean;
}) {
  const [rendendo, setRendendo] = useState<"normal" | "teste" | null>(null);
  const [movendo, setMovendo] = useState<OperacaoCofre | null>(null);
  const [registroAberto, setRegistroAberto] = useState(false);
  const podeRender = negocio.podeRender && !somenteLeitura;
  const registro = registroAberto ? negocio.registro : negocio.registro.slice(0, REGISTRO_RESUMIDO);
  const subtitulo = [negocio.ramo, negocio.local].filter(Boolean).join(" · ");

  return (
    <Cartao className="flex flex-col gap-4 p-4">
      <div className="flex flex-row items-center gap-3">
        {negocio.img ? (
          <span
            role="img"
            aria-hidden="true"
            className="size-14 shrink-0 rounded-xl border border-borda bg-cover bg-center"
            style={{ backgroundImage: `url(${negocio.img})` }}
          />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-borda">
            <FaStore aria-hidden="true" className="size-5! opacity-60" />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-display text-lg font-bold">{negocio.nome}</span>
          <span className="text-xs opacity-60">
            {negocio.porte} · nível {negocio.nivel}/{negocio.nivelMaximo}
          </span>
          {subtitulo && <span className="truncate text-xs opacity-60">{subtitulo}</span>}
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border border-borda bg-superficie px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Cofre</span>
          <span className="numero text-xl font-bold">{tibares(negocio.cofre)}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border border-borda bg-superficie px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Rende</span>
          <span className="numero text-xl font-bold">{tibares(negocio.rendimentoBase)}</span>
        </div>
      </div>

      {podeRender && (
        <div className="flex flex-row gap-2">
          <button
            type="button"
            onClick={() => setRendendo("normal")}
            className={`${BOTAO} border border-borda hover:bg-foreground/5`}
          >
            <FaCoins aria-hidden="true" className="size-4! shrink-0" />
            Render
          </button>
          <button
            type="button"
            onClick={() => setRendendo("teste")}
            className={`${BOTAO} bg-acento text-acento-tinta hover:opacity-90`}
          >
            <FaDiceD20 aria-hidden="true" className="size-4! shrink-0" />
            Render com teste
          </button>
        </div>
      )}

      {podeRender && (
        <div className="flex flex-row gap-2">
          <button
            type="button"
            onClick={() => setMovendo("sacar")}
            className={`${BOTAO} border border-borda hover:bg-foreground/5`}
          >
            <FaArrowDown aria-hidden="true" className="size-4! shrink-0" />
            Sacar
          </button>
          <button
            type="button"
            onClick={() => setMovendo("depositar")}
            className={`${BOTAO} border border-borda hover:bg-foreground/5`}
          >
            <FaArrowUp aria-hidden="true" className="size-4! shrink-0" />
            Depositar
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <TituloSecao>
          Ativos · {negocio.ativos.length}/{negocio.nivel}
        </TituloSecao>
        {negocio.ativos.length === 0 ? (
          <span className="text-sm opacity-60">Nenhum ativo contratado.</span>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {negocio.ativos.map((ativo) => (
              <li key={ativo.id} className="flex flex-col">
                <span className="text-sm font-semibold">
                  {ativo.nome}
                  {ativo.escolha && <span className="font-normal opacity-60"> · {ativo.escolha}</span>}
                  {ativo.copiado && <span className="font-normal opacity-60"> · via Espionagem</span>}
                </span>
                {ativo.resumo && <span className="text-xs opacity-60">{ativo.resumo}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {negocio.registro.length > 0 && (
        <div className="flex flex-col gap-2">
          <TituloSecao>Histórico</TituloSecao>
          <ul className="flex flex-col">
            {registro.map((entrada, indice) => (
              <li
                key={`${entrada.timestamp}-${indice}`}
                className="flex flex-row items-start justify-between gap-3 border-b border-borda/60 py-2 last:border-b-0"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm">{entrada.texto || entrada.tipo}</span>
                  {entrada.timestamp > 0 && (
                    <span className="text-[11px] opacity-50">
                      {new Date(entrada.timestamp).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </span>
                {entrada.valor !== null && entrada.valor !== 0 && (
                  <span
                    className={`numero shrink-0 text-sm font-semibold ${
                      entrada.valor > 0 ? "text-acento" : "opacity-60"
                    }`}
                  >
                    {entrada.valor > 0 ? "+" : ""}
                    {tibares(entrada.valor)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {negocio.registro.length > REGISTRO_RESUMIDO && (
            <button
              type="button"
              onClick={() => setRegistroAberto((aberto) => !aberto)}
              className="self-start text-xs font-bold opacity-60 hover:opacity-100"
            >
              {registroAberto ? "Mostrar menos" : `Ver os últimos ${negocio.registro.length}`}
            </button>
          )}
        </div>
      )}

      {movendo && (
        <ModalCofreNegocio
          negocio={negocio}
          operacao={movendo}
          tibaresNaMao={tibaresNaMao}
          nomePersonagem={nomePersonagem}
          onFechar={() => setMovendo(null)}
        />
      )}

      {rendendo && (
        <ModalRenderNegocio
          negocio={negocio}
          pericias={pericias}
          modo={rendendo}
          onFechar={() => setRendendo(null)}
        />
      )}
    </Cartao>
  );
}

export default function Page() {
  const { ficha, somenteLeitura } = useFoundry();
  const estado = useNegocios();

  if (!ficha) return null;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Negócios">{estado?.negocios.length || null}</CabecalhoPagina>

      {!estado ? (
        <EstadoVazio>Carregando negócios...</EstadoVazio>
      ) : !estado.disponivel ? (
        <EstadoVazio>O módulo Negócios não está ativo neste mundo. Peça ao mestre para ativá-lo no Foundry.</EstadoVazio>
      ) : estado.negocios.length === 0 ? (
        <EstadoVazio>{ficha.nome} ainda não tem negócio. Quem funda e expande é o mestre, pelo Foundry.</EstadoVazio>
      ) : (
        <div className="flex flex-col gap-3">
          {estado.negocios.map((negocio) => (
            <CartaoNegocio
              key={negocio.id}
              negocio={negocio}
              pericias={estado.pericias}
              tibaresNaMao={estado.tibaresNaMao ?? null}
              nomePersonagem={ficha.nome}
              somenteLeitura={somenteLeitura}
            />
          ))}
        </div>
      )}
    </PaginaFicha>
  );
}
