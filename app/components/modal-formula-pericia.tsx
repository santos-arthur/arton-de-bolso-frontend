"use client";

import FolhaModal from "./folha-modal";
import type { FormulaPericia } from "../lib/foundry-types";

/**
 * Decomposição de um teste de perícia. Usa a mesma folha dos outros
 * detalhamentos: sobe do rodapé no celular, modal centrado a partir de sm.
 * O app nunca rola nada — isto mostra de onde vem o número que você soma ao
 * d20 rolado na mesa.
 */
export default function ModalFormulaPericia({
  formula,
  onFechar
}: {
  formula: FormulaPericia;
  onFechar: () => void;
}) {
  return (
    <FolhaModal titulo={formula?.label ?? "Perícia"} onFechar={onFechar}>
      {formula ? (
        <>
          <div className="flex flex-col gap-2 text-base">
            {formula.partes.map((parte) => (
              <div key={parte.rotulo} className="flex flex-row items-center justify-between gap-4">
                <span className="min-w-0 truncate opacity-80">{parte.rotulo}</span>
                <span className="numero shrink-0 font-semibold">{parte.valorFormatado}</span>
              </div>
            ))}
            <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t border-borda pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="numero">{formula.totalFormatado}</span>
            </div>
          </div>

          <div className="rounded-xl border border-borda bg-superficie-alta px-4 py-3 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Role na mesa</span>
            <p className="numero text-xl font-bold">1d20 {formula.totalFormatado}</p>
          </div>
        </>
      ) : (
        <p className="text-sm opacity-60">Sem detalhamento para esta perícia.</p>
      )}
    </FolhaModal>
  );
}
