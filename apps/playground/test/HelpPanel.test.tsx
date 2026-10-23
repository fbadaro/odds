import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HelpPanel } from "../src/features/help/components/HelpPanel";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
const st = () => usePlayground.getState();
const help = () => document.querySelector('[data-feature="panel-help"]')!;

function open(text?: string) {
  act(() => {
    st().loadModel("m17");
    if (text) {
      st().setText(text);
      st().flush();
    }
    st().togglePanel("help");
  });
  return render(<HelpPanel />);
}

describe("HelpPanel", () => {
  beforeEach(() => usePlayground.setState({ ...initial }, true));
  afterEach(() => {
    cleanup();
    usePlayground.setState(initial, true);
  });

  it("shows the legend for the current map and the seven shortcuts", () => {
    open();
    expect(help().getAttribute("aria-label")).toBe("Como ler");
    const nav = st().drawing!.nav;
    const n = Object.values(nav.subs).filter((s) => s.type === "core").length;
    const ext = Object.keys(nav.tiles).filter((id) => !nav.ctxSub[id]).length;
    const rows = [...help().querySelectorAll("#legend > div")].map((r) => r.querySelector("span:last-child")!.textContent);
    expect(rows.some((t) => t === `core · ${n} subdomínio${n === 1 ? "" : "s"}`)).toBe(true);
    if (ext) expect(rows).toContain(`external · ${ext} · fora da água territorial`);
    expect(rows).toContain("A seta aponta para o downstream.");
    expect(rows).toContain("Relação acesa: tracejado correndo do upstream para o downstream.");
    expect(rows).toContain("Relação inválida: tracejado vermelho e parado.");
    expect(rows).toContain("A tag fica encostada no lado da peça a que pertence.");
    expect(help().querySelectorAll("#legend + div > b")).toHaveLength(7);
    expect([...help().querySelectorAll("kbd")].map((k) => k.textContent)).toEqual(["Esc", "0"]);
    expect(help().textContent).toContain("roda ou pinça");
    expect(help().textContent).toContain("mapa inteiro");
  });

  it("counts external contexts as outside the territorial waters", () => {
    open("domain D {\n  subdomain core Vendas {\n    context A\n  }\n  external {\n    context X\n    context Y\n  }\n  mapping {\n    A <-- [OHS] X\n    X --> [OHS] Y\n  }\n}\n");
    const rows = [...help().querySelectorAll("#legend > div")].map((r) => r.textContent);
    expect(rows).toContain("external · 2 · fora da água territorial");
  });

  it("singular for one subdomain", () => {
    open("domain D {\n  subdomain core Vendas {\n    context A\n  }\n  mapping {\n  }\n}\n");
    const rows = [...help().querySelectorAll("#legend > div")].map((r) => r.textContent);
    expect(rows).toContain("core · 1 subdomínio");
  });
});
