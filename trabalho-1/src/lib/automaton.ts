/**
 * Regras do AFD e funções usadas pelo simulador, pela regex e pelo arquivo.
 * Este módulo não depende de React; ele apenas recebe dados e devolve resultados.
 */
export type State = "A" | "B" | "C" | "D";
export type Symbol = "a" | "b" | "c";

/** Um caractere consumido, com estado de origem e de destino. */
export type SimulationStep = {
  index: number;
  from: State;
  symbol: string;
  to: State;
};

/** Resultado completo para que a interface possa avançar e voltar pelos passos. */
export type SimulationResult = {
  sentence: string;
  accepted: boolean;
  finalState: State;
  steps: SimulationStep[];
};

// D representa o conjunto vazio e completa as transições não aceitas.
export const transitions: Record<State, Record<Symbol, State>> = {
  A: { a: "B", b: "D", c: "D" },
  B: { a: "D", b: "B", c: "C" },
  C: { a: "D", b: "D", c: "C" },
  D: { a: "D", b: "D", c: "D" },
};

export const initialState: State = "A";
export const finalStates: State[] = ["B", "C"];

/** Verifica se um caractere pertence ao alfabeto do exercício. */
export function isAlphabetSymbol(symbol: string): symbol is Symbol {
  return symbol === "a" || symbol === "b" || symbol === "c";
}

/** Consulta a tabela; símbolos desconhecidos levam ao estado morto D. */
export function getNextState(state: State, symbol: string): State {
  return isAlphabetSymbol(symbol) ? transitions[state][symbol] : "D";
}

/** Monta a frase exibida no painel para o último passo executado. */
export function describeTransition(step: SimulationStep | null): string {
  if (!step) return "Pronto para começar no estado A.";
  const symbol = step.symbol === " " ? "espaço" : step.symbol;
  if (step.to === "D") return `Leu ${symbol} no estado ${step.from}: não há transição. A leitura para aqui e a sentença é rejeitada.`;
  return `Leu ${symbol} e foi do estado ${step.from} para o estado ${step.to}.`;
}

/**
 * Começa em A, consome um caractere por vez e guarda cada transição.
 * Para no primeiro símbolo sem transição (estado morto D), rejeitando na hora.
 * Se ler tudo, aceita quando o estado final for B ou C.
 */
export function simulateSentence(sentence: string): SimulationResult {
  let currentState: State = initialState;
  const steps: SimulationStep[] = [];

  for (const [index, symbol] of Array.from(sentence).entries()) {
    const nextState = getNextState(currentState, symbol);
    steps.push({ index, from: currentState, symbol, to: nextState });
    currentState = nextState;
    // D não tem saída: os símbolos restantes não mudariam o resultado.
    if (currentState === "D") break;
  }

  return {
    sentence,
    accepted: finalStates.includes(currentState),
    finalState: currentState,
    steps,
  };
}

/** Testa a linguagem ab*c* e exige que nenhum caractere fique fora do alfabeto. */
export function testRegex(sentence: string): boolean {
  // O $ do JavaScript pode casar antes de uma quebra de linha final.
  // A checagem do alfabeto impede aceitar símbolos que ficaram sem consumo.
  return /^ab*c*$/.test(sentence) && Array.from(sentence).every(isAlphabetSymbol);
}

/** Um passo da explicação visual da regex, separado da aceitação final. */
export type RegexReadingStep = {
  index: number;
  symbol: string;
  part: "a" | "b*" | "c*";
  valid: boolean;
  explanation: string;
};

/**
 * Produz uma leitura didática dos trechos a, b* e c*.
 * Para no primeiro erro; não substitui o teste real feito por testRegex.
 */
export function explainRegexReading(sentence: string): RegexReadingStep[] {
  const steps: RegexReadingStep[] = [];
  // Depois do a inicial, podemos repetir b; após o primeiro c, só cabem mais c.
  let part: "b*" | "c*" = "b*";

  for (const [index, symbol] of Array.from(sentence).entries()) {
    const symbolName = symbol === " " ? "espaço" : symbol;

    if (index === 0) {
      const valid = symbol === "a";
      steps.push({
        index, symbol, part: "a", valid,
        explanation: valid
          ? "O primeiro símbolo corresponde ao a obrigatório."
          : `A expressão exige a no início, mas encontrou ${symbolName}.`,
      });
      if (!valid) break;
      continue;
    }

    if (part === "b*" && symbol === "b") {
      steps.push({ index, symbol, part, valid: true, explanation: "O símbolo b pertence a b*, que permite várias repetições." });
    } else if (symbol === "c") {
      part = "c*";
      steps.push({ index, symbol, part, valid: true, explanation: "O símbolo c pertence a c*, que permite várias repetições." });
    } else {
      let explanation = `O símbolo ${symbolName} não pertence ao alfabeto.`;
      if (symbol === "a") explanation = "O símbolo a só pode aparecer no início.";
      if (symbol === "b" && part === "c*") explanation = "Depois de c, não pode aparecer b.";
      steps.push({ index, symbol, part, valid: false, explanation });
      break;
    }
  }

  return steps;
}

/** Devolve cinco sentenças não vazias ou null se a quantidade for diferente. */
export function parseSentenceFile(content: string): string[] | null {
  // Aceita quebras de linha do Windows, Linux e versões antigas do macOS.
  const sentences = content.split(/\r\n|\n|\r/).map((line) => line.trim()).filter((line) => line.length > 0);
  return sentences.length === 5 ? sentences : null;
}
