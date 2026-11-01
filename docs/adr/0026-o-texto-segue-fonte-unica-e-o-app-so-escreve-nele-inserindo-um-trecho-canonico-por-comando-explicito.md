---
adr: 0026
title: O texto segue fonte única, e o app só escreve nele inserindo um trecho canônico por comando explícito
status: accepted
date: 2026-11-01
supersedes: 0003
---

# ADR-0026 — O texto segue fonte única, e o app só escreve nele inserindo um trecho canônico por comando explícito

## Contexto

O ADR-0003 fechou o fluxo em mão única, `.odds` → diagrama: o aplicativo não escrevia no arquivo do usuário sob nenhuma circunstância. O motivo era de custo. Um diagrama editável exigiria uma árvore sintática lossless e um impressor fiel, porque mover uma caixa não podia reformatar o arquivo que a pessoa cola num pull request. Isso é reescrita do parser. O próprio ADR-0003 deixava a volta aberta: o sinal seria querer edição visual como decisão de produto.

Esse sinal veio com a issue #21. Quem ainda não conhece a DSL não tem por onde começar: não sabe a forma do arquivo, os tipos de subdomínio, as propriedades de um context nem quais tags valem em cada lado de cada conector (`RULES-PT.md` §1.C). A pergunta passou a ser até onde o app pode escrever no texto sem pagar o custo que o 0003 recusou.

## Decisão

**O texto continua sendo a fonte única, e o app passa a escrever nele por um único caminho: inserir um trecho canônico, só quando o usuário pede.**

- O app nunca reformata, move nem apaga texto que já existe. A única exceção é o "Novo design", que substitui o arquivo inteiro depois de uma confirmação explícita.
- O trecho segue um formato fixo: indentação copiada do bloco vizinho, propriedades na ordem da `GRAMMAR.md` e `title` primeiro. Ele entra sempre no fim do bloco-pai, criando o `external` ou o `mapping` quando ainda não existem.
- O ponto de inserção vem dos spans que a AST já tem. Sem árvore (um `SYNTAX_ERROR` puro), não há onde inserir, e os comandos ficam desabilitados.
- Cada inserção é um passo do desfazer do editor.
- O diagrama continua sendo projeção: nenhuma posição, arrasto ou estado do mapa vive fora do texto.

O argumento que venceu é que inserir no fim de um bloco não precisa de nada que o parser ainda não tenha. O span do `}` do pai diz onde escrever, e o texto ao redor fica byte a byte como estava. O formulário vira um atalho para digitar, não uma segunda representação, e o texto continua sendo o que vai para o PR.

## Alternativas consideradas

### Manter o ADR-0003 e entregar um gerador para copiar e colar

Seria a saída sem custo arquitetural: um formulário monta o trecho, e o usuário cola onde quiser. Foi rejeitada porque devolve ao iniciante justamente a parte que ele não sabe fazer, que é saber onde o trecho entra. Também perde o laço que ensina, em que o mapa reage no instante da criação.

### Edição bidirecional completa

Criar, renomear, mover e apagar direto no diagrama, que é o que se espera de um editor de diagramas. Foi rejeitada pelo custo que o 0003 já calculou: árvore com trivia ancorada nos nós, impressor fiel e uma política de escrita para arquivo inválido. Renomear e apagar ainda propagam para as referências do `mapping`. Nenhuma dessas peças é necessária para criar.

### Inserir no ponto do cursor

Seria o mais simples de implementar. Foi rejeitada porque o cursor pode estar em qualquer lugar, inclusive dentro de outro bloco, e o resultado vira `SYNTAX_ERROR` ou cai num pai que o usuário não escolheu. O fim do bloco-pai é o único lugar que é sempre válido e previsível.

## Consequências

- O app passa a ter um módulo de escrita: ele monta o trecho e calcula a posição a partir da AST. Esse módulo precisa de testes próprios para indentação, para os blocos criados quando faltam e para arquivos com comentários e linhas em branco.
- O desfazer de uma inserção programática não vem de graça no `textarea` do editor: precisa de `insertText` ou de uma pilha própria.
- Renomear, apagar e mover continuam fora. Quando vierem, pedem um ADR que reabra a árvore lossless ou uma regra de escrita que trate referências.
- Com um `SYNTAX_ERROR` puro, a criação fica indisponível justamente quando um iniciante mais precisaria de ajuda. A interface precisa dizer o porquê e apontar o erro.
- A frase do `PRD.md` §5.5, *"the application never rewrites the user's text"*, continua verdadeira: ela trata de migração automática, e inserir a pedido não reescreve nada.
