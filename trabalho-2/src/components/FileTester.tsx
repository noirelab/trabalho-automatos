"use client";

import { useState, type ChangeEvent } from "react";
import { parse, parseSentenceFile, showSentence, type FileSentence } from "@/lib/grammar";

type Props = { onSelectSentence: (sentence: string) => void };

/** Badge de aceita/rejeita; null vira traço. */
function Verdict({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-muted">—</span>;
  return <span className={`badge ${value ? "badge-success" : "badge-failure"}`}>{value ? "Aceita" : "Rejeita"}</span>;
}

/** Lê o arquivo de entrada no navegador e testa cada sentença na gramática em FNC. */
export default function FileTester({ onSelectSentence }: Props) {
  const [sentences, setSentences] = useState<FileSentence[]>([]);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

  /** Atualiza a tabela ou mostra erro se não houver sentenças. */
  function loadContent(content: string, name: string) {
    const parsed = parseSentenceFile(content);
    setSentences(parsed);
    setSource(parsed.length ? name : "");
    setError(parsed.length ? "" : "O arquivo não contém sentenças.");
  }

  /** Valida a extensão e usa FileReader, sem enviar o arquivo a um servidor. */
  function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    // Permite escolher o mesmo arquivo de novo após uma correção.
    event.target.value = "";
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setSentences([]);
      setError("Selecione um arquivo .txt.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => loadContent(String(reader.result ?? ""), file.name);
    reader.onerror = () => { setSentences([]); setError("Não foi possível ler o arquivo. Tente novamente."); };
    reader.readAsText(file);
  }

  /** Carrega public/entrada.txt, o mesmo arquivo entregue com o trabalho. */
  async function loadExample() {
    try {
      const response = await fetch("/entrada.txt");
      if (!response.ok) throw new Error(String(response.status));
      loadContent(await response.text(), "entrada.txt");
    } catch {
      setSentences([]);
      setError("Não foi possível carregar o arquivo de exemplo.");
    }
  }

  const rows = sentences.map((item) => ({ ...item, accepted: parse(item.sentence) !== null }));
  const mismatches = rows.filter((row) => row.expected !== null && row.expected !== row.accepted).length;

  return (
    <section className="card" aria-labelledby="file-title">
      <h2 id="file-title"><span className="section-number">5</span> Arquivo de entrada</h2>
      <p>O arquivo segue o formato da lista: uma linha “Aceitar:” e outra “Rejeitar:”, com as sentenças separadas por vírgula. O programa testa cada uma na gramática da FNC e compara com o esperado.</p>
      <div className="file-actions">
        <label className="button button-primary upload-button" htmlFor="file-input">Selecionar arquivo .txt</label>
        <input id="file-input" type="file" accept=".txt,text/plain" onChange={readFile} className="visually-hidden" />
        <button type="button" className="button button-secondary" onClick={loadExample}>Carregar entrada.txt</button>
      </div>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {rows.length === 0 && !error && <p className="file-empty">Escolha um arquivo ou carregue o exemplo para testar as sentenças.</p>}
      {rows.length > 0 && (
        <>
          <div className="file-summary">
            <span><span className="summary-dot" /> {source}</span>
            <span>{rows.length} sentenças · {mismatches === 0 ? "todas conferem com o esperado" : `${mismatches} diferente(s) do esperado`}</span>
          </div>
          <div className="table-scroll">
            <table className="results-table">
              <thead><tr><th>Sentença</th><th>Esperado</th><th>Programa</th><th>Confere</th></tr></thead>
              <tbody>{rows.map((row, index) => (
                <tr key={`${row.sentence}-${index}`}>
                  <td><button type="button" className="sentence-link" onClick={() => onSelectSentence(showSentence(row.sentence))} title="Abrir na derivação">{showSentence(row.sentence)}<span aria-hidden="true"> ↗</span></button></td>
                  <td><Verdict value={row.expected} /></td>
                  <td><Verdict value={row.accepted} /></td>
                  <td>{row.expected === null ? <span className="text-muted">—</span> : <span className={`match ${row.expected === row.accepted ? "match-yes" : "match-no"}`}>{row.expected === row.accepted ? "✓" : "✕"}</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="table-help">Clique em uma sentença para ver a derivação e a árvore.</p>
        </>
      )}
    </section>
  );
}
