"use client";

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type ReactNode } from "react";
import BotaoDescanso from "./botao-descanso";
import CampoComDetalhe, { formatarBonus, type ItemDetalhe } from "./campo-com-detalhe";

const personagem = {
  nome: 'Milo "Bulette" Barrilmonte',
  nivel: 11,
  raca: "Hynne",
  origem: "Cosmopolita",
  classes: "Ladino 10",
  divindade: "Valkaria",
  xp: null as { atual: number; proximo: number } | null,
  imagem: "https://a1cf74336522e87f135f-2f21ace9a6cf0052456644b80fa06d4f.ssl.cf2.rackcdn.com/images/characters/large/800/Samwise-Gamgee.The-Lord-of-the-Rings-The-Fellowship-of-the-Ring.webp",
  atributos: [
    { sigla: "FOR", valor: 3 },
    { sigla: "DES", valor: 2 },
    { sigla: "CON", valor: 2 },
    { sigla: "INT", valor: 1 },
    { sigla: "SAB", valor: 0 },
    { sigla: "CAR", valor: 4 },
  ],
  pv: { atual: 68, temporario: 12 },
  pm: { atual: 22, temporario: 0 },
  bencaosDosDeuses: 3,
  defesaExtra: [
    { rotulo: "Armadura", valor: 2 },
    { rotulo: "Escudo pesado", valor: 2 },
    { rotulo: "Poder XYZ", valor: 1 },
  ],
};

function valorAtributo(sigla: string) {
  return personagem.atributos.find((atributo) => atributo.sigla === sigla)?.valor ?? 0;
}

function CampoComLegenda({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="w-full rounded-lg border-2 border-red-900 px-3 pb-1">
      <legend className="px-1 text-xs uppercase tracking-wide opacity-70">
        <span className="font-bold">{rotulo}</span>
      </legend>
      <div className="text-xl">{children}</div>
    </fieldset>
  );
}

function CampoRecurso({
  rotulo,
  atual,
  maximo,
  temporario,
}: {
  rotulo: string;
  atual: number;
  maximo?: number;
  temporario?: number;
}) {
  const temTemporario = !!temporario && temporario > 0;

  return (
    <fieldset className="flex h-full min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center">
      <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
        {rotulo}
      </legend>
      <span className="text-xl font-bold">
        {atual}
        {maximo !== undefined && ` / ${maximo}`}
      </span>
      {temTemporario && <span className="text-sm opacity-70">+{temporario} temp.</span>}
    </fieldset>
  );
}

function BarraXp({ atual, proximo }: { atual: number; proximo: number }) {
  const percentual = Math.min(100, Math.round((atual / proximo) * 100));

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex flex-row justify-between text-sm">
        <span>XP</span>
        <span>
          {atual} / {proximo}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-olive-800/20 dark:bg-olive-400/20">
        <div
          className="h-full rounded-full bg-red-900"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}

export default function BarraResumo() {
  const {
    nome,
    nivel,
    raca,
    origem,
    classes,
    divindade,
    xp,
    pv,
    pm,
    bencaosDosDeuses,
  } = personagem;

  const con = valorAtributo("CON");
  const des = valorAtributo("DES");

  const pvPorClasse = nivel * 5;
  const pvPorConstituicao = con * nivel;
  const pvItens: ItemDetalhe[] = [
    { rotulo: "Classe (nível × 5)", valor: pvPorClasse },
    { rotulo: `Constituição (${formatarBonus(con)} × nível)`, valor: pvPorConstituicao },
  ];
  const pvMaximo = pvPorClasse + pvPorConstituicao;

  const pmPorClasse = nivel * 4;
  const pmItens: ItemDetalhe[] = [
    { rotulo: "Classe (nível × 4)", valor: pmPorClasse },
  ];
  const pmMaximo = pmPorClasse;

  const defesaItens: ItemDetalhe[] = [
    { rotulo: "Base", valor: 10 },
    { rotulo: "Destreza", valor: des },
    ...personagem.defesaExtra,
  ];
  const defesaTotal = defesaItens.reduce((soma, item) => soma + item.valor, 0);

  return (
    <div className="flex flex-col items-center w-full shrink-0 dark:bg-olive-900 bg-olive-400 shadow-2xs dark:shadow-2xs-dark py-4">
      <div className="grid-cabecalho gap-x-4 gap-y-2 md:gap-x-6 lg:gap-x-8 w-full max-w-7xl px-4 min-[1313px]:px-0">
        <div className="area-foto">
          {personagem.imagem ? (
            <img
              src={personagem.imagem}
              alt="Imagem do personagem"
              className="size-28 shrink-0 object-center object-cover rounded-xl border-2 border-red-900 md:size-40 lg:size-48"
            />
          ) : (
            <div className="flex flex-row shrink-0 items-center justify-center gap-2 size-28 border-2 rounded-xl border-red-900 text-olive-800 dark:text-olive-400 md:size-40 lg:size-48">
              <FontAwesomeIcon icon={faUser} className="size-12! md:size-16! lg:size-20!" />
            </div>
          )}
        </div>

        {/* Linha do nome: sempre ao lado da foto, mesmo no celular; o restante
            (detalhes e recursos) ocupa a largura toda, inclusive embaixo da foto. */}
        <div className="area-nome flex flex-col justify-center min-w-0 text-olive-800 dark:text-olive-400">
          <div className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 w-full lg:gap-x-8">
            <div className="min-w-0 text-3xl font-bold md:text-4xl lg:text-4xl">{nome}</div>
            <div className="flex flex-wrap items-center gap-4">
              <BotaoDescanso />
              <span className="whitespace-nowrap text-xl font-bold">Nível: {nivel}</span>
            </div>
          </div>
        </div>

        <div className="area-resto flex flex-col justify-center gap-2 min-w-0 text-olive-800 dark:text-olive-400">
          {/* Linha de detalhes: isolada da linha de cima. Grid fixo (2x2 ou
              1x4) em vez de flex-wrap, pra nunca sobrar um item sozinho numa
              linha maior embaixo. XP (quando existir) ganha a própria linha,
              sempre 100% da largura. */}
          <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <CampoComLegenda rotulo="Raça">{raca}</CampoComLegenda>
            <CampoComLegenda rotulo="Origem">{origem}</CampoComLegenda>
            <CampoComLegenda rotulo="Classe">{classes}</CampoComLegenda>
            <CampoComLegenda rotulo="Divindade">{divindade}</CampoComLegenda>
          </div>

          {xp && (
            <div className="w-full">
              <BarraXp atual={xp.atual} proximo={xp.proximo} />
            </div>
          )}

          {/* Linha de PV/PM/Bênçãos/Defesa: isolada das linhas acima. No celular
              vira grid 2x2, no tablet grid de 4 colunas e no desktop (lg) volta
              a ser exatamente como antes: flex sem quebra, 1/4 cada, h-16. */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:flex lg:h-16 lg:flex-row lg:items-start lg:gap-x-16 w-full">
            <CampoComDetalhe
              classeContainer="relative flex-1 basis-0 min-w-0 h-full"
              classeGatilho="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center"
              itens={pvItens}
              total={pvMaximo}
              temporario={pv.temporario}
            >
              <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
                PV
              </legend>
              <span className="text-xl font-bold">
                {pv.atual}
                {pv.temporario > 0 && (
                  <span className="text-sm font-normal opacity-60"> +{pv.temporario}</span>
                )}
                {` / ${pvMaximo}`}
              </span>
            </CampoComDetalhe>
            <CampoComDetalhe
              classeContainer="relative flex-1 basis-0 min-w-0 h-full"
              classeGatilho="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center"
              itens={pmItens}
              total={pmMaximo}
              temporario={pm.temporario}
            >
              <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
                PM
              </legend>
              <span className="text-xl font-bold">
                {pm.atual}
                {pm.temporario > 0 && (
                  <span className="text-sm font-normal opacity-60"> +{pm.temporario}</span>
                )}
                {` / ${pmMaximo}`}
              </span>
            </CampoComDetalhe>
            <CampoRecurso rotulo="Bênçãos" atual={bencaosDosDeuses} />
            <CampoComDetalhe
              classeContainer="relative flex-1 basis-0 min-w-0 h-full"
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
        </div>
      </div>
    </div>
  );
}
