"use client";

import { FaHandFist, FaMinus, FaPlus } from "react-icons/fa6";
import { useState } from "react";
import CartaoExpansivel from "./cartao-expansivel";
import ModalSlots from "./modal-slots";
import Tag from "./tag";
import { useFoundry } from "../lib/foundry-provider";
import type { ItemInventario } from "../lib/foundry-types";

/**
 * Contador de unidades da mochila. Fica na própria linha porque o gesto é do
 * meio da sessão — gastou uma flecha, achou três — e não vale abrir tela para
 * isso. Zero é um estado normal: o item continua na ficha, só não aparece
 * mais como opção nos ataques, magias e testes.
 */
function Contador({ quantidade, aoMudar }: { quantidade: number; aoMudar: (delta: number) => void }) {
  const botao =
    "flex size-9 items-center justify-center rounded-full border border-borda transition-colors hover:bg-foreground/5 disabled:opacity-30";

  return (
    <span className="flex shrink-0 flex-row items-center gap-1">
      <button
        type="button"
        onClick={() => aoMudar(-1)}
        disabled={quantidade <= 0}
        aria-label="Tirar uma unidade"
        className={botao}
      >
        <FaMinus aria-hidden="true" className="size-2.5!" />
      </button>
      {/* Largura de dois dígitos reservada: sem isso os botões dançam de
          linha para linha conforme a quantidade passa de 9. */}
      <span className="numero min-w-8 text-center text-sm font-bold">{quantidade}</span>
      <button type="button" onClick={() => aoMudar(1)} aria-label="Somar uma unidade" className={botao}>
        <FaPlus aria-hidden="true" className="size-2.5!" />
      </button>
    </span>
  );
}

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
  const { ficha, ajustarQuantidade } = useFoundry();
  const [escolhendoSlot, setEscolhendoSlot] = useState(false);
  const usaSlots = !!ficha?.configEquipamento.usaSlots;
  // Munição, poção, material: quantidade é o que muda neles. Quem se equipa
  // (arma, armadura) fica com o botão de equipar, que é o gesto daquele item
  // — e a linha não comporta os dois.
  const temContador = !item.equipavel && !somenteLeitura;

  return (
    <>
    <CartaoExpansivel
      nome={item.nome}
      img={item.img}
      descricao={item.descricao}
      destacado={item.equipado}
      // A etiqueta de unidades só quando o contador não está ali dizendo o
      // mesmo número ao lado.
      etiquetas={!temContador && item.quantidade > 1 ? <Tag>{item.quantidade} unidades</Tag> : undefined}
      acessorio={
        temContador ? (
          <Contador quantidade={item.quantidade} aoMudar={(delta) => ajustarQuantidade(item.id, delta)} />
        ) : item.equipavel ? (
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
