"use client";

import { faHandBackFist, faShirt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FolhaModal from "./folha-modal";
import { useFoundry } from "../lib/foundry-provider";
import type { Arma, ItemInventario, SlotEquipado } from "../lib/foundry-types";

type Equipavel = { id: string; nome: string; img: string; slot: SlotEquipado | null; tipoSlot: string; duasMaos: boolean };

/** Quem está ocupando cada slot agora — para desenhar as caixas preenchidas. */
function ocupantes(armas: Arma[], inventario: ItemInventario[]) {
  const todos: Equipavel[] = [
    ...armas,
    ...inventario.filter((i) => i.slot)
  ];
  const mapa = new Map<string, Equipavel>();
  for (const item of todos) {
    if (!item.slot) continue;
    mapa.set(`${item.slot.tipo}-${item.slot.indice}`, item);
  }
  return mapa;
}

function Slot({
  rotulo,
  icone,
  ocupante,
  ehOItem,
  onClick
}: {
  rotulo: string;
  icone: typeof faHandBackFist;
  ocupante?: Equipavel;
  ehOItem: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-16 flex-1 basis-32 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center transition-colors ${
        ehOItem
          ? "border-acento bg-acento/10"
          : "border-borda bg-superficie-alta hover:border-acento/60 hover:bg-foreground/[0.03]"
      }`}
    >
      {ocupante?.img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ocupante.img} alt="" className="size-8 rounded-lg object-cover" />
      ) : (
        <FontAwesomeIcon icon={icone} className={`size-5! ${ocupante ? "" : "opacity-30"}`} />
      )}
      <span className="w-full truncate text-[11px] font-bold uppercase tracking-wider opacity-55">{rotulo}</span>
      <span className="w-full truncate text-xs font-semibold">{ocupante?.nome ?? "vazio"}</span>
    </button>
  );
}

/**
 * Escolha de slot ao equipar. Mostra as mãos e os espaços de vestido como o
 * Foundry faz, com quem está em cada um: pôr algo num slot ocupado troca os
 * dois, que é como se equipa de verdade — sem precisar guardar antes.
 */
export default function ModalSlots({ item, onFechar }: { item: Equipavel; onFechar: () => void }) {
  const { ficha, equiparEmSlot } = useFoundry();
  if (!ficha) return null;

  const { limiteMaos, limiteVestido } = ficha.configEquipamento;
  const mapa = ocupantes(ficha.armas, ficha.inventario.flatMap((g) => g.itens));

  const naMao = item.tipoSlot === "hand" || item.tipoSlot === "both";
  const noCorpo = item.tipoSlot === "body" || item.tipoSlot === "both";

  function escolher(contexto: "hand" | "body", indice: number) {
    const chave = `${contexto === "hand" ? "mao" : "vestido"}-${indice}`;
    equiparEmSlot(item.id, contexto, indice, mapa.get(chave)?.id ?? null);
    onFechar();
  }

  return (
    <FolhaModal titulo={`Onde levar ${item.nome}?`} onFechar={onFechar}>
      {naMao && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Mãos</span>
          <div className="flex flex-row flex-wrap gap-2">
            {/* Arma de duas mãos só cabe no slot duplo — o sistema esconde os
                slots individuais nesse caso. */}
            {!item.duasMaos &&
              Array.from({ length: limiteMaos }, (_, i) => i + 1).map((indice) => {
                const ocupante = mapa.get(`mao-${indice}`);
                return (
                  <Slot
                    key={indice}
                    rotulo={`Mão ${indice}`}
                    icone={faHandBackFist}
                    ocupante={ocupante}
                    ehOItem={ocupante?.id === item.id}
                    onClick={() => escolher("hand", indice)}
                  />
                );
              })}
            <Slot
              rotulo="Duas mãos"
              icone={faHandBackFist}
              ocupante={mapa.get("mao-12")}
              ehOItem={mapa.get("mao-12")?.id === item.id}
              onClick={() => escolher("hand", 12)}
            />
          </div>
        </div>
      )}

      {noCorpo && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Vestido</span>
          <div className="flex flex-row flex-wrap gap-2">
            {Array.from({ length: limiteVestido }, (_, i) => i + 1).map((indice) => {
              const ocupante = mapa.get(`vestido-${indice}`);
              return (
                <Slot
                  key={indice}
                  rotulo={`Espaço ${indice}`}
                  icone={faShirt}
                  ocupante={ocupante}
                  ehOItem={ocupante?.id === item.id}
                  onClick={() => escolher("body", indice)}
                />
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs opacity-55">
        Tocar num espaço ocupado troca os itens. Tocar no espaço onde este item já está guarda ele.
      </p>
    </FolhaModal>
  );
}
