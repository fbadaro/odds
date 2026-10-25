import { describe, expect, it } from "vitest";
import type { Box } from "../src/lib/selection";
import { camFor, clampCam, ease, fitCam, fitFrame, frameOf, isFar, pan, safeArea, zoomAt, zoomPercent, type Viewport } from "../src/features/honeycomb/lib/camera";

const fit: Box = [0, 0, 1000, 600];
const vp = (): Viewport => ({ w: 1400, h: 900, safe: safeArea(1400, 900, { left: 16, right: 72 }, null, null) });

describe("camera", () => {
  it("safeArea on a narrow screen ignores the islands", () => {
    expect(safeArea(700, 800, { left: 16, right: 72 }, { left: 88, right: 420 }, { left: 400, right: 690 })).toEqual({ l: 32, t: 116, w: 636, h: 560 });
  });

  it("safeArea leaves room for the open panel and the inspector", () => {
    expect(safeArea(1400, 900, { left: 16, right: 72 }, { left: 88, right: 420 }, { left: 1040, right: 1384 })).toEqual({ l: 444, t: 76, w: 572, h: 752 });
  });

  it("safeArea without a panel starts after the rail", () => {
    expect(safeArea(1400, 900, { left: 16, right: 72 }, null, null).l).toBe(96);
  });

  it("clampCam keeps width between fitW/5 and fitW*1.4", () => {
    const v = vp(), fw = fitCam(fit, v)[2];
    expect(clampCam([0, 0, 1, 1], fit, v)[2]).toBeCloseTo(fw / 5);
    expect(clampCam([0, 0, 1e9, 1e9], fit, v)[2]).toBeCloseTo(fw * 1.4);
  });

  it("frameOf a single point is a third of the fit", () => {
    const aspect = 1.5;
    expect(frameOf([[500, 300]], fit, aspect)[2]).toBeCloseTo(Math.max(fit[2], fit[3] * aspect) / 3);
  });

  it("fitCam puts the whole fit inside the safe area", () => {
    const v = vp(), c = camFor(fitFrame(fit, v), v), k = v.w / c[2];
    expect((fit[0] - c[0]) * k).toBeGreaterThanOrEqual(v.safe.l - 1e-6);
    expect((fit[0] + fit[2] - c[0]) * k).toBeLessThanOrEqual(v.safe.l + v.safe.w + 1e-6);
    expect((fit[1] - c[1]) * k).toBeGreaterThanOrEqual(v.safe.t - 1e-6);
    expect((fit[1] + fit[3] - c[1]) * k).toBeLessThanOrEqual(v.safe.t + v.safe.h + 1e-6);
  });

  it("zoomAt keeps the point under the cursor fixed", () => {
    const v = vp(), c = fitCam(fit, v), px = 700, py = 300;
    const z = zoomAt(c, 2, px, py, fit, v);
    expect(z[2]).toBeCloseTo(c[2] / 2);
    expect(z[0] + (px / v.w) * z[2]).toBeCloseTo(c[0] + (px / v.w) * c[2]);
    expect(z[1] + (py / v.h) * z[3]).toBeCloseTo(c[1] + (py / v.h) * c[3]);
  });

  it("zoomPercent of fitCam is 100", () => {
    const v = vp();
    expect(zoomPercent(fitCam(fit, v), fit, v)).toBe(100);
  });

  it("pan moves the box opposite to the drag, isFar and ease behave", () => {
    const v = vp(), c = fitCam(fit, v);
    expect(pan(c, 10, 0, v)[0]).toBeLessThan(c[0]);
    expect(isFar([0, 0, v.w, 1], v)).toBe(true);
    expect(isFar([0, 0, v.w / 2, 1], v)).toBe(false);
    expect([ease(0), ease(0.5), ease(1)]).toEqual([0, 0.5, 1]);
  });
});
