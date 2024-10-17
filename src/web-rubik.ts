import {
    createState,
    ReadonlyState,
    rotateX180,
    rotateX90,
    rotateX90Backwards,
    rotateY90,
    setState,
    State,
} from "./state";
import { animateDegCssVar } from "./utils/animate";
import { createCubes } from "./utils/cube";
import { createObservableContext, ObservableContext } from "./utils/observable";
import styles from "./web-rubik.css?inline";

export class WebRubik extends HTMLElement {
    #size: number = 3;
    #observableCtx: ObservableContext | null = null;
    #state: State | null = null;
    #cubeGroups: Record<'x' | 'y' | 'z', HTMLDivElement[][]> | null = null

    static observedAttributes = [
        "size",
    ];

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.#observableCtx = createObservableContext();
        this.#state = createState(this.#observableCtx, this.#size);

        this.#observableCtx.tick();

        const $style = document.createElement("style");
        $style.textContent = styles;
        this.shadowRoot!.appendChild($style);

        this.style.setProperty("--cube-size", `${this.#size}`);

        const $viewport = document.createElement("div");
        let previousSize = 0;
        const resizeObserver = new ResizeObserver((entries) => {
            const entrie = entries[0];
            const { width, height } = entrie.contentRect;
            const size = Math.min(width, height);
            if (previousSize === size) return;
            previousSize = size;
            const blockSize = Math.floor((size * 0.5) / this.#size);
            this.style.setProperty("--block-size", `${blockSize}px`);
            this.style.setProperty(
                "--cube-start",
                `${(blockSize * this.#size / -2) + (blockSize / 2)}px`,
            );
        });
        resizeObserver.observe($viewport);
        $viewport.classList.add("viewport");

        const $cubeContain = document.createElement("div");
        $cubeContain.classList.add("cube-contain");

        const $mainCube = document.createElement("div");
        $mainCube.classList.add("main-cube");

        const [cubes, cubeGroups] = createCubes(this.#size, this.#state!);
        this.#cubeGroups = cubeGroups;
        $mainCube.append(...cubes);

        $cubeContain.appendChild($mainCube);
        $viewport.appendChild($cubeContain);

        this.shadowRoot!.appendChild($viewport);
    }

    disconnectedCallback() {
        console.log("WebRubik disconnected");
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        if (name === "size") {
            this.#size = parseInt(newValue, 10);
        }
    }

    setState(newState: ReadonlyState) {
        setState(this.#state!, newState);
        this.#observableCtx!.tick();
    }

    #setCubesToRotate(axis: "x" | "y" | "z", layer: number) {
        const $$cubes = this.#cubeGroups![axis][layer];
        $$cubes.forEach(($cube) => {
            ($cube as HTMLDivElement).style.setProperty(
                `--rotate-cube-${axis}`,
                "var(--spin-angle)",
            );
        });
    }

    #resetCubesRotate(axis: "x" | "y" | "z", layer: number) {
        const $$cubes = this.#cubeGroups![axis][layer];
        $$cubes.forEach(($cube) => {
            ($cube as HTMLDivElement).style.setProperty(
                `--rotate-cube-${axis}`,
                "0deg",
            );
        });
    }

    async rotateX90(layer: number) {
        rotateX90(this.#state!, layer);
        this.#setCubesToRotate("x", layer);
        await animateDegCssVar(this.style, "--spin-angle", 0, 90, 500);
        this.#resetCubesRotate("x", layer);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();
    }

    async rotateX90Backwards(layer: number) {
        rotateX90Backwards(this.#state!, layer);
        this.#setCubesToRotate("x", layer);
        await animateDegCssVar(this.style, "--spin-angle", 0, -90, 500);
        this.#resetCubesRotate("x", layer);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();
    }

    async rotateX180(layer: number) {
        rotateX180(this.#state!, layer);
        this.#setCubesToRotate("x", layer);
        await animateDegCssVar(this.style, "--spin-angle", 0, 180, 500);
        this.#resetCubesRotate("x", layer);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();
    }

    async rotateX180Backwards(layer: number) {
        rotateX180(this.#state!, layer);
        this.#setCubesToRotate("x", layer);
        await animateDegCssVar(this.style, "--spin-angle", 0, -180, 500);
        this.#resetCubesRotate("x", layer);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();
    }

    async rotateY90(layer: number) {
        rotateY90(this.#state!, layer);
        this.#setCubesToRotate("y", layer);
        await animateDegCssVar(this.style, "--spin-angle", 0, 90, 500);
        this.#resetCubesRotate("y", layer);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();
    }

    setCssVariable(name: string, value: string) {
        this.style.setProperty(name, value);
    }
}

globalThis.customElements.define("web-rubik", WebRubik);
