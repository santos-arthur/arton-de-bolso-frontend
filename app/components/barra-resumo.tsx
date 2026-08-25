"use client";

import { faEye, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type ReactNode } from "react";
import type { Recurso } from "../lib/foundry-types";
import BotaoDescanso from "./botao-descanso";
import CampoComDetalhe from "./campo-com-detalhe";
import { useFoundry } from "../lib/foundry-provider";

function CampoComLegenda({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <fieldset className="flex-1 rounded-lg border-2 border-red-900 px-3 pb-1">
      <legend className="px-1 text-xs uppercase tracking-wide opacity-70">
        <span className="font-bold">{rotulo}</span>
      </legend>
      <div className="whitespace-nowrap text-xl">{children}</div>
    </fieldset>
  );
}

/** Só leitura — recursos genéricos (ex: Bênçãos) só podem ser ajustados pelo mestre direto no Foundry. */
function CampoRecurso({ rotulo, atual, max }: { rotulo: string; atual: number; max: number | null }) {
  return (
    <fieldset className="flex h-full min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center">
      <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">{rotulo}</legend>
      <span className="text-xl font-bold">
        {atual}
        {max !== null && ` / ${max}`}
      </span>
    </fieldset>
  );
}

/**
 * PV e PM da barra. Numa ficha própria o campo abre o modal de edição no
 * clique. Numa ficha de companheiro não há o que editar — então o campo passa
 * a se comportar como a Defesa: hover (ou clique, que trava) revela de onde
 * vem o máximo.
 */
function CampoRecursoPrincipal({
  rotulo,
  recurso,
  somenteLeitura,
  onAbrir
}: {
  rotulo: string;
  recurso: Recurso;
  somenteLeitura: boolean;
  onAbrir?: () => void;
}) {
  const conteudo = (
    <>
      <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">{rotulo}</legend>
      <span className="text-xl font-bold">
        {recurso.atual}
        {!!recurso.temp && <span className="text-sm font-normal opacity-60"> +{recurso.temp}</span>}
        {` / ${recurso.max}`}
      </span>
    </>
  );

  if (somenteLeitura) {
    return (
      <CampoComDetalhe
        classeContainer="relative h-full w-full min-w-0 flex-1 basis-0"
        classeGatilho="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center"
        itens={recurso.itensMax}
        total={recurso.max ?? 0}
        temporario={recurso.temp}
      >
        {conteudo}
      </CampoComDetalhe>
    );
  }

  return (
    <fieldset
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          onAbrir?.();
        }
      }}
      className="flex h-full w-full flex-1 basis-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
    >
      {conteudo}
    </fieldset>
  );
}

export default function BarraResumo({ onAbrirModalRecurso }: { onAbrirModalRecurso?: (recurso: "pv" | "pm") => void }) {
  const { ficha, somenteLeitura } = useFoundry();

  if (!ficha) return null;

  const {
    nome,
    nivel,
    raca,
    origem,
    classes,
    divindade,
    xp,
    img,
    pv,
    pm,
    defesa,
    recursosGenericos
  } = ficha;

  const tamanhoFoto = "size-28 md:size-40 lg:size-48";
  const tamanhoIconeFoto = "size-12! md:size-16! lg:size-20!";

  return (
    <div className="flex flex-col items-center w-full shrink-0 dark:bg-olive-900 bg-olive-400 shadow-2xs dark:shadow-2xs-dark py-4">
      <div className="grid-cabecalho gap-x-4 gap-y-2 md:gap-x-6 lg:gap-x-8 w-full max-w-7xl px-4 min-[1313px]:px-0">
        <div className="area-foto">
          {img ? (
            <div
              role="img"
              aria-label="Imagem do personagem"
              className={`shrink-0 rounded-xl border-2 border-red-900 bg-cover bg-center ${tamanhoFoto}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ) : (
            <div
              className={`flex flex-row shrink-0 items-center justify-center gap-2 border-2 rounded-xl border-red-900 text-olive-800 dark:text-olive-400 ${tamanhoFoto}`}
            >
              <FontAwesomeIcon icon={faUser} className={tamanhoIconeFoto} />
            </div>
          )}
        </div>

        <div className="area-nome flex flex-col justify-center min-w-0 text-olive-800 dark:text-olive-400">
          <div className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 w-full lg:gap-x-8">
            <div className="min-w-0 text-3xl font-bold md:text-4xl lg:text-4xl">{nome}</div>
            <div className="flex flex-wrap items-center gap-4">
              {somenteLeitura ? (
                <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-red-900 px-3 py-0.5 text-sm font-semibold">
                  <FontAwesomeIcon icon={faEye} className="size-3.5!" />
                  Somente leitura
                </span>
              ) : (
                <BotaoDescanso />
              )}
              <span className="whitespace-nowrap text-xl font-bold">Nível: {nivel ?? "—"}</span>
            </div>
          </div>
        </div>

        <div className="area-resto flex flex-col justify-center gap-2 min-w-0 text-olive-800 dark:text-olive-400">
          <div className="flex w-full flex-wrap gap-3 md:gap-4">
            <CampoComLegenda rotulo="Raça">{raca || "—"}</CampoComLegenda>
            <CampoComLegenda rotulo="Origem">{origem || "—"}</CampoComLegenda>
            <CampoComLegenda rotulo="Classe">{classes || "—"}</CampoComLegenda>
            <CampoComLegenda rotulo="Divindade">{divindade || "—"}</CampoComLegenda>
          </div>

          {xp && (
            <div className="flex w-full flex-col gap-1">
              <div className="flex flex-row justify-between text-sm">
                <span>XP</span>
                <span>
                  {xp.atual} / {xp.proximo}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-olive-800/20 dark:bg-olive-400/20">
                <div
                  className="h-full rounded-full bg-red-900"
                  style={{ width: `${Math.min(100, Math.round((xp.atual / xp.proximo) * 100))}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:flex lg:h-16 lg:flex-row lg:items-start lg:gap-x-16 w-full">
            <CampoRecursoPrincipal
              rotulo="PV"
              recurso={pv}
              somenteLeitura={somenteLeitura}
              onAbrir={() => onAbrirModalRecurso?.("pv")}
            />

            <CampoRecursoPrincipal
              rotulo="PM"
              recurso={pm}
              somenteLeitura={somenteLeitura}
              onAbrir={() => onAbrirModalRecurso?.("pm")}
            />

            {recursosGenericos.map((recurso) => (
              <CampoRecurso key={recurso.chave} rotulo={recurso.label} atual={recurso.atual} max={recurso.max} />
            ))}

            <CampoComDetalhe
              classeContainer="relative flex-1 basis-0 min-w-0 h-full"
              classeGatilho="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center"
              itens={defesa.itens}
              total={defesa.total ?? 0}
            >
              <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">Defesa</legend>
              <span className="text-xl font-bold">{defesa.total}</span>
            </CampoComDetalhe>
          </div>
        </div>
      </div>
    </div>
  );
}
