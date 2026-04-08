// @vitest-environment happy-dom
import { bench, describe } from "vitest";
import { createCubes } from "../src/cube.ts";
import { createObservableContext } from "../src/observable.ts";
import { createState } from "../src/state.ts";

function makeState(size: number) {
  const ctx = createObservableContext();
  return createState(ctx, size);
}

// ─── DOM tree construction cost ───────────────────────────────────────────────

describe("createCubes – DOM tree construction", () => {
  // size 3: 26 visible cubies × 6 face divs = 156 elements
  bench("size 3 (26 cubies, 156 divs)", () => {
    createCubes(3, makeState(3));
  });

  // size 5: 98 visible cubies × 6 face divs = 588 elements
  bench("size 5 (98 cubies, 588 divs)", () => {
    createCubes(5, makeState(5));
  });

  // size 7: 218 visible cubies × 6 face divs = 1308 elements
  bench("size 7 (218 cubies, 1308 divs)", () => {
    createCubes(7, makeState(7));
  });
});

// ─── DOM tree construction with pre-built state (isolates DOM cost) ───────────

describe("createCubes – pre-built state (isolates DOM cost only)", () => {
  const state3 = makeState(3);
  const state5 = makeState(5);
  const state7 = makeState(7);

  bench("size 3", () => {
    createCubes(3, state3);
  });

  bench("size 5", () => {
    createCubes(5, state5);
  });

  bench("size 7", () => {
    createCubes(7, state7);
  });
});
