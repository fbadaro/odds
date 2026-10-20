---
adr: 0014
title: React no chrome da aplicação, com Base UI para o comportamento dos componentes padrão e CSS Modules sobre os tokens do DESIGN.md
status: accepted
date: 2026-10-20
deciders: Fabio Badaro, Claude
tags: ui, stack, componentes, acessibilidade, estilo, playground
supersedes: —
superseded-by: —
---

# ADR-0014 — React no chrome da aplicação, com Base UI para o comportamento dos componentes padrão e CSS Modules sobre os tokens do DESIGN.md

## Contexto

O `ADR-0007` adiou o framework de UI até a exploração de tela produzir fatos, e o `HEALTH.md` §9.2 (R6.4) o mantinha, junto com o bundler, como uma das duas decisões de stack em aberto. Em 2026-10-20 a exploração já tinha os fatos que importavam: o `ADR-0009` fixou que o diagrama é SVG montado pelo `@odds/layout`, o `ADR-0011` fez da colmeia a vista principal, o `ADR-0013` fez do `DESIGN.md` a fonte do sistema visual, e o `docs/design/pages/playground.html` reunia tudo numa bancada única de cerca de 5 mil linhas de JavaScript sem framework.

A pergunta que reabriu o assunto não foi sobre framework, foi sobre componentes. A aplicação vai precisar de sete peças padrão — modal, tabs, dropdown, tooltip, toast, combobox e popover —, e o autor queria duas coisas delas. A primeira era **comportamento acessível sem reinventar**: foco preso no modal, `Esc`, setas nas tabs, ARIA correto. Na bancada, isso era resolvido caso a caso (um `role="menu"`, alguns `aria-expanded` e tratadores de teclado escritos à mão), e não havia ainda modal nem tabs. A segunda era **variante padronizada**: trocar tamanho e cor de um botão, e de qualquer outro componente, de um jeito fácil. O que é próprio do ODDS (colmeia, ilhas, trilho, painel de diagnósticos) seguiria escrito pelo projeto.

Quatro restrições apertavam a escolha:

- **Pouco código nosso no repositório.** O autor preferiu explicitamente depender de biblioteca a manter código gerado: código de componente copiado para o repositório, mesmo que editável, é código que ele precisa entender e manter, e ajustar sem pedir a uma IA era um requisito declarado.
- **O ajuste parte do nome do componente**, não do inspetor do navegador: abrir o componente e encontrar o estilo dele ali.
- **O `DESIGN.md` dá a diretriz, não os nomes.** Cor, espaçamento, raio, sombra e tipografia são obrigatórios; como cada componente se chama no código é decisão da aplicação, e uma biblioteca que chame o botão de outro nome não fere nada.
- **Desempenho importa**, mas o custo pesado do produto está no layout e na montagem do SVG (`PRD.md` §8.2, `ADR-0009`), não no chrome.

A situação de manutenção das candidatas, levantada no npm e no GitHub em 2026-10-20, pesou tanto quanto a forma delas:

| Biblioteca | Última versão | Commits em 90 dias | Combobox |
|---|---|---|---|
| Base UI (`@base-ui/react`) | 1.9.0, 2026-10-09 | 460 | sim, e Autocomplete |
| React Aria Components (Adobe) | 1.22.1, 2026-10-09 | 219 | sim |
| Radix Primitives (WorkOS) | 1.8.1, 2026-10-14 | 121 | **não** |
| shadcn/ui | 4.22.1, 2026-10-18 | 275 | via Base UI ou Radix |
| Web Awesome (sucessor do Shoelace) | 3.14.0, 2026-09-24 | 134 | só na versão Pro, paga |
| Zag.js | 1.46.0, 2026-10-11 | 200 | sim |

E do lado do navegador: `<dialog>` e `popover` já funcionam nos três motores, o posicionamento por âncora em CSS chegou a eles em janeiro de 2026 com o reposicionamento automático ainda irregular no Safari, e o tooltip nativo (`popover="hint"`, `interestfor`) não roda no Safari.

## Decisão

**O chrome da aplicação é React 19. O comportamento dos componentes padrão vem do Base UI, como dependência. O estilo é CSS Modules por componente, consumindo tokens globais em variáveis CSS cujos valores vêm do `DESIGN.md`. A colmeia fica fora do React.**

O argumento que venceu é que **só esta combinação entrega os sete componentes sem deixar código de componente no repositório e sem tirar o estilo do CSS**. Cada uma das outras falha em pelo menos um dos três: o Radix não tem combobox; o navegador puro não tem combobox nem tooltip no Safari; o Web Awesome cobra pelo combobox; o shadcn copia o componente para dentro do repositório e põe a variante em classes Tailwind dentro do TSX; o Zag.js sem framework exige código de ligação escrito por nós em cada componente. O Base UI não traz estilo nenhum: expõe o estado como atributos (`[data-open]`, `[data-highlighted]`, `[data-disabled]`), e o CSS do projeto os estiliza.

Entre as duas bibliotecas que cumprem os três critérios, Base UI e React Aria, o desempate foi o ritmo de manutenção e a direção do ecossistema. O Base UI publica todo mês, com time dedicado, e desde julho de 2026 é a base padrão do shadcn/ui, que migrou para ele vindo do Radix.

O que a decisão fixa, peça por peça:

1. **React só no chrome.** Ilhas, painéis, trilho, rodapé de diagnósticos, modais e formulários. A colmeia continua sendo a string SVG do `@odds/layout` (`ADR-0009`), injetada num contêiner que o React não reconcilia: a cada pausa de digitação o SVG troca inteiro, e passar isso pelo reconciliador seria pagar diff de árvore sobre um desenho que já é regenerado por inteiro. A animação FLIP e a localidade do `ADR-0010` ficam como estão.
2. **Base UI só no comportamento.** Ele cuida de foco, teclado, ARIA, camadas e posicionamento. Visual, nenhum.
3. **Estilo em duas camadas.** Os **tokens** são variáveis CSS globais (cores em triplets RGB, raios, espaços, sombras, tipografia, as duas densidades), com os valores do `DESIGN.md`. Os **componentes** têm cada um seu `.module.css` ao lado do `.tsx`, consumindo só tokens, nunca valor cru. Variante de tamanho e de cor é uma classe do próprio módulo que troca quais tokens o componente lê. Uma mudança do sistema inteiro é feita no token; a de um componente, na pasta dele.
4. **O `DESIGN.md` manda nos valores, não nos nomes.** Os componentes que ele descreve (`button-primary`, `island`, `pill-mono`…) são especificação visual: medidas, preenchimentos, estados. Um `<Button variant="primary">` que cumpra o `button-primary` está conforme, qualquer que seja o nome. É a leitura do `ADR-0013`, não uma mudança dele: aquele ADR fez do arquivo a fonte única do *sistema visual* e nunca obrigou nomes no código.

**Fica deliberadamente em aberto**, para uma conversa própria sobre *como construir*: a estrutura do código (um pacote em `packages/` ou outra organização), as práticas de React a adotar, como os tokens saem do `DESIGN.md` para o CSS (gerados ou só validados por build, a saída que o próprio `ADR-0013` previa para quando houvesse framework e bundler) e o destino do `playground.html` atual.

## Alternativas consideradas

### shadcn/ui

Era uma das duas candidatas com que a conversa abriu. Rejeitado pelos dois critérios que o autor pôs primeiro. O shadcn não é dependência, é gerador: copia o código de cada componente para o repositório, e a partir daí ele é nosso para manter, que é exatamente o "código gerado para gerenciar" que se queria evitar. E a variante mora no componente, como classes Tailwind dentro de uma chamada `cva` em TSX: trocar o tamanho do botão é editar o componente, não um token. O comportamento que ele entrega vem do Base UI (padrão desde julho de 2026) ou do Radix. Adotar o Base UI direto fica com o comportamento e dispensa o código copiado.

### Radix Primitives

A outra candidata do início, e o mesmo modelo do Base UI: sem estilo, estado por atributos. Rejeitado por um fato, não por gosto: **não tem combobox**, e o combobox é justamente o componente mais difícil da lista, o que mais custaria escrever à mão. O projeto está vivo (121 commits em 90 dias, versão de 2026-10-14), mas o trabalho recente é de correção, e o investimento novo em primitivas sem estilo foi para o Base UI, feito em parte pelos mesmos autores. Reabre se o Base UI parar e o Radix ganhar o que falta.

### React Aria Components

Cumpre os três critérios, e foi a segunda colocada. É a referência mais rigorosa em acessibilidade do ecossistema, com internacionalização de leitores de tela e de entrada que nenhuma outra iguala. Perdeu no desempate: ritmo de manutenção menor que o do Base UI e direção do ecossistema indo para o outro lado. Também é mais pesada e tem uma API mais extensa para aprender. **É a saída natural se o Base UI falhar**, porque o modelo é o mesmo (sem estilo, estado por atributos) e o CSS dos componentes sobreviveria quase todo.

### Web Awesome (Web Components)

A mais próxima do jeito de ajustar que o autor descreveu: sem framework, estilizada por variáveis CSS, com tokens próprios. Rejeitada por duas razões. A primeira é que o combobox está na versão Pro, paga, e o componente decisivo da lista não pode depender de licença comercial num produto aberto. A segunda é o shadow DOM: o CSS do projeto alcança só o que o componente expõe por `::part()` e variáveis, e o visual de partida é o da biblioteca, a ser desfeito em vez de construído sobre os tokens do `DESIGN.md`.

### Navegador puro, com Zag.js ou Floating UI onde faltasse

Era a saída de menor peso e a única sem framework, e o autor aceitava abrir mão do React se ela fosse a melhor. `<dialog>`, `popover` e o posicionamento por âncora cobrem modal e popover, e tabs e toast são padrões pequenos. Rejeitada porque o que sobra é exatamente o que o autor não queria reinventar: dropdown e combobox com teclado e ARIA corretos, e tooltip, que no Safari ainda não tem forma nativa. Com o Zag.js, que tem adaptador vanilla e combobox, o comportamento viria pronto, mas cada componente precisaria de código de ligação nosso entre a máquina de estados e o DOM. Isso troca dependência por código próprio, o contrário da prioridade declarada.

### Framework leve (Preact, Svelte, Solid) com a biblioteca de comportamento do ecossistema dele

Meio-termo de peso: Preact com uma camada de compatibilidade, Svelte com Bits UI, Solid com Kobalte ou Ark UI. Rejeitado porque o ganho, alguns KB no primeiro carregamento, cai no lugar que não pesa: o custo do produto é o layout da colmeia, que fica fora do framework de qualquer jeito. O preço seria um ecossistema menor e bibliotecas de comportamento menos usadas, logo menos testadas nos casos difíceis de acessibilidade. Preact continua uma rota de fuga barata se o custo do React no chrome um dia aparecer.

### Tailwind para o estilo

Rejeitado. Põe o estilo no markup, como classes utilitárias no TSX, enquanto o autor quer abrir o componente e achar o estilo num arquivo CSS. Também criaria uma segunda escala de valores (a do Tailwind) para conciliar com a do `DESIGN.md`.

### CSS global com os nomes do `DESIGN.md` (`.button-primary`, `.island`)

Foi a **primeira recomendação** da conversa, e é por isso que está aqui: um arquivo por componente em camadas `@layer`, com nomes de classe iguais aos do `DESIGN.md`, para que o que se vê no inspetor do navegador leve direto ao arquivo. Perdeu quando o autor disse que parte do nome do componente, não do inspetor, e que o `DESIGN.md` não deve impor nomes ao código. Com essas duas premissas, o estilo ao lado do componente é o caminho mais curto, e o isolamento do CSS Modules elimina a colisão de nomes que o CSS global deixaria por conta da disciplina.

### A colmeia dentro do React, como JSX

Seria a forma mais uniforme: um único modelo de componente para tudo. Rejeitada porque o desenho já é função pura do texto, regerado inteiro a cada pausa de digitação (`ADR-0009`), e o reconciliador não tem o que economizar ali. Acrescentaria custo por elemento num mapa de 50 contextos e acoplaria o `@odds/layout`, que hoje não conhece DOM, a um framework.

## Consequências

- O R6.4 do `HEALTH.md` §9.2 fecha uma das duas decisões que faltavam. A outra, o bundler, é o `ADR-0015`, inevitável a partir daqui: TSX e CSS Modules precisam de transformação.
- O comportamento acessível dos sete componentes deixa de ser código nosso. O que era resolvido caso a caso na bancada passa a vir de uma biblioteca com time dedicado, e o projeto escreve só o estilo.
- Ajustar visual não exige ler lógica: o token muda o sistema inteiro, e o `.module.css` muda um componente.
- **Piora: o React entra como dependência de toda a interface.** Fica na casa de 45 a 60 KB comprimidos no primeiro carregamento, a medir no primeiro build, mais o Base UI, que é *tree-shakeable* e só pesa pelo que for importado. E, com ele, um modelo mental (componentes, estado, efeitos) que o projeto não tinha.
- **Piora: o Base UI é jovem.** A versão estável é de dezembro de 2025. O ritmo é alto, e isso traz mudanças que podem exigir ajuste a cada versão. A dependência é aceita sabendo que as primitivas sem estilo já trocaram de líder uma vez (Radix → Base UI) em pouco mais de um ano.
- **Piora: a interface passa a ter dois mundos.** O React governa o chrome e a colmeia é imperativa, num contêiner que ele não toca. A costura entre os dois (seleção, foco, clique num diagnóstico que leva ao mapa) é código nosso, e é onde os bugs vão morar.
- **Piora: no inspetor do navegador, as classes aparecem com sufixo gerado** pelo CSS Modules. É o preço de partir do nome do componente; os *source maps* do bundler levam de volta ao arquivo.
- Os 5 mil linhas do `playground.html` não migram por esta decisão. Ele continua sendo a bancada de exploração (`ADR-0007`), e como e quando a aplicação em React nasce é a conversa de construção.

## Reversão

**Os sinais.** Para a biblioteca: o Base UI parar de publicar ou desacelerar como o Radix desacelerou, ou um dos sete componentes se mostrar inacessível num caso que não se corrige por fora. Para o framework: lentidão na digitação atribuível ao React e não ao layout (o `PRD.md` §8.2 é a régua), ou o tamanho do primeiro carregamento virar queixa. Para o estilo: ajustes recorrentes que exigem mexer em mais de um `.module.css` para uma mudança que deveria ser de um token só, que é o sinal de que a camada de tokens está pobre.

**O custo da volta, por peça.** Trocar Base UI por React Aria custa reescrever o miolo de cada componente padrão. O CSS sobrevive quase todo, porque os dois expõem o estado por atributos (os nomes mudam, a forma não). Trocar React por Preact é configuração mais uma camada de compatibilidade. Sair do React para outro framework é reescrever o chrome inteiro, e esse custo cresce a cada tela construída. A colmeia fica de fora dessa conta, e isso é parte da razão de mantê-la fora do React.

**O que protegeria a reversão**, e deve ser respeitado na conversa de construção: o código da aplicação importa os **nossos** componentes, nunca o `@base-ui/react` direto. Se o Base UI só aparece dentro dos componentes padrão, trocá-lo é um passe nesses arquivos, não uma busca pelo projeto inteiro.

**O que já foi construído em cima:** o `ADR-0015` (bundler), que existe porque este decidiu TSX e CSS Modules.
