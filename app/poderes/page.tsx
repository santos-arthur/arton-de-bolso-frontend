"use client";

import { useMemo, useState } from "react";
import CabecalhoPagina, { EstadoVazio } from "../components/cabecalho-pagina";
import CampoBusca, { normalizar } from "../components/campo-busca";
import CartaoExpansivel from "../components/cartao-expansivel";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";
import type { Poder } from "../lib/foundry-types";

/** Referência estável: `?? []` criaria um array novo a cada render e invalidaria o memo. */
const SEM_PODERES: Poder[] = [];

export default function Page() {
  const { ficha } = useFoundry();
  const [busca, setBusca] = useState("");

  const poderes = ficha?.poderes ?? SEM_PODERES;
  const filtrados = useMemo(() => {
    const alvo = normalizar(busca);
    if (!alvo) return poderes;
    return poderes.filter((p) => normalizar(`${p.nome} ${p.tipo} ${p.subtipo}`).includes(alvo));
  }, [poderes, busca]);

  if (!ficha) return null;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Poderes">{poderes.length}</CabecalhoPagina>

      {poderes.length > 6 && (
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar poder..." />
      )}

      {filtrados.length === 0 ? (
        <EstadoVazio>{poderes.length ? "Nenhum poder encontrado." : "Nenhum poder nesta ficha."}</EstadoVazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtrados.map((poder) => (
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
                </>
              }
            />
          ))}
        </ul>
      )}
    </PaginaFicha>
  );
}
