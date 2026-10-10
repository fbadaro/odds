# HEALTH

Estado de saúde do modelo ODDS. Versão deste arquivo: **v0.6.6** · Última aferição: **2026-10-10** (`python3 .claude/skills/health-check/scripts/health_check.py`, 16/16 conformes).

Este repositório não tem código, nem build, nem CI — o produto, hoje, **é a especificação**. Então saúde aqui não pode ser cobertura de teste nem build verde: é *quão íntegro está o modelo*. Um repositório de spec adoece do mesmo jeito que um modelo de domínio adoece — a linguagem escorrega, dois documentos passam a afirmar coisas diferentes sobre o mesmo conceito, uma regra entra sem ancoragem, um número é afirmado em prosa e nunca reconferido. Este arquivo mede exatamente isso.

**O que este arquivo não é:** não é a `ODDS Language Version` (essa vive no `CHANGELOG.md` e responde por compatibilidade de arquivo `.odds`), não é o `CHANGELOG.md` (que registra *o que* mudou), e não é um certificado de qualidade. É o painel de um linter opinativo aplicado ao próprio projeto — coerente com o que a ODDS é.

**O que este arquivo deliberadamente não mede:** velocidade, volume de documentação e quantidade de regras. Mais regras não é mais saúde — pelos dois critérios de admissão de `RULES.md` §0.4, **rejeitar** uma regra que não passa é um ato saudável, e está no catálogo de bonificações como tal.

---

## 0. Como ler o placar

Escala **0–100**, ponderada em seis dimensões. Cada dimensão tem uma **natureza**, e a natureza define como ela se move:

- **Integridade** — nasce em 100 e **só cai**. Recupera exclusivamente fechando débito. Trabalho novo nunca compra ponto aqui. É a trava que impede o vício clássico de compensar incoerência com volume: escrever mais três documentos não conserta uma contradição entre os dois que já existiam.
- **Construção** — nasce em 0 e sobe com trabalho aditivo, teto em 100. Ausência não é débito; ausência é simplesmente nota baixa. Débito, numa dimensão de construção, é só quando existe algo *defeituoso ou não verificado*, não quando falta algo.

| Faixa | Veredito |
|---|---|
| 90–100 | Saudável — o modelo se sustenta sozinho |
| 75–89 | Sólido, com débito localizado |
| 60–74 | Em risco — o débito já contamina decisões novas |
| 40–59 | Modelo comprometido — parar de adicionar e reparar |
| 0–39 | Incoerente — a spec não pode ser implementada como está |

---

## 1. As dimensões

| # | Dimensão | Natureza | Peso | O que mede | Como se verifica |
|---|---|---|---|---|---|
| 1 | **Coerência Normativa** | Integridade | 25 | Os cinco artefatos normativos dizem a mesma coisa sobre cada code: `AST_SCHEMA.md` §1.3 (code + fase + chaves de `data`), `RULES-EN`, `RULES-PT`, `MESSAGES.md`, golden file | Checagens C1, C2, C10 — cruzamento mecânico dos 35 codes nos artefatos |
| 2 | **Língua Ubíqua** | Integridade | 15 | Um termo, um significado, em todo o repositório. Construtos removidos permanecem removidos. Severidade fora do nome do code, mensagem fora do contrato, locale fora do `data` | Checagens C5, C6, C7 — paridade EN/PT, construtos removidos e vocabulário morto |
| 3 | **Fidelidade Estratégica ao DDD** | Construção | 20 | Toda regra ancorada num conceito de DDD estratégico; os dois critérios de admissão (§0.4) respondidos por escrito; extensões conscientes declaradas **como** extensões (o split `C`/`S`); limitações nomeadas em vez de escondidas | **Julgamento de modelo sob a rubrica §9.1**, com a aritmética conferida por C11 |
| 4 | **Cobertura Executável** | Construção | 20 | A suíte de golden files existe, cobre todo code, e **foi executada contra uma implementação real** | Checagens C3, C4 — cobertura code a code e integridade dos casos — mais o débito D-001 |
| 5 | **Disciplina de Versionamento** | Integridade | 10 | Os dois eixos do `CHANGELOG.md` nunca se misturam; toda mudança normativa fecha o passe com entrada de changelog e incremento pela tabela | Leitura do `CHANGELOG.md` contra o diff do passe (não automatizado — débito D-005) |
| 6 | **Prontidão de Implementação** | Construção | 10 | Quanto falta para alguém escrever o parser sem tomar decisão que a spec deveria ter tomado | **Julgamento de modelo sob a rubrica §9.2**, com a aritmética conferida por C11 |

---

## 2. Placar atual — **88 / 100** · *Íntegro; e a suíte é o instrumento errado para o que falta medir*

O placar é **derivado, não arbitrado**. Vale, em toda dimensão:

> **nota = base − Σ(débitos abertos da §5)** · **contribuição = peso × nota / 100** · **total = Σ contribuições**

Numa dimensão de **integridade** a base é 100 por definição — ela não tem o que ganhar, só o que perder. Numa dimensão de **construção** a base é o que foi efetivamente conquistado. O script da §8 confere cada célula desta tabela contra a §5 e contra a §9; nenhum número aqui é afirmação.

| # | Dimensão | Natureza | Peso | Base | Débitos | Nota | Contribuição |
|---|---|---|---:|---:|---:|---:|---:|
| 1 | Coerência Normativa | Integridade | 25 | 100 | 0 | 100 | 25,00 |
| 2 | Língua Ubíqua | Integridade | 15 | 100 | 0 | 100 | 15,00 |
| 3 | Fidelidade Estratégica ao DDD | Construção | 20 | 77 | 0 | 77 | 15,40 |
| 4 | Cobertura Executável | Construção | 20 | 70 | 0 | 70 | 14,00 |
| 5 | Disciplina de Versionamento | Integridade | 10 | 100 | −4 | 96 | 9,60 |
| 6 | Prontidão de Implementação | Construção | 10 | 91 | 0 | 91 | 9,10 |
| | **Total** | | **100** | | **−4** | | **88,10** |

As bases das dimensões 3 e 6 são **alocadas por rubrica** (§9), não escolhidas: cada uma é a soma de critérios nomeados com teto e evidência.

**Leitura em uma frase:** as duas dimensões de **integridade** seguem em 100 — o modelo não se contradiz e não fala duas línguas. O maior débito do projeto fechou: os 44 golden files passam contra um parser real, e a dimensão 4 deixa de carregar −20. Resta uma dívida só, e pequena: o fechamento de passe no `CHANGELOG.md` ainda é humano (−4). O que falta agora **não é dívida** — é nota de construção nas dimensões 3 e 6, que é o que elas existem para dizer: sem UI, sem render, sem rastreio à literatura.

---

## 3. Catálogo de bonificações

Um evento só entra no histórico se estiver aqui. Numa dimensão de **integridade**, bonificação só se aplica enquanto houver débito aberto naquela dimensão — é reparo, não crédito.

| Evento | Dimensão | Δ |
|---|---|---:|
| **Auditoria mecânica que encontra lacuna real** (uma varredura da §8 que expõe divergência que a leitura não pegou) | a da lacuna | **+6** |
| Ciclo completo de regra nova, na ordem fixa: `AST_SCHEMA` §1.3 → `RULES` (2 idiomas) → `MESSAGES` (2 idiomas) → golden file | 1 | +5 |
| Golden file executado com sucesso contra parser real, span conferido | 4 | +5 |
| Ambiguidade normativa fechada com escolha declarada (ex.: unidade de `column` = UTF-16) | 6 | +4 |
| **Regra nova rejeitada** por não passar nos dois critérios de admissão (§0.4), com a rejeição registrada | 3 | +4 |
| Limitação conhecida nomeada e assumida em vez de contornada em silêncio | 3 | +3 |
| Regra existente ancorada explicitamente em fonte da literatura (`REFERENCES.md`) ou em ADR | 3 | +3 |
| Débito desta lista fechado com evidência (não com afirmação) | a do débito | +valor do débito |
| Verificação antes automática do que manual: script que passa a checar o que era conferido a olho | a checada | +4 |
| Decisão de stack/toolchain tomada e registrada em ADR | 6 | +6 |
| Caso auxiliar de golden file cobrindo interação entre regras (não um code novo) | 4 | +2 |
| Tradução EN/PT sincronizada **no mesmo passe** da edição | 2 | +2 |

---

## 4. Catálogo de penalizações

**Toda penalização em dimensão de integridade abre débito na §5** — não existe desconto "pontual" ali. Uma falha corrigida no mesmo passe é um débito aberto e fechado na mesma linha do histórico: saldo zero no placar, cicatriz preservada no registro. A alternativa (descontar para sempre sem abrir débito) tornaria integridade irrecuperável, e toda dimensão de integridade tenderia a zero com o tempo — o placar mede o **estado atual**, e o histórico é que guarda o passado.

Em dimensões de **construção** a penalização pode ser pontual: ela derruba a *base*, e a base é reconquistável com trabalho.

| Evento | Dimensão | Δ | Débito |
|---|---|---:|---|
| Code introduzido **sem fase** em `AST_SCHEMA.md` §1.3 | 1 | −8 | sim |
| Code presente num artefato e ausente em outro dos cinco | 1 | −6 | sim |
| Ordem de emissão (`RULES.md` §3.3) violada por uma regra nova | 1 | −5 | sim |
| Número afirmado em prosa e não reconferido contra o catálogo (aconteceu: "24 regras" → 34) | 1 | −3 | sim |
| **Nota ajustada sem evento tipado no histórico** | 1 | −5 | sim |
| Linha do histórico fora de ordem cronológica, ou último total do razão divergente do placar da §2 | 1 | −3 | sim |
| `RULES-EN` editado sem `RULES-PT` no mesmo passe (ou vice-versa) | 2 | −5 | sim |
| Prosa, locale, emoji ou palavra de severidade dentro de `data` | 2 | −6 | sim |
| Severidade de volta no **nome** do code (sufixo `_WARNING` e parentes) | 2 | −8 | sim |
| Construto removido reintroduzido (`[SW]`, `message` no `Diagnostic`) | 2 | −8 | sim |
| Regra nova que fere o princípio da autoria ou duplica o *fix* de outra regra | 3 | −7 | base |
| **Propriedade de contexto alimentando gatilho de regra** — a fronteira "tag = contrato validável / propriedade = documentação" | 3 | −10 | base |
| Decisão de design tomada sem registro do **porquê** | 3 | −3 | base |
| Golden file adicionado sem `expected.json` completo, ou com span não derivado da gramática | 4 | −4 | sim |
| **Divergência entre a implementação e um artefato normativo encontrada fora da aferição** (revisão humana ou externa vendo o que a suíte verde não viu) | 4 | −5 | base |
| Passe normativo fechado sem entrada no `CHANGELOG.md` | 5 | −4 | sim |
| Os dois eixos de versionamento misturados numa afirmação | 5 | −6 | sim |
| Incremento de versão fora da tabela do `CHANGELOG.md` | 5 | −3 | sim |

A linha "nota ajustada sem evento tipado" é o que mantém este arquivo honesto: se o placar puder ser ajustado no olho, ele deixa de medir o projeto e passa a medir o humor de quem editou. É também a única penalização que o `health_check.py` cobra sozinho — as checagens C8 e C9 falham quando a §2 e a §5 divergem.

---

## 5. Débitos abertos

| ID | Dimensão | Débito | Custo | Fecha quando |
|---|---|---|---:|---|
| **D-005** | 5 · Disciplina de Versionamento | Nada verifica que um passe normativo fechou com entrada no `CHANGELOG.md` e incremento pela tabela. A disciplina é inteiramente humana, e o histórico mostra que ela já falhou uma vez em outro eixo (os números não reconferidos) | −4 | O `health_check.py` passar a cruzar o diff do passe com o `CHANGELOG.md` |

**O único débito restante é de uma coisa que não existe** — a verificação de fechamento de passe —, não de coisa escrita errado. Ausência de UI, de render e de rastreio à literatura **não** é débito: é nota de construção nas dimensões 3 e 6, que é o que elas existem para dizer.

**Fechados** (a evidência de cada um está na linha correspondente da §7): D-002 e D-003 em 2026-08-16, D-004 e D-006 em 2026-08-24, **D-001 em 2026-09-05**. O `GRILLING.md` continua isento da varredura de termo morto por ser registro histórico, e o preço dessa isenção passou a ser cobrado: C7 verifica que o vocabulário morto não vazou dele para nenhum documento normativo, e C15 verifica que o próprio arquivo avisa o leitor, num glossário, sobre cada termo que ele usa e que já não vale.

---

## 6. Protocolo de atualização

1. **Quando.** No mesmo passe de qualquer mudança normativa. O `HEALTH.md` fecha o passe, junto do `CHANGELOG.md` — a diferença é que o changelog registra *o que* mudou e este arquivo registra *o que aquilo fez com o modelo*.
2. **Como.** Rode o script da §8 → identifique o evento no catálogo (§3 ou §4) → aplique o Δ à **base** ou abra/feche o **débito** na §5 → atualize a §2 → acrescente **uma linha** na §7 → rode o script de novo, que precisa sair limpo. Nenhuma nota muda sem linha de histórico; nenhuma linha de histórico sem evento tipado.
3. **Evento que não está no catálogo.** Adicione-o ao catálogo primeiro, com a justificativa de por que ele é bom ou ruim *para o modelo* — e só então aplique. O catálogo cresce; o placar nunca é arbitrado.
4. **Teto e piso.** Nenhuma dimensão passa de 100 nem cai abaixo de 0. Excedente é descartado, não acumulado — saúde não é banco de horas.
5. **Débito continua descontando.** Fechar um débito devolve exatamente o custo dele, e a evidência do fechamento vai na linha do histórico. "Foi resolvido" não é evidência; a checagem da §8 que passa a sair conforme é.
6. **Reaferição completa.** A cada incremento da `ODDS Language Version`, todas as seis notas são reaferidas do zero — as quatro primeiras contra a §8, as duas de julgamento contra a §9 — e o resultado substitui o acumulado. É o que impede o placar de virar folclore.
7. **Uso da rubrica (dimensões 3 e 6).** Três regras, e elas existem para conter a deriva de um julgamento que se repete a cada passe:
   - **Mexa só no critério que o passe tocou.** Um passe que adiciona uma regra mexe em R3.1 e R3.2, e em mais nada. Reavaliar a rubrica inteira a cada passe é como o modelo reescreve a nota sem perceber.
   - **Critério só se move com artefato citável.** A coluna *Evidência* não é comentário: é a condição para a nota. Se não dá para apontar o arquivo e a seção que mudaram, o critério não muda.
   - **O teto é argumento, não decoração.** Dar 20 de 20 afirma que não há o que melhorar naquele critério. Se há, a nota não é o teto.

---

## 7. Histórico

| Data | Evento | Dimensão | Δ | Total |
|---|---|---|---:|---:|
| 2026-08-16 | **Aferição inicial.** Baseline estabelecido após varredura mecânica dos 35 codes nos cinco artefatos (todos presentes), 44 golden files, paridade EN/PT em 18 seções. Débitos D-001 a D-004 abertos na mesma passada | — | — | **78** |
| 2026-08-16 | **Correção do modelo de pontuação, encontrada ao automatizar.** Duas falhas na v0.1.0: as notas de integridade não eram deriváveis dos débitos (Língua Ubíqua dizia 90 com −5 declarado), e penalização "pontual" em dimensão de integridade era irrecuperável para sempre — toda dimensão de integridade tenderia a zero. A §2 ganha colunas `Base` e `Débitos` e a nota passa a ser derivada; toda penalização de integridade passa a abrir débito. Abertos D-005 (nada verifica o fechamento do passe no `CHANGELOG.md`) e D-006 (vocabulário morto no `GRILLING.md`), que os números da v0.1.0 já embutiam sem declarar | 2, 5 | 0 | **78** |
| 2026-08-16 | **`health_check.py` + skill `health-check`.** Dez checagens determinísticas, sem dependência externa. **Fecha D-002** (+5, dim 1): a checagem placeholder ↔ chaves de `data` que o `MESSAGES.md` §1 declarava "verificável por script" agora existe (C10) e passa nos 35 codes, nos dois idiomas. **Fecha D-003** (+5, dim 2): paridade EN/PT deixa de ser disciplina humana (C5 — seções e conjunto de termos). Evidência: 10/10 conformes | 1, 2 | +10 | **80** |
| 2026-08-16 | **Rubricas para as dimensões de julgamento (§9) e script movido para dentro da skill.** As bases 3 e 6 eram números arbitrados por um modelo sem alocação nem evidência — a §4 penaliza isso quando o autor é humano, e não havia razão para o critério ser mais frouxo com o modelo. Cada uma passa a ser a soma de seis critérios com teto e artefato citado, e a checagem **C11** confere que os máximos somam 100 e que o total bate com a §2. **Reaferição sob rubrica**, não bonificação: dim 3 de 78 → **75** (o rastreio à literatura vale 4 de 15 — o `REFERENCES.md` é uma lista de URLs sem anotação) e dim 6 de 45 → **60** (a gramática está fechada e o contrato de dados é implementável; a lacuna real é stack, que vale 0 de 20) | 3, 6 | −3 / +15 | **81** |
| 2026-08-16 | **Validação pela skill, com um defeito encontrado no próprio razão.** As duas linhas anteriores estavam fora de ordem cronológica: a das rubricas foi inserida antes da do script, deixando o razão a fechar em 80 enquanto a §2 declarava 81. O evento não existia na §4 — foi acrescentado lá antes de ser aplicado, como manda a §6.3 — e virou a checagem **C12**, para que a ordem do razão deixe de depender de quem edita. Débito aberto e fechado no mesmo passe: saldo zero, cicatriz registrada. Nenhuma nota se move, porque dimensão de integridade é limitada a 100 menos débito aberto e não há o que creditar | 1 | 0 | **81** |
| 2026-08-24 | **Os dois débitos documentais fechados, com evidência.** **Fecha D-004** (+3, dim 1): nasce o `PROPAGATION-MAP.md`, o mapa D1–D25 → artefato/seção. As 25 decisões foram conferidas abrindo cada artefato nomeado na célula "Artefatos a atualizar" do `GRILLING.md` §3 — **nenhuma ausente**, e seis desvios de forma, endereço ou cronologia, em todos eles com a execução certa e a previsão envelhecida (o mais informativo é D23: os dois golden files reescritos não terminaram no resultado previsto porque D24, decidida depois na mesma rodada, revogou a versão da regra em que a previsão se apoiava). **Fecha D-006** (+5, dim 2): o `GRILLING.md` ganha glossário de vocabulário superado — os cinco termos mortos e a data errada da remoção de `[SW]`, cada um com o que vale hoje e onde. Duas checagens novas sustentam os fechamentos: **C14** (as 25 linhas existem e toda seção citada resolve para um cabeçalho real — pegou cinco referências erradas na primeira execução) e **C15** (todo termo morto que o `GRILLING.md` usa está no glossário). Nenhuma nota das dimensões de julgamento se move: o `PROPAGATION-MAP.md` melhora o *alcance* de uma decisão a partir do artefato, mas o que R3.6 desconta continua de pé — decisão nova ainda não tem onde morar, e `docs/adr/` segue vazio | 1, 2 | +8 | **83** |
| 2026-09-05 | **Nasce o razão de decisões (`docs/adr/`) e a C16.** Os dois registros de decisão do repositório estavam **fechados** — `GRILLING.md` (o porquê de D1–D25) e `PROPAGATION-MAP.md` (o onde) cobrem uma sessão que terminou em 2026-08-14 e não aceitam linha nova. Decisão tomada hoje não tinha endereço, que é literalmente o que R3.6 descontava. O mecanismo tem três partes porque cada uma resolve um problema diferente: **lugar e formato** (cinco seções, e duas delas — *Alternativas consideradas* e *Reversão* — existem para tornar a decisão reversível, não para documentá-la), **gerador e skill** (`new_adr.py` faz o mecânico, a skill `adr` faz o julgamento de o que merece ADR) e **checagem determinística** (**C16**: numeração sem buraco, pares `supersedes`/`superseded-by` recíprocos, índice batendo com os arquivos, citações resolvendo — as três formas silenciosas de um razão apodrecer). Hook foi considerado e rejeitado no `ADR-0001`: "uma decisão foi tomada" não é evento de ferramenta. A C16 já se pagou na estreia, pegando uma citação ambígua no próprio `ADR-0001`. Sob a rubrica, **R3.6 de 7 → 9** (dim 3, base 75 → 77): perde os 2 restantes porque o caminho inverso — da regra ao ADR que a decidiu — não existe. A C16 **não** confere que uma decisão tomada tenha virado ADR; isso não é mecanizável, e a lacuna está assumida no `ADR-0001` em vez de fingida | 3 | +2 | **83** || 2026-09-05 | **A primeira decisão de stack, e as três tensões do roadmap nomeadas.** `ADR-0002` escolhe **Chevrotain** como toolkit de parser; `ADR-0003` fecha a ambiguidade que decidia a arquitetura da árvore — o `.odds` é fonte única, o diagrama nunca escreve de volta, logo **não** é preciso árvore lossless. A recomendação da análise era parser à mão; a decisão foi outra, e o `ADR-0002` registra as razões das duas, porque quem reabrir precisa das que perderam. O argumento que venceu é de coerência: gramática declarativa é conferível produção a produção contra a EBNF da `GRAMMAR.md`, enquanto fluxo de controle esconde a deriva — incoerente num repo com quinze checagens mecânicas contra exatamente isso. Sob a rubrica, **R6.4 de 0 → 8** (dim 6, base 60 → 68): destrava escrever o parser, mas segue sem framework, biblioteca de render, estrutura de repositório ou test runner. **R6.6 não se move** — continua não havendo build, lint nem runner. Na mesma passada, as três famílias de construto do roadmap (linguagem ubíqua, referência de repositório, espaço do problema) viraram as issues #1, #2 e #3 em vez de gramática: duas mexem no modelo conceitual da `RULES-EN.md` §0 e uma na identidade do produto, e nenhuma delas é adição pela ordem fixa. Não é bonificação — nomear tensão não é fechá-la | 6 | +8 | **84** || 2026-09-05 | **O primeiro código, e duas descobertas conferidas em vez de assumidas.** `ADR-0004` (monorepo `packages/`, com `@odds/messages` isolado de `@odds/core`) e `ADR-0005` (npm workspaces, TypeScript, Vitest). O argumento do `ADR-0004` é que a separação transforma a proibição documental "um `Diagnostic` nunca carrega `message`" numa **fronteira de módulo**: sem dependência, não há o que importar. Nasce o lexer, com 16 testes verdes, e as duas coisas que o `ADR-0002` mandou conferir primeiro foram conferidas: (1) o `endColumn` do Chevrotain é **inclusivo**, e o `AST_SCHEMA.md` §1 exige `end` exclusivo — a conversão vive num único ponto, `spanOf()`; (2) o Chevrotain 11.2.0 **não casa escapes de propriedade Unicode**, e falha em silêncio com zero tokens, o que quebraria `identifier` como a `GRAMMAR.md` §1 o define — resolvido com matcher customizado, e não estreitando a gramática para Latin-1. Sob a rubrica, **R6.4 de 8 → 14** (restam framework de UI, biblioteca de layout e bundler) e **R6.6 de 2 → 8** (setup, build e runner existem; sem linter, por decisão registrada) — base da dim 6 de 68 → 80. **R6.3 não se move**: o harness dos golden files ainda não existe, e é ele que o critério cobra. **D-001 segue aberto** pelo mesmo motivo | 6 | +12 | **85** || 2026-09-05 | **A suíte encosta num parser real pela primeira vez, e 7 dos 44 casos passam.** Nascem o parser (`GRAMMAR.md` §2–§3) e o executor do `TEST_SUITE.md` §3. O risco principal que o `ADR-0002` nomeou — a recuperação genérica do Chevrotain disputar com os três casos da `GRAMMAR.md` §5.1 — foi **evitado em vez de arbitrado**: as três situações viraram produções explícitas da gramática de implementação, com o diagnóstico emitido por nós e `recoveryEnabled: false`. Registrado no `ADR-0006`, que também retira um custo que o `ADR-0002` havia previsto: sem depender do CST para recuperar, o parser usa `EmbeddedActionsParser` e a camada CST → AST deixa de existir. **Primeira reconciliação de D-001** (§3, "golden file executado com sucesso contra parser real, span conferido", +5 na dim 4): `golden-files/syntax-error` afirmava `expected: "-->, <--, <->, -x-"` e estava **incompleto** — um `tag_group` é sintaticamente válido naquela posição, e o valor passou a ser derivado da gramática por `computeContentAssist` em vez de escrito à mão. Também corrigida uma afirmação minha anterior: eu havia registrado o span de `removed-construct-sw` como divergente, e o parser mostrou que o golden file estava certo e a minha leitura, errada. Sob a rubrica, **R6.3 de 12 → 20** (o pseudocódigo virou executor, com a lista `PENDING` asserida nos dois sentidos para não apodrecer) — base da dim 6 de 80 → 88. **D-001 segue aberto**: 37 dos 44 casos ainda não foram exercidos contra o parser, e é isso que o débito cobra | 4, 6 | +5 / +8 | **87** || 2026-09-05 | **D-001 fechado: os 44 golden files passam contra um parser real.** Nasce o validador semântico — as fases 2 a 6 da `RULES-EN.md` §3.2, 28 codes, com o princípio do erro-raiz aplicado na leitura **larga** que a §3.1 manda (elemento com `error` sai do pipeline inteiro, e leva os filhos junto). A suíte saiu de 7/44 para **44/44**, e a lista `PENDING` do harness — que assere nos dois sentidos — está vazia. Cinco divergências apareceram na primeira execução e **todas eram do meu código, nenhuma da suíte**: as âncoras de `ROLE_CONFLICT` e `PROTECTION_CONFLICT` são o grupo de tags (o conflito é sobre a combinação, não sobre uma tag), a de `PL_WITHOUT_OHS` é a própria tag, `MUTUAL_TAG_WITH_EXTERNAL` é um diagnóstico por relação e não por tag, e `INVALID_DOMAIN_CARDINALITY` com zero domains ancora no arquivo inteiro. Isso é o resultado mais informativo do passe: a especificação-alvo dos spans, escrita sem parser algum, estava certa em 43 dos 44 casos e **a implementação é que precisou ceder**. Fecha **D-001** (+20, dim 4), cuja condição era exatamente "a suíte rodar ponta a ponta contra uma implementação e as divergências forem reconciliadas". Nenhuma nota de rubrica se move: o passe não tocou critério de 3 nem de 6 — a `R6.3` já havia subido quando o harness nasceu, e cobrá-la de novo pela suíte agora passar seria cobrar a mesma conquista duas vezes | 4 | +20 | **91** || 2026-09-05 | **Uma revisão da PR encontrou três divergências reais que a suíte verde não via — e o placar cai por isso.** Os 44 golden files passavam, os 75 testes passavam, e ainda assim: (1) o parser aceitava `mapping` antes dos subdomains e **dois blocos `external`**, com o segundo sobrescrevendo o primeiro em silêncio, contra a ordem fixa e a cardinalidade da `GRAMMAR.md` §2; (2) tag desconhecida gerava AST em vez de parar o pipeline na fase 0, e emitia `SYNTAX_ERROR` sem a chave `expected`, deixando `{expected}` cru na frase renderizada; (3) `npm test` não resolvia `@odds/core` num checkout limpo, porque os pacotes exportam `./dist`. A causa da cegueira é nomeável: **os 44 inputs da suíte são todos arquivos bem formados na ordem canônica** — ela cobre os 35 codes, não a forma da gramática. O evento não existia na §4 e foi acrescentado lá antes de ser aplicado, como manda a §6.3. Aplicado −5 na base da dim 4 (85 → 80). **A correção não devolve o ponto**: consertar o que se quebrou não é conquista, é o mesmo princípio que rege as dimensões de integridade. Os três casos ganharam regressão (`packages/core/test/parser.test.ts`), e a lacuna de método que deixou o bug 2 passar foi fechada — o teste de renderização passou a exercitar o que o validador **de fato emite**, incluindo entradas malformadas sem golden file, em vez de sintetizar dados a partir do próprio template | 4 | −5 | **90** || 2026-09-05 | **Segunda rodada de revisão, mais duas divergências, e o mesmo evento aplicado de novo.** (1) O **Passo 0 do `RULES-EN.md`** — *"report `INVALID_DOMAIN_CARDINALITY` and **stop**: there is no single valid domain to traverse"* — não era terminal: com dois `domain` e problemas no primeiro, saíam `INVALID_SUBDOMAIN_TYPE`, `DUPLICATE_CONTEXT` e `SELF_RELATIONSHIP` junto, todos derivados de um erro, o que a §3.1 proíbe. O caso mais revelador é o arquivo **sem** `domain` com uma diretiva de supressão: saía `UNUSED_SUPPRESSION`, afirmando que a supressão estava obsoleta quando a regra nunca chegou a ser avaliada — foi ele que decidiu a leitura, porque mostra que a fase 6 também precisa parar. (2) A checagem de "módulo principal" do extrator comparava `import.meta.url` com uma URL montada à mão, que quebra em Windows e em caminho que precise de escape. **−5 na base da dim 4 pela segunda vez** (80 → 75), pelo mesmo evento da §4. Não é dupla cobrança do mesmo achado: é a segunda ocorrência de um evento que o catálogo define por ocorrência, e o que ela mede é que a base ainda superestimava a cobertura. A causa é mais precisa agora do que na primeira vez: **cada golden file isola um problema num arquivo no mais bem formado possível**, então controle de fluxo entre fases — o que para, o que sobrevive, o que é derivado — só aparece quando dois problemas coexistem, e a suíte nunca os combina. `packages/core/test/validator.test.ts` começa a cobrir isso | 4 | −5 | **89** || 2026-09-07 | **Terceira rodada de revisão da PR #4: a asserção de pendência do harness era textual, não estrutural.** O `TEST_SUITE.md` §3 é explícito — o golden file existe para ser *"comparado por igualdade estrutural direta contra a saída do validador"* —, e o caminho não pendente do harness usa `toEqual`. O caminho **pendente** comparava `JSON.stringify(actual)` com `JSON.stringify(expected.diagnostics)`, o que chama de divergente uma saída idêntica em conteúdo cujas chaves saíram em outra ordem. Reproduzido: sobre `conformist-core`, com as mesmas chaves reordenadas, `toEqual` conforma e o texto JSON não. A consequência é a que o harness existe para impedir — um caso em `PENDING` que já passa continuaria "pendente" em silêncio, e a lista apodreceria sem ninguém ser avisado. **Mesmo evento da §4 pela terceira vez** (−5 na base da dim 4, 75 → 70). Duas ressalvas ditas por inteiro: o caminho está **morto hoje**, porque `PENDING` está vazio desde o fechamento de D-001 — o defeito é latente, e o catálogo define o evento por ocorrência, sem variante atenuada; e a divergência é com o `TEST_SUITE.md`, não com a `GRAMMAR.md` ou a `RULES-EN.md` das rodadas anteriores, o que desloca a causa: não é mais só o *conteúdo* dos 44 casos que a suíte não cobre, é o **próprio executor**, que nenhuma checagem confere contra a spec que ele executa. Regressão em `packages/core/test/conformance.test.ts`, validada reintroduzindo a comparação textual. **94 testes**, 16/16 checagens de spec | 4 | −5 | **88** |

| 2026-10-06 | **A decisão de render, aceita depois de protótipo e teste humano.** O `ADR-0009` (layout próprio em `@odds/layout`, SVG, bibliotecas só nas bordas) passa de `proposed` a `accepted`. Ele tinha nascido com duas condições de aceite, e as duas foram cumpridas. A primeira é a **localidade**: uma edição só move as peças a que diz respeito. A colmeia v4 a obtém pelos mecanismos do `ADR-0010`, e o `colmeia-v4.check.mjs` a confere edição por edição sobre 71 edições de contexto, 70 renomes e 35 relações, com 0 violações. A segunda é o **teste de digitação humana** no `colmeia-ao-vivo`, feito pelo autor, que relatou que *funcionou bem*. Sob a rubrica, **R6.4 de 14 → 17** (dim 6, base 88 → 91). Restavam 6 pontos para três decisões abertas, e a de layout/render, que a própria evidência do critério marcava como a mais pesada do produto, leva metade. Framework de UI e bundler seguem abertos. O total sobe de 87,80 para 88,10 e o placar arredondado não se move. O `ADR-0010` não pontua à parte: é o *como* da mesma decisão, e cobrá-lo de novo seria contar a conquista duas vezes | 6 | +3 | **88** |
| 2026-10-06 | **Reaferição completa (§6.6), pela primeira mudança de `ODDS Language Version`: 0.1.0 → 1.0.0.** A passada normativa do `ADR-0008` dá ao `subdomain` as propriedades `description` e `owner`, nas versões `GRAMMAR.md` v0.3.0, `AST_SCHEMA.md` v0.3.0, `RULES` v0.3.0 e `TEST_SUITE.md` v0.2.2. Ela também torna `owner` palavra reservada, o que pela tabela do `CHANGELOG.md` é MAJOR. Estava parada desde 2026-09-12, quando o ADR registrou a decisão sem executá-la. As seis notas foram reaferidas do zero, e nenhuma muda. **Dimensões 1, 2 e 5** conferem contra a §8: C1, C2 e C10 sem code novo, C5 com paridade EN/PT mantida (18 seções, 46 termos), e D-005 segue aberto. **Dimensão 4:** C3 e C4 conferem 44 casos, e o único golden file tocado (`valid-baseline`) segue com `diagnostics` vazio contra o parser. A base 70 se mantém porque os três descontos dela são eventos de registro, não de estado. **Dimensões 3 e 6** foram repontuadas critério a critério contra a §9, e só a evidência do R6.1 é reescrita: o 20 dele deixava passar uma decisão aceita e não executada, e agora a afirma propagada. Nenhum evento do catálogo foi realizado. A tradução EN/PT no mesmo passe só bonifica dimensão de integridade com débito aberto, e a 2 não tem. Também ficou registrado por escrito que esta MAJOR não tem diagnóstico de migração, e por quê. A implementação acompanhou no mesmo passe: 104 testes, dez novos para a forma das duas chaves | 1–6 | 0 | **88** |
| 2026-10-10 | **Reaferição completa (§6.6) pela `ODDS Language Version` 1.0.1, um PATCH de mensagem.** O template em português de `INCOMPLETE_MUTUAL_TAG` dizia *"aparece só no lado right"*, porque interpolava o valor fechado `declaredSide` como palavra; passou a ter uma variante por lado (`MESSAGES.md` v0.1.2), pelo mesmo mecanismo do `trigger` de `CONFORMIST_CORE`. **Dimensões 1, 2, 4 e 5** conferem pelo script, 16 de 16: a C10 aceita a chave seletora nova, nenhum code, golden file ou `data` mudou, e D-005 segue aberto. **Dimensões 3 e 6**, critério a critério contra a §9: nenhum dos doze critérios tem evidência em texto de mensagem, e nenhum artefato citado nas evidências mudou, então nenhum se move. Nenhum evento do catálogo foi realizado: consertar uma tradução é o comportamento esperado de um PATCH, não conquista. A implementação acompanhou: 106 testes, dois novos, que falham com o template antigo | 1–6 | 0 | **88** |
---

## 8. Aferição

```bash
python3 .claude/skills/health-check/scripts/health_check.py          # relatório compacto
python3 .claude/skills/health-check/scripts/health_check.py -v       # detalha também o que passou
python3 .claude/skills/health-check/scripts/health_check.py --json   # saída estruturada
```

O script mora dentro da skill `health-check`, que é quem o usa — a skill carrega a própria ferramenta em vez de depender de um diretório `scripts/` na raiz.

Stdlib pura, sem dependência. Saída **0** = tudo conforme, **1** = ao menos uma falha. É esta saída, e não a afirmação de quem editou, que a §6.5 aceita como evidência.

| Check | Dim | O que prova |
|---|---:|---|
| **C1** | 1 | Todo code de `AST_SCHEMA.md` §1.3 tem fase e severidade — sem fase, o code não tem posição no array emitido e não é testável |
| **C2** | 1 | Todo code do catálogo é citado em `MESSAGES.md`, `RULES-EN.md` e `RULES-PT.md` |
| **C3** | 4 | Todo code tem golden file correspondente |
| **C4** | 4 | Todo caso tem `input.odds` + `expected.json`, e o JSON parseia |
| **C5** | 2 | `RULES-EN` e `RULES-PT` têm as mesmas seções e o mesmo conjunto de termos |
| **C6** | 2 | `[SW]` não voltou como tag viva, `_WARNING` não voltou a nome de code, `message` não voltou ao contrato do `Diagnostic` |
| **C7** | 2 | Vocabulário morto não vazou do `GRILLING.md` para documento normativo |
| **C8** | 1 | A aritmética da §2: pesos somam 100, integridade tem base 100, nota = base + débitos, contribuição = peso × nota / 100, título = total arredondado |
| **C9** | 1 | A coluna de débitos da §2 bate com o somatório da §5 por dimensão |
| **C10** | 1 | A regra de integridade do `MESSAGES.md` §1: placeholder ↔ chaves de `data`, nos dois idiomas, contando a chave seletora de variante |

| **C11** | 1 | As rubricas da §9 fecham: máximos somam 100 por dimensão, nota de cada critério dentro do seu teto, e o somatório bate com a base declarada na §2 |
| **C12** | 1 | O razão da §7 está em ordem cronológica e seu último total é o placar da §2 — o histórico é a origem do número, não um anexo dele |
| **C13** | 1 | Esta tabela descreve exatamente as checagens que o script executa, com a mesma dimensão. Inclui a si mesma: é o ponto fixo que impede a §8 de mentir sobre a própria aferição |
| **C14** | 1 | O `PROPAGATION-MAP.md` cobre D1–D25 sem lacuna, e toda seção que ele cita (`ARQUIVO.md §N`) resolve para um cabeçalho que existe naquele arquivo — uma seção renumerada derruba a aferição em vez de apodrecer o mapa em silêncio |
| **C15** | 2 | Todo termo morto que o `GRILLING.md` usa está no glossário de vocabulário superado daquele arquivo, com o que vale hoje. É o preço da isenção que a C7 concede a ele |
| **C16** | 1 | O razão de decisões (`docs/adr/`) está íntegro: frontmatter tipado, número batendo com o arquivo, numeração sem buraco, `status` do conjunto fechado, as cinco seções presentes, pares `supersedes`/`superseded-by` recíprocos, índice do `README.md` batendo com os arquivos, e toda citação `ARQUIVO.md §N` resolvendo. Não confere que uma decisão tomada tenha virado ADR — isso não é mecanizável, e o ADR-0001 assume a lacuna |

**C8, C9, C11, C12 e C13 são o que impede este arquivo de mentir.** As outras onze medem o repositório; estas cinco medem o próprio placar e a própria descrição dele, e falham se alguém ajustar uma nota sem mexer no que a sustenta. Todas as cinco são da **dimensão 1** — inclusive a C11, que confere as rubricas das dimensões 3 e 6 mas é checagem de coerência do placar, não de fidelidade ao DDD. O que ela verifica é a aritmética do julgamento, nunca o julgamento.

Com `-v`, cada checagem imprime a evidência que a sustenta — a distribuição de codes por fase, a conta de cada dimensão, cada débito do razão, cada linha do histórico. É o modo de auditar o placar sem abrir este arquivo.

O que o script **não** faz: dar as notas das dimensões 3 e 6, e escolher qual evento do catálogo se aplica a um passe. Isso é julgamento de um modelo, sob a rubrica da §9 — o script não julga, mas confere a aritmética do julgamento.

---

## 9. Rubricas das dimensões de julgamento

As dimensões **3 (Fidelidade Estratégica ao DDD)** e **6 (Prontidão de Implementação)** não são mecanizáveis: nenhum `grep` decide se uma regra está ancorada num conceito de DDD estratégico ou se falta decisão para escrever o parser. Quem dá essas notas é um **modelo lendo os artefatos** — e é justamente por isso que elas precisam de rubrica.

**A rubrica é o que separa julgamento de arbítrio.** Sem ela, o modelo escolhe um número e o número não é auditável — que é exatamente a penalização de −5 da §4, cometida com boa intenção. Com ela, o modelo não escolhe a nota: ele aloca pontos em critérios nomeados, cada um com teto e com evidência citada, e a **soma** é a base. O `health_check.py` (C11) confere que os máximos somam 100, que nenhum critério estourou o teto e que o total bate com a §2. O julgamento continua sendo do modelo; a aritmética dele deixa de ser.

Três regras de uso, na §6.7.

### 9.1 Dimensão 3 — Fidelidade Estratégica ao DDD · base **77**

| Critério | Máx | Nota | Evidência |
|---|---:|---:|---|
| **R3.1** Toda regra ancorada num conceito de DDD estratégico nomeado | 25 | 20 | `RULES.md` §0 é o modelo conceitual do qual as regras são aplicação, e os padrões de Context Map estão mapeados tag a tag. Perde ponto porque parte da §1.A é higiene estrutural (`DUPLICATE_CONTEXT`, `SELF_RELATIONSHIP`) sem ancoragem estratégica declarada |
| **R3.2** Os dois critérios de admissão (§0.4) respondidos por escrito, regra a regra | 20 | 16 | As 17 regras da passada de propagação trazem resposta ao princípio da autoria. As anteriores a §0.4 nunca foram reauditadas contra o critério que passou a existir depois delas |
| **R3.3** Extensões conscientes declaradas **como** extensões, não como DDD canônico | 15 | 15 | O split `C`/`S` do Customer/Supplier clássico é afirmado como extensão intencional, com a consequência de severidade explicada (`RULES.md` §0.2, `CLAUDE.md`) |
| **R3.4** Limitações conhecidas nomeadas e assumidas | 15 | 13 | `RULES-EN.md` §0.5 existe e é específica (repetição de `[BBM]` linha a linha, 1:1 de relacionamento). Perde ponto por não ter contraparte no `PRD.md`, onde o usuário do produto olharia |
| **R3.5** Rastreio à literatura: cada conceito com fonte | 15 | 4 | `REFERENCES.md` é uma lista de dez URLs sem anotação, e o corpo normativo cita a literatura três vezes no total. O modelo é defensável, mas a ancoragem é implícita — quem discordar de uma regra não tem a que recorrer |
| **R3.6** Decisão registrada com o *porquê*, alcançável a partir do artefato | 10 | 9 | Decisão nova passa a ter endereço: `docs/adr/` com formato de cinco seções, gerador (`new_adr.py`), skill `adr`, cláusula de escrita autônoma no `CLAUDE.md` e a checagem **C16**. O `ADR-0001` é o mecanismo decidindo a si mesmo, e traz *Alternativas consideradas* e *Reversão* — a rota de volta, que o formato ADR convencional não guarda. Perde ponto porque o caminho inverso não existe: de uma regra do `RULES-EN.md` ainda não se chega ao ADR que a decidiu, e D1–D25 seguem alcançáveis só pelo `PROPAGATION-MAP.md` |

### 9.2 Dimensão 6 — Prontidão de Implementação · base **91**

| Critério | Máx | Nota | Evidência |
|---|---:|---:|---|
| **R6.1** Gramática completa, sem pendência aberta | 20 | 20 | `GRAMMAR.md` §7 foi encerrada na v0.2.0 — todas as pendências originais resolvidas. A única decisão de forma aceita sem execução, a do `ADR-0008` (propriedades de `subdomain`), foi propagada na v0.3.0 |
| **R6.2** Contrato de dados sem ambiguidade para quem for implementar | 20 | 18 | `AST_SCHEMA.md` §1.3 fixa code, fase, severidade e chaves de `data`; a unidade de `column` virou normativa (UTF-16). Perde ponto porque a recuperação de erro da `GRAMMAR.md` §5.1 é descrita em prosa, não em regra verificável |
| **R6.3** Contrato de execução da suíte definido | 20 | 20 | O pseudocódigo do `TEST_SUITE.md` §3 virou executor real (`packages/core/test/conformance.test.ts`): invocação é `npm test`, falha é divergência estrutural do array inteiro mais `astGenerated`, e a ordem de emissão normativa é aplicada por `compareDiagnostics`. Os 37 casos que ainda dependem do validador estão em `PENDING` com o motivo, e a lista é asserida **nos dois sentidos** — caso fora dela precisa passar, caso dentro dela precisa continuar falhando —, então ela não apodrece em silêncio |
| **R6.4** Stack e toolchain decididos | 20 | 17 | O `ADR-0002` decide o toolkit de parser (Chevrotain, TypeScript) e o `ADR-0003` fecha a ambiguidade de round-trip que decidia a arquitetura da árvore. O `ADR-0004` decide a estrutura (monorepo `packages/`, com o catálogo de mensagens isolado) e o `ADR-0005` o ambiente (npm workspaces, TypeScript, Vitest, `tsc` sem bundler). O `ADR-0009`, aceito depois de protótipo e teste de digitação humana, decide a mais pesada das três que faltavam: o layout do diagrama é código próprio (`@odds/layout`), com saída SVG e bibliotecas só nas bordas. Ficam duas decisões em aberto, framework de UI e bundler |
| **R6.5** Requisitos de produto traduzíveis em componentes | 10 | 8 | `PRD.md` §4–§5 descreve as duas vistas, a renderização degradada, o payload da URL e o auto-save com detalhe suficiente para virar componente |
| **R6.6** Ambiente de desenvolvimento definido | 10 | 8 | `npm install && npm test` é a instrução de setup completa, sem pré-requisito além do Node. Build por `tsc --build` sobre project references, runner Vitest, e o `CLAUDE.md` traz os comandos reais. Perde 2 por não haver linter — ausência deliberada e registrada no `ADR-0005`, não esquecimento |

**Por que a dimensão 4 não tem rubrica.** A base dela já é sustentada por evidência de script (C3 cobre code a code, C4 cobre a integridade dos 44 casos) e a lacuna de execução está inteira no débito D-001. Dar-lhe rubrica cobraria a mesma ausência duas vezes — uma no critério, outra no débito.
