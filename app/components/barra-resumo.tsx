"use client";

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState, type ReactNode } from "react";
import BotaoDescanso from "./botao-descanso";

const personagem = {
  nome: 'Milo "Bulette" Barrilmonte',
  nivel: 11,
  raca: "Hynne",
  origem: "Cosmopolita",
  classes: "Ladino 10 | Inventor 1",
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
    <fieldset className="min-w-32 rounded-lg border-2 border-red-900 px-3 pb-1">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide opacity-70">
        {rotulo}
      </legend>
      <span className="text-xl">{children}</span>
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

type ItemDetalhe = { rotulo: string; valor: number };

function formatarBonus(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

function CampoComDetalhe({
  rotulo,
  valorExibido,
  itens,
  total,
  temporario,
}: {
  rotulo: string;
  valorExibido: ReactNode;
  itens: ItemDetalhe[];
  total: number;
  temporario?: number;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  return (
    <div ref={containerRef} className="group relative flex-1 basis-0 min-w-0 h-full">
      <fieldset
        role="button"
        tabIndex={0}
        onClick={() => setAberto((valor) => !valor)}
        onKeyDown={(evento) => {
          if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            setAberto((valor) => !valor);
          }
        }}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center outline-none"
      >
        <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
          {rotulo}
        </legend>
        <span className="text-xl font-bold">{valorExibido}</span>
      </fieldset>

      {/* Detalhamento: aparece no hover (CSS) e permanece aberto ao clicar
          (estado), fechando ao clicar fora. */}
      <div
        className={`absolute left-1/2 top-full z-10 mt-2 w-60 -translate-x-1/2 flex-col gap-1 rounded-lg border-2 border-red-900 bg-olive-300 p-3 text-sm text-olive-800 shadow-lg dark:bg-olive-800 dark:text-olive-400 ${
          aberto ? "flex" : "hidden group-hover:flex"
        }`}
      >
        {itens.map((item, indice) => (
          <div key={item.rotulo} className="flex flex-row items-center justify-between gap-4">
            <span>{item.rotulo}</span>
            <span className="font-semibold">
              {indice === 0 ? item.valor : formatarBonus(item.valor)}
            </span>
          </div>
        ))}
        <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t border-red-900/40 pt-1 font-bold">
          <span>Total</span>
          <span>{total}</span>
        </div>
        {!!temporario && temporario > 0 && (
          <div className="flex flex-row items-center justify-between gap-4 text-olive-800/70 dark:text-olive-400/70">
            <span>Temporários</span>
            <span className="font-semibold">+{temporario}</span>
          </div>
        )}
      </div>
    </div>
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
      <div className="flex-1 flex flex-row w-full max-w-7xl gap-8">
          {personagem.imagem ? (
            <img
              src={personagem.imagem}
              alt="Imagem do personagem"
              className="size-48 object-center object-cover rounded-xl border-2 border-red-900"
            />
          ) : (
            <div className="flex flex-row items-center justify-center gap-2 size-48 border-2 rounded-xl border-red-900 text-olive-800 dark:text-olive-400">
              <FontAwesomeIcon icon={faUser} className="size-20!" />
            </div>
          )}


        <div className="flex flex-1 flex-col justify-center gap-2 min-w-0 text-olive-800 dark:text-olive-400">
          {/* Linha do nome: isolada da linha de baixo, com seu próprio espaçamento */}
          <div className="flex flex-row flex-wrap items-center justify-between gap-x-8 gap-y-1 w-full">
            <div className="min-w-0 text-4xl font-bold">{nome}</div>
            <div className="flex flex-wrap items-center gap-4">
              {xp && <BotaoDescanso />}
              <span className="whitespace-nowrap text-xl">Nível: {nivel}</span>
            </div>
          </div>

          {/* Linha de detalhes: isolada da linha de cima, com seus próprios tamanhos */}
          <div className="flex flex-row flex-wrap items-center justify-between gap-x-8 gap-y-1 w-full">
            <CampoComLegenda rotulo="Raça">{raca}</CampoComLegenda>
            <CampoComLegenda rotulo="Origem">{origem}</CampoComLegenda>
            <CampoComLegenda rotulo="Classe">{classes}</CampoComLegenda>
            <CampoComLegenda rotulo="Divindade">{divindade}</CampoComLegenda>
            <div className="flex min-w-32 max-w-32 flex-1 justify-end">
              {xp ? <BarraXp atual={xp.atual} proximo={xp.proximo} /> : <BotaoDescanso />}
            </div>
          </div>

          {/* Linha de PV/PM/Bênçãos/Defesa: isolada das linhas acima; os 4 campos
              dividem sempre o espaço igualmente (1/4 cada), sem quebrar linha */}
          <div className="flex h-16 flex-row items-start gap-x-16 w-full">
            <CampoComDetalhe
              rotulo="Pontos de Vida"
              valorExibido={
                <>
                  {pv.atual}
                  {pv.temporario > 0 && (
                    <span className="text-sm font-normal opacity-60"> +{pv.temporario}</span>
                  )}
                  {` / ${pvMaximo}`}
                </>
              }
              itens={pvItens}
              total={pvMaximo}
              temporario={pv.temporario}
            />
            <CampoComDetalhe
              rotulo="Pontos de Mana"
              valorExibido={
                <>
                  {pm.atual}
                  {pm.temporario > 0 && (
                    <span className="text-sm font-normal opacity-60"> +{pm.temporario}</span>
                  )}
                  {` / ${pmMaximo}`}
                </>
              }
              itens={pmItens}
              total={pmMaximo}
              temporario={pm.temporario}
            />
            <CampoRecurso rotulo="Bênçãos dos Deuses" atual={bencaosDosDeuses} />
            <CampoComDetalhe
              rotulo="Defesa"
              valorExibido={defesaTotal}
              itens={defesaItens}
              total={defesaTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
