import { Derivation, Indexed, Right, Rules, Sym } from "@/components/Sym";
import { cnfGrammar, cnfRows, leftmostDerivation, newVariables, originalExample, originalGrammar, parse, ruleNumber, steps, type Rule } from "@/lib/grammar";

/** Um passo da resolução: título, conjuntos calculados e a gramática resultante. */
function StepBox({ step, previous }: { step: (typeof steps)[number]; previous: Rule[] }) {
  return (
    <div className="step">
      <h3>{step.title}</h3>
      {step.lines.map((line) => <p key={line} className={/^(\S+ =|.*⇒)/.test(line) ? "set-line" : ""}><Indexed text={line} /></p>)}
      {step.rules.length > 0 ? <Rules rules={step.rules} previous={previous} /> : <p className="rule-same">A gramática não muda neste passo.</p>}
    </div>
  );
}

// Conferência da FNC, gerada pelo próprio simulador para não divergir da gramática.
const check = leftmostDerivation(parse("aabbbb")!);

/** Uma produção em uma linha: X → AC. */
function Production({ rule }: { rule: Rule }) {
  return <><Sym label={rule.left} /> → <Right symbols={rule.right} /></>;
}

/** Gramática na FNC com o número de cada produção; `active` destaca a produção usada no passo atual. */
export function CnfRules({ active }: { active?: number }) {
  return (
    <ul className="rule-list">{[...new Set(cnfGrammar.map((r) => r.left))].map((left) => (
      <li key={left}><span className="rule-left"><Sym label={left} /></span> → {cnfGrammar.filter((r) => r.left === left).map((r, index) => {
        const number = ruleNumber(r.left, r.right);
        return <span key={index}>{index > 0 && " | "}<span className={number === active ? "rule-active" : "rule-option"}><Right symbols={r.right} /> <span className="rule-number">({number})</span></span></span>;
      })}</li>
    ))}</ul>
  );
}

/** Resultados da resolução (construção, simplificação, FNC), recolhidos: o foco da página é a simulação. */
export default function GrammarInfo() {
  return (
    <details className="card resolution">
      <summary>Resolução da gramática: construção, simplificação e FNC</summary>
      <section aria-labelledby="build-title">
        <h2 id="build-title">Construção da GLC</h2>
        <p>L₃ é uma união, então fazemos uma gramática para cada parte e juntamos com S → X | Y. X põe dois b para cada a; Y põe dois a para cada b.</p>
        <div className="two-columns">
          <div>
            <p className="formal">G = ({"{S, X, Y}"}, {"{a, b}"}, P, S)</p>
            <Rules rules={originalGrammar} />
          </div>
          <div>
            <p className="label">Exemplo: aabbbb</p>
            <p className="derivation-line"><Derivation forms={originalExample.split(" ⇒ ").map((form) => Array.from(form))} /></p>
          </div>
        </div>
      </section>

      <section aria-labelledby="simplify-title">
        <h2 id="simplify-title">Simplificação</h2>
        <p>Ordem da receita do professor: vazias, unitárias, inúteis, inacessíveis. Nessa ordem, um passo não estraga o anterior.</p>
        <p className="legend"><span className="rule-added">verde</span> = produção nova no passo · <s>riscado</s> = produção que saiu</p>
        <div className="steps">{steps.map((step, index) => <StepBox key={step.title} step={step} previous={steps.slice(0, index).reverse().find((s) => s.rules.length)?.rules ?? originalGrammar} />)}</div>
      </section>

      <section aria-labelledby="cnf-title">
        <h2 id="cnf-title">Forma Normal de Chomsky</h2>
        <p>Na FNC cada produção troca uma variável por exatamente duas variáveis (como C → XD) ou por um terminal (como A → a). Só a raiz pode ter S<sub>0</sub> → ε. Os nomes seguem o Ex. 18 da lista do professor.</p>
        <h3>Cada produção, do passo 4 até a FNC</h3>
        <div className="table-scroll">
          <table className="cnf-table">
            <thead><tr><th>Depois da simplificação</th><th>5) a vira A, b vira B</th><th>6) Quebra em pares</th></tr></thead>
            <tbody>{cnfRows.map((row) => (
              <tr key={`${row.simplified.left}${row.simplified.right.join("")}`}>
                <td><Production rule={row.simplified} /></td>
                <td>{row.terminals === row.simplified ? <span className="same">já está na FNC</span> : <Production rule={row.terminals} />}</td>
                <td><Production rule={row.final} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p className="hint">Passo 5: terminal só pode aparecer sozinho, então dentro de um lado direito longo o a vira A (com A → a) e o b vira B (com B → b). Passo 6: com 3 ou mais variáveis, fica a primeira e uma letra nova guarda o resto. Exemplo: AXBB vira AC, com C → XD e D → BB.</p>

        <h3>Variáveis novas</h3>
        <div className="table-scroll">
          <table className="cnf-table">
            <thead><tr><th>Produção</th><th>No fim gera</th><th>Para quê</th></tr></thead>
            <tbody>{newVariables.map((v) => (
              <tr key={v.rule.left}><td><Production rule={v.rule} /></td><td><Right symbols={v.generates.split(" ")} /></td><td className="plain"><Indexed text={v.why} /></td></tr>
            ))}</tbody>
          </table>
        </div>

        <div className="two-columns cnf-final">
          <div>
            <h3>Gramática na FNC</h3>
            <p className="hint">Número de cada produção entre parênteses; o simulador usa esses números.</p>
            <CnfRules />
          </div>
          <div>
            <h3>Conferência: derivando aabbbb</h3>
            <ol className="check-list">{check.forms.map((form, index) => (
              <li key={index}><span>{index === 0 ? "" : "⇒ "}<Derivation forms={[form.map((node) => node.label)]} /></span>{index > 0 && <span className="rule-number">({ruleNumber(check.order[index - 1].label, check.order[index - 1].children.map((child) => child.label))})</span>}</li>
            ))}<li className="check-ok">✓ chegou em aabbbb</li></ol>
          </div>
        </div>
      </section>
    </details>
  );
}
