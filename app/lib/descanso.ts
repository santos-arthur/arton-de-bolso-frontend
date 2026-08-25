import type { CondicaoDescanso, OpcoesDescanso } from "./foundry-types";

/**
 * Regras de descanso de Tormenta 20 (p. 106), em um lugar só: a previsão que
 * a tela mostra e o palpite otimista do provider precisam dar exatamente o
 * mesmo número que `actor.descanso` vai aplicar no Foundry.
 */
export const CONDICOES: {
  chave: CondicaoDescanso;
  rotulo: string;
  multiplicador: number;
  recuperacao: string;
  dica: string;
}[] = [
  {
    chave: "ruim",
    rotulo: "Ruim",
    multiplicador: 0.5,
    recuperacao: "metade do nível",
    dica: "Ao relento, sem saco de dormir nem acampamento"
  },
  { chave: "normal", rotulo: "Normal", multiplicador: 1, recuperacao: "igual ao nível", dica: "Estalagem comum" },
  {
    chave: "confortavel",
    rotulo: "Confortável",
    multiplicador: 2,
    recuperacao: "o dobro do nível",
    dica: "Boa estalagem"
  },
  {
    chave: "luxuoso",
    rotulo: "Luxuoso",
    multiplicador: 3,
    recuperacao: "o triplo do nível",
    dica: "Acomodações de luxo"
  }
];

export const DESCANSO_PADRAO: OpcoesDescanso = {
  condicao: "normal",
  pvExtraPorNivel: 0,
  pmExtraPorNivel: 0,
  cuidadosProlongados: false,
  acompanhamentoMedico: false
};

export function condicaoDe(chave: CondicaoDescanso) {
  return CONDICOES.find((c) => c.chave === chave) ?? CONDICOES[1];
}

/**
 * Quanto o descanso recupera. Espelha `descansar` em
 * arton-de-bolso/scripts/adaptador-tormenta20.mjs — Cuidados Prolongados e
 * Acompanhamento Médico somam +1 PV por nível cada.
 */
export function calcularDescanso(nivel: number, opcoes: OpcoesDescanso) {
  const multiplicador = condicaoDe(opcoes.condicao).multiplicador;
  const bonusDeCura = (opcoes.cuidadosProlongados ? 1 : 0) + (opcoes.acompanhamentoMedico ? 1 : 0);
  return {
    pv: Math.floor(nivel * (multiplicador + opcoes.pvExtraPorNivel + bonusDeCura)),
    pm: Math.floor(nivel * (multiplicador + opcoes.pmExtraPorNivel))
  };
}
