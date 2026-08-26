"use client";

import { faCheck, faCoins, faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState } from "react";
import FolhaModal from "./folha-modal";
import { aprimoramentosDe, bonusDe, resumoDoEfeito } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { Aprimoramento, Arma } from "../lib/foundry-types";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

function LinhaAprimoramento({
  item,
  marcado,
  travado,
  aoAlternar
}: {
  item: Aprimoramento;
  marcado: boolean;
  travado: boolean;
  aoAlternar: () => void;
}) {
  const ataque = resumoDoEfeito(item, "ataque");
  const dano = resumoDoEfeito(item, "dano");
  const detalhes = [
    ataque && `${ataque.replace(" no teste", "")} no ataque`,
    dano && `${dano.replace(" no teste", "")} de dano`,
    item.custo > 0 ? `${item.custo} PM` : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <label
      className={`flex flex-row items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        travado ? "cursor-default opacity-70" : "cursor-pointer"
      } ${marcado ? "border-acento bg-acento/10" : "border-borda bg-superficie-alta hover:bg-foreground/[0.03]"}`}
    >
      <input
        type="checkbox"
        checked={marcado}
        onChange={aoAlternar}
        disabled={travado}
        className="checkbox-personalizado mt-0.5 size-5 shrink-0 cursor-pointer rounded border border-borda disabled:cursor-default"
      />
      {item.img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.img} alt="" className="mt-0.5 size-8 shrink-0 rounded-lg object-cover" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-bold">{item.nome}</span>
        {detalhes && <span className="numero text-xs font-semibold text-acento">{detalhes}</span>}
        {item.descricao && (
          <span className="prosa-foundry text-xs opacity-70" dangerouslySetInnerHTML={{ __html: item.descricao }} />
        )}
      </span>
    </label>
  );
}

/**
 * Painel de ataque de uma arma: de onde vem o número que se soma ao d20, o
 * dano, o crítico e o que dá para ativar gastando PM. Nada é rolado aqui —
 * o dado é o da mesa.
 */
export default function ModalAtaque({ arma, onFechar }: { arma: Arma; onFechar: () => void }) {
  const { ficha, somenteLeitura, ajustarPM } = useFoundry();
  const [marcados, setMarcados] = useState<string[]>([]);
  const [pago, setPago] = useState(false);

  const todos = ficha?.aprimoramentos;
  // Escopo "attack"; se o efeito restringe por nome, o nome da arma precisa estar na lista.
  const aplicaveis = useMemo(() => aprimoramentosDe(todos ?? [], "attack", arma.nome), [todos, arma.nome]);

  const pmAtual = ficha?.pm.atual ?? 0;
  const escolhidos = aplicaveis.filter((a) => marcados.includes(a.id));
  const bonusAtaque = escolhidos.reduce((soma, a) => soma + (bonusDe(a, "ataque") ?? 0), 0);
  const bonusDano = escolhidos.reduce((soma, a) => soma + (bonusDe(a, "dano") ?? 0), 0);
  const custoTotal = escolhidos.reduce((soma, a) => soma + Math.max(0, a.custo), 0);
  const semPM = custoTotal > pmAtual;

  const totalAtaque = (arma.ataque?.total ?? 0) + bonusAtaque;
  const estaTravado = (item: Aprimoramento) => pago && item.custo > 0;

  function alternar(item: Aprimoramento) {
    if (estaTravado(item)) return;
    setMarcados((atual) =>
      atual.includes(item.id) ? atual.filter((i) => i !== item.id) : [...atual, item.id]
    );
  }

  function gastar() {
    if (somenteLeitura || pago || semPM || custoTotal === 0) return;
    ajustarPM(-custoTotal);
    setPago(true);
  }

  return (
    <FolhaModal
      titulo={arma.nome}
      onFechar={onFechar}
      rodape={
        custoTotal === 0 ? undefined : somenteLeitura ? (
          <p className="flex min-h-12 flex-row items-center justify-center gap-2 text-sm font-semibold opacity-60">
            <FontAwesomeIcon icon={faEye} className="size-3.5!" />
            <span className="numero">Custaria {custoTotal} PM</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={gastar}
            disabled={pago || semPM}
            className={`flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity ${
              pago
                ? "border border-borda opacity-60"
                : semPM
                  ? "border border-borda opacity-50"
                  : "bg-acento text-white hover:opacity-90"
            }`}
          >
            <FontAwesomeIcon icon={pago ? faCheck : faCoins} className="size-4!" />
            {pago ? `${custoTotal} PM gastos` : semPM ? "Sem PM suficiente" : `Gastar ${custoTotal} PM`}
          </button>
        )
      }
    >
      {/* O que se joga na mesa, em destaque: rolagem de ataque e de dano. */}
      <div className="flex flex-row gap-2">
        <div className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border border-borda bg-superficie-alta px-3 py-3 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Ataque</span>
          <span className="numero text-xl font-bold">1d20 {formatar(totalAtaque)}</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-0.5 rounded-xl border border-borda bg-superficie-alta px-3 py-3 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Crítico</span>
          <span className="numero text-xl font-bold">{arma.critico.texto}</span>
        </div>
      </div>

      {arma.dano.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Dano</span>
          {arma.dano.map((dano) => (
            <div
              key={dano.nome}
              className="flex flex-row items-baseline justify-between gap-3 rounded-xl border border-borda bg-superficie-alta px-4 py-2.5"
            >
              <span className="numero text-lg font-bold">
                {dano.formula}
                {bonusDano !== 0 && <span className="text-acento"> {formatar(bonusDano)}</span>}
              </span>
              {dano.tipo && <span className="text-xs opacity-60">{dano.tipo}</span>}
            </div>
          ))}
        </div>
      )}

      {arma.ataque && arma.ataque.itens.length > 0 && (
        <div className="flex flex-col">
          <span className="pb-1 text-[11px] font-bold uppercase tracking-wider opacity-55">De onde vem o ataque</span>
          {arma.ataque.itens.map((item) => (
            <div
              key={item.rotulo}
              className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2 last:border-b-0"
            >
              <span className="min-w-0 truncate text-sm opacity-80">{item.rotulo}</span>
              <span className="numero shrink-0 text-sm font-semibold">{formatar(item.valor)}</span>
            </div>
          ))}
          {escolhidos.map((a) => {
            const bonus = bonusDe(a, "ataque");
            if (bonus === null) return null;
            return (
              <div
                key={a.id}
                className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2 text-acento last:border-b-0"
              >
                <span className="min-w-0 truncate text-sm font-semibold">{a.nome}</span>
                <span className="numero shrink-0 text-sm font-bold">{formatar(bonus)}</span>
              </div>
            );
          })}
          <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t-2 border-borda pt-2 font-bold">
            <span>Total</span>
            <span className="numero">{formatar(totalAtaque)}</span>
          </div>
        </div>
      )}

      {aplicaveis.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">
            {somenteLeitura ? "Pode usar neste ataque" : "Marque o que vai usar neste ataque"} · {pmAtual} PM disponíveis
          </span>
          {aplicaveis.map((item) => (
            <LinhaAprimoramento
              key={item.id}
              item={item}
              marcado={marcados.includes(item.id)}
              travado={estaTravado(item)}
              aoAlternar={() => alternar(item)}
            />
          ))}
        </div>
      )}
    </FolhaModal>
  );
}
