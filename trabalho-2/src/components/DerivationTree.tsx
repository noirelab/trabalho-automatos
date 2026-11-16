import { useMemo } from "react";
import type { Derivation, TreeNode } from "@/lib/grammar";

const GAP_X = 52;
const GAP_Y = 58;
const PAD = 30;
// Árvores pequenas ficam ampliadas para usar o palco; o CSS limita à largura e altura disponíveis.
const ZOOM = 1.5;

type Props = { tree: TreeNode; derivation: Derivation; step: number };

/** Posição de cada nó: folhas lado a lado na ordem da sentença, cada pai centrado sobre os filhos. */
function layout(tree: TreeNode) {
  const positions = new Map<number, { x: number; y: number }>();
  const parents = new Map<number, TreeNode>();
  let leaves = 0;
  let depth = 0;
  (function place(node: TreeNode, level: number): number {
    depth = Math.max(depth, level);
    node.children.forEach((child) => parents.set(child.id, node));
    const x = node.children.length === 0 ? leaves++ : node.children.map((child) => place(child, level + 1)).reduce((a, b) => a + b) / node.children.length;
    positions.set(node.id, { x: PAD + x * GAP_X, y: PAD + level * GAP_Y });
    return x;
  })(tree, 0);
  return { positions, parents, width: 2 * PAD + Math.max(leaves - 1, 1) * GAP_X, height: 2 * PAD + depth * GAP_Y };
}

/** Rótulo com índice, como nos slides: S0 vira S com "0" subscrito. */
function Label({ text }: { text: string }) {
  const match = text.match(/^([A-Z])([a-z0-9]+)$/);
  if (!match) return <text dy="0.35em">{text}</text>;
  return <text dy="0.35em">{match[1]}<tspan className="tree-sub" dy="0.3em">{match[2]}</tspan></text>;
}

/** Desenha a árvore de derivação até o passo atual, no estilo dos slides (rótulos ligados por linhas). A posição de cada nó é fixa para a árvore não pular ao crescer. */
export default function DerivationTree({ tree, derivation, step }: Props) {
  const { positions, parents, width, height } = useMemo(() => layout(tree), [tree]);
  const expanded = new Set(derivation.order.slice(0, step).map((node) => node.id));
  const current = derivation.order[step - 1];

  // Um nó aparece quando o pai já foi substituído; a raiz aparece desde o passo zero.
  const nodes: TreeNode[] = [];
  (function collect(node: TreeNode) {
    nodes.push(node);
    if (expanded.has(node.id)) node.children.forEach(collect);
  })(tree);

  return (
    <div className="tree-frame">
      <svg className="tree-svg" viewBox={`0 0 ${width} ${height}`} style={{ width: width * ZOOM, maxWidth: "100%" }} role="img" aria-label={`Árvore de derivação no passo ${step}`}>
        {nodes.filter((node) => node !== tree).map((node) => {
          const parent = parents.get(node.id)!;
          const from = positions.get(parent.id)!;
          const to = positions.get(node.id)!;
          return <line key={`e${node.id}`} className={`tree-edge ${parent === current ? "tree-new tree-edge-marked" : ""}`} x1={from.x} y1={from.y + 12} x2={to.x} y2={to.y - 12} />;
        })}
        {nodes.map((node) => {
          const { x, y } = positions.get(node.id)!;
          const isNew = parents.get(node.id) === current;
          const classes = ["tree-node", node.children.length === 0 ? "tree-terminal" : "", node === current ? "tree-current" : "", isNew ? "tree-new tree-child" : ""].join(" ");
          return <g key={node.id} className={classes} transform={`translate(${x} ${y})`}>{(node === current || isNew) && <rect className="tree-mark" x={-17} y={-15} width={34} height={30} rx={8} />}<Label text={node.label} /></g>;
        })}
      </svg>
    </div>
  );
}
