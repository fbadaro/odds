# PROPAGATION-MAP: onde cada decisão do `GRILLING.md` caiu

Versão: **v0.1.0** · Conferido em **2026-08-24**, contra o repositório no commit `0ac7a23`.

## 0. Propósito deste documento

O `GRILLING.md` declara, no banner de encerramento, que *"as 25 decisões (D1–D25) estão refletidas em todos os artefatos"*. Essa frase era, até aqui, **uma afirmação sem contraparte conferível** — e duas auditorias posteriores àquela declaração encontraram lacunas do mesmo estado (a unidade de `column`, prosa dentro de `data`), o que é evidência direta de que "propagado" tinha sido lido como "escrito", não como "verificado". É o débito **D-004** do `HEALTH.md`.

Este arquivo fecha esse débito da única maneira que o §6.5 do `HEALTH.md` aceita: **decisão a decisão, com o artefato e a seção onde ela efetivamente mora**, conferidos abrindo o arquivo, não lembrando dele.

**O que este documento não é.** Não é normativo: ele não decide nada, não cria regra e não pode ser citado como fonte de comportamento. Onde ele divergir de um artefato, **o artefato está certo** — a mesma hierarquia que o `GRILLING.md` já declara para si. Também não substitui o `GRILLING.md`: lá está o *porquê* de cada decisão, com as alternativas rejeitadas; aqui está apenas o *onde*.

---

## 1. Como foi conferido

Para cada decisão, a célula **"Artefatos a atualizar"** da tabela `GRILLING.md` §3 foi lida como uma lista de obrigações, e cada obrigação foi verificada no arquivo de destino — seção aberta, produção/tipo/regra localizados, golden file inspecionado quando a célula prometia um. Uma decisão só recebe ✅ quando **toda** obrigação da célula tem contraparte encontrada.

Três resultados são possíveis, e o terceiro é o mais informativo:

- ✅ **Conferido** — tudo o que a célula prometeu existe onde ela disse.
- ⚠️ **Conferido com desvio** — a decisão está propagada, mas *não* na forma ou no lugar que a célula previu. Os desvios estão detalhados na §3, e em todos eles a execução está certa e a previsão é que envelheceu.
- ❌ **Não propagado** — nenhuma ocorrência. **Não houve nenhum.**

---

## 2. O mapa

| # | Decisão, em uma linha | Onde caiu — conferido | Status |
|---|---|---|:-:|
| **D1** | A ODDS é um linter opinativo, não notação neutra | `PRD.md` §2.4 (linha *Design opinion* → **Opinionated linter**) e §4.6 (catálogo completo, três severidades) · `RULES-EN.md`/`RULES-PT.md` §0.1 · `AST_SCHEMA.md` §1.3 (35 codes) · `golden-files/` (44 casos) | ✅ |
| **D2** | Três severidades; a severidade sai do **nome** do code | `AST_SCHEMA.md` §1.1 (`DiagnosticSeverity` + a nota de nomenclatura) e §1.3 (21 `error`, 7 `warning`, 7 `info`) · `RULES-EN.md`/`RULES-PT.md` §1 e §2 (seções tituladas por severidade) · `PRD.md` §5.2 (painel com três níveis) | ✅ |
| **D3** | Supressão mora no arquivo, alcança `warning` e `info`, nunca `error` | `GRAMMAR.md` §1 (nota: comentários deixaram de ser universalmente descartáveis) · `AST_SCHEMA.md` §2.1 (`ProgramNode.suppressions`) · `RULES-EN.md`/`RULES-PT.md` §4 · `PRD.md` §5.2 · goldens `suppression-valid`, `malformed-suppression-not-suppressible` | ✅ |
| **D4** | Diretiva exclusivamente de linha, justificativa obrigatória | `GRAMMAR.md` §1 (produção `suppression_directive`) · `AST_SCHEMA.md` §1.3 (`MALFORMED_SUPPRESSION`, `UNUSED_SUPPRESSION`, fase 6) · `RULES-EN.md`/`RULES-PT.md` §4 · goldens `malformed-suppression-{missing-justification,unknown-code,not-suppressible}`, `unused-suppression` | ✅ |
| **D5** | Sistemas de terceiros são cidadãos de primeira classe | `GRAMMAR.md` §2 (produção `external_decl`) · `AST_SCHEMA.md` §3 (`ExternalBlockNode`) · `RULES-EN.md`/`RULES-PT.md` §0.5 item 3 · `PRD.md` §4.1 · goldens `duplicate-context-external`, `external-only-relationship` | ⚠️ |
| **D6** | O externo mora num bloco `external { }` dentro do `domain` | `GRAMMAR.md` §1 (`external` em `reserved_word`) e §2 (ordem em `domain_decl`) · `AST_SCHEMA.md` §3 e §5 (`SymbolTableEntry.isExternal`, `subdomainName` opcional) · `RULES-EN.md`/`RULES-PT.md` §0.5 item 3 (a contradição é **nomeada**, não escondida) · `PRD.md` §4.1 e §4.4 · `CLAUDE.md` | ⚠️ |
| **D7** | Princípio da autoria: nenhuma regra pressupõe controle sobre o sistema julgado | `RULES-EN.md`/`RULES-PT.md` §0.4 (critério 1) + a marca `External?` na linha de cabeçalho de cada regra — **33 regras marcadas em cada idioma** | ⚠️ |
| **D8** | O bloco `external` é único e anônimo, entre os `subdomain` e o `mapping` | `GRAMMAR.md` §2 (`[ external_decl ]`, ordem fixa) · `AST_SCHEMA.md` §1.3 (`EXTERNAL_ONLY_RELATIONSHIP`, fase 3) e §3 · `RULES-EN.md`/`RULES-PT.md` §1 · golden `external-only-relationship` | ✅ |
| **D9** | Toda tag é escopo de relação — inclusive `[BBM]` | `RULES-EN.md`/`RULES-PT.md` §0.3 (com a fronteira *tag = contrato validável · propriedade = documentação*) e §0.5 item 4 · `AST_SCHEMA.md` §4 (`PatternTag` inalterado) · golden `conformist-core-bbm` intacto, como a célula prometeu | ✅ |
| **D10** | A tag `[SW]` sai da linguagem; `-x-` carrega Separate Ways sozinho | `GRAMMAR.md` §3 (`removed_tag = "SW"`, fora da produção `tag`) · `AST_SCHEMA.md` §4 (`PatternTag` com 9 membros) · `RULES-EN.md`/`RULES-PT.md` §0.2 e §1 (o ramo tag-vs-conector de `SEPARATION_CONFLICT` desapareceu) · `PRD.md` §4.5 · golden `separation-conflict-sw-directional` **excluído**, `removed-construct-sw` no lugar | ✅ |
| **D11** | Três categorias de anotação, não duas | `RULES-EN.md`/`RULES-PT.md` §0.2 (tabela das três categorias + critério para anotação futura) · `PRD.md` §4.3 e §4.5 | ✅ |
| **D12** | A matriz tag × conector × lado é normativa e explícita | `RULES-EN.md`/`RULES-PT.md` §1 (bloco **C**, matriz normativa; bloco **D**, conflitos) · `AST_SCHEMA.md` §1.3 (`MUTUAL_TAG_ON_DIRECTIONAL`, `POSITIONAL_TAG_ON_MUTUAL`, fase 4) · `PRD.md` §4.5 e §4.6 · goldens `mutual-tag-on-directional`, `positional-tag-on-mutual` | ✅ |
| **D13** | `[BBM]` é legal em qualquer conector e qualquer lado | `RULES-EN.md`/`RULES-PT.md` §0.2 (último parágrafo) e §1 (exceção explícita em `SEPARATION_CONFLICT`) · `PRD.md` §4.5 (tabela própria, fora dos oito padrões) · golden `separation-conflict-bbm-exempt` | ✅ |
| **D14** | Inferência de `[SK]`/`[P]` é proibida: os dois lados, sempre declarados | `RULES-EN.md`/`RULES-PT.md` §1 (`INCOMPLETE_MUTUAL_TAG`, com o racional *automatic inference is forbidden*) · `AST_SCHEMA.md` §1.3 (fase 4, `error`) · `CLAUDE.md` · golden `incomplete-mutual-tag` | ✅ |
| **D15** | Identidade de relação é o par não-ordenado `{left, right}` | `RULES-EN.md`/`RULES-PT.md` §1 (identidade + a cláusula de que regra agregada conta **relações distintas, nunca linhas**) · `AST_SCHEMA.md` §1.3 (`DUPLICATE_RELATIONSHIP`, `SELF_RELATIONSHIP`, fase 3) · `PRD.md` §4.6 · goldens `duplicate-relationship`, `self-relationship` | ✅ |
| **D16** | `message` sai do contrato; `data` entra | `AST_SCHEMA.md` §1.2 (`Diagnostic` = `severity` + `code` + `span` + `data`) · `TEST_SUITE.md` §2 e §2.1 · os **44** `expected.json` (nenhum com `message`) · `MESSAGES.md`, artefato novo, 38 templates PT+EN · `RULES-EN.md`/`RULES-PT.md` (sem strings de mensagem) · `PRD.md` §5.2 | ✅ |
| **D17** | Erro não bloqueia a renderização: o diagrama degrada por elemento | `RULES-EN.md`/`RULES-PT.md` §5 · `PRD.md` §4.6 e §5.2 (marcadores no canvas, diagrama obsoleto marcado) · `AST_SCHEMA.md` §1.4 (`astGenerated` deixa de ser proxy de "renderizável") · `TEST_SUITE.md` §2 (mesma nota, do lado da suíte) | ✅ |
| **D18** | Princípio do erro-raiz, em leitura larga | `RULES-EN.md`/`RULES-PT.md` §3.1 · `AST_SCHEMA.md` §1.4 e §5 (`SymbolTableEntry.valid`, com o comentário que nomeia a cascata evitada) · `GRAMMAR.md` §5.1 (o panic-mode **registra**, não só descarta) · golden `root-error-cascade` | ✅ |
| **D19** | Seis fases; a ordem de emissão é total e mecânica | `RULES-EN.md`/`RULES-PT.md` §3.2 e §3.3 · `AST_SCHEMA.md` §1.3 (fase por code — é a coluna que a célula pedia) · `TEST_SUITE.md` §4 (ordem normativa, verificada programaticamente em todos os casos multi-diagnóstico) · `role-conflict/expected.json` reordenado, com o `interpretationNote` explicando a inversão | ⚠️ |
| **D20** | A versão viaja no payload da URL; construção removida ganha diagnóstico próprio | `PRD.md` §5.5 e §10.3 (GH-003: *"the URL contains … and the ODDS Language Version"*) · `AST_SCHEMA.md` §1.3 (`REMOVED_CONSTRUCT`, fase 1, com `removedIn`) · `RULES-EN.md`/`RULES-PT.md` §6 · golden `removed-construct-sw` | ⚠️ |
| **D21** | Nasce a `ODDS Language Version`, separada das versões editoriais | `CHANGELOG.md` (seção própria + os dois eixos declarados no topo do arquivo) · `PRD.md` §5.5 · `RULES-EN.md`/`RULES-PT.md` §6 · `CLAUDE.md` | ✅ |
| **D22** | SemVer com o corte na **validade do arquivo** | `CHANGELOG.md` (tabela MAJOR/MINOR/PATCH + o argumento contra versionar toda mudança de saída) · `RULES-EN.md`/`RULES-PT.md` §6 (mesma tabela) · `PRD.md` §5.5 (só MAJOR aciona migração) | ✅ |
| **D23** | O catálogo opinativo: 10 regras novas + reclassificação das 4 existentes | `RULES-EN.md`/`RULES-PT.md` §1 e §2 · `AST_SCHEMA.md` §1.3 (35 codes, cada um com fase) · `PRD.md` §4.6 · `TEST_SUITE.md` §6 (44 casos) · `valid-baseline` e `excessive-shared-kernel` reescritos | ⚠️ |
| **D24** | Segundo critério de admissão: a regra tem um **conserto distinto**? | `RULES-EN.md`/`RULES-PT.md` §0.4 (critério 2, com sua aplicação-bandeira: o rebaixamento de `EXCESSIVE_SHARED_KERNEL`) · `CLAUDE.md` | ✅ |
| **D25** | As duas vistas têm poderes expressivos diferentes, e isso é deliberado | `PRD.md` §4.4 (tabela das duas vistas + as duas consequências que não devem ser "consertadas") e §4.5 · `RULES-EN.md`/`RULES-PT.md` §0.5 item 5 · `CLAUDE.md` | ⚠️ |

**Resultado: 25 de 25 propagadas, nenhuma ausente.** Dezoito linhas saíram exatamente como a célula previa; sete trazem desvio de forma, de endereço ou de cronologia — **seis** desvios distintos, porque D5 e D6 compartilham o primeiro.

---

## 3. Os seis desvios entre o previsto e o executado

Cada um destes é a previsão de agosto/2026 envelhecendo contra a execução, e não o contrário. Estão aqui porque um mapa que só dissesse "tudo certo" não valeria a leitura: é justamente onde a célula do `GRILLING.md` erra o endereço que um agente futuro se perde.

**1 · D5/D6 — `ExternalContextNode` nunca existiu.** A célula previa *"`AST_SCHEMA.md` §3 (`ExternalContextNode` ou flag em `ContextNode`)"*, isto é, duas formas possíveis. A execução escolheu uma **terceira**, melhor que as duas: o contexto externo usa o mesmo `ContextNode`, sem tipo próprio e sem flag, porque a externalidade é dada pela **posição na árvore** — estar dentro do `ExternalBlockNode`. O nó nomeia o *bloco*, não o contexto, e o que o Visitor consome é `SymbolTableEntry.isExternal` (§5), derivado dessa posição uma única vez. Uma fonte de verdade em vez de duas. O termo `ExternalContextNode` sobrevive só no `GRILLING.md`, e é por isso que ele está no glossário de vocabulário superado daquele arquivo.

**2 · D7 — a "coluna vale para externo?" virou uma marca por regra.** A célula pedia uma coluna numa tabela. As regras do `RULES.md` não são uma tabela, são entradas em lista, então a informação caiu como marca na linha de cabeçalho de cada uma: `External? ✅ applies` / `❌ cannot fire` / `n/a`. Mesma informação, mesma cobertura (33 regras em cada idioma), sem inventar uma tabela para hospedar uma coluna. Vale registrar o que a própria propagação descobriu: com o bloco `external` existindo, a aplicação-bandeira do princípio virou **estrutural** — um contexto externo não tem tipo de subdomínio, logo `GENERIC_WITHOUT_OHS` e as regras `CORE_*` não conseguem disparar contra ele, sem precisar de cláusula de isenção.

**3 · D19 — parte já estava escrita antes da passada.** A célula é a única do `GRILLING.md` §3 que se declara parcialmente cumprida na origem (*"✅ `RULES-EN.md` §3 e `RULES-PT.md` §3 — já escritas"*). O que restava — fase por code no `AST_SCHEMA.md` §1.3, a referência à ordem no `TEST_SUITE.md` §4, a reordenação de `role-conflict/expected.json` (F17) — foi executado. Não é desvio de conteúdo, é desvio de cronologia, e está registrado para que ninguém leia a exceção como pendência.

**4 · D20 — `[SW]` foi removida na v0.1.0, não na v0.2.** Os exemplos de mensagem escritos em D20 diziam *"`[SW]` foi removida na v0.2"*. Aquele número foi escolhido **antes** de D22 fixar o nascimento da linguagem em v0.1.0. A execução reconciliou tudo para `0.1.0`, e o banner do `GRILLING.md` registra a reconciliação. O texto pré-reconciliação continua no corpo do `GRILLING.md`, onde é registro histórico.

**5 · D23 — os dois casos reescritos não terminaram onde a célula previa.** A célula previa que `valid-baseline` passaria a disparar `CORE_UPSTREAM_OF_GENERIC` (deixando de ser "zero diagnósticos") e que `excessive-shared-kernel` iria de 1 para 3 diagnósticos. **Nenhuma das duas se confirmou, e as duas divergências são corretas:**
- `valid-baseline` foi reescrito para **não** disparar nada. Ele é byte-a-byte o exemplo canônico do `GRAMMAR.md` §4, e um exemplo canônico que dispara aviso ensina o vocabulário errado a todo mundo que o copia. A previsão tratava o arquivo como fixo e a regra como nova; a execução consertou o arquivo, que era o lado errado.
- `excessive-shared-kernel` ficou em **1** diagnóstico porque D24 — decidida *depois*, na mesma rodada — rebaixou a regra para `info` e subiu o limiar de 2 para 3. A previsão de "3 diagnósticos" era da versão da regra que D24 revogou.

As duas razões estão escritas no `interpretationNote` de cada `expected.json`, que é onde um implementador as encontraria.

**6 · D25 — previsto `PRD.md §4.2`, caiu em `§4.4`.** A seção sobre poder expressivo das vistas não foi enxertada na §4.2 (que é a sintaxe declarativa em blocos): ganhou **seção nova**, `### 4.4. Diagram views and their expressive power`, e as seções seguintes foram renumeradas. O `CHANGELOG.md`, na entrada `PRD.md` v1.2.0, já registra a criação da §4.4.

---

## 4. Manutenção

Este mapa envelhece de dois jeitos, e os dois têm remédio barato:

1. **Uma seção citada muda de número.** É o desvio 6 acontecendo de novo. A checagem **C14** do `health_check.py` confere que todo `ARQUIVO.md §N` citado aqui corresponde a um cabeçalho que existe naquele arquivo — se uma seção for renumerada, a aferição falha no mesmo passe, em vez de silenciosamente.
2. **Uma decisão nova é tomada.** D1–D25 é um conjunto **fechado**: são as decisões daquela sessão de grilling, e nenhuma decisão futura entra nesta tabela. Decisão nova vai para `docs/adr/`, não para cá. C14 também confere que as 25 linhas continuam 25, sem lacuna.

O que este mapa **não** promete: que a decisão foi propagada *bem*. Ele afere presença e endereço, não qualidade — a qualidade é o que as outras doze checagens da §8 do `HEALTH.md` medem, cada uma no seu eixo.

---

## Changelog

- **v0.1.0** — artefato novo. Fecha o débito **D-004** do `HEALTH.md`: a propagação do `GRILLING.md`, declarada completa em 2026-08-14, passa a ter evidência decisão a decisão. As 25 decisões foram conferidas contra os artefatos nomeados na célula "Artefatos a atualizar" da tabela `GRILLING.md` §3; **nenhuma ausente**, seis com desvio de forma ou endereço, todos os seis com a execução certa e a previsão errada. O desvio mais informativo é o de D23: os dois golden files reescritos não terminaram no resultado previsto porque uma decisão posterior da mesma rodada (D24) revogou a versão da regra em que a previsão se apoiava. Nasce com a checagem **C14**, que impede o mapa de apodrecer quando uma seção for renumerada.
