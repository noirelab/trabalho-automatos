# Simulador de GLC: Exercício 3

Aplicação de página única em Next.js, React e TypeScript. Mostra a gramática livre de contexto do exercício 3, a simplificação e a Forma Normal de Chomsky (FNC) no formato das soluções do professor. Também simula a derivação de sentenças, com a árvore de derivação em SVG. Tudo roda no navegador, sem backend.

## Executar

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # confere a gramática, a FNC e o CYK
npm run build   # verifica a compilação
```

## Enunciado

Σ = {a, b}. L₃ = { aⁿb²ⁿ | n ≥ 0 } ∪ { a²ⁿbⁿ | n ≥ 0 }

- Aceitar: ε, abb, aab, aabbbb, aaaabb, aaaaaabbb
- Rejeitar: ab, abbb, aabbb, aaabb, aaab

## 1. Construção da gramática

Segue a receita da lista do professor para uniões (mesmo formato do Ex. 11): uma gramática para cada parte, juntadas por S → X | Y.

```text
G = ({S, X, Y}, {a, b}, P, S)
S → X | Y
X → aXbb | ε      (cada a vem com dois b: aⁿb²ⁿ)
Y → aaYb | ε      (cada b vem com dois a: a²ⁿbⁿ)
```

Exemplo: `aabbbb` = S ⇒ X ⇒ aXbb ⇒ aaXbbbb ⇒ aabbbb.

## 2. Simplificação

Ordem da receita do professor: vazias, unitárias, inúteis, inacessíveis. Os conjuntos são os dos algoritmos dos slides "Simplificação e Formas Normais".

**1) Produções vazias.** E0 = {X, Y}, E1 = {X, Y, S}, E2 = E1. A raiz S é anulável (ε ∈ L₃), então cria-se a nova raiz S0 → S | ε.

```text
S0 → S | ε    S → X | Y    X → aXbb | abb    Y → aaYb | aab
```

**2) Produções unitárias.** N_S0 = {S0, S, X, Y}, N_S = {S, X, Y}, N_X = {X}, N_Y = {Y}.

```text
S0 → aXbb | abb | aaYb | aab | ε
S  → aXbb | abb | aaYb | aab
X  → aXbb | abb    Y → aaYb | aab
```

**3) Símbolos inúteis.** N0 = ∅, N1 = {S0, S, X, Y}, N2 = N1. Nenhum.

**4) Símbolos inacessíveis.** V0 = {S0}, V1 = {S0, a, b, X, Y}, V2 = V1. S ficou inacessível e sai.

```text
S0 → aXbb | abb | aaYb | aab | ε
X  → aXbb | abb    Y → aaYb | aab
```

## 3. Forma Normal de Chomsky

Na FNC cada produção troca uma variável por duas variáveis ou por um terminal; só a raiz tem S0 → ε. Os nomes seguem o Ex. 18 da lista do professor.

**5) Terminais:** dentro de lados direitos longos, a vira A (A → a) e b vira B (B → b).
**6) Quebra em pares:** fica a primeira variável e uma letra nova guarda o resto.

| Depois da simplificação | 5) a vira A, b vira B | 6) quebra em pares | variáveis novas |
| --- | --- | --- | --- |
| aXbb | AXBB | AC | C → XD (gera Xbb), D → BB (gera bb) |
| abb | ABB | AD | reaproveita D |
| aaYb | AAYB | AE | E → AF (gera aYb), F → YB (gera Yb) |
| aab | AAB | AG | G → AB (gera ab) |

```text
S0 → AC (1) | AD (2) | AE (3) | AG (4) | ε (5)
X  → AC (6) | AD (7)
Y  → AE (8) | AG (9)
C  → XD (10)    D → BB (11)    E → AF (12)
F  → YB (13)    G → AB (14)    A → a (15)    B → b (16)
```

Conferência (aabbbb): S0 ⇒ AC ⇒ aC ⇒ aXD ⇒ aADD ⇒ aaDD ⇒ aaBBD ⇒ aabBD ⇒ aabbD ⇒ aabbBB ⇒ aabbbB ⇒ aabbbb ✓

## 4. Como o programa simula a derivação

Para saber se a sentença pertence a L₃ e montar a árvore, o programa usa o algoritmo CYK, que só funciona com gramáticas na FNC. Ele não aparece na página porque não está nos slides. Ele testa cada trecho da sentença, do menor para o maior, anota quais variáveis geram cada trecho e com qual produção. Se S0 gera a sentença inteira, a árvore é reconstruída a partir dessas anotações.

A página mostra a derivação mais à esquerda, que é a árvore percorrida em pré-ordem. A cada passo aparecem a produção aplicada, com o número da lista da FNC, e a forma sentencial. A árvore ganha os filhos do nó substituído. Para uma sentença rejeitada, a página diz que não existe derivação S0 ⇒* w e explica a conta (por exemplo: "2 a e 3 b: aⁿb²ⁿ precisaria de 4 b; a²ⁿbⁿ precisaria de 6 a").

## Usar a página

A página segue a ordem dos critérios do vídeo:

1. **Construção da GLC**, 2. **Simplificação** e 3. **Forma Normal de Chomsky**: a resolução completa, com os conjuntos de cada algoritmo. Em cada passo da simplificação, as produções novas aparecem em verde e as que saíram aparecem riscadas.
4. **Simulação**: digite uma sentença (ε ou & para a vazia) e clique em **Derivar**. **Avançar**, **Voltar**, **Reproduzir** e **Reiniciar** controlam os passos. Acima da árvore, uma frase explica o passo (qual variável foi trocada, por qual produção) e mostra a forma sentencial antes ⇒ depois. Em todos os lugares, variáveis são azuis, terminais são verdes e o que foi trocado no passo fica em laranja. A tabela com todos os passos fica à direita da árvore.
5. **Arquivo de entrada**: selecione um `.txt` ou clique em **Carregar entrada.txt**. O formato é o mesmo da lista de exercícios, e o arquivo [`public/entrada.txt`](public/entrada.txt) traz as sentenças do enunciado:

   ```text
   Aceitar: ε, abb, aab, aabbbb, aaaabb, aaaaaabbb
   Rejeitar: ab, abbb, aabbb, aaabb, aaab
   ```

   As sentenças podem vir separadas por vírgula ou uma por linha abaixo do rótulo. A tabela compara o esperado com o resultado do programa. Clique em uma sentença para abrir sua derivação.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/lib/grammar.ts` | Gramática original, passos da simplificação e da FNC, CYK com montagem da árvore, derivação mais à esquerda, explicação da rejeição e leitura do arquivo. |
| `src/lib/grammar.test.ts` | Confere que a gramática original, cada passo e a FNC geram L₃, que a FNC está no formato certo e que o simulador aceita exatamente L₃ (todas as cadeias até 10 símbolos). |
| `src/components/GrammarInfo.tsx` | Seções 1 a 3: construção, simplificação e FNC. |
| `src/components/Sym.tsx` | Escreve símbolos com índice (S₀, E₀, N_X) e listas de produções. |
| `src/components/DerivationSimulator.tsx` | Seção 4: entrada, controles e tabela de passos da derivação. |
| `src/components/DerivationTree.tsx` | Desenha em SVG a árvore até o passo atual, no estilo dos slides. |
| `src/components/FileTester.tsx` | Lê o `.txt` com `FileReader` e testa cada sentença. |
| `src/app/page.tsx` | Monta a página e leva a sentença escolhida na tabela até o simulador. |
| `src/app/globals.css` | Estilos, no mesmo visual do trabalho 1. |
| `public/entrada.txt` | Arquivo de entrada com as sentenças do enunciado. |
