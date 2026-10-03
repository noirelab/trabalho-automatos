"use client";

import { useEffect, useState } from "react";
import { describeTransition, isAlphabetSymbol, simulateSentence, type SimulationResult, type SimulationStep, type State } from "@/lib/automaton";

// O id faz duas seleções da mesma sentença na tabela serem tratadas como novos pedidos.
export type SimulationRequest = { sentence: string; id: number } | null;

type Props = {
  request: SimulationRequest;
  onStepChange: (state: State, step: SimulationStep | null) => void;
};

/** Controla a sentença, o avanço manual ou automático e o histórico do AFD. */
export default function StepSimulator({ request, onStepChange }: Props) {
  const [input, setInput] = useState("abbc");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Prepara o exemplo depois da hidratação, evitando diferença entre servidor e navegador.
  useEffect(() => {
    setResult(simulateSentence("abbc"));
    setHydrated(true);
  }, []);

  // Quando FileTester solicita uma sentença, inicia sua leitura no passo zero.
  useEffect(() => {
    if (!request) return;
    setInput(request.sentence);
    setResult(simulateSentence(request.sentence));
    setCurrentStep(0);
    setPlaying(false);
  }, [request]);

  // currentStep é a quantidade de caracteres consumidos, não o índice do caractere.
  const lastStep = result && currentStep > 0 ? result.steps[currentStep - 1] : null;
  const state = lastStep?.to ?? "A";
  const finished = result !== null && currentStep === result.steps.length;
  // A letra destacada gerou o último passo; no passo zero, mostra a próxima letra.
  const highlightedIndex = currentStep === 0 ? 0 : currentStep - 1;
  const invalidStep = result?.steps.find((step) => !isAlphabetSymbol(step.symbol));
  const focusedSymbol = lastStep?.symbol ?? result?.sentence[0];
  const focusedSymbolLabel = focusedSymbol === " " ? "espaço" : focusedSymbol ?? "Nenhum";

  // Mantém o SVG sincronizado com o passo que o usuário está vendo.
  useEffect(() => {
    onStepChange(state, lastStep);
  }, [state, lastStep, onStepChange]);

  // Agenda somente o próximo avanço; a mudança de currentStep agenda o seguinte.
  useEffect(() => {
    if (!playing || !result) return;
    if (currentStep >= result.steps.length) return;
    // A reprodução dá tempo para a seta terminar e o estado de chegada pulsar.
    const delay = currentStep === 0 ? 350 : 1350;
    const timer = window.setTimeout(() => {
      setCurrentStep((step) => step + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [playing, result, currentStep]);

  // A reprodução termina quando todos os símbolos já foram consumidos.
  useEffect(() => {
    if (finished && playing) setPlaying(false);
  }, [finished, playing]);

  /** Calcula os passos da sentença digitada, sem consumi-los ainda. */
  function start() {
    setPlaying(false);
    setResult(simulateSentence(input));
    setCurrentStep(0);
  }

  /** Volta ao estado inicial mantendo a sentença e seus passos calculados. */
  function reset() {
    setPlaying(false);
    setCurrentStep(0);
  }

  /** Ao editar, descarta a execução anterior até que Iniciar seja pressionado. */
  function editInput(value: string) {
    setPlaying(false);
    setInput(value);
    setResult(null);
    setCurrentStep(0);
  }

  /** Retrocede um símbolo e pausa a reprodução automática. */
  function previousStep() {
    if (!hydrated || !result || currentStep === 0) return;
    setPlaying(false);
    setCurrentStep((step) => step - 1);
  }

  /** Consome um símbolo e pausa a reprodução automática. */
  function nextStep() {
    if (!hydrated || !result || finished) return;
    setPlaying(false);
    setCurrentStep((step) => step + 1);
  }

  /** Alterna entre reprodução e pausa, respeitando início e fim da execução. */
  function togglePlayback() {
    if (!hydrated || !result || finished) return;
    setPlaying((value) => !value);
  }

  return (
    <section className="card simulator-card" aria-labelledby="simulation-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">02 / INTERAÇÃO</span>
          <h2 id="simulation-title">Execução passo a passo</h2>
          <p>Exemplo pronto: <strong>abbc</strong>. Avance ou reproduza a execução.</p>
        </div>
      </div>

      <div className="input-row">
        <label className="field-label" htmlFor="sentence-input">Digite uma sentença</label>
        <div className="field-with-button">
          <input id="sentence-input" type="text" value={input} onChange={(event) => editInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") start(); }} placeholder="Ex.: abbccc" autoComplete="off" spellCheck={false} />
          <button type="button" className="button button-primary" onClick={start}>Iniciar <span aria-hidden="true">→</span></button>
        </div>
      </div>

      <div className="sentence-strip" aria-label="Caracteres da sentença">
        <span className="strip-label">SENTENÇA EM LEITURA</span>
        <div className="character-list">
          {result === null ? <span className="empty-hint">Inicie uma execução para acompanhar os símbolos.</span> : result.sentence.length === 0 ? <span className="empty-hint">ε (sentença vazia)</span> : Array.from(result.sentence).map((character, index) => (
            <span key={index} className={`character ${index < highlightedIndex ? "character-read" : ""} ${index === highlightedIndex ? "character-current" : ""}`} title={`Símbolo ${index + 1}: ${character}`}>
              {character === " " ? "espaço" : character}
            </span>
          ))}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric"><span>Estado atual</span><strong className={state === "D" ? "text-muted" : ""}>{state}</strong></div>
        <div className="metric"><span>Símbolo da etapa</span><strong>{focusedSymbolLabel}</strong></div>
        <div className="metric"><span>Consumidos</span><strong>{currentStep} / {result?.steps.length ?? 0}</strong></div>
        <div className="metric metric-wide"><span>O que aconteceu</span><strong>{describeTransition(lastStep)}</strong></div>
      </div>

      {invalidStep && currentStep > invalidStep.index && <p className="notice notice-error">Símbolo &apos;{invalidStep.symbol}&apos; não pertence ao alfabeto {'{a, b, c}'}.</p>}
      {finished && <div className={`result-banner ${result.accepted ? "result-accepted" : "result-rejected"}`} role="status"><span aria-hidden="true">{result.accepted ? "✓" : "✕"}</span> Sentença {result.accepted ? "aceita" : "rejeitada"} pelo AFD</div>}

      <div className="simulation-controls">
        <button type="button" className="button button-secondary" disabled={hydrated && (result === null || currentStep === 0)} onClick={previousStep}>← Passo anterior</button>
        <button type="button" className="button button-secondary" disabled={hydrated && (result === null || finished)} onClick={nextStep}>Próximo passo →</button>
        <button type="button" className="button button-play" disabled={hydrated && (result === null || (finished && !playing))} onClick={togglePlayback}>{playing ? "Ⅱ Pausar" : "▶ Reproduzir"}</button>
        <button type="button" className="button button-text" onClick={reset}>Reiniciar</button>
      </div>

      <details className="history">
        <summary>Histórico de execução <span>Passo {currentStep} de {result?.steps.length ?? 0}</span></summary>
        {!result ? <p className="empty-hint">Os passos aparecerão aqui após iniciar.</p> : (
          <ol className="history-list">
            <li><span className="history-index">0</span><span><strong>Estado inicial</strong><small>A</small></span></li>
            {result.steps.slice(0, currentStep).map((step) => (
              <li key={step.index}><span className="history-index">{step.index + 1}</span><span><strong>Leu {step.symbol === " " ? "espaço" : step.symbol}</strong><small>Do estado {step.from} para {step.to}</small></span></li>
            ))}
            {finished && <li className={result.accepted ? "history-success" : "history-failure"}><span className="history-index">{result.accepted ? "✓" : "✕"}</span><span><strong>Resultado: {result.accepted ? "ACEITA" : "REJEITA"}</strong><small>Fim da sentença no estado {result.finalState}</small></span></li>}
          </ol>
        )}
      </details>
    </section>
  );
}
