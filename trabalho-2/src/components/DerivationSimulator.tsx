"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DerivationTree from "@/components/DerivationTree";
import { Right, Sym } from "@/components/Sym";
import { leftmostDerivation, parse, ruleNumber, showSentence, whyRejected, type TreeNode } from "@/lib/grammar";

// O id faz duas seleções da mesma sentença na tabela serem tratadas como novos pedidos.
export type SimulationRequest = { sentence: string; id: number } | null;

const EXAMPLE = "aabbbb";

/** Lê a sentença digitada; ε ou & é a sentença vazia. */
function readSentence(value: string): string {
  const trimmed = value.trim();
  return trimmed === "ε" || trimmed === "&" ? "" : trimmed;
}

/** Forma sentencial colorida: variáveis em azul, terminais em verde e, em laranja, os símbolos de `marked`. */
function Form({ form, marked }: { form: TreeNode[]; marked: Set<number> }) {
  if (form.length === 0) return <span className="form-symbol">ε</span>;
  return <>{form.map((node) => (
    <span key={node.id} className={`form-symbol ${node.children.length ? "form-variable" : "form-terminal"} ${marked.has(node.id) ? "form-marked" : ""}`}><Sym label={node.label} /></span>
  ))}</>;
}

/** Lado direito da produção usada no nó (ε quando o filho é ε). */
const rightOf = (node: TreeNode) => node.children.map((child) => child.label).filter((label) => label !== "ε");

/** Seção 4: derivação mais à esquerda na FNC, passo a passo, com a árvore crescendo junto. */
export default function DerivationSimulator({ request }: { request: SimulationRequest }) {
  const [input, setInput] = useState(EXAMPLE);
  const [sentence, setSentence] = useState(EXAMPLE);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const listBox = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => parse(sentence), [sentence]);
  const derivation = useMemo(() => (tree ? leftmostDerivation(tree) : null), [tree]);
  const total = derivation?.order.length ?? 0;
  const finished = step === total;
  const replaced = derivation?.order[step - 1];
  const fresh = new Set(replaced?.children.map((child) => child.id));

  // Quando a tabela do arquivo escolhe uma sentença, ela começa no passo zero.
  useEffect(() => {
    if (request) start(request.sentence);
  }, [request]);

  // Agenda só o próximo passo; a mudança de step agenda o seguinte.
  useEffect(() => {
    if (!playing) return;
    if (step >= total) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStep((value) => value + 1), 900);
    return () => window.clearTimeout(timer);
  }, [playing, step, total]);

  // A linha do passo atual é sempre a última: rola só a lista (não a página) até ela.
  useEffect(() => {
    if (listBox.current) listBox.current.scrollTop = listBox.current.scrollHeight;
  }, [step]);

  /** Recomeça a derivação com a sentença informada. */
  function start(value: string) {
    setInput(value);
    setSentence(readSentence(value));
    setStep(0);
    setPlaying(false);
  }

  /** Avança ou volta um passo e pausa a reprodução. */
  function move(delta: number) {
    setPlaying(false);
    setStep((value) => Math.min(total, Math.max(0, value + delta)));
  }

  return (
    <section className="card" aria-labelledby="simulation-title">
      <h2 id="simulation-title"><span className="section-number">4</span> Simulação da derivação na FNC</h2>
      <p>Digite uma sentença e clique em Derivar. Cada passo troca a variável mais à esquerda por uma produção da FNC (o número entre parênteses é o da lista acima). Use ε ou & para a sentença vazia.</p>

      <div className="sentence-form">
        <input aria-label="Sentença" type="text" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") start(input); }} placeholder="Ex.: aaaabb" autoComplete="off" spellCheck={false} />
        <button type="button" className="button button-primary" onClick={() => start(input)}>Derivar</button>
      </div>

      {!derivation ? (
        <div className="result-banner result-rejected" role="status">
          <span aria-hidden="true">✕</span>
          <div><strong>“{showSentence(sentence)}” é rejeitada.</strong> Nenhuma derivação S<sub>0</sub> ⇒* w gera essa sentença, então não há árvore. {whyRejected(sentence)}</div>
        </div>
      ) : (
        <>
          <div className="controls">
            <button type="button" className="button button-secondary" disabled={step === 0} onClick={() => move(-1)}>← Voltar</button>
            <button type="button" className="button button-secondary" disabled={finished} onClick={() => move(1)}>Avançar →</button>
            <button type="button" className="button button-secondary" disabled={finished && !playing} onClick={() => setPlaying((value) => !value)}>{playing ? "Pausar" : "Reproduzir"}</button>
            <button type="button" className="button button-text" disabled={step === 0} onClick={() => { setPlaying(false); setStep(0); }}>Reiniciar</button>
            <span className="step-count">Passo {step} de {total}</span>
          </div>

          <div className="explain" aria-live="polite">
            {!replaced ? (
              <p><strong>Início.</strong> A derivação começa pela raiz S<sub>0</sub>. Em cada passo, a variável mais à esquerda é trocada pelo lado direito de uma produção. Clique em Avançar.</p>
            ) : (
              <p>
                <strong>Passo {step}.</strong> A variável mais à esquerda é <span className="chip chip-marked"><Sym label={replaced.label} /></span>. Usamos a produção ({ruleNumber(replaced.label, rightOf(replaced))}) <Sym label={replaced.label} /> → <Right symbols={rightOf(replaced)} />:{" "}
                {rightOf(replaced).length === 0 ? <>ela some (vira ε).</> : rightOf(replaced).length === 1 ? <>ela vira o terminal <span className="chip chip-terminal">{rightOf(replaced)[0]}</span>.</> : <>ela sai e entram <span className="chip chip-marked"><Right symbols={rightOf(replaced)} /></span>.</>}
                {finished && <> Não sobrou nenhuma variável: a sentença foi gerada.</>}
              </p>
            )}
            <div className="before-after">
              {replaced && <><span className="form-line"><Form form={derivation.forms[step - 1]} marked={new Set([replaced.id])} /></span><span className="arrow">⇒</span></>}
              <span className="form-line form-now"><Form form={derivation.forms[step]} marked={fresh} /></span>
            </div>
          </div>

          <div className="simulation-grid">
            <div>
              <h3>Árvore de derivação</h3>
              <DerivationTree tree={tree!} derivation={derivation} step={step} />
              <div className="legend legend-row"><span><i className="dot dot-variable" /> variável</span><span><i className="dot dot-terminal" /> terminal</span><span><i className="dot dot-marked" /> trocado neste passo</span></div>
            </div>
            <div>
              <h3>Derivação mais à esquerda</h3>
              <div ref={listBox} className="table-scroll derivation-scroll">
                <table className="derivation-table">
                  <thead><tr><th>Passo</th><th>Produção</th><th>Forma sentencial</th></tr></thead>
                  <tbody>
                    {derivation.forms.slice(0, step + 1).map((form, index) => {
                      const node = derivation.order[index - 1];
                      return (
                        <tr key={index} className={index === step ? "row-current" : ""}>
                          <td>{index}</td>
                          <td>{node ? <><Sym label={node.label} /> → <Right symbols={rightOf(node)} /> <span className="rule-number">({ruleNumber(node.label, rightOf(node))})</span></> : "início"}</td>
                          <td className="form">{index > 0 && "⇒ "}<Form form={form} marked={new Set(node?.children.map((child) => child.id))} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {finished && <div className="result-banner result-accepted" role="status"><span aria-hidden="true">✓</span><div><strong>“{showSentence(sentence)}” é aceita.</strong> Chegamos à sentença só com terminais em {total} {total === 1 ? "passo" : "passos"}.</div></div>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
