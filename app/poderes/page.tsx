"use client";

import { FaBolt } from "react-icons/fa6";
import { useMemo, useState } from "react";
import CabecalhoPagina, { EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import CampoBusca, { normalizar } from "../components/campo-busca";
import CartaoExpansivel, { AcaoPrincipal } from "../components/cartao-expansivel";
import ModalPoder from "../components/modal-poder";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";
import type { Poder } from "../lib/foundry-types";

/** Referência estável: `?? []` criaria um array novo a cada render e invalidaria o memo. */
const SEM_PODERES: Poder[] = [];

export default function Page() {
  const { ficha } = useFoundry();
  const [busca, setBusca] = useState("");
  const [ativando, setAtivando] = useState<Poder | null>(null);

  const poderes = ficha?.poderes ?? SEM_PODERES;
  const filtrados = useMemo(() => {
    const alvo = normalizar(busca);
    if (!alvo) return poderes;
    return poderes.filter((p) => normalizar(`${p.nome} ${p.tipo} ${p.subtipo}`).includes(alvo));
  }, [poderes, busca]);

  // Agrupa preservando a ordem de chegada: quem decide a sequência (nível,
  // depois tipo, depois nome) é o relay — repetir essa regra aqui seria ter
  // duas fontes da verdade para a mesma ordem.
  const grupos = useMemo(() => {
    const mapa = new Map<string, Poder[]>();
    for (const poder of filtrados) {
      const lista = mapa.get(poder.grupo);
      if (lista) lista.push(poder);
      else mapa.set(poder.grupo, [poder]);
    }
    return [...mapa];
  }, [filtrados]);

  if (!ficha) return null;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Poderes">
        {poderes.length} {poderes.length === 1 ? "poder" : "poderes"}
      </CabecalhoPagina>

      {poderes.length > 6 && (
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar poder..." />
      )}

      {filtrados.length === 0 ? (
        <EstadoVazio>{poderes.length ? "Nenhum poder encontrado." : "Nenhum poder nesta ficha."}</EstadoVazio>
      ) : (
        grupos.map(([grupo, doGrupo]) => (
          <section key={grupo} className="flex flex-col gap-2">
            <TituloSecao>{grupo}</TituloSecao>
            <ul className="flex flex-col gap-2">
              {doGrupo.map((poder) => (
                <CartaoExpansivel
                  key={poder.id}
                  nome={poder.nome}
                  img={poder.img}
                  descricao={poder.descricao}
                  etiquetas={
                    <>
                      {poder.tipo && <Tag>{poder.tipo}</Tag>}
                      {poder.subtipo && <Tag>{poder.subtipo}</Tag>}
                      {poder.ativacao && <Tag>{poder.ativacao}</Tag>}
                      {poder.custo > 0 && <Tag>{poder.custo} PM</Tag>}
                    </>
                  }
                  // Só o que o mestre marcou com a tag `ativo` ganha o botão:
                  // numa lista em que a maioria é passiva, um "Ativar" em
                  // tudo viraria ruído.
                  acao={
                    poder.ativavel ? (
                      <AcaoPrincipal icone={FaBolt} onClick={() => setAtivando(poder)}>
                        Ativar
                      </AcaoPrincipal>
                    ) : undefined
                  }
                />
              ))}
            </ul>
          </section>
        ))
      )}
      {ativando && <ModalPoder poder={ativando} onFechar={() => setAtivando(null)} />}
    </PaginaFicha>
  );
}
