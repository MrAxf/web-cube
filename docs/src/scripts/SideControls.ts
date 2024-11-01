import type { WebCube } from "web-cube/web-cube";

const $webCube = document.querySelector("web-cube") as WebCube;

// $webCube.setState({
//   [Face.Up]: [[Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down], [Face.Down, Face.Left, Face.Up]],
//   [Face.Front]: [[Face.Left, Face.Up, Face.Down], [Face.Down, Face.Left, Face.Up], [Face.Down, Face.Down, Face.Left]],
//   [Face.Down]: [[Face.Down, Face.Left, Face.Up], [Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down]],
//   [Face.Back]: [[Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down], [Face.Down, Face.Left, Face.Up]],
//   [Face.Left]: [[Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down], [Face.Down, Face.Left, Face.Up]],
//   [Face.Right]: [[Face.Down, Face.Left, Face.Up], [Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down]],
// })

const $controls = document.getElementById("controls") as HTMLDivElement;
const $$layerBtns: NodeListOf<HTMLButtonElement> = $controls.querySelectorAll(
    "button[data-layer-btn]",
);

function layerButtonClickHandler(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const axis = target.dataset.axis! as "x" | "y" | "z";
    const layer = parseInt(target.dataset.layer!);
    const angle = parseInt(target.dataset.angle!);

    $webCube.rotateLayer({
        axis,
        layer,
        angle: Math.abs(angle) as any,
        backwards: angle < 0,
    });
}

$$layerBtns.forEach(($btn) => {
    $btn.addEventListener("click", layerButtonClickHandler);
});

const $$cubeBtns: NodeListOf<HTMLButtonElement> = $controls.querySelectorAll(
    "button[data-cube-btn]",
);

function cubeButtonClickHandler(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const axis = target.dataset.axis! as "x" | "y" | "z";
    const angle = parseInt(target.dataset.angle!);
    $webCube.rotateCube({
        axis,
        angle: Math.abs(angle) as any,
        backwards: angle < 0,
    });
}

$$cubeBtns.forEach(($btn) => {
    $btn.addEventListener("click", cubeButtonClickHandler);
});

const $$cubeAnglesRanges: NodeListOf<HTMLInputElement> = $controls
    .querySelectorAll("input[type=range]");

function cubeAngleRangeChangeHandler(e: Event) {
    const target = e.target as HTMLInputElement;
    const axis = target.dataset.axis! as "x" | "y" | "z";
    const angle = parseInt(target.value);
    $webCube.setCssVariable(`--cube-rotation-${axis}`, `${angle}deg`);
}

$$cubeAnglesRanges.forEach(($range) => {
    $range.addEventListener("input", cubeAngleRangeChangeHandler);
});
