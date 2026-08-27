"use client";

import PainelDeUso from "./painel-de-uso";
import { TRUQUE } from "../lib/aprimoramentos";
import type { Magia } from "../lib/foundry-types";

/** Menor custo de uma conjuração, por mais que os descontos somem. */
const CUSTO_MINIMO = 1;

/**
 * Painel de conjurar: o painel de uso com as regras que são de magia — o PM
 * da própria magia na conta (no ataque a arma é de graça, aqui a magia nunca
 * é), o piso de 1 PM e o truque.
 */
export default function ModalMagia({ magia, onFechar }: { magia: Magia; onFechar: () => void }) {
  return (
    <PainelDeUso
      acao={{ ...magia, rotuloDoCusto: `${magia.nome} (${magia.circulo}º círculo)` }}
      escopo="spell"
      contexto="nesta magia"
      // Regra do livro: por mais desconto que se junte, conjurar custa 1 PM.
      // O truque escapa disso por não ser desconto — é outro jeito de lançar.
      custoMinimo={CUSTO_MINIMO}
      exclusivos={TRUQUE}
      rotulos={{ minimo: "Mínimo de uma conjuração", exclusivo: "Conjurada como truque" }}
      onFechar={onFechar}
    />
  );
}
