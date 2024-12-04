import { FlatState } from "./state";

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

function _createFaceState(size: number, face: Face): Face[][] {
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
        [Face.Front]: _createFaceState(size, Face.Front),
        [Face.Back]: _createFaceState(size, Face.Back),
        [Face.Left]: _createFaceState(size, Face.Left),
        [Face.Right]: _createFaceState(size, Face.Right),
        [Face.Up]: _createFaceState(size, Face.Up),
        [Face.Down]: _createFaceState(size, Face.Down),
    };
}
