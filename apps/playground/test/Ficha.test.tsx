import { act, fireEvent, render, screen } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Ficha } from "../src/features/inspector/components/Ficha";
import { SelectionCaption } from "../src/features/inspector/components/SelectionCaption";
import { usePlayground, type Selection } from "../src/stores/playground";

const initial = usePlayground.getState();
const st = () => usePlayground.getState();
const ficha = () => document.querySelector<HTMLElement>('[data-feature="ficha"]');
const within = (sel: string) => [...ficha()!.querySelectorAll<HTMLElement>(sel)];
const button = (text: string | RegExp) =>
  within("button").find((b) => (typeof text === "string" ? b.textContent === text : text.test(b.textContent!)))!;

function open(sel: Selection) {
  act(() => st().select(sel));
  return render(<Ficha />);
}

describe("Ficha", () => {
  beforeEach(() => usePlayground.setState({ ...initial }, true));
  afterEach(() => usePlayground.setState(initial, true));

  it("does not exist without a selection", () => {
    render(<Ficha />);
    expect(ficha()).toBeNull();
  });

  it("a context shows its contract and properties", () => {
    open({ ctx: "Catalog" });
    expect(ficha()!.tagName).toBe("ASIDE");
    expect(ficha()!.getAttribute("aria-label")).toBe("Ficha");
    expect(within("[data-kind]")[0]!.textContent).toBe("Contexto");
    expect(ficha()!.querySelector("h4")!.textContent).toBe("Catalog");
    expect(ficha()!.textContent).toContain("Catálogo");
    const sects = within("[data-sect]").map((s) => s.textContent);
    expect(sects).toEqual(["Contrato", "Propriedades"]);
    const rels = within("[data-rel]");
    expect(rels).toHaveLength(6);
    expect(rels.map((r) => r.querySelector("[data-gorel]")!.textContent)).toContain("upstream de Search ›");
    expect(ficha()!.textContent).toContain("Java, PostgreSQL");
    expect(button("Discovery")).toBeTruthy();
    expect(within("[data-fence]")[0]!.textContent).toContain("Propriedade é documentação");
  });

  it("a relation shows both sides with the tag glossary", () => {
    open({ rel: "Inventory|Shipping", from: null });
    expect(within("[data-kind]")[0]!.textContent).toBe("Relação");
    expect(ficha()!.querySelector("h4")!.textContent).toBe("Inventory ⇄ Shipping");
    expect(ficha()!.textContent).toContain("Mutuamente dependentes");
    expect(within("[data-relsrc]")[0]!.textContent).toContain("[SK]");
    const sides = within("[data-side]");
    expect(sides).toHaveLength(2);
    expect(sides.map((s) => s.dataset.type)).toEqual(["supporting", "supporting"]);
    expect(sides[0]!.textContent).toContain("par");
    expect(sides[0]!.textContent).toContain("Shared Kernel");
    expect(ficha()!.textContent).toContain("Dentro de Fulfillment.");
    expect(within("[data-fence]")[0]!.textContent).toContain("A tag é o contrato que o validador confere.");
  });

  it("a relation seen from a context goes back to it", () => {
    open({ ctx: "Catalog" });
    fireEvent.click(button("upstream de Search ›"));
    expect(st().selection).toEqual({ rel: "Catalog|Search", from: "Catalog" });
    expect(ficha()!.querySelector("h4")!.textContent).toBe("Catalog → Search");
    fireEvent.click(button("← contrato de Catalog"));
    expect(st().selection).toEqual({ ctx: "Catalog" });
  });

  it("a relation with an external names the other side's contract", () => {
    // as in the bench, navOf gives the external block a group ("D/external", type external);
    // the "fora do domínio" branch is for a context with no group, built here by hand
    open({ rel: "PaymentGateway|StripeApi", from: null });
    expect(ficha()!.textContent).toContain("Atravessa a fronteira: Payments (generic) e external (external).");
    const d = st().drawing!;
    const ctxSub = { ...d.nav.ctxSub };
    delete ctxSub.StripeApi;
    act(() => usePlayground.setState({ drawing: { ...d, nav: { ...d.nav, ctxSub } } }));
    expect(ficha()!.textContent).toContain("Com um sistema externo, fora do domínio: o contrato do outro lado não é seu.");
    const ext = within("[data-side]").find((s) => s.dataset.type === "external")!;
    expect(ext.textContent).toContain("fora do domínio");
    expect(ext.textContent).toContain("Nenhuma tag declarada deste lado.");
  });

  it("a subdomain shows the derived tally", () => {
    open({ sub: "RetailMarketplace/Discovery" });
    expect(within("[data-kind]")[0]!.textContent).toBe("Subdomínio");
    expect(ficha()!.querySelector("h4")!.textContent).toBe("Discovery");
    expect(within("[data-tally] span").map((s) => s.textContent)).toEqual(["4 contextos", "4 internas", "4 atravessam a fronteira"]);
    const rows = within("[data-ctxrow]");
    expect(rows.map((r) => r.dataset.ctxrow)).toEqual(["Catalog", "Recommendations", "Reviews", "Search"]);
    expect(rows[0]!.textContent).toBe("Catalog6 rel.");
    fireEvent.click(rows[0]!);
    expect(st().selection).toEqual({ ctx: "Catalog" });
  });

  it("the subdomain link frames the subdomain", () => {
    open({ ctx: "Catalog" });
    const seq = st().frameSeq;
    fireEvent.click(button("Discovery"));
    expect(st().selection).toEqual({ sub: "RetailMarketplace/Discovery" });
    expect(st().frameSeq).toBe(seq + 1);
  });

  it("the line link reveals in the editor", () => {
    open({ ctx: "Catalog" });
    const line = st().ast!.domains[0]!.subdomains.flatMap((s) => s.contexts).find((c) => c.name === "Catalog")!.span.start.line;
    fireEvent.click(button(`marketplace.odds · L${line}`));
    expect(st().reveal!.start.line).toBe(line);
    expect(st().openPanel).toBe("code");
  });

  it("closing the ficha clears the selection", () => {
    open({ ctx: "Catalog" });
    fireEvent.click(screen.getByRole("button", { name: "Fechar a ficha" }));
    expect(st().selection).toBeNull();
    expect(ficha()).toBeNull();
  });

  it("a verdict renders the message with code in mono", () => {
    act(() => {
      st().setText(st().text.replace("    context Catalog {", "    context Lonely {}\n    context Catalog {"));
      st().flush();
    });
    const d = st().markers.find((m) => m.code === "UNMAPPED_CONTEXT")!;
    expect(d).toBeTruthy();
    open({ ctx: "Lonely" });
    expect(within("[data-sect]").map((s) => s.textContent)).toEqual(["Veredito", "Contrato", "Propriedades"]);
    const vd = within("[data-verdict]")[0]!;
    expect(vd.querySelector("code")!.textContent).toBe("Lonely");
    expect(vd.querySelector("[role=img]")!.getAttribute("aria-label")).toBe(d.severity);
    expect(vd.textContent).toContain("UNMAPPED_CONTEXT · ");
    fireEvent.click(button(`L${d.span.start.line}:${d.span.start.column}`));
    expect(st().reveal!.start.line).toBe(d.span.start.line);
    expect(ficha()!.textContent).toContain("Nenhuma relação no mapping.");
    expect(ficha()!.textContent).toContain("Nenhuma propriedade declarada.");
  });

  it("is in the DOM when a layout effect sees the selection", () => {
    // the camera measures the ficha in a layout effect keyed on the selection (Honeycomb)
    const seen: boolean[] = [];
    function Probe() {
      const sel = usePlayground((s) => s.selection);
      useLayoutEffect(() => {
        seen.push(sel !== null && ficha() !== null);
      }, [sel]);
      return null;
    }
    render(
      <>
        <Probe />
        <Ficha />
      </>,
    );
    act(() => st().select({ ctx: "Catalog" }));
    expect(seen.at(-1)).toBe(true);
  });
});

describe("SelectionCaption", () => {
  beforeEach(() => usePlayground.setState({ ...initial }, true));
  afterEach(() => usePlayground.setState(initial, true));
  const cap = () => document.querySelector<HTMLElement>('[data-feature="selection-caption"]');

  it("names the selection and is announced", () => {
    render(<SelectionCaption />);
    expect(cap()).toBeNull();
    act(() => st().select({ ctx: "Catalog" }));
    expect(cap()!.getAttribute("aria-live")).toBe("polite");
    expect(cap()!.querySelector("b")!.textContent).toBe("Catalog");
    expect(cap()!.textContent).toBe("Catalog · 6 vizinhos · clique numa linha para ver só ela · Esc limpa");
  });

  it("hides over a frozen map", () => {
    act(() => st().select({ ctx: "Catalog" }));
    render(<SelectionCaption />);
    act(() => st().setText(st().text + "\n{"));
    expect(st().stale).toBe(true);
    expect(cap()).toBeNull();
  });
});
