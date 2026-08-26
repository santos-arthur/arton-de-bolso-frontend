// Espelha exatamente o formato montado por `getFichaCompleta` em
// arton-de-bolso/scripts/adaptador-tormenta20.mjs — qualquer campo novo lá
// precisa ganhar um espelho aqui.

export type ItemDetalhe = { rotulo: string; valor: number; valorFormatado?: string };

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

export type Movimento = { valor: number | null; unidade: string };

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
};

/**
 * Active Effect "de uso" (`onuse`) do sistema: o que o personagem pode ativar
 * durante um uso, pagando PM. `restritoA` vazio significa "qualquer um do
 * escopo"; preenchido, limita aos nomes listados (ex.: o Escriba só vale em
 * Conhecimento, Misticismo, Nobreza e Religião).
 */
export type Aprimoramento = {
  id: string;
  nome: string;
  img: string;
  descricao: string;
  /** Em PM. Negativo reduz o custo do que está sendo usado (ex.: −1 numa magia). */
  custo: number;
  escopos: EscopoAprimoramento[];
  restritoA: string[];
  modificadores: ModificadorAprimoramento[];
  /** Repetível: pode ser aplicado mais de uma vez, pagando de novo. */
  aumenta: boolean;
};

export type Moeda = { chave: string; sigla: string; label: string; valor: number; emTibar: number };

export type ItemInventario = {
  id: string;
  nome: string;
  img: string;
  quantidade: number;
  equipavel: boolean;
  equipado: boolean;
  descricao: string;
};

export type GrupoInventario = { tipo: string; label: string; itens: ItemInventario[] };

export type Poder = {
  id: string;
  nome: string;
  img: string;
  tipo: string;
  subtipo: string;
  ativacao: string;
  descricao: string;
};

export type Magia = {
  id: string;
  nome: string;
  img: string;
  circulo: number;
  escola: string;
  tipo: string;
  preparada: boolean;
  ativacao: string;
  descricao: string;
};

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
  poderes: Poder[];
  magias: Magia[];
  aprimoramentos: Aprimoramento[];
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

export type UsuarioFoundry = { id: string; nome: string };

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
export type MensagemParaFoundry =
  | { tipo: "obterFicha" }
  | { tipo: "obterPersonagens" }
  | { tipo: "selecionarPersonagem"; actorId: string }
  | { tipo: "ajustarPV" | "ajustarPM"; delta: number }
  | { tipo: "definirAtual"; recurso: "pv" | "pm"; valor: number }
  | { tipo: "definirTemporario"; recurso: "pv" | "pm"; valor: number }
  | { tipo: "alternarEquipado"; itemId: string }
  | { tipo: "ajustarDinheiro"; moeda: string; valor: number }
  | { tipo: "descansar"; opcoes: OpcoesDescanso };

/** Mensagens que o relay manda de volta (mesmo canal). */
export type MensagemDoFoundry =
  | { tipo: "ficha"; ficha: Ficha }
  | ({ tipo: "personagens" } & ListaPersonagens)
  | { tipo: "semFicha" }
  | { tipo: "erro"; mensagem: string };
