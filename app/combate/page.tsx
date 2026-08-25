"use client";

import { useState } from "react";
import CampoComDetalhe from "../components/campo-com-detalhe";
import ModalRecursoFicha from "../components/modal-recurso-ficha";
import { useFoundry } from "../lib/foundry-provider";

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

function CampoRecursoClicavel({
  rotulo,
  atual,
  maximo,
  temporario,
  onClick
}: {
  rotulo: string;
  atual: number;
  maximo: number;
  temporario: number;
  onClick: () => void;
}) {
  return (
    <fieldset
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          onClick();
        }
      }}
      className="flex h-full min-w-0 flex-1 basis-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center outline-none transition-colors hover:bg-black/5 dark:hover:bg-white/5"
    >
      <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">{rotulo}</legend>
      <span className="text-xl font-bold">
        {atual}
        {temporario > 0 && <span className="text-sm font-normal opacity-60"> +{temporario}</span>}
        {` / ${maximo}`}
      </span>
    </fieldset>
  );
}

export default function Page() {
  const { ficha } = useFoundry();
  const [modalAberto, setModalAberto] = useState<"pv" | "pm" | null>(null);

  if (!ficha) return null;

  const { pv, pm, defesa, recursosGenericos } = ficha;

  return (
    <div className="flex flex-col gap-4 py-6 text-olive-800 dark:text-olive-400">
      <div className="text-lg font-bold uppercase tracking-wide opacity-70">Recursos</div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <CampoRecursoClicavel
          rotulo="PV"
          atual={pv.atual ?? 0}
          maximo={pv.max ?? 0}
          temporario={pv.temp}
          onClick={() => setModalAberto("pv")}
        />
        <CampoRecursoClicavel
          rotulo="PM"
          atual={pm.atual ?? 0}
          maximo={pm.max ?? 0}
          temporario={pm.temp}
          onClick={() => setModalAberto("pm")}
        />

        {recursosGenericos.map((recurso) => (
          <CampoRecurso key={recurso.chave} rotulo={recurso.label} atual={recurso.atual} max={recurso.max} />
        ))}

        <CampoComDetalhe
          classeContainer="relative h-full min-w-0"
          classeGatilho="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center"
          itens={defesa.itens}
          total={defesa.total ?? 0}
        >
          <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">Defesa</legend>
          <span className="text-xl font-bold">{defesa.total}</span>
        </CampoComDetalhe>
      </div>

      {modalAberto && <ModalRecursoFicha recurso={modalAberto} onFechar={() => setModalAberto(null)} />}
    </div>
  );
}
