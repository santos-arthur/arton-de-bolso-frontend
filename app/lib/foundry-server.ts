// Código server-only: fala com o Foundry por HTTP/socket.io a partir do
// processo Node do front (nunca do navegador). É por isso que o cookie de
// sessão `SameSite=Strict` + CORS `*` do Foundry deixam de ser um problema —
// não tem navegador nenhum no meio dessa conversa. Ver docs/arquitetura.md.
//
// Nunca importar este arquivo de um componente "use client".

import { io, type Socket } from "socket.io-client";
import type {
  Ficha,
  ListaPersonagens,
  MensagemDoFoundry,
  MensagemParaFoundry,
  PersonagemDisponivel,
  UsuarioFoundry
} from "./foundry-types";

const FOUNDRY_URL = process.env.FOUNDRY_URL ?? "http://localhost:30000";
const SOCKET_PATH = process.env.FOUNDRY_SOCKET_PATH ?? "/socket.io";
const MODULE_EVENTO = "module.arton-de-bolso";
const TEMPO_LIMITE_MS = 10000;

/** Nome do cookie da NOSSA sessão (não confundir com o cookie "session" do Foundry, que nunca sai do servidor). */
export const COOKIE_SESSAO = "ab_sessao";

type SessaoServidor = {
  id: string;
  foundryUserId: string;
  socket: Socket;
  ficha: Ficha | null;
  /** Null enquanto o relay ainda não respondeu nada — é o que distingue "sem personagem" de "ainda não sei". */
  personagens: ListaPersonagens | null;
  erro: string | null;
  ouvintes: Set<() => void>;
  /** Último "ainda estou aqui" vindo do navegador — ver `registrarAlive`. */
  ultimoAlive: number;
};

// Em memória, dura enquanto o processo Node estiver de pé — reinício do
// servidor derruba todo mundo (precisam logar de novo). Suficiente pra essa
// escala; não há necessidade de Redis/DB pra isso hoje.
const sessoes = new Map<string, SessaoServidor>();

/**
 * Logins que já passaram pela checagem de "esse usuário está livre?" mas
 * ainda não viraram sessão no mapa acima. Sem isso, dois toques em "Entrar"
 * quase simultâneos no mesmo usuário passariam os dois pela checagem antes
 * de qualquer um dos dois ser registrado.
 */
const loginsEmAndamento = new Set<string>();

/**
 * Silêncio que caracteriza app fechado. O navegador bate um "ainda estou
 * aqui" a cada 30s (ver o provider); três batidas perdidas e a sessão é dada
 * como abandonada — o socket cai, o Foundry deixa de contar o usuário como
 * ativo e o login volta pra lista.
 *
 * O número é um meio-termo deliberado: curto o bastante pra liberar o usuário
 * ainda na mesma partida, longo o bastante pra atravessar um tranco de rede,
 * uma troca de app no celular ou a tela bloqueada por um minuto. E mesmo
 * depois de expirar, voltar não custa senha nenhuma — ver `restaurarSessao`.
 */
const TEMPO_SEM_ALIVE_MS = 3 * 60 * 1000;

/**
 * Varredura das sessões abandonadas. Sem ela, uma sessão só seria notada
 * quando alguém tentasse entrar — e até lá o usuário seguiria "em uso".
 */
const INTERVALO_VARREDURA_MS = 60 * 1000;

/**
 * Papel "Nenhum" (`CONST.USER_ROLES.NONE`). É o que o mestre aplica ao banir
 * — e o "Expulsar" do Foundry é exatamente isso: banir e desbanir em seguida
 * (`Players.#kickUser`), sem deixar rastro no estado final.
 */
const PAPEL_NENHUM = 0;

/**
 * Por quanto tempo lembramos de uma sessão derrubada por expulsão. Serve só
 * para o stream ainda conseguir dizer *por que* fechou quando o navegador
 * reconectar — passado isso, é uma sessão desconhecida como qualquer outra.
 */
const MEMORIA_EXPULSAO_MS = 5 * 60 * 1000;

const ERRO_USUARIO_EM_USO =
  "Este usuário já está conectado. Saia da outra sessão antes de entrar por aqui.";

function lerSetCookie(resposta: Response): string[] {
  // getSetCookie() é a forma correta (Node 18.14+/20+) — get("set-cookie")
  // junta múltiplos headers com vírgula e quebra o parse (datas de Expires
  // têm vírgula). Cai pro get() só se getSetCookie não existir.
  const headers = resposta.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const bruto = resposta.headers.get("set-cookie");
  return bruto ? [bruto] : [];
}

/**
 * O módulo Foundry manda caminhos de imagem relativos (ex:
 * "tokenizer/pc-images/foo.webp") — fazem sentido só dentro da origem do
 * Foundry, não da nossa. Antes eles viravam URL absoluta pro Foundry; hoje
 * apontam pra `/api/imagem`, que busca lá e repassa.
 *
 * O desvio existe porque o Foundry fala HTTP puro: com o front servido por
 * HTTPS (o túnel de desenvolvimento, ou qualquer deploy de verdade), o
 * navegador barra imagem `http://` numa página `https://` — é conteúdo
 * misto, e some tudo sem erro visível na tela. Passando pelo nosso servidor,
 * a imagem chega na mesma origem e no mesmo esquema da página.
 */
function absolutizarImagem(caminho: string | undefined | null): string {
  if (!caminho) return "";
  // Já é HTTPS de outro lugar: não tem o que consertar, e mandar pro proxy
  // só transformaria nosso servidor em ponte pra origem alheia.
  if (/^https:\/\//i.test(caminho)) return caminho;
  const limpo = caminho.replace(new RegExp(`^${FOUNDRY_URL}/*`, "i"), "").replace(/^\/+/, "");
  // Sobrou um endereço absoluto que não é do Foundry nem HTTPS: deixa passar
  // como veio, em vez de fingir que é um caminho de arquivo de lá.
  if (/^(https?:)?\/\//i.test(limpo)) return limpo;
  return `/api/imagem?caminho=${encodeURIComponent(limpo)}`;
}

/**
 * Busca um arquivo estático no Foundry pro proxy de imagem. Só aceita
 * caminho relativo: o parâmetro vem do navegador e, sem essa trava, a rota
 * viraria um buscador de URLs arbitrárias hospedado no nosso servidor.
 */
export async function buscarImagemDoFoundry(caminho: string): Promise<Response> {
  // Checado antes de tirar as barras da frente: depois, "//host/x" já teria
  // virado "host/x" e passaria como se fosse um arquivo de lá.
  if (/^[a-z]+:/i.test(caminho) || caminho.startsWith("//") || caminho.split("/").includes("..")) {
    throw new Error("Caminho de imagem inválido.");
  }
  return buscarComTimeout(`${FOUNDRY_URL}/${encodeURI(caminho.replace(/^\/+/, ""))}`);
}

function absolutizarImagensDaFicha(ficha: Ficha): Ficha {
  return {
    ...ficha,
    img: absolutizarImagem(ficha.img),
    inventario: ficha.inventario.map((grupo) => ({
      ...grupo,
      itens: grupo.itens.map((item) => ({ ...item, img: absolutizarImagem(item.img) }))
    })),
    poderes: ficha.poderes.map((poder) => ({ ...poder, img: absolutizarImagem(poder.img) })),
    magias: ficha.magias.map((magia) => ({ ...magia, img: absolutizarImagem(magia.img) })),
    aprimoramentos: ficha.aprimoramentos.map((a) => ({ ...a, img: absolutizarImagem(a.img) })),
    armas: ficha.armas.map((a) => ({ ...a, img: absolutizarImagem(a.img) })),
    protecoes: ficha.protecoes.map((p) => ({ ...p, img: absolutizarImagem(p.img) }))
  };
}

function absolutizarImagensDosPersonagens(personagens: PersonagemDisponivel[]): PersonagemDisponivel[] {
  return personagens.map((personagem) => ({ ...personagem, img: absolutizarImagem(personagem.img) }));
}

function absolutizarImagensDasListas(listas: ListaPersonagens): ListaPersonagens {
  return {
    meus: absolutizarImagensDosPersonagens(listas.meus),
    companheiros: absolutizarImagensDosPersonagens(listas.companheiros)
  };
}

function extrairValorCookie(cookies: string[], nome: string): string | null {
  for (const linha of cookies) {
    const [par] = linha.split(";");
    const [chave, valor] = par.split("=");
    if (chave?.trim() === nome) return decodeURIComponent((valor ?? "").trim());
  }
  return null;
}

/**
 * `fetch` do Node não tem timeout nenhum por padrão — sem isso, um Foundry
 * inalcançável (porta fechada silenciosamente, problema de NAT/roteador,
 * etc.) trava a promise pra sempre, sem erro nenhum aparecer na tela.
 */
async function buscarComTimeout(url: string, opcoes: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, { ...opcoes, signal: AbortSignal.timeout(TEMPO_LIMITE_MS) });
  } catch (erro) {
    if (erro instanceof Error && erro.name === "TimeoutError") {
      throw new Error(
        `Não consegui alcançar o Foundry em ${FOUNDRY_URL} (sem resposta em ${TEMPO_LIMITE_MS / 1000}s). ` +
          `Confira se FOUNDRY_URL está certo e se o host é alcançável a partir daqui — se este servidor ` +
          `estiver na mesma rede do Foundry, o roteador pode não suportar "NAT hairpin" pro IP público; tente o IP local.`
      );
    }
    throw new Error(`Não consegui falar com o Foundry em ${FOUNDRY_URL}: ${(erro as Error).message}`);
  }
}

/** Garante uma sessão no Foundry (qualquer rota nomeada fora dos arquivos estáticos cria uma) e devolve o id. */
async function criarSessaoAnonima(): Promise<string> {
  const resposta = await buscarComTimeout(`${FOUNDRY_URL}/join`);
  const sessionId = extrairValorCookie(lerSetCookie(resposta), "session");
  if (!sessionId) throw new Error("O Foundry não retornou uma sessão — confira FOUNDRY_URL.");
  return sessionId;
}

function conectarSocket(sessionId: string): Socket {
  return io(FOUNDRY_URL, {
    path: SOCKET_PATH,
    query: { session: sessionId },
    transports: ["websocket", "polling"]
  });
}

/** Espera o evento "session" que o Foundry manda logo após conectar — {sessionId, userId} (userId nulo se ainda não logado). */
function aguardarSessao(socket: Socket): Promise<{ sessionId: string | null; userId: string | null } | null> {
  return new Promise((resolve, reject) => {
    const tempoLimite = setTimeout(() => reject(new Error("Tempo esgotado conectando ao Foundry.")), TEMPO_LIMITE_MS);
    socket.once("connect_error", (erro) => {
      clearTimeout(tempoLimite);
      reject(erro);
    });
    socket.once("session", (info) => {
      clearTimeout(tempoLimite);
      resolve(info);
    });
  });
}

/** Resposta do `getJoinData` do Foundry — a mesma que alimenta a tela de entrada dele. */
type DadosDeEntrada = {
  users?: Array<{ _id?: string; id?: string; name?: string; role?: number }>;
  /** Ids de quem o Foundry considera conectado agora (client aberto ou socket autenticado). */
  activeUsers?: string[];
};

/**
 * Lê a tela de entrada do Foundry por uma conexão anônima. Aceita um
 * `sessionId` já criado para o login reaproveitar o mesmo — assim a checagem
 * de "esse usuário está livre?" não deixa uma sessão órfã no Foundry a cada
 * tentativa.
 */
async function lerDadosDeEntrada(sessionId?: string): Promise<DadosDeEntrada> {
  const sessao = sessionId ?? (await criarSessaoAnonima());
  const socket = conectarSocket(sessao);
  try {
    await aguardarSessao(socket);
    return await new Promise<DadosDeEntrada>((resolve) => {
      const tempoLimite = setTimeout(() => resolve({}), TEMPO_LIMITE_MS);
      socket.emit("getJoinData", (resposta: DadosDeEntrada) => {
        clearTimeout(tempoLimite);
        resolve(resposta ?? {});
      });
    });
  } finally {
    socket.disconnect();
  }
}

/**
 * Ids que não podem ser escolhidos no login, de três fontes:
 *   - `activeUsers` do Foundry — quem está com o client aberto;
 *   - sessões vivas deste processo — quem já entrou pelo app (nem todo socket
 *     autenticado conta como "ativo" pro Foundry, então o mapa local não é
 *     redundante);
 *   - logins em andamento — a janela entre a checagem e o registro da sessão.
 *
 * De quebra faz a faxina do mapa: sessão que parou de dar sinal de vida não
 * segura mais o usuário (ver `TEMPO_SEM_ALIVE_MS`).
 */
function usuariosOcupados(ativosNoFoundry: string[] = []): Set<string> {
  const ocupados = new Set(ativosNoFoundry);
  const agora = Date.now();
  for (const [id, sessao] of sessoes) {
    // Socket desconectado não conta mais como sessão morta: o socket.io
    // reconecta sozinho, e derrubar por isso deslogava gente por soluço de
    // rede. Quem manda aqui é o silêncio do navegador.
    if (agora - sessao.ultimoAlive > TEMPO_SEM_ALIVE_MS) {
      encerrarSessao(id);
      continue;
    }
    ocupados.add(sessao.foundryUserId);
  }
  for (const userId of loginsEmAndamento) ocupados.add(userId);
  return ocupados;
}

/**
 * Banido é quem o mestre pôs no papel "Nenhum" — no Foundry ele deixa de
 * conseguir entrar, e pelo app não pode ser diferente. Note que o "Expulsar"
 * passa por este mesmo estado, mas só por alguns milissegundos: a chance de
 * uma leitura cair exatamente nessa fresta é remota, e o preço seria uma
 * mensagem trocada numa tentativa que funciona na seguinte.
 */
function estaBanido(dados: DadosDeEntrada, userId: string): boolean {
  return (dados.users ?? []).some((u) => (u._id ?? u.id) === userId && u.role === PAPEL_NENHUM);
}

const ERRO_USUARIO_BANIDO = "Este usuário está banido no Foundry — fale com o mestre.";

/**
 * A tela de login fica reperguntando quem está livre (ver o polling no
 * provider), e cada leitura custa uma sessão + um socket no Foundry. Uma
 * janela curta de cache, somada a compartilhar a leitura já em voo, faz um
 * grupo inteiro esperando na tela de entrada custar o mesmo que um jogador
 * só. Não vale para o login em si, que sempre lê fresco.
 */
const CACHE_ENTRADA_MS = 4000;
let cacheEntrada: { em: number; dados: DadosDeEntrada } | null = null;
let leituraEmVoo: Promise<DadosDeEntrada> | null = null;

function lerDadosDeEntradaComCache(): Promise<DadosDeEntrada> {
  if (cacheEntrada && Date.now() - cacheEntrada.em < CACHE_ENTRADA_MS) {
    return Promise.resolve(cacheEntrada.dados);
  }
  if (leituraEmVoo) return leituraEmVoo;
  leituraEmVoo = lerDadosDeEntrada()
    .then((dados) => {
      cacheEntrada = { em: Date.now(), dados };
      return dados;
    })
    .finally(() => {
      leituraEmVoo = null;
    });
  return leituraEmVoo;
}

/**
 * `fresco` pula a janela de cache. É o que a tela de login usa quando o
 * jogador abre a lista: ali ele está prestes a escolher um nome, e quatro
 * segundos de atraso são a diferença entre escolher um usuário livre e
 * levar um "já está conectado" na cara.
 */
export async function listarUsuariosFoundry(fresco = false): Promise<UsuarioFoundry[]> {
  const dados = fresco ? await lerDadosDeEntrada() : await lerDadosDeEntradaComCache();
  const ocupados = usuariosOcupados(dados.activeUsers);
  return (dados.users ?? [])
    .map((u) => {
      const id = u._id ?? u.id ?? "";
      return { id, nome: u.name ?? "", ocupado: ocupados.has(id) };
    })
    .filter((u) => u.id);
}

export async function autenticar(
  userid: string,
  senha: string
): Promise<{ sucesso: true; sessaoId: string } | { sucesso: false; erro: string }> {
  // Barreira local antes de qualquer ida ao Foundry: se já temos sessão viva
  // (ou um login no meio do caminho) para esse usuário, nem vale a viagem.
  if (usuariosOcupados().has(userid)) return { sucesso: false, erro: ERRO_USUARIO_EM_USO };

  let sessionId: string;
  try {
    sessionId = await criarSessaoAnonima();
  } catch (erro) {
    return { sucesso: false, erro: (erro as Error).message };
  }

  // A lista da tela pode estar velha (alguém entrou nos últimos segundos),
  // então a decisão de verdade é tomada aqui, com dados frescos — nunca com
  // o cache que a listagem serve.
  let dadosFrescos: DadosDeEntrada;
  try {
    dadosFrescos = await lerDadosDeEntrada(sessionId);
  } catch (erro) {
    return { sucesso: false, erro: (erro as Error).message };
  }
  if (estaBanido(dadosFrescos, userid)) return { sucesso: false, erro: ERRO_USUARIO_BANIDO };
  if (usuariosOcupados(dadosFrescos.activeUsers ?? []).has(userid)) {
    return { sucesso: false, erro: ERRO_USUARIO_EM_USO };
  }

  // Daqui até a sessão entrar no mapa, o usuário fica reservado — a checagem
  // acima e este `add` são síncronos, então nenhum outro login se intercala.
  loginsEmAndamento.add(userid);
  try {
    return await concluirLogin(userid, senha, sessionId);
  } finally {
    loginsEmAndamento.delete(userid);
  }
}

/** Segunda metade do login: já sabemos que o usuário está livre, agora é o handshake em si. */
async function concluirLogin(
  userid: string,
  senha: string,
  sessionId: string
): Promise<{ sucesso: true; sessaoId: string } | { sucesso: false; erro: string }> {
  let respostaLogin: Response;
  try {
    respostaLogin = await buscarComTimeout(`${FOUNDRY_URL}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `session=${sessionId}` },
      body: JSON.stringify({ action: "join", userid, password: senha })
    });
  } catch (erro) {
    return { sucesso: false, erro: (erro as Error).message };
  }
  const dados = await respostaLogin.json().catch(() => null);
  if (dados?.status !== "success") {
    return { sucesso: false, erro: "Usuário ou senha inválidos." };
  }

  const socket = conectarSocket(sessionId);
  let sessaoFoundry: { sessionId: string | null; userId: string | null } | null;
  try {
    sessaoFoundry = await aguardarSessao(socket);
  } catch (erro) {
    socket.disconnect();
    return { sucesso: false, erro: (erro as Error).message };
  }

  if (!sessaoFoundry?.userId) {
    socket.disconnect();
    return { sucesso: false, erro: "O Foundry aceitou o login mas não confirmou o usuário na nova conexão." };
  }

  return { sucesso: true, sessaoId: criarSessaoLocal(sessionId, sessaoFoundry.userId, socket).id };
}

/** Recorte do `modifyDocument` que o Foundry transmite a cada escrita — só olhamos updates de usuário. */
type PacoteDocumento = {
  type?: string;
  action?: string;
  result?: Array<{ _id?: string; role?: number }>;
};

/**
 * Presença no Foundry. Sem isto, quem entra pelo app não aparece na lista de
 * jogadores do mestre: o servidor só conta como ativo quem anuncia atividade,
 * e um socket autenticado calado não conta. Como o "Expulsar" do menu exige o
 * jogador ativo, sem presença o mestre não teria nem como expulsar alguém que
 * está só no app.
 *
 * Uma emissão basta — a presença vale enquanto este socket viver.
 */
function marcarPresenca(sessao: SessaoServidor, ativo: boolean) {
  sessao.socket.emit("userActivity", sessao.foundryUserId, { active: ativo });
}

/**
 * Sessões derrubadas por expulsão, e quando. O stream lê daqui para dizer ao
 * navegador que ele não caiu por falha de rede — foi o mestre que o tirou.
 */
const expulsas = new Map<string, number>();

export function foiExpulsa(sessaoId: string | undefined | null): boolean {
  return !!sessaoId && expulsas.has(sessaoId);
}

/**
 * O mestre expulsou este jogador. Diferente de tudo mais que derruba uma
 * sessão, aqui a do Foundry precisa morrer junto: o "Expulsar" só desconecta
 * clients de jogo (o nosso socket nem sente), a sessão de lá continua válida
 * por 24h e é ela que o cookie do navegador aponta. Sem o logout, o app
 * voltaria sozinho, sem senha, no carregamento seguinte — e a expulsão não
 * teria significado nenhum.
 */
function expulsarSessao(sessao: SessaoServidor) {
  const ouvintes = [...sessao.ouvintes];
  expulsas.set(sessao.id, Date.now());
  encerrarSessao(sessao.id);
  void deslogarNoFoundry(sessao.id);
  // Depois de `encerrarSessao` a sessão não tem mais ouvintes registrados —
  // avisar a cópia é o que faz o stream fechar agora, em vez de no próximo
  // ping.
  ouvintes.forEach((notificar) => notificar());
}

/**
 * Desfaz o vínculo entre a sessão e o usuário no Foundry. É o mesmo caminho
 * do logout nativo: `game.logOut()` só navega para `/join`, e é o GET que o
 * servidor trata como "esqueça quem estava logado nesta sessão".
 */
async function deslogarNoFoundry(sessaoId: string) {
  try {
    await buscarComTimeout(`${FOUNDRY_URL}/join`, { headers: { Cookie: `session=${sessaoId}` } });
  } catch {
    // A sessão já morreu aqui de qualquer forma; no pior caso o cookie
    // continua valendo lá até o Foundry expirá-lo.
  }
}

/**
 * Monta a sessão em memória em volta de um socket já autenticado — o mesmo
 * fim de linha do login e da restauração.
 *
 * O id da sessão **é** o id da sessão do Foundry, de propósito: é ele que vai
 * no cookie, e é o que permite reconstruir tudo depois de o processo Node
 * reiniciar (em desenvolvimento, a cada recompilação) sem pedir senha de novo.
 * Ele nunca chega ao JavaScript da página — o cookie é httpOnly.
 */
function criarSessaoLocal(sessaoId: string, foundryUserId: string, socket: Socket): SessaoServidor {
  const sessao: SessaoServidor = {
    id: sessaoId,
    foundryUserId,
    socket,
    ficha: null,
    personagens: null,
    erro: null,
    ouvintes: new Set(),
    ultimoAlive: Date.now()
  };
  sessoes.set(sessaoId, sessao);

  marcarPresenca(sessao, true);
  // socket.io reconecta sozinho, e o Foundry esquece a presença junto com a
  // conexão antiga — sem remarcar, o jogador some da lista do mestre depois
  // de qualquer tranco de rede.
  socket.on("connect", () => marcarPresenca(sessao, true));

  socket.on("modifyDocument", (pacote: PacoteDocumento) => {
    if (pacote?.type !== "User" || pacote?.action !== "update") return;
    const expulso = (pacote.result ?? []).some(
      (documento) => documento?._id === sessao.foundryUserId && documento?.role === PAPEL_NENHUM
    );
    if (expulso) expulsarSessao(sessao);
  });

  socket.on(MODULE_EVENTO, (mensagem: MensagemDoFoundry) => {
    if (mensagem.tipo === "ficha") {
      sessao.ficha = absolutizarImagensDaFicha(mensagem.ficha);
      sessao.erro = null;
    } else if (mensagem.tipo === "semFicha") {
      sessao.ficha = null;
    } else if (mensagem.tipo === "personagens") {
      sessao.personagens = absolutizarImagensDasListas(mensagem);
    } else if (mensagem.tipo === "erro") {
      sessao.erro = mensagem.mensagem;
    }
    sessao.ouvintes.forEach((notificar) => notificar());
  });

  // socket.io reconecta sozinho; a cada reconexão o Foundry reenvia "session".
  // Se voltar anônima (mundo relançado, sessão expirada), a sessão local não
  // vale mais — descarta na hora em vez de esperar a próxima checagem.
  socket.on("session", (info: { userId?: string | null } | null) => {
    if (info?.userId !== sessao.foundryUserId) {
      sessoes.delete(sessaoId);
      socket.disconnect();
      sessao.ouvintes.forEach((notificar) => notificar());
    }
  });

  socket.emit(MODULE_EVENTO, { tipo: "obterFicha" } satisfies MensagemParaFoundry);

  return sessao;
}

/**
 * Reconstrói a sessão a partir do cookie, sem senha. É o que faz "fechar o
 * app e voltar" continuar logado: a sessão do Foundry vale 24h e vive lá, não
 * aqui — o que se perde num reinício do nosso processo (ou numa recompilação
 * do `next dev`) é só o socket e o cache de ficha, e os dois se refazem.
 *
 * Devolve null quando o Foundry não reconhece mais a sessão (mundo relançado,
 * 24h vencidas) ou quando o usuário foi tomado por outra sessão enquanto esta
 * estava fora — aí é login de novo, como manda a exclusividade.
 */
async function restaurarSessao(sessaoId: string): Promise<SessaoServidor | null> {
  const socket = conectarSocket(sessaoId);
  let info: { userId: string | null } | null;
  try {
    info = await aguardarSessao(socket);
  } catch {
    socket.disconnect();
    return null;
  }

  if (!info?.userId) {
    socket.disconnect();
    return null;
  }

  // Um banimento aplicado enquanto o app estava fechado não chega por socket
  // nenhum — a única forma de respeitá-lo é conferir na volta.
  if (estaBanido(await lerDadosDeEntradaComCache().catch(() => ({})), info.userId)) {
    socket.disconnect();
    void deslogarNoFoundry(sessaoId);
    return null;
  }

  // `usuariosOcupados()` sem argumento de propósito: o `activeUsers` do
  // Foundry ainda conta este usuário (a sessão dele segue viva lá), então
  // olhar pra ele faria a sessão barrar a si mesma. O que importa é se *outra*
  // sessão nossa pegou o usuário enquanto esta estava fora.
  if (usuariosOcupados().has(info.userId)) {
    socket.disconnect();
    return null;
  }

  return criarSessaoLocal(sessaoId, info.userId, socket);
}

/**
 * A sessão desta requisição, restaurando-a se o processo tiver perdido o
 * mapa. Todo caminho que precisa de sessão passa por aqui.
 */
/**
 * Restaurações em andamento, por sessão. Depois de o processo reiniciar, a
 * página volta pedindo tudo de uma vez (o stream, a ficha, uma dúzia de
 * imagens): sem isto cada requisição abriria seu próprio socket com o
 * Foundry, e todas menos a última vazariam ao se sobrescreverem no mapa.
 */
const restauracoesEmVoo = new Map<string, Promise<SessaoServidor | null>>();

export async function obterSessao(sessaoId: string | undefined | null): Promise<SessaoServidor | null> {
  if (!sessaoId) return null;
  const sessao = sessoes.get(sessaoId);
  if (sessao) return sessao;

  const emVoo = restauracoesEmVoo.get(sessaoId);
  if (emVoo) return emVoo;

  const restauracao = restaurarSessao(sessaoId).finally(() => restauracoesEmVoo.delete(sessaoId));
  restauracoesEmVoo.set(sessaoId, restauracao);
  return restauracao;
}

/** O navegador dizendo "ainda estou aqui" — ver `TEMPO_SEM_ALIVE_MS`. */
export function registrarAlive(sessaoId: string | undefined | null) {
  const sessao = sessaoId ? sessoes.get(sessaoId) : null;
  if (sessao) sessao.ultimoAlive = Date.now();
}

/** Derruba quem parou de dar sinal — é o que devolve o usuário à lista de login. */
function expirarSessoesAbandonadas() {
  const agora = Date.now();
  for (const [id, sessao] of sessoes) {
    if (agora - sessao.ultimoAlive > TEMPO_SEM_ALIVE_MS) encerrarSessao(id);
  }
  for (const [id, quando] of expulsas) {
    if (agora - quando > MEMORIA_EXPULSAO_MS) expulsas.delete(id);
  }
}

// `unref` para o timer não segurar o processo vivo sozinho (encerrar o
// servidor com Ctrl+C continua imediato).
setInterval(expirarSessoesAbandonadas, INTERVALO_VARREDURA_MS).unref?.();

export function sessaoExiste(sessaoId: string | undefined | null): boolean {
  return !!sessaoId && sessoes.has(sessaoId);
}

/**
 * "Este navegador ainda está logado?" — perguntado a cada carregamento de
 * tela e a cada volta do app ao primeiro plano.
 *
 * Deliberadamente tolerante. A versão anterior derrubava a sessão se o socket
 * estivesse desconectado *naquele instante* ou se o Foundry demorasse a
 * responder, e isso deslogava jogador por soluço de rede: o socket.io
 * reconecta sozinho, e um tranco de dois segundos não é motivo pra mandar
 * alguém digitar senha no meio de um combate. Quem de fato invalida a sessão
 * é o Foundry, pelo evento "session" tratado em `criarSessaoLocal` — e, se o
 * mapa tiver se perdido, `obterSessao` reconstrói a partir do cookie.
 */
export async function sessaoAtiva(sessaoId: string | undefined | null): Promise<boolean> {
  const sessao = await obterSessao(sessaoId);
  if (!sessao) return false;
  // Chegar aqui já é sinal de vida: a tela acabou de carregar.
  sessao.ultimoAlive = Date.now();
  return true;
}

/**
 * Estado já conhecido da sessão — usado pra remontar a tela inteira assim que
 * o SSE conecta (ou reconecta), sem esperar o próximo push do Foundry. São
 * várias mensagens porque listas e ficha são estados independentes: a home
 * precisa das listas mesmo quando nenhuma ficha está aberta.
 */
export function estadosAtuais(sessaoId: string): MensagemDoFoundry[] {
  const sessao = sessoes.get(sessaoId);
  if (!sessao) return [];

  const mensagens: MensagemDoFoundry[] = [];
  if (sessao.personagens) mensagens.push({ tipo: "personagens", ...sessao.personagens });
  // Só afirma "sem ficha" depois que o relay respondeu ao menos uma vez —
  // antes disso a tela segue em "carregando" em vez de piscar a home vazia.
  if (sessao.ficha) mensagens.push({ tipo: "ficha", ficha: sessao.ficha });
  else if (sessao.personagens) mensagens.push({ tipo: "semFicha" });
  if (sessao.erro) mensagens.push({ tipo: "erro", mensagem: sessao.erro });
  return mensagens;
}

export function inscrever(sessaoId: string, notificar: () => void): () => void {
  const sessao = sessoes.get(sessaoId);
  if (!sessao) return () => {};
  sessao.ouvintes.add(notificar);
  // Abrir o stream é sinal de vida; a partir daí quem sustenta a sessão é o
  // alive do navegador, que atravessa uma aba congelada pelo iOS sem fechar
  // o stream — coisa que o simples "tem ouvinte?" não distinguia.
  sessao.ultimoAlive = Date.now();
  return () => sessao.ouvintes.delete(notificar);
}

export function enviarMensagem(sessaoId: string, mensagem: MensagemParaFoundry) {
  const sessao = sessoes.get(sessaoId);
  if (!sessao) throw new Error("Sessão não encontrada — faça login novamente.");
  sessao.socket.emit(MODULE_EVENTO, mensagem);
}

/** Derruba a conexão com o Foundry e esquece a sessão — usado no logout. */
export function encerrarSessao(sessaoId: string | undefined | null) {
  if (!sessaoId) return;
  const sessao = sessoes.get(sessaoId);
  if (!sessao) return;
  // Antes de desligar: o mestre vê o jogador sair na hora, em vez de esperar
  // o Foundry notar a conexão caída.
  marcarPresenca(sessao, false);
  sessao.socket.disconnect();
  sessoes.delete(sessaoId);
  // Quem acabou de sair precisa reaparecer livre na próxima listagem, não
  // daqui a alguns segundos.
  cacheEntrada = null;
}
