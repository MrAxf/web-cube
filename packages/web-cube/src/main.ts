import { Face } from "./utils/faces.ts";
import type { WebRubik } from "./web-rubik.ts";

const $webRubik = document.querySelector("web-rubik") as WebRubik;

$webRubik.setState({
  [Face.Up]: [[Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down], [Face.Down, Face.Left, Face.Up]],
  [Face.Front]: [[Face.Left, Face.Up, Face.Down], [Face.Down, Face.Left, Face.Up], [Face.Down, Face.Down, Face.Left]],
  [Face.Down]: [[Face.Down, Face.Left, Face.Up], [Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down]],
  [Face.Back]: [[Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down], [Face.Down, Face.Left, Face.Up]],
  [Face.Left]: [[Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down], [Face.Down, Face.Left, Face.Up]],
  [Face.Right]: [[Face.Down, Face.Left, Face.Up], [Face.Up, Face.Down, Face.Left], [Face.Left, Face.Up, Face.Down]],
})

const $controls = document.getElementById("controls") as HTMLDivElement;
const $$layerBtns: NodeListOf<HTMLButtonElement> = $controls.querySelectorAll("button[data-layer-btn]");

function layerButtonClickHandler(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const axis = target.dataset.axis! as "x" | "y" | "z";
  const layer = parseInt(target.dataset.layer!);
  const angle = parseInt(target.dataset.angle!);
  // @ts-ignore
  $webRubik[`rotate${axis.toUpperCase()}${Math.abs(angle)}${angle < 0 ? 'Backwards' : ''}`](layer);
}

$$layerBtns.forEach(($btn) => {
  $btn.addEventListener("click", layerButtonClickHandler);
});

const $$cubeBtns: NodeListOf<HTMLButtonElement> = $controls.querySelectorAll("button[data-cube-btn]");

function cubeButtonClickHandler(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const axis = target.dataset.axis! as "x" | "y" | "z";
  const angle = parseInt(target.dataset.angle!);
  // @ts-ignore
  $webRubik[`rotateCube${axis.toUpperCase()}${Math.abs(angle)}${angle < 0 ? 'Backwards' : ''}`]();
}

$$cubeBtns.forEach(($btn) => {
  $btn.addEventListener("click", cubeButtonClickHandler);
});

const $$cubeAnglesRanges: NodeListOf<HTMLInputElement> = $controls.querySelectorAll("input[type=range]");

function cubeAngleRangeChangeHandler(e: Event) {
  const target = e.target as HTMLInputElement;
  const axis = target.dataset.axis! as "x" | "y" | "z";
  const angle = parseInt(target.value);
  $webRubik.setCssVariable(`--cube-rotation-${axis}`, `${angle}deg`);
}

$$cubeAnglesRanges.forEach(($range) => {
  $range.addEventListener("input", cubeAngleRangeChangeHandler);
});
