---
adr: 0015
title: Vite como bundler da aplicação
status: accepted
date: 2026-10-20
deciders: Fabio Badaro, Claude
tags: toolchain, stack, build, playground
supersedes: —
---

# ADR-0015 — Vite como bundler da aplicação

## Contexto

O `ADR-0005` decidiu o ambiente sem bundler, `tsc` para tipos e para o build das bibliotecas, e deixou escrito que o bundler entraria com a aplicação, *"e é decisão de outro ADR"*. Ele seguia como uma das duas decisões de stack em aberto.

Até 2026-10-20 não havia o que empacotar: as páginas da exploração de UI eram HTML autônomo, com o `@odds/core` embutido por script de build próprio. O `ADR-0014` mudou isso ao decidir React, TSX e CSS Modules: nenhum dos três roda no navegador sem transformação, e a escolha deixou de ser *se* haveria bundler para *qual*.

O que restringia:

- **Saída 100% estática.** O `PRD.md` proíbe execução e armazenamento no servidor, e o produto é um conjunto de arquivos servidos como estão.
- **O que o `ADR-0014` exige do build:** TSX, CSS Modules com *source maps* que levem do inspetor ao arquivo, recarga rápida durante a edição de estilo e divisão de código, para que a colmeia e o parser não atrasem a primeira pintura do chrome.
- **O Vitest já estava no repositório** (`ADR-0005`), e ele roda sobre o Vite: em 2026-10-20, o Vite 5.4 já estava instalado, como dependência transitiva do Vitest 2.1.
- **Pouca configuração para manter**, pela mesma prioridade do `ADR-0014`: o que é infraestrutura não deve virar código do projeto.

## Decisão

**A aplicação é empacotada com o Vite**, na versão atual da linha 8 (8.3.4 em 2026-10-20, com Rolldown por baixo), com o plugin oficial de React.

O argumento que venceu é que **o Vite já é a peça sobre a qual o ambiente de teste roda**: adotá-lo como bundler põe o build e os testes sobre a mesma resolução de módulos, os mesmos *aliases* e a mesma transformação. Isso fecha uma fonte de "passa no teste, quebra no navegador" que dois sistemas de build abririam. O resto, que ele também cumpre, é o que qualquer candidato sério cumpre: CSS Modules e TSX sem configuração, saída estática, divisão de código, recarga de estilo sem perder o estado da tela.

Fica de fora desta decisão, como no `ADR-0014`, onde o projeto da aplicação mora e como é organizado. Este ADR decide a ferramenta, não a estrutura.

## Alternativas consideradas

### esbuild direto

Era o menor número de peças: um binário rápido, que transforma TSX e entende CSS local. Rejeitado porque deixa por nossa conta o servidor de desenvolvimento com recarga, a divisão de código ajustada para o navegador e a integração com o Vitest. Cada uma dessas vira script nosso, o contrário de "pouca configuração para manter". O Vite usava o esbuild por baixo até a linha 7.

### Rsbuild (Rspack)

Tecnicamente à altura, ativo (2.2.14 em 2026-10-19) e mais rápido em projetos grandes. Rejeitado porque o ganho de velocidade aparece em escala de centenas de módulos, que a aplicação não terá tão cedo. Também desacoplaria o build do Vitest, que continuaria sobre o Vite: dois sistemas de transformação para conciliar, que é exatamente o que a decisão evita.

### Parcel

Zero configuração, o que atende à prioridade de manter pouco. Rejeitado pelo ritmo: a última publicação é de fevereiro de 2026, contra versões mensais do Vite, e com um ecossistema de plugins e de documentação menor. A mesma objeção do Rsbuild sobre ficar separado do Vitest vale aqui.

### Framework de aplicação (Next.js, React Router em modo framework)

Considerado porque é o caminho que a documentação do React recomenda para começar um projeto. Rejeitado porque o que esses frameworks acrescentam ao bundler é servidor (renderização no servidor, rotas de API, carregamento de dados), e o `PRD.md` proíbe servidor. O modo estático deles existe, mas carrega a abstração inteira para usar a parte que o Vite já entrega sozinho.

### Bun como bundler

O `ADR-0005` já recusou o Bun como runtime, por acrescentar uma variável de compatibilidade a um projeto cujo alvo é o navegador via ecossistema npm. Adotá-lo só como bundler traria a mesma variável sem a vantagem de unificar runtime e teste.

## Consequências

- Fecha a última decisão de stack que faltava, junto com o `ADR-0014`.
- O ambiente do `ADR-0005` fica completo sem ser contrariado: `tsc` continua checando tipos e construindo as bibliotecas (`@odds/core`, `@odds/messages`, e o `@odds/layout` quando nascer), sem impor bundle a quem as consome, e o Vite entra só na aplicação.
- **Piora: o Vitest precisa subir de versão.** O repositório usa o Vitest 2.1, preso ao Vite 5. Para ir ao Vite 8 é preciso subir o Vitest também (o atual, 5.0.5, aceita do Vite 6.4 ao 8), e essa migração toca a configuração do harness de conformidade. O contrato dele com o core é uma função só (`parseAndValidate`, `TEST_SUITE.md` §3), então a migração não deve tocar o executor, mas precisa ser feita e conferida com os 44 golden files.
- **Piora: mais uma ferramenta com ciclo próprio.** O Vite publica com frequência e já trocou o motor por baixo (esbuild e Rollup → Rolldown) dentro da mesma vida útil, e acompanhar isso é custo recorrente.
- Os scripts de montagem das páginas de exploração continuaram como estavam, servindo à bancada, não à aplicação.

## Reversão

**O sinal** seria o build ou o servidor de desenvolvimento ficarem lentos a ponto de atrapalhar o ciclo de ajuste de estilo, ou uma mudança de versão do Vite quebrar o Vitest e o build ao mesmo tempo com frequência. Este é o preço de tê-los acoplados de propósito.

**O custo da volta é baixo enquanto a configuração for pequena.** Trocar Vite por Rsbuild é reescrever um arquivo de configuração, e TSX e CSS Modules são padrões que os dois entendem da mesma forma. O que encareceria a volta são plugins específicos do Vite e importações com sufixo próprio dele (`?raw`, `?url`, `import.meta.glob`). Usá-los com parcimônia é o que mantém a troca barata.

**O que já foi construído em cima:** nada ainda. A aplicação não existe, e este ADR a antecede.
