---
adr: 0014
title: A apresentação embute o GSAP 3.12.5, que entra como devDependency exata
status: accepted
date: 2026-10-19
deciders: Fabio Badaro, Claude
tags: apresentacao, dependencia, gsap, design
supersedes: —
superseded-by: —
---

# ADR-0014 — A apresentação embute o GSAP 3.12.5, que entra como devDependency exata

## Contexto

Em 2026-10-19 o autor decidiu levar o ODDS aos stakeholders de uma plataforma interna de arquitetura, numa apresentação em HTML único com slides animados em GSAP e SVG (`docs/superpowers/specs/2026-10-19-apresentacao-odds-design.md`). A apresentação roda num ambiente que não controlamos: a rede de uma corporação financeira, com proxy, e eventualmente sem internet na sala.

As páginas de `docs/design/pages/` que já usavam GSAP (`landing-v5.html`, `mapa-vivo.html`, `bancada-heroi.html`) carregavam a versão 3.12.5 por `<script src>` do cdnjs. Isso funcionava porque eram páginas de estudo, abertas com rede. O repositório não tinha o GSAP como dependência. O `playground.html` resolvera um problema parecido para o core: blocos gerados entre marcadores, regravados e conferidos por `stamp()` em `colmeia-embed.mjs`.

## Decisão

A apresentação embute o GSAP 3.12.5 num bloco gerado `<!--GSAP-->`, montado por `apresentacao.check.mjs` a partir de `node_modules/gsap/dist/gsap.min.js` pelo mesmo `stamp()` do playground. O pacote `gsap` entra em `devDependencies` com a versão exata `3.12.5`, a mesma que as outras páginas pedem ao CDN.

O que venceu foi a combinação de duas garantias. Uma apresentação que depende de rede pode falhar na frente de quem decide. E o embutido tem procedência verificável: a versão está no `package-lock.json`, e a checagem acusa quando o bloco envelhece.

## Alternativas consideradas

### `<script src>` do CDN, como as outras páginas

Era o caminho de menor esforço e o padrão da casa. Foi rejeitado porque a sala pode não ter rede, ou ter um proxy que bloqueia o cdnjs. Nesse caso nenhuma animação roda, e o motor dos slides depende do GSAP.

### Arquivo `gsap.min.js` versionado no repositório

Também funciona sem rede, mas são 72 KB de código de terceiros dentro do git, sem gerenciador de pacotes que diga de onde vieram nem que versão são. Atualizar vira copiar um arquivo à mão.

### Baixar do CDN na hora do build

Evita a dependência, mas torna o build dependente de rede e de um terceiro estar no ar. E a checagem sem `--write` não teria como conferir o bloco sem baixar de novo.

## Consequências

- A apresentação funciona aberta direto do disco, sem rede. Só as fontes do Google caem para as do sistema.
- O repositório ganha a primeira dependência que não é de teste nem de build do core. O `npm install` passa a trazer o GSAP.
- A página fica cerca de 72 KB maior, e o bloco gerado nunca é editado à mão (mesma regra dos blocos do playground).
- As outras páginas continuam no CDN. Há duas formas de carregar o mesmo GSAP no repositório, e a diferença se justifica pelo lugar onde cada página roda.

## Reversão

O sinal de erro seria a apresentação passar a rodar só publicada, com rede garantida, ou a licença ou a distribuição do GSAP mudar de um jeito que impeça embutir. O custo da volta é pequeno: trocar o marcador por um `<script src>` do cdnjs, tirar o bloco de `apresentacao.check.mjs` e remover `gsap` do `package.json`. Nada além da apresentação foi construído em cima disso.
