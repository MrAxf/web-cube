import { Face, faceList } from "./utils/faces.ts";
import { Observable, ObservableContext } from "./utils/observable.ts";

export type State = {
    [Face.Up]: Observable<Face>[][];
    [Face.Down]: Observable<Face>[][];
    [Face.Left]: Observable<Face>[][];
    [Face.Right]: Observable<Face>[][];
    [Face.Front]: Observable<Face>[][];
    [Face.Back]: Observable<Face>[][];
};

export type ReadonlyState = {
    [Face.Up]: Face[][];
    [Face.Down]: Face[][];
    [Face.Left]: Face[][];
    [Face.Right]: Face[][];
    [Face.Front]: Face[][];
    [Face.Back]: Face[][];
};

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

export function getCurrentState(state: State): ReadonlyState {
    return {
        [Face.Up]: state[Face.Up].map((row) => row.map((face) => face.value)),
        [Face.Down]: state[Face.Down].map((row) =>
            row.map((face) => face.value)
        ),
        [Face.Left]: state[Face.Left].map((row) =>
            row.map((face) => face.value)
        ),
        [Face.Right]: state[Face.Right].map((row) =>
            row.map((face) => face.value)
        ),
        [Face.Front]: state[Face.Front].map((row) =>
            row.map((face) => face.value)
        ),
        [Face.Back]: state[Face.Back].map((row) =>
            row.map((face) => face.value)
        ),
    };
}

export function setState(state: State, newState: ReadonlyState) {
    faceList.forEach((face) => {
        for (let x = 0; x < newState[Face.Up].length; x++) {
            for (let y = 0; y < newState[Face.Up].length; y++) {
                state[face][x][y].value = newState[face][x][y];
            }
        }
    });
}

function rotateFace90(state: State, oldState: ReadonlyState, face: Face) {
    const size = oldState[Face.Up].length;
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            state[face][x][y].value = oldState[face][size - 1 - y][x];
        }
    }
}

function rotateFaceNegative90(
    state: State,
    oldState: ReadonlyState,
    face: Face,
) {
    const size = oldState[Face.Up].length;
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            state[face][x][y].value = oldState[face][y][size - 1 - x];
        }
    }
}

function rotateFace180(state: State, oldState: ReadonlyState, face: Face) {
    const size = oldState[Face.Up].length;
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            state[face][x][y].value =
                oldState[face][size - 1 - x][size - 1 - y];
        }
    }
}

function rotateXLayer90(state: State, oldState: ReadonlyState, layer: number) {
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        state[Face.Up][layer][i].value = oldState[Face.Front][layer][i];
        state[Face.Front][layer][i].value = oldState[Face.Down][layer][i];
        state[Face.Down][layer][i].value = oldState[Face.Back][layer][i];
        state[Face.Back][layer][i].value = oldState[Face.Up][layer][i];
    }
}

function rotateXLayer90Backwards(
    state: State,
    oldState: ReadonlyState,
    layer: number,
) {
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        state[Face.Up][layer][i].value = oldState[Face.Back][layer][i];
        state[Face.Front][layer][i].value = oldState[Face.Up][layer][i];
        state[Face.Down][layer][i].value = oldState[Face.Front][layer][i];
        state[Face.Back][layer][i].value = oldState[Face.Down][layer][i];
    }
}

function rotateXLayer180(state: State, oldState: ReadonlyState, layer: number) {
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        state[Face.Up][layer][i].value = oldState[Face.Down][layer][i];
        state[Face.Front][layer][i].value = oldState[Face.Back][layer][i];
        state[Face.Down][layer][i].value = oldState[Face.Up][layer][i];
        state[Face.Back][layer][i].value = oldState[Face.Up][layer][i];
    }
}

export function rotateX90(
    state: State,
    layer: number,
): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    rotateXLayer90(state, oldState, layer);
    if (layer === 0) {
        rotateFace90(state, oldState, Face.Left);
    } else if (layer === size - 1) {
        rotateFaceNegative90(state, oldState, Face.Right);
    }
}

export function rotateX90Backwards(
    state: State,
    layer: number,
): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    rotateXLayer90Backwards(state, oldState, layer);
    if (layer === 0) {
        rotateFaceNegative90(state, oldState, Face.Left);
    } else if (layer === size - 1) {
        rotateFace90(state, oldState, Face.Right);
    }
}

export function rotateX180(
    state: State,
    layer: number,
): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    rotateXLayer180(state, oldState, layer);
    if (layer === 0) {
        rotateFace180(state, oldState, Face.Left);
    } else if (layer === size - 1) {
        rotateFace180(state, oldState, Face.Right);
    }
}

export function rotateCubeX90(state: State): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        rotateXLayer90(state, oldState, i);
    }
    rotateFace90(state, oldState, Face.Left);
    rotateFaceNegative90(state, oldState, Face.Right);
}

export function rotateCubeX90Backwards(state: State): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        rotateXLayer90Backwards(state, oldState, i);
    }
    rotateFaceNegative90(state, oldState, Face.Left);
    rotateFace90(state, oldState, Face.Right);
}

export function rotateCubeX180(state: State): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        rotateXLayer180(state, oldState, i);
    }
    rotateFace180(state, oldState, Face.Left);
    rotateFace180(state, oldState, Face.Right);
}

function rotateYLayer90(state: State, oldState: ReadonlyState, layer: number) {
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        state[Face.Front][i][layer].value = oldState[Face.Left][i][layer];
        state[Face.Right][i][layer].value = oldState[Face.Front][i][layer];
        state[Face.Back][(size - 1) - i][(size - 1) - layer].value =
            oldState[Face.Right][i][layer];
        state[Face.Left][i][layer].value =
            oldState[Face.Back][(size - 1) - i][(size - 1) - layer];
    }
}

function rotateYLayer90Backwards(
    state: State,
    oldState: ReadonlyState,
    layer: number,
) {
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        state[Face.Front][i][layer].value = oldState[Face.Right][i][layer];
        state[Face.Right][i][layer].value =
            oldState[Face.Back][(size - 1) - i][(size - 1) - layer];
        state[Face.Back][(size - 1) - i][(size - 1) - layer].value =
            oldState[Face.Left][i][layer];
        state[Face.Left][i][layer].value = oldState[Face.Front][i][layer];
    }
}

function rotateYLayer180(state: State, oldState: ReadonlyState, layer: number) {
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        state[Face.Front][i][layer].value =
            oldState[Face.Back][(size - 1) - i][(size - 1) - layer];
        state[Face.Right][i][layer].value = oldState[Face.Left][i][layer];
        state[Face.Back][(size - 1) - i][(size - 1) - layer].value =
            oldState[Face.Front][i][layer];
        state[Face.Left][i][layer].value = oldState[Face.Right][i][layer];
    }
}

export function rotateY90(
    state: State,
    layer: number,
): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    rotateYLayer90(state, oldState, layer);
    if (layer === 0) {
        rotateFace90(state, oldState, Face.Up);
    } else if (layer === size - 1) {
        rotateFaceNegative90(state, oldState, Face.Down);
    }
}

export function rotateY90Backwards(
    state: State,
    layer: number,
): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    rotateYLayer90Backwards(state, oldState, layer);
    if (layer === 0) {
        rotateFaceNegative90(state, oldState, Face.Up);
    } else if (layer === size - 1) {
        rotateFace90(state, oldState, Face.Down);
    }
}

export function rotateY180(
    state: State,
    layer: number,
): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    rotateYLayer180(state, oldState, layer);
    if (layer === 0) {
        rotateFace180(state, oldState, Face.Up);
    } else if (layer === size - 1) {
        rotateFace180(state, oldState, Face.Down);
    }
}

export function rotateCubeY90(state: State): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        rotateYLayer90(state, oldState, i);
    }
    rotateFace90(state, oldState, Face.Up);
    rotateFaceNegative90(state, oldState, Face.Down);
}

export function rotateCubeY90Backwards(state: State): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        rotateYLayer90Backwards(state, oldState, i);
    }
    rotateFaceNegative90(state, oldState, Face.Up);
    rotateFace90(state, oldState, Face.Down);
}

export function rotateCubeY180(state: State): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        rotateYLayer180(state, oldState, i);
    }
    rotateFace180(state, oldState, Face.Up);
    rotateFace180(state, oldState, Face.Down);
}

function rotateZLayer90(state: State, oldState: ReadonlyState, layer: number) {
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        state[Face.Up][(size - 1) - i][layer].value =
            oldState[Face.Left][layer][i];
        state[Face.Left][layer][i].value =
            oldState[Face.Down][i][(size - 1) - layer];
        state[Face.Down][i][(size - 1) - layer].value =
            oldState[Face.Right][(size - 1) - layer][(size - 1) - i];
        state[Face.Right][(size - 1) - layer][i].value =
            oldState[Face.Up][i][layer];
    }
}

function rotateZLayer90Backwards(
    state: State,
    oldState: ReadonlyState,
    layer: number,
) {
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        state[Face.Up][(size - 1) - i][layer].value =
            oldState[Face.Right][(size - 1) - layer][(size - 1) - i];
        state[Face.Left][layer][i].value =
            oldState[Face.Up][(size - 1) - i][layer];
        state[Face.Down][i][(size - 1) - layer].value =
            oldState[Face.Left][layer][i];
        state[Face.Right][(size - 1) - layer][i].value =
            oldState[Face.Down][(size - 1) - i][(size - 1) - layer];
    }
}

function rotateZLayer180(state: State, oldState: ReadonlyState, layer: number) {
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        state[Face.Up][(size - 1) - i][layer].value =
            oldState[Face.Down][i][(size - 1) - layer];
        state[Face.Left][layer][i].value =
            oldState[Face.Right][(size - 1) - layer][(size - 1) - i];
        state[Face.Down][i][(size - 1) - layer].value =
            oldState[Face.Up][(size - 1) - i][layer];
        state[Face.Right][(size - 1) - layer][(size - 1) - i].value =
            oldState[Face.Left][layer][i];
    }
}

export function rotateZ90(
    state: State,
    layer: number,
): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    rotateZLayer90(state, oldState, layer);
    if (layer === 0) {
        rotateFace90(state, oldState, Face.Back);
    } else if (layer === size - 1) {
        rotateFaceNegative90(state, oldState, Face.Front);
    }
}

export function rotateZ90Backwards(
    state: State,
    layer: number,
): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    rotateZLayer90Backwards(state, oldState, layer);
    if (layer === 0) {
        rotateFaceNegative90(state, oldState, Face.Back);
    } else if (layer === size - 1) {
        rotateFace90(state, oldState, Face.Front);
    }
}

export function rotateZ180(
    state: State,
    layer: number,
): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    rotateZLayer180(state, oldState, layer);
    if (layer === 0) {
        rotateFace180(state, oldState, Face.Back);
    } else if (layer === size - 1) {
        rotateFace180(state, oldState, Face.Front);
    }
}

export function rotateCubeZ90(state: State): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        rotateZLayer90(state, oldState, i);
    }
    rotateFace90(state, oldState, Face.Back);
    rotateFaceNegative90(state, oldState, Face.Front);
}

export function rotateCubeZ90Backwards(state: State): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        rotateZLayer90Backwards(state, oldState, i);
    }
    rotateFaceNegative90(state, oldState, Face.Back);
    rotateFace90(state, oldState, Face.Front);
}

export function rotateCubeZ180(state: State): void {
    const oldState = getCurrentState(state);
    const size = oldState[Face.Up].length;
    for (let i = 0; i < size; i++) {
        rotateZLayer180(state, oldState, i);
    }
    rotateFace180(state, oldState, Face.Back);
    rotateFace180(state, oldState, Face.Front);
}
