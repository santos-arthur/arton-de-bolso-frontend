"use client";

import { useState } from "react";
import { FaCoins, FaDiceD20 } from "react-icons/fa6";
import CampoSelect from "./campo-select";
import FolhaModal from "./folha-modal";
import { useFoundry } from "../lib/foundry-provider";
import type { Negocio, PericiaDeNegocio } from "../lib/foundry-types";
import { tibares } from "../lib/negocios";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

/**
 * Confirmação do rendimento de um negócio, nos dois jeitos que as regras dão:
 *
 *   normal — o valor básico do nível, sem teste;
 *   teste  — o mês dedicado: o jogador escolhe Nobreza ou um Ofício, rola o
 *            d20 na mesa e digita o resultado. O total multiplica o nível.
 *
 * O app não rola nada: a conta mostrada aqui é só prévia, quem soma o bônus da
 * perícia e grava é o Foundry. Os dois modos passam por esta folha porque o
 * módulo não trava o rendimento por período — um toque sem querer renderia de
 * novo, e o confirmar é o que segura isso.
 */
export default function ModalRenderNegocio({
  negocio,
  pericias,
  modo,
  onFechar
}: {
  negocio: Negocio;
  pericias: PericiaDeNegocio[];
  modo: "normal" | "teste";
  onFechar: () => void;
}) {
  const { renderNegocio } = useFoundry();
  // Começa na perícia de maior bônus — é a que o jogador vai querer quase sempre.
  const [pericia, setPericia] = useState(
    () => [...pericias].sort((a, b) => b.bonus - a.bonus)[0]?.chave ?? ""
  );
  const [d20, setD20] = useState("");

  const escolhida = pericias.find((p) => p.chave === pericia) ?? null;
  const bonus = escolhida?.bonus ?? 0;
  const dado = Number.parseInt(d20, 10);
  const dadoValido = Number.isFinite(dado) && dado >= 1 && dado <= 20;
  const total = dadoValido ? dado + bonus : null;
  const rendimento = (resultado: number) => resultado * negocio.fatorDedicado * negocio.nivel;
  const valorTeste = total === null ? null : rendimento(total);

  const podeConfirmar = modo === "normal" || (dadoValido && !!escolhida);

  function confirmar() {
    if (!podeConfirmar) return;
    if (modo === "normal") renderNegocio(negocio.id);
    else renderNegocio(negocio.id, { pericia, d20: dado });
    onFechar();
  }

  const rodape = (
    <button
      type="button"
      onClick={confirmar}
      disabled={!podeConfirmar}
      className={`flex min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity disabled:transition-none ${
        podeConfirmar ? "bg-acento text-acento-tinta hover:opacity-90" : "border border-borda opacity-50"
      }`}
    >
      {modo === "normal" ? (
        <FaCoins aria-hidden="true" className="size-4! shrink-0" />
      ) : (
        <FaDiceD20 aria-hidden="true" className="size-4! shrink-0" />
      )}
      {modo === "normal"
        ? `Render ${tibares(negocio.rendimentoBase)}`
        : valorTeste === null
          ? "Digite o resultado do d20"
          : `Render ${tibares(valorTeste)}`}
    </button>
  );

  return (
    <FolhaModal titulo={modo === "normal" ? "Render" : "Render com teste"} onFechar={onFechar} rodape={rodape}>
      <p className="text-sm opacity-70">
        {negocio.nome} · nível {negocio.nivel}. O valor vai para o cofre do negócio
        {negocio.cofre > 0 ? ` (hoje ${tibares(negocio.cofre)})` : ""}, não direto para a ficha.
      </p>

      {modo === "normal" ? (
        <div className="flex flex-col text-base">
          <div className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5">
            <span className="opacity-80">Nível do negócio</span>
            <span className="numero font-semibold">{negocio.nivel}</span>
          </div>
          {negocio.emporio && (
            <div className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5 text-acento">
              <span className="font-semibold">Empório</span>
              <span className="numero font-bold">×10</span>
            </div>
          )}
          <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t-2 border-borda pt-3 text-xl font-bold">
            <span>Rendimento</span>
            <span className="numero">{tibares(negocio.rendimentoBase)}</span>
          </div>
        </div>
      ) : pericias.length === 0 ? (
        <p className="text-sm opacity-60">Esta ficha não tem Nobreza nem Ofício para o teste.</p>
      ) : (
        <>
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Perícia</span>
            <CampoSelect value={pericia} onChange={(evento) => setPericia(evento.target.value)}>
              {pericias.map((p) => (
                <option key={p.chave} value={p.chave}>
                  {p.rotulo} ({formatar(p.bonus)})
                </option>
              ))}
            </CampoSelect>
          </label>

          {/* Mesmo campo do modal de iniciativa: o teclado numérico abre com o
              d20 ainda na mão. */}
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

          <div className="flex flex-col text-base">
            <div className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5">
              <span className="opacity-80">Resultado do teste</span>
              <span className="numero font-semibold">{total ?? "—"}</span>
            </div>
            <div className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-2.5">
              <span className="opacity-80">× T$ {negocio.fatorDedicado}{negocio.emporio ? " (Empório)" : ""}</span>
              <span className="numero font-semibold">× nível {negocio.nivel}</span>
            </div>
            <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t-2 border-borda pt-3 text-xl font-bold">
              <span>Rendimento</span>
              <span className="numero">{valorTeste === null ? "—" : tibares(valorTeste)}</span>
            </div>
            <span className="pt-2 text-xs opacity-60">
              Vai de {tibares(rendimento(1 + bonus))} a {tibares(rendimento(20 + bonus))} — o normal rende{" "}
              {tibares(negocio.rendimentoBase)}.
            </span>
          </div>
        </>
      )}
    </FolhaModal>
  );
}
