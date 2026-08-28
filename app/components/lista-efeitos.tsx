"use client";

import { FaChevronDown } from "react-icons/fa6";
import { useMemo, useState } from "react";
import Prosa from "./prosa";
import Tag from "./tag";
import { EstadoVazio } from "./cabecalho-pagina";
import { rotuloDaMudanca } from "../lib/nomes-de-efeitos";
import type { EfeitoFicha } from "../lib/foundry-types";

/**
 * Os grupos, na ordem em que o módulo já entrega a lista. Só o de prazo abre
 * sozinho: é o que muda dentro da sessão e o que o jogador precisa lembrar que
 * vai acabar. Passivo é pano de fundo e inativo não está contando — os dois
 * cabem fechados, e a ficha não vira uma rolagem de trinta linhas por causa
 * deles.
 */
const GRUPOS: { tipo: EfeitoFicha["tipo"]; titulo: string; abertoPorPadrao: boolean }[] = [
  { tipo: "temporario", titulo: "Temporários", abertoPorPadrao: true },
  { tipo: "passivo", titulo: "Passivos", abertoPorPadrao: false },
  { tipo: "inativo", titulo: "Inativos", abertoPorPadrao: false }
];

function Efeito({ efeito }: { efeito: EfeitoFicha }) {
  const [aberto, setAberto] = useState(false);
  const expansivel = !!efeito.descricao || efeito.mudancas.length > 0;

  return (
    <li
      className={`overflow-hidden rounded-2xl border bg-superficie-alta ${
        efeito.ativo ? "border-borda" : "border-dashed border-borda opacity-60"
      }`}
    >
      <button
        type="button"
        onClick={() => expansivel && setAberto((v) => !v)}
        disabled={!expansivel}
        aria-expanded={expansivel ? aberto : undefined}
        className="flex w-full flex-row items-center gap-3 px-3 py-2.5 text-left disabled:cursor-default"
      >
        {efeito.img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={efeito.img} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 flex-row items-center gap-2">
            <span className="min-w-0 truncate text-sm font-bold">{efeito.nome}</span>
            {expansivel && (
              <FaChevronDown
                aria-hidden="true"
                className={`size-2.5! shrink-0 opacity-40 transition-transform ${aberto ? "rotate-180" : ""}`}
              />
            )}
          </span>
          {/* O estado não vira etiqueta: o grupo em que a linha está já diz se
              o efeito tem prazo ou se não está contando. */}
          <span className="flex flex-row flex-wrap gap-1">
            {efeito.origem && <Tag>{efeito.origem}</Tag>}
            {efeito.duracao && <Tag>{efeito.duracao}</Tag>}
          </span>
        </span>
      </button>

      {aberto && (
        <div className="flex flex-col gap-2 border-t border-borda px-3 py-2.5">
          {/* O que ele muda, antes do texto: é a pergunta que se faz ao abrir
              um efeito no meio do combate. */}
          {efeito.mudancas.length > 0 && (
            <ul className="flex flex-col">
              {efeito.mudancas.map((mudanca, indice) => (
                <li
                  key={`${mudanca.chave}-${indice}`}
                  className="flex flex-row items-center justify-between gap-4 border-b border-borda/60 py-1.5 text-sm last:border-b-0"
                >
                  <span className="min-w-0 truncate">
                    {rotuloDaMudanca(mudanca.chave, mudanca.rotulo)}
                  </span>
                  <span className="numero shrink-0 font-semibold">
                    <span className="mr-1 text-[11px] font-normal uppercase tracking-wider opacity-55">
                      {mudanca.modo}
                    </span>
                    {mudanca.valor}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {efeito.descricao && <Prosa html={efeito.descricao} className="text-sm opacity-85" />}
        </div>
      )}
    </li>
  );
}

function Grupo({
  titulo,
  efeitos,
  aberto,
  aoAlternar
}: {
  titulo: string;
  efeitos: EfeitoFicha[];
  aberto: boolean;
  aoAlternar: () => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={aberto}
        className="flex min-h-9 w-full flex-row items-center gap-2 text-left"
      >
        <FaChevronDown
          aria-hidden="true"
          className={`size-2.5! shrink-0 opacity-45 transition-transform ${aberto ? "" : "-rotate-90"}`}
        />
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">{titulo}</span>
        <span className="numero text-[11px] font-bold opacity-45">{efeitos.length}</span>
      </button>

      {aberto && (
        <ul className="flex flex-col gap-2">
          {efeitos.map((efeito) => (
            <Efeito key={efeito.id} efeito={efeito} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Os efeitos que estão valendo no personagem — o que a armadura dá, o que a
 * Fúria ligou, a condição que o mestre aplicou —, em três listas que abrem e
 * fecham.
 *
 * O que está suprimido continua aqui, no grupo dos inativos: a armadura que
 * foi para a mochila e o bônus que outro sobrepõe somem da conta sem sumir da
 * ficha, e escondê-los faria o jogador procurar um bônus que ele tem e não
 * está valendo.
 */
export default function ListaEfeitos({ efeitos }: { efeitos: EfeitoFicha[] }) {
  const [abertos, setAbertos] = useState<EfeitoFicha["tipo"][]>(() =>
    GRUPOS.filter((grupo) => grupo.abertoPorPadrao).map((grupo) => grupo.tipo)
  );

  // A ordem dentro de cada grupo é a que veio do módulo — o filtro preserva.
  const porTipo = useMemo(
    () => GRUPOS.map((grupo) => ({ ...grupo, itens: efeitos.filter((e) => e.tipo === grupo.tipo) })),
    [efeitos]
  );

  if (!efeitos.length) return <EstadoVazio>Nenhum efeito nesta ficha.</EstadoVazio>;

  return (
    <div className="flex flex-col gap-3">
      {porTipo
        .filter((grupo) => grupo.itens.length > 0)
        .map((grupo) => (
          <Grupo
            key={grupo.tipo}
            titulo={grupo.titulo}
            efeitos={grupo.itens}
            aberto={abertos.includes(grupo.tipo)}
            aoAlternar={() =>
              setAbertos((atuais) =>
                atuais.includes(grupo.tipo)
                  ? atuais.filter((tipo) => tipo !== grupo.tipo)
                  : [...atuais, grupo.tipo]
              )
            }
          />
        ))}
    </div>
  );
}
