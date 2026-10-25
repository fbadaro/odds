import { declared, marketplace, sourceOf } from "@odds/layout/fixtures";

export type ModelKey = "m50" | "m17";

export interface SampleModel {
  key: ModelKey;
  file: string;
  text: string;
  /** What the file menu shows next to the name. */
  hint: string;
}

const m50 = marketplace();

/** The two sample files of the bench's file menu. */
export const MODELS: Record<ModelKey, SampleModel> = {
  m50: { key: "m50", file: m50.file, text: m50.text, hint: "50 contextos" },
  m17: { key: "m17", file: "vendas.odds", text: sourceOf(declared("one", "clean", 0, 0), "rich").text + "\n", hint: "17 contextos" },
};
