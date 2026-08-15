# TEST_SUITE: Suíte de Golden Files — Open Domain Driven Specification (ODDS)

## 0. Propósito deste documento

Este arquivo documenta a suíte de testes de referência ("golden files") para o parser e o validador semântico da ODDS. Cada caso de teste é um par `input.odds` + `expected.json`: o primeiro é um arquivo `.odds` de entrada, o segundo é o resultado exato (diagnósticos, e notas sobre a AST) que uma implementação **em conformidade** deve produzir para aquela entrada.

O objetivo é permitir desenvolvimento (humano ou via IA) no estilo TDD: *"faça o parser/validador passar nestes 44 casos"* é uma especificação muito mais verificável do que "implemente as regras descritas em prosa no RULES.md".

Esta suíte (`TEST_SUITE.md` v0.2.0) corresponde à `GRAMMAR.md` v0.2.0, ao `AST_SCHEMA.md` v0.2.0 e à `ODDS Language Version` v0.1.0. Qualquer mudança em qualquer um dos documentos-fonte deve ser acompanhada de uma revisão desta suíte — e de uma entrada nova em [`CHANGELOG.md`](./CHANGELOG.md).

---

## 1. Estrutura de diretórios

```
golden-files/
  <nome-do-caso>/
    input.odds        ← arquivo de entrada
    expected.json     ← resultado esperado
```

Um diretório por caso de teste, nomeado em `kebab-case`. A convenção é **um caso por `DiagnosticCode`** (ver `AST_SCHEMA.md` §1.3), mais casos auxiliares quando um único code precisa de mais de um cenário para ficar inequívoco (ex: cardinalidade de domain tem uma variante "zero" e uma "múltiplos"; supressão malformada tem uma por `reason`).

---

## 2. Formato de `expected.json`

```typescript
interface GoldenFileExpectation {
  /** Explica o que o caso testa e por que foi desenhado dessa forma. Não é consumido por testes automatizados — é documentação para humanos/IA lendo o caso. */
  description: string;

  /** Nota opcional quando o caso depende de uma interação entre regras (tipicamente o princípio do erro-raiz) ou de uma convenção que não é óbvia só de olhar o input. Ver seção 5. */
  interpretationNote?: string;

  /** true se uma AST (mesmo que semanticamente inválida) deve ser gerada; false apenas para SYNTAX_ERROR puro (GRAMMAR.md §5). NÃO significa "renderizável" — ver nota abaixo. */
  astGenerated: boolean;

  /** Notas informais sobre a forma esperada da AST — não um snapshot completo, só os pontos relevantes ao caso. Omitido quando óbvio. */
  astNotes?: string;

  /** Nota sobre o que NÃO deve estar na AST, ou sobre o que sobrevive à recuperação de erro do parser. */
  partialAstNotes?: string;

  /** Lista de diagnósticos esperados, na ordem exata exigida por RULES.md §3.3. Vazio ([]) significa "nenhum diagnóstico". */
  diagnostics: Diagnostic[];
}
```

`Diagnostic` é exatamente a interface definida em `AST_SCHEMA.md` §1.2 — `severity`, `code`, `data`, `span`, **sem nenhum campo extra e sem `message`**. Isso é proposital: o formato de golden file usa o mesmo contrato de dados que o sistema real vai produzir em runtime, para que o caso de teste possa ser comparado por igualdade estrutural direta contra a saída do validador, sem camada de tradução.

> ⚠️ **`astGenerated` não é mais sinônimo de "renderizável".** Desde a decisão de renderização degradada (`RULES.md` §5), erro semântico **não** impede o desenho: a AST parcial sempre renderiza o que for renderizável, com o elemento problemático marcado. `astGenerated: false` significa apenas *"não existe árvore"* — ou seja, `SYNTAX_ERROR` puro. Um único caso desta suíte tem esse valor.

### 2.1 Por que `data` e não `message`

A mensagem textual saiu do contrato (`AST_SCHEMA.md` §1.2). O motivo não foi simplificação — foi **cobertura**. Antes, era a `message` que verificava *sobre o quê* o diagnóstico falava; removê-la sem repor nada teria sido uma regressão. O caso que demonstra isso está nesta suíte: `conformist-core` e `conformist-core-bbm` exercitam os dois gatilhos disjuntos do mesmo code. Sem `data`, os dois asseririam a mesma `severity`, o mesmo `code` e spans que diferem por uma coluna acidental — e uma implementação que disparasse o gatilho errado passaria nos dois testes. Com `data`, eles divergem em `trigger: "conformist"` × `trigger: "bbm"`, que é o campo que importa.

O texto renderizado é verificado à parte, contra o `MESSAGES.md`, pela checagem mecânica de placeholders descrita lá (§1). Reformular uma frase ou revisar a tradução **não quebra nenhum caso desta suíte**.

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
    result.diagnostics.map(d => ({ severity: d.severity, code: d.code, data: d.data, span: d.span })),
    expected.diagnostics
  );
}
```

`description`, `interpretationNote`, `astNotes` e `partialAstNotes` são documentação — não entram na asserção automatizada, mas devem ser lidos por quem for implementar ou depurar uma falha.

**A ordem do array é normativa.** `deepEqual` compara arrays ordenados, e a ordem de emissão está fixada em `RULES.md` §3.3 (fase → linha → coluna inicial → coluna final → code alfabético). A ordem de **todos** os casos multi-diagnóstico desta suíte foi verificada programaticamente contra essa regra — nenhuma foi escrita à mão.

---

## 4. Convenção de `span`

- **1-indexed** em linha e coluna, consistente com `GRAMMAR.md`/`AST_SCHEMA.md`.
- **`column` é contada em unidades de código UTF-16** (`AST_SCHEMA.md` §1), não em bytes. Seis inputs desta suíte têm acentuação PT-BR, então a diferença é observável: a linha 11 de `malformed-suppression-unknown-code` tem 85 unidades UTF-16 e 87 bytes UTF-8, e o span esperado usa a primeira contagem. Nenhum caractere fora do Plano Multilíngue Básico aparece na suíte, então as contagens em UTF-16 e em code points coincidem em todos os 44 casos — mas a normativa é UTF-16.
- **`end` é exclusivo** (aponta um caractere depois do último caractere do trecho), estilo LSP — ex: a palavra `"OHS"` de 3 caracteres começando na coluna 5 tem `start.column: 5` e `end.column: 8`.
- Erros ligados a um **token/nó específico** (uma tag, um identificador, uma declaração): `span` cobre exatamente esse trecho.
- Erros de **relação inteira** (`SEPARATION_CONFLICT`, `DUPLICATE_RELATIONSHIP`, `SELF_RELATIONSHIP`, `EXTERNAL_ONLY_RELATIONSHIP`, e os avisos estratégicos por relacionamento): `span` cobre a linha de relacionamento inteira, do primeiro ao último caractere não-branco.
- Erros de **escopo de arquivo inteiro**, sem um nó único ao qual apontar (`INVALID_DOMAIN_CARDINALITY` com zero domains): `span` cobre do início ao fim do arquivo.
- Diagnósticos de **escopo agregado** (`EXCESSIVE_SHARED_KERNEL`): `span` aponta para a abertura do bloco `mapping` como âncora. `DOMAIN_WITHOUT_CORE`, também agregado, ancora na declaração do `domain`.
- Diretivas de supressão (`MALFORMED_SUPPRESSION`, `UNUSED_SUPPRESSION`): `span` cobre a linha da **diretiva**, não a linha alvo.
- Em caso de **duplicidade/multiplicidade** (`DUPLICATE_CONTEXT`, `DUPLICATE_SUBDOMAIN`, `DUPLICATE_RELATIONSHIP`, `INVALID_DOMAIN_CARDINALITY` com múltiplos domains): a convenção é apontar para a **segunda ocorrência** (a que "causa" o problema), não a primeira.

**Toda regra tem exatamente uma linha-âncora.** Isso não é coincidência: é o que torna a diretiva de supressão de linha (`RULES.md` §4) universalmente suficiente, sem precisar de variante de bloco ou de arquivo.

Os spans desta suíte foram calculados programaticamente (script auxiliar, não incluído na suíte final) para evitar erro de contagem manual — mas **ainda não foram verificados contra um parser real**, já que ele não existe. Trate-os como a especificação-alvo, e ajuste a suíte se a tokenização real de um parser implementado divergir em algum detalhe.

---

## 5. Três classes de nota especial nesta suíte

### 5.1 Diagnósticos que se sobrepõem por natureza

`role-conflict` **sempre** dispara mais de um `DiagnosticCode` para a mesma linha, porque as regras são estruturalmente interdependentes: colocar `[C]` e `[S]` no mesmo lado força necessariamente uma violação de posição para um dos dois, já que um é upstream-only e o outro downstream-only. Uma implementação que reporte só um dos dois está incompleta. `conformist-core-bbm` é o outro caso do gênero, por outro motivo: `[BBM]` é a única tag que não documenta contrato nenhum, então uma linha que só a carrega dispara `UNDOCUMENTED_CONTRACT` junto.

### 5.2 Casos cuja resposta depende do princípio do erro-raiz

A maioria das `interpretationNote` desta suíte existe por causa de uma coisa só: **o que NÃO está na lista de diagnósticos, e por quê**. Um `error` remove o elemento do pipeline (`RULES.md` §3.1), e a consequência é que vários casos "deveriam" disparar uma segunda regra e deliberadamente não disparam:

| Caso | O que não aparece, e por quê |
|---|---|
| `root-error-cascade` | `PHANTOM_REFERENCE` — o contexto órfão *foi* declarado, só no lugar errado. É o caso-bandeira do princípio. |
| `upstream-only-tag-misplaced`, `downstream-only-tag-misplaced`, `protection-conflict` | `CORE_UPSTREAM_OF_GENERIC` — a linha morreu na fase 4, antes da fase 5. |
| `invalid-subdomain-type` | `UNMAPPED_CONTEXT` do contexto interno — o subdomínio inválido levou o filho junto. Em compensação, `DOMAIN_WITHOUT_CORE` **aparece**, porque não sobrou nenhum `core` válido. |
| `duplicate-subdomain` | tudo sobre a linha do mapping que referencia o contexto do subdomínio inválido. |
| `mutual-tag-with-external` | `CORE_IN_SHARED_KERNEL`. |
| `self-relationship` | `UNDOCUMENTED_CONTRACT`, apesar de a linha não ter tag nenhuma. |

Esse é o comportamento desejado — o conserto é iterativo, e a contagem de diagnósticos fica próxima da contagem de erros reais do usuário — mas é exatamente o tipo de coisa que uma implementação erra sem perceber. Por isso está escrito caso a caso.

### 5.3 Lacunas de especificação encontradas ao escrever esta versão da suíte

Escrever os casos **é** uma auditoria da especificação: para saber a resposta exata de um arquivo, é preciso rodar todas as 34 regras contra ele mentalmente, e é aí que os buracos aparecem. Quatro foram encontrados e fechados no `RULES.md` durante esta reescrita:

1. **`UNMAPPED_CONTEXT` num arquivo sem `mapping`.** Como estava escrito, todo contexto de um arquivo sem bloco `mapping` era "não mapeado" — o que transformava metade dos casos da suíte num festival de `info`. A regra ficou inerte quando não há mapa nenhum: um modelo em que o mapeamento não começou é rascunho.
2. **`UNMAPPED_CONTEXT` e referências em linhas inválidas.** Um contexto citado apenas numa linha que outra regra invalidou continua "referenciado" — reportá-lo seria um diagnóstico derivado de um erro, que o §3.1 proíbe.
3. **`CONFORMIST_CORE` quando o `[ACL]` já está lá.** O gatilho (b) disparava mesmo com o `core` já carregando `[ACL]` — ou seja, a ferramenta aconselhava um conserto que o autor já tinha aplicado. Encontrado ao montar `inconsistent-bbm`, e fechado com uma exceção explícita.
4. **Alcance da invalidação sobre os filhos.** Não estava escrito se um `subdomain` inválido levava seus contextos junto para fora do pipeline. Encontrado ao montar `invalid-subdomain-type`; agora está no §3.1.

Isso mantém a tradição da v0.1.0, em que escrever a suíte encontrou duas contradições estruturais reais na gramática (`INVALID_SUBDOMAIN_TYPE` e `ORPHAN_CONTEXT` eram código morto).

---

## 6. Cobertura atual

44 casos, cobrindo os **35 `DiagnosticCode`** de `AST_SCHEMA.md` §1.3, mais dois casos de zero diagnósticos.

| # | Caso | `DiagnosticCode` esperado(s) | Fase | Severidade |
|---|---|---|:---:|---|
| 1 | `syntax-error` | `SYNTAX_ERROR` | 0 | error |
| 2 | `orphan-context` | `ORPHAN_CONTEXT` | 1 | error |
| 3 | `orphan-subdomain` | `ORPHAN_SUBDOMAIN` | 1 | error |
| 4 | `removed-construct-sw` | `REMOVED_CONSTRUCT` | 1 | error |
| 5 | `invalid-domain-cardinality-zero` | `INVALID_DOMAIN_CARDINALITY` | 2 | error |
| 6 | `invalid-domain-cardinality-multiple` | `INVALID_DOMAIN_CARDINALITY` | 2 | error |
| 7 | `invalid-subdomain-type` | `INVALID_SUBDOMAIN_TYPE` + `DOMAIN_WITHOUT_CORE` | 2, 5 | error, warning |
| 8 | `duplicate-context` | `DUPLICATE_CONTEXT` | 2 | error |
| 9 | `duplicate-context-external` | `DUPLICATE_CONTEXT` | 2 | error |
| 10 | `duplicate-subdomain` | `DUPLICATE_SUBDOMAIN` | 2 | error |
| 11 | `phantom-reference` | `PHANTOM_REFERENCE` | 3 | error |
| 12 | `self-relationship` | `SELF_RELATIONSHIP` | 3 | error |
| 13 | `duplicate-relationship` | `DUPLICATE_RELATIONSHIP` | 3 | error |
| 14 | `external-only-relationship` | `EXTERNAL_ONLY_RELATIONSHIP` | 3 | error |
| 15 | `upstream-only-tag-misplaced` | `UPSTREAM_ONLY_TAG_MISPLACED` | 4 | error |
| 16 | `downstream-only-tag-misplaced` | `DOWNSTREAM_ONLY_TAG_MISPLACED` | 4 | error |
| 17 | `mutual-tag-on-directional` | `MUTUAL_TAG_ON_DIRECTIONAL` | 4 | error |
| 18 | `positional-tag-on-mutual` | `POSITIONAL_TAG_ON_MUTUAL` | 4 | error |
| 19 | `incomplete-mutual-tag` | `INCOMPLETE_MUTUAL_TAG` | 4 | error |
| 20 | `mutual-tag-with-external` | `MUTUAL_TAG_WITH_EXTERNAL` | 4 | error |
| 21 | `separation-conflict` | `SEPARATION_CONFLICT` | 4 | error |
| 22 | `separation-conflict-bbm-exempt` | — (0 diagnósticos) | — | — |
| 23 | `role-conflict` | `ROLE_CONFLICT` + `DOWNSTREAM_ONLY_TAG_MISPLACED` | 4 | error |
| 24 | `protection-conflict` | `PROTECTION_CONFLICT` | 4 | error |
| 25 | `conformist-core` | `CONFORMIST_CORE` (`trigger: conformist`) | 5 | warning |
| 26 | `conformist-core-bbm` | `CONFORMIST_CORE` (`trigger: bbm`) + `UNDOCUMENTED_CONTRACT` | 5 | warning, info |
| 27 | `generic-without-ohs` | `GENERIC_WITHOUT_OHS` | 5 | warning |
| 28 | `core-upstream-of-generic` | `CORE_UPSTREAM_OF_GENERIC` | 5 | warning |
| 29 | `core-in-shared-kernel` | `CORE_IN_SHARED_KERNEL` | 5 | warning |
| 30 | `domain-without-core` | `DOMAIN_WITHOUT_CORE` | 5 | warning |
| 31 | `inconsistent-bbm` | `INCONSISTENT_BBM` | 5 | warning |
| 32 | `incomplete-customer-supplier` | `INCOMPLETE_CUSTOMER_SUPPLIER` | 5 | warning |
| 33 | `excessive-shared-kernel` | `EXCESSIVE_SHARED_KERNEL` | 5 | info |
| 34 | `undocumented-contract` | `UNDOCUMENTED_CONTRACT` | 5 | info |
| 35 | `unmapped-context` | `UNMAPPED_CONTEXT` | 5 | info |
| 36 | `empty-subdomain` | `EMPTY_SUBDOMAIN` | 5 | info |
| 37 | `pl-without-ohs` | `PL_WITHOUT_OHS` | 5 | info |
| 38 | `suppression-valid` | `GENERIC_WITHOUT_OHS` (o outro é suprimido) | 5 | warning |
| 39 | `unused-suppression` | `UNUSED_SUPPRESSION` | 6 | info |
| 40 | `malformed-suppression-unknown-code` | `UNDOCUMENTED_CONTRACT` + `MALFORMED_SUPPRESSION` | 5, 6 | info |
| 41 | `malformed-suppression-missing-justification` | `UNDOCUMENTED_CONTRACT` + `MALFORMED_SUPPRESSION` | 5, 6 | info |
| 42 | `malformed-suppression-not-suppressible` | `PHANTOM_REFERENCE` + `MALFORMED_SUPPRESSION` | 3, 6 | error, info |
| 43 | `root-error-cascade` | `ORPHAN_CONTEXT` | 1 | error |
| 44 | `valid-baseline` | — (0 diagnósticos, sanity check) | — | — |

**Casos que valem por mais do que o code que dão nome ao diretório:**

- **`valid-baseline`** é o teste mais exigente da suíte, porque precisa passar por **todas** as 34 regras em silêncio. Ele é idêntico ao exemplo canônico de `GRAMMAR.md` §4, e os dois devem ser mantidos em sincronia.
- **`root-error-cascade`** e as notas de §5.2 verificam o princípio do erro-raiz, que não tem code próprio e por isso não apareceria numa suíte organizada só por code.
- **`separation-conflict-bbm-exempt`** e **`suppression-valid`** verificam **ausências**: uma exceção de regra e uma supressão que funcionou. Um validador ansioso demais falha nos dois.
- **`malformed-suppression-unknown-code`** verifica a chave primária da ordenação: um diagnóstico de fase 5 na linha 12 vem **antes** de um de fase 6 na linha 11.

---

## 7. Mudanças em relação à v0.1.1, e lacunas conhecidas

**O que mudou nesta reescrita** (v0.1.1 → v0.2.0, 20 → 44 casos):

- **Formato:** `message` → `data` em todos os `expected.json` (`AST_SCHEMA.md` §1.2), e o executor da §3 mudou junto.
- **Removido:** `separation-conflict-sw-directional` — a regra que ele testava deixou de existir com a tag `[SW]`. Em seu lugar entrou `removed-construct-sw`, que testa o **diagnóstico de migração** para quem ainda escrever a tag antiga.
- **Renomeados:** os quatro casos de warning perderam o sufixo `-warning` do diretório, acompanhando a remoção do sufixo `_WARNING` dos codes.
- **Reescritos:** `valid-baseline` (disparava três coisas com o catálogo novo, entre elas o `CORE_UPSTREAM_OF_GENERIC` que ele próprio ensinava a cometer); `excessive-shared-kernel` (severidade `info`, limiar 3+, e os SK movidos para contextos `supporting`, já que com `core` o diagnóstico grave seria outro); `conformist-core` e `conformist-core-bbm` (o sistema legado virou contexto `external`, o que também elimina o `GENERIC_WITHOUT_OHS` que a versão anterior deixava escapar sem registrar); `role-conflict` (ordem invertida pela regra de ordenação).
- **21 casos novos**, cobrindo os codes que nasceram nesta versão da linguagem.

**Lacunas conhecidas / próximos incrementos:**

- Não há casos de **combinação larga** (um arquivo com muitos problemas independentes em contextos diferentes), úteis para verificar que o validador não para no primeiro problema. Os casos multi-diagnóstico atuais são todos de interação *intencional* entre duas regras.
- Não há golden files para os **presets** completos do produto (E-Commerce, Simple Domain — PRD GH-001); esta suíte testa regras isoladas, não os arquivos de exemplo reais que o playground vai carregar. Quando existirem, valem como um segundo `valid-baseline` cada.
- Os spans continuam sendo **especificação-alvo**, não verificados contra um parser real.
- Não há caso de **`SYNTAX_ERROR` dentro de um bloco `external`** nem de diretiva de supressão fora do `mapping` — ambos devem funcionar, mas nenhum teste garante.

---

## Changelog

Histórico de versões centralizado em [`CHANGELOG.md`](./CHANGELOG.md) (seção `## TEST_SUITE.md`). Versão atual: **v0.2.1**. Qualquer alteração a este arquivo deve ganhar uma entrada nova lá, não aqui.
