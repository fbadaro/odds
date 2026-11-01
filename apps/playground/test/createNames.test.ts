import { describe, expect, it } from "vitest";
import { nameProblem, pairProblem } from "../src/features/create/lib/names";

describe("pairProblem (RULES-EN.md §1.A)", () => {
  const related = new Set(["A|B"]);
  const external = new Set(["Stripe", "Correios"]);

  it("accepts two contexts not yet related, one of them external", () => {
    expect(pairProblem("A", "Stripe", related, external)).toBeNull();
  });

  it("asks for both sides", () => {
    expect(pairProblem("A", "", related, external)).toBe("Escolha os dois contexts.");
  });

  it("rejects a context related to itself", () => {
    expect(pairProblem("A", "A", related, external)).toBe("Um context não se relaciona consigo mesmo.");
  });

  it("rejects a pair already related, in either order", () => {
    expect(pairProblem("B", "A", related, external)).toBe("Esses dois contexts já têm uma relação no mapping.");
  });

  it("rejects two external contexts", () => {
    expect(pairProblem("Stripe", "Correios", related, external)).toBe("Uma relação entre dois contexts externos não é sua para mapear.");
  });
});

const none = new Set<string>();

describe("nameProblem", () => {
  it("accepts an identifier, accents included", () => {
    expect(nameProblem("Billing", none, "context")).toBeNull();
    expect(nameProblem("Faturação_2", none, "context")).toBeNull();
  });

  it("asks for a name when there is none", () => {
    expect(nameProblem("", none, "context")).toBe("Escreva um nome.");
    expect(nameProblem("   ", none, "context")).toBe("Escreva um nome.");
  });

  it("rejects what the lexer does not read as one identifier", () => {
    const shape = "Use letras, dígitos e _, começando por uma letra e sem espaços.";
    expect(nameProblem("2fa", none, "context")).toBe(shape);
    expect(nameProblem("Order Management", none, "context")).toBe(shape);
    expect(nameProblem("a-b", none, "context")).toBe(shape);
    expect(nameProblem("x//y", none, "context")).toBe(shape);
  });

  it("rejects a reserved word, but not a word that only starts with one", () => {
    expect(nameProblem("domain", none, "context")).toBe("`domain` é uma palavra reservada da linguagem.");
    expect(nameProblem("core", none, "subdomínio")).toBe("`core` é uma palavra reservada da linguagem.");
    expect(nameProblem("coreografia", none, "context")).toBeNull();
  });

  it("rejects a name already taken, with the noun of what is being created", () => {
    const taken = new Set(["Cart"]);
    expect(nameProblem("Cart", taken, "context")).toBe("Já existe um context com esse nome.");
    expect(nameProblem("Cart", taken, "subdomínio")).toBe("Já existe um subdomínio com esse nome.");
    expect(nameProblem("cart", taken, "context")).toBeNull();
  });
});
