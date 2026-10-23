// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCameraController } from "../src/features/honeycomb/lib/cameraController";
import type { Box } from "../src/lib/selection";

const fit: Box = [0, 0, 1000, 600];
let mapEl: HTMLDivElement, svg: SVGSVGElement, pcts: number[];

beforeEach(() => {
  mapEl = document.body.appendChild(document.createElement("div"));
  Object.defineProperty(mapEl, "clientWidth", { value: 1400 });
  Object.defineProperty(mapEl, "clientHeight", { value: 900 });
  svg = mapEl.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
  pcts = [];
});
afterEach(() => {
  mapEl.remove();
  vi.useRealTimers();
});

const make = (reducedMotion: boolean) => createCameraController(mapEl, { reducedMotion, onZoomPct: (p) => pcts.push(p) });
const vb = () => svg.getAttribute("viewBox");

describe("camera controller", () => {
  it("a first drawing is the whole map at 100%, and only a new percent is published", () => {
    const cam = make(true);
    cam.setDrawing(svg, fit, false);
    expect(vb()).not.toBeNull();
    expect(mapEl.style.getPropertyValue("--k")).not.toBe("");
    cam.setDrawing(svg, fit, false);
    expect(pcts).toEqual([100]);
  });

  it("framing animates over 420 ms; with reduced motion it lands at once", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    const slow = make(false);
    slow.setDrawing(svg, fit, false);
    const start = vb();
    slow.frame([[100, 100], [160, 120]]);
    expect(vb()).toBe(start);
    vi.advanceTimersByTime(500);
    const landed = vb();
    expect(landed).not.toBe(start);

    const quick = make(true);
    quick.setDrawing(svg, fit, false);
    quick.frame([[100, 100], [160, 120]]);
    expect(vb()).toBe(landed);
  });

  it("an automatic camera follows the free area; a manual one stays", () => {
    const cam = make(true);
    cam.setDrawing(svg, fit, false);
    const whole = vb();
    const panel = document.body.appendChild(document.createElement("section"));
    panel.setAttribute("data-feature", "panel-code");
    panel.getBoundingClientRect = () => ({ left: 78, right: 478 }) as DOMRect;
    cam.safeChanged();
    const refit = vb();
    expect(refit).not.toBe(whole);
    cam.pan(40, 0);
    const moved = vb();
    panel.remove();
    cam.safeChanged();
    expect(vb()).toBe(moved);
    cam.reset();
    expect(vb()).toBe(whole);
  });

  it("zoom stops at five times the whole map", () => {
    const cam = make(true);
    cam.setDrawing(svg, fit, false);
    for (let i = 0; i < 12; i++) cam.zoomMid(1.4);
    expect(pcts.at(-1)).toBe(500);
    cam.fit();
    expect(pcts.at(-1)).toBe(100);
  });
});
