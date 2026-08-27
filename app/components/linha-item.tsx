"use client";

import { FaCoins, FaHandFist, FaHandSparkles, FaMinus, FaPlus } from "react-icons/fa6";
import { GiBackpack, GiChest } from "react-icons/gi";
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

/** Duas casas: preço vem com "0,5 T$" e espaço com "0,5", nunca "0,50". */
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/**
 * Ficha do item dentro do cartão aberto: o nome inteiro (no cabeçalho ele é
 * truncado) e o que a mochila cobra por ele — quanto vale e quanto ocupa.
 * Por unidade, como o Foundry guarda.
 */
function Ficha({ item }: { item: ItemInventario }) {
  const dado = "flex flex-row items-center gap-1.5 whitespace-nowrap";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-bold">{item.nome}</span>
      <span className="numero flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-70">
        <span className={dado}>
          <FaCoins aria-hidden="true" className="size-3! opacity-70" />
          {numero.format(item.preco)} T$
        </span>
        <span className={dado}>
          <GiBackpack aria-hidden="true" className="size-3.5! opacity-70" />
          {numero.format(item.espacos)} {item.espacos === 1 ? "espaço" : "espaços"}
        </span>
      </span>
    </div>
  );
}

/**
 * Mochila ou baú, em um toque. O ícone é o estado: quem está com o
 * personagem mostra a mochila; quem ficou guardado, o baú — e o baú não
 * conta espaço nenhum.
 */
function Guardar({
  carregado,
  somenteLeitura,
  aoAlternar
}: {
  carregado: boolean;
  somenteLeitura: boolean;
  aoAlternar: () => void;
}) {
  const Icone = carregado ? GiBackpack : GiChest;
  const titulo = carregado ? "Na mochila" : "No baú";

  if (somenteLeitura) {
    return <Icone role="img" aria-label={titulo} title={titulo} className="size-4! shrink-0 opacity-55" />;
  }

  return (
    <button
      type="button"
      onClick={aoAlternar}
      title={carregado ? "Guardar no baú" : "Levar na mochila"}
      aria-label={carregado ? "Guardar no baú" : "Levar na mochila"}
      aria-pressed={!carregado}
      className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
        carregado ? "border-borda hover:bg-foreground/5" : "border-acento text-acento"
      }`}
    >
      <Icone aria-hidden="true" className="size-4!" />
    </button>
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
  const { ficha, ajustarQuantidade, alternarCarregado } = useFoundry();
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
        <>
          <Ficha item={item} />
          {(usavel || temContador) && (
            <div className="flex flex-row flex-wrap items-center justify-between gap-2">
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
            </div>
          )}
        </>
      }
      acessorio={
        // Fechando a linha, do lado do polegar: onde o item está e quantos
        // são — o que se lê correndo a mochila. A contagem vale também para o
        // item avulso ("1×" é o estoque dele) e tem largura reservada para
        // "99×", assim os nomes não dançam de uma linha para a outra.
        temQuantidade ? (
          <span className="flex shrink-0 flex-row items-center gap-2">
            <Guardar
              carregado={item.carregado}
              somenteLeitura={somenteLeitura}
              aoAlternar={() => alternarCarregado(item.id)}
            />
            <span className="numero w-9 text-right text-sm font-bold opacity-70">{contador.valor}×</span>
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
            <span className="flex shrink-0 flex-row items-center gap-2">
            <Guardar
              carregado={item.carregado}
              somenteLeitura={somenteLeitura}
              aoAlternar={() => alternarCarregado(item.id)}
            />
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
            </span>
          )
        ) : undefined
      }
      />
      {escolhendoSlot && <ModalSlots item={item} onFechar={() => setEscolhendoSlot(false)} />}
      {usando && usavel && <ModalConsumivel item={item} uso={usavel} onFechar={() => setUsando(false)} />}
    </>
  );
}
