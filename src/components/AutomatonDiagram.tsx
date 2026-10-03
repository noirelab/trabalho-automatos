"use client";

import { useEffect, useState } from "react";
import type { SimulationStep, State } from "@/lib/automaton";

/** Recebe o estado lógico e o passo ativo; stepId distingue visitas repetidas ao mesmo passo. */
type Props = {
  currentState: State;
  activeStep: SimulationStep | null;
  stepId: number;
};

// O estado D existe na lógica, mas foi omitido do desenho para destacar A, B e C.
type VisibleState = Exclude<State, "D">;

// Coordenadas fixas mantêm o SVG manual simples de explicar.
const positions: Record<VisibleState, { x: number; y: number }> = {
  A: { x: 145, y: 132 },
  B: { x: 430, y: 132 },
  C: { x: 715, y: 132 },
};

// Cada path é uma seta; os laços de B e C são curvas SVG.
const edges: { from: VisibleState; to: VisibleState; label: string; path: string; x: number; y: number; symbols: string[] }[] = [
  { from: "A", to: "B", label: "a", path: "M 186 132 L 385 132", x: 286, y: 111, symbols: ["a"] },
  { from: "B", to: "C", label: "c", path: "M 471 132 L 670 132", x: 572, y: 111, symbols: ["c"] },
  { from: "B", to: "B", label: "b", path: "M 409 97 C 357 24 503 24 451 97", x: 430, y: 34, symbols: ["b"] },
  { from: "C", to: "C", label: "c", path: "M 694 97 C 642 24 788 24 736 97", x: 715, y: 34, symbols: ["c"] },
];

/** Desenha as transições e destaca a chegada somente depois do fim da seta. */
export default function AutomatonDiagram({ currentState, activeStep, stepId }: Props) {
  const [completedStepId, setCompletedStepId] = useState(-1);
  const arrived = activeStep !== null && completedStepId === stepId;
  // Enquanto a seta é desenhada, o destaque permanece no estado de origem.
  const visualState = activeStep && activeStep.to !== "D" && !arrived ? activeStep.from : currentState;

  // Sem animação, não haverá animationend; marcamos a chegada imediatamente.
  useEffect(() => {
    if (!activeStep || activeStep.to === "D") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCompletedStepId(stepId);
    }
  }, [activeStep, stepId]);

  return (
    <div className="diagram-frame">
      <svg className="automaton-svg" viewBox="0 0 860 215" role="img" aria-label="Diagrama simplificado do AFD: A inicial, B e C finais. Transições para D não desenhadas.">
        <defs>
          <marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 9 4.5 L 0 9 z" fill="#6681a5" />
          </marker>
          <marker id="arrow-active" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 9 4.5 L 0 9 z" fill="#2d5db3" />
          </marker>
        </defs>

        <path d="M 48 132 L 98 132" className="initial-arrow" markerEnd="url(#arrow)" />
        <text x="53" y="108" className="svg-caption">início</text>

        {edges.map((edge) => {
          // Só a seta que corresponde ao passo atual recebe o traço animado.
          const active = activeStep?.from === edge.from && activeStep.to === edge.to && edge.symbols.includes(activeStep.symbol);
          return (
            <g key={`${edge.from}-${edge.to}`} className={active ? "edge edge-active" : "edge"}>
              <path d={edge.path} markerEnd="url(#arrow)" />
              {active && activeStep && <path key={stepId} d={edge.path} pathLength={100} className="edge-trace" markerEnd="url(#arrow-active)" onAnimationEnd={() => setCompletedStepId(stepId)} />}
              <text x={edge.x} y={edge.y} textAnchor="middle">{edge.label}</text>
            </g>
          );
        })}

        {(Object.keys(positions) as VisibleState[]).map((state) => {
          const { x, y } = positions[state];
          const active = visualState === state;
          const final = state === "B" || state === "C";
          return (
            <g key={state} className={`state ${active ? "state-current" : ""}`}>
              <circle cx={x} cy={y} r="49" className="state-halo" />
              {active && arrived && activeStep && <circle key={stepId} cx={x} cy={y} r="49" className="state-pulse-ring" />}
              <circle cx={x} cy={y} r="41" className="state-circle" />
              {final && <circle cx={x} cy={y} r="34" className="state-inner" />}
              <text x={x} y={y + 7} textAnchor="middle" className="state-letter">{state}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
