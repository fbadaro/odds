---
adr: 0024
title: A interface sai em português no MVP, e o inglês entra depois como seletor
status: accepted
date: 2026-10-24
deciders: Fabio Badaro, Claude
tags: produto, playground, idioma, prd
supersedes: —
---

# ADR-0024 — A interface sai em português no MVP, e o inglês entra depois como seletor

## Contexto

O `PRD.md`, até a versão 1.2.0, não dizia em que idioma o produto sai. Três camadas já tinham tomado posições diferentes, cada uma por conta própria. O `MESSAGES.md` nasceu bilíngue: cada um dos 35 códigos tem template em português e em inglês, com teste que cobra os mesmos placeholders nos dois. As palavras da linguagem (`domain`, `subdomain`, `context`, os conectores e as tags) são literais em inglês da `GRAMMAR.md` e não mudam com o idioma de ninguém. E a interface, na bancada e na aplicação, foi escrita toda em português: `lang="pt-BR"`, as mensagens pedidas em `pt`, e o texto de botões, painéis e dicas escrito direto nos componentes, sem camada de tradução.

O produto se apresenta como iniciativa aberta, comparada no próprio PRD ao Context Mapper, que é em inglês. O autor e o primeiro público, por outro lado, falam português. Ninguém tinha decidido se o MVP precisava atender os dois, nem se o inglês devia ser o padrão.

## Decisão

**A interface do playground sai em português do Brasil no MVP, e o inglês entra depois, como seletor de idioma.** O `.odds` não muda com o idioma, e o catálogo de mensagens continua bilíngue desde já.

O argumento que venceu é de custo no momento certo. O que é caro de traduzir depois já é bilíngue: a frase de cada diagnóstico, que é o texto mais longo e mais delicado do produto. O que falta traduzir são rótulos curtos da interface, e isso pode esperar o momento em que houver alguém pedindo inglês, sem pagar agora uma camada de tradução e um seletor que ninguém usaria.

## Alternativas consideradas

### Bilíngue já no MVP, com seletor

Atenderia os dois públicos desde o primeiro dia. Rejeitada porque abriria uma terceira lacuna no produto, ao lado do compartilhamento e do auto-save, que são exigências do PRD ainda não cumpridas. A ordem certa é cumprir o que o PRD já promete antes de acrescentar uma promessa.

### Inglês como padrão, português como tradução

Combinaria com a vitrine de projeto aberto e com as palavras da linguagem. Rejeitada porque trocaria o idioma de toda a interface que a bancada validou com o autor, e o primeiro público é de língua portuguesa.

### Deixar o idioma fora do PRD

Era o estado anterior, e foi ele que deixou três camadas decidirem cada uma por si. Um requisito que ninguém escreve continua sendo decidido, só que por omissão.

## Consequências

- O `PRD.md` (1.3.0) registra o idioma na §5.4 e põe a interface em inglês entre os não-objetivos do MVP, na §2.3.
- As palavras-chave do `.odds`, os códigos de diagnóstico e o arquivo compartilhado são os mesmos em qualquer idioma. Um link aberto por alguém que usa outro idioma mostra o mesmo desenho e os mesmos diagnósticos, só com outra frase.
- **O que piora:** cada componente novo escrito com texto direto aumenta o custo da extração quando o inglês vier. Hoje são dezenas de rótulos em pelo menos 15 arquivos da aplicação.
- Os códigos (`CONFORMIST_CORE`, `UNDOCUMENTED_CONTRACT`) aparecem em inglês ao lado da frase em português, porque são identificadores, não texto.

## Reversão

**O sinal de erro** é alguém de fora do Brasil chegar ao playground e não conseguir usá-lo, ou o projeto passar a ser divulgado num lugar onde o português afasta quem chega.

**O custo da volta** cresce com a interface: extrair o texto dos componentes para uma tabela por idioma e acrescentar o seletor. As mensagens de diagnóstico já estão prontas, e basta passar `en` ao `renderMessage`.

**O que foi construído em cima:** a interface da aplicação, toda em português, e a §2.3 e a §5.4 do `PRD.md`.
