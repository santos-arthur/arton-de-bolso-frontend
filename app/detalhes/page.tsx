"use client";

import { type ReactNode } from "react";
import CabecalhoPagina, { EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import CampoComDetalhe from "../components/campo-com-detalhe";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-xl border border-borda bg-superficie-alta px-3 py-2">
      <span className="text-[11px] font-bold uppercase leading-none tracking-wider opacity-55">{rotulo}</span>
      <div className="truncate text-sm font-semibold">{children}</div>
    </div>
  );
}

function ListaDeTags({ itens, vazio }: { itens: string[]; vazio: string }) {
  if (itens.length === 0) return <span className="text-sm opacity-50">{vazio}</span>;
  return (
    <div className="flex flex-row flex-wrap gap-1.5">
      {itens.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
    </div>
  );
}

export default function Page() {
  const { ficha } = useFoundry();
  if (!ficha) return null;

  const {
    atributos,
    tamanho,
    movimento,
    resistencias,
    imunidadesCondicoes,
    sentidos,
    profArmas,
    profArmaduras,
    raca,
    origem,
    divindade,
    classes,
    xp
  } = ficha;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Ficha" />

      {/* Atributos primeiro: é o que se consulta a cada teste. */}
      <TituloSecao>Atributos</TituloSecao>
      {/* Quadrados com a borda marcada, como na primeira versão da ficha: é o
          bloco que se olha a cada teste, e merece peso visual maior que o
          resto da página. */}
      <div className="grid grid-cols-3 justify-items-center gap-3 sm:grid-cols-6 sm:gap-4">
        {atributos.map((atributo) => (
          <CampoComDetalhe
            key={atributo.chave}
            titulo={atributo.nome}
            classeContainer="relative w-full max-w-26"
            classeGatilho="flex aspect-square max-h-24 w-full flex-col items-center rounded-xl border-2 border-acento bg-superficie-alta pt-1.5 font-bold transition-colors hover:bg-foreground/[0.03]"
            itens={atributo.itens}
            total={atributo.mod ?? 0}
          >
            <span className="font-display text-lg uppercase leading-none tracking-wide">{atributo.sigla}</span>
            <span className="numero flex flex-1 items-center text-3xl leading-none">
              {atributo.mod !== null ? (atributo.mod >= 0 ? `+${atributo.mod}` : atributo.mod) : "—"}
            </span>
          </CampoComDetalhe>
        ))}
      </div>

      <TituloSecao>Identidade</TituloSecao>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Campo rotulo="Raça">{raca || "—"}</Campo>
        <Campo rotulo="Origem">{origem || "—"}</Campo>
        <Campo rotulo="Classe">{classes || "—"}</Campo>
        <Campo rotulo="Divindade">{divindade || "—"}</Campo>
      </div>

      <TituloSecao>Corpo</TituloSecao>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <Campo rotulo="Tamanho">{tamanho || "—"}</Campo>
        <CampoComDetalhe
          titulo="Deslocamento"
          classeContainer="relative"
          classeGatilho="flex h-full w-full flex-col gap-0.5 rounded-xl border border-borda bg-superficie-alta px-3 py-2 text-left transition-colors hover:border-acento/60"
          // A decomposição vem pronta do relay (base, bônus de efeito,
          // armadura pesada, sobrecarga, condição). Antes esta lista era
          // montada aqui com uma linha só, "Base (Médio)", carregando o valor
          // *final* — o que dava o número certo com o rótulo errado e escondia
          // qualquer penalidade.
          itens={movimento.itens}
          total={movimento.valor ?? 0}
        >
          <span className="text-[11px] font-bold uppercase leading-none tracking-wider opacity-55">Deslocamento</span>
          <span className="numero truncate text-sm font-semibold">
            {movimento.valor ?? "—"}
            {movimento.unidade ? ` ${movimento.unidade.toLowerCase()}` : ""}
            {movimento.unidade === "Metros" && movimento.valor !== null
              ? ` (${(movimento.valor / 1.5).toFixed(0)} quad.)`
              : ""}
          </span>
        </CampoComDetalhe>
        {xp && (
          <Campo rotulo="Experiência">
            <span className="numero">
              {xp.atual} / {xp.proximo}
            </span>
          </Campo>
        )}
      </div>

      <TituloSecao>Resistências, imunidades e sentidos</TituloSecao>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold opacity-70">Resistências</span>
          <ListaDeTags itens={resistencias} vazio="Nenhuma" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold opacity-70">Imunidade a condições</span>
          <ListaDeTags itens={imunidadesCondicoes} vazio="Nenhuma" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold opacity-70">Sentidos</span>
          <ListaDeTags itens={sentidos} vazio="Nenhum" />
        </div>
      </div>

      <TituloSecao>Proficiências</TituloSecao>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold opacity-70">Armas</span>
          <ListaDeTags itens={profArmas} vazio="Nenhuma" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold opacity-70">Armaduras e escudos</span>
          <ListaDeTags itens={profArmaduras} vazio="Nenhuma" />
        </div>
      </div>

      {atributos.length === 0 && <EstadoVazio>Sem dados de atributos.</EstadoVazio>}
    </PaginaFicha>
  );
}
