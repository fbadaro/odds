import { useLayoutEffect, useRef } from "react";
import { framePoints } from "../../../lib/selection";
import { usePlayground } from "../../../stores/playground";
import { createCameraController, type CameraController } from "../lib/cameraController";
import { flip } from "../lib/flip";
import { bindMapInput, type MapActions } from "../lib/mapInput";
import { paintSelection } from "../lib/paintSelection";
import "../honeycomb.css";
import styles from "./Honeycomb.module.css";

const reducedMotion = () =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** O mapa pede, o store decide: o que não está no mapa não é selecionado. */
const actions: MapActions = {
  ready: () => usePlayground.getState().drawing !== null,
  pickContext: (id) => usePlayground.getState().select({ ctx: id }, true),
  pickRelation: (rk) => usePlayground.getState().clickRelation(rk),
  pickSubdomain: (key) => {
    const { selection, select } = usePlayground.getState();
    select(selection && "sub" in selection && selection.sub === key ? null : { sub: key }, true);
  },
  clear: () => {
    const { selection, select } = usePlayground.getState();
    if (selection) select(null);
  },
  hover: (key) => {
    const { hover, setHover } = usePlayground.getState();
    if (key !== hover) setHover(key);
  },
};

/**
 * The honeycomb is drawn outside React reconciliation (ADR-0014): React owns the
 * container, the SVG inside it is written as markup only when the string changes, and
 * camera, selection, hover and FLIP touch that SVG imperatively.
 */
export function Honeycomb() {
  const drawing = usePlayground((s) => s.drawing);
  const svg = drawing?.svg ?? null;
  const stale = usePlayground((s) => s.stale);
  const selection = usePlayground((s) => s.selection);
  const hover = usePlayground((s) => s.hover);
  const frameSeq = usePlayground((s) => s.frameSeq);
  const cameraCommand = usePlayground((s) => s.cameraCommand);
  const epoch = usePlayground((s) => s.epoch);
  const openPanel = usePlayground((s) => s.openPanel);
  const hasFicha = usePlayground((s) => s.selection !== null);
  const root = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const camera = useRef<CameraController | null>(null);
  // what the camera already answered: a remount must not replay an old request
  const seen = useRef({ epoch, frameSeq, command: cameraCommand?.seq ?? 0, safe: `${openPanel}|${hasFicha}`, svg: null as string | null });

  const isStale = svg !== null && stale;

  // the camera and the pointer, once; the effects below run in this order in a commit
  useLayoutEffect(() => {
    const el = root.current!;
    const cam = createCameraController(el, {
      reducedMotion: reducedMotion(),
      onZoomPct: (pct) => usePlayground.getState().setZoomPct(pct),
    });
    camera.current = cam;
    const unbind = bindMapInput(el, cam, actions);
    return () => {
      unbind();
      cam.destroy();
      camera.current = null;
    };
  }, []);

  // a new file: back to the automatic camera, before its drawing lands
  useLayoutEffect(() => {
    if (epoch === seen.current.epoch) return;
    seen.current.epoch = epoch;
    camera.current?.reset();
  }, [epoch]);

  // the bench's paint: mount, camera, selection, then the FLIP of a new topology. It runs for
  // every drawn text, as the bench's does: when the markup is the same the node stays, but an
  // automatic camera is still fitted again to the free area as it is now
  useLayoutEffect(() => {
    const el = mount.current;
    if (!el) return;
    if (svg === seen.current.svg) {
      const node = el.querySelector("svg");
      if (node && drawing) camera.current?.setDrawing(node, drawing.fit, false);
      return;
    }
    seen.current.svg = svg;
    el.innerHTML = svg ?? "";
    const node = el.querySelector("svg");
    const { selection: sel, hover: hov } = usePlayground.getState();
    if (!node || !drawing) return;
    node.setAttribute("preserveAspectRatio", "xMidYMid meet");
    camera.current?.setDrawing(node, drawing.fit, drawing.prevTiles !== null);
    paintSelection(node, drawing.nav, sel, hov);
    if (drawing.prevTiles && !reducedMotion()) flip(node, drawing.prevTiles, drawing.geo.tiles);
  }, [drawing, svg]);

  useLayoutEffect(() => {
    const node = mount.current?.querySelector("svg");
    const drawing = usePlayground.getState().drawing;
    if (node && drawing) paintSelection(node, drawing.nav, selection, hover);
  }, [selection, hover]);

  useLayoutEffect(() => {
    root.current!.classList.toggle("frozen", isStale);
  }, [isStale]);

  // the free area changed (a panel or the ficha opened or closed); before framing, as in the bench
  useLayoutEffect(() => {
    const key = `${openPanel}|${hasFicha}`;
    if (key === seen.current.safe) return;
    seen.current.safe = key;
    camera.current?.safeChanged();
  }, [openPanel, hasFicha]);

  useLayoutEffect(() => {
    if (frameSeq === seen.current.frameSeq) return;
    seen.current.frameSeq = frameSeq;
    const { selection: sel, drawing } = usePlayground.getState();
    const pts = drawing && framePoints(sel, drawing.nav);
    if (pts) camera.current?.frame(pts);
  }, [frameSeq]);

  useLayoutEffect(() => {
    if (!cameraCommand || cameraCommand.seq === seen.current.command) return;
    seen.current.command = cameraCommand.seq;
    const cam = camera.current;
    if (cameraCommand.kind === "in") cam?.zoomMid(1.4);
    else if (cameraCommand.kind === "out") cam?.zoomMid(1 / 1.4);
    else cam?.fit();
  }, [cameraCommand]);

  return (
    <div
      ref={root}
      data-feature="map"
      className="odds-map"
      data-testid="honeycomb"
      tabIndex={0}
      aria-label="Mapa: arraste para mover, roda ou pinça para aproximar, setas e + − 0 no teclado"
    >
      <div ref={mount} className={styles.mount} />
      {svg === null && <p className={styles.empty}>O mapa aparece quando o texto tiver uma árvore.</p>}
    </div>
  );
}
