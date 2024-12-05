import { FlatState } from "./state";
import { WebCube } from "./web-cube";

/**
 * Enum for the faces of a cube.
 */
export enum Face {
    Front,
    Back,
    Left,
    Right,
    Up,
    Down,
}

/**
 * A list of all the faces of a cube.
 */
export const faceList = [
    Face.Up,
    Face.Down,
    Face.Left,
    Face.Right,
    Face.Front,
    Face.Back,
];

/**
 * Create a base face state of the given size.
 * @param size The size of the face.
 * @param face The face to fill the state.
 * @returns
 */
export function createBaseFaceState(size: number, face: Face): Face[][] {
    return Array.from(
        { length: size },
        () => Array.from({ length: size }, () => face),
    );
}

/**
 * Create a base state for a cube of the given size.
 * @param size The size of the cube.
 * @returns The base state.
 */
export function createBaseState(size: number): FlatState {
    if (size < 1) {
        throw new Error("Size must be at least 1");
    }
    return {
        [Face.Front]: createBaseFaceState(size, Face.Front),
        [Face.Back]: createBaseFaceState(size, Face.Back),
        [Face.Left]: createBaseFaceState(size, Face.Left),
        [Face.Right]: createBaseFaceState(size, Face.Right),
        [Face.Up]: createBaseFaceState(size, Face.Up),
        [Face.Down]: createBaseFaceState(size, Face.Down),
    };
}

/**
 * Check if the state is solved.
 * @param state The state to check.
 * @returns Whether the state is solved.
 */
export function isStateSolved(state: FlatState): boolean {
    return faceList.every((face) => {
        const faceState = state[face];
        const firstFace = faceState[0][0];
        return faceState.every((row) =>
            row.every((cell) => cell === firstFace)
        );
    });
}

/**
 * Compare two states.
 * @param state1 The first state.
 * @param state2 The second state.
 * @returns Whether the states are equal.
 */
export function compareStates(state1: FlatState, state2: FlatState): boolean {
    return faceList.every((face) => {
        const faceState1 = state1[face];
        const faceState2 = state2[face];
        return faceState1.every((row, i) =>
            row.every((cell, j) => cell === faceState2[i][j])
        );
    });
}

/**
 * Rotate a layer of the cube.
 * @param $cube The cube to rotate.
 * @param options The options for the rotation.
 * @param options.axis The axis to rotate the cube. Must be "x", "y", or "z".
 * @param options.angle The angle to rotate the cube. Must be 90, 180, 270, or 360.
 * @param options.backwards Whether to rotate the cube backwards. Defaults to false.
 * @param options.speed The speed of the rotation in milliseconds. Defaults to the instance speed.
 * @returns A Promise that resolves when the rotation is complete.
 */
export function rotateCube($cube: WebCube, options: {
    axis: "x" | "y" | "z";
    angle: 90 | 180 | 270 | 360;
    backwards?: boolean;
    speed?: number;
}): Promise<void> {
    return $cube.rotateCube({
        axis: options.axis,
        angle: options.angle,
        backwards: options.backwards,
        speed: options.speed,
    });
}

/**
 * Rotates a layer of the cube.
 * @param $cube The cube to rotate.
 * @param options The parameters Object for the rotation.
 * @param options.axis The axis of the layer to rotate. Must be "x", "y", or "z".
 * @param options.layer The index of the layer to rotate. Must be between 0 and the size of the cube.
 * @param options.angle The angle to rotate the layer. Must be 90, 180, 270, or 360.
 * @param options.backwards Whether to rotate the layer backwards. Defaults to false.
 * @param options.speed The speed of the rotation in milliseconds. Defaults to the instance speed.
 * @returns A Promise that resolves when the rotation is complete.
 */
export function rotateLayer($cube: WebCube, options: {
    axis: "x" | "y" | "z";
    layer: number;
    angle: 90 | 180 | 270 | 360;
    backwards?: boolean;
    speed?: number;
}): Promise<void> {
    return $cube.rotateLayer({
        axis: options.axis,
        layer: options.layer,
        angle: options.angle,
        backwards: options.backwards,
        speed: options.speed,
    });
}

/**
 * Perform a random rotation on the cube.
 * @param $cube The cube to rotate.
 * @param options The parameters Object for the rotation.
 * @param options.axis The axis of the layer to rotate. Must be "x", "y", or "z". Overwrites the random axis.
 * @param options.angle The angle to rotate the layer. Must be 90, 180, 270, or 360. Overwrites the random angle.
 * @param options.backwards Whether to rotate the layer backwards. Defaults to false. Overwrites the random direction.
 * @param options.speed The speed of the rotation in milliseconds. Defaults to the instance speed.
 * @returns A Promise that resolves when the rotation is complete.
 */
export function rotateCubeRandomly(
    $cube: WebCube,
    options?: Partial<{
        axis: "x" | "y" | "z";
        angle: 90 | 180 | 270 | 360;
        backwards?: boolean;
        speed?: number;
    }>,
): Promise<void> {
    const axis = options?.axis ??
        ["x", "y", "z"][Math.floor(Math.random() * 3)] as
            | "x"
            | "y"
            | "z";
    const angle = options?.angle ??
        [90, 180, 270, 360][Math.floor(Math.random() * 4)] as
            | 90
            | 180
            | 270
            | 360;
    const backwards = options?.backwards ?? Math.random() < 0.5;
    return rotateCube($cube, { axis, angle, backwards, speed: options?.speed });
}

/**
 * Perform a random rotation on the cube.
 * @param $cube The cube to rotate.
 * @param options The parameters Object for the rotation.
 * @param options.axis The axis of the layer to rotate. Must be "x", "y", or "z". Overwrites the random axis.
 * @param options.layer The index of the layer to rotate. Must be between 0 and the size of the cube. Overwrites the random layer.
 * @param options.angle The angle to rotate the layer. Must be 90, 180, 270, or 360.
 * @param options.backwards Whether to rotate the layer backwards. Defaults to false.
 * @param options.speed The speed of the rotation in milliseconds. Defaults to the instance speed.
 * @returns A Promise that resolves when the rotation is complete.
 */
export function rotateLayerRandomly(
    $cube: WebCube,
    options?: Partial<{
        axis: "x" | "y" | "z";
        layer: number;
        angle: 90 | 180 | 270 | 360;
        backwards?: boolean;
        speed?: number;
    }>,
): Promise<void> {
    const axis = options?.axis ??
        ["x", "y", "z"][Math.floor(Math.random() * 3)] as
            | "x"
            | "y"
            | "z";
    const layer = options?.layer ?? Math.floor(Math.random() * $cube.size);
    const angle = options?.angle ??
        [90, 180, 270, 360][Math.floor(Math.random() * 4)] as
            | 90
            | 180
            | 270
            | 360;
    const backwards = options?.backwards ?? Math.random() < 0.5;

    console.log({ axis, layer, angle, backwards });

    return rotateLayer($cube, {
        axis,
        layer,
        angle,
        backwards,
        speed: options?.speed,
    });
}
