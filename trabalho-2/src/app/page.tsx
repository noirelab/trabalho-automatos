"use client";

import { useRef, useState } from "react";
import GrammarInfo from "@/components/GrammarInfo";
import DerivationSimulator, { type SimulationRequest } from "@/components/DerivationSimulator";
import FileTester from "@/components/FileTester";

/** Página na ordem do vídeo: construção, simplificação, FNC, simulação e arquivo de entrada. */
export default function Home() {
  const [request, setRequest] = useState<SimulationRequest>(null);
  const simulatorRef = useRef<HTMLDivElement>(null);

  /** Carrega uma sentença da tabela do arquivo e leva a tela até a simulação. */
  function selectSentence(sentence: string) {
    setRequest((previous) => ({ sentence, id: (previous?.id ?? 0) + 1 }));
    simulatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="page-shell">
      <header className="page-heading">
        <span>Linguagens Formais e Autômatos · Trabalho 2 · Exercício 3</span>
        <h1>L₃ = <span className="nowrap">{"{ aⁿb²ⁿ | n ≥ 0 }"}</span> ∪ <span className="nowrap">{"{ a²ⁿbⁿ | n ≥ 0 }"}</span></h1>
        <p>Σ = {"{a, b}"}. Aceitar: ε, abb, aab, aabbbb, aaaabb, aaaaaabbb. Rejeitar: ab, abbb, aabbb, aaabb, aaab.</p>
      </header>

      <GrammarInfo />
      <div ref={simulatorRef} className="scroll-anchor">
        <DerivationSimulator request={request} />
      </div>
      <FileTester onSelectSentence={selectSentence} />
    </main>
  );
}
