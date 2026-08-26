"use client";

import { FaUser } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AjusteRecurso from "./ajuste-recurso";
import CampoComDetalhe from "./campo-com-detalhe";
import BotaoDescanso from "./botao-descanso";
import { eRotaDeFicha } from "./navegacao";
import { CAIXA_NUMERO, ParAtualMaximo, RotuloCampo } from "./visor-numero";
import { useFoundry } from "../lib/foundry-provider";
import type { Recurso } from "../lib/foundry-types";

/** Abaixo disso o número de PV fica em destaque — é a informação que decide a jogada seguinte. */
const LIMIAR_CRITICO = 0.25;

// Três níveis de texto da faixa, num lugar só — eram as mesmas classes
// repetidas em cada tipo de caixa.
const ROTULO = "text-[11px] font-bold uppercase tracking-wider opacity-60";
const VALOR = "numero text-lg font-bold leading-none";
const VALOR_SECUNDARIO = "text-sm";

/** Cada caixa da faixa ocupa no mínimo isto; o que não couber quebra para a linha de baixo. */
const CAIXA =
  "flex w-full min-w-0 flex-col items-start justify-start gap-1.5 rounded-xl border border-borda bg-superficie-alta px-3 py-2 text-left sm:min-w-[6rem] sm:flex-1 sm:basis-24";

function Medidor({
  rotulo,
  recurso,
  classeBarra,
  critico = false,
  somenteLeitura,
  onAbrir
}: {
  rotulo: string;
  recurso: Recurso;
  classeBarra: string;
  critico?: boolean;
  somenteLeitura: boolean;
  onAbrir: () => void;
}) {
  const atual = recurso.atual ?? 0;
  const max = recurso.max ?? 0;
  const proporcao = max > 0 ? Math.min(1, Math.max(0, atual / max)) : 0;
  const emPerigo = critico && max > 0 && proporcao <= LIMIAR_CRITICO;

  // Rótulo em cima, valor na linha de baixo — a mesma estrutura da Defesa,
  // para as três caixas da faixa se lerem como um bloco só.
  const conteudo = (
    <>
      <span className={ROTULO}>{rotulo}</span>
      <span className={`${VALOR} ${emPerigo ? "text-red-600 dark:text-red-400" : ""}`}>
        {atual}
        {!!recurso.temp && <span className={`${VALOR_SECUNDARIO} font-semibold opacity-60`}> +{recurso.temp}</span>}
        <span className={`${VALOR_SECUNDARIO} font-normal opacity-50`}> / {max}</span>
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${classeBarra}`}
          style={{ width: `${proporcao * 100}%` }}
        />
      </div>
    </>
  );

  // Numa ficha de companheiro não há o que editar; em troca, o campo revela a
  // composição do máximo no hover, como a Defesa já fazia.
  if (somenteLeitura) {
    return (
      <CampoComDetalhe
        titulo={rotulo === "PV" ? "Pontos de Vida" : "Pontos de Mana"}
        classeContainer="relative flex w-full min-w-0 sm:min-w-[6rem] sm:flex-1 sm:basis-24"
        classeGatilho={`${CAIXA} h-full w-full`}
        itens={recurso.itensMax}
        total={max}
        temporario={recurso.temp}
        destaque={
          <ParAtualMaximo
            atual={<span className={CAIXA_NUMERO}>{atual}</span>}
            maximo={<span className={CAIXA_NUMERO}>{max}</span>}
          />
        }
      >
        {conteudo}
      </CampoComDetalhe>
    );
  }

  return (
    <button type="button" onClick={onAbrir} className={`${CAIXA} transition-colors hover:border-acento/60 hover:bg-foreground/[0.03]`}>
      {conteudo}
    </button>
  );
}

/** Só leitura — recursos genéricos (ex: Bênçãos) só podem ser ajustados pelo mestre direto no Foundry. */
function CaixaRecurso({ rotulo, atual, max }: { rotulo: string; atual: number; max: number | null }) {
  return (
    <div className={CAIXA}>
      <span className={`w-full truncate ${ROTULO}`}>{rotulo}</span>
      <span className={VALOR}>
        {atual}
        {max !== null && <span className={`${VALOR_SECUNDARIO} font-normal opacity-50`}> / {max}</span>}
      </span>
    </div>
  );
}

export default function CabecalhoFicha() {
  const { ficha, somenteLeitura } = useFoundry();
  const pathname = usePathname();
  const [recursoAberto, setRecursoAberto] = useState<"pv" | "pm" | null>(null);

  if (!ficha || !eRotaDeFicha(pathname)) return null;

  const { nome, img, nivel, raca, classes, xp, pv, pm, defesa, recursosGenericos } = ficha;
  const linhaIdentidade = [nivel !== null ? `Nível ${nivel}` : null, raca, classes].filter(Boolean).join(" · ");

  return (
    <>
      <header className="w-full border-b border-borda bg-superficie">
        {/* Identidade: rola junto com a página. É consulta ocasional. */}
        <div className="mx-auto flex w-full max-w-5xl flex-row items-center gap-3 px-4 pb-3 pt-3 sm:gap-4">
          {img ? (
            <div
              role="img"
              aria-label={`Retrato de ${nome}`}
              className="size-14 shrink-0 rounded-xl border border-borda bg-cover bg-center sm:size-16"
              style={{ backgroundImage: `url(${img})` }}
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-borda sm:size-16">
              <FaUser aria-hidden="true" className="size-6!" />
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-row items-center gap-2">
              <h1 className="truncate font-display text-xl font-bold leading-tight sm:text-2xl">{nome}</h1>
              {somenteLeitura && (
                <span className="shrink-0 rounded-full border border-borda px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Leitura
                </span>
              )}
            </div>
            {linhaIdentidade && <p className="truncate text-xs opacity-65 sm:text-sm">{linhaIdentidade}</p>}
            {xp && (
              <div
                className="mt-1 h-1 w-full max-w-xs overflow-hidden rounded-full bg-foreground/10"
                role="progressbar"
                aria-label="Experiência"
                aria-valuenow={xp.atual}
                aria-valuemax={xp.proximo}
                title={`XP ${xp.atual} / ${xp.proximo}`}
              >
                <div
                  className="h-full rounded-full bg-foreground/35"
                  style={{ width: `${Math.min(100, Math.round((xp.atual / xp.proximo) * 100))}%` }}
                />
              </div>
            )}
          </div>

          {!somenteLeitura && <BotaoDescanso />}
        </div>

        {/* Recursos vitais: grudam no topo. Rolar uma lista de magias não pode
            custar a visão do PV — é o número que decide a jogada seguinte.
            Os recursos genéricos (Bênçãos e afins) entram na mesma faixa; o
            flex-wrap resolve as telas onde não cabem todos lado a lado. */}
        <div className="sticky top-0 z-30 border-t border-borda bg-superficie/95 backdrop-blur-md">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-2 items-stretch gap-2 px-4 py-2 sm:flex sm:flex-row sm:flex-wrap">
            <Medidor
              rotulo="PV"
              recurso={pv}
              classeBarra="bg-red-700 dark:bg-red-600"
              critico
              somenteLeitura={somenteLeitura}
              onAbrir={() => setRecursoAberto("pv")}
            />
            <Medidor
              rotulo="PM"
              recurso={pm}
              classeBarra="bg-sky-700 dark:bg-sky-500"
              somenteLeitura={somenteLeitura}
              onAbrir={() => setRecursoAberto("pm")}
            />
            <CampoComDetalhe
              titulo="Defesa"
              classeContainer="relative flex w-full min-w-0 sm:min-w-[6rem] sm:flex-1 sm:basis-24"
              classeGatilho={`${CAIXA} h-full w-full`}
              itens={defesa.itens}
              total={defesa.total ?? 0}
              destaque={
                <div className="flex flex-col items-center gap-1">
                  <RotuloCampo>Defesa</RotuloCampo>
                  <span className={CAIXA_NUMERO}>{defesa.total ?? "—"}</span>
                </div>
              }
            >
              <span className={ROTULO}>Defesa</span>
              <span className={VALOR}>{defesa.total ?? "—"}</span>
            </CampoComDetalhe>

            {recursosGenericos.map((recurso) => (
              <CaixaRecurso key={recurso.chave} rotulo={recurso.label} atual={recurso.atual} max={recurso.max} />
            ))}
          </div>
        </div>
      </header>

      {recursoAberto && <AjusteRecurso recurso={recursoAberto} onFechar={() => setRecursoAberto(null)} />}
    </>
  );
}
