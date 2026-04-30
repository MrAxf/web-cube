import { describe, expect, it } from "vitest";
import { createObservableContext } from "./observable.ts";
import {
  createState,
  getCurrentStickerRotations,
  createStickerRotationState,
  FlatStickerRotations,
  getCurrentState,
  rotateCubeX90,
  rotateCubeY90,
  rotateCubeZ90,
  rotateX90,
  rotateX90Backwards,
  rotateY90,
  rotateY90Backwards,
  rotateZ90,
  rotateZ90Backwards,
  setState,
  StickerRotation,
  StickerRotationState,
} from "./state.ts";
import { createBaseState, Face, faceList } from "./utils.ts";

function createCubeState(size = 3) {
  const ctx = createObservableContext();
  const state = createState(ctx, size);
  const rotationState = createStickerRotationState(ctx, size);
  ctx.tick();
  return { ctx, state, rotationState };
}

function createFlatRotations(size: number, rotation: StickerRotation): FlatStickerRotations {
  const createFaceRotations = () =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => rotation),
    );

  return {
    [Face.Up]: createFaceRotations(),
    [Face.Down]: createFaceRotations(),
    [Face.Left]: createFaceRotations(),
    [Face.Right]: createFaceRotations(),
    [Face.Front]: createFaceRotations(),
    [Face.Back]: createFaceRotations(),
  };
}

function getRotations(rotationState: StickerRotationState): FlatStickerRotations {
  return getCurrentStickerRotations(rotationState);
}

function expectAllRotationsToBe(
  rotations: FlatStickerRotations,
  expectedRotation: StickerRotation,
) {
  faceList.forEach((face) => {
    rotations[face].forEach((row) => {
      row.forEach((rotation) => {
        expect(rotation).toBe(expectedRotation);
      });
    });
  });
}

describe("sticker rotations", () => {
  it("starts every sticker with zero rotation", () => {
    const { rotationState } = createCubeState();

    expectAllRotationsToBe(getRotations(rotationState), 0);
  });

  it.each([
    ["x", rotateCubeX90],
    ["y", rotateCubeY90],
    ["z", rotateCubeZ90],
  ] as const)("returns cube rotations around %s to identity after four turns", (_axis, rotateCube) => {
    const { state, rotationState } = createCubeState();
    const initialState = getCurrentState(state, rotationState);

    for (let turn = 0; turn < 4; turn += 1) {
      rotateCube(state, rotationState);
    }

    expect(getCurrentState(state, rotationState)).toEqual(initialState);
  });

  it.each([
    ["x", rotateX90, rotateX90Backwards],
    ["y", rotateY90, rotateY90Backwards],
    ["z", rotateZ90, rotateZ90Backwards],
  ] as const)("returns layer rotations around %s to identity with the inverse move", (_axis, rotateForward, rotateBackwards) => {
    const { state, rotationState } = createCubeState();
    const initialState = getCurrentState(state, rotationState);

    rotateForward(state, rotationState, 0);
    rotateBackwards(state, rotationState, 0);

    expect(getCurrentState(state, rotationState)).toEqual(initialState);
  });

  it("preserves rotations through setState round trips", () => {
    const { state, rotationState } = createCubeState();
    rotateZ90(state, rotationState, 2);
    const movedState = getCurrentState(state, rotationState);

    const next = createCubeState();
    setState(next.state, movedState, next.rotationState);

    expect(getCurrentState(next.state, next.rotationState)).toEqual(movedState);
  });

  it("resets rotations when setting a color-only state", () => {
    const { state, rotationState } = createCubeState();
    setState(state, {
      ...createBaseState(3),
      rotations: createFlatRotations(3, 90),
    }, rotationState);

    setState(state, createBaseState(3), rotationState);

    expectAllRotationsToBe(getCurrentState(state, rotationState).rotations!, 0);
  });
});
