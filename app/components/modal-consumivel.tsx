"use client";

import PainelDeUso from "./painel-de-uso";
import { TRUQUE } from "../lib/aprimoramentos";
import type { ItemInventario, UsoDeConsumivel } from "../lib/foundry-types";

/**
 * Painel de usar um consumível — pergaminho, poção, alquímico. É o mesmo
 * painel da magia porque no sistema é a mesma coisa: `_createScroll` copia a
 * magia inteira para dentro de um item `consumivel` e zera o custo em PM, e
 * usar chama `item.roll()` com `consumeSelf`, que tira uma unidade dele.
 *
 * O que muda em relação à magia: não há PM da própria ação (o pergaminho já
 * foi pago quando foi escrito) nem piso de 1 PM — o que sai da ficha é o
 * item, e os aprimoramentos que o jogador marcar saem do PM dele. O truque,
 * esse continua valendo: é a mesma magia lá dentro, e ele segue sendo outro
 * jeito de lançá-la, incompatível com os aprimoramentos pagos.
 *
 * Os aprimoramentos são os de escopo `consumable` mais os escritos no próprio
 * item — que num pergaminho são os da magia copiada —, como
 * `validOnUseEffects` faz no sistema.
 */
export default function ModalConsumivel({
  item,
  uso,
  onFechar
}: {
  item: ItemInventario;
  uso: UsoDeConsumivel;
  onFechar: () => void;
}) {
  return (
    <PainelDeUso
      acao={{ ...uso, id: item.id, nome: item.nome, rotuloDoCusto: item.nome, descricao: item.descricao }}
      escopo="consumable"
      contexto="neste item"
      exclusivos={TRUQUE}
      rotulos={{ exclusivo: "Conjurada como truque" }}
      onFechar={onFechar}
    />
  );
}
