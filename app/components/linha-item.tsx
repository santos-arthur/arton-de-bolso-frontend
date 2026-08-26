"use client";

import { FaHandFist } from "react-icons/fa6";
import { useState } from "react";
import CartaoExpansivel from "./cartao-expansivel";
import ModalSlots from "./modal-slots";
import Tag from "./tag";
import { useFoundry } from "../lib/foundry-provider";
import type { ItemInventario } from "../lib/foundry-types";

/** Item da mochila. Usado no Inventário e no Combate (armas em punho). */
export default function LinhaItem({
  item,
  somenteLeitura,
  aoAlternarEquipado
}: {
  item: ItemInventario;
  somenteLeitura: boolean;
  aoAlternarEquipado: () => void;
}) {
  const { ficha } = useFoundry();
  const [escolhendoSlot, setEscolhendoSlot] = useState(false);
  const usaSlots = !!ficha?.configEquipamento.usaSlots;

  return (
    <>
    <CartaoExpansivel
      nome={item.nome}
      img={item.img}
      descricao={item.descricao}
      destacado={item.equipado}
      etiquetas={item.quantidade > 1 ? <Tag>{item.quantidade} unidades</Tag> : undefined}
      acessorio={
        item.equipavel ? (
          somenteLeitura ? (
            item.equipado ? (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-acento px-2.5 py-1 text-[11px] font-bold text-acento">
                <FaHandFist aria-hidden="true" className="size-2.5!" />
                Equipado
              </span>
            ) : undefined
          ) : (
            <button
              type="button"
              onClick={() => (usaSlots ? setEscolhendoSlot(true) : aoAlternarEquipado())}
              aria-pressed={item.equipado}
              className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors ${
                item.equipado
                  ? "border-acento bg-acento text-white"
                  : "border-borda hover:bg-foreground/5"
              }`}
            >
              <FaHandFist aria-hidden="true" className="size-2.5!" />
              {item.equipado ? "Equipado" : "Equipar"}
            </button>
          )
        ) : undefined
      }
      />
      {escolhendoSlot && <ModalSlots item={item} onFechar={() => setEscolhendoSlot(false)} />}
    </>
  );
}
