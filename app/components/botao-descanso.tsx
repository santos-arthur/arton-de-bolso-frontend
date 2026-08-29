"use client";

import { FaBed } from "react-icons/fa6";
import { useState } from "react";
import CampoSelect from "./campo-select";
import FolhaModal from "./folha-modal";
import { CONDICOES, DESCANSO_PADRAO, calcularDescanso, condicaoDe } from "../lib/descanso";
import { useFoundry } from "../lib/foundry-provider";
import type { CondicaoDescanso, OpcoesDescanso } from "../lib/foundry-types";

function Interruptor({
  rotulo,
  descricao,
  marcado,
  aoMudar
}: {
  rotulo: string;
  descricao: string;
  marcado: boolean;
  aoMudar: (valor: boolean) => void;
}) {
  return (
    <label className="flex flex-row items-start gap-3 rounded-xl border border-borda bg-superficie-alta px-3 py-2.5">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(evento) => aoMudar(evento.target.checked)}
        className="checkbox-personalizado mt-0.5 size-5 shrink-0 cursor-pointer rounded border border-borda"
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold">{rotulo}</span>
        <span className="text-xs opacity-60">{descricao}</span>
      </span>
    </label>
  );
}

function CampoExtra({
  rotulo,
  valor,
  aoMudar
}: {
  rotulo: string;
  valor: number;
  aoMudar: (valor: number) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-row items-center justify-between gap-2 rounded-xl border border-borda bg-superficie-alta px-3 py-2">
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">{rotulo}</span>
      <input
        type="number"
        step={1}
        value={valor}
        onChange={(evento) => aoMudar(Number(evento.target.value) || 0)}
        className="input-numero-sem-setas numero w-14 bg-transparent text-right text-lg font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
      />
    </label>
  );
}

function ModalDescanso({ onFechar }: { onFechar: () => void }) {
  const { ficha, descansar } = useFoundry();
  const [dados, setDados] = useState<OpcoesDescanso>(DESCANSO_PADRAO);

  const nivel = ficha?.nivel ?? 0;
  const condicao = condicaoDe(dados.condicao);
  const previsto = calcularDescanso(nivel, dados);

  function confirmar() {
    descansar(dados);
    onFechar();
  }

  return (
    <FolhaModal
      titulo="Descansar"
      onFechar={onFechar}
      rodape={
        <div className="flex flex-row justify-end gap-2">
          <button
            type="button"
            onClick={onFechar}
            className="min-h-11 rounded-xl border border-borda px-4 text-sm font-semibold transition-colors hover:bg-foreground/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            className="min-h-11 rounded-xl bg-acento px-5 text-sm font-bold text-acento-tinta transition-opacity hover:opacity-90"
          >
            Descansar
          </button>
        </div>
      }
    >
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Condição</span>
        {/* Select nativo: no celular abre o seletor do sistema, que é mais
            rápido de percorrer do que quatro cartões ocupando a folha. */}
        <CampoSelect
          value={dados.condicao}
          onChange={(evento) =>
            setDados((atual) => ({ ...atual, condicao: evento.target.value as CondicaoDescanso }))
          }
          className="font-semibold"
        >
          {CONDICOES.map((opcao) => (
            <option key={opcao.chave} value={opcao.chave}>
              {opcao.rotulo}
            </option>
          ))}
        </CampoSelect>
        {/* O efeito da condição escolhida fica aqui embaixo, e não dentro de
            cada <option>: o seletor nativo do celular corta rótulos longos. */}
        <span className="flex flex-col text-xs">
          <span className="opacity-70">Recupera PV e PM {condicao.recuperacao}</span>
          <span className="opacity-50">{condicao.dica}</span>
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Bônus por nível</span>
        <div className="flex flex-row gap-2">
          <CampoExtra
            rotulo="PV extra"
            valor={dados.pvExtraPorNivel}
            aoMudar={(valor) => setDados((atual) => ({ ...atual, pvExtraPorNivel: valor }))}
          />
          <CampoExtra
            rotulo="PM extra"
            valor={dados.pmExtraPorNivel}
            aoMudar={(valor) => setDados((atual) => ({ ...atual, pmExtraPorNivel: valor }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Interruptor
          rotulo="Cuidados Prolongados"
          descricao="Perícia Cura (CD 15) — +1 PV por nível"
          marcado={dados.cuidadosProlongados}
          aoMudar={(valor) => setDados((atual) => ({ ...atual, cuidadosProlongados: valor }))}
        />
        <Interruptor
          rotulo="Acompanhamento Médico"
          descricao="+1 PV por nível"
          marcado={dados.acompanhamentoMedico}
          aoMudar={(valor) => setDados((atual) => ({ ...atual, acompanhamentoMedico: valor }))}
        />
      </div>

      {/* Previsão: descanso é irreversível pelo app, e ver o resultado antes
          evita descobrir a conta errada depois de aplicar. */}
      <div className="flex flex-row items-center justify-around rounded-xl border border-dashed border-borda px-4 py-3 text-center">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Recupera PV</span>
          <span className="numero text-2xl font-bold text-red-700 dark:text-red-500">+{previsto.pv}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Recupera PM</span>
          <span className="numero text-2xl font-bold text-sky-700 dark:text-sky-400">+{previsto.pm}</span>
        </div>
      </div>
      <p className="-mt-2 text-center text-[11px] opacity-50">Nível {nivel} · limitado ao máximo de cada recurso</p>
    </FolhaModal>
  );
}

export default function BotaoDescanso() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        title="Descansar"
        aria-label="Descansar"
        onClick={() => setAberto(true)}
        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-borda transition-colors hover:bg-foreground/5"
      >
        <FaBed aria-hidden="true" className="size-4!" />
      </button>

      {aberto && <ModalDescanso onFechar={() => setAberto(false)} />}
    </>
  );
}
