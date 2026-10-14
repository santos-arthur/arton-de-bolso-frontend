"use client";

import { useState } from "react";
import { FaCoins, FaDiceD20, FaHammer, FaHouseCrack } from "react-icons/fa6";
import CampoSelect from "./campo-select";
import FolhaModal from "./folha-modal";
import { useFoundry } from "../lib/foundry-provider";
import type { Base, ComodoDeBase } from "../lib/foundry-types";
import { tibares } from "../lib/negocios";

const BOTAO_PRINCIPAL =
  "flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity disabled:transition-none";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

/**
 * O início de uma aventura: paga a manutenção, ou não paga e um cômodo se
 * danifica — escolhido ou sorteado. O app não mexe nos T$ da ficha: como no
 * módulo, o valor vai para o card do chat e a mesa desconta de quem pagou.
 */
export function ModalInicioAventura({ base, onFechar }: { base: Base; onFechar: () => void }) {
  const { iniciarAventuraBase } = useFoundry();
  const inteiros = base.comodos.filter((c) => !c.danificado);
  const [danificar, setDanificar] = useState("sorteio");

  function confirmar(pagar: boolean) {
    iniciarAventuraBase(base.id, pagar, pagar ? null : inteiros.length ? danificar : null);
    onFechar();
  }

  const rodape = (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => confirmar(true)}
        className={`${BOTAO_PRINCIPAL} bg-acento text-acento-tinta hover:opacity-90`}
      >
        <FaCoins aria-hidden="true" className="size-4! shrink-0" />
        Pagar {tibares(base.manutencao)}
      </button>
      <button
        type="button"
        onClick={() => confirmar(false)}
        className={`${BOTAO_PRINCIPAL} border border-borda hover:bg-foreground/5`}
      >
        <FaHouseCrack aria-hidden="true" className="size-4! shrink-0" />
        Não pagar
      </button>
    </div>
  );

  return (
    <FolhaModal titulo="Início de aventura" onFechar={onFechar} rodape={rodape}>
      <p className="text-sm opacity-70">
        A manutenção de {base.nome} ({base.porte.toLowerCase()}) é de {tibares(base.manutencao)} por aventura. Sem
        pagar, um cômodo é danificado e para de dar bônus até ser reparado.
      </p>
      <p className="text-xs opacity-60">O valor sai da ficha de quem pagar, à mão — o app só registra no chat.</p>

      {inteiros.length > 0 ? (
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Se não pagar, danifica</span>
          <CampoSelect value={danificar} onChange={(evento) => setDanificar(evento.target.value)}>
            <option value="sorteio">Um cômodo sorteado</option>
            {inteiros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </CampoSelect>
        </label>
      ) : (
        <p className="text-sm opacity-60">Não há cômodo inteiro para danificar.</p>
      )}
    </FolhaModal>
  );
}

/** Reparar um cômodo danificado: ação entre aventuras e metade do custo dele. */
export function ModalRepararComodo({
  base,
  comodo,
  onFechar
}: {
  base: Base;
  comodo: ComodoDeBase;
  onFechar: () => void;
}) {
  const { repararComodo } = useFoundry();

  function confirmar() {
    repararComodo(base.id, comodo.id);
    onFechar();
  }

  const rodape = (
    <button
      type="button"
      onClick={confirmar}
      className={`${BOTAO_PRINCIPAL} bg-acento text-acento-tinta hover:opacity-90`}
    >
      <FaHammer aria-hidden="true" className="size-4! shrink-0" />
      Reparar por {tibares(base.custoReparo)}
    </button>
  );

  return (
    <FolhaModal titulo={`Reparar ${comodo.nome}`} onFechar={onFechar} rodape={rodape}>
      <p className="text-sm opacity-70">
        Custa uma ação entre aventuras e {tibares(base.custoReparo)}. Reparado, o cômodo e as mobílias dele voltam a
        dar bônus.
      </p>
      <p className="text-xs opacity-60">O valor sai da ficha de quem pagar, à mão — o app só registra no chat.</p>
    </FolhaModal>
  );
}

/**
 * O rendimento do Empreendimento: teste de Inteligência com bônus igual à
 * capacidade de cômodos, em tibares de ouro — o dobro para quem gastou a ação
 * do intervalo administrando. O d20 é o da mesa; quem soma é o Foundry.
 */
export function ModalEmpreendimento({
  base,
  bonusInteligencia,
  bonusCapacidade,
  onFechar
}: {
  base: Base;
  bonusInteligencia: number;
  bonusCapacidade: number;
  onFechar: () => void;
}) {
  const { apurarEmpreendimento } = useFoundry();
  const [d20, setD20] = useState("");
  const [dedicado, setDedicado] = useState(false);

  const bonus = bonusInteligencia + bonusCapacidade;
  const dado = Number.parseInt(d20, 10);
  const dadoValido = Number.isFinite(dado) && dado >= 1 && dado <= 20;
  const total = dadoValido ? dado + bonus : null;
  const emOuro = total === null ? null : Math.max(0, total) * (dedicado ? 2 : 1);

  function confirmar() {
    if (!dadoValido) return;
    apurarEmpreendimento(base.id, dado, dedicado);
    onFechar();
  }

  const rodape = (
    <button
      type="button"
      onClick={confirmar}
      disabled={!dadoValido}
      className={`${BOTAO_PRINCIPAL} ${
        dadoValido ? "bg-acento text-acento-tinta hover:opacity-90" : "border border-borda opacity-50"
      }`}
    >
      <FaDiceD20 aria-hidden="true" className="size-4! shrink-0" />
      {emOuro === null ? "Digite o resultado do d20" : `Render TO ${emOuro}`}
    </button>
  );

  return (
    <FolhaModal titulo="Rendimento do Empreendimento" onFechar={onFechar} rodape={rodape}>
      <p className="text-sm opacity-70">
        Uma vez por intervalo entre aventuras: teste de Inteligência com +{bonusCapacidade} (a capacidade de cômodos
        de {base.nome}). O resultado vira tibares de ouro.
      </p>

      {/* Mesmo campo do render com teste: o teclado numérico abre com o d20 ainda na mão. */}
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
            {formatar(bonus)} = <span className="font-bold opacity-100">{total ?? "—"}</span>
          </span>
        </div>
        {d20 !== "" && !dadoValido && (
          <span className="text-xs text-red-700 dark:text-red-400">O d20 vai de 1 a 20.</span>
        )}
      </label>

      <label className="flex flex-row items-start gap-3 rounded-xl border border-borda bg-superficie-alta px-3 py-2.5">
        <input
          type="checkbox"
          checked={dedicado}
          onChange={(evento) => setDedicado(evento.target.checked)}
          className="checkbox-personalizado mt-0.5 size-5 shrink-0 cursor-pointer rounded border border-borda"
        />
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold">Dediquei a ação do intervalo</span>
          <span className="text-xs opacity-60">Quem gasta a própria ação administrando recebe o dobro.</span>
        </span>
      </label>

      <div className="flex flex-col text-base">
        <div className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5">
          <span className="opacity-80">Inteligência</span>
          <span className="numero font-semibold">{formatar(bonusInteligencia)}</span>
        </div>
        <div className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5">
          <span className="opacity-80">Capacidade de cômodos</span>
          <span className="numero font-semibold">{formatar(bonusCapacidade)}</span>
        </div>
        {dedicado && (
          <div className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5 text-acento">
            <span className="font-semibold">Dedicado</span>
            <span className="numero font-bold">×2</span>
          </div>
        )}
        <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t-2 border-borda pt-3 text-xl font-bold">
          <span>Rendimento</span>
          <span className="numero">{emOuro === null ? "—" : `TO ${emOuro}`}</span>
        </div>
        {emOuro !== null && <span className="pt-2 text-xs opacity-60">Equivale a {tibares(emOuro * 10)}.</span>}
      </div>
    </FolhaModal>
  );
}
