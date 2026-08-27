"use client";

import CabecalhoPagina, { EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import CampoComDetalhe from "../components/campo-com-detalhe";
import LinhaArma from "../components/linha-arma";
import LinhaItem from "../components/linha-item";
import LinhaProtecao from "../components/linha-protecao";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";
import type { ItemInventario } from "../lib/foundry-types";

/**
 * PV, PM e Defesa vivem no cabeçalho, visível em todas as seções — repeti-los
 * aqui só duplicaria o mesmo número. O que esta seção acrescenta é o que se
 * usa na luta. Nada é rolado: os dados são jogados na mesa.
 */
/** Mesmo cartão nos dois casos: com detalhe (é um botão) e sem (é uma caixa). */
const CARTAO_DESLOCAMENTO =
  "flex w-full min-w-0 flex-1 flex-col gap-0.5 rounded-xl border border-borda bg-superficie-alta px-3 py-2 text-left";

export default function Page() {
  const { ficha, somenteLeitura, alternarEquipado } = useFoundry();

  if (!ficha) return null;

  const armas = ficha.armas ?? [];
  const equipadas = armas.filter((a) => a.equipado);
  const guardadas = armas.filter((a) => !a.equipado);
  const protecoes = ficha.protecoes ?? [];
  const vestidas = protecoes.filter((p) => p.equipado);
  const naMochila = protecoes.filter((p) => !p.equipado);

  // Mão ocupada não é só arma: a tocha, a corda presa, o foco de conjuração.
  // Quem já tem seção própria — armas e proteções — fica de fora para não
  // aparecer duas vezes na mesma tela.
  const jaListados = new Set([...armas.map((a) => a.id), ...protecoes.map((p) => p.id)]);
  const naMao = (item: ItemInventario) =>
    ficha.configEquipamento.usaSlots
      ? item.slot?.tipo === "mao"
      : // Sem slots o sistema só sabe "equipado"; onde ele *pode* ser posto
        // (`equipado2.type`) é o que resta para separar mão de vestido.
        ["hand", "both"].includes(item.tipoSlot);
  const itensEmMaos = ficha.inventario
    .flatMap((grupo) => grupo.itens)
    .filter((item) => item.equipado && !jaListados.has(item.id) && naMao(item));
  const { movimento, tamanho, resistencias, imunidadesCondicoes } = ficha;

  const visorDeslocamento = (
    <>
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Deslocamento</span>
      <span className="numero text-base font-bold">
        {movimento.valor ?? "—"}
        {movimento.unidade ? ` ${movimento.unidade.toLowerCase()}` : ""}
        {movimento.unidade === "Metros" && movimento.valor !== null && (
          <span className="text-xs font-normal opacity-60"> · {(movimento.valor / 1.5).toFixed(0)} quadrados</span>
        )}
      </span>
    </>
  );

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Combate" />

      <div className="flex flex-row flex-wrap gap-2">
        {/* Deslocamento muda com armadura, carga e condição — daí o detalhe,
            igual ao da Defesa. Ficha sem deslocamento nenhum não tem o que
            abrir, e aí o card fica só com o número. */}
        {movimento.itens.length > 0 ? (
          <CampoComDetalhe
            titulo="Deslocamento"
            itens={movimento.itens}
            total={movimento.valor ?? 0}
            classeContainer="relative flex min-w-0 flex-1"
            classeGatilho={CARTAO_DESLOCAMENTO}
          >
            {visorDeslocamento}
          </CampoComDetalhe>
        ) : (
          <div className={CARTAO_DESLOCAMENTO}>{visorDeslocamento}</div>
        )}
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
        {equipadas.length === 0 && itensEmMaos.length === 0 ? (
          <EstadoVazio>Nada nas mãos.</EstadoVazio>
        ) : (
          <ul className="flex flex-col gap-2">
            {equipadas.map((arma) => (
              <LinhaArma key={arma.id} arma={arma} />
            ))}
            {itensEmMaos.map((item) => (
              <LinhaItem
                key={item.id}
                item={item}
                somenteLeitura={somenteLeitura}
                aoAlternarEquipado={() => alternarEquipado(item.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {guardadas.length > 0 && (
        <div className="flex flex-col gap-2">
          <TituloSecao>Armas guardadas</TituloSecao>
          <ul className="flex flex-col gap-2">
            {guardadas.map((arma) => (
              <LinhaArma key={arma.id} arma={arma} />
            ))}
          </ul>
        </div>
      )}

      {protecoes.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            <TituloSecao>Proteção</TituloSecao>
            {vestidas.length === 0 ? (
              <EstadoVazio>Nenhuma armadura ou escudo em uso.</EstadoVazio>
            ) : (
              <ul className="flex flex-col gap-2">
                {vestidas.map((protecao) => (
                  <LinhaProtecao key={protecao.id} protecao={protecao} />
                ))}
              </ul>
            )}
          </div>

          {naMochila.length > 0 && (
            <div className="flex flex-col gap-2">
              <TituloSecao>Proteção na mochila</TituloSecao>
              <ul className="flex flex-col gap-2">
                {naMochila.map((protecao) => (
                  <LinhaProtecao key={protecao.id} protecao={protecao} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </PaginaFicha>
  );
}
