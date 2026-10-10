/**
 * O marketplace de 50 contextos, no formato de modelo da colmeia v4. Mora num módulo
 * próprio porque dois instrumentos o leem: o colmeia-50.build.mjs, que mede o mapa
 * parado, e o colmeia-navegacao.build.mjs, que o põe na mão de quem navega. Os dois
 * precisam do MESMO mapa, senão o antes e o depois deixam de ser comparáveis.
 *
 * O modelo é sintético mas não aleatório: um marketplace de varejo com doze
 * subdomínios e um bloco external, e relações com vizinhança — a maioria dentro de
 * um subdomínio ou entre vizinhos de negócio, poucas atravessando o mapa. Relação
 * aleatória é o pior caso que o ADR-0009 já mediu e descartou como irreal.
 */
const ctx = (...ids) => ids.map((id) => ({ id }));
export const MODEL = {
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
const R = (down, up, lt = ["ACL"], rt = ["OHS"]) => MODEL.mapping.push({ l: down, lt, c: "<--", rt, r: up });
// Vendas
R("Checkout", "Cart"); R("Checkout", "Pricing"); R("Cart", "Pricing"); R("Pricing", "Promotions"); R("OrderManagement", "Checkout");
// Descoberta e Marketplace
R("Search", "Catalog"); R("Recommendations", "Catalog"); R("Recommendations", "Search"); R("Reviews", "Catalog"); R("Cart", "Catalog");
R("SellerCatalog", "SellerOnboarding"); R("Catalog", "SellerCatalog"); R("Commissions", "OrderManagement"); R("SellerPayouts", "Commissions");
R("SellerPayouts", "PaymentGateway"); R("Inventory", "SellerCatalog");
// Entrega, logística e atendimento
R("Shipping", "OrderManagement"); MODEL.mapping.push({ l: "Shipping", lt: ["SK"], c: "<->", rt: ["SK"], r: "Inventory" });
R("Warehouse", "Inventory", ["ACL", "BBM"]); R("Returns", "Shipping"); R("Returns", "OrderManagement");
R("Routes", "Shipping"); R("FleetOps", "Routes"); R("Shipping", "Carriers"); R("Carriers", "CorreiosApi", ["ACL"], []);
R("Support", "OrderManagement"); R("Disputes", "Support"); R("Disputes", "Refunds"); R("Chatbot", "Support"); R("Support", "Profiles");
// Marketing e conteúdo
R("Segments", "OrderManagement"); R("Campaigns", "Segments"); R("Loyalty", "OrderManagement"); R("Promotions", "Campaigns");
R("Affiliates", "Campaigns"); R("Campaigns", "GoogleAds", ["ACL"], []); R("CMS", "MediaAssets"); R("Catalog", "MediaAssets"); R("Campaigns", "CMS");
// Genéricos: publicam, os outros consomem
R("Checkout", "PaymentGateway"); R("Invoicing", "PaymentGateway"); R("PaymentGateway", "FraudCheck"); R("Refunds", "PaymentGateway");
R("Returns", "Refunds"); R("PaymentGateway", "StripeApi", ["ACL"], []); R("FraudCheck", "ClearSaleApi", ["ACL"], []);
R("Invoicing", "ERPLegado", ["ACL"], []); MODEL.mapping.push({ l: "Warehouse", lt: ["BBM"], c: "-x-", rt: [], r: "ERPLegado" });
R("Checkout", "Auth"); R("Support", "Auth"); R("Profiles", "Auth"); R("Consent", "Profiles"); R("Segments", "Consent"); R("Email", "Consent");
R("OrderManagement", "Email"); R("Campaigns", "Email"); R("Support", "SMS"); R("Shipping", "Push");
R("Email", "SendGrid", ["ACL"], []); R("SMS", "TwilioApi", ["ACL"], []);
R("Reporting", "DataLake"); R("Experiments", "DataLake"); R("Recommendations", "Experiments"); R("DataLake", "SegmentCdp", ["ACL"], []);

const nCtx = MODEL.domains[0].subdomains.reduce((a, s) => a + s.contexts.length, 0) + MODEL.domains[0].external.length;
if (nCtx !== 50) throw new Error(`o modelo tem ${nCtx} contextos, não 50`);
