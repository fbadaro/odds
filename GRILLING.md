# GRILLING: Avaliação semântica da ODDS antes da implementação

## 0. Propósito deste documento

Registro vivo de uma sessão de *grilling* — interrogatório estruturado dos documentos da ODDS (`PRD.md`, `GRAMMAR.md`, `RULES-EN.md`/`RULES-PT.md`, `AST_SCHEMA.md`, `TEST_SUITE.md` + `golden-files/`) **antes de escrever qualquer linha de código**, com os olhos do padrão do DDD.

O objetivo é mapear a *árvore de decisões* do projeto: cada decisão fechada libera as decisões que dependiam dela. O trabalho acontece em **rodadas** — a cada rodada, todas as perguntas cuja pré-condição já está resolvida são feitas de uma vez; as respostas empurram a fronteira para fora e destravam a rodada seguinte. A sessão termina quando a fronteira está vazia: nenhum ramo por visitar, nada silenciosamente assumido.

**Como ler este arquivo:**
- **§1 Achados factuais** — divergências que já existem entre os documentos. Não são decisões; são bugs de especificação. Vão sendo marcados como resolvidos conforme as rodadas os endereçam.
- **§2 Rodadas** — o histórico de perguntas, recomendações e respostas. Cada rodada é append-only; nada é reescrito depois de respondido.
- **§3 Decisões fechadas** — o extrato consolidado do que já foi decidido, com o artefato que precisa ser alterado por causa dela.
- **§4 Fronteira atual** — o que está aberto agora e o que está bloqueado esperando resposta.

> ⚠️ **Exceção única à política de propagação, aberta a pedido explícito na resposta a Q8b (2026-08-12).** A ordenação de diagnósticos de **D19** foi escrita direto em `RULES-EN.md §3` e `RULES-PT.md §3` durante a rodada, em vez de esperar a passada final. Justificativa para não contaminar o resto: a seção é **aditiva** (não reescreve nenhuma regra existente) e descreve **arquitetura de pipeline**, não texto de regra — é o tipo de conteúdo que as rodadas seguintes não têm por que reescrever. A seção lista deliberadamente **apenas os codes que já existem hoje** nos artefatos, com uma regra de admissão ("todo code novo recebe uma fase quando é adicionado") que absorve, sem edição, todos os codes ainda por criar (D3, D4, D8, D12, D14, D15 e o catálogo de Q10). Nenhuma outra decisão foi propagada.

**Política de propagação (decidida na abertura da sessão):** nenhum artefato (`PRD.md`, `GRAMMAR.md`, `RULES-EN.md`/`RULES-PT.md`, `AST_SCHEMA.md`, `TEST_SUITE.md`, `golden-files/`, `CLAUDE.md`, `CHANGELOG.md`) é alterado durante as rodadas — nem as correções editoriais triviais. Tudo se acumula aqui e é propagado em **uma única passada, ao final da sessão**, quando a fronteira estiver vazia. Motivo: as decisões das rodadas seguintes podem reescrever as anteriores, e editar em paralelo produziria retrabalho e artefatos em estados intermediários inconsistentes. A coluna "artefatos a atualizar" da §3 é a lista de trabalho dessa passada final.

---

## ▶️ Como retomar esta sessão

**Estado em 2026-08-12, fim da segunda sessão.**

**Onde paramos: a fase de perguntas acabou.** As três rodadas fecharam e a fronteira está **vazia** — nenhum ramo por visitar, nada silenciosamente assumido. Total: **25 decisões (D1–D25)** em §3.

- **Rodada 1** (D1–D17) — postura de validação, mundo externo, escopo de tag, matriz tag × conector × lado, identidade de relação, contrato do diagnóstico, renderização.
- **Rodada 2** (D18–D24) — princípio do erro-raiz, fases e ordenação, versionamento, e o **catálogo opinativo**.
- **Rodada 3** (D25) — poder expressivo das duas vistas.

**O que falta é execução, não decisão: a passada final de propagação.** A coluna "artefatos a atualizar" de §3 é a lista de trabalho, e o §4 traz o resumo por arquivo. Nada foi propagado durante as rodadas, com **uma exceção registrada** (D19, ver o aviso logo abaixo).

**Como retomar na prática:** peça "execute a passada final de propagação do `GRILLING.md`". Todo o contexto necessário está aqui — não é preciso reler a conversa.

**`DiagnosticCode` novos decididos** (todos ainda por escrever em `AST_SCHEMA.md`, cada um precisando de **fase** por D19) — **dezoito**:
`MALFORMED_SUPPRESSION`, `UNUSED_SUPPRESSION` (D4) · `EXTERNAL_ONLY_RELATIONSHIP` (D8) · `MUTUAL_TAG_ON_DIRECTIONAL`, `POSITIONAL_TAG_ON_MUTUAL` (D12) · `INCOMPLETE_MUTUAL_TAG` (D14) · `SELF_RELATIONSHIP`, `DUPLICATE_RELATIONSHIP` (D15) · família de migração (D20) · `DUPLICATE_SUBDOMAIN`, `MUTUAL_TAG_WITH_EXTERNAL`, `CORE_UPSTREAM_OF_GENERIC`, `CORE_IN_SHARED_KERNEL`, `DOMAIN_WITHOUT_CORE`, `INCONSISTENT_BBM`, `INCOMPLETE_CUSTOMER_SUPPLIER`, `UNMAPPED_CONTEXT`, `EMPTY_SUBDOMAIN`, `PL_WITHOUT_OHS` (D23). Um code sai (`SW` deixa de existir, D10).

**Achados (§1):** resolvidos F1, F2, F5, F6, F7, F8, F9, F11, F12, F13, F14, F15, F16, F18. Os que restam **não têm decisão pendente** — são execução na passada final: F3, F4 (editoriais), F10 (cai junto com a reescrita do `valid-baseline`), F17 (reordenar `role-conflict/expected.json`).

---

**Status da sessão:** 🟢 **Fronteira vazia.** Rodadas 1, 2 e 3 fechadas (D1–D25). Próximo passo: **passada final de propagação**.

---

## 1. Achados factuais (levantados na leitura inicial)

Estes não são pontos de decisão — são divergências ou omissões já presentes nos artefatos. Cada um precisa de correção independentemente do rumo das rodadas.

### 1.1 Contradições entre artefatos

| # | Achado | Artefatos em conflito | Status |
|---|---|---|---|
| F1 | `CLAUDE.md` afirma que `SK` e `P` **exigem** `<->`. `RULES-EN.md §C` diz que é apenas "recomendado" e que o parser "pode inferir" o outro lado. Não existe `DiagnosticCode` correspondente → hoje `A [SK] --> B` é válido, com zero diagnósticos. Além disso, "o parser *pode* inferir" torna duas implementações igualmente conformes divergentes na saída. | `CLAUDE.md` × `RULES-EN.md §C` × `AST_SCHEMA.md §1` | ✅ **Resolvido por D14:** vira regra dura (`INCOMPLETE_MUTUAL_TAG`), a cláusula de inferência é removida, e o `CLAUDE.md` passa a estar correto |
| F2 | `AST_SCHEMA.md §1` diz que `message` é independente do `code` e pode ser reformulada "sem quebrar testes"; `TEST_SUITE.md §3` faz `deepEqual` incluindo `message`. Um dos dois está errado. | `AST_SCHEMA.md §1` × `TEST_SUITE.md §3` | ✅ **Resolvido por D16:** os dois estavam meio certos — a mensagem sai do contrato (o `AST_SCHEMA` tinha razão), mas o que ela interpola vira campo `data` asserido pelos golden files (o `TEST_SUITE` tinha razão em querer verificar o conteúdo) |
| F3 | `GRAMMAR.md §7` ("Ação pendente fora desta gramática") afirma que a cardinalidade de `domain` e a unicidade de nome de `context` **ainda não foram escritas** no RULES — mas ambas já estão em `RULES-EN.md §1.A`. Seção obsoleta. | `GRAMMAR.md §7` × `RULES-EN.md §1.A` | 🔴 Aberto — correção editorial simples |
| F4 | `PRD.md §4.6` descreve Separation Conflict apenas como "tags de acoplamento em linhas `-x-`", omitindo o caso `[SW]` + conector direcional que o `RULES.md` formalizou depois. | `PRD.md §4.6` × `RULES-EN.md §D` | 🔴 Aberto — correção editorial simples |
| F15 | **`RULES-EN.md` se contradiz dentro da própria seção.** O título de §1 é *"Critical Errors (Block Compilation)"* e a linha 53 diz que erros críticos "block rendering" — mas a entrada de `ORPHAN_CONTEXT` (linha 67) afirma que *"this diagnostic does not block AST generation for the rest of the file"*. Ou seja, "erro crítico bloqueia" **já é falso** no documento normativo, para pelo menos um code. Levantado ao checar os fatos de Q7. | `RULES-EN.md §1` × `RULES-EN.md §1` (interno) | ✅ **Resolvido por D17:** a contradição se resolve pelo lado da exceção — nenhum erro bloqueia; a renderização degrada por elemento |
| F16 | **As mensagens carregam a severidade embutida no texto.** As strings de aviso do `RULES.md` começam com `⚠️` (`RULES-EN.md:136`, `RULES-PT.md:136-137`, `:149`). Com D2 (três níveis) a severidade virou campo, então o emoji duplica informação — e fica **errado** para qualquer regra que a Rodada 2 reclassifique como `info`. | `RULES-EN.md`/`RULES-PT.md` × D2 | ✅ **Resolvido por D16:** o emoji sai das strings; severidade é campo e ícone é decisão do painel |

### 1.2 Lacunas silenciosas (nenhum documento decide)

| # | Lacuna | Status |
|---|---|---|
| F5 | ✅ **Resolvido por D12.** Tag posicional em `<->`: `A [OHS] <-> B` não tem regra. O RULES só menciona de passagem, *dentro do escopo do* `GENERIC_WITHOUT_OHS_WARNING`, que "`[OHS]` não é tag válida em `<->` ou `-x-`" — nunca virou regra própria nem `code`. | ✅ **Resolvido:** `POSITIONAL_TAG_ON_MUTUAL` |
| F6 | ✅ **Resolvido por D13.** `[BBM]` numa linha `-x-` configura `SEPARATION_CONFLICT`? BBM não é tag de integração (foi deliberadamente excluída da lista do `UNDOCUMENTED_CONTRACT_WARNING`), mas a regra de separação não se pronuncia. | ✅ **Resolvido:** legítimo — `SEPARATION_CONFLICT` ganha exceção explícita para `[BBM]` |
| F7 | Sem regra para: auto-relação (`A --> A`), duplicata literal (mesma linha repetida), duplicata equivalente (`A --> B` + `B <-- A`) e contradição direta (`A --> B` + `A -x- B` no mesmo `mapping`). | ✅ **Resolvido por D15:** identidade = par não-ordenado; `SELF_RELATIONSHIP` + `DUPLICATE_RELATIONSHIP` cobrem os quatro casos |
| F8 | Nome de `subdomain` duplicado não tem regra — só `context` tem unicidade garantida (`DUPLICATE_CONTEXT`). | ✅ **Resolvido por D23:** `DUPLICATE_SUBDOMAIN` (`error`, fase 2) |
| F9 | A ordem dos diagnósticos é normativa (`TEST_SUITE.md §3` compara o array inteiro por `deepEqual`), mas não existe regra de ordenação documentada. Em `role-conflict`, `DOWNSTREAM_ONLY_TAG_MISPLACED` vem **antes** de `ROLE_CONFLICT` na mesma linha — isso é prioridade de regra, não posição no arquivo, e não está escrito em lugar nenhum. | ✅ **Resolvido por D19** — e já propagado para `RULES-EN.md §3`/`RULES-PT.md §3` |
| F18 | ✅ **Resolvido por D21** (nasce a `ODDS Language Version`). **Não existe "a versão da linguagem ODDS".** O `CHANGELOG.md` afirma explicitamente que *"não existe uma versão única do repositório como um todo"*: cada arquivo tem esquema próprio (`GRAMMAR.md` v0.1.9, `AST_SCHEMA.md` v0.1.2, `TEST_SUITE.md` v0.1.1) e `RULES-EN.md`/`RULES-PT.md` e `PRD.md` **não são versionados de forma alguma**. Mas o significado de um `.odds` é definido pelos três juntos — e o RULES, que é metade da semântica, não tem número. D20 (versão no payload da URL) não tem o que colocar lá. Levantado ao registrar D20. | `CHANGELOG.md` × D20 | 🔴 Aberto (ver Q9a) |
| F17 | **A ordem atual da suíte não segue nenhuma regra — nem a que acabou de ser escrita.** Em `role-conflict/expected.json`, `ROLE_CONFLICT` tem span na coluna 14 (o grupo `[C, S]`) e `DOWNSTREAM_ONLY_TAG_MISPLACED` na coluna 15 (o token `C`), mas o arquivo lista o segundo primeiro. Sob a ordenação posicional de D19 a ordem se inverte. Confirma que a ordem da suíte era prioridade implícita de quem a escreveu, não regra. | `TEST_SUITE.md` × `RULES-EN.md §3` (D19) | 🟡 Resolvido em decisão, pendente de execução: **reordenar `role-conflict/expected.json`** na passada final |

### 1.3 Odores de DDD nos próprios exemplos de referência

| # | Achado | Status |
|---|---|---|
| F10 | `golden-files/valid-baseline/input.odds` e `GRAMMAR.md §4` usam `type: "generic"` dentro de um `subdomain generic`. A propriedade `type` é texto livre com intenção totalmente diferente ("service", "gateway", "legacy system"), mas o exemplo canônico ensina o usuário a duplicar o vocabulário de subdomínio ali. Vocabulário sobrecarregado no exemplo que todo mundo vai copiar. | 🟡 **Corrigido junto com a reescrita de `valid-baseline`** exigida pela tensão 4 de D23 |
| F11 | No mesmo `valid-baseline`, `Checkout [OHS, PL] --> PaymentGateway` coloca o **core como Upstream de um genérico** — o gateway conformando ao Checkout. É a direção invertida do que o DDD estratégico prega (o core consome o genérico, não o contrário), e é justamente o arquivo rotulado "válido, sanity check". | ✅ **Resolvido por D23:** vira a regra `CORE_UPSTREAM_OF_GENERIC` (`warning`) — e o `valid-baseline` passa a disparar ela, provando que o odor era real e forçando a reescrita do arquivo |
| F14 | ✅ **Resolvido por D11 (ampliada) + D13.** **O modelo de dois eixos (D11) estava incompleto: `[BBM]` não pertence a nenhum dos dois.** Aplicando o critério de D11 — *a tag descreve uma solução aplicada sobre uma dependência, ou apenas renomeia a dependência?* — o `[BBM]` não faz nem uma coisa nem outra: ele **caracteriza o sistema**, não a relação. Isso é confirmado pela própria fonte semântica trazida na Rodada 1 ("BBM não mapeia diretamente para um relacionamento de equipe, é uma demarcação de um modelo ou sistema ruim"). Os documentos hoje empilham `[BBM]` junto das nove tags de padrão sem registrar essa diferença — e é ela que explica por que o BBM é a única tag sem regra de posição, sem regra de conflito, e cuja única função é alimentar um warning. O modelo a documentar tem **três** categorias de anotação, não duas: forma da dependência (conector), solução na fronteira (tag de padrão) e caracterização do sistema (`[BBM]`, ocupante único). | ✅ **Resolvido:** o modelo documentado passa a ter três categorias, e `[BBM]` é ocupante único da terceira |
| F13 | **A decisão D9 quebra um invariante declarado.** `RULES-EN.md`, seção Context Properties, afirma literalmente que os metadados são "informational (…) does not participate in any Team Relationship or Context Map Pattern validation" e que "none of these properties currently trigger a Critical Error or Lint Warning on their own". Mover `[BBM]` para propriedade de contexto (D9) faz dela **a primeira propriedade normativa** — ela alimentaria o gatilho (b) do `CONFORMIST_CORE`. Isso não é um detalhe de redação: hoje existe uma fronteira limpa ("tag = contrato validável / propriedade = documentação") que responde sozinha por que `maturity: legacy` e `team` não disparam regras. Com `bbm` como propriedade, essa resposta deixa de existir, e o catálogo da Rodada 2 herda a pergunta em aberto. Levantado ao questionar o valor real de Q3a. | ✅ **Resolvido por Q3a → (d):** a fronteira foi preservada, `[BBM]` continua tag, e a frase do `RULES.md` sobre metadados informacionais segue válida sem ressalva |
| F12 | `golden-files/excessive-shared-kernel-warning` tem dois contextos `core` compartilhando kernel com um `generic`. O único warning que dispara é "SK demais" — o cheiro mais grave (core acoplado fisicamente a um subdomínio genérico) passa batido. | ✅ **Resolvido por D23:** vira `CORE_IN_SHARED_KERNEL` (`warning`); o caso sai de 1 para 3 diagnósticos e precisa ser reescrito |

---

## 2. Rodadas

### Rodada 1 — Decisões-raiz

**Enviada em:** 2026-08-10 · **Status:** 🔴 aguardando respostas

Sete decisões cuja resposta não depende de nenhuma outra pergunta em aberto. Quase todo o resto da árvore pende de pelo menos uma delas.

---

❓ **Q1** — **Postura de fidelidade ao DDD**

A ODDS é uma *notação fiel* (valida só integridade estrutural e coerência de padrões, e deixa o julgamento arquitetural para o humano) ou um *linter opinativo que ensina DDD* (opina sobre a qualidade do desenho estratégico)?

O PRD vende a segunda ("não é só uma ferramenta de desenho, é um validador de arquitetura que ensina boas práticas"), mas o conjunto de warnings hoje é raso: não existe nada sobre domínio sem nenhum `core`, sobre core como Upstream de genérico, sobre core dentro de um Shared Kernel, sobre contexto declarado e nunca mapeado, sobre subdomínio vazio.

Se a resposta for "opinativo", isso abre uma rodada inteira sobre *quais* regras adicionar; se for "fiel", removemos ambição do PRD em vez de deixá-la implícita.

➡️ **Recomendação:** Opinativo, mas com os warnings estratificados em dois níveis de severidade (`warning` = violação de padrão razoavelmente consensual na literatura; `info`/`hint` = opinião de estilo, silenciável). O valor diferencial da ODDS frente ao Context Mapper é exatamente esse feedback; mas misturar "seu core está refém de um BBM" com "você não declarou tag" no mesmo balde de ⚠️ vai treinar o usuário a ignorar o painel inteiro.

**Resposta:** ✅ **Opinativo.** Confirmado o posicionamento de linter que ensina DDD, e com pedido explícito de **mapear o catálogo de boas práticas** que vão virar feedback ao usuário.

**Consequência imediata:** o catálogo de regras opinativas é o entregável da Rodada 2 — ele não pode ser montado agora porque Q2 (contextos externos) e Q3 (escopo do `[BBM]`) mudam *quais* regras são sequer expressáveis. Exemplo concreto: se Q2 criar contexto externo, a regra "genérico Upstream sem OHS" precisa ser suprimida para sistemas de terceiros (o usuário não controla a API deles); se Q3 mover `[BBM]` para propriedade de contexto, a regra "core dependendo de BBM" muda de fonte de dados. A resposta a Q1, porém, destravou um sub-ramo que **não** depende de nada mais — ver Q1b abaixo.

---

❓ **Q1b** — **Quantos níveis de severidade o painel tem?** _(frontier expandida pela resposta a Q1 — não depende de Q2–Q7)_

Hoje `DiagnosticSeverity` é um union fechado de dois valores: `"error" | "warning"` (`AST_SCHEMA.md §1`). Com a ODDS assumidamente opinativa, o catálogo da Rodada 2 vai crescer o balde de `warning` bastante — e existe uma diferença qualitativa grande entre "seu Core Domain está refém de um Big Ball of Mud" (risco estratégico real, consenso na literatura) e "você não declarou tag nessa integração" (higiene de documentação) ou "esse subdomínio está vazio" (rascunho em andamento). Opções:

- **(i)** Manter dois níveis (`error` | `warning`) e aceitar que tudo que é opinião cai no mesmo balde.
- **(ii)** Três níveis (`error` | `warning` | `info`), com `info` silenciável, separando "violação de padrão consensual" de "opinião de estilo / higiene".
- **(iii)** Dois níveis + um eixo ortogonal de categoria (ex: `category: "structural" | "strategic" | "hygiene"`), deixando o filtro do painel operar por categoria em vez de por severidade.

Sub-decisão acoplada: os avisos são **silenciáveis pelo usuário** (um `// odds-disable-next-line CODE`, ou um toggle global no painel)? Um linter opinativo sem escape hatch vira ruído permanente em qualquer modelo do mundo real que tenha uma decisão consciente contrária à regra — e o usuário não tem como "concordar e seguir em frente".

➡️ **Recomendação:** **(ii) + silenciável por linha via comentário.** Três níveis mantém o modelo mental simples (é o que ESLint, TypeScript e todo linter que o público-alvo já usa fazem) e o `info` dá o destino natural para as regras de higiene, sem inflar o contador de ⚠️ que o usuário olha de relance. A categoria de (iii) é atraente mas prematura: sem o catálogo fechado ainda não sabemos se os grupos se sustentam, e é barato adicionar um eixo de categoria depois — é caro tirar. O supressor por comentário é o que transforma "o tool discorda de mim" em "eu registrei que discordo do tool", que é documentação arquitetural legítima e alinhada com o pitch de Architecture as Code. Impacto: `AST_SCHEMA.md §1` (`DiagnosticSeverity`), `GRAMMAR.md §1` (comentário deixa de ser 100% insignificante — vira portador de diretiva), e a suíte de golden files ganha um caso de supressão.

**Resposta:** ✅ **(ii)** — três níveis: `error` | `warning` | `info`.

**Consequências registradas:**
- `DiagnosticSeverity` em `AST_SCHEMA.md §1` deixa de ser um union de dois valores.
- O sufixo `_WARNING` nos codes existentes vira mentira para qualquer regra que caia em `info`. Os quatro codes atuais (`CONFORMIST_CORE_WARNING`, `GENERIC_WITHOUT_OHS_WARNING`, `EXCESSIVE_SHARED_KERNEL_WARNING`, `UNDOCUMENTED_CONTRACT_WARNING`) carregam a severidade no nome — decisão a tomar na passada final: ou renomear todos removendo o sufixo (o `code` passa a nomear a *regra*, e a severidade fica só no campo `severity`), ou aceitar a inconsistência. **Recomendação registrada: renomear**, já que o catálogo da Rodada 2 vai multiplicar esses codes e a suíte de golden files ainda não foi consumida por nenhuma implementação — o custo de renomear nunca mais será tão baixo.
- **Reclassificação dos 4 warnings existentes** (quais viram `info`) fica para a Rodada 2, junto com o catálogo: `UNDOCUMENTED_CONTRACT_WARNING` é candidato óbvio a `info` (higiene de documentação), mas `GENERIC_WITHOUT_OHS_WARNING` depende de Q2 — se contextos externos ganharem cidadania, a regra muda de alvo e talvez de severidade.

---

❓ **Q1c** — **Mecanismo e alcance da supressão** _(frontier expandida por Q1b; não depende de Q2–Q7)_

A opção (ii) trouxe `info` como nível silenciável, mas não fechou *onde mora* a supressão nem *até onde ela alcança*. Isso é uma decisão de linguagem, não de UI: se a supressão mora no arquivo, ela viaja junto no Git, na URL compartilhada e no code review — coerente com o pitch de Architecture as Code —, mas o comentário deixa de ser sintaticamente insignificante (`GRAMMAR.md §1` hoje autoriza o lexer a descartá-los) e a suíte de golden files precisa de casos novos. Se mora na UI, a linguagem fica limpa mas a supressão não sobrevive a compartilhar o link — o colega abre o mesmo desenho e vê avisos diferentes dos seus.

- **(a)** Só `info` é silenciável, via diretiva em comentário (`// odds-disable-next-line CODE`).
- **(b)** `info` **e** `warning` silenciáveis pela mesma diretiva; `error` nunca.
- **(c)** Nada na linguagem — apenas um filtro/toggle visual no painel, por severidade ou por code.
- **(d)** Sem supressão nenhuma nesta versão; adiar até termos uso real e reclamação concreta.

➡️ **Recomendação:** **(b)**, diretiva no arquivo, e `error` explicitamente não-silenciável. Restringir a supressão a `info` (opção a) erra o alvo: ninguém precisa silenciar higiene — o usuário ignora e segue. Quem realmente precisa de escape hatch é o `warning` estratégico, porque é exatamente ali que existem decisões conscientes e defensáveis contra a regra ("sim, esse core conforma ao ERP, foi decisão de negócio, custo assumido e documentado"). `error` fica de fora por princípio: são violações de integridade e coerência — silenciar uma `PHANTOM_REFERENCE` faria o diagrama mentir sobre o próprio modelo, o que é diferente de discordar de um conselho. Opção (c) quebra o compartilhamento por URL (GH-003) e (d) só empurra o problema para depois de a suíte de testes estar escrita.

**Resposta:** ✅ **(b)** — supressão mora no arquivo, alcança `warning` e `info`, e **nunca** `error`.

**Consequência estrutural:** comentários deixam de ser sintaticamente insignificantes. `GRAMMAR.md §1` hoje afirma que "whitespace e comentários são insignificantes sintaticamente e devem ser descartados pelo lexer antes de chegar ao parser" — isso passa a ser falso para comentários que carregam diretiva. A gramática precisa de uma produção `suppression_directive` e o pipeline precisa preservar esses comentários até o validador.

---

❓ **Q1d** — **Granularidade da diretiva e obrigatoriedade de justificativa** _(último ramo aberto de Q1; não depende de Q2–Q7)_

Fechada a existência da supressão, faltam duas escolhas acopladas.

**Granularidade.** Uma objeção real a "só linha": regras de escopo agregado não têm linha natural. `EXCESSIVE_SHARED_KERNEL` conta ocorrências do arquivo inteiro e `INVALID_DOMAIN_CARDINALITY` com zero domains tem span do arquivo todo — como se silencia isso com uma diretiva de linha? Contra-argumento: a convenção de span de `TEST_SUITE.md §4` **já resolve isso** — toda regra agregada recebeu uma âncora obrigatória (`EXCESSIVE_SHARED_KERNEL` ancora na abertura do bloco `mapping`). Ou seja, todo diagnóstico já tem exatamente uma linha-âncora, e granularidade de linha é universalmente suficiente sem inventar mecanismo novo.

**Justificativa.** Obrigatória ou opcional? Uma supressão sem motivo é indistinguível de desistência, e seis meses depois ninguém sabe se foi decisão consciente ou preguiça.

- **(a)** Só linha (`// odds-disable-next-line CODE`), justificativa opcional.
- **(b)** Linha + bloco (`odds-disable` / `odds-enable`) + arquivo, justificativa opcional.
- **(c)** Só linha, justificativa **obrigatória**: `// odds-disable-next-line CONFORMIST_CORE: ERP corporativo, decisão de negócio, custo assumido`.
- **(d)** Linha + arquivo (`odds-disable-file CODE` no topo), justificativa obrigatória.

➡️ **Recomendação:** **(c)**. Arquivos `.odds` são pequenos por natureza — um context map tem dezenas de linhas, não milhares —, então o argumento usual a favor de supressão em bloco/arquivo (ergonomia em arquivo grande) não se aplica; e supressão de arquivo é justamente o mecanismo pelo qual linters são derrotados no atacado, em silêncio. A justificativa obrigatória é o que converte a supressão em **documentação arquitetural** em vez de escape hatch — e isso é literalmente o pitch do produto: se a ODDS é Architecture as Code, "por que decidimos violar esse padrão" é a informação mais valiosa do arquivo inteiro, não um detalhe de configuração. Duas sub-decisões que vão junto na recomendação: **(1)** diretiva malformada (code inexistente, justificativa ausente) **não** é `SYNTAX_ERROR` — é um diagnóstico `info` próprio (`MALFORMED_SUPPRESSION`); um comentário quebrado nunca deve derrubar o parsing do arquivo. **(2)** diretiva que não suprime nada (a regra parou de disparar) também vira `info` (`UNUSED_SUPPRESSION`), para que supressões obsoletas não se acumulem — é o `--report-unused-disable-directives` do ESLint, e sem isso a justificativa apodrece junto com o modelo.

**Resposta:** ✅ **(c)** — diretiva **apenas de linha**, com **justificativa obrigatória**. Sem supressão em bloco nem em arquivo. As duas sub-decisões que acompanhavam a recomendação vão junto: `MALFORMED_SUPPRESSION` e `UNUSED_SUPPRESSION` como diagnósticos `info` próprios.

Forma canônica registrada (sintaxe exata a fechar na passada final): `// odds-disable-next-line <CODE>: <justificativa>`

**Ponto que fica pendente para a passada final** (detalhe de implementação, não decisão de design): a justificativa obrigatória dá estrutura interna ao comentário, então `line_comment` em `GRAMMAR.md §1` deixa de ser "`//` seguido de qualquer coisa". A gramática precisa distinguir comentário livre de diretiva sem tornar `//` ambíguo — o caminho natural é o lexer reconhecer o prefixo `odds-disable-next-line` e só então aplicar a produção estruturada.

---

❓ **Q2** — **Contenção estrita e o mundo externo**

Hoje a hierarquia é rígida: todo `context` vive dentro de exatamente um `subdomain`, todo `subdomain` dentro do único `domain` do arquivo, e o `mapping` só referencia contextos declarados nessa árvore (`PHANTOM_REFERENCE`). Três consequências que nenhum documento reconhece:

- **(a)** No DDD, Bounded Context e Subdomínio são espaços diferentes (solução × problema) e a relação real é n:m — um contexto pode atender dois subdomínios.
- **(b)** **Não existe forma de modelar um sistema de terceiros** (Stripe, um ERP legado de outra empresa, um BBM que você não controla) a não ser mentindo que ele é um contexto de um subdomínio seu — o que é justamente o caso de uso da tag `[BBM]`.
- **(c)** Mapas que cruzam domínios são impossíveis por construção.

Opções: **(i)** aceitar tudo como simplificação deliberada e documentar a limitação; **(ii)** adicionar um `external context` (ou `subdomain external`) de primeira classe, isento das regras de subdomínio; **(iii)** relaxar a contenção para n:m.

➡️ **Recomendação:** **(ii)**, restrito a sistemas externos. A limitação (a) é uma simplificação clássica e defensável — o Context Mapper faz igual, e n:m destruiria a view de contenção aninhada exigida pelo PRD. Mas (b) não é simplificação, é buraco funcional: a tag `[BBM]` existe explicitamente para "sinalizar sistema legado externo de risco" e a linguagem não tem onde declarar esse sistema. Hoje o usuário é forçado a classificá-lo como `generic`, o que faz o `GENERIC_WITHOUT_OHS_WARNING` disparar em cima de um sistema sobre o qual ele não tem poder nenhum — warning inacionável.

**Resposta:** ✅ **(ii)** — sistemas externos/de terceiros ganham cidadania de primeira classe na linguagem. A limitação (a) (Context ⊂ Subdomain 1:1, quando o DDD real é n:m) fica aceita como simplificação deliberada e **precisa ser documentada como limitação explícita**, não deixada implícita. A limitação (c) (mapas multi-domínio) permanece fora de escopo.

**Consequência imediata:** abre a subárvore Q2a (onde o contexto externo mora na hierarquia) e Q2b (de quais regras ele fica isento). Ambas independem de Q3–Q7.

---

❓ **Q2a** — **Onde o contexto externo mora na hierarquia?** _(depende só de Q2)_

Toda a estrutura da linguagem hoje repousa num invariante forte: `context` só existe dentro de `subdomain`, `subdomain` só dentro de `domain` — e `GRAMMAR.md §5.1` investiu em panic-mode recovery justamente para defender esse invariante com mensagem amigável. Onde encaixar um sistema de terceiros sem destruí-lo?

- **(a)** `external context Stripe { }` solto direto no `domain`. Colide de frente com o invariante e com a lógica de `ORPHAN_CONTEXT`.
- **(b)** Bloco dedicado, irmão de `subdomain`: `external { context Stripe }`.
- **(c)** Novo valor de `subdomain_type`: `subdomain external ThirdParty { ... }`.
- **(d)** Modificador no contexto, dentro de um subdomínio normal: `subdomain generic Payments { external context Stripe }`.

➡️ **Recomendação:** **(b)**. Preserva o invariante — todo `context` continua morando dentro de um bloco declarado, então `ORPHAN_CONTEXT` e o panic-mode recovery seguem valendo sem exceção nova (um `external context` fora do bloco `external` continua órfão). Rejeito (c) porque `core`/`supporting`/`generic` é vocabulário do **espaço do problema**: classifica a importância estratégica de uma parte do *seu* negócio, e um sistema de terceiros não está no seu espaço de problema de forma alguma — enfiá-lo no mesmo enum mistura duas taxonomias que não são comparáveis, e ainda quebra a regra `INVALID_SUBDOMAIN_TYPE`. Rejeito (d) porque obriga o usuário a escolher um subdomínio para a Stripe — exatamente a mentira que Q2 existiu para eliminar. E (b) dá à view de contenção aninhada um contêiner visual natural ("fora da fronteira do domínio"), que (d) não dá.

**Resposta:** ✅ **(b)** — bloco dedicado `external { }`, irmão de `subdomain`, dentro do `domain`. O invariante estrutural (`context` sempre dentro de um bloco declarado) fica preservado, e `core`/`supporting`/`generic` continua sendo vocabulário exclusivo do espaço do problema.

**Consequência derivada (não é decisão — decorre da forma da linguagem):** contextos externos e internos **compartilham obrigatoriamente o mesmo espaço de nomes**, porque `mapping` referencia contexto por identificador simples (`context_ref = identifier`, sem qualificação de escopo). Logo `DUPLICATE_CONTEXT` passa a valer entre um contexto interno e um externo de mesmo nome, e a `SymbolTable` de `AST_SCHEMA.md §5` precisa acomodar entradas externas — hoje ela assume `subdomainName`/`subdomainType` sempre presentes.

**Tensão a registrar, não resolver agora:** um bloco `external` *dentro* de `domain { }` é conceitualmente contraditório (o externo está, por definição, fora do domínio). A alternativa — declarar externos no nível do `program`, irmãos do `domain` — é mais correta conceitualmente, mas colide com `INVALID_DOMAIN_CARDINALITY` e com a premissa "um arquivo = um domain" que sustenta o compartilhamento por URL. Registro a favor de aninhar dentro do `domain` por pragmatismo, e de nomear a contradição na documentação em vez de fingir que não existe.

**Sub-decisão acoplada:** o contexto externo aceita o mesmo `context_block` de propriedades (`type`, `description`, `responsibilities`, `maturity`, `team`, `technology`)? Recomendação: sim para `type`/`description`/`technology` (documentar *o que* é a Stripe é útil), mas `responsibilities` e `team` são semanticamente estranhos para um sistema que não é seu — decisão de fechar na passada final, sem impacto estrutural.

---

❓ **Q2b** — **De quais regras o contexto externo fica isento?** _(depende só de Q2)_

O argumento que motivou a resposta a Q2 foi o warning inacionável: hoje um sistema de terceiros vira `generic`, dispara `GENERIC_WITHOUT_OHS_WARNING`, e o usuário não pode fazer nada — não controla a API deles. Mas isentar *de tudo* é o extremo oposto e também erra: como você integra com a Stripe é decisão **sua**, e é exatamente o que o mapa deveria documentar.

A linha divisória que proponho: **isenta-se o que pressupõe autoria sobre o sistema; mantém-se o que descreve a sua decisão de integração.** Aplicada às regras de hoje:

| Regra | Vale para externo? | Racional |
|---|---|---|
| `GENERIC_WITHOUT_OHS` | ❌ isento | Você não desenha a API deles |
| `UNDOCUMENTED_CONTRACT` | ✅ vale | Documentar *como* você integra é responsabilidade sua — e mais importante ainda com terceiros |
| `CONFORMIST_CORE` (core conformando / dependendo de BBM) | ✅ vale | É o cenário-alvo da regra; um ERP de terceiro é o BBM clássico |
| `PHANTOM_REFERENCE`, `DUPLICATE_CONTEXT` | ✅ vale | Integridade referencial não tem exceção |
| Regras de posição/conflito de tag (§C/§D) | ✅ vale | Descrevem o contrato, que é escolha sua |

- **(i)** Adotar essa linha divisória como princípio geral, aplicando-a também a cada regra nova do catálogo da Rodada 2.
- **(ii)** Isentar contexto externo de **todos** os warnings (só erros estruturais valem).
- **(iii)** Não isentar de nada — o `external` é só um rótulo visual/semântico, sem efeito sobre validação.

➡️ **Recomendação:** **(i)**, com o princípio escrito explicitamente no `RULES.md` para que toda regra futura já nasça tendo que responder "isso pressupõe que o usuário controla o sistema?". Sem o princípio escrito, cada regra nova vai reabrir essa discussão do zero. (ii) transformaria `external` numa válvula de escape para silenciar o linter — bastaria marcar como externo o que incomoda —, e (iii) desperdiça a decisão de Q2, deixando o problema do warning inacionável exatamente onde estava.

**Resposta:** ✅ **(i)** — princípio da autoria: *isenta-se o que pressupõe controle sobre o sistema; mantém-se o que descreve a decisão de integração do autor*. A tabela de aplicação acima fica valendo, e o princípio deve ser escrito no `RULES.md` como critério obrigatório para toda regra nova.

**Consequência para a Rodada 2:** cada regra do catálogo passa a nascer com uma coluna obrigatória "vale para contexto externo?", respondida pelo princípio. Isso é o que impede o catálogo de virar uma lista de regras que só fazem sentido para sistemas que você mesmo escreveu.

---

❓ **Q2c** — **Forma do bloco `external` e relações externo↔externo** _(último ramo de Q2; depende só de Q2a)_

Fechado o *onde*, faltam três detalhes de forma que mudam a gramática e uma decisão semântica de verdade.

**Forma do bloco** — `external` é um bloco único e anônimo (`external { context Stripe context SAP }`, no máximo um por domínio), ou nomeável e repetível (`external Payments { }` + `external ERP { }`, permitindo agrupar fornecedores)? E onde ele entra na ordem de `domain_decl`, hoje fixada como `[title] {subdomain} [mapping]`?

**Relações externo↔externo** — `Stripe --> SAP`, dois sistemas de terceiros integrando entre si, sem nenhum contexto seu na linha. É válido (documenta que seus dois fornecedores conversam, o que afeta você indiretamente) ou é ruído fora do escopo do *seu* context map?

- **(a)** Bloco único anônimo, posicionado depois dos `subdomain` e antes do `mapping`; relações externo↔externo **permitidas**.
- **(b)** Bloco único anônimo; relações externo↔externo **proibidas** (erro `EXTERNAL_ONLY_RELATIONSHIP`).
- **(c)** Blocos nomeáveis e repetíveis; relações externo↔externo permitidas.
- **(d)** Blocos nomeáveis e repetíveis; relações externo↔externo proibidas.

➡️ **Recomendação:** **(b)**. Bloco único e anônimo porque nomear grupos de fornecedores recria, por outro caminho, a taxonomia que acabamos de recusar em Q2a — e um nome de grupo sem semântica é convite a virar classificação improvisada ("external Legacy", "external Critical") que a ferramenta não sabe validar. Posição fixa entre `subdomain` e `mapping` mantém o arquivo lendo como uma narrativa: *seu* domínio primeiro, a fronteira depois, as integrações por último. E relações externo↔externo proibidas, com erro dedicado, porque um context map é um mapa das **suas** integrações: como a Stripe conversa com o SAP não é decisão sua, não é acionável, e não pode ser validada por nenhuma regra de padrão — pelo mesmo princípio de autoria que você acabou de fechar em Q2b. Permitir isso abriria a porta para o arquivo `.odds` virar um diagrama de sistemas genérico, que é precisamente o que a ODDS não é.

**Resposta:** ✅ **(b)** — bloco `external` único e anônimo, posicionado entre os `subdomain` e o `mapping`; relações externo↔externo proibidas, com code dedicado (`EXTERNAL_ONLY_RELATIONSHIP`, `error`).

**Fecha a subárvore de Q2.** O catálogo de boas práticas da Rodada 2 passa a estar bloqueado por uma única pergunta: Q3 (escopo do `[BBM]`).

---

❓ **Q3** — **Escopo semântico da tag: relação ou contexto?**

Uma tag está presa a *um lado de uma relação específica* ou descreve *o contexto* como um todo? Isso nunca foi declarado, e as regras atuais assumem as duas coisas em momentos diferentes:

- `PROTECTION_CONFLICT` diz "para a mesma integração" → escopo de relação. Logo `A` pode ser `[CF]` com `X` e `[ACL]` com `Y`, o que é correto e desejável.
- Mas `[BBM]` é claramente uma propriedade *do sistema*, não da integração — declarar `[BBM]` em uma linha e esquecer na outra produz um modelo internamente inconsistente, e o gatilho (b) do `CONFORMIST_CORE_WARNING` depende disso estar declarado na linha certa. Idem `[SW]`.

➡️ **Recomendação:** Escopo de relação como regra geral (declarar isso explicitamente no RULES), **exceto** `[BBM]`, que deve migrar de tag de relacionamento para propriedade de contexto (`bbm: true`, ou uma flag dedicada). BBM não descreve um contrato de integração — descreve o estado interno de um sistema. Como tag, obriga repetição em toda linha e permite contradição silenciosa entre linhas. Isso implica reescrever o gatilho (b) do `CONFORMIST_CORE_WARNING` para consultar a propriedade do contexto Upstream, não as tags da linha.

**Resposta:** ✅ **Seguir a recomendação** — tag é escopo de relação por padrão (regra a ser escrita explicitamente no `RULES.md`), e `[BBM]` migra para propriedade de contexto.

**Reforço vindo de D6:** com o bloco `external` existindo, o alvo típico de BBM passou a ter casa própria. Uma propriedade no contexto descreve "esse ERP de terceiro é um pântano" **uma vez**, em vez de repetir a tag em cada uma das N linhas que integram com ele — e elimina a possibilidade de o modelo se contradizer entre linhas.

**Abre:** Q3a (forma da propriedade e destino da tag) e Q3b (a tag `[SW]`, que a pergunta original citou como "idem" e que precisa de tratamento próprio).

---

❓ **Q3a** — **Onde passa a fronteira entre metadado descritivo e metadado normativo?** _(reescrita — ver nota abaixo; depende só de Q3)_

> 📝 **Nota de reescrita.** A versão original desta pergunta oferecia quatro formas para a propriedade BBM (booleana / enum de saúde / valor em `maturity` / tag+propriedade) e perguntava sobre a mensagem de erro da tag órfã. Ao ser questionada ("que problema estamos resolvendo aqui?"), a pergunta não se sustentou: (c) já estava vetada pelos próprios documentos, (d) contradiz D9, (b) era especulação sobre uma taxonomia que ninguém pediu — sobrava `bbm: true`, que é chamada de rotina, não ramo de árvore. O mesmo vale para o texto da mensagem de erro. **Decisões de rotina absorvidas** (registradas, não perguntadas): a propriedade é booleana `bbm: true`, vale para contexto interno e externo, e escrever `[BBM]` gera um code dedicado (`BBM_IS_NOT_A_TAG`) em vez de `SYNTAX_ERROR` genérico — os exemplos atuais de `GRAMMAR.md §4` e `PRD.md §4.5` usam a tag, e BBM é nome de padrão conhecido o bastante para alguém tentar usá-lo como tag por analogia com os outros nove.
>
> O que sobrou é o problema real que estava embaixo, e que é maior: **F13**.

`RULES-EN.md` afirma hoje, sobre as seis propriedades de contexto: *"This metadata is informational (…) does not participate in any Team Relationship or Context Map Pattern validation"* e *"None of these properties currently trigger a Critical Error or Lint Warning on their own."*

Essa frase sustenta uma fronteira limpa e barata de explicar: **tag = contrato validável; propriedade = documentação**. É ela que responde, sem esforço, por que `maturity: legacy` não dispara nada e por que `team` é texto livre sem consequência.

D9 quebra essa fronteira: `bbm` seria a primeira propriedade normativa. E a quebra não fica contida — o catálogo da Rodada 2 tem candidatos que dependem justamente de propriedades (dois contextos do mesmo `team` numa relação Customer/Supplier; `maturity: experimental` num subdomínio `core`). Ou a fronteira se move de forma explícita e principiada agora, ou cada regra nova vai negociá-la de novo.

- **(a)** **Abolir a fronteira:** propriedades são dados como quaisquer outros e podem alimentar regras. Remover a frase do `RULES.md`. `bbm: true` é só a primeira de várias.
- **(b)** **Preservar a fronteira movendo o BBM para fora das propriedades:** BBM vira um **modificador da declaração** do contexto, não um item do `context_block` — ex. `external context OldERP bbm { … }`. Propriedades continuam 100% informacionais; o que é normativo fica visível na própria linha de declaração.
- **(c)** **Fronteira explícita e nomeada:** manter `bbm` dentro do `context_block`, mas dividir o vocabulário em dois grupos documentados — *descritivas* (`title`, `description`, `responsibilities`, `team`, `technology`, `type`) e *normativas* (`bbm`, e o que vier) — com a regra de admissão escrita: uma propriedade só entra no grupo normativo se existir uma regra concreta que a consome.
- **(d)** Reverter D9: BBM volta a ser tag, e a fronteira fica intacta ao custo da contradição silenciosa entre linhas.

➡️ **Recomendação:** **(c)**. (a) é honesto mas joga fora informação: a frase "metadados não validam nada" é uma promessa útil ao usuário — ele preenche `team` e `technology` sem medo de que a ferramenta comece a julgá-lo por isso —, e abolir a fronteira sem substituto transforma cada campo preenchido num risco de warning futuro. (b) é elegante e foi a alternativa que me escapou na primeira versão da pergunta: mantém a promessa intacta e deixa o normativo visível na linha de declaração; perde por um fio porque cria uma segunda sintaxe de anotação de contexto (modificador *e* bloco) para carregar um único bit, e a Fase 4 (Tactical Design) já vai disputar espaço nessa mesma linha. (d) desfaz uma decisão boa por um motivo de forma. (c) mantém uma sintaxe só, preserva a promessa para as seis propriedades existentes, e — o que importa mais — **estabelece o critério de admissão** que o catálogo da Rodada 2 vai precisar: nenhuma propriedade vira normativa sem uma regra concreta que a consuma, o que impede a inflação de campos "que um dia podem ser úteis para validar".

**Resposta:** ✅ **(d)** — **reverter a segunda metade de D9.** `[BBM]` permanece tag de relacionamento; a fronteira "tag = contrato validável / propriedade = documentação" fica **intacta**, e a frase do `RULES-EN.md` sobre metadados serem puramente informacionais continua verdadeira.

**O que sobrevive de D9:** a primeira metade, e agora mais forte — *toda* tag é escopo de relação, **sem exceção alguma**. A regra fica mais simples de escrever e de ensinar do que a versão original ("escopo de relação, exceto BBM").

**O que isso economiza na passada final:** o gatilho (b) do `CONFORMIST_CORE` continua lendo as tags da linha (sem reescrita), o golden file `conformist-core-warning-bbm` sobrevive intacto, `PatternTag` não muda em `GRAMMAR.md §3`/`AST_SCHEMA.md §4`, `PRD.md §4.5` não muda, e tanto o code `BBM_IS_NOT_A_TAG` quanto a propriedade `bbm` deixam de existir.

**O custo aceito, a documentar como limitação conhecida:** `[BBM]` precisa ser repetida em toda linha que toca aquele sistema, e um contexto pode aparecer com `[BBM]` numa linha e sem em outra, sem que nada detecte a contradição. **Mitigação candidata, enfileirada para o catálogo da Rodada 2:** uma regra de consistência (`INCONSISTENT_BBM`) que dispare quando o mesmo contexto aparece com `[BBM]` em algumas relações e sem em outras — fecha o furo sem tocar na fronteira, porque opera sobre tags, não sobre propriedades.

---

❓ **Q3b** — **A tag `[SW]` carrega alguma informação além do conector `-x-`?** _(depende só de Q3)_

Ponto que passou batido na leitura inicial e que a resposta a Q3 expõe: `[SW]` é a única tag que **só** pode aparecer no único conector que já significa a mesma coisa. `RULES.md §D` estabelece que `[SW]` só é válida em linha `-x-`, e que `-x-` não aceita nenhuma tag de integração. Resultado: `[SW]` nunca acrescenta nada a uma linha — ou é redundante, ou é erro. Zero bits de informação.

**Demonstração — todas as posições possíveis de `[SW]` segundo as regras já escritas:**

```odds
mapping {
  Shipping        -x-        PaymentGateway     // 1
  Shipping [SW]   -x-        PaymentGateway     // 2
  Shipping        -x- [SW]   PaymentGateway     // 3
  Shipping [SW]   -x- [SW]   PaymentGateway     // 4
  Shipping [SW]   -->        PaymentGateway     // 5
  Shipping [OHS]  -x-        PaymentGateway     // 6
}
```

| # | Diagnóstico hoje | Significado |
|---|---|---|
| 1 | nenhum | "não integram" |
| 2 | nenhum | "não integram" — **idêntico a 1** |
| 3 | nenhum | idêntico — e nada na spec diz qual lado é o "certo" |
| 4 | nenhum | idêntico |
| 5 | `SEPARATION_CONFLICT` | erro |
| 6 | `SEPARATION_CONFLICT` | erro |

Metade de cima: quatro grafias, um significado, nenhuma regra distinguindo-as — e como `UNDOCUMENTED_CONTRACT` explicitamente não dispara em `-x-`, não há sequer um empurrão para declarar a tag. Metade de baixo: a linha 6 prova que a regra do conector funciona **sem** `[SW]` existir; já a linha 5 é um erro que só existe **porque** `[SW]` existe — uma regra criada para consertar um problema que a própria tag introduziu, com golden file dedicado (`separation-conflict-sw-directional`).

Existe, porém, uma distinção real na própria tabela de Team Relationships do `RULES.md`: *Free* é descrito como "nenhum vínculo organizacional ou técnico de qualquer espécie existe", enquanto o padrão *Separate Ways* é "poderíamos integrar, mas decidimos que o benefício não compensa o esforço". São estados diferentes — um é ausência de relação, o outro é uma **decisão deliberada de não integrar**. Hoje os documentos colapsam os dois por acidente, não por escolha.

- **(a)** Remover `[SW]` da linguagem. `-x-` passa a significar Separate Ways, e a legenda/UI preserva o nome do padrão DDD.
- **(b)** Manter as duas com semânticas distintas e documentadas: `-x-` puro = "não há vínculo"; `-x- [SW]` = "decidimos conscientemente não integrar". Ilustração:
  ```odds
  Shipping      -x- PaymentGateway   // "nunca houve vínculo nenhum"
  Shipping [SW] -x- PaymentGateway   // "avaliamos integrar e decidimos que não compensa"
  ```
  Custo embutido: exigiria uma regra nova para o caso ambíguo (linha `-x-` sem `[SW]` — ausência de vínculo ou decisão deliberada?), ou seja, mais um warning sobre uma distinção que o usuário não tem como provar.
- **(c)** Manter como está — redundância aceita, `[SW]` como reforço opcional de legibilidade.

➡️ **Recomendação:** **(a)**. A distinção de (b) é conceitualmente real, mas **não é verificável nem acionável**: nenhuma regra consegue distinguir "consideramos e recusamos" de "nunca foi cogitado", e o usuário não ganha nada por classificar isso. Pior, (b) tem um furo prático — se `-x-` puro significa "não há vínculo", declarar essas linhas é ruído puro (todo par de contextos não relacionados viraria uma linha, N² delas); na prática, **toda linha `-x-` que alguém se dá ao trabalho de escrever já é uma decisão deliberada**, ou seja, já é Separate Ways. Removendo a tag: some um caso da suíte, some metade da regra `SEPARATION_CONFLICT` (o ramo tag-vs-conector), a matriz de Q4 encolhe, e nenhuma informação é perdida. O nome do padrão DDD se preserva onde importa — na legenda do diagrama e na documentação —, não como token que só pode ser redundante ou errado.

**Resposta:** ✅ **(a)** — remover `[SW]` da linguagem. **Com uma condição:** documentar explicitamente *por que* a remoção é legítima, já que conector e tag pertencem a taxonomias diferentes (conector = Team Relationship, forma da dependência entre times; tag = Context Map Pattern, solução técnica/social aplicada na fronteira).

**Ativo conceitual a criar na passada final — o modelo de dois eixos.** A observação levantada nesta resposta expõe algo que hoje não está escrito em nenhum documento, embora seja o princípio organizador da linguagem inteira:

| Eixo | Onde vive na sintaxe | O que responde |
|---|---|---|
| **Team Relationship** | o **conector** (`-->`, `<--`, `<->`, `-x-`) | Qual é a *forma* da dependência entre os dois times/contextos? |
| **Context Map Pattern** | a **tag** (`[OHS]`, `[ACL]`, …) | Qual *solução* foi aplicada na fronteira, dada aquela forma de dependência? |

Os dois eixos são independentes em todas as combinações — você escolhe a forma da dependência e, separadamente, o padrão aplicado sobre ela. **Separate Ways é a única célula onde os eixos degeneram num ponto só:** ele é o padrão cuja aplicação é justamente a *ausência* de integração, o que o torna indistinguível da própria forma de dependência "Free". Não há solução a escolher sobre uma não-dependência. Por isso, e só por isso, `[SW]` pode ser removida sem perda: ODDS escolhe o **conector** como portador dessa célula. O nome do padrão DDD é preservado na documentação e na legenda do diagrama (`-x-` = *Free / Separate Ways*), não como token.

Escrever isso resolve de quebra uma pergunta que qualquer leitor da tabela de padrões faria — "cadê o Separate Ways?" — e dá o critério para julgar qualquer tag futura: *essa tag descreve uma solução aplicada sobre uma dependência, ou está apenas renomeando a dependência?*

---

❓ **Q4** — **Fechar a matriz tag × conector × lado**

Hoje a especificação define posição só para os conectores direcionais. Faltam decisões para:

- **(a)** Tags de posição (`OHS`, `PL`, `S`, `ACL`, `CF`, `C`) em `<->` — erro, ou permitido?
- **(b)** `[SK]`/`[P]` em conector direcional — o `CLAUDE.md` diz "exige `<->`" mas não há `code` nem regra dura (ver F1).
- **(c)** Inferência automática de `[SK]` no lado oposto — "pode inferir" torna a saída não-determinística entre implementações conformes.
- **(d)** `[BBM]` em linha `-x-` — conflito de separação, ou legítimo ("existe, é um pântano, e deliberadamente não integramos")?

➡️ **Recomendação:** Fechar tudo como **matriz normativa explícita** numa tabela nova no RULES (tag × conector permitido × lado permitido), com dois codes novos: `MUTUAL_TAG_ON_DIRECTIONAL` (SK/P fora de `<->`) e `POSITIONAL_TAG_ON_MUTUAL` (OHS/ACL/C/S/CF/PL em `<->`). Inferência automática: **proibir** — exigir a tag declarada nos dois lados, com mensagem de erro que ensina o porquê. E `[BBM]` em `-x-`: legítimo (se Q3 mover BBM para propriedade de contexto, a questão evapora sozinha — mais um argumento a favor de Q3).

**Resposta parcial:** ✅ **(a) e (b) resolvidos por derivação**, a partir da fonte semântica trazida na Rodada 1 (mapeamento Team Relationship → Context Map Patterns aplicáveis, registrada abaixo). **(c) e (d) seguem abertos → Q4a.**

**Fonte semântica adotada** (Team Relationship → padrões aplicáveis):
- **Mutually Dependent** (`<->`) → Partnership, Shared Kernel.
- **Upstream/Downstream** (`-->`/`<--`) → Customer/Supplier, Open-Host Service (frequentemente com Published Language), Conformist, Anti-Corruption Layer.
- **Free** (`-x-`) → Separate Ways — que, por D10, **é** o próprio conector, não uma tag.
- **Big Ball of Mud** → não mapeia para nenhum relacionamento de equipe; é demarcação de um sistema ruim. O tratamento recomendado é usar Upstream/Downstream com ACL para impedir a propagação da bagunça.

**Matriz normativa resultante:**

| Tag | `-->` / `<--` | `<->` | `-x-` |
|---|---|---|---|
| `OHS` | ✅ só Upstream | ❌ | ❌ |
| `PL` | ✅ só Upstream | ❌ | ❌ |
| `S` | ✅ só Upstream | ❌ | ❌ |
| `C` | ✅ só Downstream | ❌ | ❌ |
| `CF` | ✅ só Downstream | ❌ | ❌ |
| `ACL` | ✅ só Downstream | ❌ | ❌ |
| `SK` | ❌ | ✅ nos dois lados | ❌ |
| `P` | ❌ | ✅ nos dois lados | ❌ |
| `BBM` | ❓ | ❓ | ❓ | → Q4a |

**Duas consequências estruturais:**
1. A validação de tag passa a ter **duas dimensões independentes**: compatibilidade com o **conector** (dimensão nova — codes `MUTUAL_TAG_ON_DIRECTIONAL` e `POSITIONAL_TAG_ON_MUTUAL`) e compatibilidade com o **lado** (dimensão já existente — `UPSTREAM_ONLY_TAG_MISPLACED` / `DOWNSTREAM_ONLY_TAG_MISPLACED`). Uma tag pode falhar em uma, na outra, ou nas duas.
2. Com `[SW]` removida (D10), `-x-` é o conector que **não aceita tag nenhuma** — pendente só do veredito sobre `[BBM]`. Isso colapsa `SEPARATION_CONFLICT` numa regra de uma linha ("qualquer tag em `-x-` é erro"), eliminando a enumeração de tags de integração que a regra carrega hoje.

**Candidatos ao catálogo da Rodada 2 que saem desta fonte:** (i) `PL` declarado sem `OHS` na mesma linha — a fonte diz "frequentemente combinado", o que sugere `info`, não erro; (ii) `C` declarado sem `S` do outro lado (ou vice-versa) — Customer/Supplier é um acordo bilateral, e meia declaração documenta meio contrato.

---

❓ **Q4a** — **Onde o `[BBM]` pode aparecer, e o `[SK]`/`[P]` pode ser inferido?** _(o que sobrou de Q4)_

**Parte 1 — o lugar do `[BBM]` (ver F14).** Ele não é solução aplicada na fronteira nem forma de dependência: caracteriza o sistema. A fonte semântica adotada diz que o tratamento correto de um BBM é uma relação Upstream/Downstream com ACL. Isso sugere restringir onde ele pode aparecer — mas restringir demais impede afirmações legítimas.

- **(a)** `[BBM]` só em conectores direcionais (`-->`/`<--`), qualquer lado. Coerente com a fonte: BBM só é acionável quando existe integração da qual se proteger.
- **(b)** `[BBM]` em qualquer conector, inclusive `-x-` ("aquilo é um pântano e deliberadamente não integramos") e `<->`.
- **(c)** `[BBM]` só no lado **Upstream** de conectores direcionais — é a posição que o warning `CONFORMIST_CORE` já consome, e a única em que a bagunça se propaga *para você*.

**Parte 2 — inferência de `[SK]`/`[P]`.** `RULES.md §C` diz hoje que essas tags "devem preferencialmente aparecer em ambos os lados **ou o parser pode inferir** para o outro lado automaticamente". Um "pode" na especificação torna duas implementações igualmente conformes divergentes na saída (F1). Ou se exige nos dois lados, ou se infere sempre — não pode ser opcional.

- **(i)** Exigir declaração nos dois lados; um lado só é erro.
- **(ii)** Inferir sempre; declarar um lado basta, o validador completa.

➡️ **Recomendação:** **(b) + (i)**.

Sobre o BBM: a fonte descreve o tratamento *recomendado* (proteger-se com ACL numa relação U/D), não o **universo** de afirmações verdadeiras sobre um pântano. "Aquele ERP é uma bagunça e por isso decidimos não integrar" é uma afirmação coerente, acionável e das mais valiosas que um mapa pode registrar — é literalmente a justificativa de uma decisão de arquitetura, e proibi-la empurraria o usuário a apagar a informação em vez de documentá-la. (c) é atraente por casar com a regra existente, mas transforma uma limitação da *regra atual* em limitação da *linguagem*: um BBM downstream (você fornece dados para um pântano de terceiro) é uma situação real, com risco real, e não há motivo para torná-la inexprimível. Ressalva registrada: com (b), `-x-` deixa de ser "conector sem nenhuma tag" e o `SEPARATION_CONFLICT` volta a precisar de uma exceção — custo que considero pago pela informação preservada. **O ponto crítico não é onde o BBM pode aparecer, e sim documentá-lo como a terceira categoria de anotação (F14)**, para que ninguém tente aplicar a ele as regras de posição e conflito que valem para as tags de padrão.

Sobre a inferência: **(i)**, exigir nos dois lados. Inferência silenciosa faz o arquivo `.odds` e o diagrama renderizado discordarem — o texto mostra `[SK]` de um lado, o desenho mostra dos dois —, e a ODDS é uma ferramenta de *Architecture as Code*, onde o texto é a fonte de verdade e não um esboço a ser completado pela ferramenta. Além disso, Shared Kernel e Partnership são acordos **bilaterais**: escrever os dois lados é o próprio ato de reconhecer que a outra equipe também assinou embaixo.

**Resposta:** ✅ **(b) + (i)** — `[BBM]` permitido em qualquer conector e qualquer lado, tratado como categoria própria de anotação; inferência automática de `[SK]`/`[P]` **proibida**, declaração obrigatória nos dois lados.

**Fecha a Q4 inteira.** Com isso, a matriz de D12 fica completa: `[BBM]` é a única linha que atravessa todas as colunas, precisamente porque não é uma tag de padrão — é a caracterização do sistema (F14).

---

❓ **Q5** — **Identidade e unicidade da relação** _(redação refinada na retomada de 2026-08-12; a versão original está preservada na nota abaixo)_

> 📝 **Nota de refinamento.** A versão original definia identidade como par não-ordenado e propunha "tratar contradição como caso particular da duplicata". Ao rechecar os artefatos, dois pontos apareceram: **(1)** D11 já decidiu metade da pergunta sem que ela percebesse; **(2)** existem **três** situações sob identidade de par, não duas — a terceira (split de tags) é a que realmente morde.

`A --> B` e `B <-- A` são a mesma relação escrita de duas formas. Nada hoje define identidade de relação, e daí saem os quatro casos de F7. Mas **D11 já resolveu metade disso**: se o conector carrega a *forma da dependência entre dois times*, então um par de contextos tem exatamente **uma** forma de dependência por vez — uma segunda linha para o mesmo par nunca é informação nova. Isso não é escolha arbitrária de identidade, é consequência do modelo de três categorias.

As três situações possíveis sob identidade de par não-ordenado:

| Caso | Exemplo | O modelo diz… |
|---|---|---|
| Redundante | `A --> B` + `B <-- A` | a mesma coisa, duas vezes |
| Contraditório | `A --> B` + `A -x- B` (ou `A <-- B`) | duas coisas incompatíveis |
| **Split de tags** | `A [OHS] --> B` + `A [S] --> B` | uma coisa, em pedaços |

O terceiro é o que obriga a decidir: o validador une as tags? Elege uma linha vencedora para o renderizador? `[OHS]` e `[OHS, PL]` são "a mesma relação"?

- **(a)** Identidade = par **não-ordenado**. Qualquer segunda linha para o mesmo par é `DUPLICATE_RELATIONSHIP` (`error`), sem distinguir os três casos. Mais `SELF_RELATIONSHIP` (`error`).
- **(b)** Igual, mas dois codes: `DUPLICATE_RELATIONSHIP` (`info` — o modelo se repete) × `CONTRADICTORY_RELATIONSHIP` (`error` — o modelo se contradiz).
- **(c)** Identidade = par **+ conector**. Só a repetição exata é duplicata; contradição vira regra própria.
- **(d)** Sem regra de identidade — o renderizador desenha múltiplas arestas.

➡️ **Recomendação:** **(a)**. (b) exige do validador uma relação de *equivalência semântica* sobre conector+tags que ninguém acerta nas bordas, e o prêmio é apenas uma diferença de severidade numa linha que o usuário vai apagar de qualquer forma. (c) é pior: legitima `A --> B` + `A -x- B` como "duas relações diferentes", que é exatamente a contradição que se quer pegar. Com (a), **uma linha = uma aresta**, o renderizador nunca precisa mesclar, e o caso do split de tags morre por construção. Par **não-ordenado** (e não ordenado) porque `A --> B` + `B --> A` declarados juntos são uma dependência mútua mal escrita (deveria ser `<->`) — com identidade ordenada, esse caso escapa.

**Resposta:** ✅ **(a)** — identidade é o par não-ordenado `{left, right}`; um code só para duplicata, sem taxonomia de "tipo de duplicata"; mais `SELF_RELATIONSHIP`.

**Duas sub-decisões que vão junto:**
1. **Span da duplicata ancora na segunda ocorrência**, reusando a convenção que `TEST_SUITE.md §4` já fixou para `DUPLICATE_CONTEXT` — nenhuma convenção nova.
2. **Regras agregadas contam relações distintas, não linhas.** Sem essa cláusula, `A [SK] <-> B` escrito duas vezes sozinho estoura o limiar de 2 do `EXCESSIVE_SHARED_KERNEL` — falso positivo estratégico causado por um Ctrl+V.

**O que isso trava de graça:** `SEPARATION_CONFLICT` e as regras de posição de tag nunca precisam se perguntar "e se o mesmo par aparecer duas vezes com tags diferentes?" — o caso deixa de existir na linguagem.

**Dois ramos enfileirados para depois, ambos dependentes de Q7:** (i) qual linha sobrevive para desenhar quando o par duplicado tem conectores incompatíveis (só faz sentido perguntar se a renderização degradar em vez de bloquear); (ii) uma linha já marcada como `DUPLICATE_RELATIONSHIP` continua sendo avaliada pelas outras regras? Se sim, uma linha duplicada sem tag ganha também `UNDOCUMENTED_CONTRACT`. É a mesma família da cascata `ORPHAN_CONTEXT` → `PHANTOM_REFERENCE`: *regras se aplicam sobre elementos já inválidos?*

---

❓ **Q6** — **`message` é contrato, ou só `code` é?** _(redação refinada na retomada de 2026-08-12)_

> 📝 **Nota de refinamento.** A recomendação original era "tira `message` da asserção e cria um catálogo de templates". Ao aterrar isso nos golden files reais, apareceu um buraco que ela não cobria: hoje é a `message` que verifica *sobre o que* o diagnóstico fala, e removê-la sem repor nada é uma regressão de cobertura, não só uma simplificação.

Os golden files hoje comparam a mensagem textual por igualdade estrutural, em inglês. As mensagens do RULES existem **nas duas línguas** — `RULES-EN.md:78` traz `"The context 'Payment' ..."` e `RULES-PT.md:78` traz `"O contexto 'Pagamento' ..."` (o nome do contexto de exemplo também foi traduzido: são prosa paralela, não template com placeholder). Mensagem normativa e i18n são incompatíveis. Ver F2.

**A demonstração do buraco da proposta original.** `CONFORMIST_CORE` é o único code com **dois gatilhos disjuntos** — (a) `[CF]` no Downstream, (b) `[BBM]` no Upstream — e tem um golden file para cada:

```odds
Checkout [CF] <-- OldBilling      // caso 1 — gatilho (a)
Checkout <-- [BBM] OldBilling     // caso 2 — gatilho (b)
```

Removida a `message`, os dois casos passam a asserir a mesma `severity`, o mesmo `code`, e spans que diferem em **uma única coluna** (33 × 34) — diferença que existe por acidente, porque a segunda linha tem um caractere a mais. Uma implementação que dispare o gatilho errado passa nos dois testes. O `excessive-shared-kernel-warning` é pior: span na palavra `mapping`, mensagem genérica — sem `message`, o caso assere apenas "algum warning de SK ancorado no `mapping`", e o limiar de 2+ que `TEST_SUITE.md §5.2` formalizou deixa de ser verificado.

- **(a)** Só `code` + `span` + `severity` são contrato; `message` sai da asserção e vira catálogo de templates separado.
- **(b)** (a) **+ `Diagnostic` ganha `data: Record<string, string>`**, asserido pelos golden files no lugar de `message`; `message` **sai da interface `Diagnostic`** e vira função de renderização `(code, data, locale) => string`.
- **(c)** `message` continua normativa, em inglês; PT é cromo de UI e `RULES-PT.md` é documentação didática, não locale.

➡️ **Recomendação:** **(b)**. Resolve F2 reconhecendo que os dois documentos estavam meio certos: a mensagem não é contrato, mas *o que ela interpola* é — e `data` torna isso testável e à prova de tradução ao mesmo tempo. Os dois casos de `CONFORMIST_CORE` passam a divergir no campo que importa (`trigger: "conformist"` × `trigger: "bbm"`) em vez de numa coluna acidental, e o SK vira `data: { count: "2" }`. **(c)** mataria o `RULES-PT.md` como par de tradução — que o `CLAUDE.md` manda manter em sincronia — e deixaria o buraco do `CONFORMIST_CORE` intacto.

**Resposta:** ✅ **(b)** — seguir a recomendação.

---

❓ **Q7** — **Erro crítico bloqueia a renderização inteira, ou degrada?** _(redação refinada na retomada de 2026-08-12)_

> 📝 **Nota de refinamento — um argumento da versão original foi retirado.** A pergunta original dizia que "a narrativa do PRD §6 descreve o Alex vendo o diagrama **e** o aviso ao mesmo tempo". Ao checar, isso **não sustenta a tese**: o caso do Alex é `CONFORMIST_CORE`, um *warning*, que renderiza de qualquer forma. A narrativa não contradiz o bloqueio. Os dois argumentos abaixo substituem aquele, e são mais fortes.

PRD (§4.6, "prevent visualization") e RULES (§1, "Block Compilation") dizem que erros críticos bloqueiam a renderização. Dois problemas:

1. **F15 — o `RULES-EN.md` já se contradiz sozinho.** O título de §1 é *"Critical Errors (Block Compilation)"*, e a entrada de `ORPHAN_CONTEXT` (linha 67) diz *"this diagnostic does not block AST generation for the rest of the file"*. "Erro crítico bloqueia" já é falso no documento normativo, para pelo menos um code — e não por acidente: `GRAMMAR.md §5.1` investiu em panic-mode recovery justamente para não perder a AST do resto do arquivo.
2. **O PRD promete o oposto do bloqueio em outras duas seções.** §7.3 pede *"instant visualization updates"* e §8.2 exige responsividade durante a digitação — e **todo estado intermediário de um arquivo sendo digitado é um erro de sintaxe**. Sob bloqueio estrito, o canvas pisca vazio a cada tecla. Não é UX punitiva; é o produto não funcionando.

- **(a)** Degradação por elemento: a AST parcial sempre renderiza; o elemento com erro aparece marcado (aresta tracejada vermelha, nó fantasma pontilhado). Só `SYNTAX_ERROR` puro congela o último diagrama bom.
- **(b)** Manter o bloqueio estrito: qualquer `error` ⇒ sem diagrama; o painel é a única fonte de feedback.
- **(c)** Dois níveis: erros com degradação **local** (`PHANTOM_REFERENCE`, tags, `DUPLICATE_RELATIONSHIP`, `SELF_RELATIONSHIP`) degradam; erros que invalidam o **enquadramento** do documento (`INVALID_DOMAIN_CARDINALITY`, `ORPHAN_SUBDOMAIN`, `SYNTAX_ERROR`) bloqueiam e congelam.

➡️ **Recomendação:** **(a)**, com duas sub-decisões que precisam entrar junto — senão "degradar" é intenção, não decisão: **(1)** o diagrama congelado tem que estar **visualmente marcado como obsoleto**, senão o canvas mente em silêncio sobre o arquivo (D3 já recusou esse tipo de mentira ao proibir supressão de `error`); **(2)** **exportar com erros é permitido e o export inclui os marcadores** — o SVG é exatamente o que está no canvas, sem versão "limpa", porque um diagrama exportado sem marcadores vira documentação afirmando um modelo que nunca foi válido.

**Resposta:** ✅ **(a)** — seguir a recomendação, com as duas sub-decisões.

**Fecha a Rodada 1.**

---

### Rodada 2 — O catálogo opinativo e os últimos ramos estruturais

**Enviada em:** 2026-08-12 · **Status:** 🔴 aguardando respostas

Três perguntas, todas com pré-condições já resolvidas. Q10 é o entregável pedido lá na resposta a Q1.

---

❓ **Q8** — **Regras se aplicam sobre elementos já inválidos?** _(desbloqueada por Q7/D17; ramo enfileirado por Q5 e Q7)_

Três casos distintos que na verdade são **uma decisão só**:

1. **Cascata órfã.** `ORPHAN_CONTEXT` é detectado pelo panic-mode recovery, que **descarta a declaração** (`GRAMMAR.md §5.1`). Logo, toda linha do `mapping` que referencia aquele contexto também emite `PHANTOM_REFERENCE`. Um erro do usuário, dois diagnósticos — e o segundo é **falso**: o contexto foi declarado, só que no lugar errado.
2. **Linha duplicada.** Uma linha marcada como `DUPLICATE_RELATIONSHIP` (D15) continua sendo avaliada pelas outras regras? Se sim, uma duplicata sem tag ganha também `UNDOCUMENTED_CONTRACT`, e se tiver tag mal posicionada ganha o erro de posição de novo.
3. **Qual linha desenha.** Com D17 (renderização degradada), o par duplicado com conectores incompatíveis (`A --> B` + `A -x- B`) precisa produzir *uma* aresta. Qual?

- **(i)** **Princípio do erro-raiz:** um elemento que já produziu um `error` é registrado no modelo como *declarado porém inválido* e **não gera diagnósticos derivados**. Na prática: contextos descartados pelo panic-mode entram na `SymbolTable` marcados como inválidos (matando a cascata de fantasma); linhas duplicadas não são reavaliadas por nenhuma outra regra; e a **primeira** ocorrência do par é a que desenha, coerente com a convenção de span que já culpa a segunda.
- **(ii)** Sem princípio: cada regra roda independente, o usuário vê a cascata completa.
- **(iii)** Caso a caso, decidido regra a regra.

➡️ **Recomendação:** **(i)**. É o mesmo princípio que todo compilador aplica ao suprimir erros em cascata depois de uma falha de parsing, e o efeito é que **a contagem de diagnósticos fica próxima da contagem de erros do usuário** — que é exatamente o que faz um linter ser confiável em vez de ignorado em bloco (a preocupação original de Q1b, agora aplicada a uma segunda fonte de ruído). Além disso, D17 já **exige** a entrada "declarado porém inválido": é ela que permite ao renderizador desenhar o nó fantasma pontilhado em vez de nada. (ii) trata como independentes regras que não são, e (iii) garante que cada regra nova reabra a discussão — o mesmo erro que D7 evitou no eixo do contexto externo.

**Resposta:** ✅ **(i)** — princípio do erro-raiz.

**Abre Q8a:** o princípio precisa de uma definição mecânica de "derivado", senão cada regra nova negocia o alcance dele — exatamente o que D7 evitou no outro eixo.

---

❓ **Q8a** — **Qual é o alcance do princípio do erro-raiz?** _(depende só de Q8)_

"Não gera diagnósticos derivados" tem duas leituras, e elas discordam em casos concretos:

**Leitura larga — o elemento inválido some do pipeline.** Nenhuma regra posterior o enxerga.
**Leitura estreita — só as regras que consomem exatamente o que foi invalidado o pulam.** As demais continuam rodando sobre ele.

Três casos onde as leituras divergem:

1. **Linha duplicada com problema estratégico.** `Checkout [CF] <-- OldBilling` declarada duas vezes: a segunda é `DUPLICATE_RELATIONSHIP`. Na leitura larga, o usuário **só vê** o `CONFORMIST_CORE` depois de apagar a duplicata — conserto iterativo. Na estreita, vê os dois de uma vez, mas o `CONFORMIST_CORE` aparece duplicado (uma vez por linha) a não ser que a regra agregue.
2. **Contexto órfão com nome colidente.** `context A` órfão (descartado) e `context A` dentro de um subdomínio válido. Na leitura larga não há `DUPLICATE_CONTEXT` — o órfão não existe. Na estreita há, porque é uma colisão de nome que o usuário vai ter que resolver de qualquer jeito ao mover a declaração para dentro do subdomínio.
3. **Tag mal posicionada numa linha que também é duplicata.** Leitura larga: só o erro de duplicata. Estreita: os dois.

- **(a)** Leitura **larga**: um `error` num elemento o remove do pipeline inteiro. Consertar erros é iterativo, e a ferramenta reporta uma camada por vez.
- **(b)** Leitura **estreita**: pular só quem consome o que foi invalidado — cada regra declara sua dependência.
- **(c)** Larga por padrão, com exceção nominal para colisão de nome (caso 2), porque o `DUPLICATE_CONTEXT` sobrevive ao conserto do órfão.

➡️ **Recomendação:** **(a)**. A leitura estreita obriga cada regra do catálogo (que Q10 está prestes a dobrar de tamanho) a declarar explicitamente de que invalidação ela depende — é exatamente o "caso a caso" que a opção (iii) de Q8 acabou de recusar, só que disfarçado de arquitetura. O conserto iterativo é o comportamento que todo compilador tem e que ninguém estranha; e com D17 (validação a cada tecla) o custo de uma segunda passada é zero — o usuário apaga a linha duplicada e o `CONFORMIST_CORE` aparece no mesmo instante. **(c)** é tentadora e o caso 2 é real, mas o preço é abrir a primeira exceção nominal num princípio que acabou de nascer, e o ganho é antecipar em um ciclo de digitação um diagnóstico que vai aparecer sozinho.

**Resposta:** ✅ **(a)** — leitura larga: um `error` remove o elemento do pipeline.

**Abre Q8b, e promove F9.** Com a leitura larga, a **ordem de avaliação deixa de ser cosmética e passa a ser semântica**: se um elemento sai do pipeline ao primeiro `error`, *qual* erro chega primeiro determina o que o usuário vê. F9 estava catalogado como "ordenação determinística para os testes não flutuarem"; agora é a regra que decide o conteúdo do painel.

---

❓ **Q8b** — **Quando o mesmo elemento viola várias regras, o que o invalida?** _(depende só de Q8a)_

Exemplo mínimo: `A --> [OHS] B` escrita duas vezes. A linha viola `UPSTREAM_ONLY_TAG_MISPLACED` (OHS no lado Downstream) **e** `DUPLICATE_RELATIONSHIP`. Sob a leitura larga, se a duplicata for detectada primeiro a linha sai e o erro de tag nunca aparece; se for o contrário, sai e o usuário nunca fica sabendo que há duas cópias.

- **(a)** **Fases.** As regras são agrupadas em fases (sintática → estrutural → referencial → relacional → estratégica). **Todas as regras da mesma fase rodam e reportam**; a invalidação só vale para as fases *seguintes*.
- **(b)** **Primeira vence.** Uma ordem total de precedência entre codes; o usuário vê um erro por elemento por vez.
- **(c)** **Só warnings são suprimidos.** Todas as regras de `error` rodam sobre o elemento; a supressão vale apenas para `warning`/`info`.

➡️ **Recomendação:** **(a)**. **(c)** está descartada pelos fatos: o caso-bandeira de D18 é `ORPHAN_CONTEXT` → `PHANTOM_REFERENCE`, que é `error` suprimindo `error` — adotar (c) desfaria a decisão que acabou de ser tomada. **(b)** entrega um diagnóstico por vez e transforma o conserto de uma linha ruim numa sequência de revelações, que é o oposto do que D17 comprou com a validação instantânea. As fases dão o meio-termo certo: o usuário vê de uma vez tudo o que está no *mesmo nível* de análise (os dois problemas da linha acima são ambos relacionais, então aparecem juntos), e só some o que é genuinamente derivado — o que depende de uma fase anterior ter dado certo. **Bônus:** isso resolve F9 de graça, dando o esqueleto da ordenação total — ordena-se por **fase**, depois por **posição no arquivo** —, e o único resíduo é o desempate entre regras da mesma fase na mesma linha (o caso `role-conflict`, que hoje já fixa `DOWNSTREAM_ONLY_TAG_MISPLACED` antes de `ROLE_CONFLICT` sem regra escrita).

**Resposta:** ✅ **(a)** — modelo de fases, **com pedido explícito de já documentar a ordenação num artefato do projeto** (e não só aqui). Ver a exceção à política de propagação registrada em §0.

**Achado que apareceu ao escrever a documentação → F17.** A regra "ordenar por posição no arquivo" **não reproduz** o golden file `role-conflict` como ele está hoje: `ROLE_CONFLICT` tem span na coluna 14 (o grupo `[C, S]`) e `DOWNSTREAM_ONLY_TAG_MISPLACED` na coluna 15 (o token `C`), mas o arquivo lista o segundo primeiro. Sob a regra escrita, a ordem se inverte. Isso confirma que a ordem atual da suíte nunca teve regra por trás — era prioridade implícita de quem escreveu. `role-conflict/expected.json` precisa ser reordenado na passada final.

---

❓ **Q9** — **Versionamento da linguagem** _(desbloqueada por Q4; ramo aberto desde a Rodada 1)_

Esta sessão sozinha já produziu **duas mudanças que quebram arquivos existentes**: `[SW]` deixou de existir (D10) e `external` virou palavra reservada (D6). Toda URL compartilhada (GH-003) e todo `.odds` versionado em Git de antes dessas mudanças passa a ser inválido — e hoje o usuário recebe por isso um `SYNTAX_ERROR` genérico, que não diz o que aconteceu nem o que fazer.

- **(a)** Sem versionamento. Mudanças de gramática quebram URLs antigas silenciosamente.
- **(b)** Versão **no payload da URL**, não na linguagem: o compartilhador codifica a versão junto com o texto; ao abrir uma URL de versão anterior, a aplicação avisa ou migra.
- **(c)** Diretiva no próprio arquivo (`odds 0.2` no topo), no espírito do `pragma solidity` — viaja no Git também.
- **(d)** Versionar só o formato de serialização da URL; a linguagem é sempre "a última".

➡️ **Recomendação:** **(b)**, **mais uma decisão que vale para as três opções**: toda construção removida ganha um **diagnóstico dedicado de migração** em vez de `SYNTAX_ERROR` genérico (ex: *"`[SW]` foi removida na v0.2 — use `-x-` sozinho"*). Esse é o mecanismo que realmente resolve o problema do usuário, e funciona igual para arquivo em Git e para URL, independentemente de onde a versão mora. Rejeito (c) porque o `.odds` é o artefato que a pessoa cola numa PR: um pragma obrigatório na linha 1 cobra de todo usuário, para sempre, o preço de um problema que só existe na fronteira da URL — e a URL é gerada por máquina, onde um campo de versão é grátis. (a) é aceitável só enquanto não houver usuário; como D10 e D6 já quebraram compatibilidade antes da v1, a dívida começa a existir no dia do lançamento.

**Resposta:** ✅ **(b)** — versão no payload da URL, mais o diagnóstico de migração para construções removidas.

**Abre Q9a, por um fato levantado ao registrar esta decisão (F18): não existe hoje "a versão da linguagem" para colocar na URL.**

---

❓ **Q9a** — **Versão de quê, exatamente?** _(depende só de Q9; motivada por F18)_

**Parte 1 — o número.** O `CHANGELOG.md` afirma que *"não existe uma versão única do repositório como um todo"*: cada arquivo tem esquema próprio (`GRAMMAR.md` v0.1.9, `AST_SCHEMA.md` v0.1.2, `TEST_SUITE.md` v0.1.1), e `RULES-EN.md`/`RULES-PT.md` e `PRD.md` **não são versionados**. Mas o que um `.odds` *significa* é definido pelos três juntos — e o RULES, que é metade da semântica, não tem número nenhum. Não há o que colocar na URL.

- **(a)** Criar uma **versão de linguagem própria** (`ODDS Language Version`), independente das versões editoriais dos documentos, incrementada **só** quando o comportamento observável de um `.odds` muda. Cada documento mantém seu changelog atual.
- **(b)** Usar a versão do `GRAMMAR.md` como proxy da linguagem.
- **(c)** Abandonar o esquema por arquivo e versionar o repositório inteiro.

**Parte 2 — o que a aplicação faz ao abrir uma URL de versão anterior.**

- **(i)** **Migrar automaticamente** o texto e avisar o usuário.
- **(ii)** **Não migrar nada:** abre o texto como está e deixa os diagnósticos de migração (já decididos em D20) trabalharem. A versão só serve para tornar a mensagem específica.

➡️ **Recomendação:** **(a) + (ii)**.

Sobre o número: **(b)** falha num caso concreto e imediato — o catálogo de Q10 acrescenta regras que mudam quais diagnósticos um arquivo *válido* produz **sem tocar em uma linha do `GRAMMAR.md`**; uma URL versionada pela gramática afirmaria compatibilidade que não existe. E D10 (remoção de `[SW]`) mexeu em gramática **e** em RULES ao mesmo tempo, provando que nenhum documento isolado é proxy do conjunto. **(c)** joga fora um esquema que funciona bem para revisão editorial — as v0.1.x do `GRAMMAR.md` são histórico de decisão de projeto, não de compatibilidade de arquivo; misturar os dois eixos perde os dois.

Sobre o comportamento: **(ii)** porque migração automática exige carregar, para sempre e no bundle do navegador, código de migração de toda versão passada — num produto 100% client-side isso é peso permanente. E reescrever o texto do usuário é justamente o que D14 recusou ao proibir inferência de `[SK]`: numa ferramenta de *Architecture as Code*, o texto é a fonte de verdade, não um rascunho que a ferramenta corrige. Com D17 (renderização degradada + painel ao vivo), o usuário abre a URL antiga, vê o diagrama, vê *"`[SW]` foi removida na v0.2 — use `-x-` sozinho"* na linha exata, e conserta em dois segundos. A versão existe para tornar essa mensagem **específica**, não para editar o arquivo por ele.

**Resposta:** ✅ **(a) + (ii)** — seguir as recomendações.

**Abre Q9b:** "incrementada só quando o comportamento observável muda" é ambíguo exatamente onde Q10 vai cair — o catálogo muda os diagnósticos de arquivos que continuam válidos.

---

❓ **Q9b** — **O que conta como mudança de versão da linguagem?** _(depende só de Q9a)_

Três tipos de mudança, com efeitos muito diferentes sobre o usuário:

| Tipo | Exemplo desta sessão | Efeito num `.odds` existente |
|---|---|---|
| **Validade** | `[SW]` removida (D10); `external` vira reservada (D6) | Arquivo que era válido deixa de ser |
| **Diagnósticos** | as ~10 regras novas de Q10; `UNDOCUMENTED_CONTRACT` vira `info` (D2) | Arquivo continua válido, mas o painel muda |
| **Texto** | mensagens migram para o catálogo (D16); tradução revisada | Nada muda para o usuário |

- **(a)** **SemVer com corte na validade:** MAJOR quando um arquivo válido deixa de ser válido ou muda de significado; MINOR quando só os diagnósticos mudam; PATCH para texto. A URL guarda a versão cheia, mas **só divergência de MAJOR** aciona os diagnósticos de migração de D20.
- **(b)** Qualquer mudança de saída incrementa a versão principal — um linter usado em CI quebra o build com regra nova, então regra nova é breaking.
- **(c)** Versionar só mudanças de validade; regra nova não é evento de versão de forma alguma.

➡️ **Recomendação:** **(a)**. **(b)** faria a versão da linguagem girar a cada regra do catálogo e transformaria o campo da URL em ruído — e o argumento do CI não se aplica: a ODDS é um playground client-side sem pipeline (o PRD não tem CLI nem integração de build no escopo). **(c)** é tentadora pela simplicidade, mas apaga a informação que responde a pergunta mais provável de um usuário voltando a um diagrama antigo — *"esses três avisos novos apareceram porque eu mudei o desenho, ou porque a ferramenta mudou?"* — e essa é exatamente a pergunta que corrói a confiança num linter opinativo (D1). A regra de corte de (a) mantém o MAJOR raro e significativo, que é o que faz o diagnóstico de migração de D20 valer alguma coisa.

**Resposta:** ✅ **(a)** — SemVer com corte na validade.

**Decisão de rotina absorvida** (registrada, não perguntada): a `ODDS Language Version` **nasce em v0.1**, e as quebras de compatibilidade já decididas nesta sessão (D6 tornando `external` reservada, D10 removendo `[SW]`) **não geram diagnóstico de migração retroativo** — não existe usuário nem URL publicada anterior a elas. O primeiro MAJOR relevante será o da v1.0.

**Fecha a subárvore de Q9.** A Rodada 2 passa a ter uma única pergunta em aberto: Q10.

---

❓ **Q10** — **O catálogo de boas práticas de DDD** _(o entregável pedido na resposta a Q1)_

Proposta de catálogo, já nascido com severidade (D2) e com a coluna imposta por D7. Dez regras novas, mais a reclassificação das quatro existentes.

**Novas — integridade estrutural (`error`)**

| Code | Gatilho | Externo? | Origem |
|---|---|---|---|
| `DUPLICATE_SUBDOMAIN` | Dois `subdomain` com o mesmo nome no arquivo | n/a | F8 |
| `MUTUAL_TAG_WITH_EXTERNAL` | `[SK]` ou `[P]` numa relação que envolve contexto externo | — | **nova, derivada de D6+D11** |

**Novas — risco estratégico (`warning`)**

| Code | Gatilho | Externo? | Origem |
|---|---|---|---|
| `CORE_UPSTREAM_OF_GENERIC` | Contexto de subdomínio `core` como Upstream de um `generic` | ✅ vale | F11 |
| `CORE_IN_SHARED_KERNEL` | Contexto de subdomínio `core` numa relação com `[SK]` | ✅ vale | F12 |
| `DOMAIN_WITHOUT_CORE` | Nenhum `subdomain core` declarado no arquivo | n/a | Q1 |
| `INCONSISTENT_BBM` | Mesmo contexto com `[BBM]` em algumas relações e sem em outras | ✅ vale | custo aceito em Q3a |
| `INCOMPLETE_CUSTOMER_SUPPLIER` | `[C]` num lado sem `[S]` no outro (ou vice-versa) | ✅ vale | Q4 |

**Novas — higiene (`info`)**

| Code | Gatilho | Externo? | Origem |
|---|---|---|---|
| `UNMAPPED_CONTEXT` | Contexto declarado e nunca referenciado no `mapping` | ✅ vale | Q1 |
| `EMPTY_SUBDOMAIN` | `subdomain` sem nenhum `context` | n/a | Q1 |
| `PL_WITHOUT_OHS` | `[PL]` sem `[OHS]` no mesmo lado | ✅ vale | Q4 |

**Reclassificação das quatro existentes:** `CONFORMIST_CORE` → `warning` (mantém, é a regra-bandeira); `GENERIC_WITHOUT_OHS` → `warning` (mantém, **isenta para externo** por D7); `EXCESSIVE_SHARED_KERNEL` → ver tensão 2; `UNDOCUMENTED_CONTRACT` → **`info`** (higiene de documentação, como já se antecipava em Q1b).

**Quatro tensões que o catálogo expõe e que precisam de veredito junto com ele:**

**Tensão 1 — Q3a matou dois candidatos.** "Dois contextos do mesmo `team` numa relação Upstream/Downstream" e "`maturity: experimental` num subdomínio `core`" **não são expressáveis**: dependem de propriedades alimentarem regras, e Q3a decidiu preservar a fronteira *"tag = contrato validável / propriedade = documentação"*. Ou se aceita perdê-los, ou se reabre D9/Q3a. ➡️ Recomendação: **aceitar a perda** — a promessa "preencha `team` sem medo de ser julgado por isso" vale mais do que as duas regras.

**Tensão 2 — `EXCESSIVE_SHARED_KERNEL` perde o sentido.** Com `CORE_IN_SHARED_KERNEL` e `MUTUAL_TAG_WITH_EXTERNAL` no catálogo, os SKs *perigosos* passam a ter regra dedicada; o que sobra para a regra agregada é "dois SKs entre subdomínios de apoio", que não é alarmante. ➡️ Recomendação: **rebaixar para `info`** e subir o limiar para 3+.

**Tensão 3 — critério de admissão, para o catálogo não inflar.** Catorze regras num arquivo de 30 linhas podem virar oito diagnósticos. D7 dá um eixo de admissão; falta o segundo: **"a regra tem uma correção distinta?"** Se o conserto de X é idêntico ao de Y, são uma regra só. ➡️ Recomendação: **adotar como segundo critério obrigatório**, escrito no `RULES.md` ao lado do princípio da autoria — e notar que ele é justamente o que condena a regra agregada da tensão 2.

**Tensão 4 — o catálogo invalida os próprios golden files de referência.** Não é teórico: `valid-baseline/input.odds` contém `Checkout [OHS, PL] --> PaymentGateway`, com `Checkout` em `subdomain core` e `PaymentGateway` em `subdomain generic` — ou seja, o arquivo cuja função é produzir **zero diagnósticos** passa a disparar `CORE_UPSTREAM_OF_GENERIC` (F11). E `excessive-shared-kernel-warning` tem dois contextos `core` em SK com um `generic`, passando de 1 para 3 diagnósticos (F12). ➡️ Recomendação: **reescrever os dois** na passada final — que é a confirmação prática de que F11 e F12 eram odores reais, e não implicância.

➡️ **Recomendação geral:** adotar o catálogo como proposto, com os vereditos das quatro tensões.

**Resposta:** ✅ **Adotado integralmente** — a tabela e os quatro vereditos. → D23 (catálogo) + D24 (segundo critério de admissão).

**Rotina absorvida — atribuição de fase (exigida por D19).** Todo code novo precisa de fase ao entrar no `AST_SCHEMA.md §1`:

| Fase | Codes novos |
|---|---|
| 2 — declarativa | `DUPLICATE_SUBDOMAIN` |
| 4 — relacional | `MUTUAL_TAG_WITH_EXTERNAL` |
| 5 — estratégica | `CORE_UPSTREAM_OF_GENERIC`, `CORE_IN_SHARED_KERNEL`, `DOMAIN_WITHOUT_CORE`, `INCONSISTENT_BBM`, `INCOMPLETE_CUSTOMER_SUPPLIER`, `UNMAPPED_CONTEXT`, `EMPTY_SUBDOMAIN`, `PL_WITHOUT_OHS` |

**Assimetria deliberada, registrada para não ser lida como incoerência:** D14 tornou a declaração bilateral de `[SK]`/`[P]` um **`error`** (`INCOMPLETE_MUTUAL_TAG`), enquanto `INCOMPLETE_CUSTOMER_SUPPLIER` é **`warning`**. Não é inconsistência: `SK` e `P` são a *mesma* tag repetida — simétrica por natureza, e metade dela é uma declaração incompleta de um fato único. Já `C` e `S` são **tags distintas com significado independente** (a extensão deliberada da ODDS sobre o Customer/Supplier clássico, registrada no `CLAUDE.md`), e "eu sou o Customer desta integração" é uma afirmação unilateral coerente — só está mal documentada, não malformada.

---

### Rodada 3 — O ramo nunca visitado: as duas vistas

**Enviada em:** 2026-08-12 · **Status:** 🔴 aguardando resposta

Varredura de fronteira ao fechar a Rodada 2: o único ramo que nenhuma rodada tocou é o das **duas vistas de diagrama** exigidas pelo `PRD.md` (fluxo de relacionamentos **e** contenção aninhada). Três decisões desta sessão têm consequências ali que nenhum documento registra — e uma delas é um buraco semântico, não um detalhe de UI.

---

❓ **Q11** — **O que as duas vistas conseguem expressar do que foi decidido?**

**Parte 1 — o buraco do `[BBM]` na vista de contenção.** Q3a decidiu (corretamente) manter `[BBM]` como tag de relação, para preservar a fronteira "tag = contrato validável / propriedade = documentação". O custo aceito foi "repetir a tag em toda linha". Mas a **vista de contenção não tem linhas** — ela desenha caixas dentro de caixas. Resultado: a única anotação cuja função inteira é sinalizar um **sistema perigoso** é invisível justamente na vista que desenha sistemas. Um ERP pântano aparece lá como qualquer outro contexto.

- **(a)** Aceitar e documentar: a vista de contenção mostra estrutura, a de fluxo mostra relações e suas anotações. `[BBM]` é anotação de relação e só aparece na vista de fluxo.
- **(b)** A vista de contenção **deriva** a marca: um contexto que carrega `[BBM]` em *qualquer* relação é desenhado com a marca de pântano. Custo: a derivação depende de o modelo estar consistente, que é exatamente o que `INCONSISTENT_BBM` (D23) admite não estar garantido.
- **(c)** Reabrir Q3a e voltar `[BBM]` a propriedade de contexto, aceitando quebrar a fronteira de F13.

**Parte 2 — onde o bloco `external` é desenhado na vista de contenção.** D6 aceitou a contradição conceitual de declarar o externo *dentro* do `domain`, "por pragmatismo, nomeando a contradição na documentação". Na vista de contenção isso vira uma escolha visual concreta: o bloco `external` é uma caixa **dentro** da caixa do domínio (fiel à sintaxe) ou **fora** dela (fiel ao conceito)?

- **(i)** Dentro — a vista espelha a sintaxe.
- **(ii)** Fora, encostada na fronteira — a vista espelha o conceito, e a contradição de D6 fica confinada ao arquivo-texto.

➡️ **Recomendação:** **(a) + (ii)**.

Sobre o BBM: **(b)** parece generoso mas constrói uma inferência visual sobre dado que a própria D23 reconhece poder ser contraditório — e é a mesma inferência silenciosa que D14 proibiu ao vetar o preenchimento automático de `[SK]`. Se o desenho afirma "este sistema é um pântano" a partir de uma tag que aparece em duas das cinco relações, o diagrama passa a afirmar mais do que o texto. **(c)** desfaz uma decisão boa por um problema de visualização. **(a)** é honesta e barata, e tem uma defesa positiva: as duas vistas respondem perguntas diferentes — "como isto está organizado?" e "como isto se integra?" —, e risco de integração é, por definição, pergunta da segunda.

Sobre o externo: **(ii)**, porque D6 escolheu aninhar dentro do `domain` por razões **sintáticas** (preservar o invariante "todo `context` dentro de um bloco declarado", `INVALID_DOMAIN_CARDINALITY`, "um arquivo = um domain") e registrou explicitamente que o conceito diz o contrário. A vista de contenção não tem nenhuma dessas amarras: desenhar o externo fora da fronteira do domínio custa zero e **cancela a contradição no único lugar onde ela seria visível para o usuário**. Fazer a vista repetir uma contradição que só existe por conveniência de gramática seria propagar dívida de graça.

**Resposta:** ✅ **(a) + (ii)** — seguir as recomendações. → D25.

**Fecha a Rodada 3 e esvazia a fronteira.**

---

## 3. Decisões fechadas

| # | Decisão | Origem | Artefatos a atualizar |
|---|---|---|---|
| **D25** | **As duas vistas têm poderes expressivos diferentes, e isso é deliberado.** **(1)** `[BBM]` aparece **apenas na vista de fluxo**. A vista de contenção não tem linhas, então a única anotação cuja função é sinalizar um sistema perigoso não é representável ali — e a alternativa (derivar a marca no nó quando o contexto carrega `[BBM]` em *qualquer* relação) foi rejeitada por construir inferência visual sobre dado que a própria D23 admite poder ser contraditório (`INCONSISTENT_BBM`): é a mesma inferência silenciosa que D14 vetou ao proibir o preenchimento automático de `[SK]`, e faria o desenho afirmar mais do que o texto. Defesa positiva: as duas vistas respondem perguntas diferentes — *"como isto está organizado?"* e *"como isto se integra?"* — e risco de integração é, por definição, pergunta da segunda. **(2)** O bloco `external` é desenhado **fora** da fronteira do domínio na vista de contenção, encostado nela. D6 aninhou o externo dentro do `domain` por razões estritamente **sintáticas** e registrou que o conceito diz o contrário; a vista não tem nenhuma dessas amarras, então desenhar fora **cancela a contradição no único lugar onde ela seria visível para o usuário**. | Q11 | `PRD.md §4.2` (poder expressivo de cada vista, explícito) e §4.5 (`[BBM]` só na vista de fluxo) · `RULES-EN.md`/`RULES-PT.md` (na seção das três categorias de anotação criada por D11) · `CLAUDE.md` |
| **D24** | **Segundo critério de admissão de regra: "a regra tem uma correção distinta?"** Se o conserto de X é idêntico ao de Y, X e Y são a mesma regra e devem ser fundidas. Passa a valer ao lado do **princípio da autoria** (D7, "pressupõe controle sobre o sistema?") como filtro obrigatório para toda regra futura. Existe porque o catálogo saltou de 4 para 14 regras num produto que valida a cada tecla: sem um freio explícito, um arquivo de 30 linhas vira oito diagnósticos e o usuário aprende a ignorar o painel inteiro — a mesma preocupação que originou os três níveis de severidade em D2, agora no eixo da *quantidade* de regras em vez do da severidade. Sua primeira aplicação é justamente o rebaixamento de `EXCESSIVE_SHARED_KERNEL` em D23: com `CORE_IN_SHARED_KERNEL` no catálogo, a correção que a regra agregada sugeria já era sugerida por outra. | Q10 (tensão 3) | `RULES-EN.md`/`RULES-PT.md` (ao lado do princípio da autoria de D7) · `CLAUDE.md` |
| **D23** | **O catálogo opinativo: 10 regras novas + reclassificação das 4 existentes.** ⚠️ `error`: `DUPLICATE_SUBDOMAIN` (F8), `MUTUAL_TAG_WITH_EXTERNAL`. ⚠️ `warning`: `CORE_UPSTREAM_OF_GENERIC` (F11), `CORE_IN_SHARED_KERNEL` (F12), `DOMAIN_WITHOUT_CORE`, `INCONSISTENT_BBM`, `INCOMPLETE_CUSTOMER_SUPPLIER`. ℹ️ `info`: `UNMAPPED_CONTEXT`, `EMPTY_SUBDOMAIN`, `PL_WITHOUT_OHS`. **Reclassificação:** `CONFORMIST_CORE` e `GENERIC_WITHOUT_OHS` seguem `warning` (o segundo **isento para externo**, por D7); `UNDOCUMENTED_CONTRACT` **cai para `info`** (higiene de documentação); `EXCESSIVE_SHARED_KERNEL` **cai para `info` com limiar 3+** — com `CORE_IN_SHARED_KERNEL` e `MUTUAL_TAG_WITH_EXTERNAL` no catálogo, os SKs perigosos ganharam regra dedicada e o que sobrava para a regra agregada ("dois SKs entre subdomínios de apoio") não é alarmante. `MUTUAL_TAG_WITH_EXTERNAL` é **derivada de D6+D11**: não existe Shared Kernel nem Partnership com um terceiro — são acordos bilaterais entre times que você tem —, então é erro de categoria, mesma família de `EXTERNAL_ONLY_RELATIONSHIP`, não juízo sobre desenho. **Duas perdas aceitas conscientemente** (tensão 1): as regras baseadas em `team` e em `maturity` são **inexpressíveis**, porque Q3a preservou a fronteira "tag = contrato validável / propriedade = documentação" — a promessa "preencha `team` sem medo de ser julgado por isso" vale mais que as duas regras. | Q10 | `RULES-EN.md`/`RULES-PT.md` §2 (10 regras novas + severidade por regra + coluna "vale para externo?") · `AST_SCHEMA.md §1` (+10 codes, **cada um com sua fase**, por D19) · `PRD.md §4.6` · `TEST_SUITE.md` + **10 golden files novos** · **reescrever `valid-baseline` e `excessive-shared-kernel-warning`** (tensão 4 — o primeiro dispara `CORE_UPSTREAM_OF_GENERIC` e deixa de ser "zero diagnósticos"; o segundo sai de 1 para 3), o que arrasta junto a correção de F10 · `CLAUDE.md` |
| **D22** | **A `ODDS Language Version` segue SemVer com o corte na validade do arquivo.** **MAJOR** quando um `.odds` válido deixa de ser válido ou muda de significado (ex: D10 removendo `[SW]`, D6 tornando `external` reservada); **MINOR** quando só os diagnósticos mudam e o arquivo continua válido (o catálogo de Q10, a reclassificação de severidade de D2); **PATCH** para texto de mensagem e tradução (D16). A URL guarda a versão cheia, mas **só divergência de MAJOR** aciona os diagnósticos de migração de D20 — o que mantém o MAJOR raro e significativo. Rejeitado tratar toda mudança de saída como breaking: faria a versão girar a cada regra do catálogo e viraria ruído no campo da URL, e o argumento "linter em CI quebra o build" não se aplica (a ODDS é um playground client-side; o PRD não tem CLI nem integração de build no escopo). Rejeitado também versionar apenas validade: apagaria a informação que responde à pergunta mais provável de quem reabre um diagrama antigo — *"esses avisos novos são meus ou da ferramenta?"* —, que é justamente a dúvida que corrói a confiança num linter opinativo (D1). **Rotina absorvida:** a linguagem nasce em **v0.1**, e as quebras já decididas nesta sessão não geram migração retroativa (não há usuário nem URL publicada anterior a elas). | Q9b | `CHANGELOG.md` (regra de incremento na seção da `ODDS Language Version`) · `RULES-EN.md`/`RULES-PT.md` (política de compatibilidade) · `PRD.md §5`/GH-003 (só MAJOR aciona migração) |
| **D21** | **Nasce a `ODDS Language Version`, separada das versões editoriais dos documentos — e a aplicação nunca migra o texto do usuário automaticamente.** Hoje não existe versão da linguagem (F18): o `CHANGELOG.md` mantém esquemas independentes por arquivo e o `RULES.md`, que é metade da semântica, não tem número — logo D20 não teria o que colocar na URL. A versão nova é incrementada **só quando o comportamento observável de um `.odds` muda**, e cada documento segue com seu changelog editorial. Rejeitado usar a versão do `GRAMMAR.md` como proxy: o catálogo de Q10 muda quais diagnósticos um arquivo *válido* produz **sem tocar na gramática**, então uma URL versionada por ela afirmaria compatibilidade inexistente — e D10 provou o inverso também, mexendo em gramática e RULES ao mesmo tempo. **Sem migração automática:** abrir uma URL antiga carrega o texto como está e deixa os diagnósticos de migração de D20 trabalharem. Motivos: migração automática exige carregar no bundle, para sempre, código de toda versão passada (peso permanente num produto 100% client-side); e reescrever o texto do usuário é exatamente o que D14 recusou ao proibir a inferência de `[SK]` — em *Architecture as Code* o texto é a fonte de verdade, não um rascunho que a ferramenta corrige. A versão existe para tornar a mensagem **específica**, não para editar o arquivo. | Q9a | `CHANGELOG.md` (seção nova para a `ODDS Language Version`, com a distinção entre versão de linguagem e versão de documento) · `PRD.md §5`/GH-003 · `RULES-EN.md`/`RULES-PT.md` (política de compatibilidade) · `CLAUDE.md` |
| **D20** | **A versão da linguagem viaja no payload da URL, não na linguagem.** Rejeitado o pragma no arquivo (`odds 0.2` no topo, estilo Solidity): o `.odds` é o artefato que a pessoa cola numa PR, e um pragma obrigatório cobraria de todo usuário, para sempre, o preço de um problema que só existe na fronteira da URL — que é gerada por máquina, onde um campo de versão é grátis. **Decisão que acompanha e vale independentemente de onde a versão more:** toda construção removida da linguagem ganha um **diagnóstico dedicado de migração** em vez de `SYNTAX_ERROR` genérico (ex: *"`[SW]` foi removida na v0.2 — use `-x-` sozinho"*). É esse mecanismo que resolve o problema do usuário de fato, e ele funciona igual para arquivo em Git e para URL. Motivação factual: esta sessão sozinha já quebrou compatibilidade duas vezes (D10 removeu `[SW]`, D6 tornou `external` reservada), então a dívida existe desde antes da v1. | Q9 | `PRD.md §5`/GH-003 (payload da URL ganha campo de versão) · `AST_SCHEMA.md §1` (família de codes de migração + fase, por D19) · `RULES-EN.md`/`RULES-PT.md` (política de construções removidas) · `TEST_SUITE.md` + golden file de construção removida |
| **D19** ✍️ *já propagada* | **O validador roda em fases, e a ordem de emissão é total e mecânica.** Seis fases (0 léxica/sintática · 1 estrutural · 2 declarativa · 3 referencial · 4 relacional · 5 estratégica): **todas as regras de uma mesma fase rodam e reportam**, e a invalidação de D18 só vale para as fases *seguintes*. Isso impede que a leitura larga de D18 vire "um diagnóstico por vez" — os dois problemas de `A --> [OHS] B` duplicada são ambos relacionais e aparecem juntos. **Ordem de emissão:** fase → `span.start.line` → `span.start.column` → `span.end.column` → `code` alfabético. As chaves posicionais fazem o painel ser lido na ordem do arquivo (comportamento de qualquer linter que o público já usa); a chave alfabética existe só para tornar a ordem **total**, sem a qual duas implementações conformes produziriam arrays diferentes e o `TEST_SUITE.md` não conseguiria asserir nenhuma. **Rejeitada** uma lista de prioridade entre codes mantida à mão: dependeria de atualização a cada regra nova e codificaria "qual problema importa mais", juízo que pertence a `severity`, não à posição no array. **Regra de admissão:** todo code novo recebe uma fase ao ser adicionado ao `AST_SCHEMA.md §1` — code sem fase não tem posição definida e não pode ser testado. **Resolve F9.** | Q8b | ✅ **`RULES-EN.md` §3 e `RULES-PT.md` §3 — já escritas** (exceção à política, ver §0) · **Pendente:** `AST_SCHEMA.md §1` (coluna de fase por code) · `TEST_SUITE.md §4` (referenciar a ordem) · **reordenar `role-conflict/expected.json`** (F17) · `CLAUDE.md` |
| **D18** ⚠️ *alcance fixado por Q8a* | **Princípio do erro-raiz: um elemento que já produziu um `error` é registrado como *declarado porém inválido* e não gera diagnósticos derivados.** *Alcance decidido em Q8a: leitura **larga** — o `error` remove o elemento do pipeline inteiro, não só das regras que consomem o que foi invalidado. Consequência aceita: consertar é iterativo (some `DUPLICATE_CONTEXT` entre um órfão descartado e um homônimo válido; o `CONFORMIST_CORE` de uma linha duplicada só aparece depois de apagada a duplicata). Racional: a leitura estreita obrigaria cada uma das ~24 regras do catálogo pós-Q10 a declarar de qual invalidação depende — o "caso a caso" que Q8 recusou, disfarçado de arquitetura. Com D17 (validação a cada tecla) a segunda passada custa zero.* Três consequências concretas: contextos descartados pelo panic-mode entram na `SymbolTable` marcados como inválidos, **matando a cascata `ORPHAN_CONTEXT` → `PHANTOM_REFERENCE`** (hoje um erro do usuário produziria dois diagnósticos, e o segundo seria falso — o contexto *foi* declarado, só que no lugar errado); linhas marcadas como `DUPLICATE_RELATIONSHIP` não são reavaliadas pelas demais regras; e, num par duplicado, **a primeira ocorrência é a que desenha**, coerente com a convenção de span que já culpa a segunda. Racional: é o que todo compilador faz ao suprimir erros em cascata após uma falha de parsing, e o efeito é manter a contagem de diagnósticos próxima da contagem de erros reais do usuário — a mesma preocupação de Q1b, aplicada a uma segunda fonte de ruído. D17 já **exigia** a entrada "declarado porém inválido": é ela que permite ao renderizador desenhar o nó fantasma em vez de nada. | Q8 | `RULES-EN.md`/`RULES-PT.md` (princípio novo, ao lado do princípio da autoria de D7) · `AST_SCHEMA.md §5` (`SymbolTableEntry` ganha marca de inválido) · `GRAMMAR.md §5.1` (o panic-mode passa a registrar, não só descartar) · `TEST_SUITE.md` + golden file de cascata · `CLAUDE.md` |
| **D17** | **Erro crítico não bloqueia mais a renderização: o diagrama degrada por elemento.** A AST parcial sempre renderiza o que for renderizável, e o elemento com problema aparece **marcado visualmente** (aresta tracejada vermelha para relação inválida, nó fantasma pontilhado para referência inexistente). Só `SYNTAX_ERROR` puro — onde não existe AST — congela o último diagrama bom em vez de apagá-lo. Motivos: **(1)** o `RULES.md` já abria exceção ao bloqueio para `ORPHAN_CONTEXT` (F15), então a regra global já era falsa; **(2)** o PRD promete *"instant visualization updates"* (§7.3) e responsividade durante a digitação (§8.2), e todo estado intermediário de um arquivo sendo digitado é um erro de sintaxe — sob bloqueio estrito o canvas piscaria vazio a cada tecla. **Duas sub-decisões inseparáveis:** o diagrama congelado precisa estar **marcado como obsoleto** (senão o canvas mente sobre o arquivo, o mesmo tipo de mentira que D3 recusou ao proibir supressão de `error`); e **o export é permitido com erros e inclui os marcadores** — o SVG é exatamente o canvas, sem versão "limpa", porque um export sem marcadores vira documentação afirmando um modelo que nunca foi válido. | Q7 | `RULES-EN.md`/`RULES-PT.md` §1 (título "Block Compilation" e a frase "block rendering" caem; resolve F15) · `PRD.md §4.6` ("prevent visualization" → degradação marcada) e §5.2 (marcadores no canvas + diagrama obsoleto) · `AST_SCHEMA.md` (`astGenerated` deixa de ser proxy de "renderizável") · `TEST_SUITE.md` (o campo `astGenerated` dos 19 casos passa a ter leitura diferente) |
| **D16** | **A mensagem textual deixa de ser contrato; o veredito estruturado passa a ser.** `message` **sai da interface `Diagnostic`**, que passa a ser `severity` + `code` + `span` + **`data: Record<string, string>`**. Os golden files asserem `data` no lugar de `message`. A mensagem vira função de renderização `(code, data, locale) => string`, alimentada por um **catálogo novo** chaveado por code, com placeholders nomeados **iguais às chaves de `data`** — o que dá uma verificação mecânica de que nenhum template referencia dado que o diagnóstico não carrega. Motivo de não parar em "só tirar `message` da asserção": hoje é a mensagem que verifica *sobre o quê* o diagnóstico fala — removida sem reposição, os dois golden files de `CONFORMIST_CORE` (gatilhos `[CF]` e `[BBM]`) ficam distinguíveis só por uma coluna acidental de span, e uma implementação que dispare o gatilho errado passa nos dois. **Efeitos colaterais:** o núcleo validador deixa de conhecer locale (PT/EN saem do parser); o `⚠️` sai das strings (F16); e `RULES-EN.md`/`RULES-PT.md` param de ser a fonte das mensagens, ficando só com gatilho e severidade — o que *ajuda* a sincronia exigida pelo `CLAUDE.md`, porque a parte que mais diverge entre traduções passa a morar num lugar único com PT e EN lado a lado. | Q6 | `AST_SCHEMA.md §1` (`Diagnostic`: −`message`, +`data`; corrigir o comentário que originou F2) · `TEST_SUITE.md §2`/§3 (formato do golden file e o `deepEqual` do executor) · **os 19 `expected.json`** (`message` → `data`) · **artefato novo** `MESSAGES.md`/`messages.json` (catálogo PT+EN) · `RULES-EN.md`/`RULES-PT.md` (as strings de mensagem saem; `⚠️` some) · `PRD.md §5.2` |
| **D15** | **Identidade de relação é o par não-ordenado `{left, right}`.** Qualquer segunda linha para o mesmo par é `DUPLICATE_RELATIONSHIP` (`error`), **sem distinguir** redundância (`A --> B` + `B <-- A`), contradição (`A --> B` + `A -x- B`) e split de tags (`A [OHS] --> B` + `A [S] --> B`); mais `SELF_RELATIONSHIP` (`error`). Não é escolha arbitrária: decorre de D11 — se o conector carrega a *forma da dependência entre dois times*, um par tem exatamente uma forma por vez, e uma segunda linha nunca é informação nova. Separar em dois codes exigiria do validador uma relação de equivalência semântica sobre conector+tags (é `[OHS]` "a mesma relação" que `[OHS, PL]`?) cujo único prêmio seria uma diferença de severidade numa linha que o usuário apaga de qualquer jeito. **Sub-decisões:** span ancora na **segunda** ocorrência (convenção já existente em `TEST_SUITE.md §4`); e **regras agregadas contam relações distintas, não linhas** — sem isso, `A [SK] <-> B` colado duas vezes sozinho estoura o limiar de 2 do `EXCESSIVE_SHARED_KERNEL`. **Ganho estrutural:** uma linha = uma aresta (o renderizador nunca mescla), e `SEPARATION_CONFLICT`/regras de posição nunca precisam tratar o mesmo par declarado duas vezes. | Q5 | `RULES-EN.md`/`RULES-PT.md` §1 (regra de identidade + 2 regras novas + cláusula "agregadas contam relações distintas") · `AST_SCHEMA.md §1` (+2 codes) · `PRD.md §4.6` · `TEST_SUITE.md` + golden files (2 casos novos) · `CLAUDE.md` |
| **D14** | **Inferência automática de `[SK]`/`[P]` é proibida: as duas exigem declaração explícita nos dois lados** (novo code `INCOMPLETE_MUTUAL_TAG`, `error`). Elimina o "ou o parser pode inferir" de `RULES.md §C`, que tornava duas implementações igualmente conformes divergentes na saída (F1). Racional: inferência silenciosa faz o `.odds` e o diagrama renderizado discordarem, e numa ferramenta de Architecture as Code o texto é a fonte de verdade, não um esboço que a ferramenta completa; além disso, Shared Kernel e Partnership são acordos **bilaterais**, e escrever os dois lados é o próprio ato de registrar que a outra equipe também assinou embaixo. | Q4a (parte 2) | `RULES-EN.md`/`RULES-PT.md` §C (remover a cláusula de inferência) · `AST_SCHEMA.md §1` (+1 code) · `CLAUDE.md` (corrige F1) · `TEST_SUITE.md` + golden file |
| **D13** | **`[BBM]` é permitido em qualquer conector e qualquer lado, e é documentado como categoria própria de anotação** — não como décima tag de padrão. É a única linha da matriz de D12 que atravessa todas as colunas, e a única isenta das regras de posição e de conflito, porque não descreve uma solução aplicada na fronteira: caracteriza o sistema (F14). Restringi-lo a relações direcionais converteria uma limitação da *regra atual* (`CONFORMIST_CORE` só consome BBM no lado Upstream) em limitação da *linguagem* — e tornaria inexprimíveis duas afirmações legítimas: "aquele ERP é uma bagunça e **por isso** decidimos não integrar" (`-x-`) e "nós alimentamos o pântano de um terceiro" (BBM no Downstream). **Custo aceito:** `-x-` deixa de ser "conector sem nenhuma tag" e `SEPARATION_CONFLICT` precisa de uma exceção explícita para `[BBM]`. | Q4a (parte 1) | `RULES-EN.md`/`RULES-PT.md` (matriz + exceção em `SEPARATION_CONFLICT` + seção das três categorias) · `PRD.md §4.5` (BBM sai da tabela de padrões para uma linha própria) · `CLAUDE.md` |
| **D12** | **A matriz tag × conector × lado passa a ser normativa e explícita**, derivada do mapeamento Team Relationship → Context Map Patterns: `<->` aceita apenas `SK` e `P`; `-->`/`<--` aceitam `OHS`/`PL`/`S` (Upstream) e `C`/`CF`/`ACL` (Downstream); `-x-` não aceita tag de padrão alguma. A validação de tag ganha uma **segunda dimensão independente** — compatibilidade com o *conector*, além da já existente compatibilidade com o *lado* —, com dois codes novos: `MUTUAL_TAG_ON_DIRECTIONAL` e `POSITIONAL_TAG_ON_MUTUAL`. Efeito colateral positivo: `SEPARATION_CONFLICT` colapsa numa regra de uma linha, sem enumerar tags. | Q4 (a) e (b) | `RULES-EN.md`/`RULES-PT.md` §C/§D (tabela normativa nova + reescrita de `SEPARATION_CONFLICT`) · `AST_SCHEMA.md §1` (+2 codes) · `PRD.md §4.5`/§4.6 · `TEST_SUITE.md` + golden files (2 casos novos) · `CLAUDE.md` |
| **D11** ⚠️ *ampliada por Q4a* | **Documentar o modelo de categorias de anotação** — princípio organizador que hoje não está escrito em lugar nenhum. São **três**, não duas: **(1)** o **conector** carrega a *forma da dependência* entre times (Team Relationship); **(2)** a **tag de padrão** carrega a *solução aplicada na fronteira* (Context Map Pattern); **(3)** `[BBM]` carrega a *caracterização do sistema*, e é ocupante único dessa categoria (F14). As categorias (1) e (2) são independentes em todas as combinações, **exceto em Separate Ways** — único caso em que degeneram num ponto só, por ser o padrão cuja aplicação é a ausência de integração, indistinguível da forma de dependência "Free"; daí a legitimidade de D10. A categoria (3) explica por que `[BBM]` é a única anotação sem regra de posição e sem regra de conflito. Critério que fica valendo para qualquer anotação futura: *descreve uma solução aplicada sobre uma dependência, apenas renomeia a dependência, ou caracteriza um sistema?* | Q3b + Q4a | `RULES-EN.md`/`RULES-PT.md` (seção conceitual nova, antes das tabelas existentes) · `PRD.md §4.3`/§4.5 (as tabelas passam a ser apresentadas como categorias, não listas soltas; BBM ganha linha própria) · `CLAUDE.md` |
| **D10** | **Remover a tag `[SW]` da linguagem.** `-x-` passa a significar *Free / Separate Ways*. A tag tinha quatro grafias válidas de significado idêntico (`A -x- B`, `A [SW] -x- B`, `A -x- [SW] B`, `A [SW] -x- [SW] B`) e uma grafia inválida cuja regra só existia porque a tag existia. Nenhuma informação se perde: como `UNDOCUMENTED_CONTRACT` não dispara em `-x-`, nem havia incentivo a declará-la; e toda linha `-x-` que alguém se dá ao trabalho de escrever já é, na prática, uma decisão deliberada de não integrar. | Q3b | `GRAMMAR.md §3` (produção `tag` perde `"SW"`) · `AST_SCHEMA.md §4` (`PatternTag` 10 → 9) · `RULES-EN.md`/`RULES-PT.md` §D (o ramo tag-vs-conector de `SEPARATION_CONFLICT` desaparece, incluindo a mensagem dedicada) · `PRD.md §4.5` (tabela 10 → 9 tags) e §4.6 · `CLAUDE.md` (frase sobre `SW`) · **excluir** o golden file `separation-conflict-sw-directional` e atualizar a cobertura de `TEST_SUITE.md` (20 → 19 casos) |
| **D9** ⚠️ *emendada por Q3a* | **Toda tag é escopo de relação, sem exceção — inclusive `[BBM]`.** A regra geral ("uma tag qualifica *um lado de uma relação específica*, não o contexto") passa a estar escrita no `RULES.md`; hoje é só implícita, e as regras atuais assumem as duas leituras em momentos diferentes. *A versão original desta decisão abria uma exceção movendo `[BBM]` para propriedade de contexto; Q3a reverteu essa metade para preservar a fronteira "tag = contrato validável / propriedade = documentação" (F13), e a regra ficou mais simples por causa disso.* **Custo aceito:** `[BBM]` precisa ser repetida em toda linha que toca o sistema, e a contradição entre linhas não é detectada — mitigação candidata (`INCONSISTENT_BBM`) enfileirada para o catálogo da Rodada 2. | Q3 + Q3a | `RULES-EN.md`/`RULES-PT.md` (escrever a regra de escopo + limitação conhecida). **Nada mais muda:** `PatternTag`, `GRAMMAR.md §3`, `PRD.md §4.5`, o gatilho (b) do `CONFORMIST_CORE` e o golden file `conformist-core-warning-bbm` ficam como estão |
| **D8** | **O bloco `external` é único e anônimo**, posicionado entre os `subdomain` e o `mapping` em `domain_decl`. Sem grupos nomeáveis: um nome de grupo sem semântica vira classificação improvisada que a ferramenta não sabe validar, recriando por outro caminho a taxonomia recusada em D6. **Relações externo↔externo são proibidas** (novo code `EXTERNAL_ONLY_RELATIONSHIP`, `error`), pelo princípio da autoria (D7): como dois fornecedores conversam entre si não é decisão sua, não é acionável, e nenhuma regra de padrão consegue validá-la — permitir transformaria o `.odds` em diagrama de sistemas genérico. | Q2c | `GRAMMAR.md §2` (ordem em `domain_decl`) · `AST_SCHEMA.md §1` (+1 code) e §3 · `RULES-EN.md`/`RULES-PT.md` · `TEST_SUITE.md` + golden file do novo code |
| **D7** | **Princípio da autoria, aplicável a toda regra presente e futura:** isenta-se do linting o que pressupõe **controle sobre o sistema**; mantém-se o que descreve a **decisão de integração do autor**. Na prática: `GENERIC_WITHOUT_OHS` não vale para externo (você não desenha a API deles); `UNDOCUMENTED_CONTRACT`, `CONFORMIST_CORE`, integridade referencial e todas as regras de posição/conflito de tag continuam valendo. O princípio deve ser escrito no `RULES.md` como critério obrigatório de admissão de regra nova. | Q2b | `RULES-EN.md`/`RULES-PT.md` (seção de princípio + coluna "vale para externo?" por regra) · o catálogo da Rodada 2 nasce com essa coluna |
| **D6** | **O contexto externo mora num bloco dedicado `external { }`, irmão de `subdomain`, dentro do `domain`.** Preserva o invariante estrutural (todo `context` dentro de um bloco declarado ⇒ `ORPHAN_CONTEXT` e o panic-mode recovery de `GRAMMAR.md §5.1` seguem valendo sem exceção) e mantém `core`/`supporting`/`generic` como vocabulário exclusivo do espaço do problema. **Derivação forçada:** interno e externo compartilham o mesmo espaço de nomes (`mapping` referencia por identificador simples), logo `DUPLICATE_CONTEXT` vale entre eles e a `SymbolTable` precisa acomodar entradas sem subdomínio. **Contradição conceitual assumida e a documentar:** o "externo" fica declarado *dentro* do `domain`, que por definição não o contém — aceito por pragmatismo (a alternativa, declarar no nível do `program`, colide com `INVALID_DOMAIN_CARDINALITY` e com "um arquivo = um domain", que sustenta GH-003). | Q2a | `GRAMMAR.md §1` (`external` vira `reserved_word`) e §2 (produção `external_decl` + ordem em `domain_decl`) · `AST_SCHEMA.md §3` (`ExternalContextNode` ou flag em `ContextNode`) e §5 (`SymbolTableEntry` com subdomínio opcional) · `RULES-EN.md`/`RULES-PT.md` · `PRD.md §4.1`/§4.2 · `TEST_SUITE.md` + golden files · `CLAUDE.md` |
| **D5** | **Sistemas externos/de terceiros são cidadãos de primeira classe da linguagem.** Deixa de ser necessário mentir que a Stripe ou um ERP de outra empresa é um contexto de um subdomínio seu. Em contrapartida, **duas limitações ficam formalmente aceitas e devem ser documentadas como tal**, em vez de permanecerem implícitas: (1) Context ⊂ Subdomain continua 1:1, embora no DDD real a relação problema↔solução seja n:m; (2) mapas que cruzam múltiplos domínios seguem impossíveis por construção (um arquivo = um `domain`). | Q2 | `GRAMMAR.md §2` (produção nova) · `AST_SCHEMA.md §3` (nó novo) · `RULES-EN.md`/`RULES-PT.md` (semântica + seção de limitações conhecidas) · `PRD.md §4.1` (a taxonomia estrita ganha uma quarta categoria) · `TEST_SUITE.md` + golden files · `CLAUDE.md` |
| **D4** | **A diretiva é exclusivamente de linha e a justificativa é obrigatória:** `// odds-disable-next-line <CODE>: <justificativa>`. Sem variantes de bloco ou de arquivo — supressão em atacado é como um linter é derrotado em silêncio, e arquivos `.odds` são pequenos demais para precisar disso. Toda regra já tem exatamente uma linha-âncora pela convenção de span de `TEST_SUITE.md §4` (inclusive as de escopo agregado), então granularidade de linha é universalmente suficiente. Dois codes novos, ambos `info`: `MALFORMED_SUPPRESSION` (code inexistente ou justificativa ausente — nunca `SYNTAX_ERROR`: um comentário quebrado não pode derrubar o parsing) e `UNUSED_SUPPRESSION` (a regra parou de disparar). | Q1d | `GRAMMAR.md §1` (`line_comment` ganha forma estruturada quando prefixado por `odds-disable-next-line`) · `AST_SCHEMA.md §1` (+2 codes) · `RULES-EN.md`/`RULES-PT.md` (seção de supressão) · `TEST_SUITE.md` + golden files (casos: supressão válida, malformada, obsoleta, e tentativa de suprimir `error`) |
| **D3** | **Supressão de diagnósticos mora no arquivo `.odds`, via diretiva em comentário, e alcança `warning` e `info` — nunca `error`.** Motivo do alcance: o escape hatch existe para decisões conscientes contra um conselho estratégico, não para esconder incoerência do modelo; silenciar um `PHANTOM_REFERENCE` faria o diagrama mentir. Motivo de morar no arquivo: a supressão precisa viajar no Git, na URL compartilhada (GH-003) e no code review — se morasse na UI, dois usuários veriam painéis diferentes para o mesmo desenho. **Custo assumido:** comentários deixam de ser sintaticamente insignificantes; o lexer não pode mais descartá-los antes do parser. | Q1c | `GRAMMAR.md §1` (regra léxica de comentários — hoje diz que são descartáveis) e nova produção `suppression_directive` · `AST_SCHEMA.md` (as diretivas precisam sobreviver até o Visitor) · `RULES-EN.md`/`RULES-PT.md` (seção nova sobre supressão) · `TEST_SUITE.md` + golden files (casos de supressão) · `PRD.md §5.2` |
| **D2** | **Três níveis de severidade: `error` \| `warning` \| `info`.** `info` é o destino das regras de higiene/estilo, separado do `warning` estratégico, para não inflar o contador que o usuário olha de relance. Decorre daí: o sufixo `_WARNING` nos codes existentes deve ser removido (o `code` nomeia a regra; a severidade vive só no campo `severity`), e os 4 warnings atuais precisam ser reclassificados entre `warning` e `info` — reclassificação adiada para a Rodada 2 junto com o catálogo. | Q1b | `AST_SCHEMA.md §1` (`DiagnosticSeverity` + renomear os 4 codes) · `RULES-EN.md`/`RULES-PT.md` §2 (título da seção "Lint Warnings" e severidade por regra) · `TEST_SUITE.md` + os 5 `expected.json` que hoje trazem `"severity": "warning"` · `PRD.md §5.2` (o painel passa a ter 3 níveis) |
| **D1** | **A ODDS é um linter opinativo, não uma notação neutra.** Além das validações de integridade estrutural, a ferramenta emite juízo sobre a qualidade do desenho estratégico de DDD. O conjunto atual de 4 warnings é reconhecidamente raso para essa ambição e deve ser expandido por um catálogo explícito de boas práticas (entregável da Rodada 2). | Q1 | `PRD.md §4.6` e §2.4 (o diferencial frente ao Context Mapper passa a ser afirmado, não implícito) · `RULES-EN.md`/`RULES-PT.md` §2 (novas regras) · `AST_SCHEMA.md §1` (novos `SemanticDiagnosticCode`) · `TEST_SUITE.md` + `golden-files/` (um caso por code novo) · `CLAUDE.md` (seção de modelo de validação) |

---

## 4. Fronteira atual

### Aberto agora (Rodada 2)

~~Q8~~ ✅ → D18. ~~Q8a~~ ✅ → alcance de D18. ~~Q8b~~ ✅ → D19 (**já propagada** para `RULES-EN.md §3`/`RULES-PT.md §3`; resolve F9, expõe F17). ~~Q9~~ ✅ → D20. ~~Q9a~~ ✅ → D21 (resolve F18). ~~Q9b~~ ✅ → D22. ~~Q10~~ ✅ → D23 + D24. **Rodada 2 fechada.**

### 🟢 Fronteira vazia

~~Q11~~ ✅ → D25. **Nenhuma pergunta em aberto.** A árvore de decisões foi percorrida até o fim: 25 decisões, 3 rodadas, nenhum ramo por visitar.

O que resta é **execução**, consolidada abaixo por arquivo. A fonte de verdade continua sendo a coluna "artefatos a atualizar" de cada decisão em §3 — a lista abaixo é só o índice invertido dela.

| Artefato | Escopo da mudança |
|---|---|
| `RULES-EN.md` / `RULES-PT.md` | O maior volume. Seções conceituais novas (três categorias de anotação D11, princípio da autoria D7, segundo critério de admissão D24, escopo de tag D9, supressão D3/D4, política de compatibilidade D21/D22), matriz normativa tag × conector × lado (D12/D13), 10 regras novas + severidades (D23), remoção de `[SW]` (D10), fim do "bloqueia a renderização" (D17), saída das strings de mensagem para o catálogo (D16). **§3 já escrita** (D19). |
| `AST_SCHEMA.md` | `DiagnosticSeverity` para 3 níveis (D2); `Diagnostic` perde `message` e ganha `data` (D16); +18 codes, cada um com **fase** (D19/D23); renomear os 4 codes tirando `_WARNING` (D2); `ExternalContextNode` e `SymbolTableEntry` com subdomínio opcional (D6) e marca de inválido (D18); `PatternTag` 10 → 9 (D10). |
| `GRAMMAR.md` | `external` como palavra reservada e produção `external_decl`, ordem em `domain_decl` (D6/D8); `suppression_directive` e comentários deixando de ser descartáveis (D3/D4); `tag` perde `"SW"` (D10); §7 obsoleta (F3); panic-mode passa a registrar, não só descartar (D18). |
| `PRD.md` | §4.1/4.2 (quarta categoria + poder expressivo de cada vista, D5/D25), §4.5 (9 tags, BBM em linha própria, D10/D11/D13/D25), §4.6 (degradação em vez de bloqueio D17, catálogo D23, F4), §5.2 (3 níveis, marcadores, diagrama obsoleto), §5/GH-003 (versão no payload, D20/D22). |
| `TEST_SUITE.md` + `golden-files/` | Formato do golden file e executor (`message` → `data`, D16); excluir `separation-conflict-sw-directional` (D10); **reescrever `valid-baseline`** (F10+F11) e `excessive-shared-kernel-warning` (F12); **reordenar `role-conflict`** (F17); ~14 casos novos (D4, D8, D12, D15, D20, D23); severidades reclassificadas (D2/D23). |
| `CHANGELOG.md` | Seção nova da `ODDS Language Version` com a regra de incremento SemVer (D21/D22), distinta das versões editoriais por arquivo. |
| **`MESSAGES.md` / `messages.json`** | **Artefato novo** — catálogo de mensagens por code, PT+EN, com placeholders casando com as chaves de `data` (D16). |
| `CLAUDE.md` | Corrigir F1; refletir D9, D10, D11, D12, D13, D18, D19, D21, D23, D24, D25 e o novo modelo de validação. |

### Rodada 1 — fechada
~~Q1~~ ✅ → D1. ~~Q1b~~ ✅ → D2. ~~Q1c~~ ✅ → D3. ~~Q1d~~ ✅ → D4. ~~Q2~~ ✅ → D5. ~~Q2a~~ ✅ → D6. ~~Q2b~~ ✅ → D7. ~~Q2c~~ ✅ → D8. ~~Q3~~ ✅ → D9. ~~Q3a~~ ✅ → emenda a D9. ~~Q3b~~ ✅ → D10 + D11. ~~Q4~~ ✅ → D12 + D13 + D14 (e ampliação de D11). ~~Q4a~~ ✅. ~~Q5~~ ✅ → D15. ~~Q6~~ ✅ → D16. **Aberto: Q7** — ver §2.

> ✅ **Subárvore de Q1 (postura de validação) fechada.** Quatro decisões: linter opinativo (D1), três níveis de severidade (D2), supressão no arquivo alcançando `warning`+`info` (D3), diretiva de linha com justificativa obrigatória (D4).
>
> ✅ **Subárvore de Q2 (mundo externo) fechada.** Quatro decisões: cidadania para sistemas de terceiros com duas limitações formalmente aceitas (D5), bloco `external` irmão de `subdomain` (D6), princípio da autoria como critério de admissão de regra (D7), bloco único anônimo sem relações externo↔externo (D8).
>
> ✅ **Subárvore de Q3 (escopo de tag) fechada.** Toda tag é escopo de relação sem exceção (D9, emendada), `[SW]` removida (D10), e o modelo de dois eixos passa a ser documentado (D11).
>
> ✅ **Subárvore de Q4 (matriz tag × conector × lado) fechada.** Matriz normativa (D12), `[BBM]` como categoria própria em qualquer posição (D13), inferência de `[SK]`/`[P]` proibida (D14).
>
> ✅ **Q5 (identidade de relação) fechada** → D15. ✅ **Q6 (contrato do diagnóstico) fechada** → D16.
>
> 🎯 **O catálogo de boas práticas (entregável da Rodada 2) está desbloqueado.** Resta **uma** pergunta-raiz da Rodada 1: **Q7**.

### Bloqueado, aguardando as respostas pendentes

Ramos já identificados que dependem das respostas acima. Não são perguntados agora para não induzir a resposta:

| Ramo | Depende de | Situação |
|---|---|---|
| **Catálogo das regras opinativas** — quais boas práticas de DDD viram feedback (candidatos levantados: domínio sem nenhum `core`; core como Upstream de genérico (F11); core dentro de um Shared Kernel (F12); contexto declarado e nunca mapeado; subdomínio vazio; Customer/Supplier declarado só de um lado; dois contextos do mesmo `team` em relação Upstream/Downstream; `INCONSISTENT_BBM`, do custo aceito em Q3a) — **inclui a reclassificação dos 4 warnings existentes entre `warning` e `info`, e a coluna "vale para contexto externo?" imposta por D7** | ~~Q1~~ ✅ + ~~Q1b~~ ✅ + ~~Q2~~ ✅ + ~~Q3~~ ✅ | 🟢 **Desbloqueado** — entregável da Rodada 2, montável assim que a Rodada 1 fechar |
| Renomear os codes removendo o sufixo `_WARNING` | ~~Q1b~~ ✅ | 🟡 Recomendado, a executar na passada final — custo mínimo agora, cresce com o catálogo da Rodada 2 |
| Sintaxe do contexto externo / de terceiros | Q2 | 🔴 |
| Como o `[BBM]` migra de tag para propriedade sem quebrar os golden files existentes | Q3 | 🔴 |
| Ordenação total e determinística dos diagnósticos (F9) | ~~Q4~~ ✅ + ~~Q5~~ ✅ + Q10 | 🟡 Bloqueado só pelo catálogo (Q10) |
| Reescrita dos golden files e do executor de testes | ~~Q4~~ ✅ + ~~Q5~~ ✅ + ~~Q6~~ ✅ + ~~Q1b~~ ✅ + Q10 | 🟡 Escopo já conhecido (`message` → `data` por D16, renomear codes por D2, excluir `separation-conflict-sw-directional` por D10, casos novos de D8/D12/D15) — falta o que Q10 acrescentar, inclusive reescrever `valid-baseline` e `excessive-shared-kernel-warning` |
| ~~Regras se aplicam sobre elementos já inválidos?~~ | ~~Q7~~ ✅ | 🟢 Virou **Q8** |
| ~~Qual linha sobrevive para desenhar num par duplicado~~ | ~~Q7~~ ✅ + ~~Q5~~ ✅ | 🟢 Absorvida pela **Q8** (parte 3) |
| ~~Versionamento da linguagem~~ | ~~Q4~~ ✅ | 🟢 Virou **Q9** |
| Sobrecarga da propriedade `type` no vocabulário (F10) | ~~Q1~~ ✅ | 🟡 Confirmado como problema real a corrigir na passada final — com a ferramenta opinativa, um exemplo canônico que ensina o vocabulário errado é passivo, não detalhe estético. Cai junto com a reescrita de `valid-baseline` exigida pela tensão 4 de Q10 |
| Unicidade de nome de `subdomain` (F8) | ~~Q1~~ ✅ | 🟢 Proposto em Q10 como `DUPLICATE_SUBDOMAIN` (`error`) |
