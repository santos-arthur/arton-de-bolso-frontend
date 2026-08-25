"use client";

import CabecalhoPagina, { EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import LinhaItem from "../components/linha-item";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";

/**
 * PV, PM e Defesa vivem no cabeçalho, visível em todas as seções — repeti-los
 * aqui só duplicaria o mesmo número. O que esta seção acrescenta é o que muda
 * de mão durante a luta. Nada é rolado aqui: os dados são jogados na mesa.
 */
export default function Page() {
  const { ficha, somenteLeitura, alternarEquipado } = useFoundry();

  if (!ficha) return null;

  const armas = ficha.inventario.find((grupo) => grupo.tipo === "arma")?.itens ?? [];
  const equipadas = armas.filter((a) => a.equipado);
  const guardadas = armas.filter((a) => !a.equipado);
  const { movimento, tamanho, resistencias, imunidadesCondicoes } = ficha;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Combate" />

      <div className="flex flex-row flex-wrap gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border border-borda bg-superficie-alta px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Deslocamento</span>
          <span className="numero text-base font-bold">
            {movimento.valor ?? "—"}
            {movimento.unidade ? ` ${movimento.unidade.toLowerCase()}` : ""}
            {movimento.unidade === "Metros" && movimento.valor !== null && (
              <span className="text-xs font-normal opacity-60"> · {(movimento.valor / 1.5).toFixed(0)} quadrados</span>
            )}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border border-borda bg-superficie-alta px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Tamanho</span>
          <span className="text-base font-bold">{tamanho || "—"}</span>
        </div>
      </div>

      {(resistencias.length > 0 || imunidadesCondicoes.length > 0) && (
        <div className="flex flex-col gap-2">
          <TituloSecao>Resistências e imunidades</TituloSecao>
          <div className="flex flex-row flex-wrap gap-1.5">
            {resistencias.map((r) => (
              <Tag key={`r-${r}`}>{r}</Tag>
            ))}
            {imunidadesCondicoes.map((i) => (
              <Tag key={`i-${i}`}>{i}</Tag>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <TituloSecao>Em punho</TituloSecao>
        {equipadas.length === 0 ? (
          <EstadoVazio>Nenhuma arma equipada.</EstadoVazio>
        ) : (
          <ul className="flex flex-col gap-2">
            {equipadas.map((arma) => (
              <LinhaItem
                key={arma.id}
                item={arma}
                somenteLeitura={somenteLeitura}
                aoAlternarEquipado={() => alternarEquipado(arma.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {guardadas.length > 0 && (
        <div className="flex flex-col gap-2">
          <TituloSecao>Guardadas</TituloSecao>
          <ul className="flex flex-col gap-2">
            {guardadas.map((arma) => (
              <LinhaItem
                key={arma.id}
                item={arma}
                somenteLeitura={somenteLeitura}
                aoAlternarEquipado={() => alternarEquipado(arma.id)}
              />
            ))}
          </ul>
        </div>
      )}
    </PaginaFicha>
  );
}
