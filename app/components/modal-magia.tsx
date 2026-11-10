"use client";

import ModalEngenhoca from "./modal-engenhoca";
import PainelDeUso from "./painel-de-uso";
import { TRUQUE } from "../lib/aprimoramentos";
import type { Magia } from "../lib/foundry-types";

/** Menor custo de uma conjuração, por mais que os descontos somem. */
const CUSTO_MINIMO = 1;

/**
 * Painel de conjurar: o painel de uso com as regras que são de magia — o PM
 * da própria magia na conta (no ataque a arma é de graça, aqui a magia nunca
 * é), o piso de 1 PM e o truque.
 *
 * Engenhoca (módulo t20-engenhocas) é outra conta: não paga os PM da magia,
 * passa por um teste de ativação. Ver `ModalEngenhoca`.
 */
export default function ModalMagia({ magia, onFechar }: { magia: Magia; onFechar: () => void }) {
  const engenhoca = magia.engenhoca;

  if (engenhoca && engenhoca.teste && !engenhoca.gmtools) {
    return <ModalEngenhoca magia={magia} info={engenhoca} onFechar={onFechar} />;
  }

  if (engenhoca) {
    // Sem o teste (desligado no mundo) a engenhoca se usa como magia, sem os
    // PM dela — é o `usarSemTeste` do módulo. Com o GM Tools automatizando o
    // personagem, quem ativa é ele, no Foundry: aqui o painel só mostra.
    return (
      <PainelDeUso
        acao={{
          ...magia,
          custo: 0,
          rotuloDoCusto: magia.nome,
          ativacao: engenhoca.execucao,
          cd: engenhoca.cdResistencia.total
        }}
        escopo="spell"
        contexto="nesta engenhoca"
        exclusivos={TRUQUE}
        rotulos={{ exclusivo: "Ativada como truque" }}
        rodape={
          engenhoca.gmtools
            ? () => (
                <p className="flex min-h-12 flex-row items-center justify-center text-center text-sm font-semibold opacity-60">
                  O GM Tools automatiza as engenhocas deste personagem — ative pelo Foundry.
                </p>
              )
            : undefined
        }
        onFechar={onFechar}
      />
    );
  }

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
