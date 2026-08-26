"use client";

import { faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState } from "react";
import FolhaModal from "./folha-modal";
import { aprimoramentosDe, bonusDe, resumoDoEfeito } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { Aprimoramento, FormulaPericia } from "../lib/foundry-types";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

/**
 * Marcar é só planejar o teste — nada sai da ficha aqui. O PM só é cobrado
 * quando o jogador confirma no rodapé, porque na mesa é comum experimentar
 * combinações antes de decidir o que vale a pena gastar.
 */
function LinhaAprimoramento({
  item,
  marcado,
  aoAlternar
}: {
  item: Aprimoramento;
  marcado: boolean;
  aoAlternar: () => void;
}) {
  const efeito = resumoDoEfeito(item, "roll");
  const detalhes = [efeito, item.custo > 0 ? `${item.custo} PM` : null].filter(Boolean).join(" · ");

  return (
    <label
      className={`flex cursor-pointer flex-row items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        marcado ? "border-acento bg-acento/10" : "border-borda bg-superficie-alta hover:bg-foreground/[0.03]"
      }`}
    >
      <input
        type="checkbox"
        checked={marcado}
        onChange={aoAlternar}
        className="checkbox-personalizado mt-0.5 size-5 shrink-0 cursor-pointer rounded border border-borda"
      />

      {item.img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.img} alt="" className="mt-0.5 size-8 shrink-0 rounded-lg object-cover" />
      )}

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-bold">{item.nome}</span>
        {detalhes && <span className="numero text-xs font-semibold text-acento">{detalhes}</span>}
        {item.descricao && (
          <span
            className="prosa-foundry text-xs opacity-70"
            dangerouslySetInnerHTML={{ __html: item.descricao }}
          />
        )}
      </span>
    </label>
  );
}

/**
 * Decomposição de um teste de perícia. O app nunca rola nada — isto mostra de
 * onde vem o número que você soma ao d20 rolado na mesa, e o que dá para
 * ativar para melhorá-lo.
 */
export default function ModalFormulaPericia({
  formula,
  onFechar
}: {
  formula: FormulaPericia;
  onFechar: () => void;
}) {
  const { ficha, ajustarPM } = useFoundry();
  const [marcados, setMarcados] = useState<string[]>([]);
  /** Quanto de PM já foi cobrado nesta abertura, para não cobrar duas vezes. */
  const [jaPago, setJaPago] = useState(0);

  const todos = ficha?.aprimoramentos;
  const rotulo = formula?.label;
  // Só os que valem para *esta* perícia: escopo "skill" e, se houver
  // restrição por nome, o nome dela na lista.
  const aplicaveis = useMemo(() => aprimoramentosDe(todos ?? [], "skill", rotulo), [todos, rotulo]);

  const pmAtual = ficha?.pm.atual ?? 0;
  const total = formula?.total ?? 0;
  const escolhidos = aplicaveis.filter((a) => marcados.includes(a.id));

  const bonusAplicado = escolhidos.reduce((soma, a) => soma + (bonusDe(a, "roll") ?? 0), 0);
  const custoTotal = escolhidos.reduce((soma, a) => soma + Math.max(0, a.custo), 0);
  const aPagar = Math.max(0, custoTotal - jaPago);
  const semPM = aPagar > pmAtual;

  function alternar(id: string) {
    setMarcados((atual) => (atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id]));
  }

  function gastar() {
    ajustarPM(-aPagar);
    setJaPago(custoTotal);
  }

  return (
    <FolhaModal
      titulo={rotulo ?? "Perícia"}
      onFechar={onFechar}
      rodape={
        custoTotal > 0 ? (
          <button
            type="button"
            onClick={gastar}
            disabled={aPagar === 0 || semPM}
            className={`flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity ${
              aPagar === 0
                ? "border border-borda opacity-60"
                : semPM
                  ? "border border-borda opacity-50"
                  : "bg-acento text-white hover:opacity-90"
            }`}
          >
            <FontAwesomeIcon icon={faCoins} className="size-4!" />
            {aPagar === 0 ? `${custoTotal} PM gastos` : semPM ? "Sem PM suficiente" : `Gastar ${aPagar} PM`}
          </button>
        ) : undefined
      }
    >
      {formula ? (
        <>
          <div className="flex flex-col text-base">
            {formula.partes.map((parte) => (
              <div
                key={parte.rotulo}
                className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5 last:border-b-0"
              >
                <span className="min-w-0 truncate opacity-80">{parte.rotulo}</span>
                <span className="numero shrink-0 font-semibold">{parte.valorFormatado}</span>
              </div>
            ))}
            {escolhidos.map((a) => {
              const bonus = bonusDe(a, "roll");
              if (bonus === null) return null;
              return (
                <div
                  key={a.id}
                  className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5 text-acento"
                >
                  <span className="min-w-0 truncate font-semibold">{a.nome}</span>
                  <span className="numero shrink-0 font-bold">{formatar(bonus)}</span>
                </div>
              );
            })}
            <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t-2 border-borda pt-3 text-xl font-bold">
              <span>Total</span>
              <span className="numero">{formatar(total + bonusAplicado)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-borda bg-superficie-alta px-4 py-3 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Role na mesa</span>
            <p className="numero text-xl font-bold">1d20 {formatar(total + bonusAplicado)}</p>
          </div>

          {aplicaveis.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">
                Marque o que vai usar neste teste · {pmAtual} PM disponíveis
              </span>
              {aplicaveis.map((item) => (
                <LinhaAprimoramento
                  key={item.id}
                  item={item}
                  marcado={marcados.includes(item.id)}
                  aoAlternar={() => alternar(item.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm opacity-60">Sem detalhamento para esta perícia.</p>
      )}
    </FolhaModal>
  );
}
