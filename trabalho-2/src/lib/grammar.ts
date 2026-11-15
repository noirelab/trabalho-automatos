// Uma produção A → α. Lado direito vazio representa ε.
export type Rule = { left: string; right: string[] };

export const ALPHABET = ["a", "b"];
// Raiz da gramática na FNC: a raiz original S é anulável, então o algoritmo cria S0 → S | ε.
export const START = "S0";

/** Converte "a X b b" em ["a", "X", "b", "b"]; símbolos separados por espaço porque a raiz S0 tem dois caracteres. */
function rule(left: string, right: string): Rule {
  return { left, right: right === "ε" ? [] : right.split(" ") };
}

/** Gramática construída para L₃ = { aⁿb²ⁿ | n ≥ 0 } ∪ { a²ⁿbⁿ | n ≥ 0 }, como a união do Ex. 11 da lista do professor. */
export const originalGrammar: Rule[] = [
  rule("S", "X"), rule("S", "Y"),
  rule("X", "a X b b"), rule("X", "ε"),
  rule("Y", "a a Y b"), rule("Y", "ε"),
];

/** Derivação de exemplo na gramática original, mostrada junto da construção. */
export const originalExample = "S ⇒ X ⇒ aXbb ⇒ aaXbbbb ⇒ aabbbb";

export type Step = { title: string; lines: string[]; rules: Rule[] };

/** Simplificação na ordem da receita do professor; cada passo mostra os conjuntos do algoritmo dos slides. */
export const steps: Step[] = [
  {
    title: "1) Produções vazias",
    lines: [
      "E0 = {X, Y} (têm X → ε e Y → ε)",
      "E1 = {X, Y, S} (S → X, e X ∈ E0)",
      "E2 = E1, então E = {S, X, Y}",
      "A raiz S é anulável (ε ∈ L₃): cria-se a nova raiz S0 → S | ε. Em cada regra, acrescenta-se a versão sem a variável anulável.",
    ],
    rules: [
      rule("S0", "S"), rule("S0", "ε"),
      rule("S", "X"), rule("S", "Y"),
      rule("X", "a X b b"), rule("X", "a b b"),
      rule("Y", "a a Y b"), rule("Y", "a a b"),
    ],
  },
  {
    title: "2) Produções unitárias",
    lines: [
      "N_S0 = {S0, S, X, Y}",
      "N_S = {S, X, Y},  N_X = {X},  N_Y = {Y}",
      "Cada variável recebe as regras não unitárias das variáveis do seu conjunto.",
    ],
    rules: [
      rule("S0", "a X b b"), rule("S0", "a b b"), rule("S0", "a a Y b"), rule("S0", "a a b"), rule("S0", "ε"),
      rule("S", "a X b b"), rule("S", "a b b"), rule("S", "a a Y b"), rule("S", "a a b"),
      rule("X", "a X b b"), rule("X", "a b b"),
      rule("Y", "a a Y b"), rule("Y", "a a b"),
    ],
  },
  {
    title: "3) Símbolos inúteis",
    lines: [
      "N0 = ∅",
      "N1 = {S0, S, X, Y} (todas têm regra só com terminais: abb ou aab)",
      "N2 = N1. Nenhum símbolo inútil.",
    ],
    rules: [],
  },
  {
    title: "4) Símbolos inacessíveis",
    lines: [
      "V0 = {S0}",
      "V1 = {S0, a, b, X, Y}",
      "V2 = V1. S não aparece em nenhuma forma sentencial: S é inacessível e sai.",
    ],
    rules: [
      rule("S0", "a X b b"), rule("S0", "a b b"), rule("S0", "a a Y b"), rule("S0", "a a b"), rule("S0", "ε"),
      rule("X", "a X b b"), rule("X", "a b b"),
      rule("Y", "a a Y b"), rule("Y", "a a b"),
    ],
  },
];

/**
 * Gramática final na FNC: toda produção é A → BC ou A → a; só a raiz S0 tem S0 → ε, e S0 não aparece em lado direito.
 * Nomes como no Ex. 18 da lista do professor: A → a, B → b, e uma letra nova (C a G) para cada quebra.
 */
export const cnfGrammar: Rule[] = [
  rule("S0", "A C"), rule("S0", "A D"), rule("S0", "A E"), rule("S0", "A G"), rule("S0", "ε"),
  rule("X", "A C"), rule("X", "A D"),
  rule("Y", "A E"), rule("Y", "A G"),
  rule("C", "X D"),
  rule("D", "B B"),
  rule("E", "A F"),
  rule("F", "Y B"),
  rule("G", "A B"),
  rule("A", "a"),
  rule("B", "b"),
];

/** Gramática simplificada (resultado do passo 4), ponto de partida da FNC. */
export const simplified = steps[3].rules;

const toVariable = (symbol: string) => (symbol === "a" ? "A" : symbol === "b" ? "B" : symbol);

/** Passo 5: em lado direito com 2 ou mais símbolos, a vira A e b vira B. */
export const withTerminals: Rule[] = [
  ...simplified.map((r) => (r.right.length >= 2 ? { left: r.left, right: r.right.map(toVariable) } : r)),
  rule("A", "a"), rule("B", "b"),
];

/** Passo 6: lado direito com 3 ou mais variáveis vira a primeira variável + uma variável nova que guarda o resto. */
export const splitTo: Record<string, string[]> = {
  "A X B B": ["A", "C"],
  "A B B": ["A", "D"],
  "A A Y B": ["A", "E"],
  "A A B": ["A", "G"],
};

/** Cada produção do passo 4 nas três etapas: simplificada, com A/B no lugar de a/b e quebrada em pares. */
export const cnfRows = simplified.map((r, index) => {
  const terminals = withTerminals[index];
  return { simplified: r, terminals, final: { left: r.left, right: splitTo[terminals.right.join(" ")] ?? terminals.right } };
});

/** Variáveis criadas para a FNC: a produção e o que ela gera no fim. */
export const newVariables: { rule: Rule; generates: string; why: string }[] = [
  { rule: rule("A", "a"), generates: "a", why: "fica no lugar do a" },
  { rule: rule("B", "b"), generates: "b", why: "fica no lugar do b" },
  { rule: rule("C", "X D"), generates: "X b b", why: "o resto de AXBB" },
  { rule: rule("D", "B B"), generates: "b b", why: "o resto de XBB (e de ABB)" },
  { rule: rule("E", "A F"), generates: "a Y b", why: "o resto de AAYB" },
  { rule: rule("F", "Y B"), generates: "Y b", why: "o resto de AYB" },
  { rule: rule("G", "A B"), generates: "a b", why: "o resto de AAB" },
]

/** Agrupa as produções por variável, na ordem em que aparecem: [["S", [["X"], ["Y"]]], ...]; [] é ε. */
export function groupRules(rules: Rule[]): [string, string[][]][] {
  const groups = new Map<string, string[][]>();
  for (const { left, right } of rules) groups.set(left, [...(groups.get(left) ?? []), right]);
  return [...groups];
}

/** Número da produção na lista da FNC, contando a partir de 1 (como nos slides). */
export function ruleNumber(left: string, right: string[]): number {
  return cnfGrammar.findIndex((r) => r.left === left && r.right.join(" ") === right.join(" ")) + 1;
}

export type TreeNode = { id: number; label: string; children: TreeNode[] };

/**
 * Decide se a FNC gera a sentença e devolve a árvore de derivação, ou null.
 * Usa o algoritmo CYK (só serve para gramáticas na FNC): para cada trecho da sentença,
 * do menor para o maior, anota quais variáveis o geram e com qual produção.
 */
export function parse(sentence: string, rules: Rule[] = cnfGrammar, start = START): TreeNode | null {
  const symbols = Array.from(sentence);
  const n = symbols.length;
  let nextId = 0;

  if (n === 0) {
    if (!rules.some((r) => r.left === start && r.right.length === 0)) return null;
    return { id: nextId++, label: start, children: [{ id: nextId++, label: "ε", children: [] }] };
  }

  // found[tamanho - 1][início]: variável → produção e ponto de corte que geram o trecho.
  const found: Map<string, { rule: Rule; split: number }>[][] = [];
  for (let length = 1; length <= n; length++) {
    found.push([]);
    for (let begin = 0; begin + length <= n; begin++) {
      const cell = new Map<string, { rule: Rule; split: number }>();
      for (const r of rules) {
        if (cell.has(r.left)) continue;
        if (length === 1) {
          if (r.right.length === 1 && r.right[0] === symbols[begin]) cell.set(r.left, { rule: r, split: 0 });
          continue;
        }
        if (r.right.length !== 2) continue;
        for (let split = 1; split < length; split++) {
          if (found[split - 1][begin].has(r.right[0]) && found[length - split - 1][begin + split].has(r.right[1])) {
            cell.set(r.left, { rule: r, split });
            break;
          }
        }
      }
      found[length - 1].push(cell);
    }
  }

  /** Reconstrói a subárvore de `label` para o trecho que começa em `begin` com `length` símbolos. */
  function build(label: string, length: number, begin: number): TreeNode {
    const node: TreeNode = { id: nextId++, label, children: [] };
    const { rule: r, split } = found[length - 1][begin].get(label)!;
    node.children = length === 1
      ? [{ id: nextId++, label: symbols[begin], children: [] }]
      : [build(r.right[0], split, begin), build(r.right[1], length - split, begin + split)];
    return node;
  }

  return found[n - 1][0].has(start) ? build(start, n, 0) : null;
}

export type Derivation = {
  // order[k] é o nó substituído no passo k + 1 (pré-ordem = derivação mais à esquerda).
  order: TreeNode[];
  // forms[k] é a forma sentencial depois de k passos; forms[0] = [S0].
  forms: TreeNode[][];
};

/** Lista os passos da derivação mais à esquerda a partir da árvore. */
export function leftmostDerivation(tree: TreeNode): Derivation {
  const order: TreeNode[] = [];
  (function visit(node: TreeNode) {
    if (node.children.length === 0) return;
    order.push(node);
    node.children.forEach(visit);
  })(tree);

  const forms = order.map((_, k) => frontier(tree, new Set(order.slice(0, k).map((node) => node.id))));
  forms.push(frontier(tree, new Set(order.map((node) => node.id))));
  return { order, forms };
}

/** Folhas visíveis quando só os nós de `expanded` já foram substituídos; ε some da forma sentencial. */
function frontier(node: TreeNode, expanded: Set<number>): TreeNode[] {
  if (!expanded.has(node.id)) return [node];
  return node.children.flatMap((child) => frontier(child, expanded)).filter((leaf) => leaf.label !== "ε");
}

/** Explica em uma frase por que a sentença não está em L₃. */
export function whyRejected(sentence: string): string {
  const foreign = Array.from(sentence).find((symbol) => !ALPHABET.includes(symbol));
  if (foreign) return `'${foreign}' não pertence ao alfabeto {a, b}.`;
  const match = sentence.match(/^(a*)(b*)$/);
  if (!match) return "Tem a depois de b. Em L₃ todos os a vêm antes dos b.";
  const [i, j] = [match[1].length, match[2].length];
  return `Tem ${i} a e ${j} b. Para aⁿb²ⁿ precisaria de ${2 * i} b; para a²ⁿbⁿ precisaria de ${2 * j} a.`;
}

export type FileSentence = { sentence: string; expected: boolean | null };

/**
 * Lê o arquivo de entrada no formato da lista de exercícios:
 *   Aceitar: ε, abb, aab
 *   Rejeitar: ab, abbb
 * As sentenças podem vir na mesma linha do rótulo (separadas por vírgula ou espaço) ou uma por linha abaixo dele.
 * Linhas antes de qualquer rótulo não têm resultado esperado. "ε" ou "&" representam a sentença vazia.
 */
export function parseSentenceFile(content: string): FileSentence[] {
  const sentences: FileSentence[] = [];
  let expected: boolean | null = null;
  for (const rawLine of content.split(/\r\n|\n|\r/)) {
    let line = rawLine.trim();
    const label = line.match(/^(aceitar|rejeitar)\s*:/i);
    if (label) {
      expected = label[1].toLowerCase() === "aceitar";
      line = line.slice(label[0].length);
    }
    for (const token of line.split(/[,\s]+/)) {
      if (token) sentences.push({ sentence: token === "ε" || token === "&" ? "" : token, expected });
    }
  }
  return sentences;
}

/** Mostra a sentença vazia como ε. */
export function showSentence(sentence: string): string {
  return sentence === "" ? "ε" : sentence;
}
