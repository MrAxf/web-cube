import { Observable, ObservableContext } from "./observable.ts";
import { Face, faceList } from "./utils.ts";

export interface State {
  [Face.Up]: Observable<Face>[][];
  [Face.Down]: Observable<Face>[][];
  [Face.Left]: Observable<Face>[][];
  [Face.Right]: Observable<Face>[][];
  [Face.Front]: Observable<Face>[][];
  [Face.Back]: Observable<Face>[][];
}

export type StickerRotation = 0 | 90 | 180 | 270;

export interface StickerRotationState {
  [Face.Up]: Observable<StickerRotation>[][];
  [Face.Down]: Observable<StickerRotation>[][];
  [Face.Left]: Observable<StickerRotation>[][];
  [Face.Right]: Observable<StickerRotation>[][];
  [Face.Front]: Observable<StickerRotation>[][];
  [Face.Back]: Observable<StickerRotation>[][];
}

export interface FlatStickerRotations {
  [Face.Up]: StickerRotation[][];
  [Face.Down]: StickerRotation[][];
  [Face.Left]: StickerRotation[][];
  [Face.Right]: StickerRotation[][];
  [Face.Front]: StickerRotation[][];
  [Face.Back]: StickerRotation[][];
}

/**
 * A flat representation of the state of a cube.
 */
export interface FlatState {
  [Face.Up]: Face[][];
  [Face.Down]: Face[][];
  [Face.Left]: Face[][];
  [Face.Right]: Face[][];
  [Face.Front]: Face[][];
  [Face.Back]: Face[][];
  rotations?: FlatStickerRotations;
}

type Axis = "x" | "y" | "z";

interface Vector {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
  z: -1 | 0 | 1;
}

interface FaceBasis {
  right: Vector;
  down: Vector;
}

const FACE_BASIS: Record<Face, FaceBasis> = {
  [Face.Front]: {
    right: { x: 1, y: 0, z: 0 },
    down: { x: 0, y: 1, z: 0 },
  },
  [Face.Back]: {
    right: { x: 1, y: 0, z: 0 },
    down: { x: 0, y: -1, z: 0 },
  },
  [Face.Left]: {
    right: { x: 0, y: 0, z: 1 },
    down: { x: 0, y: 1, z: 0 },
  },
  [Face.Right]: {
    right: { x: 0, y: 0, z: -1 },
    down: { x: 0, y: 1, z: 0 },
  },
  [Face.Up]: {
    right: { x: 1, y: 0, z: 0 },
    down: { x: 0, y: 0, z: 1 },
  },
  [Face.Down]: {
    right: { x: 1, y: 0, z: 0 },
    down: { x: 0, y: 0, z: -1 },
  },
};

function negate(vector: Vector): Vector {
  return {
    x: -vector.x as -1 | 0 | 1,
    y: -vector.y as -1 | 0 | 1,
    z: -vector.z as -1 | 0 | 1,
  };
}

function isSameVector(a: Vector, b: Vector): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

function normalizeAngle(angle: number): StickerRotation {
  return (((angle % 360) + 360) % 360) as StickerRotation;
}

function rotateVector(vector: Vector, axis: Axis, angle: number): Vector {
  const normalizedAngle = normalizeAngle(angle);
  if (normalizedAngle === 0) {
    return vector;
  }
  if (normalizedAngle === 180) {
    if (axis === "x") return { x: vector.x, y: -vector.y as -1 | 0 | 1, z: -vector.z as -1 | 0 | 1 };
    if (axis === "y") return { x: -vector.x as -1 | 0 | 1, y: vector.y, z: -vector.z as -1 | 0 | 1 };
    return { x: -vector.x as -1 | 0 | 1, y: -vector.y as -1 | 0 | 1, z: vector.z };
  }

  const sign = normalizedAngle === 90 ? 1 : -1;
  if (axis === "x") {
    return { x: vector.x, y: -sign * vector.z as -1 | 0 | 1, z: sign * vector.y as -1 | 0 | 1 };
  }
  if (axis === "y") {
    return { x: sign * vector.z as -1 | 0 | 1, y: vector.y, z: -sign * vector.x as -1 | 0 | 1 };
  }
  return { x: -sign * vector.y as -1 | 0 | 1, y: sign * vector.x as -1 | 0 | 1, z: vector.z };
}

function getStickerTopVector(face: Face, rotation: StickerRotation): Vector {
  const { right, down } = FACE_BASIS[face];
  if (rotation === 0) return negate(down);
  if (rotation === 90) return right;
  if (rotation === 180) return down;
  return negate(right);
}

export function transformStickerRotation(
  sourceFace: Face,
  targetFace: Face,
  rotation: StickerRotation,
  axis: Axis,
  angle: number,
): StickerRotation {
  const transformedTop = rotateVector(
    getStickerTopVector(sourceFace, rotation),
    axis,
    angle,
  );
  const { right, down } = FACE_BASIS[targetFace];

  if (isSameVector(transformedTop, negate(down))) return 0;
  if (isSameVector(transformedTop, right)) return 90;
  if (isSameVector(transformedTop, down)) return 180;
  if (isSameVector(transformedTop, negate(right))) return 270;

  throw new Error("Invalid sticker rotation transform");
}

function createFaces(ctx: ObservableContext, size: number, face: Face) {
  const faces: Observable<Face>[][] = [];
  const { observableOf } = ctx;

  for (let x = 0; x < size; x++) {
    faces[x] = [];
    for (let y = 0; y < size; y++) {
      faces[x][y] = observableOf(face);
    }
  }
  return faces;
}

function createRotationFaces(ctx: ObservableContext, size: number) {
  const rotations: Observable<StickerRotation>[][] = [];
  const { observableOf } = ctx;

  for (let x = 0; x < size; x++) {
    rotations[x] = [];
    for (let y = 0; y < size; y++) {
      rotations[x][y] = observableOf(0);
    }
  }
  return rotations;
}

export function createState(ctx: ObservableContext, size: number): State {
  return {
    [Face.Up]: createFaces(ctx, size, Face.Up),
    [Face.Down]: createFaces(ctx, size, Face.Down),
    [Face.Left]: createFaces(ctx, size, Face.Left),
    [Face.Right]: createFaces(ctx, size, Face.Right),
    [Face.Front]: createFaces(ctx, size, Face.Front),
    [Face.Back]: createFaces(ctx, size, Face.Back),
  };
}

export function createStickerRotationState(
  ctx: ObservableContext,
  size: number,
): StickerRotationState {
  return {
    [Face.Up]: createRotationFaces(ctx, size),
    [Face.Down]: createRotationFaces(ctx, size),
    [Face.Left]: createRotationFaces(ctx, size),
    [Face.Right]: createRotationFaces(ctx, size),
    [Face.Front]: createRotationFaces(ctx, size),
    [Face.Back]: createRotationFaces(ctx, size),
  };
}

export function getCurrentStickerRotations(
  rotationState: StickerRotationState,
): FlatStickerRotations {
  return {
    [Face.Up]: rotationState[Face.Up].map((row) => row.map((rotation) => rotation.value)),
    [Face.Down]: rotationState[Face.Down].map((row) => row.map((rotation) => rotation.value)),
    [Face.Left]: rotationState[Face.Left].map((row) => row.map((rotation) => rotation.value)),
    [Face.Right]: rotationState[Face.Right].map((row) => row.map((rotation) => rotation.value)),
    [Face.Front]: rotationState[Face.Front].map((row) => row.map((rotation) => rotation.value)),
    [Face.Back]: rotationState[Face.Back].map((row) => row.map((rotation) => rotation.value)),
  };
}

export function getCurrentState(
  state: State,
  rotationState?: StickerRotationState,
): FlatState {
  const currentState: FlatState = {
    [Face.Up]: state[Face.Up].map((row) => row.map((face) => face.value)),
    [Face.Down]: state[Face.Down].map((row) => row.map((face) => face.value)),
    [Face.Left]: state[Face.Left].map((row) => row.map((face) => face.value)),
    [Face.Right]: state[Face.Right].map((row) => row.map((face) => face.value)),
    [Face.Front]: state[Face.Front].map((row) => row.map((face) => face.value)),
    [Face.Back]: state[Face.Back].map((row) => row.map((face) => face.value)),
  };
  if (rotationState) {
    currentState.rotations = getCurrentStickerRotations(rotationState);
  }
  return currentState;
}

export function setStickerRotations(
  rotationState: StickerRotationState,
  newRotations: FlatStickerRotations,
) {
  faceList.forEach((face) => {
    for (let x = 0; x < newRotations[Face.Up].length; x++) {
      for (let y = 0; y < newRotations[Face.Up].length; y++) {
        rotationState[face][x][y].value = newRotations[face][x][y];
      }
    }
  });
}

export function resetStickerRotations(rotationState: StickerRotationState) {
  faceList.forEach((face) => {
    for (let x = 0; x < rotationState[Face.Up].length; x++) {
      for (let y = 0; y < rotationState[Face.Up].length; y++) {
        rotationState[face][x][y].value = 0;
      }
    }
  });
}

export function setState(
  state: State,
  newState: FlatState,
  rotationState?: StickerRotationState,
) {
  faceList.forEach((face) => {
    for (let x = 0; x < newState[Face.Up].length; x++) {
      for (let y = 0; y < newState[Face.Up].length; y++) {
        state[face][x][y].value = newState[face][x][y];
      }
    }
  });
  if (!rotationState) return;
  if (newState.rotations) {
    setStickerRotations(rotationState, newState.rotations);
  } else {
    resetStickerRotations(rotationState);
  }
}

function setRotatedSticker(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  targetFace: Face,
  targetX: number,
  targetY: number,
  sourceFace: Face,
  sourceX: number,
  sourceY: number,
  axis: Axis,
  angle: number,
) {
  state[targetFace][targetX][targetY].value = oldState[sourceFace][sourceX][sourceY];
  rotationState[targetFace][targetX][targetY].value = transformStickerRotation(
    sourceFace,
    targetFace,
    oldRotations[sourceFace][sourceX][sourceY],
    axis,
    angle,
  );
}

function rotateFace90(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  face: Face,
  axis: Axis,
  angle: number,
) {
  const size = oldState[Face.Up].length;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      setRotatedSticker(
        state,
        rotationState,
        oldState,
        oldRotations,
        face,
        x,
        y,
        face,
        size - 1 - y,
        x,
        axis,
        angle,
      );
    }
  }
}

function rotateFaceNegative90(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  face: Face,
  axis: Axis,
  angle: number,
) {
  const size = oldState[Face.Up].length;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      setRotatedSticker(
        state,
        rotationState,
        oldState,
        oldRotations,
        face,
        x,
        y,
        face,
        y,
        size - 1 - x,
        axis,
        angle,
      );
    }
  }
}

function rotateFace180(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  face: Face,
  axis: Axis,
  angle: number,
) {
  const size = oldState[Face.Up].length;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      setRotatedSticker(
        state,
        rotationState,
        oldState,
        oldRotations,
        face,
        x,
        y,
        face,
        size - 1 - x,
        size - 1 - y,
        axis,
        angle,
      );
    }
  }
}

function rotateXLayer90(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  layer: number,
) {
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Up, layer, i, Face.Front, layer, i, "x", 90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Front, layer, i, Face.Down, layer, i, "x", 90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Down, layer, i, Face.Back, layer, i, "x", 90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Back, layer, i, Face.Up, layer, i, "x", 90);
  }
}

function rotateXLayer90Backwards(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  layer: number,
) {
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Up, layer, i, Face.Back, layer, i, "x", -90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Front, layer, i, Face.Up, layer, i, "x", -90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Down, layer, i, Face.Front, layer, i, "x", -90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Back, layer, i, Face.Down, layer, i, "x", -90);
  }
}

function rotateXLayer180(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  layer: number,
) {
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Up, layer, i, Face.Down, layer, i, "x", 180);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Front, layer, i, Face.Back, layer, i, "x", 180);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Down, layer, i, Face.Up, layer, i, "x", 180);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Back, layer, i, Face.Front, layer, i, "x", 180);
  }
}

export function rotateX90(
  state: State,
  rotationState: StickerRotationState,
  layer: number,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  rotateXLayer90(state, rotationState, oldState, oldRotations, layer);
  if (layer === 0) {
    rotateFace90(state, rotationState, oldState, oldRotations, Face.Left, "x", 90);
  } else if (layer === size - 1) {
    rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Right, "x", 90);
  }
}

export function rotateX90Backwards(
  state: State,
  rotationState: StickerRotationState,
  layer: number,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  rotateXLayer90Backwards(state, rotationState, oldState, oldRotations, layer);
  if (layer === 0) {
    rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Left, "x", -90);
  } else if (layer === size - 1) {
    rotateFace90(state, rotationState, oldState, oldRotations, Face.Right, "x", -90);
  }
}

export function rotateX180(
  state: State,
  rotationState: StickerRotationState,
  layer: number,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  rotateXLayer180(state, rotationState, oldState, oldRotations, layer);
  if (layer === 0) {
    rotateFace180(state, rotationState, oldState, oldRotations, Face.Left, "x", 180);
  } else if (layer === size - 1) {
    rotateFace180(state, rotationState, oldState, oldRotations, Face.Right, "x", 180);
  }
}

export function rotateCubeX90(
  state: State,
  rotationState: StickerRotationState,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    rotateXLayer90(state, rotationState, oldState, oldRotations, i);
  }
  rotateFace90(state, rotationState, oldState, oldRotations, Face.Left, "x", 90);
  rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Right, "x", 90);
}

export function rotateCubeX90Backwards(
  state: State,
  rotationState: StickerRotationState,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    rotateXLayer90Backwards(state, rotationState, oldState, oldRotations, i);
  }
  rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Left, "x", -90);
  rotateFace90(state, rotationState, oldState, oldRotations, Face.Right, "x", -90);
}

export function rotateCubeX180(
  state: State,
  rotationState: StickerRotationState,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    rotateXLayer180(state, rotationState, oldState, oldRotations, i);
  }
  rotateFace180(state, rotationState, oldState, oldRotations, Face.Left, "x", 180);
  rotateFace180(state, rotationState, oldState, oldRotations, Face.Right, "x", 180);
}

function rotateYLayer90(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  layer: number,
) {
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Front, i, layer, Face.Left, i, layer, "y", 90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Right, i, layer, Face.Front, i, layer, "y", 90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Back, size - 1 - i, size - 1 - layer, Face.Right, i, layer, "y", 90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Left, i, layer, Face.Back, size - 1 - i, size - 1 - layer, "y", 90);
  }
}

function rotateYLayer90Backwards(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  layer: number,
) {
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Front, i, layer, Face.Right, i, layer, "y", -90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Right, i, layer, Face.Back, size - 1 - i, size - 1 - layer, "y", -90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Back, size - 1 - i, size - 1 - layer, Face.Left, i, layer, "y", -90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Left, i, layer, Face.Front, i, layer, "y", -90);
  }
}

function rotateYLayer180(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  layer: number,
) {
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Front, i, layer, Face.Back, size - 1 - i, size - 1 - layer, "y", 180);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Right, i, layer, Face.Left, i, layer, "y", 180);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Back, size - 1 - i, size - 1 - layer, Face.Front, i, layer, "y", 180);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Left, i, layer, Face.Right, i, layer, "y", 180);
  }
}

export function rotateY90(
  state: State,
  rotationState: StickerRotationState,
  layer: number,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  rotateYLayer90(state, rotationState, oldState, oldRotations, layer);
  if (layer === 0) {
    rotateFace90(state, rotationState, oldState, oldRotations, Face.Up, "y", 90);
  } else if (layer === size - 1) {
    rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Down, "y", 90);
  }
}

export function rotateY90Backwards(
  state: State,
  rotationState: StickerRotationState,
  layer: number,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  rotateYLayer90Backwards(state, rotationState, oldState, oldRotations, layer);
  if (layer === 0) {
    rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Up, "y", -90);
  } else if (layer === size - 1) {
    rotateFace90(state, rotationState, oldState, oldRotations, Face.Down, "y", -90);
  }
}

export function rotateY180(
  state: State,
  rotationState: StickerRotationState,
  layer: number,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  rotateYLayer180(state, rotationState, oldState, oldRotations, layer);
  if (layer === 0) {
    rotateFace180(state, rotationState, oldState, oldRotations, Face.Up, "y", 180);
  } else if (layer === size - 1) {
    rotateFace180(state, rotationState, oldState, oldRotations, Face.Down, "y", 180);
  }
}

export function rotateCubeY90(
  state: State,
  rotationState: StickerRotationState,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    rotateYLayer90(state, rotationState, oldState, oldRotations, i);
  }
  rotateFace90(state, rotationState, oldState, oldRotations, Face.Up, "y", 90);
  rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Down, "y", 90);
}

export function rotateCubeY90Backwards(
  state: State,
  rotationState: StickerRotationState,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    rotateYLayer90Backwards(state, rotationState, oldState, oldRotations, i);
  }
  rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Up, "y", -90);
  rotateFace90(state, rotationState, oldState, oldRotations, Face.Down, "y", -90);
}

export function rotateCubeY180(
  state: State,
  rotationState: StickerRotationState,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    rotateYLayer180(state, rotationState, oldState, oldRotations, i);
  }
  rotateFace180(state, rotationState, oldState, oldRotations, Face.Up, "y", 180);
  rotateFace180(state, rotationState, oldState, oldRotations, Face.Down, "y", 180);
}

function rotateZLayer90(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  layer: number,
) {
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Up, size - 1 - i, layer, Face.Left, layer, i, "z", 90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Left, layer, i, Face.Down, i, size - 1 - layer, "z", 90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Down, i, size - 1 - layer, Face.Right, size - 1 - layer, size - 1 - i, "z", 90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Right, size - 1 - layer, i, Face.Up, i, layer, "z", 90);
  }
}

function rotateZLayer90Backwards(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  layer: number,
) {
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Up, size - 1 - i, layer, Face.Right, size - 1 - layer, size - 1 - i, "z", -90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Left, layer, i, Face.Up, size - 1 - i, layer, "z", -90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Down, i, size - 1 - layer, Face.Left, layer, i, "z", -90);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Right, size - 1 - layer, i, Face.Down, size - 1 - i, size - 1 - layer, "z", -90);
  }
}

function rotateZLayer180(
  state: State,
  rotationState: StickerRotationState,
  oldState: FlatState,
  oldRotations: FlatStickerRotations,
  layer: number,
) {
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Up, size - 1 - i, layer, Face.Down, i, size - 1 - layer, "z", 180);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Left, layer, i, Face.Right, size - 1 - layer, size - 1 - i, "z", 180);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Down, i, size - 1 - layer, Face.Up, size - 1 - i, layer, "z", 180);
    setRotatedSticker(state, rotationState, oldState, oldRotations, Face.Right, size - 1 - layer, size - 1 - i, Face.Left, layer, i, "z", 180);
  }
}

export function rotateZ90(
  state: State,
  rotationState: StickerRotationState,
  layer: number,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  rotateZLayer90(state, rotationState, oldState, oldRotations, layer);
  if (layer === 0) {
    rotateFace90(state, rotationState, oldState, oldRotations, Face.Back, "z", 90);
  } else if (layer === size - 1) {
    rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Front, "z", 90);
  }
}

export function rotateZ90Backwards(
  state: State,
  rotationState: StickerRotationState,
  layer: number,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  rotateZLayer90Backwards(state, rotationState, oldState, oldRotations, layer);
  if (layer === 0) {
    rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Back, "z", -90);
  } else if (layer === size - 1) {
    rotateFace90(state, rotationState, oldState, oldRotations, Face.Front, "z", -90);
  }
}

export function rotateZ180(
  state: State,
  rotationState: StickerRotationState,
  layer: number,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  rotateZLayer180(state, rotationState, oldState, oldRotations, layer);
  if (layer === 0) {
    rotateFace180(state, rotationState, oldState, oldRotations, Face.Back, "z", 180);
  } else if (layer === size - 1) {
    rotateFace180(state, rotationState, oldState, oldRotations, Face.Front, "z", 180);
  }
}

export function rotateCubeZ90(
  state: State,
  rotationState: StickerRotationState,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    rotateZLayer90(state, rotationState, oldState, oldRotations, i);
  }
  rotateFace90(state, rotationState, oldState, oldRotations, Face.Back, "z", 90);
  rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Front, "z", 90);
}

export function rotateCubeZ90Backwards(
  state: State,
  rotationState: StickerRotationState,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    rotateZLayer90Backwards(state, rotationState, oldState, oldRotations, i);
  }
  rotateFaceNegative90(state, rotationState, oldState, oldRotations, Face.Back, "z", -90);
  rotateFace90(state, rotationState, oldState, oldRotations, Face.Front, "z", -90);
}

export function rotateCubeZ180(
  state: State,
  rotationState: StickerRotationState,
): void {
  const oldState = getCurrentState(state);
  const oldRotations = getCurrentStickerRotations(rotationState);
  const size = oldState[Face.Up].length;
  for (let i = 0; i < size; i++) {
    rotateZLayer180(state, rotationState, oldState, oldRotations, i);
  }
  rotateFace180(state, rotationState, oldState, oldRotations, Face.Back, "z", 180);
  rotateFace180(state, rotationState, oldState, oldRotations, Face.Front, "z", 180);
}
