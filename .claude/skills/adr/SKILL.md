---
name: adr
description: Registra uma decisão de arquitetura ou de projeto num ADR numerado em docs/adr/. Use ao escolher stack, biblioteca, formato de dado, estrutura de repositório ou protocolo de trabalho; ao rejeitar uma alternativa que alguém vai propor de novo; ao reverter ou substituir uma decisão anterior; e quando pedirem "por que fizemos assim", um ADR, ou o histórico de decisões.
---

# Registrar uma decisão em ADR

`docs/adr/` é onde toda decisão tomada a partir de 2026-09-05 mora. O `GRILLING.md` (D1–D25) é registro **fechado** de uma sessão que terminou; decisão nova nunca vai para lá.

**Escreva o ADR sem perguntar.** A permissão é explícita e permanente (`CLAUDE.md`, seção *Registro de decisões*). Perguntar "quer que eu registre isso?" a cada decisão transforma o mecanismo em atrito, e um mecanismo com atrito não é usado — que é exatamente como o registro de decisões morre. Anuncie em uma linha o que registrou, não peça licença.

## 1. Isto merece um ADR?

Três perguntas. **As três** precisam ser sim:

1. **Havia mais de uma saída plausível?** Se a alternativa é obviamente pior, não houve decisão — houve leitura de requisito. Aplicar o que a `GRAMMAR.md` já manda não é decisão.
2. **Alguém vai reabrir isso?** Ou vai olhar o resultado daqui a seis meses e perguntar "por que assim?". Se ninguém pergunta, não há o que responder.
3. **Desfazer custa mais do que refazer?** Escolha de nome de variável se desfaz com um `sed`. Escolha de toolchain, não.

Exemplos do que **é** ADR neste repo: stack e toolchain; abordagem de parser; estrutura do repositório; biblioteca de layout de diagrama; formato do payload da URL; adotar ou recusar uma dependência; mudar um protocolo de trabalho (este mecanismo é o ADR-0001).

Exemplos do que **não é**: corrigir um bug; renomear um símbolo; adicionar uma regra pelo ciclo fixo do `CLAUDE.md` (isso é `CHANGELOG` + `HEALTH`, não ADR — a menos que a regra tenha exigido uma escolha conceitual que os dois critérios de admissão do `RULES.md` §0.4 não resolvem sozinhos).

**Na dúvida, escreva.** Um ADR a mais custa dez minutos; uma decisão perdida custa a próxima pessoa redescobrindo por que a alternativa óbvia não funciona.

## 2. Crie o esqueleto

```bash
python3 .claude/skills/adr/scripts/new_adr.py "Título afirmativo da decisão"
python3 .claude/skills/adr/scripts/new_adr.py "Título" --supersedes 0003   # substituindo outro
```

O script aloca o número, escreve o frontmatter e atualiza o índice. Com `--supersedes`, ele também marca o ADR antigo como `superseded` e liga o par nos dois sentidos.

Título é **afirmativo e específico**: "Parser recursivo escrito à mão, sem gerador" — não "Decisão sobre parser".

## 3. Preencha, e cuide da seção que as pessoas pulam

As cinco seções, e o que dá errado em cada uma:

- **Contexto** — escreva no passado, sem antecipar a escolha. Teste: quem lê só esta seção deve conseguir chegar a mais de uma saída. Se não consegue, você escreveu justificativa disfarçada de contexto.
- **Decisão** — uma frase afirmativa no presente, depois o argumento que **venceu**. Não é a lista de virtudes da opção escolhida; é a razão pela qual ela ganhou *das outras*.
- **Alternativas consideradas** — uma por subseção, cada uma com o motivo da rejeição. **É a seção que torna a decisão reversível**, porque quem reabrir vai começar por ela. Deixá-la vazia afirma que não havia escolha, e aí o ADR não deveria existir (volte ao passo 1). Alternativa que ninguém considerou de verdade não entra.
- **Consequências** — inclua o que **piora**. Um ADR que só lista benefícios está escondendo o preço, e o preço é o que o leitor futuro precisa saber.
- **Reversão** — o sinal que indicaria erro, o custo da volta, e o que já foi construído em cima. Quanto mais cara a reversão, mais essa seção importa.

Cite artefato e seção (`` `RULES-EN.md` §0.4 ``) quando a decisão se apoiar num. A C16 confere que o arquivo existe e que a seção resolve para um cabeçalho real — uma seção renumerada derruba a aferição em vez de apodrecer o ADR em silêncio.

Idioma: **português**, como o `HEALTH.md` e as skills. Os artefatos normativos da linguagem (`RULES`, `GRAMMAR`, `AST_SCHEMA`, `PRD`) seguem a própria política deles.

## 4. Mudou de ideia? ADR novo.

Um ADR **nunca é editado para mudar de ideia, e nunca é apagado.**

- Decisão substituída → `--supersedes NNNN`, e o par fica ligado nos dois sentidos.
- Prática que simplesmente saiu, sem substituta → `status: deprecated`.
- Tentado e desfeito → `status: reverted`, com `superseded-by` apontando para o ADR que desfez. Escreva na *Reversão* do novo o sinal que apareceu — é o registro mais valioso que existe aqui, porque é o único que ensina algo que ninguém previu.

Corrigir uma vírgula ou um link quebrado é edição normal. A numeração é a linha do tempo: apagar um número apagaria o fato de que aquilo foi decidido um dia.

## 5. Feche

```bash
python3 .claude/skills/health-check/scripts/health_check.py
```

**C16** confere a integridade do razão: frontmatter completo, número batendo com o arquivo, numeração sem buraco nem repetição, `status` do conjunto fechado, as cinco seções presentes, pares `supersedes`/`superseded-by` recíprocos, o índice do `README.md` batendo com os arquivos, e toda citação `ARQUIVO.md §N` resolvendo.

Um ADR que **decide stack ou toolchain** vale `+6` na dimensão 6 (`HEALTH.md` §3) — nesse caso rode a skill `health-check`, porque o placar muda. Um ADR de decisão comum não move o placar sozinho: registrar é o comportamento esperado, não uma conquista. Não invente movimento.

## Quando NÃO usar esta skill

- Para saber *o que* mudou → `CHANGELOG.md`.
- Para o porquê de D1–D25 → `GRILLING.md`, e `PROPAGATION-MAP.md` para onde cada uma foi parar. Conjunto fechado; não acrescente linhas lá.
- Para o estado de saúde do modelo → skill `health-check`.
