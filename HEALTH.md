# HEALTH

Estado de saúde do modelo ODDS. Versão deste arquivo: **v0.3.3** · Última aferição: **2026-08-16** (`python3 .claude/skills/health-check/scripts/health_check.py`, 13/13 conformes).

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

## 2. Placar atual — **81 / 100** · *Sólido, com débito localizado*

O placar é **derivado, não arbitrado**. Vale, em toda dimensão:

> **nota = base − Σ(débitos abertos da §5)** · **contribuição = peso × nota / 100** · **total = Σ contribuições**

Numa dimensão de **integridade** a base é 100 por definição — ela não tem o que ganhar, só o que perder. Numa dimensão de **construção** a base é o que foi efetivamente conquistado. O script da §8 confere cada célula desta tabela contra a §5 e contra a §9; nenhum número aqui é afirmação.

| # | Dimensão | Natureza | Peso | Base | Débitos | Nota | Contribuição |
|---|---|---|---:|---:|---:|---:|---:|
| 1 | Coerência Normativa | Integridade | 25 | 100 | −3 | 97 | 24,25 |
| 2 | Língua Ubíqua | Integridade | 15 | 100 | −5 | 95 | 14,25 |
| 3 | Fidelidade Estratégica ao DDD | Construção | 20 | 75 | 0 | 75 | 15,00 |
| 4 | Cobertura Executável | Construção | 20 | 80 | −20 | 60 | 12,00 |
| 5 | Disciplina de Versionamento | Integridade | 10 | 100 | −4 | 96 | 9,60 |
| 6 | Prontidão de Implementação | Construção | 10 | 60 | 0 | 60 | 6,00 |
| | **Total** | | **100** | | **−32** | | **81,10** |

As bases das dimensões 3 e 6 são **alocadas por rubrica** (§9), não escolhidas: cada uma é a soma de critérios nomeados com teto e evidência.

**Leitura em uma frase:** o modelo é coerente consigo mesmo e disciplinado no registro; o que falta é prova de que ele sobrevive ao contato com uma implementação. Toda a dívida está concentrada nas duas dimensões de construção que dependem de código existir — e nenhuma delas se resolve escrevendo mais spec.

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
| Passe normativo fechado sem entrada no `CHANGELOG.md` | 5 | −4 | sim |
| Os dois eixos de versionamento misturados numa afirmação | 5 | −6 | sim |
| Incremento de versão fora da tabela do `CHANGELOG.md` | 5 | −3 | sim |

A linha "nota ajustada sem evento tipado" é o que mantém este arquivo honesto: se o placar puder ser ajustado no olho, ele deixa de medir o projeto e passa a medir o humor de quem editou. É também a única penalização que o `health_check.py` cobra sozinho — as checagens C8 e C9 falham quando a §2 e a §5 divergem.

---

## 5. Débitos abertos

| ID | Dimensão | Débito | Custo | Fecha quando |
|---|---|---|---:|---|
| **D-001** | 4 · Cobertura Executável | Os spans dos 44 golden files são um *alvo* de especificação: nunca foram conferidos contra um parser real. Detalhes de tokenização devem divergir | −20 | A suíte rodar ponta a ponta contra uma implementação e as divergências forem reconciliadas (corrigindo a suíte quando o parser estiver certo) |
| **D-004** | 1 · Coerência Normativa | A propagação do `GRILLING.md` foi declarada completa em 2026-08-14, e **duas auditorias posteriores acharam lacunas** (unidade de `column`, prosa em `data`). Não existe evidência por decisão D1–D25 de que a propagação fechou | −3 | Existir um mapa D1–D25 → artefato/seção, conferido |
| **D-005** | 5 · Disciplina de Versionamento | Nada verifica que um passe normativo fechou com entrada no `CHANGELOG.md` e incremento pela tabela. A disciplina é inteiramente humana, e o histórico mostra que ela já falhou uma vez em outro eixo (os números não reconferidos) | −4 | O `health_check.py` passar a cruzar o diff do passe com o `CHANGELOG.md` |
| **D-006** | 2 · Língua Ubíqua | O `GRILLING.md` usa vocabulário pré-propagação — `ExternalContextNode` (o nome real é `ExternalBlockNode`), os quatro codes com sufixo `_WARNING`, "`[SW]` removida na v0.2" (foi na v0.1.0). É registro histórico e o `CLAUDE.md` já manda o artefato vencer na divergência, mas um agente que leia o arquivo colhe termo morto | −5 | Os termos mortos receberem marca de obsolescência no ponto de uso, ou o arquivo ganhar um cabeçalho de vocabulário superado |

Ausência de código, de stack e de ferramenta **não** é débito — é nota baixa nas dimensões 4 e 6, que é o que elas existem para dizer. `health_check.py` verifica (C7) que esses termos mortos não vazaram do `GRILLING.md` para nenhum documento normativo.

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

**C8, C9, C11, C12 e C13 são o que impede este arquivo de mentir.** As outras oito medem o repositório; estas cinco medem o próprio placar e a própria descrição dele, e falham se alguém ajustar uma nota sem mexer no que a sustenta. Todas as quatro são da **dimensão 1** — inclusive a C11, que confere as rubricas das dimensões 3 e 6 mas é checagem de coerência do placar, não de fidelidade ao DDD. O que ela verifica é a aritmética do julgamento, nunca o julgamento.

Com `-v`, cada checagem imprime a evidência que a sustenta — a distribuição de codes por fase, a conta de cada dimensão, cada débito do razão, cada linha do histórico. É o modo de auditar o placar sem abrir este arquivo.

O que o script **não** faz: dar as notas das dimensões 3 e 6, e escolher qual evento do catálogo se aplica a um passe. Isso é julgamento de um modelo, sob a rubrica da §9 — o script não julga, mas confere a aritmética do julgamento.

---

## 9. Rubricas das dimensões de julgamento

As dimensões **3 (Fidelidade Estratégica ao DDD)** e **6 (Prontidão de Implementação)** não são mecanizáveis: nenhum `grep` decide se uma regra está ancorada num conceito de DDD estratégico ou se falta decisão para escrever o parser. Quem dá essas notas é um **modelo lendo os artefatos** — e é justamente por isso que elas precisam de rubrica.

**A rubrica é o que separa julgamento de arbítrio.** Sem ela, o modelo escolhe um número e o número não é auditável — que é exatamente a penalização de −5 da §4, cometida com boa intenção. Com ela, o modelo não escolhe a nota: ele aloca pontos em critérios nomeados, cada um com teto e com evidência citada, e a **soma** é a base. O `health_check.py` (C11) confere que os máximos somam 100, que nenhum critério estourou o teto e que o total bate com a §2. O julgamento continua sendo do modelo; a aritmética dele deixa de ser.

Três regras de uso, na §6.7.

### 9.1 Dimensão 3 — Fidelidade Estratégica ao DDD · base **75**

| Critério | Máx | Nota | Evidência |
|---|---:|---:|---|
| **R3.1** Toda regra ancorada num conceito de DDD estratégico nomeado | 25 | 20 | `RULES.md` §0 é o modelo conceitual do qual as regras são aplicação, e os padrões de Context Map estão mapeados tag a tag. Perde ponto porque parte da §1.A é higiene estrutural (`DUPLICATE_CONTEXT`, `SELF_RELATIONSHIP`) sem ancoragem estratégica declarada |
| **R3.2** Os dois critérios de admissão (§0.4) respondidos por escrito, regra a regra | 20 | 16 | As 17 regras da passada de propagação trazem resposta ao princípio da autoria. As anteriores a §0.4 nunca foram reauditadas contra o critério que passou a existir depois delas |
| **R3.3** Extensões conscientes declaradas **como** extensões, não como DDD canônico | 15 | 15 | O split `C`/`S` do Customer/Supplier clássico é afirmado como extensão intencional, com a consequência de severidade explicada (`RULES.md` §0.2, `CLAUDE.md`) |
| **R3.4** Limitações conhecidas nomeadas e assumidas | 15 | 13 | `RULES-EN.md` §0.5 existe e é específica (repetição de `[BBM]` linha a linha, 1:1 de relacionamento). Perde ponto por não ter contraparte no `PRD.md`, onde o usuário do produto olharia |
| **R3.5** Rastreio à literatura: cada conceito com fonte | 15 | 4 | `REFERENCES.md` é uma lista de dez URLs sem anotação, e o corpo normativo cita a literatura três vezes no total. O modelo é defensável, mas a ancoragem é implícita — quem discordar de uma regra não tem a que recorrer |
| **R3.6** Decisão registrada com o *porquê*, alcançável a partir do artefato | 10 | 7 | `GRILLING.md` cobre D1–D25 com alternativas rejeitadas. Perde ponto porque é um documento histórico único de 138 KB: uma decisão tomada hoje não tem onde morar, e `docs/adr/` está vazio |

### 9.2 Dimensão 6 — Prontidão de Implementação · base **60**

| Critério | Máx | Nota | Evidência |
|---|---:|---:|---|
| **R6.1** Gramática completa, sem pendência aberta | 20 | 20 | `GRAMMAR.md` §7 foi encerrada na v0.2.0 — todas as pendências originais resolvidas |
| **R6.2** Contrato de dados sem ambiguidade para quem for implementar | 20 | 18 | `AST_SCHEMA.md` §1.3 fixa code, fase, severidade e chaves de `data`; a unidade de `column` virou normativa (UTF-16). Perde ponto porque a recuperação de erro da `GRAMMAR.md` §5.1 é descrita em prosa, não em regra verificável |
| **R6.3** Contrato de execução da suíte definido | 20 | 12 | `TEST_SUITE.md` §3 traz o pseudocódigo do executor esperado e a ordem de emissão é normativa. Perde ponto porque continua pseudocódigo: não há harness, nem formato de invocação, nem definição de o que é uma falha |
| **R6.4** Stack e toolchain decididos | 20 | 0 | Nada. Sem framework, sem parser toolchain, sem biblioteca de render, sem ADR. É a maior lacuna isolada do projeto inteiro |
| **R6.5** Requisitos de produto traduzíveis em componentes | 10 | 8 | `PRD.md` §4–§5 descreve as duas vistas, a renderização degradada, o payload da URL e o auto-save com detalhe suficiente para virar componente |
| **R6.6** Ambiente de desenvolvimento definido | 10 | 2 | Só existe o `health_check.py`, que afere spec e não constrói nada. Sem build, sem lint, sem test runner, sem instrução de setup |

**Por que a dimensão 4 não tem rubrica.** A base dela já é sustentada por evidência de script (C3 cobre code a code, C4 cobre a integridade dos 44 casos) e a lacuna de execução está inteira no débito D-001. Dar-lhe rubrica cobraria a mesma ausência duas vezes — uma no critério, outra no débito.
