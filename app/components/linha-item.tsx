"use client";

import { FaCoins, FaHandFist, FaHandSparkles, FaMinus, FaPlus } from "react-icons/fa6";
import { BsFillBackpackFill } from "react-icons/bs";
import { PiTreasureChest } from "react-icons/pi";
import { useState } from "react";
import CartaoExpansivel, { AcaoPrincipal, AcaoSecundaria } from "./cartao-expansivel";
import ModalConsumivel from "./modal-consumivel";
import ModalSlots from "./modal-slots";
import Tag from "./tag";
import { useContadorAdiado } from "../lib/campo-numerico";
import { useFoundry } from "../lib/foundry-provider";
import type { ItemInventario } from "../lib/foundry-types";

/** Duas casas: preço vem com "0,5 T$" e espaço com "0,5", nunca "0,50". */
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/**
 * Contador de unidades da mochila. Mora dentro do cartão aberto, junto das
 * outras ações: a lista fechada é para ler, não para mexer — um −/+ do
 * tamanho do dedo ao lado do nome fazia dela um campo minado de toques sem
 * querer. Quantas unidades há continua visível de fora, na etiqueta.
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
      <span className="numero min-w-8 text-center text-sm font-bold">{quantidade}</span>
      <button type="button" onClick={() => aoMudar(1)} aria-label="Somar uma unidade" className={botao}>
        <FaPlus aria-hidden="true" className="size-2.5!" />
      </button>
    </span>
  );
}

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
          <BsFillBackpackFill aria-hidden="true" className="size-3.5! opacity-70" />
          {numero.format(item.espacos)} {item.espacos === 1 ? "espaço" : "espaços"}
        </span>
      </span>
    </div>
  );
}

/** Item da mochila ou do baú. */
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
  // Munição, poção, material: quantidade é o que muda neles, e é a mochila
  // que a controla. Quem se equipa (arma, armadura) tem o botão de equipar,
  // que é o gesto daquele item — mas pode vir em par (duas adagas, três
  // lanças de arremesso), e aí a quantidade é informação, não controle:
  // aparece na etiqueta e não ganha o −/+, que mudaria uma ficha montada
  // peça a peça no Foundry.
  const temQuantidade = !item.equipavel;
  const temContador = temQuantidade && !somenteLeitura;
  // Os toques mandam na tela; ao parar, o resultado vai ao Foundry de uma vez.
  const contador = useContadorAdiado(item.quantidade, (delta) => ajustarQuantidade(item.id, delta));
  // Sem unidade não há o que usar: o item continua na mochila, mas o botão
  // sai de cena até alguém repor. Segue o número da tela, não o da ficha —
  // zerou no dedo, o botão some no mesmo toque.
  //
  // No baú também não se usa nada: o que está guardado não está à mão. Pelo
  // mesmo motivo o "Equipar" só aparece na mochila — e guardar desequipa, no
  // módulo, para não sobrar armadura vestida dentro do baú.
  const usavel = item.uso && contador.valor > 0 && item.carregado ? item.uso : null;

  return (
    <>
      <CartaoExpansivel
        nome={item.nome}
        img={item.img}
        descricao={item.descricao}
        destacado={item.equipado}
        etiquetas={
          <>
            {/* Onde o item está não vira etiqueta: a página já é a mochila
                ou o baú, e repetir isso em toda linha era metade do ruído. */}
            {(temQuantidade || contador.valor > 1) && (
              <Tag>
                {contador.valor} {contador.valor === 1 ? "unidade" : "unidades"}
              </Tag>
            )}
            {item.equipado && <Tag>Equipado</Tag>}
          </>
        }
        acao={
          usavel ? (
            <AcaoPrincipal icone={FaHandSparkles} onClick={() => setUsando(true)}>
              Usar
            </AcaoPrincipal>
          ) : undefined
        }
        acoes={
          <>
            <Ficha item={item} />
            {!somenteLeitura && (
              <div className="flex flex-row flex-wrap items-center justify-between gap-2">
                <span className="flex flex-row flex-wrap items-center gap-2">
                  {item.equipavel && item.carregado && (
                    <AcaoSecundaria
                      icone={FaHandFist}
                      ligado={item.equipado}
                      onClick={() => (usaSlots ? setEscolhendoSlot(true) : aoAlternarEquipado())}
                    >
                      {item.equipado ? "Equipado" : "Equipar"}
                    </AcaoSecundaria>
                  )}
                  <AcaoSecundaria
                    icone={item.carregado ? PiTreasureChest : BsFillBackpackFill}
                    ligado={!item.carregado}
                    onClick={() => alternarCarregado(item.id)}
                  >
                    {item.carregado ? "Guardar no baú" : "Levar na mochila"}
                  </AcaoSecundaria>
                </span>
                {temContador && <Contador quantidade={contador.valor} aoMudar={contador.ajustar} />}
              </div>
            )}
          </>
        }
      />

      {escolhendoSlot && <ModalSlots item={item} onFechar={() => setEscolhendoSlot(false)} />}
      {usando && usavel && <ModalConsumivel item={item} uso={usavel} onFechar={() => setUsando(false)} />}
    </>
  );
}
