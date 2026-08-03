# TEST_SUITE: Suíte de Golden Files — Open Domain Driven Specification (ODDS)

## 0. Propósito deste documento

Este arquivo documenta a suíte de testes de referência ("golden files") para o parser e o validador semântico da ODDS. Cada caso de teste é um par `input.odds` + `expected.json`: o primeiro é um arquivo `.odds` de entrada, o segundo é o resultado exato (diagnósticos, e notas sobre a AST) que uma implementação **em conformidade** deve produzir para aquela entrada.

O objetivo é permitir desenvolvimento (humano ou via IA) no estilo TDD: "faça o parser/validador passar nestes 18 casos" é uma especificação muito mais verificável do que "implemente as regras descritas em prosa no RULES.md".

Esta suíte corresponde à `GRAMMAR.md` v0.1.9 e `AST_SCHEMA.md` v0.1.2. Qualquer mudança em qualquer um dos dois documentos-fonte deve ser acompanhada de uma revisão desta suíte.

---

## 1. Estrutura de diretórios

```
golden-files/
  <nome-do-caso>/
    input.odds        ← arquivo de entrada
    expected.json      ← resultado esperado
```

Um diretório por caso de teste, nomeado em `kebab-case`. A convenção é **um caso por `DiagnosticCode`** (ver `AST_SCHEMA.md` §1), mais casos auxiliares quando um único code precisa de mais de um cenário para ficar inequívoco (ex: cardinalidade de domain tem uma variante "zero" e uma "múltiplos").

---

## 2. Formato de `expected.json`

```typescript
interface GoldenFileExpectation {
  /** Explica o que o caso testa e por que foi desenhado dessa forma. Não é consumido por testes automatizados — é documentação para humanos/IA lendo o caso. */
  description: string;

  /** Nota opcional quando a regra em RULES.md era ambígua e uma interpretação teve que ser escolhida para este golden file. Ver seção 5. */
  interpretationNote?: string;

  /** true se uma AST (mesmo que semanticamente inválida) deve ser gerada; false apenas para SYNTAX_ERROR puro (GRAMMAR.md §5). */
  astGenerated: boolean;

  /** Notas informais sobre a forma esperada da AST — não um snapshot completo, só os pontos relevantes ao caso. Omitido quando óbvio. */
  astNotes?: string;

  /** Nota específica para regras cujo escopo é o arquivo inteiro (não uma linha), explicando a convenção de span adotada. Ver seção 4. */
  partialAstNotes?: string;

  /** Lista de diagnósticos esperados, na ordem em que uma implementação de referência deveria emiti-los. Vazio ([]) significa "nenhum diagnóstico" — ver valid-baseline. */
  diagnostics: Diagnostic[];
}
```

`Diagnostic` é exatamente a interface definida em `AST_SCHEMA.md` §1 (`severity`, `code`, `message`, `span`) — **sem nenhum campo extra**. Isso é proposital: o formato de golden file usa o mesmo contrato de dados que o sistema real vai produzir em runtime, para que o caso de teste possa ser comparado por igualdade estrutural direta contra a saída do validador, sem camada de tradução.

---

## 3. Como rodar a suíte (uma vez que o parser exista)

Pseudocódigo do executor de testes esperado:

```typescript
for (const caseDir of listGoldenFileCases()) {
  const input = readFile(`${caseDir}/input.odds`);
  const expected: GoldenFileExpectation = JSON.parse(readFile(`${caseDir}/expected.json`));

  const result = parseAndValidate(input); // sua implementação

  assert.equal(result.astGenerated, expected.astGenerated);
  assert.deepEqual(
    result.diagnostics.map(d => ({ severity: d.severity, code: d.code, message: d.message, span: d.span })),
    expected.diagnostics
  );
}
```

`description`, `interpretationNote`, `astNotes` e `partialAstNotes` são documentação — não entram na asserção automatizada, mas devem ser lidos por quem for implementar ou depurar uma falha.

---

## 4. Convenção de `span`

- **1-indexed** em linha e coluna, consistente com `GRAMMAR.md`/`AST_SCHEMA.md`.
- **`end` é exclusivo** (aponta um caractere depois do último caractere do trecho), estilo LSP — ex: a palavra `"OHS"` de 3 caracteres começando na coluna 5 tem `start.column: 5` e `end.column: 8`.
- Erros ligados a um **token/nó específico** (uma tag, um identificador, uma declaração): `span` cobre exatamente esse trecho.
- Erros de **relação inteira** (ex: `SEPARATION_CONFLICT`, que envolve o conector E as tags de ambos os lados): `span` cobre a linha de relacionamento inteira.
- Erros de **escopo de arquivo inteiro**, sem um nó único ao qual apontar (`INVALID_DOMAIN_CARDINALITY` com zero domains): `span` cobre do início ao fim do arquivo.
- Erros/warnings de **escopo agregado** (`EXCESSIVE_SHARED_KERNEL_WARNING`, que depende de contar ocorrências no arquivo inteiro, não uma linha isolada): `span` aponta para a abertura do bloco `mapping` como âncora — ver nota específica no caso.
- Em caso de **duplicidade/multiplicidade** (`DUPLICATE_CONTEXT`, `INVALID_DOMAIN_CARDINALITY` com múltiplos domains): a convenção adotada é apontar para a **segunda ocorrência** (a que "causa" o problema), não a primeira.

Os spans desta suíte foram calculados programaticamente (script auxiliar, não incluído na suíte final) para evitar erro de contagem manual — mas **ainda não foram verificados contra um parser real**, já que ele não existe. Trate-os como a especificação-alvo, e ajuste a suíte se a tokenização real de um parser implementado divergir em algum detalhe (ex: se espaços à esquerda do token forem tratados de forma diferente).

---

## 5. Duas classes de nota especial nesta suíte

### 5.1 Diagnósticos que se sobrepõem por natureza

Dois casos desta suíte (`role-conflict` e, potencialmente, combinações não cobertas aqui) **sempre** disparam mais de um `DiagnosticCode` para a mesma linha, porque as regras são estruturalmente interdependentes — ex: colocar `[C]` e `[S]` no mesmo lado força necessariamente uma violação de posição para um dos dois, já que um é upstream-only e o outro downstream-only. Esses casos documentam explicitamente **todos** os diagnósticos esperados, não só o que dá nome ao diretório. Uma implementação que reporte só um dos dois está incompleta.

### 5.2 Regras com gatilho ambíguo em `RULES.md`

Dois warnings (`generic-without-ohs-warning`, `excessive-shared-kernel-warning`) têm texto de gatilho vago no `RULES.md` original ("se muitos padrões genéricos começarem a ditar regras", "múltiplos contextos usando SK") — não fica claro se o critério é por linha de relacionamento individual ou um padrão agregado do arquivo inteiro, nem qual o limiar numérico de "múltiplos". Os golden files desta suíte **fixam uma interpretação razoável** (documentada no campo `interpretationNote` de cada um), mas isso é uma lacuna real do `RULES.md` que vale formalizar com um limiar explícito antes da implementação final — não é uma ambiguidade que esta suíte resolve sozinha, só uma que ela contorna de forma documentada.

---

## 6. Cobertura atual

| # | Caso | `DiagnosticCode` | Severidade |
|---|---|---|---|
| 1 | `syntax-error` | `SYNTAX_ERROR` | error |
| 2 | `orphan-context` | `ORPHAN_CONTEXT` | error |
| 3 | `orphan-subdomain` | `ORPHAN_SUBDOMAIN` | error |
| 4 | `phantom-reference` | `PHANTOM_REFERENCE` | error |
| 5 | `duplicate-context` | `DUPLICATE_CONTEXT` | error |
| 6 | `invalid-domain-cardinality-zero` | `INVALID_DOMAIN_CARDINALITY` | error |
| 7 | `invalid-domain-cardinality-multiple` | `INVALID_DOMAIN_CARDINALITY` | error |
| 8 | `invalid-subdomain-type` | `INVALID_SUBDOMAIN_TYPE` | error |
| 9 | `upstream-only-tag-misplaced` | `UPSTREAM_ONLY_TAG_MISPLACED` | error |
| 10 | `downstream-only-tag-misplaced` | `DOWNSTREAM_ONLY_TAG_MISPLACED` | error |
| 11 | `separation-conflict` | `SEPARATION_CONFLICT` | error |
| 12 | `role-conflict` | `ROLE_CONFLICT` (+ `DOWNSTREAM_ONLY_TAG_MISPLACED`) | error |
| 13 | `protection-conflict` | `PROTECTION_CONFLICT` | error |
| 14 | `conformist-core-warning` | `CONFORMIST_CORE_WARNING` | warning |
| 15 | `generic-without-ohs-warning` | `GENERIC_WITHOUT_OHS_WARNING` | warning |
| 16 | `excessive-shared-kernel-warning` | `EXCESSIVE_SHARED_KERNEL_WARNING` | warning |
| 17 | `undocumented-contract-warning` | `UNDOCUMENTED_CONTRACT_WARNING` | warning |
| 18 | `valid-baseline` | — (0 diagnósticos, sanity check) | — |

Todos os 15 `SemanticDiagnosticCode` + `SYNTAX_ERROR` de `AST_SCHEMA.md` §1 têm cobertura. **Contribuição real desta suíte:** o processo de escrevê-la encontrou e corrigiu duas contradições reais entre `GRAMMAR.md` e `RULES.md` que teriam gerado código morto (`INVALID_SUBDOMAIN_TYPE` e `ORPHAN_CONTEXT`/`ORPHAN_SUBDOMAIN`) — ver changelog de `GRAMMAR.md` v0.1.8 e v0.1.9.

---

## 7. Lacunas conhecidas / próximos incrementos

- Cada code tem exatamente 1 caso (2 no caso de cardinalidade). Casos de **combinação** adicionais (ex: um arquivo com múltiplos warnings simultâneos em contextos diferentes) ainda não existem — úteis para testar que o Visitor não para no primeiro problema encontrado.
- Não há golden files para os **presets** completos do produto (E-Commerce, Simple Domain — PRD GH-001); esta suíte testa regras isoladas, não os arquivos de exemplo reais que o playground vai carregar.
- O limiar numérico de `EXCESSIVE_SHARED_KERNEL_WARNING` e o escopo exato de `GENERIC_WITHOUT_OHS_WARNING` (ver seção 5.2) devem ser formalizados em `RULES.md` — o valor usado aqui (2+ ocorrências) é uma suposição documentada, não uma decisão confirmada com o time.

---

## Changelog

- **v0.1.0** — versão inicial. 18 golden files cobrindo todos os `DiagnosticCode` de `AST_SCHEMA.md` v0.1.2 / `GRAMMAR.md` v0.1.9. Encontradas e corrigidas duas contradições estruturais na gramática durante o processo (ver seção 6).
