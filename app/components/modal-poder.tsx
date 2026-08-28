"use client";

import PainelDeUso from "./painel-de-uso";
import type { Poder } from "../lib/foundry-types";

/**
 * Painel de ativar um poder. É o mesmo painel da magia porque no sistema o
 * molde é o mesmo (`PowerData` e `SpellData` compartilham ativação,
 * resistência e rolagens) — o que muda são as regras que não valem aqui:
 *
 * - **sem piso de PM**: o mínimo de 1 é regra de conjuração, e um poder pode
 *   custar zero, cobrando só a ação;
 * - **sem truque**: truque é jeito de lançar magia, não de usar poder.
 *
 * Ativar sempre tem botão, mesmo sem custo. Num toque ele faz as três coisas
 * que ativar um poder significa: cobra o que custa, **liga na ficha os efeitos
 * do poder** (a Fúria, o Frenesi) e publica na mesa o card do sistema — o
 * mesmo que o Foundry mostra quando o poder é usado por lá.
 */
export default function ModalPoder({ poder, onFechar }: { poder: Poder; onFechar: () => void }) {
  return (
    <PainelDeUso
      acao={{ ...poder, rotuloDoCusto: poder.nome }}
      escopo="power"
      contexto="neste poder"
      anunciarNaMesa
      onFechar={onFechar}
    />
  );
}
