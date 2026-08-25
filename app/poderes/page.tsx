"use client";

import { useState } from "react";
import CabecalhoPagina, { EstadoVazio } from "../components/cabecalho-pagina";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";

export default function Page() {
  const { ficha } = useFoundry();
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  if (!ficha) return null;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Poderes">
        <span className="text-sm opacity-70">{ficha.poderes.length}</span>
      </CabecalhoPagina>

      {ficha.poderes.length === 0 && <EstadoVazio>Nenhum poder nesta ficha.</EstadoVazio>}

      <ul className="flex flex-col gap-2">
        {ficha.poderes.map((poder) => {
          const expandido = expandidoId === poder.id;
          return (
            <li key={poder.id} className="rounded-lg border-2 border-red-900 px-3 py-2">
              <div className="flex items-center gap-3">
                {poder.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poder.img} alt="" className="size-8 rounded-md object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => setExpandidoId(expandido ? null : poder.id)}
                  className="flex-1 text-left font-bold"
                >
                  {poder.nome}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {poder.tipo && <Tag>{poder.tipo}</Tag>}
                {poder.subtipo && <Tag>{poder.subtipo}</Tag>}
                {poder.ativacao && <Tag>{poder.ativacao}</Tag>}
              </div>
              {expandido && poder.descricao && (
                <div
                  className="mt-2 border-t border-red-900/40 pt-2 text-sm [&_p]:mb-2 last:[&_p]:mb-0"
                  dangerouslySetInnerHTML={{ __html: poder.descricao }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </PaginaFicha>
  );
}
