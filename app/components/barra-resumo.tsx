"use client";

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type ReactNode } from "react";
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

export default function BarraResumo({ compacta = false, onAbrirModalRecurso }: { compacta?: boolean; onAbrirModalRecurso?: (recurso: "pv" | "pm") => void }) {
  const { ficha } = useFoundry();

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

  const tamanhoFoto = compacta ? "size-20 md:size-24 lg:size-28" : "size-28 md:size-40 lg:size-48";
  const tamanhoIconeFoto = compacta ? "size-8! md:size-10! lg:size-12!" : "size-12! md:size-16! lg:size-20!";

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
              <BotaoDescanso />
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

          {!compacta && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:flex lg:h-16 lg:flex-row lg:items-start lg:gap-x-16 w-full">
              <fieldset
                role="button"
                tabIndex={0}
                onClick={() => onAbrirModalRecurso?.("pv")}
                className="flex h-full w-full flex-1 basis-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center outline-none transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">PV</legend>
                <span className="text-xl font-bold">
                  {pv.atual}
                  {!!pv.temp && <span className="text-sm font-normal opacity-60"> +{pv.temp}</span>}
                  {` / ${pv.max}`}
                </span>
              </fieldset>

              <fieldset
                role="button"
                tabIndex={0}
                onClick={() => onAbrirModalRecurso?.("pm")}
                className="flex h-full w-full flex-1 basis-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center outline-none transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">PM</legend>
                <span className="text-xl font-bold">
                  {pm.atual}
                  {!!pm.temp && <span className="text-sm font-normal opacity-60"> +{pm.temp}</span>}
                  {` / ${pm.max}`}
                </span>
              </fieldset>

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
          )}
        </div>
      </div>
    </div>
  );
}
