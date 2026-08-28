"use client";

import { useEffect, useState } from "react";
import { useFoundry } from "./foundry-provider";
import { textoDoHtml } from "./html-seguro";
import type { AnotacaoDiario, Diario } from "./foundry-types";

const SEM_DIARIOS: Diario[] = [];

/**
 * Quanto tempo a tela espera a resposta do relay antes de desistir. Sem isto,
 * o mestre com o Foundry fechado deixaria a tela girando para sempre — o
 * mesmo motivo do `LIMITE_TROCA_MS` na troca de personagem.
 */
const LIMITE_ESPERA_MS = 10000;

/**
 * Os diários, pedindo ao relay na primeira montagem da tela. O pedido é
 * idempotente do lado do Foundry, e a partir daí qualquer anotação criada ou
 * editada — por mim ou por um colega — chega sozinha pelo stream.
 */
export function useDiarios(): { diarios: Diario[]; carregando: boolean } {
  const { diarios, carregarDiarios } = useFoundry();
  const [desistiu, setDesistiu] = useState(false);

  useEffect(() => {
    carregarDiarios();
    const id = setTimeout(() => setDesistiu(true), LIMITE_ESPERA_MS);
    return () => clearTimeout(id);
    // Só na montagem: `carregarDiarios` é recriado a cada render do provider,
    // e como dependência viraria um pedido por render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { diarios: diarios ?? SEM_DIARIOS, carregando: diarios === null && !desistiu };
}

/** O diário do próprio jogador — onde toda escrita acontece. */
export function meuDiario(diarios: Diario[]): Diario | null {
  return diarios.find((diario) => diario.meu) ?? null;
}

/** Acha uma anotação em qualquer diário visível, junto do diário em que ela está. */
export function acharAnotacao(
  diarios: Diario[],
  paginaId: string
): { diario: Diario; anotacao: AnotacaoDiario } | null {
  for (const diario of diarios) {
    const anotacao = diario.paginas.find((pagina) => pagina.id === paginaId);
    if (anotacao) return { diario, anotacao };
  }
  return null;
}

/**
 * Primeiras linhas da anotação, para a prévia da lista e para a busca. O
 * conteúdo é HTML formatado, então o que interessa aqui é só o texto visível —
 * buscar por "negrito" não pode casar com a tag `<strong>`.
 */
export function resumir(html: string, limite = 140): string {
  const linha = textoDoHtml(html).replace(/\s+/g, " ").trim();
  return linha.length > limite ? `${linha.slice(0, limite)}…` : linha;
}
