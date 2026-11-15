"use client";

import { useCallback, useRef, useState } from "react";
import AutomatonDiagram from "@/components/AutomatonDiagram";
import StepSimulator, { type SimulationRequest } from "@/components/StepSimulator";
import RegexTester from "@/components/RegexTester";
import FileTester from "@/components/FileTester";
import AutomatonInfo from "@/components/AutomatonInfo";
import { describeTransition, type SimulationStep, type State } from "@/lib/automaton";

/** Reúne os cards da página e sincroniza o simulador com o diagrama. */
export default function Home() {
  // O estado do diagrama fica aqui porque StepSimulator e AutomatonDiagram são irmãos.
  const [diagramStep, setDiagramStep] = useState<{ state: State; step: SimulationStep | null; id: number }>({ state: "A", step: null, id: 0 });
  // Uma nova requisição é criada quando o usuário escolhe uma linha da tabela.
  const [request, setRequest] = useState<SimulationRequest>(null);
  const simulatorRef = useRef<HTMLDivElement>(null);

  /** Recebe o passo lógico do simulador e inicia uma nova visita visual à transição. */
  const handleStepChange = useCallback((state: State, step: SimulationStep | null) => {
    // Cada visita a um passo recebe um id novo, inclusive ao voltar e avançar de novo.
    setDiagramStep((previous) => ({ state, step, id: previous.id + 1 }));
  }, []);

  const currentState = diagramStep.state;
  const activeStep = diagramStep.step;

  /** Carrega uma sentença da tabela e leva a tela até a área de simulação. */
  function selectSentence(sentence: string) {
    setRequest((previous) => ({ sentence, id: (previous?.id ?? 0) + 1 }));
    simulatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }


  return (
    <main className="page-shell">
      <header className="page-heading">
        <span>LINGUAGENS REGULARES · EXERCÍCIO 06</span>
        <h1>Simulador de Autômato: Exercício 6</h1>
        <p>Conversão de AFND-ε para AFD e reconhecimento de sentenças</p>
      </header>

      <div ref={simulatorRef} className="interaction-grid">
        <section className="card diagram-card" aria-labelledby="afd-title">
          <div className="section-heading"><div><span className="eyebrow">01 / VISUALIZAÇÃO</span><h2 id="afd-title">AFD equivalente</h2><p>Percurso principal: A, B e C. As demais transições aparecem na tabela abaixo.</p></div></div>
          <AutomatonDiagram currentState={currentState} activeStep={activeStep} stepId={diagramStep.id} />
          <div className="diagram-legend"><span><i className="legend-dot legend-current" /> Estado atual</span><span><i className="legend-dot legend-final" /> Estado final</span></div>
          <div className={`diagram-status ${currentState === "D" ? "diagram-status-dead" : ""}`} aria-live="polite"><span>PASSO NO DIAGRAMA</span><strong>{describeTransition(activeStep)}</strong></div>
        </section>
        <StepSimulator request={request} onStepChange={handleStepChange} />
      </div>

      <RegexTester />

      <FileTester onSelectSentence={selectSentence} />
      <AutomatonInfo />
      <footer className="page-footer"><span>EXERCÍCIO 06 · LINGUAGENS REGULARES</span><span>AFND-ε → AFD → ab*c*</span></footer>
    </main>
  );
}
