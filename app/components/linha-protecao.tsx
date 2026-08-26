"use client";

import { FaShieldHalved } from "react-icons/fa6";
import { useState } from "react";
import CartaoExpansivel from "./cartao-expansivel";
import ModalSlots from "./modal-slots";
import Tag from "./tag";
import { useFoundry } from "../lib/foundry-provider";
import type { Protecao } from "../lib/foundry-types";

const NOME_DO_TIPO: Record<string, string> = {
  escudo: "Escudo",
  leve: "Armadura leve",
  pesada: "Armadura pesada"
};

/** Armadura ou escudo na lista de combate, com defesa, penalidade e RD. */
export default function LinhaProtecao({ protecao }: { protecao: Protecao }) {
  const { ficha, somenteLeitura, alternarEquipado } = useFoundry();
  const [escolhendoSlot, setEscolhendoSlot] = useState(false);
  const usaSlots = !!ficha?.configEquipamento.usaSlots;

  const ondeEsta = protecao.slot
    ? protecao.slot.tipo === "mao"
      ? `Mão ${protecao.slot.indice}`
      : `Vestido ${protecao.slot.indice}`
    : null;

  return (
    <>
      <CartaoExpansivel
        nome={protecao.nome}
        img={protecao.img}
        descricao={protecao.descricao}
        destacado={protecao.equipado}
        etiquetas={
          <>
            <Tag>Defesa +{protecao.defesa}</Tag>
            {protecao.penalidade !== 0 && <Tag>Penalidade {protecao.penalidade}</Tag>}
            {protecao.reducaoDano > 0 && <Tag>RD {protecao.reducaoDano}</Tag>}
            {NOME_DO_TIPO[protecao.tipo] && <Tag>{NOME_DO_TIPO[protecao.tipo]}</Tag>}
          </>
        }
        acessorio={
          somenteLeitura ? undefined : (
            <button
              type="button"
              onClick={() => (usaSlots ? setEscolhendoSlot(true) : alternarEquipado(protecao.id))}
              aria-pressed={protecao.equipado}
              className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors ${
                protecao.equipado ? "border-acento text-acento" : "border-borda hover:bg-foreground/5"
              }`}
            >
              <FaShieldHalved aria-hidden="true" className="size-2.5!" />
              {ondeEsta ?? (protecao.equipado ? "Tirar" : "Vestir")}
            </button>
          )
        }
      />

      {escolhendoSlot && <ModalSlots item={protecao} onFechar={() => setEscolhendoSlot(false)} />}
    </>
  );
}
