import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CreateDialog } from "../src/features/create/components/CreateDialog";
import { applyEdit } from "../src/stores/slices/create";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
const SHOP = `domain Shop {
  subdomain core Sales {
    context Cart
    context Checkout
  }

  external {
    context Stripe
  }

  mapping {
    Cart --> Checkout
  }
}
`;

/** The text the pending edit would leave. */
const result = () => {
  const { edit, text } = usePlayground.getState();
  return edit ? applyEdit(text, edit) : null;
};
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const open = (t: Parameters<typeof initial.openCreate>[0]) => act(() => usePlayground.getState().openCreate(t));

/** Opens a select and picks an option of its own list (a closed popup may linger in the DOM). */
async function pick(label: string, option: string) {
  const trigger = screen.getByRole("combobox", { name: label });
  fireEvent.click(trigger);
  const id = trigger.getAttribute("aria-controls")!;
  const list = await waitFor(() => document.getElementById(id)!);
  const opt = await within(list).findByRole("option", { name: new RegExp(`^${option}`) });
  // a real click: Base UI commits an item on the click that follows its own pointerdown
  fireEvent.pointerDown(opt);
  fireEvent.click(opt);
}

describe("CreateDialog", () => {
  beforeEach(() => {
    usePlayground.setState({ ...initial, text: "" }, true);
    usePlayground.getState().setText(SHOP);
  });
  afterEach(() => usePlayground.setState(initial, true));

  it("is closed while nothing is being created", () => {
    render(<CreateDialog />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("creates a context with just a name, under the parent it was opened for", () => {
    render(<CreateDialog />);
    open({ kind: "context", domain: 0, parent: "Sales" });
    expect(screen.getByRole("dialog", { name: "Novo context" })).toBeTruthy();
    expect(screen.getByRole("dialog").textContent).toContain("em Sales");
    type("Nome", "Promo");
    submit(/Criar context/);
    expect(result()).toContain("    context Checkout\n    context Promo\n  }");
    expect(usePlayground.getState().creating).toBeNull();
  });

  it("explains a bad name in the field and writes nothing", () => {
    render(<CreateDialog />);
    open({ kind: "context", domain: 0, parent: "Sales" });
    type("Nome", "Stripe");
    expect(screen.getByText("Já existe um context com esse nome.")).toBeTruthy();
    submit(/Criar context/);
    expect(usePlayground.getState().edit).toBeNull();
    type("Nome", "");
    submit(/Criar context/);
    expect(screen.getByText("Escreva um nome.")).toBeTruthy();
  });

  it("offers every field of a context under more details, and writes them", () => {
    render(<CreateDialog />);
    open({ kind: "context", domain: 0, parent: null });
    expect(screen.getByRole("dialog").textContent).toContain("em external");
    type("Nome", "Correios");
    fireEvent.click(screen.getByRole("button", { name: /mais detalhes/ }));
    type("Título", "Correios");
    type("Tipo", "gateway");
    type("Descrição", "Frete e rastreio");
    type(/Responsabilidades/, "Cotar frete\nRastrear");
    fireEvent.click(screen.getByRole("button", { name: "legacy" }));
    type("Time", "Logística");
    type("Tecnologia", "SOAP");
    submit(/Criar context/);
    expect(result()).toContain(
      [
        "    context Stripe",
        "    context Correios {",
        '      title: "Correios"',
        '      type: "gateway"',
        '      description: "Frete e rastreio"',
        '      responsibilities: ["Cotar frete", "Rastrear"]',
        "      maturity: legacy",
        '      team: "Logística"',
        '      technology: "SOAP"',
        "    }",
      ].join("\n"),
    );
  });

  it("shows the text the form will write", () => {
    render(<CreateDialog />);
    open({ kind: "context", domain: 0, parent: "Sales" });
    type("Nome", "Promo");
    expect(screen.getByLabelText("Vai entrar no texto").textContent).toBe("context Promo");
  });

  it("creates a subdomain with its type", () => {
    render(<CreateDialog />);
    open({ kind: "subdomain", domain: 0 });
    fireEvent.click(screen.getByRole("button", { name: "supporting" }));
    type("Nome", "Ops");
    fireEvent.click(screen.getByRole("button", { name: /mais detalhes/ }));
    type("Responsável", "Ops Squad");
    submit(/Criar subdomínio/);
    expect(result()).toContain('  subdomain supporting Ops {\n    owner: "Ops Squad"\n  }\n\n  external {');
  });

  it("creates the domain of an empty file", () => {
    usePlayground.getState().setText("");
    render(<CreateDialog />);
    open({ kind: "domain" });
    type("Nome", "Loja");
    type("Título", "Minha loja");
    submit(/Criar domínio/);
    expect(result()).toBe('domain Loja {\n  title: "Minha loja"\n}\n');
  });

  it("creates a relationship, offering only the tags valid on each side", async () => {
    render(<CreateDialog />);
    open({ kind: "relationship", domain: 0, left: "Checkout" });
    await pick("Upstream", "Checkout");
    await pick("Downstream", "Stripe");
    const up = screen.getByRole("group", { name: "Tags de Checkout" });
    const down = screen.getByRole("group", { name: "Tags de Stripe" });
    expect(within(up).getAllByRole("button").map((b) => b.textContent)).toEqual(["OHS", "PL", "S", "BBM"]);
    expect(within(down).getAllByRole("button").map((b) => b.textContent)).toEqual(["ACL", "CF", "C", "BBM"]);
    fireEvent.click(within(up).getByRole("button", { name: "OHS" }));
    fireEvent.click(within(down).getByRole("button", { name: "ACL" }));
    fireEvent.click(within(down).getByRole("button", { name: "CF" }));
    expect(within(down).getByRole("button", { name: "ACL" }).getAttribute("aria-pressed")).toBe("false");
    submit(/Criar relação/);
    expect(result()).toContain("    Cart --> Checkout\n    Checkout [OHS] --> [CF] Stripe\n  }");
  });

  it("refuses a pair already related, and offers no Shared Kernel with a third party", async () => {
    render(<CreateDialog />);
    open({ kind: "relationship", domain: 0 });
    fireEvent.click(screen.getByRole("button", { name: "<->" }));
    await pick("Um lado", "Checkout");
    await pick("Outro lado", "Cart");
    expect(screen.getByText("Esses dois contexts já têm uma relação no mapping.")).toBeTruthy();
    submit(/Criar relação/);
    expect(usePlayground.getState().edit).toBeNull();
    await pick("Outro lado", "Stripe");
    expect(within(screen.getByRole("group", { name: "Tags de Stripe" })).getAllByRole("button").map((b) => b.textContent)).toEqual(["BBM"]);
  });

  it("marks a Shared Kernel on both sides of <->", async () => {
    usePlayground.getState().setText(SHOP.replace("    context Checkout\n", "    context Checkout\n    context Promo\n"));
    render(<CreateDialog />);
    open({ kind: "relationship", domain: 0 });
    fireEvent.click(screen.getByRole("button", { name: "<->" }));
    await pick("Um lado", "Checkout");
    await pick("Outro lado", "Promo");
    fireEvent.click(within(screen.getByRole("group", { name: "Tags de Checkout" })).getByRole("button", { name: "SK" }));
    expect(within(screen.getByRole("group", { name: "Tags de Promo" })).getByRole("button", { name: "SK" }).getAttribute("aria-pressed")).toBe("true");
    submit(/Criar relação/);
    expect(result()).toContain("    Checkout [SK] <-> [SK] Promo\n");
  });

  it("Cancelar closes the form and writes nothing", () => {
    render(<CreateDialog />);
    open({ kind: "context", domain: 0, parent: "Sales" });
    type("Nome", "Promo");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(usePlayground.getState().creating).toBeNull();
    expect(usePlayground.getState().edit).toBeNull();
  });
});
