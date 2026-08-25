"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { calcularDescanso } from "./descanso";
import type {
  Ficha,
  ListaPersonagens,
  MensagemDoFoundry,
  MensagemParaFoundry,
  UsuarioFoundry
} from "./foundry-types";

// Toda a fala com o Foundry (login, socket) acontece no servidor Node deste
// front (ver app/lib/foundry-server.ts e app/api/*) — o navegador só troca
// HTTP normal (mesma origem) e um stream SSE com o NOSSO servidor. Ver
// docs/arquitetura.md.

type Status = "conectando" | "loginNecessario" | "autenticando" | "autenticado" | "erroConexao";

type DescansoOpcoes = Extract<MensagemParaFoundry, { tipo: "descansar" }>["opcoes"];

/** Trava de segurança: se o relay não responder a uma troca de personagem, a tela não fica presa em "carregando" pra sempre. */
const LIMITE_TROCA_MS = 10000;

const LISTAS_VAZIAS: ListaPersonagens = { meus: [], companheiros: [] };

/**
 * Aplica na ficha local o mesmo efeito que o Foundry vai aplicar, para a tela
 * responder no toque em vez de esperar a volta pelo relay (Foundry → nosso
 * servidor → SSE). O push que chega em seguida substitui isto pelo estado
 * real; se der erro, o provider repede a ficha e o palpite é descartado.
 *
 * As regras aqui espelham `applyDamage`/`spendMana` do sistema tormenta20:
 * o gasto sai dos pontos temporários primeiro, PM nunca fica negativo e PV
 * pode — em T20 é o que separa "caído" de "morrendo".
 */
function ajustarRecursoLocal(ficha: Ficha, chave: "pv" | "pm", delta: number): Ficha {
  const recurso = ficha[chave];
  const max = recurso.max ?? 0;
  const temp = recurso.temp;

  if (delta < 0) {
    const gasto = Math.abs(delta);
    const doTemporario = Math.min(temp, gasto);
    const bruto = (recurso.atual ?? 0) - (gasto - doTemporario);
    const atual = chave === "pm" ? Math.max(0, bruto) : bruto;
    return { ...ficha, [chave]: { ...recurso, atual, temp: temp - doTemporario } };
  }

  return { ...ficha, [chave]: { ...recurso, atual: Math.min(max, (recurso.atual ?? 0) + delta) } };
}

function definirRecursoLocal(ficha: Ficha, chave: "pv" | "pm", valor: number): Ficha {
  const recurso = ficha[chave];
  const max = recurso.max ?? 0;
  const limitado = Math.min(max, chave === "pm" ? Math.max(0, valor) : valor);
  return { ...ficha, [chave]: { ...recurso, atual: limitado } };
}

function alternarEquipadoLocal(ficha: Ficha, itemId: string): Ficha {
  return {
    ...ficha,
    inventario: ficha.inventario.map((grupo) => ({
      ...grupo,
      itens: grupo.itens.map((item) =>
        item.id === itemId ? { ...item, equipado: !item.equipado } : item
      )
    }))
  };
}

type FoundryContextValue = {
  status: Status;
  usuarios: UsuarioFoundry[];
  erroLogin: string | null;
  erroServidor: string | null;
  ficha: Ficha | null;
  /** Null enquanto o relay ainda não respondeu — a home mostra "carregando" nesse intervalo. */
  personagens: ListaPersonagens | null;
  /** Id do personagem cuja ficha estamos esperando chegar (clique na home). */
  trocandoPara: string | null;
  /** Atalho de leitura: nenhuma escrita é permitida na ficha aberta (companheiro). */
  somenteLeitura: boolean;
  login: (userId: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  selecionarPersonagem: (actorId: string) => void;
  /** Repede as listas ao relay — usado quando a home fica esperando tempo demais. */
  recarregarPersonagens: () => void;
  /** Dispensa a faixa de erro. Sem isso um erro pontual (permissão negada) ficaria na tela até a próxima ficha chegar. */
  limparErro: () => void;
  ajustarPV: (delta: number) => void;
  ajustarPM: (delta: number) => void;
  definirAtual: (recurso: "pv" | "pm", valor: number) => void;
  definirTemporario: (recurso: "pv" | "pm", valor: number) => void;
  alternarEquipado: (itemId: string) => void;
  ajustarDinheiro: (moeda: string, valor: number) => void;
  descansar: (opcoes: DescansoOpcoes) => void;
};

const FoundryContext = createContext<FoundryContextValue | null>(null);

async function buscarUsuarios(): Promise<UsuarioFoundry[]> {
  try {
    const resposta = await fetch("/api/usuarios", { cache: "no-store" });
    const dados = await resposta.json();
    return dados.usuarios ?? [];
  } catch {
    return [];
  }
}

/** Pergunta ao nosso servidor (que por sua vez pergunta ao Foundry) se a sessão ainda vale — nunca do cache. */
async function conferirSessao(): Promise<boolean> {
  const resposta = await fetch("/api/sessao", { cache: "no-store" });
  const dados = await resposta.json();
  return !!dados.autenticado;
}

export function FoundryProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("conectando");
  const [usuarios, setUsuarios] = useState<UsuarioFoundry[]>([]);
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [personagens, setPersonagens] = useState<ListaPersonagens | null>(null);
  const [trocandoPara, setTrocandoPara] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const trocaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Espelho do estado: o handler do EventSource é criado uma vez só e leria
  // sempre o `trocandoPara` do primeiro render se dependesse do state.
  const trocandoParaRef = useRef<string | null>(null);
  const router = useRouter();

  const encerrarTroca = useCallback(() => {
    if (trocaTimeoutRef.current) clearTimeout(trocaTimeoutRef.current);
    trocaTimeoutRef.current = null;
    trocandoParaRef.current = null;
    setTrocandoPara(null);
  }, []);

  /**
   * Repede o estado ao relay. Usado sempre que uma ação falha: em vez de
   * tentar desfazer o palpite otimista na mão (e errar se um push legítimo
   * chegou no meio), pedimos a verdade e sobrescrevemos.
   */
  const ressincronizar = useCallback(() => {
    fetch("/api/ficha/acao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "obterFicha" } satisfies MensagemParaFoundry)
    }).catch(() => {});
  }, []);

  const enviar = useCallback(
    (mensagem: MensagemParaFoundry) => {
      fetch("/api/ficha/acao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mensagem)
      })
        .then((resposta) => {
          if (resposta.ok) return;
          return resposta
            .json()
            .catch(() => null)
            .then((dados) => {
              setErroServidor(dados?.erro ?? "O Foundry recusou a ação.");
              ressincronizar();
            });
        })
        .catch(() => {
          setErroServidor("Não foi possível falar com o servidor.");
          ressincronizar();
        });
    },
    [ressincronizar]
  );

  /** Ação que mexe na ficha: pinta a tela na hora e manda para o Foundry. */
  const agir = useCallback(
    (mensagem: MensagemParaFoundry, palpite: (ficha: Ficha) => Ficha) => {
      setFicha((atual) => (atual ? palpite(atual) : atual));
      enviar(mensagem);
    },
    [enviar]
  );

  const carregarUsuariosELogin = useCallback(async () => {
    setStatus("loginNecessario");
    setUsuarios(await buscarUsuarios());
  }, []);

  const abrirStream = useCallback(() => {
    eventSourceRef.current?.close();
    const stream = new EventSource("/api/ficha/eventos");
    eventSourceRef.current = stream;

    stream.onopen = () => {
      setStatus("autenticado");
      // O servidor só guarda o que o relay já mandou. Numa reconexão (ou num
      // F5 sobre uma sessão que nasceu antes de o mestre abrir o Foundry) esse
      // cache pode estar vazio, e aí ninguém pediria nada — a tela ficaria
      // carregando pra sempre. Pedir de novo é barato e idempotente.
      enviar({ tipo: "obterFicha" });
    };

    stream.onmessage = (evento) => {
      let mensagem: MensagemDoFoundry;
      try {
        mensagem = JSON.parse(evento.data);
      } catch {
        return;
      }
      if (mensagem.tipo === "ficha") {
        setFicha(mensagem.ficha);
        setErroServidor(null);
        // Só encerra a espera quando chega a ficha que foi pedida — um push
        // de atualização do personagem antigo pode chegar no meio da troca.
        if (trocandoParaRef.current === mensagem.ficha.id) encerrarTroca();
      } else if (mensagem.tipo === "semFicha") {
        setFicha(null);
        encerrarTroca();
      } else if (mensagem.tipo === "personagens") {
        setPersonagens({ meus: mensagem.meus, companheiros: mensagem.companheiros });
      } else if (mensagem.tipo === "erro") {
        setErroServidor(mensagem.mensagem);
        encerrarTroca();
        // A ação foi recusada (ficha de companheiro, permissão perdida): a
        // tela pode estar mostrando um palpite que nunca vai acontecer.
        ressincronizar();
      }
    };

    // EventSource não expõe o status HTTP do erro — em vez de adivinhar,
    // perguntamos de novo pro nosso servidor se a sessão ainda vale (pode ter
    // morrido no Foundry, não só uma falha de rede).
    stream.onerror = () => {
      stream.close();
      conferirSessao()
        .then((autenticado) => {
          if (autenticado) setStatus("erroConexao");
          else {
            setFicha(null);
            setPersonagens(null);
            encerrarTroca();
            carregarUsuariosELogin();
          }
        })
        .catch(() => setStatus("erroConexao"));
    };
  }, [carregarUsuariosELogin, encerrarTroca, enviar, ressincronizar]);

  useEffect(() => {
    (async () => {
      try {
        if (await conferirSessao()) abrirStream();
        else await carregarUsuariosELogin();
      } catch {
        setStatus("erroConexao");
      }
    })();

    return () => {
      eventSourceRef.current?.close();
      if (trocaTimeoutRef.current) clearTimeout(trocaTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (userId: string, senha: string) => {
      setErroLogin(null);
      setStatus("autenticando");
      try {
        const resposta = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: userId, senha })
        });
        const dados = await resposta.json();
        if (!dados.sucesso) {
          setErroLogin(dados.erro ?? "Não foi possível entrar.");
          setStatus("loginNecessario");
          return;
        }
        // Login sempre começa na home, nunca na rota em que o navegador
        // estava antes de deslogar.
        router.replace("/");
        abrirStream();
      } catch {
        setErroLogin("Não foi possível falar com o servidor. Tente novamente.");
        setStatus("loginNecessario");
      }
    },
    [abrirStream, router]
  );

  const logout = useCallback(async () => {
    eventSourceRef.current?.close();
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    setFicha(null);
    setPersonagens(null);
    encerrarTroca();
    setErroServidor(null);
    setErroLogin(null);
    await carregarUsuariosELogin();
  }, [carregarUsuariosELogin, encerrarTroca]);

  const selecionarPersonagem = useCallback(
    (actorId: string) => {
      if (trocaTimeoutRef.current) clearTimeout(trocaTimeoutRef.current);
      trocandoParaRef.current = actorId;
      setTrocandoPara(actorId);
      trocaTimeoutRef.current = setTimeout(() => {
        trocandoParaRef.current = null;
        setTrocandoPara(null);
        setErroServidor("O Foundry não respondeu a tempo. O mestre está com o jogo aberto?");
      }, LIMITE_TROCA_MS);
      enviar({ tipo: "selecionarPersonagem", actorId });
    },
    [enviar]
  );

  const value: FoundryContextValue = {
    status,
    usuarios,
    erroLogin,
    erroServidor,
    ficha,
    personagens,
    trocandoPara,
    somenteLeitura: !!ficha?.somenteLeitura,
    login,
    logout,
    selecionarPersonagem,
    recarregarPersonagens: () => enviar({ tipo: "obterFicha" }),
    limparErro: () => setErroServidor(null),
    ajustarPV: (delta) => agir({ tipo: "ajustarPV", delta }, (f) => ajustarRecursoLocal(f, "pv", delta)),
    ajustarPM: (delta) => agir({ tipo: "ajustarPM", delta }, (f) => ajustarRecursoLocal(f, "pm", delta)),
    definirAtual: (recurso, valor) =>
      agir({ tipo: "definirAtual", recurso, valor }, (f) => definirRecursoLocal(f, recurso, valor)),
    definirTemporario: (recurso, valor) =>
      agir({ tipo: "definirTemporario", recurso, valor }, (f) => ({
        ...f,
        [recurso]: { ...f[recurso], temp: Math.max(0, valor) }
      })),
    alternarEquipado: (itemId) =>
      agir({ tipo: "alternarEquipado", itemId }, (f) => alternarEquipadoLocal(f, itemId)),
    ajustarDinheiro: (moeda, valor) =>
      agir({ tipo: "ajustarDinheiro", moeda, valor }, (f) => ({
        ...f,
        dinheiro: f.dinheiro.map((m) => (m.chave === moeda ? { ...m, valor: Math.max(0, valor) } : m))
      })),
    descansar: (opcoes) =>
      agir({ tipo: "descansar", opcoes }, (f) => {
        const ganho = calcularDescanso(f.nivel ?? 0, opcoes);
        const comPV = definirRecursoLocal(f, "pv", (f.pv.atual ?? 0) + ganho.pv);
        return definirRecursoLocal(comPV, "pm", (comPV.pm.atual ?? 0) + ganho.pm);
      })
  };

  return <FoundryContext.Provider value={value}>{children}</FoundryContext.Provider>;
}

export function useFoundry() {
  const contexto = useContext(FoundryContext);
  if (!contexto) throw new Error("useFoundry deve ser usado dentro de <FoundryProvider>");
  return contexto;
}

/** Listas já normalizadas — evita `?? { meus: [], companheiros: [] }` espalhado pela home. */
export function usePersonagens(): { listas: ListaPersonagens; carregando: boolean } {
  const { personagens } = useFoundry();
  return { listas: personagens ?? LISTAS_VAZIAS, carregando: personagens === null };
}
