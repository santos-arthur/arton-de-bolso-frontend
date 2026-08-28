"use client";

import { useEffect, useState } from "react";
import { useFoundry } from "./foundry-provider";
import { normalizar } from "../components/campo-busca";
import type { Compendio, ItemCompendio, JournalCompendio, PastaCompendio } from "./foundry-types";

const COMPENDIO_VAZIO: Compendio = { pastas: [], journals: [] };

/** Mesma trava da tela de anotações: sem o mestre com o Foundry aberto, ninguém responde. */
const LIMITE_ESPERA_MS = 10000;

/**
 * O compêndio liberado para este jogador, pedido ao relay na montagem da tela. A
 * partir daí a lista se mexe sozinha: o mestre dando (ou tirando) Observador
 * num journal é o que faz algo aparecer ou sumir daqui.
 */
export function useCompendio(): { compendio: Compendio; carregando: boolean } {
  const { compendio, carregarCompendio } = useFoundry();
  const [desistiu, setDesistiu] = useState(false);

  useEffect(() => {
    carregarCompendio();
    const id = setTimeout(() => setDesistiu(true), LIMITE_ESPERA_MS);
    return () => clearTimeout(id);
    // Só na montagem: `carregarCompendio` é recriado a cada render do provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { compendio: compendio ?? COMPENDIO_VAZIO, carregando: compendio === null && !desistiu };
}

/** Um degrau do caminho, para a trilha de navegação no topo da tela. */
export type Degrau = { id: string; nome: string };

/**
 * Onde o jogador está na árvore, resolvido a partir dos ids da URL.
 *
 * Um lugar só pode ser três coisas: uma pasta (mostra subpastas e journals),
 * um journal (mostra as páginas dele) ou uma página — o item final, o que se
 * abre para ver.
 */
export type Lugar =
  | { tipo: "pasta"; trilha: Degrau[]; pastas: PastaCompendio[]; journals: JournalCompendio[] }
  | { tipo: "journal"; trilha: Degrau[]; journal: JournalCompendio }
  | { tipo: "item"; trilha: Degrau[]; journal: JournalCompendio; item: ItemCompendio }
  | { tipo: "perdido"; trilha: Degrau[] };

/**
 * Segue o caminho de ids pela árvore. Ids que não existem mais dão
 * `perdido` — é o que acontece quando o mestre tira a permissão com a tela
 * aberta, e a tela precisa saber disso para explicar em vez de piscar vazia.
 */
export function resolverCaminho(compendio: Compendio, caminho: string[]): Lugar {
  const trilha: Degrau[] = [];
  let pastas = compendio.pastas;
  let journals = compendio.journals;

  for (let i = 0; i < caminho.length; i++) {
    const id = caminho[i];

    const pasta = pastas.find((p) => p.id === id);
    if (pasta) {
      trilha.push({ id: pasta.id, nome: pasta.nome });
      pastas = pasta.pastas;
      journals = pasta.journals;
      continue;
    }

    const journal = journals.find((j) => j.id === id);
    if (!journal) return { tipo: "perdido", trilha };
    trilha.push({ id: journal.id, nome: journal.nome });

    // Journal é o último nível de agrupamento: o que vier depois dele só pode
    // ser uma página.
    const idDaPagina = caminho[i + 1];
    if (idDaPagina === undefined) return { tipo: "journal", trilha, journal };

    const item = journal.paginas.find((pagina) => pagina.id === idDaPagina);
    if (!item || caminho.length > i + 2) return { tipo: "perdido", trilha };
    trilha.push({ id: item.id, nome: item.titulo });
    return { tipo: "item", trilha, journal, item };
  }

  return { tipo: "pasta", trilha, pastas, journals };
}

/** Um resultado de busca: a página achada e por onde se chega até ela. */
export type Achado = { item: ItemCompendio; caminho: string[]; rotulo: string };

/**
 * Busca em toda a árvore, não só no nível aberto. Numa mesa o jogador lembra
 * do nome da carta, não de em qual sessão o mestre a arquivou — obrigá-lo a
 * abrir pasta por pasta seria transformar a organização do mestre em tarefa
 * dele.
 */
export function buscarNoCompendio(compendio: Compendio, termo: string): Achado[] {
  const alvo = normalizar(termo);
  if (!alvo) return [];

  const achados: Achado[] = [];

  function visitarJournal(journal: JournalCompendio, ids: string[], nomes: string[]) {
    for (const item of journal.paginas) {
      const casa = normalizar(`${item.titulo} ${item.resumo} ${journal.nome} ${nomes.join(" ")}`);
      if (casa.includes(alvo)) {
        achados.push({
          item,
          caminho: [...ids, journal.id, item.id],
          rotulo: [...nomes, journal.nome].join(" / ")
        });
      }
    }
  }

  function visitarPasta(pastas: PastaCompendio[], journals: JournalCompendio[], ids: string[], nomes: string[]) {
    for (const journal of journals) visitarJournal(journal, ids, nomes);
    for (const pasta of pastas) {
      visitarPasta(pasta.pastas, pasta.journals, [...ids, pasta.id], [...nomes, pasta.nome]);
    }
  }

  visitarPasta(compendio.pastas, compendio.journals, [], []);
  return achados;
}

/** A URL de um lugar da árvore. Vazio = a raiz do compêndio. */
export function rotaDoCompendio(caminho: string[]): string {
  return caminho.length ? `/compendio/${caminho.join("/")}` : "/compendio";
}

/**
 * Journal de uma página só (o caso mais comum: um retrato, um mapa) leva
 * direto a ela — abrir um nível que só tem um filho é um toque a troco de
 * nada.
 */
export function destinoDoJournal(journal: JournalCompendio, ids: string[]): string {
  const unica = journal.paginas.length === 1 ? journal.paginas[0] : null;
  return rotaDoCompendio(unica ? [...ids, journal.id, unica.id] : [...ids, journal.id]);
}
