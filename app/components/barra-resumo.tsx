"use client";

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import BotaoDescanso from "./botao-descanso";

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
  crescer = false,
}: {
  rotulo: string;
  children: ReactNode;
  crescer?: boolean;
}) {
  return (
    <fieldset
      className={`rounded-lg border-2 border-red-900 px-3 pb-1 ${
        crescer ? "flex-1 basis-32" : "min-w-32"
      }`}
    >
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
  const [travado, setTravado] = useState(false);
  const [emHover, setEmHover] = useState(false);
  const aberto = travado || emHover;
  const containerRef = useRef<HTMLDivElement>(null);
  const detalheRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!travado) return;

    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setTravado(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [travado]);

  // Mantém o detalhamento sempre 100% visível: calcula a posição absoluta (em
  // px, relativa ao gatilho) que abre a caixa exatamente abaixo, centralizada,
  // e só desloca (nos dois eixos) o suficiente para caber com 16px de margem
  // da borda da tela. useLayoutEffect evita flash antes do ajuste.
  useLayoutEffect(() => {
    const popover = detalheRef.current;
    const gatilho = containerRef.current;
    if (!aberto || !popover || !gatilho) return;

    const margem = 16;
    const espacamento = 8; // equivalente ao "mt-2" usado antes
    const gatilhoRect = gatilho.getBoundingClientRect();
    const largura = popover.offsetWidth;
    const altura = popover.offsetHeight;
    // window.innerWidth/innerHeight não são confiáveis em navegadores mobile
    // (podem refletir o viewport "de layout", maior que a tela visível).
    // document.documentElement.clientWidth/clientHeight refletem a área real.
    const larguraTela = document.documentElement.clientWidth;
    const alturaTela = document.documentElement.clientHeight;

    // Horizontal: centralizado sob o gatilho, por padrão.
    let esquerda = gatilhoRect.width / 2 - largura / 2;
    const esquerdaAbsoluta = gatilhoRect.left + esquerda;

    if (esquerdaAbsoluta < margem) {
      esquerda += margem - esquerdaAbsoluta;
    } else if (esquerdaAbsoluta + largura > larguraTela - margem) {
      esquerda -= esquerdaAbsoluta + largura - (larguraTela - margem);
    }

    // Vertical: sempre abaixo do gatilho, por padrão; só sobe o necessário
    // para caber quando a tela é baixa demais (ex.: celular em paisagem).
    let topo = gatilhoRect.height + espacamento;
    const topoAbsoluto = gatilhoRect.top + topo;

    if (topoAbsoluto + altura > alturaTela - margem) {
      topo -= topoAbsoluto + altura - (alturaTela - margem);
    }

    popover.style.left = `${esquerda}px`;
    popover.style.top = `${topo}px`;
  }, [aberto]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 basis-0 min-w-0 h-full"
      onMouseEnter={() => setEmHover(true)}
      onMouseLeave={() => setEmHover(false)}
    >
      <fieldset
        role="button"
        tabIndex={0}
        onClick={() => setTravado((valor) => !valor)}
        onKeyDown={(evento) => {
          if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            setTravado((valor) => !valor);
          }
        }}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-red-900 px-2 pb-2 text-center outline-none"
      >
        <legend className="px-1 text-left text-xs font-semibold uppercase tracking-wide opacity-70">
          {rotulo}
        </legend>
        <span className="text-xl font-bold">{valorExibido}</span>
      </fieldset>

      {/* Detalhamento: aparece no hover ou ao clicar (fica travado, fechando só
          ao clicar fora). Sempre no topo (z-50) e reposicionado via JS para
          nunca vazar para fora da tela. */}
      {aberto && (
        <div
          ref={detalheRef}
          className="absolute z-50 flex w-60 max-w-[calc(100vw-2rem)] flex-col gap-1 rounded-lg border-2 border-red-900 bg-olive-300 p-3 text-sm text-olive-800 shadow-lg dark:bg-olive-800 dark:text-olive-400"
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
      )}
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
    <div className="flex flex-col items-center w-full shrink-0 dark:bg-olive-900 bg-olive-400 shadow-2xs dark:shadow-2xs-dark py-4 px-4 min-[1313px]:px-0">
      <div className="grid-cabecalho gap-x-4 gap-y-2 md:gap-x-6 lg:gap-x-8 w-full max-w-7xl">
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
          {/* Linha de detalhes: isolada da linha de cima, com seus próprios tamanhos.
              Sem XP, o botão de descanso já fica junto ao nível (acima), então
              esses 4 campos crescem e dividem 100% do espaço entre eles. */}
          <div className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 w-full lg:gap-x-8">
            <CampoComLegenda rotulo="Raça" crescer={!xp}>{raca}</CampoComLegenda>
            <CampoComLegenda rotulo="Origem" crescer={!xp}>{origem}</CampoComLegenda>
            <CampoComLegenda rotulo="Classe" crescer={!xp}>{classes}</CampoComLegenda>
            <CampoComLegenda rotulo="Divindade" crescer={!xp}>{divindade}</CampoComLegenda>
            {xp && (
              <div className="flex w-32 shrink-0 justify-end">
                <BarraXp atual={xp.atual} proximo={xp.proximo} />
              </div>
            )}
          </div>

          {/* Linha de PV/PM/Bênçãos/Defesa: isolada das linhas acima. No celular
              vira grid 2x2, no tablet grid de 4 colunas e no desktop (lg) volta
              a ser exatamente como antes: flex sem quebra, 1/4 cada, h-16. */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:flex lg:h-16 lg:flex-row lg:items-start lg:gap-x-16 w-full">
            <CampoComDetalhe
              rotulo="PV"
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
              rotulo="PM"
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
            <CampoRecurso rotulo="Bênçãos" atual={bencaosDosDeuses} />
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
