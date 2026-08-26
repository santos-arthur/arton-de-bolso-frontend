import { normalizar } from "../components/campo-busca";
import type { Aprimoramento, EscopoAprimoramento } from "./foundry-types";

/**
 * Filtra os aprimoramentos aplicáveis a um uso específico.
 *
 * A restrição por nome vem de um campo de texto preenchido à mão no Foundry,
 * então a comparação é normalizada: no mundo real aparece "Religiao" sem til
 * para a perícia "Religião", e o próprio sistema erra esse caso por comparar
 * as strings cruas.
 */
export function aprimoramentosDe(
  todos: Aprimoramento[],
  escopo: EscopoAprimoramento,
  nomeDoAlvo?: string
): Aprimoramento[] {
  const alvo = nomeDoAlvo ? normalizar(nomeDoAlvo) : null;
  return todos.filter((a) => {
    if (!a.escopos.includes(escopo)) return false;
    if (!a.restritoA.length) return true;
    if (!alvo) return true;
    return a.restritoA.some((nome) => normalizar(nome) === alvo);
  });
}

/** Soma dos modificadores de uma chave ("roll" num teste, "ataque" num golpe). */
export function bonusDe(aprimoramento: Aprimoramento, chave: string): number | null {
  const aplicaveis = aprimoramento.modificadores.filter(
    (m) => m.chave.toLowerCase() === chave && m.valor !== null
  );
  if (!aplicaveis.length) return null;
  return aplicaveis.reduce((soma, m) => soma + (m.valor ?? 0), 0);
}

/** O que o aprimoramento faz, em texto curto, para a linha da lista. */
export function resumoDoEfeito(aprimoramento: Aprimoramento, chave: string): string | null {
  const numerico = bonusDe(aprimoramento, chave);
  if (numerico !== null) return `${numerico >= 0 ? "+" : ""}${numerico} no teste`;
  const formulas = aprimoramento.modificadores.filter((m) => m.chave.toLowerCase() === chave);
  return formulas.length ? formulas.map((m) => m.formula).join(" e ") : null;
}
