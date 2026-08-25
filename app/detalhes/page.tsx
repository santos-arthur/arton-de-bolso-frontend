"use client";

import { type ReactNode } from "react";
import CabecalhoPagina, { TituloSecao } from "../components/cabecalho-pagina";
import CampoComDetalhe from "../components/campo-com-detalhe";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";

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

function CampoAtributo({ sigla, mod, itens }: { sigla: string; mod: number | null; itens: { rotulo: string; valor: number }[] }) {
  return (
    <CampoComDetalhe
      classeContainer="relative w-full max-w-26"
      classeGatilho="flex aspect-square w-full max-h-24 flex-col items-center justify-center rounded-lg border-2 border-red-900 font-bold"
      itens={itens}
      total={mod ?? 0}
    >
      <legend className="mx-auto px-2 text-center text-lg">{sigla}</legend>
      <div className="text-3xl pb-2">{mod !== null ? (mod >= 0 ? `+${mod}` : mod) : "—"}</div>
    </CampoComDetalhe>
  );
}

export default function Page() {
  const { ficha } = useFoundry();

  if (!ficha) return null;

  const { atributos, tamanho, movimento, resistencias, imunidadesCondicoes, sentidos, profArmas, profArmaduras } = ficha;

  const deslocamentoItens = [{ rotulo: `Base (${tamanho})`, valor: movimento.valor ?? 0 }];

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Detalhes" />

      <TituloSecao>Atributos</TituloSecao>

      <div className="grid grid-cols-3 justify-items-center gap-4 sm:grid-cols-6">
        {atributos.map((atributo) => (
          <CampoAtributo key={atributo.chave} sigla={atributo.sigla} mod={atributo.mod} itens={atributo.itens} />
        ))}
      </div>

      <hr className="border-red-900 border my-4" />

      <TituloSecao>Características</TituloSecao>

      <div className="grid w-full grid-cols-2 gap-3 md:gap-4">
        <CampoComLegenda rotulo="Tamanho">{tamanho}</CampoComLegenda>
        <CampoComDetalhe
          classeContainer="relative w-full"
          classeGatilho="w-full rounded-lg border-2 border-red-900 px-3 pb-1 text-left"
          itens={deslocamentoItens}
          total={movimento.valor ?? 0}
        >
          <legend className="px-1 text-xs uppercase tracking-wide opacity-70">
            <span className="font-bold">Deslocamento</span>
          </legend>
          <div className="text-xl">
            {movimento.valor ?? "—"}
            {movimento.unidade ? ` ${movimento.unidade}` : ""}
            {movimento.unidade == "Metros" && movimento.valor !== null ? ` (${(movimento.valor / 1.5).toFixed(0)} quadrados)` : ""}
          </div>
        </CampoComDetalhe>
      </div>

      <hr className="border-red-900 border my-4" />

      <TituloSecao>Resistências, Imunidades e Sentidos</TituloSecao>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <CampoComLegenda rotulo="Resistências">
          <ListaDeTags itens={resistencias} />
        </CampoComLegenda>
        <CampoComLegenda rotulo="Imunidade a Condições">
          <ListaDeTags itens={imunidadesCondicoes} />
        </CampoComLegenda>
        <CampoComLegenda rotulo="Sentidos">
          <ListaDeTags itens={sentidos} />
        </CampoComLegenda>
      </div>

      <hr className="border-red-900 border my-4" />

      <TituloSecao>Proeficiências</TituloSecao>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <CampoComLegenda rotulo="Armas">
          <ListaDeTags itens={profArmas} />
        </CampoComLegenda>
        <CampoComLegenda rotulo="Armaduras e Escudos">
          <ListaDeTags itens={profArmaduras} />
        </CampoComLegenda>
      </div>
    </PaginaFicha>
  );
}
