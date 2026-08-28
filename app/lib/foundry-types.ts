// Espelha exatamente o formato montado por `getFichaCompleta` em
// arton-de-bolso/scripts/adaptador-tormenta20.mjs — qualquer campo novo lá
// precisa ganhar um espelho aqui.

export type ItemDetalhe = {
  rotulo: string;
  valor: number;
  valorFormatado?: string;
  /** Quando a parte é um dado ("1d8"), e não um número somável. */
  dado?: string;
};

export type Atributo = {
  chave: string;
  sigla: string;
  nome: string;
  mod: number | null;
  modFormatado: string;
  itens: ItemDetalhe[];
};

export type Recurso = {
  atual: number | null;
  max: number | null;
  temp: number;
  itensMax: ItemDetalhe[];
};

export type Defesa = {
  total: number | null;
  itens: ItemDetalhe[];
};

export type Movimento = {
  valor: number | null;
  unidade: string;
  /** De onde saiu o número: base da raça, efeitos que somam ou tiram. */
  itens: ItemDetalhe[];
};

export type RecursoGenerico = { chave: string; label: string; atual: number; max: number | null };

export type Xp = { atual: number; proximo: number } | null;

export type FormulaPericiaParte = { rotulo: string; valor: number; valorFormatado: string };

export type FormulaPericia = {
  label: string;
  total: number;
  totalFormatado: string;
  partes: FormulaPericiaParte[];
} | null;

export type Pericia = {
  chave: string;
  label: string;
  treinado: boolean;
  somenteTreinado: boolean;
  valorFormatado: string;
  formula: FormulaPericia;
};

/** `emTibar` é quanto uma unidade desta moeda vale em T$ (a unidade base): TO = 10, T$ = 1. */
/** Escopos de uso de um aprimoramento, como o sistema os nomeia. */
export type EscopoAprimoramento =
  | "skill"
  | "attack"
  | "ability"
  | "spell"
  | "power"
  | "equipment"
  | "consumable"
  | "self";

export type ModificadorAprimoramento = {
  /** Chave do change: "roll" (teste), "ataque", "dano", "criticoM"... */
  chave: string;
  /** Valor já resolvido, quando a fórmula dá um número. */
  valor: number | null;
  /** A fórmula crua ("@int", "1d8"), para exibir quando não resolve. */
  formula: string;
  /** Modo do Active Effect: 5 substitui o campo, o resto soma. */
  modo: number;
};

/**
 * Item que um uso gasta da mochila: a munição do ataque, o material da magia,
 * o consumível que originou um aprimoramento marcado. Vem montado pelo
 * módulo — o app só decide *quantas* unidades, nunca qual item.
 */
export type ConsumoDeItem = {
  itemId: string;
  nome: string;
  /** Unidades por uso (por aplicação, num aprimoramento repetível). */
  quantidade: number;
  /** `mpMultiplier` do sistema: a quantidade multiplica pelo custo em PM do uso. */
  porPM: boolean;
  /** Quantas o personagem tem agora — é o que trava o botão quando acaba. */
  disponivel: number;
};

/**
 * Active Effect "de uso" (`onuse`) do sistema: o que o personagem pode ativar
 * durante um uso, pagando PM. `restritoA` vazio significa "qualquer um do
 * escopo"; preenchido, limita aos nomes listados (ex.: o Escriba só vale em
 * Conhecimento, Misticismo, Nobreza e Religião).
 */
export type Aprimoramento = {
  id: string;
  /** Item que originou o efeito; escopo "self" só vale para ele. */
  origemId: string | null;
  nome: string;
  img: string;
  descricao: string;
  /** Em PM. Negativo reduz o custo do que está sendo usado (ex.: −1 numa magia). */
  custo: number;
  escopos: EscopoAprimoramento[];
  restritoA: string[];
  /** Preenchido quando o aprimoramento mora num consumível: marcá-lo gasta uma unidade dele. */
  consumo: ConsumoDeItem | null;
  modificadores: ModificadorAprimoramento[];
  /** Repetível: pode ser aplicado mais de uma vez, pagando de novo. */
  aumenta: boolean;
  /** Já vem marcado: é algo que o personagem tem ligado sempre, não uma escolha do momento. */
  ativoPorPadrao: boolean;
};

/** Ataque de uma arma, decomposto — o total que se soma ao 1d20. */
export type AtaqueArma = {
  /** Perícia usada (Luta, Pontaria). */
  pericia: string;
  total: number;
  totalFormatado: string;
  itens: ItemDetalhe[];
};

/** Uma rolagem de dano da arma: a fórmula e o tipo (corte, impacto...). */
export type DanoArma = {
  nome: string;
  formula: string;
  tipo: string;
  fixo: number;
  itens: ItemDetalhe[];
};

export type Arma = {
  id: string;
  nome: string;
  img: string;
  equipado: boolean;
  slot: SlotEquipado | null;
  tipoSlot: string;
  duasMaos: boolean;
  descricao: string;
  alcance: string;
  ataque: AtaqueArma | null;
  dano: DanoArma[];
  critico: { margem: number; multiplicador: number; texto: string };
  /** Munição que o ataque gasta, quando a arma declara consumo no Foundry. */
  consumo: ConsumoDeItem | null;
};

/** Armadura ou escudo: o que protege e o que atrapalha. */
export type Protecao = {
  id: string;
  nome: string;
  img: string;
  equipado: boolean;
  slot: SlotEquipado | null;
  tipoSlot: string;
  duasMaos: boolean;
  descricao: string;
  /** "escudo", "leve" ou "pesada". */
  tipo: string;
  defesa: number;
  /** Negativa: desconta de perícias marcadas com penalidade de armadura. */
  penalidade: number;
  reducaoDano: number;
};

export type Moeda = { chave: string; sigla: string; label: string; valor: number; emTibar: number };

/** Onde um item está equipado, quando o mundo usa slots. */
export type SlotEquipado = {
  /** 1..limite, ou 12 quando ocupa as duas mãos. */
  indice: number;
  tipo: "mao" | "vestido";
  duasMaos: boolean;
};

/**
 * O que um consumível faz ao ser usado. Mesmos campos de uma magia porque no
 * sistema é a mesma coisa: um pergaminho é a magia copiada para dentro de um
 * item, com o custo em PM zerado — usar gasta uma unidade dele, não mana.
 */
/**
 * Teste que a mesa faz antes de usar: ler um pergaminho de uma magia que o
 * personagem não conhece exige identificar a magia primeiro. Null quando não
 * há teste nenhum — conhecendo a magia, é só ler.
 */
export type TesteDeUso = {
  pericia: string;
  total: number;
  totalFormatado: string;
  cd: number;
};

export type UsoDeConsumivel = {
  /** Em PM. Zero no pergaminho criado pelo sistema; um consumível pode cobrar. */
  custo: number;
  ativacao: string;
  alcance: string;
  alvo: string;
  area: string;
  duracao: string;
  resistencia: string;
  /** Já calculada pelo sistema com os dados de quem carrega o item. */
  cd: number | null;
  rolagens: RolagemMagia[];
  /** Teste para ativar, quando o pergaminho traz uma magia que o personagem não conhece. */
  teste: TesteDeUso | null;
  /** O próprio item: usar tira uma unidade (o `consumeSelf` do sistema). */
  consumo: ConsumoDeItem | null;
};

export type ItemInventario = {
  id: string;
  nome: string;
  img: string;
  quantidade: number;
  /** Na mochila (ocupando espaço) ou guardado no baú. */
  carregado: boolean;
  /** Preço de uma unidade, em T$ (a moeda base); pode ser fracionário. */
  preco: number;
  /** Espaços que uma unidade ocupa na mochila; meio espaço é comum. */
  espacos: number;
  /** Preenchido quando o consumível tem efeito, resistência ou custo — o resto da mochila não se "usa". */
  uso: UsoDeConsumivel | null;
  equipavel: boolean;
  equipado: boolean;
  slot: SlotEquipado | null;
  /** "hand", "body" ou "both": onde este item pode ser posto. */
  tipoSlot: string;
  /** Arma de empunhadura dupla: só cabe no slot das duas mãos. */
  duasMaos: boolean;
  descricao: string;
};

/** Limites de equipamento do mundo e do personagem. */
export type ConfigEquipamento = {
  /** Falso = o sistema trata equipado como sim/não, sem slots. */
  usaSlots: boolean;
  limiteMaos: number;
  limiteVestido: number;
};

export type GrupoInventario = { tipo: string; label: string; itens: ItemInventario[] };

/**
 * Espaços da mochila. `limite` é o que o personagem carrega sem sobrecarga
 * (base + Força ×2) e `max` é o dobro dele — o teto do que dá para arrastar.
 */
export type Carga = { atual: number; limite: number; max: number };

export type Poder = {
  id: string;
  nome: string;
  img: string;
  tipo: string;
  subtipo: string;
  ativacao: string;
  /** Nível em que o poder foi ganho; 0 é poder de base (raça, origem, divindade). */
  nivel: number;
  /** Título da seção: "Base" ou "Nível 3". A lista já chega na ordem certa. */
  grupo: string;
  descricao: string;
  /**
   * Há o que ativar: o mestre marcou o poder com a tag `ativo` no Foundry.
   * Sem ela o poder é passiva na tela — o bônus dele já está na ficha, e
   * ativar não faria nada.
   */
  ativavel: boolean;
  /** Em PM; zero no poder que só custa a ação. */
  custo: number;
  alcance: string;
  alvo: string;
  area: string;
  duracao: string;
  /** Texto da resistência ("Fortitude parcial"); vazio quando não há. */
  resistencia: string;
  /** Calculada pelo sistema no próprio poder (10 + metade do nível + atributo + bônus). */
  cd: number | null;
  rolagens: RolagemMagia[];
  /** Item que a ativação gasta, quando o poder declara consumo no Foundry. */
  consumo: ConsumoDeItem | null;
  /** O que o poder liga na ficha ao ser ativado — a Fúria do bárbaro, o Frenesi. */
  efeitos: EfeitoDeAtivacao[];
};

/**
 * Active Effect que um poder liga na ficha ao ser ativado. `marcado` é a
 * escolha padrão (o efeito vem habilitado no poder); `ligado` diz que ele já
 * está valendo agora, de uma ativação anterior.
 */
export type EfeitoDeAtivacao = {
  id: string;
  nome: string;
  img: string;
  marcado: boolean;
  ligado: boolean;
};

/**
 * Uma rolagem de magia. Parecida com a de arma, mas não é a mesma coisa: aqui
 * não há atributo somado nem crítico, e o que a fórmula faz ("Cura", "PM
 * recuperados", "Fogo") é próprio de magia.
 */
export type RolagemMagia = {
  nome: string;
  formula: string;
  /** O que a fórmula faz com os pontos; vazio quando a magia não diz. */
  efeito: string;
  fixo: number;
  itens: ItemDetalhe[];
};

export type Magia = {
  id: string;
  nome: string;
  img: string;
  circulo: number;
  escola: string;
  tipo: string;
  preparada: boolean;
  /** Esta ficha usa preparação de magias? Falso para conjurador espontâneo. */
  preparavel: boolean;
  ativacao: string;
  descricao: string;
  /** Custo em PM da magia sozinha, sem aprimoramento nenhum. */
  custo: number;
  alcance: string;
  alvo: string;
  area: string;
  duracao: string;
  /** Texto da magia ("Vontade anula"); vazio quando não permite resistência. */
  resistencia: string;
  /** CD do conjurador — é do personagem, não da magia. */
  cd: number | null;
  rolagens: RolagemMagia[];
  /** Material que a conjuração gasta, quando a magia declara consumo no Foundry. */
  consumo: ConsumoDeItem | null;
};

/**
 * Um Active Effect que vale na ficha: o que veio de um item equipado, o que um
 * poder ligou, a condição que o mestre aplicou. Os "de uso" (as opções que
 * aparecem ao conjurar ou ativar) ficam de fora — eles são escolha do momento,
 * não estado do personagem.
 */
export type EfeitoFicha = {
  id: string;
  nome: string;
  img: string;
  /** O poder, item ou magia de onde ele veio; null quando foi posto direto na ficha. */
  origem: OrigemDoEfeito | null;
  descricao: string;
  /** "3 rodadas", "1 minuto" — vazio quando não expira. */
  duracao: string;
  /** Desligado ou suprimido (a armadura guardada, o efeito que outro sobrepõe) não conta agora. */
  ativo: boolean;
  /** Grupo na lista: com prazo, permanente, ou o que não está contando. Já chega ordenado por ele. */
  tipo: "temporario" | "passivo" | "inativo";
  mudancas: MudancaDeEfeito[];
};

/** O item que originou um efeito, com o bastante para a tela mostrá-lo. */
export type OrigemDoEfeito = {
  id: string;
  nome: string;
  img: string;
  /** "Poder", "Magia", "Equipamento" — o tipo do item, como o Foundry o nomeia. */
  tipo: string;
  /** Ficha técnica na linguagem do tipo: círculo e escola numa magia, preço e espaços num item. */
  dados: { rotulo: string; valor: string }[];
  descricao: string;
};

/**
 * Uma linha do que o efeito altera: "Força soma +2". `chave` é o caminho cru
 * do Active Effect, que o app usa para reescrever o rótulo (ver
 * `lib/nomes-de-efeitos.ts`).
 */
export type MudancaDeEfeito = { chave: string; rotulo: string; modo: string; valor: string };

export type Ficha = {
  id: string;
  /** Marcado pelo relay quando o usuário só tem OBSERVER no Actor (um "companheiro"): o front esconde todo controle de escrita. */
  somenteLeitura: boolean;
  nome: string;
  img: string;
  nivel: number | null;
  xp: Xp;
  raca: string;
  origem: string;
  divindade: string;
  classes: string;
  atributos: Atributo[];
  pv: Recurso;
  pm: Recurso;
  defesa: Defesa;
  movimento: Movimento;
  recursosGenericos: RecursoGenerico[];
  tamanho: string;
  sentidos: string[];
  resistencias: string[];
  imunidadesCondicoes: string[];
  profArmas: string[];
  profArmaduras: string[];
  pericias: Pericia[];
  dinheiro: Moeda[];
  inventario: GrupoInventario[];
  carga: Carga;
  poderes: Poder[];
  magias: Magia[];
  aprimoramentos: Aprimoramento[];
  /** Efeitos que valem na ficha, os ativos primeiro. Sem os de uso. */
  efeitos: EfeitoFicha[];
  armas: Arma[];
  protecoes: Protecao[];
  configEquipamento: ConfigEquipamento;
};

/** Resumo de um Actor para os cards da home — não é a ficha inteira. */
export type PersonagemDisponivel = {
  id: string;
  nome: string;
  img: string;
  nivel: number | null;
  raca: string;
  classes: string;
};

/** As duas listas da home: "meus" = sou OWNER (leio e escrevo); "companheiros" = sou só OBSERVER. */
export type ListaPersonagens = {
  meus: PersonagemDisponivel[];
  companheiros: PersonagemDisponivel[];
};

/** Um usuário na tela de login. `ocupado` = já conectado (aqui ou no Foundry) — não pode ser escolhido de novo. */
export type UsuarioFoundry = { id: string; nome: string; ocupado: boolean };

/**
 * Uma anotação: uma página de texto dentro do diário (JournalEntry) do
 * jogador. `conteudo` é HTML já podado pela allowlist do módulo (ver
 * `html-seguro.mjs` no projeto irmão) — o mesmo tipo de marcação das
 * descrições de poderes e magias.
 */
export type AnotacaoDiario = { id: string; titulo: string; conteudo: string };

/** Diário de um jogador. `meu` = sou o dono e posso escrever; os demais eu só leio. */
export type Diario = { id: string; nome: string; meu: boolean; paginas: AnotacaoDiario[] };

/**
 * Item final do compêndio: uma página de journal. Só dois tipos chegam aqui — os
 * únicos que o app exibe: texto formatado (`conteudo`) e imagem (`src`, já
 * apontando para o proxy do nosso servidor).
 */
export type ItemCompendio = {
  id: string;
  titulo: string;
  tipo: "texto" | "imagem";
  conteudo: string;
  src: string;
  legenda: string;
  /** Começo do texto (ou a legenda da imagem), para a prévia do cartão. */
  resumo: string;
};

/**
 * Um journal do compêndio. Na tela ele é mais um nível de pasta: agrupa as
 * páginas, e é a página que se abre para ver.
 */
export type JournalCompendio = { id: string; nome: string; paginas: ItemCompendio[] };

/** Uma pasta do compendio, com o que houver dentro dela — subpastas e journals. */
export type PastaCompendio = {
  id: string;
  nome: string;
  pastas: PastaCompendio[];
  journals: JournalCompendio[];
};

/**
 * O compêndio inteiro que este jogador pode ver: o conteúdo da pasta
 * "Conteúdos Para Jogadores", já podado do que ele não tem permissão de ver.
 */
export type Compendio = { pastas: PastaCompendio[]; journals: JournalCompendio[] };

/** Condição do descanso — define o multiplicador por nível (T20, p. 106). */
export type CondicaoDescanso = "ruim" | "normal" | "confortavel" | "luxuoso";

export type OpcoesDescanso = {
  condicao: CondicaoDescanso;
  pvExtraPorNivel: number;
  pmExtraPorNivel: number;
  /** Uso da perícia Cura: dobra os PV recuperados. */
  cuidadosProlongados: boolean;
  /** Dobra os PM recuperados. */
  acompanhamentoMedico: boolean;
};

/** Mensagens que o front envia pro relay (`module.arton-de-bolso`). */
/** O que um uso cobra: PM e unidades de itens, com o nome da ação para o chat. */
export type GastoDeUso = {
  /** Nome do que foi usado ("Bola de Fogo", "Arco longo", "Ofício") — só para o chat. */
  acao: string;
  pm: number;
  itens: { itemId: string; quantidade: number }[];
  /**
   * Item que originou o uso (o poder ativado). Com ele o Foundry anuncia no
   * chat a ficha da ativação — execução, alcance, alvo, duração, CD e efeito —
   * montada lá a partir do item, em vez da linha seca de gasto.
   */
  origemId?: string;
  /** Ids dos aprimoramentos marcados; o Foundry resolve os nomes para o anúncio. */
  aprimoramentos?: string[];
  /** Ids dos efeitos a ligar na ficha — só faz sentido junto de `origemId`. */
  efeitos?: string[];
};

export type MensagemParaFoundry =
  | { tipo: "obterFicha" }
  | { tipo: "obterPersonagens" }
  | { tipo: "selecionarPersonagem"; actorId: string }
  | { tipo: "ajustarPV" | "ajustarPM"; delta: number }
  | { tipo: "definirAtual"; recurso: "pv" | "pm"; valor: number }
  | { tipo: "definirTemporario"; recurso: "pv" | "pm"; valor: number }
  | { tipo: "alternarEquipado"; itemId: string }
  /** Move o item entre a mochila e o baú (`system.carregado` do sistema). */
  | { tipo: "alternarCarregado"; itemId: string }
  /** Contador da mochila: soma `delta` unidades ao item (nunca abaixo de zero). */
  | { tipo: "ajustarQuantidade"; itemId: string; delta: number }
  | { tipo: "alternarPreparada"; magiaId: string }
  | { tipo: "equiparEmSlot"; itemId: string; contexto: "hand" | "body"; indice: number; idAtual: string | null }
  | { tipo: "ajustarDinheiro"; moeda: string; valor: number }
  | { tipo: "descansar"; opcoes: OpcoesDescanso }
  /**
   * Gasto de um uso inteiro (PM + itens), com o aviso no chat da mesa. Só ids
   * e quantidades: nome de item e texto da mensagem são montados no Foundry,
   * que é quem tem a verdade sobre a mochila.
   */
  | { tipo: "gastarUso"; uso: GastoDeUso }
  /** Anotações: nada disso depende do personagem aberto — é o diário do usuário. */
  | { tipo: "obterDiarios" }
  | { tipo: "criarPaginaDiario"; titulo: string; conteudo: string }
  | { tipo: "salvarPaginaDiario"; paginaId: string; titulo: string; conteudo: string }
  | { tipo: "excluirPaginaDiario"; paginaId: string }
  /** Compêndio: só leitura — quem libera é o mestre, pela posse do journal no Foundry. */
  | { tipo: "obterCompendio" };

/** Mensagens que o relay manda de volta (mesmo canal). */
export type MensagemDoFoundry =
  | { tipo: "ficha"; ficha: Ficha }
  | ({ tipo: "personagens" } & ListaPersonagens)
  | { tipo: "semFicha" }
  | { tipo: "diarios"; diarios: Diario[] }
  | { tipo: "compendio"; compendio: Compendio }
  | { tipo: "erro"; mensagem: string }
  /** O mestre expulsou este jogador pelo Foundry — o stream fecha logo em seguida. */
  | { tipo: "expulso" };
