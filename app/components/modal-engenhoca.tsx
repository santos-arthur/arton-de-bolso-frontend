"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { FaArrowLeft, FaCheck, FaGear, FaXmark } from "react-icons/fa6";
import { ListaAprimoramentos, useAprimoramentos, useCongelado, type UsoDeAprimoramentos } from "./lista-aprimoramentos";
import PainelDeUso, { Caixa, Linha, Titulo, Total } from "./painel-de-uso";
import { aprimoramentosDe, noContexto, TRUQUE } from "../lib/aprimoramentos";
import { useFoundry } from "../lib/foundry-provider";
import type { GastoDeUso, InfoEngenhoca, Magia } from "../lib/foundry-types";

function formatar(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

/** Custos e efeitos dos poderes opcionais — os mesmos de `CUSTO_DOS_PODERES` no módulo Arton de Bolso. */
const PODERES = [
  { chave: "invencaoPotente", rotulo: "Invenção Potente", descricao: "1 PM: +2 na CD para resistir.", pm: 1 },
  {
    chave: "forcarCalibragem",
    rotulo: "Forçar a Calibragem",
    descricao: "−5 no teste de ativação: +2 na CD para resistir.",
    pm: 0
  },
  {
    chave: "ativacaoRapida",
    rotulo: "Ativação Rápida",
    descricao: "2 PM: ativa com ação de movimento em vez de ação padrão.",
    pm: 2
  }
] as const;

type ChavePoder = (typeof PODERES)[number]["chave"];
const SEM_PODERES: Record<ChavePoder, boolean> = { invencaoPotente: false, forcarCalibragem: false, ativacaoRapida: false };

const PENALIDADE_FORCAR = -5;
const CUSTO_DA_REROLAGEM = 1;

const BOTAO =
  "flex min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity disabled:transition-none";

function Opcao({
  rotulo,
  descricao,
  marcado,
  travado,
  aoMudar
}: {
  rotulo: string;
  descricao: string;
  marcado: boolean;
  travado: boolean;
  aoMudar: (valor: boolean) => void;
}) {
  return (
    <label className="flex flex-row items-start gap-3 rounded-xl border border-borda bg-superficie-alta px-3 py-2.5">
      <input
        type="checkbox"
        checked={marcado}
        disabled={travado}
        onChange={(evento) => aoMudar(evento.target.checked)}
        className="checkbox-personalizado mt-0.5 size-5 shrink-0 cursor-pointer rounded border border-borda disabled:cursor-default"
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold">{rotulo}</span>
        <span className="text-xs opacity-60">{descricao}</span>
      </span>
    </label>
  );
}

/**
 * Ativar uma engenhoca, em dois passos.
 *
 * 1. **O que ativar**: o resumo da magia e os aprimoramentos, como no painel
 *    de conjurar — mas sem os PM da magia, que numa engenhoca só sobem a CD.
 * 2. **O teste**: a CD de ativação (que os aprimoramentos do passo 1
 *    aumentam), os poderes do inventor e o teste de Ofício. O dado rola na
 *    mesa; aqui o jogador diz como foi — **Funcionou** ou **Falhou** — e o
 *    Foundry cobra, grava e, na falha, enguiça a engenhoca.
 *
 * O que sai sempre: os aprimoramentos do teste e os poderes, porque o teste
 * aconteceu. O que sai só se funcionar: os aprimoramentos da magia.
 */
export default function ModalEngenhoca({
  magia,
  info: infoAtual,
  onFechar
}: {
  magia: Magia;
  info: InfoEngenhoca;
  onFechar: () => void;
}) {
  const { ficha, somenteLeitura, ativarEngenhoca } = useFoundry();
  const [passo, setPasso] = useState<1 | 2>(1);
  const [poderes, setPoderes] = useState(SEM_PODERES);
  const [rerrolou, setRerrolou] = useState(false);
  const [explodiu, setExplodiu] = useState(false);
  const [enviado, setEnviado] = useState<boolean | null>(null);
  // O botão diz o resultado e chama o `uso.gastar()` do painel, que entrega o
  // gasto montado ao `enviar` — o resultado vai junto por aqui.
  const resultado = useRef<boolean | null>(null);
  // Enviada a ativação, o push traz o estado novo (ativações, enguiço): a
  // tela fica com o de antes, que é o da conta que o jogador conferiu.
  const info = useCongelado(infoAtual, enviado !== null);
  const travado = enviado !== null || somenteLeitura;

  const pericia = ficha?.pericias.find((p) => p.chave === info.pericia) ?? null;
  const rotuloTeste = info.rotuloDoTeste ?? pericia?.label ?? "Ofício: Engenhoqueiro";
  const aplicaveisNoTeste = useMemo(
    () => aprimoramentosDe(noContexto(ficha?.aprimoramentos ?? [], ["teste"]), "skill", rotuloTeste),
    [ficha?.aprimoramentos, rotuloTeste]
  );
  // O teste não cobra sozinho: o que ele gasta vai junto da ativação. O
  // destino vazio só serve para congelar a lista quando a ativação sai.
  const usoTeste = useAprimoramentos(aplicaveisNoTeste, { acao: rotuloTeste, gastarCom: () => {} });

  const cdResistencia =
    info.cdResistencia.total + (poderes.invencaoPotente ? 2 : 0) + (poderes.forcarCalibragem ? 2 : 0);
  const execucao = poderes.ativacaoRapida ? info.execucaoRapida : info.execucao;

  /** A conta inteira: a CD, o teste e o que vai sair. */
  function conta({ custoTotal, pmAtual }: Pick<UsoDeAprimoramentos, "custoTotal" | "pmAtual">) {
    // `custoTotal` aqui já é só aprimoramentos (a magia entra com custo 0) e
    // nunca fica negativo — a janela do sistema também corta em zero.
    const pmAprimoramentos = Math.max(0, custoTotal - (info.comutador ? 1 : 0));
    const cd = info.cdAtivacao.total + pmAprimoramentos;
    const excede = pmAprimoramentos > info.limiteAprimoramentos;

    const modificadores = [
      ...(poderes.forcarCalibragem ? [{ rotulo: "Forçar a Calibragem", valor: PENALIDADE_FORCAR }] : []),
      ...(info.giroscopio ? [{ rotulo: "Giroscópio", valor: info.giroscopio }] : [])
    ];
    const base = info.bonusDoTeste ?? pericia?.formula?.total ?? 0;
    const bonusDoTeste = base + usoTeste.bonusTotal("roll") + modificadores.reduce((s, m) => s + m.valor, 0);

    const custoDosPoderes = PODERES.reduce((soma, p) => soma + (poderes[p.chave] ? p.pm : 0), 0);
    const pmSempre = usoTeste.custoTotal + custoDosPoderes + (rerrolou ? CUSTO_DA_REROLAGEM : 0);
    // Para tentar é preciso ter o PM de tudo — inclusive o que só sai se funcionar.
    const semPM = pmSempre + pmAprimoramentos > pmAtual;

    return { pmAprimoramentos, cd, excede, modificadores, base, bonusDoTeste, pmSempre, semPM };
  }

  function enviar(gasto: GastoDeUso) {
    if (resultado.current === null) return;
    const sucesso = resultado.current;
    ativarEngenhoca({
      magiaId: magia.id,
      sucesso,
      explodiu: !sucesso && info.poderes.goblinoide && explodiu,
      rerrolou: info.poderes.chutesEPalavroes && rerrolou,
      aplicados: gasto.aplicados ?? [],
      aplicadosNoTeste: usoTeste.escolhidos.map((item) => ({ id: item.id, vezes: usoTeste.quantidadeDe(item) })),
      itens: gasto.itens,
      itensDoTeste: usoTeste.itensGastos.map(({ itemId, quantidade }) => ({ itemId, quantidade })),
      poderes
    });
    setEnviado(sucesso);
  }

  /** O passo 2: a CD, os poderes e o teste. */
  function teste(uso: UsoDeAprimoramentos): ReactNode {
    const c = conta(uso);
    const temPoderes = info.poderes.invencaoPotente || info.poderes.forcarCalibragem || info.poderes.ativacaoRapida;

    return (
      <>
        {enviado === null && (
          <button
            type="button"
            onClick={() => setPasso(1)}
            className="flex flex-row items-center gap-2 self-start text-sm font-bold text-acento"
          >
            <FaArrowLeft aria-hidden="true" className="size-3.5! shrink-0" />
            Voltar aos aprimoramentos
          </button>
        )}

        {/* --- O que se joga na mesa --- */}
        <div className="flex flex-row gap-2">
          <Caixa rotulo={`Role ${rotuloTeste}`}>1d20 {formatar(c.bonusDoTeste)}</Caixa>
          <Caixa rotulo="Para funcionar">CD {c.cd}</Caixa>
        </div>

        {/* --- A CD de ativação, parcela por parcela --- */}
        <div className="flex flex-col gap-2">
          <Titulo>CD de ativação</Titulo>
          <div className="flex flex-col">
            <div className="flex flex-col">
              {info.cdAtivacao.partes.map((parte, indice) => (
                <Linha key={`${parte.rotulo}-${indice}`} rotulo={parte.rotulo} valor={parte.valor} />
              ))}
              {c.pmAprimoramentos > 0 && (
                <Linha
                  destacado
                  rotulo={`${info.rotuloCdAprimoramentos}${info.comutador ? " (Comutador −1)" : ""}`}
                  valor={c.pmAprimoramentos}
                />
              )}
            </div>
            <Total valor={`CD ${c.cd}`} />
          </div>
        </div>

        {temPoderes && (
          <div className="flex flex-col gap-2">
            <Titulo>Poderes do inventor</Titulo>
            {PODERES.filter((p) => info.poderes[p.chave]).map((poder) => (
              <Opcao
                key={poder.chave}
                rotulo={poder.rotulo}
                descricao={poder.descricao}
                marcado={poderes[poder.chave]}
                travado={travado}
                aoMudar={(valor) => setPoderes((atual) => ({ ...atual, [poder.chave]: valor }))}
              />
            ))}
          </div>
        )}

        {/* --- O teste de Ofício --- */}
        <div className="flex flex-col gap-2">
          <Titulo>{rotuloTeste}</Titulo>
          <div className="flex flex-col">
            <div className="flex flex-col">
              <Linha rotulo={rotuloTeste} valor={formatar(c.base)} />
              {usoTeste.bonusTotal("roll") !== 0 && (
                <Linha destacado rotulo="Aprimoramentos" valor={formatar(usoTeste.bonusTotal("roll"))} />
              )}
              {c.modificadores.map((m) => (
                <Linha key={m.rotulo} destacado rotulo={m.rotulo} valor={formatar(m.valor)} />
              ))}
            </div>
            <Total valor={formatar(c.bonusDoTeste)} />
          </div>
        </div>

        <ListaAprimoramentos uso={usoTeste} chaves={[{ chave: "roll", rotulo: "no teste" }]} contexto="no teste" />

        {(info.poderes.chutesEPalavroes || info.poderes.goblinoide) && (
          <div className="flex flex-col gap-2">
            <Titulo>Na mesa</Titulo>
            {info.poderes.chutesEPalavroes && (
              <Opcao
                rotulo="Rolei de novo (Chutes e Palavrões)"
                descricao="1 PM: a primeira tentativa falhou e você rolou o teste outra vez."
                marcado={rerrolou}
                travado={travado}
                aoMudar={setRerrolou}
              />
            )}
            {info.poderes.goblinoide && (
              <Opcao
                rotulo="Falhou por 5 ou mais (ou tirou 1)"
                descricao={`Engenhocaria Goblinoide: se falhar assim, ela explode — ${info.danoDaExplosao} de impacto.`}
                marcado={explodiu}
                travado={travado}
                aoMudar={setExplodiu}
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5 text-xs opacity-75">
          <p>
            <strong>Funcionou:</strong> o efeito acontece ({execucao}), com CD {cdResistencia} para resistir.
            {info.sustentada && " Sustentada: 1 PM no início de cada turno."}
            {c.pmAprimoramentos > 0 && ` Os aprimoramentos da magia custam ${c.pmAprimoramentos} PM.`}
          </p>
          <p>
            <strong>Falhou:</strong>{" "}
            {info.supressorDisponivel
              ? "o Supressor de Segurança segura a falha — não enguiça e a CD não sobe (uma vez por cena)."
              : "a engenhoca enguiça e só volta a funcionar depois de 1 hora de conserto."}{" "}
            Os aprimoramentos da magia não são pagos.
          </p>
          {c.pmSempre > 0 && <p>Nos dois casos saem {c.pmSempre} PM (teste e poderes).</p>}
        </div>

        {info.aparatos.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Titulo>Aparatos</Titulo>
            {info.aparatos.map((aparato) => (
              <p key={aparato.id} className="text-sm">
                <strong>{aparato.nome}:</strong> <span className="opacity-80">{aparato.efeito}</span>
              </p>
            ))}
          </div>
        )}
      </>
    );
  }

  /** O rodapé de cada passo: "Ativar" no primeiro, "Funcionou"/"Falhou" no segundo. */
  function rodape(uso: UsoDeAprimoramentos): ReactNode {
    if (somenteLeitura) return undefined;
    const c = conta(uso);

    if (enviado !== null) {
      return (
        <p className="flex min-h-12 flex-row items-center justify-center gap-2 text-sm font-bold opacity-60">
          {enviado ? (
            <FaCheck aria-hidden="true" className="size-4! shrink-0" />
          ) : (
            <FaXmark aria-hidden="true" className="size-4! shrink-0" />
          )}
          {enviado ? "Funcionou" : info.supressorDisponivel ? "Falhou — o Supressor segurou" : "Falhou — enguiçada"}
        </p>
      );
    }

    if (passo === 1) {
      const impedimento = info.enguicada
        ? "Enguiçada — conserte antes"
        : c.excede
          ? `Acima do limite de aprimoramentos (${info.limiteAprimoramentos} PM)`
          : null;
      return (
        <button
          type="button"
          onClick={() => setPasso(2)}
          disabled={!!impedimento}
          className={`${BOTAO} w-full ${impedimento ? "border border-borda opacity-50" : "bg-acento text-acento-tinta hover:opacity-90"}`}
        >
          <FaGear aria-hidden="true" className="size-4! shrink-0" />
          {impedimento ?? "Ativar"}
        </button>
      );
    }

    const impedimento = c.semPM
      ? "Sem PM suficiente"
      : uso.faltando
        ? `Sem ${uso.faltando.nome}`
        : usoTeste.faltando
          ? `Sem ${usoTeste.faltando.nome}`
          : null;
    if (impedimento) {
      return <p className="flex min-h-12 flex-row items-center justify-center text-sm font-bold opacity-60">{impedimento}</p>;
    }

    const confirmar = (sucesso: boolean) => {
      resultado.current = sucesso;
      usoTeste.gastar();
      uso.gastar();
    };
    const pmSucesso = c.pmSempre + c.pmAprimoramentos;
    return (
      <div className="flex w-full flex-row gap-2">
        <button
          type="button"
          onClick={() => confirmar(false)}
          className={`${BOTAO} border border-red-700/60 text-red-700 hover:bg-red-700/10 dark:border-red-500/60 dark:text-red-400`}
        >
          <FaXmark aria-hidden="true" className="size-4! shrink-0" />
          {info.supressorDisponivel ? "Falhou" : "Falhou · enguiçar"}
        </button>
        <button
          type="button"
          onClick={() => confirmar(true)}
          className={`${BOTAO} bg-acento text-acento-tinta hover:opacity-90`}
        >
          <FaCheck aria-hidden="true" className="size-4! shrink-0" />
          Funcionou{pmSucesso ? ` · ${pmSucesso} PM` : ""}
        </button>
      </div>
    );
  }

  return (
    <PainelDeUso
      acao={{
        ...magia,
        // A engenhoca não cobra os PM da magia — eles só sobem a CD.
        custo: 0,
        rotuloDoCusto: magia.nome,
        ativacao: execucao,
        cd: cdResistencia
      }}
      escopo="spell"
      contexto="nesta engenhoca"
      exclusivos={TRUQUE}
      rotulos={{ exclusivo: "Ativada como truque" }}
      gastarCom={enviar}
      onFechar={onFechar}
      substituto={(uso) => (passo === 2 ? teste(uso) : null)}
      rodape={rodape}
    />
  );
}
