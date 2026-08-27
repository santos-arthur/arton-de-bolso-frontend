"use client";

import { useMemo } from "react";
import FolhaModal from "./folha-modal";
import { ListaAprimoramentos, RodapeGasto, useAprimoramentos, useCongelado } from "./lista-aprimoramentos";
import { aprimoramentosDe, bonusDe } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { FormulaPericia } from "../lib/foundry-types";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

const CHAVES = [{ chave: "roll", rotulo: "no teste" }];

/**
 * Decomposição de um teste de perícia. O app nunca rola nada — isto mostra de
 * onde vem o número que você soma ao d20 rolado na mesa, e o que dá para
 * ativar para melhorá-lo.
 */
export default function ModalFormulaPericia({
  formula: atual,
  onFechar
}: {
  formula: FormulaPericia;
  onFechar: () => void;
}) {
  const { ficha } = useFoundry();
  const todos = ficha?.aprimoramentos;
  const rotulo = atual?.label;
  // Só os que valem para *esta* perícia: escopo "skill" e, se houver
  // restrição por nome, o nome dela na lista.
  const aplicaveis = useMemo(() => aprimoramentosDe(todos ?? [], "skill", rotulo), [todos, rotulo]);

  const uso = useAprimoramentos(aplicaveis, { acao: rotulo ?? "Teste de perícia" });
  // Pago o uso, o painel vira extrato: a fórmula que chega da ficha nova não
  // mexe mais no que está na tela.
  const formula = useCongelado(atual, uso.pago);
  const total = formula?.total ?? 0;
  const bonus = uso.bonusTotal("roll");

  return (
    <FolhaModal titulo={rotulo ?? "Perícia"} onFechar={onFechar} rodape={<RodapeGasto uso={uso} />}>
      {formula ? (
        <>
          <div className="flex flex-col text-base">
            {/* As linhas ficam num container próprio: com o Total no mesmo
                nível, o `last:border-b-0` se aplicaria a ele e a última linha
                mantinha a borda, duplicando com a borda do Total. */}
            <div className="flex flex-col">
            {formula.partes.map((parte) => (
              <div
                key={parte.rotulo}
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
              <span>Total</span>
              <span className="numero">{formatar(total + bonus)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-borda bg-superficie-alta px-4 py-3 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Role na mesa</span>
            <p className="numero text-xl font-bold">1d20 {formatar(total + bonus)}</p>
          </div>

          <ListaAprimoramentos uso={uso} chaves={CHAVES} contexto="neste teste" />
        </>
      ) : (
        <p className="text-sm opacity-60">Sem detalhamento para esta perícia.</p>
      )}
    </FolhaModal>
  );
}
