/**
 * `@odds/layout/fixtures` — o banco de prova da colmeia-v4: os modelos de amostra,
 * o gerador do modelo "como o autor o escreveu", a forma canônica, o gerador de
 * fonte com âncoras e o marketplace de 50 contextos. Para testes e para a bancada;
 * a aplicação usa o `marketplace()` e o `declared` + `sourceOf`, os dois arquivos de
 * amostra do menu de arquivo (entram no bundle).
 */
export { BREAKS, EXTRA, MODELS, type Break } from "./models.js";
export { declared, mulberry, shuffleArr } from "./declared.js";
export { canon, flip, prep, sortTags } from "../canon.js";
export { Src, fnv, ownerDomain, relText, sourceOf, type AnchorSpan, type Source } from "./source.js";
export { CTX_DOCS, MARKETPLACE_MODEL, SUB_DOCS, documented, marketplace } from "./marketplace.js";
