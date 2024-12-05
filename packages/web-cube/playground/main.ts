import {
    createBaseState,
    define,
    enqueueRotations,
    rotateCubeRandomly,
    rotateLayerRandomly,
    WebCube,
} from "../src/index";
import "./styles.css";

define();

const $webRubik = document.querySelector("web-cube") as WebCube;

const $controls = document.getElementById("controls") as HTMLDivElement;
const $$layerBtns: NodeListOf<HTMLButtonElement> = $controls.querySelectorAll(
    "button[data-layer-btn]",
);

function layerButtonClickHandler(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const axis = target.dataset.axis! as "x" | "y" | "z";
    const layer = parseInt(target.dataset.layer!);
    const angle = parseInt(target.dataset.angle!);

    $webRubik.rotateLayer({
        axis,
        layer,
        angle: Math.abs(angle) as any,
        backwards: angle < 0,
        speed: 100,
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
    $webRubik.rotateCube({
        axis,
        angle: Math.abs(angle) as any,
        backwards: angle < 0,
    });
}

$$cubeBtns.forEach(($btn) => {
    $btn.addEventListener("click", cubeButtonClickHandler);
});
