"use client";

import { FaShieldHalved } from "react-icons/fa6";
import { useState } from "react";
import CartaoExpansivel, { AcaoSecundaria } from "./cartao-expansivel";
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
            {protecao.equipado && <Tag>{ondeEsta ?? "Equipada"}</Tag>}
          </>
        }
        acoes={
          somenteLeitura ? undefined : (
            <AcaoSecundaria
              icone={FaShieldHalved}
              ligado={protecao.equipado}
              onClick={() => (usaSlots ? setEscolhendoSlot(true) : alternarEquipado(protecao.id))}
            >
              {protecao.equipado ? "Equipada" : "Equipar"}
            </AcaoSecundaria>
          )
        }
      />

      {escolhendoSlot && <ModalSlots item={protecao} onFechar={() => setEscolhendoSlot(false)} />}
    </>
  );
}
