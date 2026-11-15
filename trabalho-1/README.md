# Simulador de Autômato: Exercício 6

Aplicação de página única em Next.js, React e TypeScript para estudar a conversão de um AFND-ε em AFD. O diagrama é um SVG manual; a simulação, o teste da expressão regular e a leitura de arquivo acontecem no navegador, sem backend.

## Executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Para verificar a compilação, execute `npm run build`.

## Resolução do exercício

O AFND-ε original começa em `q0`, tem `q3` como estado final e usa o alfabeto `{a, b, c}`. As transições não vazias são:

| Origem | Símbolo | Destinos |
| --- | --- | --- |
| q0 | a | {q1} |
| q0 | ε | {q2} |
| q1 | b | {q1, q3} |
| q2 | ε | {q0} |
| q2 | a | {q3} |
| q3 | c | {q3} |

Os fechos-ε são:

| Estado | Fecho-ε |
| --- | --- |
| q0 | {q0, q2} |
| q1 | {q1} |
| q2 | {q0, q2} |
| q3 | {q3} |

Na construção por subconjuntos, cada conjunto vira um estado do AFD:

| Estado | Conjunto | Papel | a | b | c |
| --- | --- | --- | --- | --- | --- |
| A | {q0, q2} | Inicial | B | D | D |
| B | {q1, q3} | Final | D | B | C |
| C | {q3} | Final | D | D | C |
| D | ∅ | Morto | D | D | D |

O estado `D` completa a tabela: uma vez nele, a leitura não sai dele. Para manter o desenho legível, o SVG mostra apenas o percurso principal `A`, `B` e `C`. Quando a execução entra em `D`, o painel informa isso, e as transições continuam disponíveis na tabela.

A linguagem é `ab*c*`: um `a` obrigatório, seguido de zero ou mais `b` e depois zero ou mais `c`. Por exemplo, `a`, `ab` e `abbccc` são aceitas; `ba`, `aa` e `abca` são rejeitadas.

## Usar a página

1. **Execução passo a passo:** a sentença `abbc` já fica preparada. Clique em **Próximo passo** ou **Reproduzir**. O passo zero ainda não consumiu nenhum símbolo; cada avanço consome exatamente um caractere. **Passo anterior** volta uma etapa, **Pausar** interrompe a reprodução e **Reiniciar** volta ao passo zero sem apagar a sentença. Para outra sentença, digite-a e clique em **Iniciar**.
2. **Diagrama:** durante uma transição visível, a seta é desenhada primeiro. Só depois da animação o estado de chegada recebe destaque e pulsa. O painel numérico da simulação já mostra o estado lógico alcançado pelo passo. Em dispositivos com movimento reduzido, o destaque chega sem esperar a animação.
3. **Expressão regular:** digite uma sentença e clique em **Testar expressão**. O resultado aparece imediatamente. Os controles abaixo mostram uma leitura didática dos trechos `a`, `b*` e `c*`, caractere por caractere; não são uma visualização interna do motor de regex. A aceitação final é calculada por `testRegex`.
4. **Arquivo:** selecione um `.txt` com uma sentença por linha ou clique em **Carregar exemplo**. Espaços nas pontas são removidos e linhas vazias são ignoradas; após isso, devem restar exatamente cinco sentenças. A tabela mostra os resultados do AFD e da regex. Clique em uma linha para abrir a sentença no simulador. O arquivo é lido com `FileReader`, sem envio para servidor.

Um arquivo de exemplo:

```text
a
abbb
abbccc
ba
abca
```

## Como o código funciona

### Papel de cada arquivo

| Arquivo | Responsabilidade |
| --- | --- |
| `README.md` | Documenta a resolução, o uso da página e a organização do projeto. |
| `src/app/layout.tsx` | Define o HTML base, o idioma da página e os metadados. |
| `src/app/page.tsx` | Monta a página, recebe o passo do simulador e o envia ao diagrama; também carrega uma sentença escolhida na tabela. |
| `src/app/globals.css` | Define cores, cards, animações do SVG e adaptação para telas menores. |
| `src/components/AutomatonDiagram.tsx` | Desenha o SVG de A, B e C; anima a seta e só então destaca o estado de chegada. |
| `src/components/StepSimulator.tsx` | Controla entrada, início, avanço, reprodução, pausa, reinício e histórico do AFD. |
| `src/components/RegexTester.tsx` | Testa a sentença com a regex e oferece a leitura didática de `a`, `b*` e `c*`. |
| `src/components/FileTester.tsx` | Lê o `.txt` com `FileReader`, valida as cinco linhas e compara os dois métodos. |
| `src/components/AutomatonInfo.tsx` | Exibe os conjuntos, fechos-ε e a tabela de transições da resolução. |
| `src/lib/automaton.ts` | Guarda a lógica pura do AFD, da regex e da interpretação das linhas do arquivo. |
| `package.json` | Declara dependências e comandos `dev`, `build` e `start`. |
| `tsconfig.json` | Configura TypeScript, checagem estrita e o atalho de importação `@/`. |
| `next.config.ts` | Configura o processo de compilação do Next.js. |
| `next-env.d.ts` | Arquivo de tipos gerado pelo Next.js; não deve ser editado manualmente. |

### Funções principais

- `src/lib/automaton.ts` concentra a tabela `transitions`, o estado inicial, os estados finais e as funções de lógica. `getNextState` consulta a tabela; um símbolo fora de `{a, b, c}` leva a `D` sem interromper a execução.
- `simulateSentence` começa em `A`, lê a sentença da esquerda para a direita e registra `{index, from, symbol, to}` para cada caractere. Somente depois de consumir todos eles verifica se o estado final é `B` ou `C`. A sentença vazia termina em `A` e é rejeitada.
- `testRegex` testa `/^ab*c*$/` e confere se todos os caracteres pertencem ao alfabeto. Esta segunda checagem evita a particularidade de `$` em JavaScript, que também pode casar antes de uma quebra de linha final. `explainRegexReading` monta apenas os passos explicativos mostrados na interface.
- `parseSentenceFile` separa linhas, remove espaços nas pontas, descarta linhas vazias e exige cinco sentenças. `FileTester.tsx` aplica `simulateSentence` e `testRegex` a cada linha válida.
- `StepSimulator.tsx` guarda a sentença, o resultado e o número de passos consumidos. `page.tsx` compartilha o passo atual com `AutomatonDiagram.tsx`, que desenha os estados e transições com SVG nativo. `AutomatonInfo.tsx` exibe os fechos e a tabela da resolução.

Para explicar um passo ao professor, use `abbc`: começa em `A`; lê `a` e vai a `B`; lê `b` e permanece em `B` duas vezes; lê `c` e vai a `C`. Foram consumidos os quatro caracteres e `C` é final, portanto a sentença é aceita. O mesmo teste pela regex retorna aceitação.
