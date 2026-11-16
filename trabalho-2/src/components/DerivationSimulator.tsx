"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DerivationTree from "@/components/DerivationTree";
import { CnfRules } from "@/components/GrammarInfo";
import { Right, Sym } from "@/components/Sym";
import { leftmostDerivation, parse, ruleNumber, showSentence, whyRejected, type TreeNode } from "@/lib/grammar";

// O id faz duas seleções da mesma sentença na tabela serem tratadas como novos pedidos.
export type SimulationRequest = { sentence: string; id: number } | null;

const EXAMPLE = "aabbbb";
// Sentenças do enunciado, para testar com um clique.
const ACCEPT = ["ε", "abb", "aab", "aabbbb", "aaaabb", "aaaaaabbb"];
const REJECT = ["ab", "abbb", "aabbb", "aaabb", "aaab"];

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

/** Foco do programa: derivação mais à esquerda na FNC, passo a passo, com a árvore crescendo junto. */
export default function DerivationSimulator({ request }: { request: SimulationRequest }) {
  const [input, setInput] = useState(EXAMPLE);
  const [sentence, setSentence] = useState(EXAMPLE);
  const [step, setStep] = useState(0);
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

  // A linha do passo atual é sempre a última: rola só a lista (não a página) até ela.
  useEffect(() => {
    if (listBox.current) listBox.current.scrollTop = listBox.current.scrollHeight;
  }, [step]);

  // Atalho para apresentar: ← e → mudam o passo (fora do campo de texto).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowRight") move(1);
      else if (event.key === "ArrowLeft") move(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /** Recomeça a derivação com a sentença informada. */
  function start(value: string) {
    setInput(value);
    setSentence(readSentence(value));
    setStep(0);
  }

  /** Avança ou volta um passo. */
  function move(delta: number) {
    setStep((value) => Math.min(total, Math.max(0, value + delta)));
  }

  const rule = replaced && ruleNumber(replaced.label, rightOf(replaced));

  return (
    <section className="simulator" aria-labelledby="simulation-title">
      {/* Barra de entrada: sentença e exemplos do enunciado. */}
      <div className="sim-bar panel">
        <div className="sim-bar-input">
          <h2 id="simulation-title">Simulação da derivação na FNC</h2>
          <div className="sentence-form">
            <input aria-label="Sentença" type="text" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") start(input); }} placeholder="Ex.: aaaabb  (ε ou & = vazia)" autoComplete="off" spellCheck={false} />
            <button type="button" className="button button-primary" onClick={() => start(input)}>Derivar</button>
          </div>
        </div>
        <div className="examples">
          <div><span className="examples-label">Aceitar</span>{ACCEPT.map((w) => <button key={w} type="button" className={`example example-accept ${showSentence(sentence) === w ? "example-on" : ""}`} onClick={() => start(w)}>{w}</button>)}</div>
          <div><span className="examples-label">Rejeitar</span>{REJECT.map((w) => <button key={w} type="button" className={`example example-reject ${showSentence(sentence) === w ? "example-on" : ""}`} onClick={() => start(w)}>{w}</button>)}</div>
        </div>
      </div>

      {/* Palco: forma sentencial atual, explicação, árvore e controles de reprodução. */}
      <div className="sim-stage panel">
        {!derivation ? (
          <div className="stage-rejected" role="status">
            <span className="stage-icon" aria-hidden="true">✕</span>
            <p className="stage-word">{showSentence(sentence)}</p>
            <p><strong>Rejeitada.</strong> Nenhuma derivação S<sub>0</sub> ⇒* w gera essa sentença, então não há árvore.</p>
            <p className="stage-why">{whyRejected(sentence)}</p>
          </div>
        ) : (
          <>
            <div className="stage-head" aria-live="polite">
              <div className="stage-forms">
                {replaced && <><span className="stage-form stage-before"><Form form={derivation.forms[step - 1]} marked={new Set([replaced.id])} /></span><span className="stage-arrow">⇒</span></>}
                <span className="stage-form"><Form form={derivation.forms[step]} marked={fresh} /></span>
                {finished && <span className="stage-ok">✓ aceita</span>}
              </div>
              <p className="stage-text">
                {!replaced ? <>A derivação começa pela raiz S<sub>0</sub>. Em cada passo, a variável mais à esquerda é trocada pelo lado direito de uma produção.</> : (
                  <>Variável mais à esquerda: <span className="chip chip-marked"><Sym label={replaced.label} /></span>. Produção <span className="chip chip-rule">({rule}) <Sym label={replaced.label} /> → <Right symbols={rightOf(replaced)} /></span>{" "}
                  {rightOf(replaced).length === 0 ? <>: ela some (vira ε).</> : rightOf(replaced).length === 1 ? <>: vira o terminal <span className="chip chip-terminal">{rightOf(replaced)[0]}</span>.</> : <>: sai <Sym label={replaced.label} />, entram <span className="chip chip-marked"><Right symbols={rightOf(replaced)} /></span>.</>}
                  {finished && <> Só restam terminais: <strong>{showSentence(sentence)}</strong> foi gerada em {total} {total === 1 ? "passo" : "passos"}.</>}</>
                )}
              </p>
            </div>

            <div className="stage-tree">
              <DerivationTree tree={tree!} derivation={derivation} step={step} />
              <div className="legend-row"><span><i className="dot dot-variable" /> variável</span><span><i className="dot dot-terminal" /> terminal</span><span><i className="dot dot-marked" /> trocado neste passo</span></div>
            </div>

            <div className="stepper">
              <button type="button" className="button button-text" disabled={step === 0} onClick={() => setStep(0)}>Reiniciar</button>
              <div className="stepper-main">
                <button type="button" className="button button-secondary stepper-button" disabled={step === 0} onClick={() => move(-1)} title="Atalho: ←">← Voltar</button>
                <span className="step-count">Passo <strong>{step}</strong> de {total}</span>
                <button type="button" className="button button-primary stepper-button" disabled={finished} onClick={() => move(1)} title="Atalho: →">Avançar →</button>
              </div>
              <span className="stepper-hint">ou use ← → no teclado</span>
            </div>
          </>
        )}
      </div>

      {/* Lateral: gramática usada (produção do passo em destaque) e a lista de passos. */}
      <aside className="sim-aside">
        <div className="panel">
          <h3 className="panel-title">Gramática na FNC</h3>
          <CnfRules active={rule} />
        </div>
        <div className="panel sim-steps">
          <h3 className="panel-title">Derivação mais à esquerda</h3>
          <div ref={listBox} className="derivation-scroll">
            {!derivation ? <p className="steps-empty">Sem derivação para uma sentença rejeitada.</p> : (
              <ol className="step-list">
                {derivation.forms.slice(0, step + 1).map((form, index) => {
                  const node = derivation.order[index - 1];
                  return (
                    <li key={index} className={index === step ? "step-current" : ""}>
                      <span className="step-index">{index}</span>
                      <span className="step-form">{index > 0 && <span className="step-arrow">⇒ </span>}<Form form={form} marked={new Set(node?.children.map((child) => child.id))} /></span>
                      <span className="step-rule">{node ? <>({ruleNumber(node.label, rightOf(node))}) <Sym label={node.label} /> → <Right symbols={rightOf(node)} /></> : "raiz"}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </aside>
    </section>
  );
}
