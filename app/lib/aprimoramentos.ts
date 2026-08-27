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
  nomeDoAlvo?: string,
  /** Id do item em uso — habilita os efeitos de escopo "self" dele. */
  idDoAlvo?: string
): Aprimoramento[] {
  const alvo = nomeDoAlvo ? normalizar(nomeDoAlvo) : null;
  // "self" é um upgrade do próprio item (a "Maciça" numa arma, o aprimoramento
  // escrito na própria magia): vale só para ele, não para todos do tipo.
  const doProprioItem = (a: Aprimoramento) =>
    a.escopos.includes("self") && !!idDoAlvo && a.origemId === idDoAlvo;

  return todos
    .filter((a) => {
      // Aprimoramento que mora num consumível acabado não é uma opção: sem
      // frasco na mochila não há o que marcar. O item continua na ficha com
      // quantidade 0 — some daqui, não de lá.
      if (a.consumo && a.consumo.disponivel <= 0) return false;
      if (!a.escopos.includes(escopo) && !doProprioItem(a)) return false;
      if (!a.restritoA.length) return true;
      if (!alvo) return true;
      return a.restritoA.some((nome) => normalizar(nome) === alvo);
    })
    // Os do próprio item primeiro: são os que o jogador procura ao abrir a
    // magia ("aumenta a cura em +1d8"), enquanto os gerais valem para tudo e
    // servem de complemento.
    .sort((a, b) => {
      const proprio = Number(doProprioItem(b)) - Number(doProprioItem(a));
      return proprio || a.nome.localeCompare(b.nome, "pt-BR");
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

/**
 * Multiplica uma fórmula pelo número de aplicações, como o sistema faz ao
 * repetir um aprimoramento: cresce a **quantidade de dados**, nunca as faces
 * ("1d8" três vezes é "3d8", não "1d24"), e os valores fixos acompanham.
 * Ver `applyRollChanges` em tormenta20.mjs.
 *
 * Dados e números soltos são tratados na mesma varredura, e não em duas: com
 * dois `replace` encadeados, o segundo reencontrava o número já multiplicado
 * ("10d8" voltava a casar como o "1" de "10") e multiplicava de novo.
 */
export function multiplicarFormula(formula: string, vezes: number): string {
  if (vezes <= 1 || !formula) return formula;
  return formula.replace(
    /(\d*)d(\d+)|(\d+)/gi,
    (_todo, quantidade: string | undefined, faces: string | undefined, numero: string | undefined) =>
      faces === undefined
        ? String(Number(numero) * vezes)
        : `${(Number(quantidade) || 1) * vezes}d${faces}`
  );
}


/** As fórmulas de uma chave que não resolvem para número (dados, por exemplo). */
export function formulasDe(aprimoramento: Aprimoramento, chave: string): string[] {
  return aprimoramento.modificadores
    .filter((m) => m.chave.toLowerCase() === chave && m.valor === null && m.formula)
    .map((m) => m.formula);
}

/**
 * Junta termos iguais de uma rolagem: ["1d8", "+3", "1d8", "3d8", "+2"] vira
 * "5d8 + 5". A decomposição acima da caixa já explica de onde veio cada
 * pedaço — no resultado o que importa é o que se joga na mesa.
 */
export function somarTermos(partes: string[]): string {
  const porFaces = new Map<number, number>();
  let fixo = 0;

  for (const parte of partes) {
    for (const bruto of String(parte).match(/[+-]?\s*\d*d\d+|[+-]?\s*\d+/gi) ?? []) {
      const termo = bruto.replace(/\s+/g, "");
      const sinal = termo.startsWith("-") ? -1 : 1;
      const corpo = termo.replace(/^[+-]/, "");
      const dado = corpo.match(/^(\d*)d(\d+)$/i);
      if (dado) {
        const faces = Number(dado[2]);
        porFaces.set(faces, (porFaces.get(faces) ?? 0) + sinal * (Number(dado[1]) || 1));
      } else {
        fixo += sinal * Number(corpo);
      }
    }
  }

  // Dados maiores primeiro, como se escreve uma fórmula.
  const termos = [...porFaces.entries()]
    .filter(([, quantidade]) => quantidade !== 0)
    .sort(([a], [b]) => b - a)
    .map(([faces, quantidade]) => `${quantidade}d${faces}`);

  if (fixo !== 0) termos.push(String(Math.abs(fixo)));
  if (!termos.length) return "0";

  const sinais = [...porFaces.values()].filter((q) => q !== 0).map(() => "+");
  if (fixo !== 0) sinais.push(fixo > 0 ? "+" : "−");

  return termos.reduce((texto, termo, indice) => (indice === 0 ? termo : `${texto} ${sinais[indice]} ${termo}`), "");
}
