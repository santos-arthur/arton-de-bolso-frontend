"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { calcularDescanso } from "./descanso";
import type {
  Ficha,
  GastoDeUso,
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

/**
 * De quanto em quanto tempo a tela de login repergunta quem está livre. Um
 * usuário já conectado não pode ser escolhido de novo, então quem espera o
 * colega sair precisa ver isso acontecer sem apertar F5. Só roda enquanto o
 * login está na tela, e o servidor ainda agrupa as leituras num cache curto.
 */
const INTERVALO_USUARIOS_MS = 10000;

/**
 * Batida de "ainda estou aqui" enquanto o app está aberto e visível. É o que
 * segura a sessão do lado do servidor: parou de bater por alguns minutos, a
 * sessão é encerrada e o usuário volta a ficar disponível na tela de login
 * (ver TEMPO_SEM_ALIVE_MS em foundry-server.ts).
 *
 * Não é o SSE que cumpre esse papel porque o iOS congela a aba em segundo
 * plano sem fechar o stream: do lado do servidor a conexão continuaria de pé,
 * parecendo um jogador presente que na verdade guardou o celular no bolso.
 */
const INTERVALO_ALIVE_MS = 30000;

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

function alternarPreparadaLocal(ficha: Ficha, magiaId: string): Ficha {
  return {
    ...ficha,
    magias: ficha.magias.map((magia) =>
      magia.id === magiaId ? { ...magia, preparada: !magia.preparada } : magia
    )
  };
}

/** Vira uma chave booleana de um item da mochila, na ficha local. */
function alternarNoItemLocal(ficha: Ficha, itemId: string, chave: "equipado" | "carregado"): Ficha {
  return {
    ...ficha,
    inventario: ficha.inventario.map((grupo) => ({
      ...grupo,
      itens: grupo.itens.map((item) => {
        if (item.id !== itemId) return item;
        const virado = { ...item, [chave]: !item[chave] };
        // Guardar desequipa junto — é o que o módulo faz. Sem isto a linha
        // ficava um instante com a etiqueta "Equipado" dentro do baú.
        if (chave === "carregado" && !virado.carregado) virado.equipado = false;
        return virado;
      })
    }))
  };
}

/** Muda a quantidade de itens da mochila, com piso em zero. Item zerado fica na lista. */
function mudarQuantidadesLocal(ficha: Ficha, porItem: Map<string, number>): Ficha {
  return {
    ...ficha,
    inventario: ficha.inventario.map((grupo) => ({
      ...grupo,
      itens: grupo.itens.map((item) => {
        const delta = porItem.get(item.id);
        return delta ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item;
      })
    }))
  };
}

/** Baixa da mochila o que o uso gastou. */
function gastarItensLocal(ficha: Ficha, itens: GastoDeUso["itens"]): Ficha {
  if (!itens.length) return ficha;
  const pedidos = new Map<string, number>();
  for (const { itemId, quantidade } of itens) {
    pedidos.set(itemId, (pedidos.get(itemId) ?? 0) - quantidade);
  }
  return mudarQuantidadesLocal(ficha, pedidos);
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
  /** Relê quem está livre, sem passar pelo cache — a tela de login chama ao abrir a lista. */
  recarregarUsuarios: () => void;
  /** Dispensa a faixa de erro. Sem isso um erro pontual (permissão negada) ficaria na tela até a próxima ficha chegar. */
  limparErro: () => void;
  ajustarPV: (delta: number) => void;
  ajustarPM: (delta: number) => void;
  definirAtual: (recurso: "pv" | "pm", valor: number) => void;
  definirTemporario: (recurso: "pv" | "pm", valor: number) => void;
  alternarEquipado: (itemId: string) => void;
  /** Move o item entre a mochila e o baú — guardado não ocupa espaço. */
  alternarCarregado: (itemId: string) => void;
  /** Contador da mochila: soma unidades ao item (negativo tira; nunca passa de zero). */
  ajustarQuantidade: (itemId: string, delta: number) => void;
  /** Marca/desmarca a magia como preparada — só para quem prepara (ver `preparavel`). */
  alternarPreparada: (magiaId: string) => void;
  /** Põe um item num slot de mão ou de vestido; `idAtual` é quem estava lá. */
  equiparEmSlot: (itemId: string, contexto: "hand" | "body", indice: number, idAtual: string | null) => void;
  ajustarDinheiro: (moeda: string, valor: number) => void;
  descansar: (opcoes: DescansoOpcoes) => void;
  /** Cobra um uso: os PM e os itens de uma vez, com aviso no chat da mesa. */
  gastarUso: (uso: GastoDeUso) => void;
};

const FoundryContext = createContext<FoundryContextValue | null>(null);

async function buscarUsuarios(fresco = false): Promise<UsuarioFoundry[]> {
  try {
    const resposta = await fetch(`/api/usuarios${fresco ? "?fresco=1" : ""}`, { cache: "no-store" });
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

  const recarregarUsuarios = useCallback(async () => {
    const lista = await buscarUsuarios(true);
    // Lista vazia é quase sempre falha de rede; manter os nomes antigos é
    // melhor do que esvaziar o campo debaixo do dedo de quem ia escolher.
    if (lista.length) setUsuarios(lista);
  }, []);

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
      } else if (mensagem.tipo === "expulso") {
        // O servidor já derrubou a sessão (e a do Foundry junto); fechamos o
        // stream aqui para o onerror não tratar isto como falha de rede.
        stream.close();
        setFicha(null);
        setPersonagens(null);
        encerrarTroca();
        setErroServidor(null);
        carregarUsuariosELogin();
        setErroLogin("O mestre desconectou você do jogo.");
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

  const avisarQueEstouAqui = useCallback(() => {
    fetch("/api/sessao", { method: "POST", cache: "no-store", keepalive: true }).catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "autenticado") return;
    avisarQueEstouAqui();
    const id = setInterval(avisarQueEstouAqui, INTERVALO_ALIVE_MS);

    // Voltar do segundo plano é o momento crítico: o intervalo não rodou
    // enquanto a aba estava congelada, e a sessão pode ter expirado. Bate na
    // hora e confere — se caducou mesmo, a tela vai pro login em vez de ficar
    // tentando agir sobre uma sessão que não existe mais.
    const aoVoltar = () => {
      if (document.visibilityState !== "visible") return;
      // Só a checagem: ela já conta como sinal de vida do lado do servidor, e
      // é ela que reconstrói a sessão se o processo tiver reiniciado.
      conferirSessao()
        .then((autenticado) => {
          if (!autenticado) {
            setFicha(null);
            setPersonagens(null);
            carregarUsuariosELogin();
          }
        })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [avisarQueEstouAqui, carregarUsuariosELogin, status]);

  // Enquanto ninguém está logado, mantém a lista de usuários fresca — é ela
  // que diz quem está "em uso".
  useEffect(() => {
    if (status !== "loginNecessario") return;
    const id = setInterval(async () => {
      const lista = await buscarUsuarios();
      // Lista vazia aqui é quase sempre falha momentânea de rede — apagar os
      // nomes da tela por causa disso seria pior do que manter os antigos.
      if (lista.length) setUsuarios(lista);
    }, INTERVALO_USUARIOS_MS);
    return () => clearInterval(id);
  }, [status]);

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
          // O motivo mais provável de recusa agora é "esse usuário já entrou"
          // — a lista precisa refletir isso na hora, não no próximo ciclo.
          setUsuarios(await buscarUsuarios());
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
    recarregarUsuarios,
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
      agir({ tipo: "alternarEquipado", itemId }, (f) => alternarNoItemLocal(f, itemId, "equipado")),
    alternarCarregado: (itemId) =>
      agir({ tipo: "alternarCarregado", itemId }, (f) => alternarNoItemLocal(f, itemId, "carregado")),
    ajustarQuantidade: (itemId, delta) =>
      agir({ tipo: "ajustarQuantidade", itemId, delta }, (f) =>
        mudarQuantidadesLocal(f, new Map([[itemId, delta]]))
      ),
    alternarPreparada: (magiaId) =>
      agir({ tipo: "alternarPreparada", magiaId }, (f) => alternarPreparadaLocal(f, magiaId)),
    // Sem palpite otimista: trocar de slot desequipa outros itens por regras
    // do sistema (duas mãos libera as duas, armadura tira armadura), e errar
    // esse encadeamento na tela é pior que esperar o push.
    equiparEmSlot: (itemId, contexto, indice, idAtual) =>
      enviar({ tipo: "equiparEmSlot", itemId, contexto, indice, idAtual }),
    ajustarDinheiro: (moeda, valor) =>
      agir({ tipo: "ajustarDinheiro", moeda, valor }, (f) => ({
        ...f,
        dinheiro: f.dinheiro.map((m) => (m.chave === moeda ? { ...m, valor: Math.max(0, valor) } : m))
      })),
    gastarUso: (uso) =>
      agir({ tipo: "gastarUso", uso }, (f) =>
        gastarItensLocal(uso.pm > 0 ? ajustarRecursoLocal(f, "pm", -uso.pm) : f, uso.itens)
      ),
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
