import { Fragment } from "react";
import { groupRules, type Rule } from "@/lib/grammar";

/** Mostra um símbolo como nos slides: S0 vira S com índice 0. */
export function Sym({ label }: { label: string }) {
  const match = label.match(/^([A-Z])([a-z0-9]+)$/);
  return match ? <>{match[1]}<sub>{match[2]}</sub></> : <>{label}</>;
}

/** Texto corrido com índices: E0, S0 e N_S0 viram E₀, S₀ e N com índice S₀. */
export function Indexed({ text }: { text: string }) {
  const parts = text.split(/(N_(?:S0|S|X|Y)|\b[A-Z][0-9]+\b)/);
  return <>{parts.map((part, index) => {
    if (index % 2 === 0) return part;
    if (part.startsWith("N_")) return <Fragment key={index}>N<sub><Sym label={part.slice(2)} /></sub></Fragment>;
    return <Sym key={index} label={part} />;
  })}</>;
}

/** Lado direito de uma produção ou forma sentencial, sem espaços como nos slides (AXBB); lista vazia é ε. */
export function Right({ symbols }: { symbols: string[] }) {
  if (symbols.length === 0) return <>ε</>;
  return <>{symbols.map((symbol, index) => <Sym key={index} label={symbol} />)}</>;
}

/** Derivação colorida como no simulador: variáveis em azul, terminais em verde. */
export function Derivation({ forms }: { forms: string[][] }) {
  return <>{forms.map((form, index) => (
    <span key={index} className="derivation-step">{index > 0 && " ⇒ "}{form.length === 0 ? "ε" : form.map((symbol, k) => <span key={k} className={/^[A-Z]/.test(symbol) ? "c-var" : "c-term"}><Sym label={symbol} /></span>)}</span>
  ))}</>;
}

const key = (left: string, right: string[]) => `${left}→${right.join(" ")}`;

/**
 * Produções agrupadas por variável: S → X | Y.
 * Com `previous`, marca em verde as produções novas e lista riscadas as que saíram, para mostrar o que o passo mudou.
 */
export function Rules({ rules, previous }: { rules: Rule[]; previous?: Rule[] }) {
  const before = new Set(previous?.map((r) => key(r.left, r.right)));
  const now = new Set(rules.map((r) => key(r.left, r.right)));
  const removed = previous?.filter((r) => !now.has(key(r.left, r.right))) ?? [];
  return (
    <>
      <ul className="rule-list">
        {groupRules(rules).map(([left, alternatives]) => (
          <li key={left}>
            <span className="rule-left"><Sym label={left} /></span> → {alternatives.map((right, index) => (
              <Fragment key={index}>{index > 0 && " | "}<span className={previous && !before.has(key(left, right)) ? "rule-added" : ""}><Right symbols={right} /></span></Fragment>
            ))}
          </li>
        ))}
      </ul>
      {removed.length > 0 && (
        <p className="rule-removed">Saíram: {removed.map((r, index) => <Fragment key={index}>{index > 0 && ", "}<s><Sym label={r.left} /> → <Right symbols={r.right} /></s></Fragment>)}</p>
      )}
    </>
  );
}
