import { type ReactNode } from "react";
import CampoComDetalhe, { type ItemDetalhe } from "./components/campo-com-detalhe";

const PERSONAGEM = {
  tamanho: "Pequeno",
  deslocamento: {
    base: 6,
    modificadores: [{ rotulo: "Hynne (Pés Ligeiros)", valor: 3 }] as ItemDetalhe[],
  },
  resistencias: ["Veneno"],
  imunidadesCondicoes: ["Apavorado"],
  sentidos: ["Visão no Escuro (9m)"],
  proficiencias: {
    armas: ["Simples", "Marciais leves"],
    armadurasEEscudos: ["Armaduras leves"],
  },
};

function CampoComLegenda({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <fieldset className="w-full rounded-lg border-2 border-red-900 px-3 pb-1">
      <legend className="px-1 text-xs uppercase tracking-wide opacity-70">
        <span className="font-bold">{rotulo}</span>
      </legend>
      <div className="text-xl">{children}</div>
    </fieldset>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border-2 border-red-900 px-2.5 py-0.5 text-sm font-semibold">
      {children}
    </span>
  );
}

function ListaDeTags({ itens, vazio = "Nenhum" }: { itens: string[]; vazio?: string }) {
  if (itens.length === 0) {
    return <span className="text-sm font-normal opacity-70">{vazio}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 py-2 px-0.5">
      {itens.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
    </div>
  );
}

const ATRIBUTOS: { sigla: string; itens: ItemDetalhe[]; temporario?: number }[] = [
  {
    sigla: "FOR",
    itens: [
      { rotulo: "Valor Base", valor: 11 },
      { rotulo: "Raça", valor: 1 },
      { rotulo: "Aumento de Atributo (Poder)", valor: 1 },
    ],
  },
  {
    sigla: "DES",
    itens: [{ rotulo: "Valor Base", valor: 2 }],
  },
  {
    sigla: "CON",
    itens: [
      { rotulo: "Valor Base", valor: 1 },
      { rotulo: "Raça", valor: 1 },
    ],
  },
  {
    sigla: "INT",
    itens: [{ rotulo: "Valor Base", valor: -1 }],
  },
  {
    sigla: "SAB",
    itens: [{ rotulo: "Valor Base", valor: 0 }],
  },
  {
    sigla: "CAR",
    itens: [
      { rotulo: "Valor Base", valor: 2 },
      { rotulo: "Raça", valor: 1 },
      { rotulo: "Elixir da Persuasão (Temporário)", valor: 1 },
    ],
    temporario: 1,
  },
];

function CampoAtributo({ sigla, itens, temporario }: { sigla: string; itens: ItemDetalhe[]; temporario?: number }) {
  const total = itens.reduce((soma, item) => soma + item.valor, 0);
  const sinal = total >= 0 ? "+" : "";

  return (
    <CampoComDetalhe
      classeContainer="relative w-full max-w-26"
      classeGatilho="flex aspect-square w-full max-h-24 flex-col items-center justify-center rounded-lg border-2 border-red-900 font-bold"
      itens={itens}
      total={total}
      temporario={temporario}
    >
      <legend className="mx-auto px-2 text-center text-lg">
        {sigla}
      </legend>
      <div className="text-3xl pb-2">
        {sinal}{total}
      </div>
    </CampoComDetalhe>
  );
}

export default function Home() {
  const deslocamentoItens: ItemDetalhe[] = [
    { rotulo: `Base (${PERSONAGEM.tamanho})`, valor: PERSONAGEM.deslocamento.base },
    ...PERSONAGEM.deslocamento.modificadores,
  ];
  const deslocamentoTotal = deslocamentoItens.reduce((soma, item) => soma + item.valor, 0);

  return (
    <div className="flex flex-col gap-4 py-6 text-olive-800 dark:text-olive-400">

      <div className="text-lg font-bold uppercase tracking-wide opacity-70">
        Atributos
      </div>

      <div className="grid grid-cols-3 justify-items-center gap-4 sm:grid-cols-6">
        {ATRIBUTOS.map((atributo) => (
          <CampoAtributo
            key={atributo.sigla}
            sigla={atributo.sigla}
            itens={atributo.itens}
            temporario={atributo.temporario}
          />
        ))}
      </div>

      <hr className="border-red-900 border my-4" />

      <div className="text-lg font-bold uppercase tracking-wide opacity-70">
        Características
      </div>

      <div className="grid w-full grid-cols-2 gap-3 md:gap-4">
        <CampoComLegenda rotulo="Tamanho">{PERSONAGEM.tamanho}</CampoComLegenda>
        <CampoComDetalhe
          classeContainer="relative w-full"
          classeGatilho="w-full rounded-lg border-2 border-red-900 px-3 pb-1 text-left"
          itens={deslocamentoItens}
          total={deslocamentoTotal}
        >
          <legend className="px-1 text-xs uppercase tracking-wide opacity-70">
            <span className="font-bold">Deslocamento</span>
          </legend>
          <div className="text-xl">{deslocamentoTotal}m</div>
        </CampoComDetalhe>
      </div>

      
      <hr className="border-red-900 border my-4" />

      <div className="text-lg font-bold uppercase tracking-wide opacity-70">
        Resistências, Imunidades e Sentidos
      </div>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <CampoComLegenda rotulo="Resistências">
          <ListaDeTags itens={PERSONAGEM.resistencias} />
        </CampoComLegenda>
        <CampoComLegenda rotulo="Imunidade a Condições">
          <ListaDeTags itens={PERSONAGEM.imunidadesCondicoes} />
        </CampoComLegenda>
        <CampoComLegenda rotulo="Sentidos">
          <ListaDeTags itens={PERSONAGEM.sentidos} />
        </CampoComLegenda>
      </div>
      
      
      <hr className="border-red-900 border my-4" />

      <div className="text-lg font-bold uppercase tracking-wide opacity-70">
        Proeficiências
      </div>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <CampoComLegenda rotulo="Armas">
          <ListaDeTags itens={PERSONAGEM.proficiencias.armas} />
        </CampoComLegenda>
        <CampoComLegenda rotulo="Armaduras e Escudos">
          <ListaDeTags itens={PERSONAGEM.proficiencias.armadurasEEscudos} />
        </CampoComLegenda>
      </div>
    </div>
  );
}
