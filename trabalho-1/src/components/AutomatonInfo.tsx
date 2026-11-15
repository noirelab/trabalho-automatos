import { transitions, type State, type Symbol } from "@/lib/automaton";

// Correspondência entre os conjuntos do AFND-ε e os estados do AFD.
const states: { name: State; set: string; role: string }[] = [
  { name: "A", set: "{q0, q2}", role: "Inicial" },
  { name: "B", set: "{q1, q3}", role: "Final" },
  { name: "C", set: "{q3}", role: "Final" },
  { name: "D", set: "∅", role: "Estado morto" },
];

// Dados da resolução original, exibidos para justificar a construção.
const closures = [
  ["q0", "{q0, q2}"],
  ["q1", "{q1}"],
  ["q2", "{q0, q2}"],
  ["q3", "{q3}"],
];

/** Mostra conjuntos, fechos-ε e a tabela usada pelo simulador. */
export default function AutomatonInfo() {
  return (
    <section className="card info-card" aria-labelledby="info-title">
      <span className="eyebrow">05 / FUNDAMENTAÇÃO</span>
      <h2 id="info-title">Construção do AFD</h2>
      <p>O fecho-ε reúne os estados alcançáveis sem consumir símbolos. Cada conjunto alcançado passa a ser um estado do AFD.</p>

      <div className="state-info-grid">
        {states.map((state) => <div className="state-info" key={state.name}>
          <span className={`state-pill ${state.name === "D" ? "state-pill-dead" : ""}`}>{state.name}</span>
          <span className="state-set">{state.set}</span>
          <small>{state.role}</small>
        </div>)}
      </div>

      <div className="info-columns">
        <div>
          <h3>Fechos-ε</h3>
          <ul className="closure-list">{closures.map(([state, closure]) => <li key={state}><span>ε-fecho({state})</span><strong>= {closure}</strong></li>)}</ul>
        </div>
        <div>
          <h3>Tabela de transições</h3>
          <table className="transition-table"><thead><tr><th>Estado</th><th>a</th><th>b</th><th>c</th></tr></thead><tbody>
            {(Object.keys(transitions) as State[]).map((state) => <tr key={state}><th>{state}</th>{(["a", "b", "c"] as Symbol[]).map((symbol) => <td key={symbol}>{transitions[state][symbol]}</td>)}</tr>)}
          </tbody></table>
        </div>
      </div>
    </section>
  );
}
