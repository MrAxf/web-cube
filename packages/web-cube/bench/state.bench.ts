import { bench, describe } from "vitest";
import { createObservableContext } from "../src/observable.ts";
import {
  createState,
  getCurrentState,
  setState,
} from "../src/state.ts";
import {
  rotateCubeX90,
  rotateX90,
  rotateY90,
  rotateZ90,
} from "../src/state.ts";
import { createBaseState } from "../src/utils.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeState(size: number) {
  const ctx = createObservableContext();
  return { ctx, state: createState(ctx, size) };
}

// ─── getCurrentState snapshot ─────────────────────────────────────────────────

describe("getCurrentState – snapshot cost", () => {
  const s3 = makeState(3);
  const s5 = makeState(5);
  const s7 = makeState(7);

  bench("size 3", () => {
    getCurrentState(s3.state);
  });

  bench("size 5", () => {
    getCurrentState(s5.state);
  });

  bench("size 7", () => {
    getCurrentState(s7.state);
  });
});

// ─── setState ─────────────────────────────────────────────────────────────────

describe("setState – full write", () => {
  const base3 = createBaseState(3);
  const base5 = createBaseState(5);
  const base7 = createBaseState(7);

  bench("size 3", () => {
    const { state } = makeState(3);
    setState(state, base3);
  });

  bench("size 5", () => {
    const { state } = makeState(5);
    setState(state, base5);
  });

  bench("size 7", () => {
    const { state } = makeState(7);
    setState(state, base7);
  });
});

// ─── Layer rotations ──────────────────────────────────────────────────────────

describe("rotateX90 – layer 0", () => {
  bench("size 3", () => {
    const { state } = makeState(3);
    rotateX90(state, 0);
  });

  bench("size 5", () => {
    const { state } = makeState(5);
    rotateX90(state, 0);
  });
});

describe("rotateY90 – layer 0", () => {
  bench("size 3", () => {
    const { state } = makeState(3);
    rotateY90(state, 0);
  });

  bench("size 5", () => {
    const { state } = makeState(5);
    rotateY90(state, 0);
  });
});

describe("rotateZ90 – layer 0", () => {
  bench("size 3", () => {
    const { state } = makeState(3);
    rotateZ90(state, 0);
  });

  bench("size 5", () => {
    const { state } = makeState(5);
    rotateZ90(state, 0);
  });
});

// ─── Full cube rotation (worst case: all layers + 2 faces) ───────────────────

describe("rotateCubeX90 – all layers", () => {
  bench("size 3", () => {
    const { state } = makeState(3);
    rotateCubeX90(state);
  });

  bench("size 5", () => {
    const { state } = makeState(5);
    rotateCubeX90(state);
  });

  bench("size 7", () => {
    const { state } = makeState(7);
    rotateCubeX90(state);
  });
});
