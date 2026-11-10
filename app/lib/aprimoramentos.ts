import { normalizar } from "../components/campo-busca";
import type { Aprimoramento, EscopoAprimoramento, ModificadorAprimoramento } from "./foundry-types";

/**
 * Os aprimoramentos como um painel específico os enxerga.
 *
 * Um modificador geral da ficha ("Dano A Distância", "Testes de Perícias")
 * chega com `mapeamentos`: a chave do painel em que entra e as etiquetas de
 * contexto que precisam estar presentes. Aqui ele vira a chave do painel
 * quando o contexto bate, e some quando não bate — o bônus de dano à
 * distância não existe num golpe de espada. O resto passa como veio.
 *
 * Feito uma vez, na entrada do painel, para tudo o que vem depois (a lista,
 * os totais, a decomposição) ler a mesma coisa.
 */
export function noContexto(todos: Aprimoramento[], etiquetas: string[]): Aprimoramento[] {
  const presentes = new Set(etiquetas);
  return todos.map((aprimoramento) => {
    if (!aprimoramento.modificadores.some((m) => m.mapeamentos)) return aprimoramento;
    const modificadores = aprimoramento.modificadores.flatMap((m): ModificadorAprimoramento[] =>
      m.mapeamentos
        ? m.mapeamentos
            .filter((mapa) => mapa.contexto.every((etiqueta) => presentes.has(etiqueta)))
            .map((mapa) => ({ ...m, chave: mapa.chave, mapeamentos: undefined }))
        : [m]
    );
    return { ...aprimoramento, modificadores };
  });
}

/**
 * Filtra os aprimoramentos aplicáveis a um uso específico.
 *
 * A restrição por nome vem de um campo de texto preenchido à mão no Foundry,
 * então a comparação é normalizada: no mundo real aparece "Religiao" sem til
 * para a perícia "Religião", e o próprio sistema erra esse caso por comparar
 * as strings cruas.
 */
export function aprimoramentosDe(
  todos: Aprimoramento[],
  escopo: EscopoAprimoramento,
  nomeDoAlvo?: string,
  /** Id do item em uso — habilita os efeitos de escopo "self" dele. */
  idDoAlvo?: string
): Aprimoramento[] {
  const alvo = nomeDoAlvo ? normalizar(nomeDoAlvo) : null;
  // "self" é um upgrade do próprio item (a "Maciça" numa arma, o aprimoramento
  // escrito na própria magia): vale só para ele, não para todos do tipo.
  const doProprioItem = (a: Aprimoramento) =>
    a.escopos.includes("self") && !!idDoAlvo && a.origemId === idDoAlvo;

  return todos
    .filter((a) => {
      // Aprimoramento que mora num consumível acabado não é uma opção: sem
      // frasco na mochila não há o que marcar. O item continua na ficha com
      // quantidade 0 — some daqui, não de lá.
      if (a.consumo && a.consumo.disponivel <= 0) return false;
      // A melhoria da munição vem com a munição escolhida no ataque, nunca
      // como opção solta — senão a flecha Pungente apareceria até na espada.
      if (a.municao) return false;
      if (!a.escopos.includes(escopo) && !doProprioItem(a)) return false;
      if (!a.restritoA.length) return true;
      if (!alvo) return true;
      return a.restritoA.some((nome) => normalizar(nome) === alvo);
    })
    // Os do próprio item primeiro: são os que o jogador procura ao abrir a
    // magia ("aumenta a cura em +1d8"), enquanto os gerais valem para tudo e
    // servem de complemento.
    .sort((a, b) => {
      const proprio = Number(doProprioItem(b)) - Number(doProprioItem(a));
      return proprio || a.nome.localeCompare(b.nome, "pt-BR");
    });
}

/**
 * Truque é o aprimoramento gratuito escrito na própria magia — o livro os
 * lista como "Truque: muda o alvo para 1 morto-vivo…". Conjurar assim não
 * gasta PM nenhum, nem o da magia, e por ser outro jeito de lançar não aceita
 * mais nada junto.
 *
 * Ser da própria magia (escopo "self") é parte da regra: aprimoramento de
 * graça vindo de um poder — o "+1 na CD" do Xamã Místico — é de graça, mas
 * não é truque.
 */
export const ehTruque = (item: Aprimoramento) => item.escopos.includes("self") && item.custo === 0;

/**
 * O que o truque desliga: os aprimoramentos escritos na própria magia — os
 * outros truques dela e os que se paga em PM. Poder, item e consumível ficam
 * de fora porque não são jeitos de lançar a magia: eles incidem sobre o que
 * for lançado, truque ou não.
 */
export const daPropriaMagia = (item: Aprimoramento) => item.escopos.includes("self");

/** A regra do truque, pronta para o hook de uso — vale na magia e no pergaminho dela. */
export const TRUQUE = { quando: ehTruque, exclui: daPropriaMagia, rotulo: "Truque" };

/** Modo do Active Effect que troca o valor do campo em vez de somar a ele. */
export const MODO_SUBSTITUI = 5;
/** `custom`: na rolagem, mexe na base em vez de somar uma parte nova. */
export const MODO_PERSONALIZADO = 0;

/**
 * O modificador é desta chave? "dano:fogo" conta como "dano": o sistema usa o
 * sufixo para escolher, entre as partes da rolagem, a do tipo certo — e as
 * magias daqui têm uma parte só.
 */
function daChave(m: ModificadorAprimoramento, chave: string) {
  return m.chave.toLowerCase().replace(/:\w+$/, "") === chave;
}

/**
 * Mexe na base da rolagem em vez de somar ao lado dela: o `override` ("muda o
 * número de setas para três" → 3d4+3) e o `custom` ("d10" troca as faces;
 * "1d8+1" acrescenta dados à base, com as faces dela). Ver `applyRollChanges`
 * e `applyRollModifiers` no sistema.
 */
function mexeNaBase(m: ModificadorAprimoramento) {
  // Só no dano: é a única rolagem que o painel reconstrói pela base. Nas
  // outras chaves o modificador segue o caminho de sempre.
  if (!daChave(m, "dano")) return false;
  return m.modo === MODO_SUBSTITUI || (m.modo === MODO_PERSONALIZADO && /^\d*d\d+([+-]\d+)?$/i.test(m.formula.trim()));
}

/** Soma dos modificadores de uma chave ("roll" num teste, "ataque" num golpe). */
export function bonusDe(aprimoramento: Aprimoramento, chave: string): number | null {
  const aplicaveis = aprimoramento.modificadores.filter(
    (m) => daChave(m, chave) && m.valor !== null && !mexeNaBase(m)
  );
  if (!aplicaveis.length) return null;
  return aplicaveis.reduce((soma, m) => soma + (m.valor ?? 0), 0);
}

/** O que o aprimoramento faz, em texto curto, para a linha da lista. */
export function resumoDoEfeito(aprimoramento: Aprimoramento, chave: string): string | null {
  const numerico = bonusDe(aprimoramento, chave);
  if (numerico !== null) return `${numerico >= 0 ? "+" : ""}${numerico} no teste`;
  const formulas = aprimoramento.modificadores.filter((m) => m.chave.toLowerCase() === chave);
  return formulas.length ? formulas.map((m) => m.formula).join(" e ") : null;
}

/**
 * Multiplica uma fórmula pelo número de aplicações, como o sistema faz ao
 * repetir um aprimoramento: cresce a **quantidade de dados**, nunca as faces
 * ("1d8" três vezes é "3d8", não "1d24"), e os valores fixos acompanham.
 * Ver `applyRollChanges` em tormenta20.mjs.
 *
 * Dados e números soltos são tratados na mesma varredura, e não em duas: com
 * dois `replace` encadeados, o segundo reencontrava o número já multiplicado
 * ("10d8" voltava a casar como o "1" de "10") e multiplicava de novo.
 */
export function multiplicarFormula(formula: string, vezes: number): string {
  if (vezes <= 1 || !formula) return formula;
  return formula.replace(
    /(\d*)d(\d+)|(\d+)/gi,
    (_todo, quantidade: string | undefined, faces: string | undefined, numero: string | undefined) =>
      faces === undefined
        ? String(Number(numero) * vezes)
        : `${(Number(quantidade) || 1) * vezes}d${faces}`
  );
}


/** As fórmulas de uma chave que não resolvem para número (dados, por exemplo). */
export function formulasDe(aprimoramento: Aprimoramento, chave: string): string[] {
  return formulasComTipoDe(aprimoramento, chave).map((f) => f.formula);
}

/** Como `formulasDe`, com o tipo de dano de cada fórmula quando ela declara um. */
export function formulasComTipoDe(
  aprimoramento: Aprimoramento,
  chave: string
): { formula: string; tipo: string; rotuloTipo: string }[] {
  return aprimoramento.modificadores
    .filter((m) => daChave(m, chave) && m.valor === null && m.formula && !mexeNaBase(m))
    .map((m) => ({ formula: m.formula, tipo: m.tipoDano ?? "", rotuloTipo: m.rotuloTipoDano ?? m.tipoDano ?? "" }));
}

/**
 * O que um aprimoramento faz com a base da rolagem, em texto curto para a
 * linha da lista: "dano passa a 3d4+3", "dados viram d10", "+1d8+1".
 */
export function trocasNaBaseDe(aprimoramento: Aprimoramento, chave: string, vezes: number): string[] {
  return aprimoramento.modificadores
    .filter((m) => daChave(m, chave) && mexeNaBase(m))
    .map((m) => {
      const formula = m.formula.trim();
      if (m.modo === MODO_SUBSTITUI) return `passa a ${formula}`;
      if (/^d\d+$/i.test(formula)) return `dados viram ${formula}`;
      return `+${multiplicarFormula(formula, vezes)}`;
    });
}

/**
 * Aplica na base da rolagem ("2d8+2") o que os aprimoramentos escolhidos
 * mudam nela, na ordem em que o sistema aplica: a troca inteira primeiro,
 * depois as faces, depois os dados e o fixo acrescentados — que são somados à
 * base, com as faces dela, e multiplicados pelas vezes que se aplicou.
 */
export function baseDaRolagem(
  base: string,
  escolhidos: { item: Aprimoramento; vezes: number }[],
  chave: string
): { formula: string; mudou: boolean } {
  let formula = base;
  let mudou = false;
  let dados = 0;
  let fixo = 0;
  let faces: string | null = null;

  for (const { item, vezes } of escolhidos) {
    for (const m of item.modificadores) {
      if (!daChave(m, chave) || !mexeNaBase(m)) continue;
      const valor = m.formula.trim();
      mudou = true;
      if (m.modo === MODO_SUBSTITUI) {
        formula = valor;
        continue;
      }
      if (/^d\d+$/i.test(valor)) {
        faces = valor;
        continue;
      }
      const partes = valor.match(/^(\d*)d\d+([+-]\d+)?$/i);
      if (!partes) continue;
      dados += (Number(partes[1]) || 1) * vezes;
      fixo += (Number(partes[2]) || 0) * vezes;
    }
  }

  if (faces) formula = formula.replace(/d\d+/i, faces);
  if (dados) formula = formula.replace(/(\d*)d(\d+)/i, (_t, q: string, f: string) => `${(Number(q) || 1) + dados}d${f}`);
  if (fixo) formula = somarTermos([formula, String(fixo)]).replace(/\s+/g, "");
  return { formula, mudou };
}

/** "+1d12" ou "+1d12 perda": a fórmula extra como se lê numa linha. */
export function textoDaFormula({ formula, rotuloTipo }: { formula: string; rotuloTipo?: string }) {
  return `+${formula}${rotuloTipo ? ` ${rotuloTipo.toLocaleLowerCase("pt-BR")}` : ""}`;
}

/**
 * Junta termos iguais de uma rolagem: ["1d8", "+3", "1d8", "3d8", "+2"] vira
 * "5d8 + 5". A decomposição acima da caixa já explica de onde veio cada
 * pedaço — no resultado o que importa é o que se joga na mesa.
 */
export function somarTermos(partes: string[]): string {
  const porFaces = new Map<number, number>();
  let fixo = 0;

  for (const parte of partes) {
    for (const bruto of String(parte).match(/[+-]?\s*\d*d\d+|[+-]?\s*\d+/gi) ?? []) {
      const termo = bruto.replace(/\s+/g, "");
      const sinal = termo.startsWith("-") ? -1 : 1;
      const corpo = termo.replace(/^[+-]/, "");
      const dado = corpo.match(/^(\d*)d(\d+)$/i);
      if (dado) {
        const faces = Number(dado[2]);
        porFaces.set(faces, (porFaces.get(faces) ?? 0) + sinal * (Number(dado[1]) || 1));
      } else {
        fixo += sinal * Number(corpo);
      }
    }
  }

  // Dados maiores primeiro, como se escreve uma fórmula.
  const termos = [...porFaces.entries()]
    .filter(([, quantidade]) => quantidade !== 0)
    .sort(([a], [b]) => b - a)
    .map(([faces, quantidade]) => `${quantidade}d${faces}`);

  if (fixo !== 0) termos.push(String(Math.abs(fixo)));
  if (!termos.length) return "0";

  const sinais = [...porFaces.values()].filter((q) => q !== 0).map(() => "+");
  if (fixo !== 0) sinais.push(fixo > 0 ? "+" : "−");

  return termos.reduce((texto, termo, indice) => (indice === 0 ? termo : `${texto} ${sinais[indice]} ${termo}`), "");
}
