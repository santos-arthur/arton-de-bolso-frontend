"use client";

import { useMemo, useState } from "react";
import { EstadoVazio, TituloSecao } from "./cabecalho-pagina";
import CampoBusca, { normalizar } from "./campo-busca";
import LinhaItem from "./linha-item";
import { useFoundry } from "../lib/foundry-provider";
import type { GrupoInventario } from "../lib/foundry-types";

/** Abaixo disso a busca é mais atrito do que ajuda: a lista inteira cabe na tela. */
const MINIMO_PARA_BUSCA = 8;

/**
 * A mochila e o baú são a mesma lista — mesmos grupos, mesma busca, mesmas
 * linhas —, mudando só quais itens entram. Por isso a listagem mora aqui, e
 * cada página só escolhe o recorte e o texto de lista vazia.
 */
export default function ListaInventario({
  grupos,
  vazio
}: {
  grupos: GrupoInventario[];
  vazio: string;
}) {
  const { somenteLeitura, alternarEquipado } = useFoundry();
  const [busca, setBusca] = useState("");

  const total = grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  const encontrados = useMemo(() => {
    const alvo = normalizar(busca);
    if (!alvo) return grupos;
    return grupos
      .map((grupo) => ({ ...grupo, itens: grupo.itens.filter((i) => normalizar(i.nome).includes(alvo)) }))
      .filter((grupo) => grupo.itens.length);
  }, [grupos, busca]);

  return (
    <>
      {total > MINIMO_PARA_BUSCA && (
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar item..." />
      )}

      {encontrados.length === 0 ? (
        <EstadoVazio>{total ? "Nenhum item encontrado." : vazio}</EstadoVazio>
      ) : (
        encontrados.map((grupo) => (
          <section key={grupo.tipo} className="flex flex-col gap-2">
            <TituloSecao>{grupo.label}</TituloSecao>
            <ul className="flex flex-col gap-2">
              {grupo.itens.map((item) => (
                <LinhaItem
                  key={item.id}
                  item={item}
                  somenteLeitura={somenteLeitura}
                  aoAlternarEquipado={() => alternarEquipado(item.id)}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}

/**
 * Separa a mochila do baú mantendo os grupos como o módulo os montou —
 * "Poções", "Pergaminhos", "Armas" — e descartando os que ficaram sem item
 * do lado pedido.
 */
export function recortarInventario(grupos: GrupoInventario[], carregado: boolean): GrupoInventario[] {
  return grupos
    .map((grupo) => ({ ...grupo, itens: grupo.itens.filter((item) => item.carregado === carregado) }))
    .filter((grupo) => grupo.itens.length);
}
