"use client";

import { FaChevronDown, FaCircleInfo, FaTrash } from "react-icons/fa6";
import { useMemo, useState } from "react";
import FolhaModal from "./folha-modal";
import Prosa from "./prosa";
import Tag from "./tag";
import { EstadoVazio } from "./cabecalho-pagina";
import { normalizar } from "./campo-busca";
import { useFoundry } from "../lib/foundry-provider";
import { rotuloDaMudanca } from "../lib/nomes-de-efeitos";
import type { EfeitoFicha, OrigemDoEfeito } from "../lib/foundry-types";

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

/**
 * De onde o efeito veio: o poder que o ligou, a armadura que o carrega, a
 * magia que alguém lançou. É a pergunta seguinte a "o que ele muda?" — e a
 * resposta é a regra inteira, que mora no item, não no efeito.
 */
function ModalOrigem({ origem, onFechar }: { origem: OrigemDoEfeito; onFechar: () => void }) {
  return (
    <FolhaModal titulo={origem.nome} onFechar={onFechar}>
      <div className="flex flex-row items-center gap-3 pt-2">
        {origem.img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={origem.img} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
        )}
        {origem.tipo && <Tag>{origem.tipo}</Tag>}
      </div>

      {origem.dados.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {origem.dados.map((dado) => (
            <div
              key={dado.rotulo}
              className="flex flex-col gap-0.5 rounded-xl border border-borda bg-superficie-alta px-3 py-2"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">
                {dado.rotulo}
              </span>
              <span className="truncate text-sm font-semibold">{dado.valor}</span>
            </div>
          ))}
        </div>
      )}
      {origem.descricao ? (
        <Prosa html={origem.descricao} className="text-sm opacity-85" />
      ) : (
        <p className="text-sm opacity-60">Este {origem.tipo.toLowerCase()} não tem descrição.</p>
      )}
    </FolhaModal>
  );
}

/** Compara ignorando acento, caixa e espaços — "Fúria" e "furia" são o mesmo nome. */
function mesmoNome(a: string, b: string) {
  return normalizar(a) === normalizar(b);
}

function Efeito({ efeito }: { efeito: EfeitoFicha }) {
  const { somenteLeitura, removerEfeito } = useFoundry();
  const [aberto, setAberto] = useState(false);
  const [vendoOrigem, setVendoOrigem] = useState(false);

  /**
   * Só o que tem prazo se tira daqui. Passivo é consequência de outra coisa —
   * a armadura vestida, o poder que o personagem tem —, e apagá-lo seria
   * mentir sobre a ficha em vez de mudá-la; para esses, o que muda o estado é
   * desequipar ou remover o item. Efeito que mora num item também não sai por
   * aqui: sairia do item de todo mundo.
   */
  const podeRemover = efeito.tipo === "temporario" && efeito.removivel && !somenteLeitura;
  const expansivel = !!efeito.descricao || efeito.mudancas.length > 0 || !!efeito.origem;

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
          {/* A origem só vira etiqueta quando acrescenta algo: efeito e poder
              costumam ter o mesmo nome, e repeti-lo do lado seria ruído. */}
          <span className="flex flex-row flex-wrap gap-1">
            {efeito.origem && !mesmoNome(efeito.origem.nome, efeito.nome) && (
              <Tag>{efeito.origem.nome}</Tag>
            )}
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

          <div className="flex flex-row flex-wrap items-center gap-2">
            {/* A regra que criou o efeito mora no item, não aqui: o botão leva
                a ela sem tirar o jogador da lista. */}
            {efeito.origem && (
              <button
                type="button"
                onClick={() => setVendoOrigem(true)}
                className="flex min-h-9 flex-row items-center gap-1.5 rounded-full border border-borda px-3 text-[11px] font-bold transition-colors hover:bg-foreground/5"
              >
                <FaCircleInfo aria-hidden="true" className="size-3!" />
                Ver origem
              </button>
            )}
            {podeRemover && (
              <button
                type="button"
                onClick={() => removerEfeito(efeito.id)}
                className="flex min-h-9 flex-row items-center gap-1.5 rounded-full border border-borda px-3 text-[11px] font-bold text-red-800 transition-colors hover:bg-red-800/10 dark:text-red-400"
              >
                <FaTrash aria-hidden="true" className="size-3!" />
                Remover
              </button>
            )}
          </div>
        </div>
      )}

      {vendoOrigem && efeito.origem && (
        <ModalOrigem origem={efeito.origem} onFechar={() => setVendoOrigem(false)} />
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
