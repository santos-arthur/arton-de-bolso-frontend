"use client";

import { FaScrewdriverWrench } from "react-icons/fa6";
import FolhaModal from "./folha-modal";
import { useFoundry } from "../lib/foundry-provider";
import type { Magia } from "../lib/foundry-types";

/**
 * Consertar uma engenhoca enguiçada: 1 hora de trabalho, sem teste nem custo
 * (Tormenta20 - Jogo do Ano, "Engenhocas"). A confirmação existe porque a
 * hora é tempo de jogo — o jogador decide se o grupo pode esperar antes de
 * marcar. Quem grava e publica o card é o módulo t20-engenhocas.
 */
export default function ModalConsertarEngenhoca({ magia, onFechar }: { magia: Magia; onFechar: () => void }) {
  const { consertarEngenhoca } = useFoundry();

  function confirmar() {
    consertarEngenhoca(magia.id);
    onFechar();
  }

  const rodape = (
    <div className="flex w-full flex-row gap-2">
      <button
        type="button"
        onClick={onFechar}
        className="flex min-h-12 flex-1 flex-row items-center justify-center rounded-xl border border-borda px-4 text-sm font-bold hover:bg-foreground/5"
      >
        Agora não
      </button>
      <button
        type="button"
        onClick={confirmar}
        className="flex min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-acento px-4 text-sm font-bold text-acento-tinta hover:opacity-90"
      >
        <FaScrewdriverWrench aria-hidden="true" className="size-4! shrink-0" />
        Consertar
      </button>
    </div>
  );

  return (
    <FolhaModal titulo={`Consertar ${magia.nome}`} onFechar={onFechar} rodape={rodape}>
      <p className="text-base font-semibold">Deseja passar 1 hora consertando {magia.nome}?</p>
      <p className="text-sm opacity-70">
        A engenhoca enguiçou e não funciona até ser consertada. O conserto leva 1 hora de trabalho e não exige teste
        nem custo — depois disso ela volta a funcionar normalmente.
      </p>
    </FolhaModal>
  );
}
