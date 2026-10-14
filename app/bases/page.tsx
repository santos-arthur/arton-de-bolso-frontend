"use client";

import Link from "next/link";
import { useState } from "react";
import { FaDiceD20, FaFlag, FaHammer, FaHouseChimney, FaStore } from "react-icons/fa6";
import CabecalhoPagina, { Cartao, EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import { ModalEmpreendimento, ModalInicioAventura, ModalRepararComodo } from "../components/modais-base";
import PaginaFicha from "../components/pagina-ficha";
import { useBases } from "../lib/bases";
import { useFoundry } from "../lib/foundry-provider";
import type { Base, BeneficioDeBase, ComodoDeBase, MobiliaDeBase } from "../lib/foundry-types";
import { tibares } from "../lib/negocios";

const BOTAO =
  "flex min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors";

/** Quantas linhas do histórico aparecem fechadas — o resto abre no "ver tudo". */
const REGISTRO_RESUMIDO = 3;

function Icone({ img, tamanho = "size-10" }: { img: string; tamanho?: string }) {
  return img ? (
    <span
      role="img"
      aria-hidden="true"
      className={`${tamanho} shrink-0 rounded-lg border border-borda bg-cover bg-center`}
      style={{ backgroundImage: `url(${img})` }}
    />
  ) : (
    <span className={`${tamanho} flex shrink-0 items-center justify-center rounded-lg border border-borda`}>
      <FaHouseChimney aria-hidden="true" className="size-4! opacity-60" />
    </span>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border border-borda bg-superficie px-3 py-2">
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">{rotulo}</span>
      <span className="numero text-lg font-bold">{valor}</span>
    </div>
  );
}

function Mobilia({ mobilia }: { mobilia: MobiliaDeBase }) {
  return (
    <li className="flex flex-row items-start gap-2">
      <Icone img={mobilia.img} tamanho="size-7" />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold">
          {mobilia.nome}
          {mobilia.escolha && <span className="font-normal opacity-60"> · {mobilia.escolha}</span>}
        </span>
        {mobilia.efeito && <span className="text-xs opacity-60">{mobilia.efeito}</span>}
      </span>
    </li>
  );
}

function LinhaComodo({
  comodo,
  podeReparar,
  onReparar
}: {
  comodo: ComodoDeBase;
  podeReparar: boolean;
  onReparar: () => void;
}) {
  return (
    <li className="flex flex-col gap-2 border-b border-borda/60 py-2.5 last:border-b-0">
      <div className="flex flex-row items-start gap-3">
        <Icone img={comodo.img} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={`text-sm font-semibold ${comodo.danificado ? "line-through opacity-60" : ""}`}>
            {comodo.nome}
          </span>
          {comodo.danificado && (
            <span className="text-xs font-bold text-red-700 dark:text-red-400">Danificado — sem bônus</span>
          )}
          {comodo.suite && (
            <span className="text-xs opacity-60">
              {comodo.ocupantes.length ? `Dormem aqui: ${comodo.ocupantes.join(", ")}` : "Sem ocupantes"}
            </span>
          )}
          {comodo.efeito && <span className="text-xs opacity-60">{comodo.efeito}</span>}
        </span>
        {comodo.danificado && podeReparar && (
          <button
            type="button"
            onClick={onReparar}
            className="flex min-h-9 shrink-0 flex-row items-center gap-1.5 rounded-lg border border-borda px-2.5 text-xs font-bold hover:bg-foreground/5"
          >
            <FaHammer aria-hidden="true" className="size-3! shrink-0" />
            Reparar
          </button>
        )}
      </div>
      {comodo.mobilias.length > 0 && (
        <ul className="ml-[52px] flex flex-col gap-1.5">
          {comodo.mobilias.map((m) => (
            <Mobilia key={m.id} mobilia={m} />
          ))}
        </ul>
      )}
    </li>
  );
}

function ListaBeneficios({ titulo, itens }: { titulo: string; itens: BeneficioDeBase[] }) {
  if (!itens.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold opacity-70">{titulo}</span>
      <ul className="flex flex-col gap-1.5">
        {itens.map((b, i) => (
          <li key={`${b.nome}-${i}`} className="flex flex-col">
            <span className="text-sm font-semibold">
              {b.nome}
              {(b.naFicha || b.naRolagem) && (
                <span className="font-normal opacity-60">
                  {" · "}
                  {[b.naFicha && "na ficha", b.naRolagem && "nas rolagens"].filter(Boolean).join(" e ")}
                </span>
              )}
            </span>
            {b.efeito && <span className="text-xs opacity-60">{b.efeito}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CartaoBase({ base, somenteLeitura }: { base: Base; somenteLeitura: boolean }) {
  const [iniciando, setIniciando] = useState(false);
  const [apurando, setApurando] = useState(false);
  const [reparando, setReparando] = useState<ComodoDeBase | null>(null);
  const [registroAberto, setRegistroAberto] = useState(false);

  const administra = base.podeAdministrar && !somenteLeitura && base.adquirida;
  const empreendimento = base.empreendimento;
  const registro = registroAberto ? base.registro : base.registro.slice(0, REGISTRO_RESUMIDO);
  const danificados = base.comodos.filter((c) => c.danificado).length;
  const papel = base.souProprietario
    ? base.souResidente
      ? "Sua base, e você mora nela"
      : "Sua base"
    : `Você mora aqui${base.proprietario ? ` · de ${base.proprietario}` : ""}`;

  return (
    <Cartao className="flex flex-col gap-4 p-4">
      <div className="flex flex-row items-center gap-3">
        <Icone img={base.img} tamanho="size-14" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-display text-lg font-bold">{base.nome}</span>
          <span className="text-xs opacity-60">
            {[base.porte, base.tipo].filter(Boolean).join(" · ")}
          </span>
          <span className="truncate text-xs opacity-60">{papel}</span>
        </div>
      </div>

      {!base.adquirida ? (
        <span className="text-sm opacity-60">Ainda não foi construída, comprada nem recebida — isso é pelo Foundry.</span>
      ) : (
        <div className="flex flex-row gap-2">
          <Numero rotulo="Segurança" valor={String(base.seguranca)} />
          <Numero rotulo="Cômodos" valor={`${base.usados}/${base.capacidade}`} />
          <Numero rotulo="Manutenção" valor={tibares(base.manutencao)} />
        </div>
      )}

      {base.efeitoTipo && <p className="text-xs opacity-60">{base.efeitoTipo}</p>}

      {administra && (
        <div className="flex flex-row gap-2">
          <button
            type="button"
            onClick={() => setIniciando(true)}
            className={`${BOTAO} border border-borda hover:bg-foreground/5`}
          >
            <FaFlag aria-hidden="true" className="size-4! shrink-0" />
            Início de aventura
          </button>
          {empreendimento?.modo === "teste" && empreendimento.podeRolar && (
            <button
              type="button"
              onClick={() => setApurando(true)}
              className={`${BOTAO} bg-acento text-acento-tinta hover:opacity-90`}
            >
              <FaDiceD20 aria-hidden="true" className="size-4! shrink-0" />
              Apurar rendimento
            </button>
          )}
        </div>
      )}

      {empreendimento?.modo === "negocio" && (
        <div className="flex flex-row items-center gap-3 rounded-xl border border-borda bg-superficie px-3 py-2.5">
          <FaStore aria-hidden="true" className="size-4! shrink-0 opacity-60" />
          <span className="min-w-0 flex-1 text-sm">
            {empreendimento.negocio
              ? `Rende como o negócio ${empreendimento.negocio.nome} (nível ${empreendimento.negocio.nivel}).`
              : empreendimento.moduloNegociosAtivo
                ? "Rende como negócio, mas o mestre ainda não escolheu qual."
                : "Rende como negócio, mas o módulo Negócios não está ativo."}
          </span>
          {empreendimento.negocio && (
            <Link href="/negocios" className="shrink-0 text-xs font-bold text-acento">
              Abrir
            </Link>
          )}
        </div>
      )}

      {base.beneficios && (
        <div className="flex flex-col gap-3">
          <TituloSecao>O que a base te dá</TituloSecao>
          {danificados > 0 && (
            <span className="text-xs text-red-700 dark:text-red-400">
              {danificados === 1 ? "Um cômodo danificado não está" : `${danificados} cômodos danificados não estão`}{" "}
              dando bônus.
            </span>
          )}
          <ListaBeneficios titulo="Aplicado sozinho" itens={base.beneficios.automaticos} />
          <ListaBeneficios titulo="Para lembrar na mesa" itens={base.beneficios.lembretes} />
          {base.beneficios.bloqueados.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold opacity-70">Não vale para você agora</span>
              <ul className="flex flex-col gap-1">
                {base.beneficios.bloqueados.map((b, i) => (
                  <li key={`${b.nome}-${i}`} className="text-sm">
                    {b.nome} <span className="text-xs opacity-60">· {b.motivo}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!base.beneficios.automaticos.length &&
            !base.beneficios.lembretes.length &&
            !base.beneficios.bloqueados.length && <span className="text-sm opacity-60">Nada por enquanto.</span>}
        </div>
      )}

      {base.adquirida && (
        <div className="flex flex-col gap-1">
          <TituloSecao>
            Cômodos · {base.usados}/{base.capacidade}
          </TituloSecao>
          {base.comodos.length === 0 ? (
            <span className="text-sm opacity-60">Nenhum cômodo construído.</span>
          ) : (
            <ul className="flex flex-col">
              {base.comodos.map((comodo) => (
                <LinhaComodo
                  key={comodo.id}
                  comodo={comodo}
                  podeReparar={administra}
                  onReparar={() => setReparando(comodo)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {base.exteriores.length > 0 && (
        <div className="flex flex-col gap-2">
          <TituloSecao>Exterior</TituloSecao>
          <ul className="flex flex-col gap-1.5">
            {base.exteriores.map((m) => (
              <Mobilia key={m.id} mobilia={m} />
            ))}
          </ul>
        </div>
      )}

      {base.soltas.length > 0 && (
        <div className="flex flex-col gap-2">
          <TituloSecao>Mobílias guardadas</TituloSecao>
          <span className="text-xs opacity-60">Sem cômodo, não dão bônus.</span>
          <ul className="flex flex-col gap-1.5">
            {base.soltas.map((m) => (
              <Mobilia key={m.id} mobilia={m} />
            ))}
          </ul>
        </div>
      )}

      {base.residentes.length > 0 && (
        <div className="flex flex-col gap-2">
          <TituloSecao>Residentes · {base.residentes.length}</TituloSecao>
          <ul className="flex flex-row flex-wrap gap-2">
            {base.residentes.map((r) => (
              <li
                key={r.id}
                className="flex flex-row items-center gap-2 rounded-full border border-borda py-1 pl-1 pr-3 text-sm"
              >
                {r.img ? (
                  <span
                    role="img"
                    aria-hidden="true"
                    className="size-6 shrink-0 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${r.img})` }}
                  />
                ) : (
                  <span className="size-6 shrink-0 rounded-full border border-borda" />
                )}
                {r.nome}
              </li>
            ))}
          </ul>
        </div>
      )}

      {base.registro.length > 0 && (
        <div className="flex flex-col gap-2">
          <TituloSecao>Histórico</TituloSecao>
          <ul className="flex flex-col">
            {registro.map((entrada, indice) => (
              <li
                key={`${entrada.timestamp}-${indice}`}
                className="flex flex-col border-b border-borda/60 py-2 last:border-b-0"
              >
                <span className="text-sm">{entrada.texto || entrada.tipo}</span>
                {entrada.timestamp > 0 && (
                  <span className="text-[11px] opacity-50">
                    {new Date(entrada.timestamp).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {base.registro.length > REGISTRO_RESUMIDO && (
            <button
              type="button"
              onClick={() => setRegistroAberto((aberto) => !aberto)}
              className="self-start text-xs font-bold opacity-60 hover:opacity-100"
            >
              {registroAberto ? "Mostrar menos" : `Ver os últimos ${base.registro.length}`}
            </button>
          )}
        </div>
      )}

      {iniciando && <ModalInicioAventura base={base} onFechar={() => setIniciando(false)} />}
      {reparando && <ModalRepararComodo base={base} comodo={reparando} onFechar={() => setReparando(null)} />}
      {apurando && empreendimento?.modo === "teste" && (
        <ModalEmpreendimento
          base={base}
          bonusInteligencia={empreendimento.bonusInteligencia}
          bonusCapacidade={empreendimento.bonusCapacidade}
          onFechar={() => setApurando(false)}
        />
      )}
    </Cartao>
  );
}

export default function Page() {
  const { ficha, somenteLeitura } = useFoundry();
  const estado = useBases();

  if (!ficha) return null;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Bases">{estado?.bases.length || null}</CabecalhoPagina>

      {!estado ? (
        <EstadoVazio>Carregando bases...</EstadoVazio>
      ) : !estado.disponivel ? (
        <EstadoVazio>O módulo Bases não está ativo neste mundo. Peça ao mestre para ativá-lo no Foundry.</EstadoVazio>
      ) : estado.bases.length === 0 ? (
        <EstadoVazio>
          {ficha.nome} não tem base nem mora em uma. Construir, ampliar e mobiliar é pelo Foundry.
        </EstadoVazio>
      ) : (
        <div className="flex flex-col gap-3">
          {estado.bases.map((base) => (
            <CartaoBase key={base.id} base={base} somenteLeitura={somenteLeitura} />
          ))}
        </div>
      )}
    </PaginaFicha>
  );
}
