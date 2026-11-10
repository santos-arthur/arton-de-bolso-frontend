"use client";

import { FaGear, FaScrewdriverWrench } from "react-icons/fa6";
import { useMemo, useState } from "react";
import AprimoramentosDaMagia, { aprimoramentosDaMagia } from "../components/aprimoramentos-da-magia";
import CabecalhoPagina, { EstadoVazio } from "../components/cabecalho-pagina";
import CampoBusca, { normalizar } from "../components/campo-busca";
import CartaoExpansivel, { AcaoPrincipal } from "../components/cartao-expansivel";
import ModalConsertarEngenhoca from "../components/modal-consertar-engenhoca";
import ModalMagia from "../components/modal-magia";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";
import type { Magia } from "../lib/foundry-types";

/** Referência estável: `?? []` criaria um array novo a cada render e invalidaria o memo. */
const SEM_MAGIAS: Magia[] = [];

/**
 * As engenhocas do inventor (módulo t20-engenhocas). No sistema são magias
 * com o tipo "Engenhoca", mas na mesa são outra coisa: não se conjuram, se
 * ativam — com teste de Ofício, CD que sobe a cada uso do dia, enguiço e
 * conserto. Por isso têm aba própria, fora de Magias.
 *
 * Fabricar e acoplar aparatos continuam no Foundry, na ficha do módulo.
 */
export default function Page() {
  const { ficha, somenteLeitura } = useFoundry();
  const [busca, setBusca] = useState("");
  const [ativando, setAtivando] = useState<Magia | null>(null);
  const [consertando, setConsertando] = useState<Magia | null>(null);

  const todas = ficha?.magias ?? SEM_MAGIAS;
  const engenhocas = useMemo(() => todas.filter((m) => m.engenhoca), [todas]);
  const filtradas = useMemo(() => {
    const alvo = normalizar(busca);
    return engenhocas.filter((m) => !alvo || normalizar(m.nome).includes(alvo));
  }, [engenhocas, busca]);

  if (!ficha) return null;

  const resumo = ficha.engenhocas;
  // A CD para resistir é a mesma em todas sem aparato (10 + metade do nível
  // + Inteligência); o Estabilizador muda a de uma só, e aí ela aparece no
  // próprio cartão.
  const cdBase = engenhocas.length
    ? Math.min(...engenhocas.map((m) => m.engenhoca!.cdResistencia.total))
    : null;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Engenhocas">
        {[
          cdBase === null ? null : `CD ${cdBase}`,
          resumo?.limite != null
            ? `${resumo.ocupadas} de ${resumo.limite} mantidas`
            : `${engenhocas.length} ${engenhocas.length === 1 ? "engenhoca" : "engenhocas"}`
        ]
          .filter(Boolean)
          .join(" · ")}
      </CabecalhoPagina>

      {engenhocas.length > 3 && <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar engenhoca..." />}

      {filtradas.length === 0 ? (
        <EstadoVazio>
          {engenhocas.length ? "Nenhuma engenhoca encontrada." : "Nenhuma engenhoca nesta ficha. Fabrique pelo Foundry."}
        </EstadoVazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtradas.map((magia) => {
            const info = magia.engenhoca!;
            return (
              <CartaoExpansivel
                key={magia.id}
                nome={magia.nome}
                img={magia.img}
                descricao={magia.descricao}
                complemento={
                  aprimoramentosDaMagia(ficha.aprimoramentos ?? [], magia.id).length ? (
                    <AprimoramentosDaMagia magiaId={magia.id} />
                  ) : undefined
                }
                destacado={info.enguicada}
                etiquetas={
                  <>
                    {info.enguicada && <Tag>Enguiçada</Tag>}
                    <Tag>{magia.circulo}º círculo</Tag>
                    {info.teste && !info.gmtools && <Tag>Próxima CD {info.cdAtivacao.total}</Tag>}
                    {info.ativacoesHoje > 0 && <Tag>{info.ativacoesHoje}× hoje</Tag>}
                    {cdBase !== null && info.cdResistencia.total !== cdBase && (
                      <Tag>CD {info.cdResistencia.total}</Tag>
                    )}
                    {info.aparatos.map((aparato) => (
                      <Tag key={aparato.id}>{aparato.nome}</Tag>
                    ))}
                  </>
                }
                acao={
                  info.enguicada && !somenteLeitura ? (
                    // Consertar é 1 hora de trabalho na mesa: pergunta antes
                    // de registrar — o módulo publica o card.
                    <AcaoPrincipal icone={FaScrewdriverWrench} onClick={() => setConsertando(magia)}>
                      Consertar
                    </AcaoPrincipal>
                  ) : (
                    <AcaoPrincipal icone={FaGear} onClick={() => setAtivando(magia)}>
                      Ativar
                    </AcaoPrincipal>
                  )
                }
              />
            );
          })}
        </ul>
      )}
      {ativando && <ModalMagia magia={ativando} onFechar={() => setAtivando(null)} />}
      {consertando && <ModalConsertarEngenhoca magia={consertando} onFechar={() => setConsertando(null)} />}
    </PaginaFicha>
  );
}
