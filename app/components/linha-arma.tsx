"use client";

import { faHandFist, faKhanda } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import CartaoExpansivel from "./cartao-expansivel";
import ModalAtaque from "./modal-ataque";
import ModalSlots from "./modal-slots";
import Tag from "./tag";
import { useFoundry } from "../lib/foundry-provider";
import type { Arma } from "../lib/foundry-types";

/**
 * Uma arma na lista. A linha traz o ataque base — sem nenhum poder ativado —,
 * o dano e o crítico, que é o que se consulta de relance. O botão "Atacar"
 * abre o painel onde entram os aprimoramentos.
 */
export default function LinhaArma({ arma }: { arma: Arma }) {
  const { ficha, somenteLeitura, alternarEquipado } = useFoundry();
  const [atacando, setAtacando] = useState(false);
  const [escolhendoSlot, setEscolhendoSlot] = useState(false);
  const usaSlots = !!ficha?.configEquipamento.usaSlots;

  const ataque = arma.ataque;
  const dano = arma.dano[0];

  return (
    <>
      <CartaoExpansivel
        nome={arma.nome}
        img={arma.img}
        descricao={arma.descricao}
        destacado={arma.equipado}
        etiquetas={
          <>
            {ataque && <Tag>Ataque {ataque.totalFormatado}</Tag>}
            {dano && <Tag>{dano.formula}{dano.tipo ? ` ${dano.tipo}` : ""}</Tag>}
            <Tag>Crítico {arma.critico.texto}</Tag>
            {arma.alcance && <Tag>{arma.alcance}</Tag>}
          </>
        }
        acessorio={
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {arma.equipado && ataque && (
              <button
                type="button"
                onClick={() => setAtacando(true)}
                className="flex min-h-9 items-center gap-1.5 rounded-full bg-acento px-3 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
              >
                <FontAwesomeIcon icon={faKhanda} className="size-3!" />
                Atacar
              </button>
            )}
            {!somenteLeitura && (
              <button
                type="button"
                onClick={() => (usaSlots ? setEscolhendoSlot(true) : alternarEquipado(arma.id))}
                aria-pressed={arma.equipado}
                className={`flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold transition-colors ${
                  arma.equipado ? "border-acento text-acento" : "border-borda hover:bg-foreground/5"
                }`}
              >
                <FontAwesomeIcon icon={faHandFist} className="size-2.5!" />
                {arma.slot
                  ? arma.slot.duasMaos
                    ? "Duas mãos"
                    : `Mão ${arma.slot.indice}`
                  : arma.equipado
                    ? "Guardar"
                    : "Equipar"}
              </button>
            )}
          </div>
        }
      />

      {atacando && <ModalAtaque arma={arma} onFechar={() => setAtacando(false)} />}
      {escolhendoSlot && <ModalSlots item={arma} onFechar={() => setEscolhendoSlot(false)} />}
    </>
  );
}
