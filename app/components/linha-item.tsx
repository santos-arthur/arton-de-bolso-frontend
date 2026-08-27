"use client";

import { FaHandFist, FaHandSparkles, FaMinus, FaPlus } from "react-icons/fa6";
import { useState } from "react";
import CartaoExpansivel from "./cartao-expansivel";
import ModalConsumivel from "./modal-consumivel";
import ModalSlots from "./modal-slots";
import { useContadorAdiado } from "../lib/campo-numerico";
import { useFoundry } from "../lib/foundry-provider";
import type { ItemInventario } from "../lib/foundry-types";

/**
 * Contador de unidades da mochila. Mora dentro do cartão aberto, junto do
 * botão de usar: a linha fechada é para ler a mochila, não para mexer nela —
 * e um −/+ do tamanho do dedo ao lado do nome fazia a lista virar um campo
 * minado de toques sem querer. Quantas unidades há continua visível de fora,
 * no "3×" antes do ícone.
 *
 * Zero é um estado normal: o item continua na ficha, só não aparece mais como
 * opção nos ataques, magias e testes.
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
  const [usando, setUsando] = useState(false);
  const usaSlots = !!ficha?.configEquipamento.usaSlots;
  // Munição, poção, material: quantidade é o que muda neles. Quem se equipa
  // (arma, armadura) fica com o botão de equipar, que é o gesto daquele item.
  const temQuantidade = !item.equipavel;
  const temContador = temQuantidade && !somenteLeitura;
  // Os toques mandam na tela; ao parar, o resultado vai ao Foundry de uma vez.
  const contador = useContadorAdiado(item.quantidade, (delta) => ajustarQuantidade(item.id, delta));
  // Sem unidade não há o que usar: o item continua na mochila, mas o botão
  // sai de cena até alguém repor. Segue o número da tela, não o da ficha —
  // zerou no dedo, o botão some no mesmo toque.
  const usavel = item.uso && contador.valor > 0 ? item.uso : null;

  return (
    <>
    <CartaoExpansivel
      nome={item.nome}
      img={item.img}
      descricao={item.descricao}
      destacado={item.equipado}
      acoes={
        usavel || temContador ? (
          <>
            {usavel ? (
              <button
                type="button"
                onClick={() => setUsando(true)}
                className="flex min-h-9 items-center gap-1.5 rounded-full bg-acento px-4 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
              >
                <FaHandSparkles aria-hidden="true" className="size-3!" />
                Usar
              </button>
            ) : (
              <span className="text-xs opacity-55">Unidades na mochila</span>
            )}
            {temContador && <Contador quantidade={contador.valor} aoMudar={contador.ajustar} />}
          </>
        ) : undefined
      }
      acessorio={
        // A contagem fecha a linha, do lado do polegar: é o que se lê correndo
        // a mochila ("tenho quantas flechas?"). Vale também para o item
        // avulso — "1×" é o estoque dele, e a coluna sem número passava a
        // impressão de item sem quantidade. Largura reservada para "99×",
        // assim os nomes não dançam de uma linha para a outra.
        temQuantidade ? (
          <span className="numero w-9 shrink-0 text-right text-sm font-bold opacity-70">
            {contador.valor}×
          </span>
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
      {usando && usavel && <ModalConsumivel item={item} uso={usavel} onFechar={() => setUsando(false)} />}
    </>
  );
}
