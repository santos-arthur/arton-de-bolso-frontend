"use client";

import { useState } from "react";
import CampoComDetalhe, { formatarBonus, type ItemDetalhe } from "../components/campo-com-detalhe";
import ModalRecurso from "../components/modal-recurso";

const PERSONAGEM = {
  nivel: 11,
  atributos: {
    con: 2,
    des: 2,
  },
  bencaosDosDeuses: 3,
  defesaExtra: [
    { rotulo: "Armadura", valor: 2 },
    { rotulo: "Escudo pesado", valor: 2 },
    { rotulo: "Poder XYZ", valor: 1 },
  ] as ItemDetalhe[],
};

function CampoRecurso({
  rotulo,
  atual,
  maximo,
}: {
  rotulo: string;
  atual: number;
  maximo?: number;
}) {
  return (
    <fieldset className="flex h-full min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center">
      <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
        {rotulo}
      </legend>
      <span className="text-xl font-bold">
        {atual}
        {maximo !== undefined && ` / ${maximo}`}
      </span>
    </fieldset>
  );
}

function CampoRecursoClicavel({
  rotulo,
  atual,
  maximo,
  temporario,
  onClick,
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
      <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
        {rotulo}
      </legend>
      <span className="text-xl font-bold">
        {atual}
        {temporario > 0 && (
          <span className="text-sm font-normal opacity-60"> +{temporario}</span>
        )}
        {` / ${maximo}`}
      </span>
    </fieldset>
  );
}

export default function Page() {
  const { nivel, atributos, bencaosDosDeuses, defesaExtra } = PERSONAGEM;

  const pvPorClasse = nivel * 5;
  const pvPorConstituicao = atributos.con * nivel;
  const pvItens: ItemDetalhe[] = [
    { rotulo: "Classe (nível × 5)", valor: pvPorClasse },
    { rotulo: `Constituição (${formatarBonus(atributos.con)} × nível)`, valor: pvPorConstituicao },
  ];
  const pvMaximo = pvPorClasse + pvPorConstituicao;

  const pmPorClasse = nivel * 4;
  const pmItens: ItemDetalhe[] = [{ rotulo: "Classe (nível × 4)", valor: pmPorClasse }];
  const pmMaximo = pmPorClasse;

  const [pv, setPv] = useState({ atual: 68, temporario: 12 });
  const [pm, setPm] = useState({ atual: 22, temporario: 0 });
  const [modalAberto, setModalAberto] = useState<"pv" | "pm" | null>(null);

  const defesaItens: ItemDetalhe[] = [
    { rotulo: "Base", valor: 10 },
    { rotulo: "Destreza", valor: atributos.des },
    ...defesaExtra,
  ];
  const defesaTotal = defesaItens.reduce((soma, item) => soma + item.valor, 0);

  return (
    <div className="flex flex-col gap-4 py-6 text-olive-800 dark:text-olive-400">
      <div className="text-lg font-bold uppercase tracking-wide opacity-70">Recursos</div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <CampoRecursoClicavel
          rotulo="PV"
          atual={pv.atual}
          maximo={pvMaximo}
          temporario={pv.temporario}
          onClick={() => setModalAberto("pv")}
        />
        <CampoRecursoClicavel
          rotulo="PM"
          atual={pm.atual}
          maximo={pmMaximo}
          temporario={pm.temporario}
          onClick={() => setModalAberto("pm")}
        />
        <CampoRecurso rotulo="Bênçãos" atual={bencaosDosDeuses} />
        <CampoComDetalhe
          classeContainer="relative h-full min-w-0"
          classeGatilho="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center"
          itens={defesaItens}
          total={defesaTotal}
        >
          <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
            Defesa
          </legend>
          <span className="text-xl font-bold">{defesaTotal}</span>
        </CampoComDetalhe>
      </div>

      {modalAberto === "pv" && (
        <ModalRecurso
          rotulo="PV"
          atual={pv.atual}
          maximo={pvMaximo}
          itensMaximo={pvItens}
          temporario={pv.temporario}
          onFechar={() => setModalAberto(null)}
          onAlterarAtual={(novoValor) => setPv((atual) => ({ ...atual, atual: novoValor }))}
          onAlterarTemporario={(novoValor) =>
            setPv((atual) => ({ ...atual, temporario: novoValor }))
          }
        />
      )}
      {modalAberto === "pm" && (
        <ModalRecurso
          rotulo="PM"
          atual={pm.atual}
          maximo={pmMaximo}
          itensMaximo={pmItens}
          temporario={pm.temporario}
          onFechar={() => setModalAberto(null)}
          onAlterarAtual={(novoValor) => setPm((atual) => ({ ...atual, atual: novoValor }))}
          onAlterarTemporario={(novoValor) =>
            setPm((atual) => ({ ...atual, temporario: novoValor }))
          }
        />
      )}
    </div>
  );
}
