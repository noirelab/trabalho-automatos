"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { parseSentenceFile, simulateSentence, testRegex } from "@/lib/automaton";

// Mesmo formato e fluxo de um arquivo .txt com cinco linhas.
const example = ["a", "abbb", "abbccc", "ba", "abca"];

type Props = { onSelectSentence: (sentence: string) => void };

/** Lê cinco sentenças no navegador e compara AFD com expressão regular. */
export default function FileTester({ onSelectSentence }: Props) {
  const [sentences, setSentences] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  /** Atualiza a tabela ou mostra o erro de quantidade de sentenças. */
  function loadSentences(lines: string[], name: string) {
    if (lines.length !== 5) {
      setSentences([]);
      setSource("");
      setError("O arquivo deve conter exatamente 5 sentenças.");
      return;
    }
    setSentences(lines);
    setSource(name);
    setError("");
  }

  /** Valida a extensão e usa FileReader, sem enviar o arquivo a um servidor. */
  function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Selecione um arquivo .txt.");
      setSentences([]);
      setSource("");
      return;
    }

    const reader = new FileReader();
    // A leitura é assíncrona: a tabela só é atualizada dentro de onload.
    reader.onload = () => {
      const content = String(reader.result ?? "");
      const lines = parseSentenceFile(content);
      loadSentences(lines ?? [], file.name);
    };
    reader.onerror = () => {
      setError("Não foi possível ler o arquivo. Tente novamente.");
      setSentences([]);
      setSource("");
    };
    reader.readAsText(file);
    // Permite escolher o mesmo arquivo de novo após uma correção.
    event.target.value = "";
  }

  /** Usa os mesmos dados e a mesma tabela de um arquivo selecionado. */
  function loadExample() {
    loadSentences(example, "Exemplo interno");
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <section className="card file-card" aria-labelledby="file-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">04 / TESTE EM LOTE</span>
          <h2 id="file-title">Leitura de arquivo com 5 sentenças</h2>
          <p>Uma sentença por linha. O arquivo é lido diretamente no navegador.</p>
        </div>
        <span className="file-deco" aria-hidden="true">.txt</span>
      </div>
      <div className="file-actions">
        <label className="button button-primary upload-button" htmlFor="file-input">Selecionar arquivo .txt</label>
        <input ref={fileInput} id="file-input" type="file" accept=".txt,text/plain" onChange={readFile} className="visually-hidden" />
        <button type="button" className="button button-secondary" onClick={loadExample}>Carregar exemplo</button>
      </div>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {sentences.length === 0 && !error && <p className="file-empty">Escolha um arquivo ou carregue o exemplo para comparar os resultados.</p>}
      {sentences.length > 0 && (
        <>
          <div className="file-summary"><span><span className="summary-dot" /> {source}</span><span>5 sentenças analisadas</span></div>
          <div className="table-scroll">
            <table className="results-table">
              <thead><tr><th>Sentença</th><th>AFD</th><th>Expressão regular</th><th>Resultado</th></tr></thead>
              <tbody>{sentences.map((sentence, index) => {
                // Cada linha é avaliada separadamente pelas duas representações.
                const afd = simulateSentence(sentence).accepted;
                const regex = testRegex(sentence);
                return <tr key={`${sentence}-${index}`}>
                  <td><button type="button" className="sentence-link" onClick={() => onSelectSentence(sentence)} title="Abrir no simulador">{sentence}<span aria-hidden="true"> ↗</span></button></td>
                  <td><span className={`badge ${afd ? "badge-success" : "badge-failure"}`}>{afd ? "Aceita" : "Rejeita"}</span></td>
                  <td><span className={`badge ${regex ? "badge-success" : "badge-failure"}`}>{regex ? "Aceita" : "Rejeita"}</span></td>
                  <td><span className={`match ${afd === regex ? "match-yes" : "match-no"}`} title={afd === regex ? "Resultados iguais" : "Resultados diferentes"}>{afd === regex ? "✓" : "✕"}</span></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          <p className="table-help">Clique em uma sentença para abri-la na execução passo a passo.</p>
        </>
      )}
    </section>
  );
}
