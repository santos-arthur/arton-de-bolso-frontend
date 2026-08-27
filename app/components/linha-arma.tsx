"use client";

import { FaHandFist, FaKhanda } from "react-icons/fa6";
import { useState } from "react";
import CartaoExpansivel, { AcaoPrincipal, AcaoSecundaria } from "./cartao-expansivel";
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
  // Onde ela está empunhada, quando o mundo usa slots — vira etiqueta de
  // estado; o botão fica com a ação, sempre com o mesmo par de palavras das
  // outras telas.
  const ondeEsta = arma.slot
    ? arma.slot.duasMaos
      ? "Nas duas mãos"
      : `Mão ${arma.slot.indice}`
    : null;

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
            {arma.equipado && <Tag>{ondeEsta ?? "Empunhada"}</Tag>}
          </>
        }
        acao={
          arma.equipado && ataque ? (
            <AcaoPrincipal icone={FaKhanda} onClick={() => setAtacando(true)}>
              Atacar
            </AcaoPrincipal>
          ) : undefined
        }
        acoes={
          somenteLeitura ? undefined : (
            <AcaoSecundaria
              icone={FaHandFist}
              ligado={arma.equipado}
              onClick={() => (usaSlots ? setEscolhendoSlot(true) : alternarEquipado(arma.id))}
            >
              {arma.equipado ? "Equipado" : "Equipar"}
            </AcaoSecundaria>
          )
        }
      />

      {atacando && <ModalAtaque arma={arma} onFechar={() => setAtacando(false)} />}
      {escolhendoSlot && <ModalSlots item={arma} onFechar={() => setEscolhendoSlot(false)} />}
    </>
  );
}
