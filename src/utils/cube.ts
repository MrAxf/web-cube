import { State } from "../state";
import { Face } from "./faces";

const colors = {
    [Face.Front]: "var(--color-front)",
    [Face.Back]: "var(--color-back)",
    [Face.Left]: "var(--color-left)",
    [Face.Right]: "var(--color-right)",
    [Face.Up]: "var(--color-up)",
    [Face.Down]: "var(--color-down)",
};

function createFace(
    x: number,
    y: number,
    state: State,
    face: Face,
    isFace: boolean,
) {
    const $face = document.createElement("div");
    $face.classList.add("face");
    $face.dataset.face = face.toString();
    if (isFace) {
        $face.dataset.isFace = "";
        $face.classList.add("sticker");
        state[face][x][y].subscribe((face) => {
            $face.style.setProperty("--sticker-color", colors[face]);
        });
    }
    return $face;
}

function createCube(
    x: number,
    y: number,
    z: number,
    size: number,
    state: State,
) {
    const $cube = document.createElement("div");
    $cube.classList.add("cube");
    $cube.dataset.x = x.toString();
    $cube.dataset.y = y.toString();
    $cube.dataset.z = z.toString();
    $cube.style.setProperty("--rotate-cube-x", '0deg');
    $cube.style.setProperty("--rotate-cube-y", '0deg');
    $cube.style.setProperty("--rotate-cube-z", '0deg');
    $cube.style.transform =
        `rotateX(var(--rotate-cube-x)) rotateY(var(--rotate-cube-y)) rotateZ(var(--rotate-cube-z)) translateX(calc(var(--cube-start) + (var(--block-size) * ${x}))) translateY(calc(var(--cube-start) + (var(--block-size) * ${y}))) translateZ(calc(var(--cube-start) + (var(--block-size) * ${z})))`;

    const reversedSize = size - 1;

    const $faceFront = createFace(x, y, state, Face.Front, z === size - 1);
    const $faceRight = createFace(
        reversedSize - z,
        y,
        state,
        Face.Right,
        x === size - 1,
    );
    const faceBack = createFace(x, reversedSize - y, state, Face.Back, z === 0);
    const $faceLeft = createFace(z, y, state, Face.Left, x === 0);
    const $faceUp = createFace(x, z, state, Face.Up, y === 0);
    const $faceDown = createFace(
        x,
        reversedSize - z,
        state,
        Face.Down,
        y === size - 1,
    );

    $cube.append(
        $faceFront,
        $faceRight,
        faceBack,
        $faceLeft,
        $faceUp,
        $faceDown,
    );

    return $cube;
}

export function createCubes(size: number, state: State): [HTMLDivElement[], Record<'x' | 'y' | 'z', HTMLDivElement[][]>] {
    const cubes: HTMLDivElement[] = [];
    const cubeGroups = {
        x: Array.from({ length: size }, () => [] as HTMLDivElement[]),
        y: Array.from({ length: size }, () => [] as HTMLDivElement[]),
        z: Array.from({ length: size }, () => [] as HTMLDivElement[]),
    }

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                if (
                    !(
                        x === 0 ||
                        x === size - 1 ||
                        y === 0 ||
                        y === size - 1 ||
                        z === 0 ||
                        z === size - 1
                    )
                ) {
                    continue;
                }
                const $cube = createCube(x, y, z, size, state);
                cubeGroups.x[x].push($cube);
                cubeGroups.y[y].push($cube);
                cubeGroups.z[z].push($cube);
                cubes.push($cube);
            }
        }
    }

    return [cubes, cubeGroups];
}
