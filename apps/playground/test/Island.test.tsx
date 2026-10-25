import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Island } from "../src/components/island/Island";

describe("Island", () => {
  it("renders the requested element with the island class and passes attributes through", () => {
    const { container } = render(
      <Island as="nav" data-feature="rail" aria-label="Painéis">
        x
      </Island>,
    );
    const el = container.querySelector('nav[data-feature="rail"][aria-label="Painéis"]');
    expect(el?.textContent).toBe("x");
    expect(el?.className).not.toBe("");
  });

  it("defaults to a div", () => {
    const { container } = render(<Island>y</Island>);
    expect(container.firstElementChild?.tagName).toBe("DIV");
  });
});
