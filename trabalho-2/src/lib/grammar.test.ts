import { test } from "node:test";
import assert from "node:assert/strict";
import { cnfGrammar, cnfRows, leftmostDerivation, newVariables, originalGrammar, parse, parseSentenceFile, START, steps, whyRejected, withTerminals, type Rule } from "./grammar.ts";

const MAX = 10;

/** Definição direta de L₃ = { aⁿb²ⁿ } ∪ { a²ⁿbⁿ }. */
function inL3(w: string): boolean {
  const m = w.match(/^(a*)(b*)$/);
  if (!m) return false;
  const [i, j] = [m[1].length, m[2].length];
  return j === 2 * i || i === 2 * j;
}

/** Todas as cadeias sobre {a, b} com até `max` símbolos. */
function allStrings(max: number): string[] {
  const out = [""];
  for (let k = 0; k < out.length; k++) if (out[k].length < max) out.push(out[k] + "a", out[k] + "b");
  return out;
}

/** Sentenças geradas pela gramática (raiz = lado esquerdo da primeira regra) com até `max` terminais, por busca em largura. */
function generate(rules: Rule[], max: number): Set<string> {
  const isVar = (s: string) => /^[A-Z]/.test(s);
  const words = new Set<string>();
  const seen = new Set<string>();
  const queue: string[][] = [[rules[0].left]];
  while (queue.length) {
    const form = queue.shift()!;
    const i = form.findIndex(isVar);
    if (i < 0) { words.add(form.join("")); continue; }
    for (const r of rules.filter((r) => r.left === form[i])) {
      const next = [...form.slice(0, i), ...r.right, ...form.slice(i + 1)];
      const key = next.join(" ");
      if (next.filter((s) => !isVar(s)).length > max || next.length > 2 * max + 2 || seen.has(key)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return words;
}

const expected = new Set(allStrings(MAX).filter(inL3));

test("a gramática original, cada passo e a FNC geram L₃", () => {
  for (const rules of [originalGrammar, ...steps.filter((s) => s.rules.length).map((s) => s.rules), withTerminals, cnfGrammar]) {
    assert.deepEqual(generate(rules, MAX), expected);
  }
});

test("a gramática está na FNC", () => {
  for (const { left, right } of cnfGrammar) {
    const ok = right.length === 2 ? right.every((s) => /^[A-Z]/.test(s) && s !== START)
      : right.length === 1 ? /^[a-z]$/.test(right[0])
      : left === START;
    assert.ok(ok, `${left} → ${right.join(" ")}`);
  }
});

test("as tabelas da FNC batem com a gramática final", () => {
  const key = (r: Rule) => `${r.left} → ${r.right.join(" ")}`;
  const shown = [...cnfRows.map((row) => key(row.final)), ...newVariables.map((v) => key(v.rule))];
  assert.deepEqual(new Set(shown), new Set(cnfGrammar.map(key)));
});

test("o simulador aceita exatamente L₃ e a árvore gera a sentença", () => {
  for (const w of allStrings(MAX)) {
    const tree = parse(w);
    assert.equal(tree !== null, inL3(w), w);
    if (!tree) continue;
    const { forms } = leftmostDerivation(tree);
    assert.equal(forms.at(-1)!.map((n) => n.label).join(""), w);
  }
});

test("exemplos da lista de exercícios", () => {
  for (const w of ["", "abb", "aab", "aabbbb", "aaaabb", "aaaaaabbb"]) assert.ok(parse(w), w);
  for (const w of ["ab", "abbb", "aabbb", "aaabb", "aaab", "abc"]) assert.equal(parse(w), null, w);
  assert.equal(whyRejected("aabbb"), "Tem 2 a e 3 b. Para aⁿb²ⁿ precisaria de 4 b; para a²ⁿbⁿ precisaria de 6 a.");
});

test("leitura do arquivo de entrada", () => {
  assert.deepEqual(parseSentenceFile("Aceitar: ε, abb\nRejeitar:\nab\n\n  aaab  \n"), [
    { sentence: "", expected: true },
    { sentence: "abb", expected: true },
    { sentence: "ab", expected: false },
    { sentence: "aaab", expected: false },
  ]);
  assert.deepEqual(parseSentenceFile("abb\r\n&"), [{ sentence: "abb", expected: null }, { sentence: "", expected: null }]);
});
