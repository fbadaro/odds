/**
 * O marketplace de 50 contextos, documentado: o modelo nu e a documentação, montados
 * como `documented(BARE, MODELS)`, e a fonte rica do modelo canônico. A aplicação o
 * lê pelo `marketplace()`.
 */
import { canon } from "../canon.js";
import type { LayoutContext, LayoutModel } from "../types.js";
import { MODELS } from "./models.js";
import { sourceOf } from "./source.js";

/* ---- o modelo nu ---- */
/**
 * O marketplace de 50 contextos, no formato de modelo do layout. É um mapa só, para
 * que medidas do mapa parado e da navegação continuem comparáveis.
 *
 * O modelo é sintético mas não aleatório: um marketplace de varejo com doze
 * subdomínios e um bloco external, e relações com vizinhança — a maioria dentro de
 * um subdomínio ou entre vizinhos de negócio, poucas atravessando o mapa. Relação
 * aleatória é o pior caso que o ADR-0009 já mediu e descartou como irreal.
 */
const ctx = (...ids: string[]): LayoutContext[] => ids.map((id) => ({ id }));
export const MARKETPLACE_MODEL: LayoutModel = {
  file: "marketplace.odds",
  domains: [{
    id: "RetailMarketplace", title: "Retail Marketplace",
    subdomains: [
      { id: "Sales", type: "core", title: "Vendas", contexts: ctx("Cart", "Checkout", "OrderManagement", "Pricing", "Promotions") },
      { id: "Discovery", type: "core", title: "Descoberta", contexts: ctx("Search", "Recommendations", "Catalog", "Reviews") },
      { id: "Marketplace", type: "core", title: "Marketplace", contexts: ctx("SellerOnboarding", "SellerCatalog", "Commissions", "SellerPayouts") },
      { id: "Fulfillment", type: "supporting", title: "Entrega e estoque", contexts: ctx("Shipping", "Inventory", "Warehouse", "Returns") },
      { id: "CustomerCare", type: "supporting", title: "Atendimento", contexts: ctx("Support", "Disputes", "Chatbot") },
      { id: "Logistics", type: "supporting", title: "Logística", contexts: ctx("Routes", "FleetOps", "Carriers") },
      { id: "Marketing", type: "supporting", title: "Marketing", contexts: ctx("Campaigns", "Segments", "Loyalty", "Affiliates") },
      { id: "Content", type: "supporting", title: "Conteúdo", contexts: ctx("CMS", "MediaAssets") },
      { id: "Payments", type: "generic", title: "Pagamentos", contexts: ctx("PaymentGateway", "Invoicing", "FraudCheck", "Refunds") },
      { id: "Identity", type: "generic", title: "Identidade", contexts: ctx("Auth", "Profiles", "Consent") },
      { id: "Notifications", type: "generic", title: "Notificações", contexts: ctx("Email", "SMS", "Push") },
      { id: "Analytics", type: "generic", title: "Analytics", contexts: ctx("DataLake", "Reporting", "Experiments") },
    ],
    external: ctx("StripeApi", "CorreiosApi", "ERPLegado", "SendGrid", "TwilioApi", "GoogleAds", "ClearSaleApi", "SegmentCdp"),
  }],
  mapping: [],
};
/* `down ← up`: o da esquerda consome, o da direita publica */
const R = (down: string, up: string, lt = ["ACL"], rt = ["OHS"]) => MARKETPLACE_MODEL.mapping.push({ l: down, lt, c: "<--", rt, r: up });
// Vendas
R("Checkout", "Cart"); R("Checkout", "Pricing"); R("Cart", "Pricing"); R("Pricing", "Promotions"); R("OrderManagement", "Checkout");
// Descoberta e Marketplace
R("Search", "Catalog"); R("Recommendations", "Catalog"); R("Recommendations", "Search"); R("Reviews", "Catalog"); R("Cart", "Catalog");
R("SellerCatalog", "SellerOnboarding"); R("Catalog", "SellerCatalog"); R("Commissions", "OrderManagement"); R("SellerPayouts", "Commissions");
R("SellerPayouts", "PaymentGateway"); R("Inventory", "SellerCatalog");
// Entrega, logística e atendimento
R("Shipping", "OrderManagement"); MARKETPLACE_MODEL.mapping.push({ l: "Shipping", lt: ["SK"], c: "<->", rt: ["SK"], r: "Inventory" });
R("Warehouse", "Inventory", ["ACL", "BBM"]); R("Returns", "Shipping"); R("Returns", "OrderManagement");
R("Routes", "Shipping"); R("FleetOps", "Routes"); R("Shipping", "Carriers"); R("Carriers", "CorreiosApi", ["ACL"], []);
R("Support", "OrderManagement"); R("Disputes", "Support"); R("Disputes", "Refunds"); R("Chatbot", "Support"); R("Support", "Profiles");
// Marketing e conteúdo
R("Segments", "OrderManagement"); R("Campaigns", "Segments"); R("Loyalty", "OrderManagement"); R("Promotions", "Campaigns");
R("Affiliates", "Campaigns"); R("Campaigns", "GoogleAds", ["ACL"], []); R("CMS", "MediaAssets"); R("Catalog", "MediaAssets"); R("Campaigns", "CMS");
// Genéricos: publicam, os outros consomem
R("Checkout", "PaymentGateway"); R("Invoicing", "PaymentGateway"); R("PaymentGateway", "FraudCheck"); R("Refunds", "PaymentGateway");
R("Returns", "Refunds"); R("PaymentGateway", "StripeApi", ["ACL"], []); R("FraudCheck", "ClearSaleApi", ["ACL"], []);
R("Invoicing", "ERPLegado", ["ACL"], []); MARKETPLACE_MODEL.mapping.push({ l: "Warehouse", lt: ["BBM"], c: "-x-", rt: [], r: "ERPLegado" });
R("Checkout", "Auth"); R("Support", "Auth"); R("Profiles", "Auth"); R("Consent", "Profiles"); R("Segments", "Consent"); R("Email", "Consent");
R("OrderManagement", "Email"); R("Campaigns", "Email"); R("Support", "SMS"); R("Shipping", "Push");
R("Email", "SendGrid", ["ACL"], []); R("SMS", "TwilioApi", ["ACL"], []);
R("Reporting", "DataLake"); R("Experiments", "DataLake"); R("Recommendations", "Experiments"); R("DataLake", "SegmentCdp", ["ACL"], []);

const nCtx = MARKETPLACE_MODEL.domains[0]!.subdomains.reduce((a, s) => a + s.contexts.length, 0) + MARKETPLACE_MODEL.domains[0]!.external!.length;
if (nCtx !== 50) throw new Error(`o modelo tem ${nCtx} contextos, não 50`);

/* ---- a documentação ---- */
/**
 * A documentação preenchida do marketplace de 50 contextos: as propriedades de
 * contexto (GRAMMAR.md §3) e de subdomínio (ADR-0008) que a ficha da relação mostra.
 *
 * Vinte e dois contextos e seis subdomínios já têm documentação nos `MODELS`,
 * com os mesmos nomes; o `documented()` lê de lá, e este bloco só preenche o resto.
 * Fica fora do modelo nu de propósito: propriedade não move peça.
 *
 * Os valores vão sem aspas aqui; o `documented()` as põe, como a fonte .odds pede.
 */
export const SUB_DOCS: Record<string, { description: string; owner: string }> = {
  Marketplace: { description: "Abrir a vitrine para vendedores de fora sem perder o controle", owner: "Diretoria de Marketplace" },
  Logistics: { description: "Levar o pacote do galpão até a porta", owner: "Diretoria de Operações" },
  Marketing: { description: "Trazer o cliente de volta, e trazer um novo", owner: "Diretoria de Marketing" },
  Content: { description: "Texto e imagem que vendem sem um vendedor", owner: "Gerência de Conteúdo" },
  Notifications: { description: "Avisar o cliente pelo canal certo, uma vez", owner: "Plataforma" },
  Analytics: { description: "Transformar evento em decisão", owner: "Diretoria de Dados" },
};

export const CTX_DOCS: Record<string, Omit<LayoutContext, "id">> = {
  Promotions: { title: "Promoções", type: "policy", description: "Regras de desconto, cupom e vigência",
    responsibilities: ["Validar cupom", "Combinar descontos", "Encerrar vigência"], maturity: "growing", team: "Vendas Squad", technology: "Kotlin" },
  Catalog: { title: "Catálogo", type: "aggregate", description: "Produto, variação e atributo, a fonte única do que se vende",
    responsibilities: ["Manter produto", "Publicar variação", "Versionar atributo"], maturity: "mature", team: "Descoberta Squad", technology: "Java, PostgreSQL" },
  Reviews: { title: "Avaliações", description: "Nota e comentário do comprador, com moderação",
    maturity: "growing", team: "Descoberta Squad" },
  SellerOnboarding: { title: "Cadastro de vendedor", type: "process", description: "Aceite, KYC e contrato do vendedor de fora",
    responsibilities: ["Verificar documentos", "Assinar contrato", "Liberar a loja"], maturity: "growing", team: "Marketplace Squad", technology: "TypeScript, Temporal" },
  SellerCatalog: { title: "Catálogo do vendedor", description: "Oferta do vendedor antes de virar produto do catálogo",
    responsibilities: ["Receber oferta", "Casar com produto existente"], maturity: "experimental", team: "Marketplace Squad", technology: "TypeScript" },
  Commissions: { title: "Comissões", type: "policy", description: "Quanto o marketplace retém de cada venda de terceiro",
    maturity: "growing", team: "Marketplace Squad", technology: "Kotlin" },
  SellerPayouts: { title: "Repasses", type: "process", description: "Liquidação do saldo do vendedor, descontada a comissão",
    responsibilities: ["Apurar saldo", "Agendar repasse", "Conciliar com o gateway"], maturity: "experimental", team: "Marketplace Squad", technology: "Kotlin" },
  Disputes: { title: "Disputas", type: "process", description: "Contestação entre comprador e vendedor, até o reembolso ou a recusa",
    maturity: "growing", team: "Atendimento Squad" },
  Chatbot: { title: "Assistente", description: "Primeiro atendimento automático, que escala para o humano",
    maturity: "experimental", team: "Atendimento Squad", technology: "Python, LLM" },
  Carriers: { title: "Transportadoras", type: "service", description: "Cotação e contratação de transportadora por entrega",
    responsibilities: ["Cotar frete", "Emitir etiqueta", "Receber rastreio"], maturity: "mature", team: "Logística Squad", technology: "Go" },
  Loyalty: { title: "Fidelidade", description: "Pontos por compra e resgate",
    maturity: "growing", team: "Growth", technology: "TypeScript" },
  Affiliates: { title: "Afiliados", description: "Link de parceiro e comissão por conversão",
    maturity: "experimental", team: "Growth" },
  CMS: { title: "Gestão de conteúdo", description: "Página, banner e texto editorial", team: "Conteúdo", technology: "Headless CMS" },
  MediaAssets: { title: "Mídia", type: "service", description: "Imagem e vídeo de produto, redimensionados e servidos por CDN",
    maturity: "mature", team: "Conteúdo", technology: "Go, S3, CDN" },
  FraudCheck: { title: "Antifraude", type: "policy", description: "Score de risco de cada transação antes da captura",
    responsibilities: ["Pontuar transação", "Aplicar regra de bloqueio"], maturity: "mature", team: "Payments Squad", technology: "Python" },
  Refunds: { title: "Reembolsos", type: "process", description: "Estorno total ou parcial ao comprador",
    maturity: "growing", team: "Payments Squad", technology: "Node.js" },
  Profiles: { title: "Perfis", type: "aggregate", description: "Dados cadastrais e endereços do cliente",
    maturity: "mature", team: "Plataforma", technology: "Go, PostgreSQL" },
  Consent: { title: "Consentimento", type: "policy", description: "O que o cliente autorizou, por finalidade, com histórico (LGPD)",
    responsibilities: ["Registrar consentimento", "Revogar por finalidade", "Responder auditoria"], maturity: "growing", team: "Plataforma", technology: "Go" },
  SMS: { title: "SMS", type: "service", description: "Envio de SMS transacional", maturity: "mature", team: "Plataforma" },
  Push: { title: "Push", type: "service", description: "Notificação no aplicativo", maturity: "growing", team: "Plataforma", technology: "Firebase" },
  DataLake: { title: "Data lake", description: "Eventos brutos de todo o marketplace, particionados por dia",
    maturity: "mature", team: "Dados", technology: "S3, Iceberg" },
  Reporting: { title: "Relatórios", type: "read-model", description: "Painéis de venda e operação para a diretoria",
    maturity: "mature", team: "Dados", technology: "dbt, Metabase" },
  Experiments: { title: "Experimentos", description: "Teste A/B e o cálculo de significância",
    maturity: "experimental", team: "Dados", technology: "Python" },
  SendGrid: { description: "Envio de e-mail de terceiros", technology: "SendGrid API" },
  TwilioApi: { description: "Envio de SMS de terceiros", technology: "Twilio REST API" },
  GoogleAds: { description: "Compra de mídia paga", technology: "Google Ads API" },
  ClearSaleApi: { description: "Análise de fraude de terceiros", technology: "ClearSale REST API" },
  SegmentCdp: { description: "Coleta de eventos de navegação", technology: "Segment" },
};

/* O marketplace documentado: o modelo nu com as propriedades de cada contexto e
   subdomínio. O que os `MODELS` já documentam, com os mesmos nomes, vem de lá
   (`v4models`); o resto, das tabelas acima. Os valores dos `MODELS` já trazem as
   aspas da fonte; os daqui ganham agora. Quem usa é o `marketplace()` abaixo. */
export function documented(bare: LayoutModel, v4models: Record<string, LayoutModel>): { model: LayoutModel; undocumented: string[] } {
  const q = (t: string) => '"' + t + '"';
  const fromV4: { ctx: Record<string, LayoutContext>; sub: Record<string, { description: string; owner: string | undefined }> } = { ctx: {}, sub: {} };
  for (const k of Object.keys(v4models)) for (const d of v4models[k].domains) {
    for (const sd of d.subdomains) {
      if (sd.description && !fromV4.sub[sd.id]) fromV4.sub[sd.id] = { description: sd.description, owner: sd.owner };
      for (const c of sd.contexts) if (Object.keys(c).length > 1 && !fromV4.ctx[c.id]) fromV4.ctx[c.id] = c;
    }
    for (const c of d.external!) if (Object.keys(c).length > 1 && !fromV4.ctx[c.id]) fromV4.ctx[c.id] = c;
  }
  const quoted = (doc: object) => Object.fromEntries(Object.entries(doc).map(([k, val]) =>
    [k, k === "title" || k === "maturity" ? val : Array.isArray(val) ? val.map(q) : q(val)]));
  const model: LayoutModel = JSON.parse(JSON.stringify(bare));
  const undocumented: string[] = [];
  const docCtx = (c: LayoutContext) => {
    const doc = fromV4.ctx[c.id] || (CTX_DOCS[c.id] && quoted(CTX_DOCS[c.id]));
    if (doc) Object.assign(c, doc, { id: c.id }); else undocumented.push(c.id);
  };
  for (const sd of model.domains[0]!.subdomains) {
    Object.assign(sd, fromV4.sub[sd.id] || (SUB_DOCS[sd.id] && quoted(SUB_DOCS[sd.id])) || {});
    sd.contexts.forEach(docCtx);
  }
  model.domains[0]!.external!.forEach(docCtx);
  return { model, undocumented };
}

/**
 * O marketplace como a aplicação o abre: o arquivo e a fonte `.odds` rica do modelo
 * documentado, em forma canônica.
 */
export function marketplace(): { file: string; text: string } {
  const { model: M50, undocumented } = documented(MARKETPLACE_MODEL, MODELS);
  if (undocumented.length) throw new Error(`contextos sem documentação: ${undocumented.join(", ")}`);
  return { file: M50.file, text: sourceOf(canon(M50), "rich").text + "\n" };
}
