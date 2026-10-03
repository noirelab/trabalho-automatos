"use client";

import { useState } from "react";
import { explainRegexReading, testRegex, type RegexReadingStep } from "@/lib/automaton";

// Os três trechos destacados formam a expressão ab*c*.
const parts: RegexReadingStep["part"][] = ["a", "b*", "c*"];

/** Mostra o resultado real da regex e uma leitura didática passo a passo. */
export default function RegexTester() {
  const [input, setInput] = useState("");
  const [testedSentence, setTestedSentence] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // O resultado é calculado ao testar; currentStep move só a explicação visual.
  const steps = testedSentence === null ? [] : explainRegexReading(testedSentence);
  const lastStep = currentStep > 0 ? steps[currentStep - 1] : null;
  const activePart = testedSentence === null ? null : lastStep?.part ?? "a";
  const highlightedIndex = currentStep === 0 ? 0 : currentStep - 1;
  const finished = testedSentence !== null && currentStep === steps.length;

  /** Testa a sentença inteira e reinicia a explicação no primeiro passo. */
  function test() {
    setTestedSentence(input);
    setAccepted(testRegex(input));
    setCurrentStep(0);
  }

  /** Limpa o resultado antigo para não atribuí-lo à nova entrada. */
  function editInput(value: string) {
    setInput(value);
    setTestedSentence(null);
    setAccepted(null);
    setCurrentStep(0);
  }

  return (
    <section className="card regex-card" aria-labelledby="regex-title">
      <div className="regex-intro">
        <span className="eyebrow">03 / OUTRA REPRESENTAÇÃO</span>
        <h2 id="regex-title">Teste pela Expressão Regular</h2>
        <div className="regex-display" aria-label="Expressão regular a b estrela c estrela">
          {parts.map((part) => <span key={part} className={`regex-token ${activePart === part ? "regex-token-active" : ""} ${activePart === part && lastStep?.valid === false ? "regex-token-error" : ""}`}>{part}</span>)}
        </div>
        <p><strong>a</strong> seguido de zero ou mais <strong>b</strong> e depois zero ou mais <strong>c</strong>.</p>
      </div>

      <div className="regex-form">
        <label className="field-label" htmlFor="regex-input">Digite uma sentença</label>
        <div className="field-with-button">
          <input id="regex-input" type="text" value={input} onChange={(event) => editInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") test(); }} placeholder="Ex.: abbc" autoComplete="off" spellCheck={false} />
          <button type="button" className="button button-primary" onClick={test}>Testar expressão</button>
        </div>
        {accepted !== null && <div className={`inline-result ${accepted ? "inline-accepted" : "inline-rejected"}`} role="status">{accepted ? "✓ A expressão regular aceita esta sentença." : "✕ A expressão regular rejeita esta sentença."}</div>}
        <small className="regex-source">Regex utilizada: <code>/^ab*c*$/</code></small>
      </div>

      {testedSentence !== null && (
        <div className="regex-reading">
          <div className="regex-reading-heading"><strong>Leitura da expressão</strong><span>Passo {currentStep} de {steps.length}</span></div>
          <div className="regex-sentence" aria-label="Sentença analisada">
            {testedSentence.length === 0 ? <span className="empty-hint">ε (sentença vazia)</span> : Array.from(testedSentence).map((symbol, index) => (
              <span key={index} className={`character ${index < highlightedIndex ? "character-read" : ""} ${index === highlightedIndex ? "character-current" : ""} ${index === highlightedIndex && lastStep?.valid === false ? "regex-character-error" : ""}`}>
                {symbol === " " ? "espaço" : symbol}
              </span>
            ))}
          </div>
          <p className={`regex-explanation ${lastStep?.valid === false ? "regex-explanation-error" : ""}`}>
            {testedSentence.length === 0 ? "A sentença vazia não contém o a obrigatório." : lastStep?.explanation ?? "A expressão começa exigindo o símbolo a."}
          </p>
          <div className="regex-reading-controls">
            <button type="button" className="button button-secondary" disabled={currentStep === 0} onClick={() => setCurrentStep((step) => step - 1)}>Passo anterior</button>
            <button type="button" className="button button-secondary" disabled={finished} onClick={() => setCurrentStep((step) => step + 1)}>Próximo passo</button>
          </div>
          <small className="regex-reading-note">Os passos ilustram o padrão. A aceitação final é calculada pela expressão regular.</small>
        </div>
      )}
    </section>
  );
}
