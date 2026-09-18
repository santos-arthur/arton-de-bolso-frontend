"use client";

import { useEffect } from "react";
import { useFoundry } from "./foundry-provider";
import type { Combatente, EstadoCombate } from "./foundry-types";

/**
 * O combate em andamento, pedido ao relay na montagem da tela. Daí em diante
 * ele se mexe sozinho: cada virada de turno, iniciativa rolada ou dano
 * aplicado na mesa chega pelo push (ver `obterCombate` no módulo).
 *
 * Diferente das anotações e do compêndio, aqui não há tela de "carregando":
 * fora de combate a resposta legítima é "não há combate", e é ela que chega.
 * A seção simplesmente não aparece até existir um.
 */
export function useCombate(): {
  combate: EstadoCombate | null;
  ativo: boolean;
  /** O combatente da ficha aberta, quando ela está na luta. */
  meu: Combatente | null;
  atual: Combatente | null;
  proximo: Combatente | null;
  /** Esta linha é a da ficha que estou olhando? (não repete PV/PM do cabeçalho) */
  ehFichaAberta: (combatente: Combatente) => boolean;
} {
  const { combate, ficha, carregarCombate } = useFoundry();

  useEffect(() => {
    carregarCombate();
    // Só na montagem: `carregarCombate` é recriado a cada render do provider,
    // e como cada push de combate provoca um render, depender dele aqui
    // faria a tela repedir a lista em laço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const combatentes = combate?.combatentes ?? [];
  const ehFichaAberta = (combatente: Combatente) => !!ficha && combatente.atorId === ficha.id;

  return {
    combate,
    ativo: !!combate?.ativo,
    meu: combatentes.find(ehFichaAberta) ?? null,
    atual: combatentes.find((c) => c.ehAtual) ?? null,
    proximo: combatentes.find((c) => c.ehProximo) ?? null,
    ehFichaAberta
  };
}
