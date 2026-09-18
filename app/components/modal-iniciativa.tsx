"use client";

import { useMemo, useState } from "react";
import { FaDiceD20 } from "react-icons/fa6";
import FolhaModal from "./folha-modal";
import { ListaAprimoramentos, useAprimoramentos } from "./lista-aprimoramentos";
import { aprimoramentosDe, bonusDe } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { FormulaPericia } from "../lib/foundry-types";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

const CHAVES = [{ chave: "roll", rotulo: "na iniciativa" }];

/**
 * Iniciativa: o mesmo painel de um teste de perícia — de onde vem o número,
 * o que dá para gastar para melhorá-lo — mais o campo do dado.
 *
 * O campo existe porque o app não rola nada: quem rola é a mesa, no d20 de
 * verdade, e é esse resultado que se digita aqui. O que o Foundry faz com
 * ele é somar a perícia e os aprimoramentos marcados e gravar a iniciativa
 * no encontro, que é o passo que hoje obrigaria alguém a ir até o
 * computador do mestre.
 *
 * Um toque só no fim: o "Salvar" cobra o que foi marcado (PM e itens, com o
 * aviso no chat da mesa) e grava a iniciativa. Separar as duas coisas em
 * dois botões faria o jogador pagar e esquecer de gravar — ou o contrário.
 *
 * Vale uma vez por combate: gravada a iniciativa, a tela passa a só mostrar
 * o número, e quem precisar corrigi-lo faz isso pelo rastreador do mestre —
 * é lá que a ordem da mesa é decidida.
 */
export default function ModalIniciativa({
  formula,
  onFechar
}: {
  formula: FormulaPericia | null;
  onFechar: () => void;
}) {
  const { ficha, somenteLeitura, definirIniciativa } = useFoundry();
  const [d20, setD20] = useState("");

  const rotulo = formula?.label ?? "Iniciativa";
  const aplicaveis = useMemo(
    () => aprimoramentosDe(ficha?.aprimoramentos ?? [], "skill", rotulo),
    [ficha?.aprimoramentos, rotulo]
  );
  const uso = useAprimoramentos(aplicaveis, { acao: rotulo });

  const base = formula?.total ?? 0;
  const bonus = uso.bonusTotal("roll");
  const dado = Number.parseInt(d20, 10);
  const dadoValido = Number.isFinite(dado) && dado >= 1 && dado <= 20;
  const total = dadoValido ? dado + base + bonus : null;

  function salvar() {
    if (!dadoValido || somenteLeitura) return;
    // O gasto só acontece se houver o que gastar — e uma vez só, mesmo que o
    // jogador salve de novo para corrigir o número do dado.
    if (!uso.pago && (uso.custoTotal > 0 || uso.itensGastos.length > 0)) uso.gastar();
    definirIniciativa(
      dado,
      uso.escolhidos.map((item) => ({ id: item.id, vezes: uso.quantidadeDe(item) }))
    );
    onFechar();
  }

  const impedido = uso.semPM ? "Sem PM suficiente" : uso.faltando ? `Sem ${uso.faltando.nome}` : null;

  const rodape = somenteLeitura ? undefined : (
    <button
      type="button"
      onClick={salvar}
      disabled={!dadoValido || !!impedido}
      className={`flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity disabled:transition-none ${
        !dadoValido || impedido ? "border border-borda opacity-50" : "bg-acento text-acento-tinta hover:opacity-90"
      }`}
    >
      <FaDiceD20 aria-hidden="true" className="size-4! shrink-0" />
      {impedido ??
        (total === null
          ? "Digite o resultado do d20"
          : `Salvar iniciativa ${total}${uso.resumoDoGasto ? ` · ${uso.resumoDoGasto}` : ""}`)}
    </button>
  );

  return (
    <FolhaModal titulo={rotulo} onFechar={onFechar} rodape={rodape}>
      {formula ? (
        <div className="flex flex-col text-base">
          <div className="flex flex-col">
            {formula.partes.map((parte, indice) => (
              <div
                key={`${parte.rotulo}-${indice}`}
                className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5 last:border-b-0"
              >
                <span className="min-w-0 truncate opacity-80">{parte.rotulo}</span>
                <span className="numero shrink-0 font-semibold">{parte.valorFormatado}</span>
              </div>
            ))}
            {uso.escolhidos.map((item) => {
              const valor = bonusDe(item, "roll");
              if (valor === null) return null;
              const vezes = uso.quantidadeDe(item);
              return (
                <div
                  key={item.id}
                  className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5 text-acento"
                >
                  <span className="min-w-0 truncate font-semibold">
                    {item.nome}
                    {vezes > 1 && <span className="numero opacity-70"> ×{vezes}</span>}
                  </span>
                  <span className="numero shrink-0 font-bold">{formatar(valor * vezes)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t-2 border-borda pt-3 text-xl font-bold">
            <span>Modificador</span>
            <span className="numero">{formatar(base + bonus)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm opacity-60">Sem detalhamento da Iniciativa nesta ficha.</p>
      )}

      {/* O dado da mesa. `inputMode="numeric"` abre o teclado de números no
          celular, que é onde isto vai ser digitado com o d20 ainda na mão. */}
      <label className="flex flex-col gap-2 rounded-xl border border-borda bg-superficie-alta px-4 py-3">
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Resultado do d20</span>
        <div className="flex flex-row items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={d20}
            onChange={(evento) => setD20(evento.target.value.replace(/\D/g, "").slice(0, 2))}
            placeholder="—"
            aria-label="Resultado do d20"
            className="numero w-20 rounded-lg border border-borda bg-transparent px-3 py-2 text-center text-2xl font-bold outline-none focus:border-acento"
          />
          <span className="numero text-lg opacity-60">
            {formatar(base + bonus)} ={" "}
            <span className="font-bold opacity-100">{total ?? "—"}</span>
          </span>
        </div>
        {d20 !== "" && !dadoValido && (
          <span className="text-xs text-red-700 dark:text-red-400">O d20 vai de 1 a 20.</span>
        )}
      </label>

      <ListaAprimoramentos uso={uso} chaves={CHAVES} contexto="nesta iniciativa" />
    </FolhaModal>
  );
}
