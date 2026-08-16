---
name: health-check
description: Afere a saúde do modelo ODDS e atualiza o HEALTH.md. Use ao fechar qualquer passe que toque um documento normativo (AST_SCHEMA, RULES-EN/PT, MESSAGES, GRAMMAR, TEST_SUITE, golden-files), ao abrir ou fechar um débito, ou quando pedirem o placar, a saúde do projeto, ou "como está o modelo".
---

# Aferir a saúde do modelo ODDS

`HEALTH.md` é o painel de saúde do modelo: seis dimensões ponderadas, catálogo tipado de bonificações e penalizações, débitos abertos. Esta skill roda a parte determinística e guia a parte que exige julgamento.

**Regra que governa tudo:** nenhuma nota muda sem uma linha no histórico, e nenhuma linha de histórico sem um evento tipado do catálogo. Se você se pegar escolhendo um número, parou de aferir e começou a arbitrar — e isso é a penalização de −5 da §4.

## 1. Rode o script primeiro

```bash
python3 .claude/skills/health-check/scripts/health_check.py
```

Saída 0 = conforme; 1 = falha. **Não leia o `HEALTH.md` inteiro antes disso** — o script já reporta o que interessa em ~15 linhas, e é para isso que ele existe. Use `-v` quando precisar da evidência por trás de cada checagem — a conta de cada dimensão, cada débito, cada linha do razão — sem abrir o `HEALTH.md`. Use `--json` para processar a saída: ela traz `score` e `failures` como campos.

As treze checagens (C1–C13) e o que cada uma prova estão na §8 do `HEALTH.md`. C8, C9, C11, C12 e C13 verificam o próprio placar e a própria descrição dele: se elas falham, o arquivo está internamente inconsistente e isso vem antes de qualquer outra coisa.

## 2. Se alguma checagem falhou

A falha **é** o evento. Localize-o na §4 (catálogo de penalizações), que já traz a dimensão e o Δ. Duas saídas legítimas:

- **Consertar no mesmo passe** — abra e feche o débito na mesma linha do histórico. Saldo zero no placar, cicatriz preservada no registro. É o caminho preferido.
- **Não consertar agora** — abra o débito na §5 com um ID novo (IDs nunca são reusados), custo e condição de fechamento *verificável*. "Quando alguém revisar" não é condição de fechamento; "quando a checagem CX sair conforme" é.

## 3. Se tudo passou, avalie o que o passe fez

Procure eventos da §3 (bonificações) que o passe realizou:

- regra nova pelo ciclo completo, na ordem fixa do `CLAUDE.md`;
- regra **rejeitada** por não passar nos dois critérios de admissão (`RULES.md` §0.4) — rejeitar é ato saudável e vale ponto;
- limitação nomeada, ambiguidade normativa fechada, ancoragem na literatura, ADR.

Se o passe não realizou nenhum evento do catálogo, o placar não muda e não há linha de histórico. **Não invente movimento.** Um passe de edição de prosa que não mexe no modelo é, corretamente, um passe de Δ zero.

Se o passe realizou algo bom ou ruim que **não está no catálogo**, adicione a linha ao catálogo primeiro, com a justificativa de por que aquilo é bom ou ruim *para o modelo*, e só então aplique.

## 3b. As duas dimensões que você julga

As dimensões **3 (Fidelidade Estratégica ao DDD)** e **6 (Prontidão de Implementação)** não têm checagem mecânica: nenhum `grep` decide se uma regra está ancorada num conceito de DDD estratégico, ou se ainda falta decisão para escrever o parser. **Quem dá essas duas notas é você**, sob a rubrica do `HEALTH.md` §9.

Você **não escolhe a nota da dimensão** — isso é o arbítrio que a §4 penaliza. Você pontua **critério a critério**, e a soma é a base. Procedimento:

1. Leia a rubrica (§9.1 para a dim 3, §9.2 para a dim 6) e identifique **quais critérios o passe tocou**. Normalmente é um ou dois.
2. Para cada um: a nota muda? Só se você puder **citar o artefato e a seção** que mudaram. A coluna *Evidência* é a condição da nota, não um comentário — reescreva-a com o que passou a ser verdade.
3. Respeite o teto como afirmação: dar 20 de 20 diz que não há o que melhorar ali. Se há, não é o teto.
4. **Não reavalie a rubrica inteira** fora de uma reaferição completa (§6.6). Repontuar tudo a cada passe é como a nota deriva sem que ninguém decida derivá-la — e a deriva de um modelo relendo o mesmo texto é silenciosa.
5. Some os critérios, escreva o resultado na coluna `Base` da §2, recalcule, e deixe **C11** conferir. Se C11 falhar, a conta não fecha — a rubrica manda, não o número que você tinha em mente.

Quando o passe não tocou nenhum critério de 3 nem de 6, as duas bases ficam **exatamente** como estavam. Isso é o caso comum.

## 4. Atualize o HEALTH.md

Aplique o Δ à **base** (dimensões de construção) ou abra/feche **débito** (integridade — lá a base é sempre 100 e não se mexe nela). Nas dimensões 3 e 6 a base vem da rubrica, nunca de um Δ solto. Depois:

1. Recalcule a §2 pela fórmula `nota = base + débitos` e `contribuição = peso × nota / 100`.
2. Atualize o total e o número no título da §2.
3. Acrescente **uma** linha na §7, com a evidência.
4. Rode o script de novo. **C8, C9, C11, C12 e C13 precisam sair conformes** — é a prova de que a aritmética fecha e de que o razão da §7 sustenta o placar. Acrescente a linha no **fim** da §7: ela é cronológica, e C12 falha se o último total não for o placar.

Se a `ODDS Language Version` incrementou neste passe, faça a reaferição completa da §6.6 em vez do delta incremental.

## 5. Feche o passe

Um passe normativo fecha com **duas** entradas, nunca uma: `CHANGELOG.md` (o que mudou) e `HEALTH.md` (o que aquilo fez com o modelo). Se o `HEALTH.md` mudou de versão editorial, isso também vai na seção dele no `CHANGELOG.md`.

## Quando NÃO usar esta skill

- Para saber *o que* mudou no repositório → `CHANGELOG.md`.
- Para saber *por que* uma decisão foi tomada → `GRILLING.md`.
- Para descobrir a `ODDS Language Version` → `CHANGELOG.md`, eixo 1. O `HEALTH.md` não é versão e nunca viaja na URL compartilhável.
