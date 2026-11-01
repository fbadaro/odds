import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EmptyMap } from "../src/features/create/components/EmptyMap";
import { Inspector } from "../src/features/inspector/components/Inspector";
import { StructurePanel } from "../src/features/structure/components/StructurePanel";
import { FileMenu } from "../src/features/topbar/components/FileMenu";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
const st = () => usePlayground.getState();

function withText(text: string) {
  act(() => {
    st().setText(text);
    st().flush();
  });
}

beforeEach(() => usePlayground.setState({ ...initial }, true));
afterEach(() => {
  cleanup();
  usePlayground.setState(initial, true);
});

describe("the structure panel creates", () => {
  beforeEach(() => {
    act(() => {
      st().loadModel("m17");
      st().togglePanel("tree");
    });
  });

  it("a subdomain, a context in a subdomain or in external, and a relationship", () => {
    render(<StructurePanel />);
    fireEvent.click(screen.getByRole("button", { name: "Novo subdomínio em ECommercePlatform" }));
    expect(st().creating).toEqual({ kind: "subdomain", domain: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Novo context em Sales" }));
    expect(st().creating).toEqual({ kind: "context", domain: 0, parent: "Sales" });
    fireEvent.click(screen.getByRole("button", { name: "Novo context externo" }));
    expect(st().creating).toEqual({ kind: "context", domain: 0, parent: null });
    fireEvent.click(screen.getByRole("button", { name: "Nova relação" }));
    expect(st().creating).toEqual({ kind: "relationship", domain: 0 });
  });

  it("nothing on a pure syntax error, and says why", () => {
    withText(st().text + "\n}}");
    render(<StructurePanel />);
    const plus = screen.getByRole("button", { name: "Novo context em Sales" });
    expect(plus.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(plus);
    expect(st().creating).toBeNull();
    expect(screen.getAllByText(/Corrija o erro de sintaxe na linha \d+ para criar\./).length).toBeGreaterThan(0);
  });

  it("the domain, when the file has none", () => {
    withText("// rascunho\n");
    render(<StructurePanel />);
    fireEvent.click(screen.getByRole("button", { name: "Criar domínio" }));
    expect(st().creating).toEqual({ kind: "domain" });
  });
});

describe("the inspector creates", () => {
  beforeEach(() => act(() => st().loadModel("m17")));

  it("a context in the selected subdomain", () => {
    act(() => st().select({ sub: "ECommercePlatform/Sales" }));
    render(<Inspector />);
    fireEvent.click(screen.getByRole("button", { name: "Novo context aqui" }));
    expect(st().creating).toEqual({ kind: "context", domain: 0, parent: "Sales" });
  });

  it("a relationship from the selected context", () => {
    act(() => st().select({ ctx: "Cart" }));
    render(<Inspector />);
    fireEvent.click(screen.getByRole("button", { name: "Nova relação a partir daqui" }));
    expect(st().creating).toEqual({ kind: "relationship", domain: 0, left: "Cart" });
  });
});

describe("the empty map", () => {
  it("is not there while the map has something drawn", () => {
    act(() => st().loadModel("m17"));
    const { container } = render(<EmptyMap />);
    expect(container.innerHTML).toBe("");
  });

  it("offers the domain when the file has none", () => {
    withText("");
    render(<EmptyMap />);
    expect(document.querySelector('[data-feature="empty-map"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Criar domínio" }));
    expect(st().creating).toEqual({ kind: "domain" });
  });

  it("offers a subdomain, and a context in the last one, while the domain has nothing to draw", () => {
    withText("domain Loja {\n  subdomain core Vendas {\n  }\n}\n");
    render(<EmptyMap />);
    expect(screen.getByText(/Loja/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Novo subdomínio" }));
    expect(st().creating).toEqual({ kind: "subdomain", domain: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Novo context em Vendas" }));
    expect(st().creating).toEqual({ kind: "context", domain: 0, parent: "Vendas" });
  });

  it("says nothing on a syntax error: the frozen map and its flag speak", () => {
    withText("domain {");
    const { container } = render(<EmptyMap />);
    expect(container.innerHTML).toBe("");
  });
});

describe("the file menu", () => {
  it("new design asks first, then empties the text as one edit and opens the domain form", async () => {
    render(<FileMenu />);
    fireEvent.click(screen.getByRole("button", { name: /marketplace\.odds/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /novo design/ }));
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
    expect(st().edit).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Começar do zero" }));
    expect(st().edit).toMatchObject({ from: 0, to: st().text.length, text: "" });
    expect(st().creating).toEqual({ kind: "domain" });
  });

  it("new design can be cancelled", async () => {
    render(<FileMenu />);
    fireEvent.click(screen.getByRole("button", { name: /marketplace\.odds/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /novo design/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(st().edit).toBeNull();
    expect(st().creating).toBeNull();
  });
});
