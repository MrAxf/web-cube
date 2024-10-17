import {
    createState,
    ReadonlyState,
    rotateX180,
    rotateX90,
    rotateX90Backwards,
    rotateY180,
    rotateY90,
    rotateY90Backwards,
    rotateZ180,
    rotateZ90,
    rotateZ90Backwards,
    setState,
    State,
} from "./state";
import { animateDegCssVar } from "./utils/animate";
import { createCubes } from "./utils/cube";
import { createObservableContext, ObservableContext } from "./utils/observable";
import styles from "./web-rubik.css?inline";

const ROTATIONS = {
    x: {
        90: {
            forward: rotateX90,
            backwards: rotateX90Backwards,
        },
        180: rotateX180,
    },
    y: {
        90: {
            forward: rotateY90,
            backwards: rotateY90Backwards,
        },
        180: rotateY180,
    },
    z: {
        90: {
            forward: rotateZ90,
            backwards: rotateZ90Backwards,
        },
        180: rotateZ180,
    },
};

export class WebRubik extends HTMLElement {
    #size: number = 3;
    #observableCtx: ObservableContext | null = null;
    #state: State | null = null;
    #cubeGroups: Record<"x" | "y" | "z", HTMLDivElement[][]> | null = null;
    #isRotating: boolean = false;

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

    async rotateAxis(
        axis: "x" | "y" | "z",
        layer: number,
        angle: 90 | 180,
        backwards: boolean = false,
    ) {
        if (this.#isRotating) return;
        this.#isRotating = true;
        try {
            let rotation: ((state: State, layer: number) => void) | null = null;
            const posibleRotation = ROTATIONS[axis][angle];
            if (angle === 90) {
                rotation = backwards
                    ? (posibleRotation as any).backwards
                    : (posibleRotation as any).forward;
            } else {
                rotation = posibleRotation as any;
            }
            rotation!(this.#state!, layer);
            this.#setCubesToRotate(axis, layer);
            await animateDegCssVar(
                this.style,
                "--spin-angle",
                0,
                angle * (backwards ? -1 : 1),
                1000,
            );
            this.#resetCubesRotate(axis, layer);
            this.style.setProperty("--spin-angle", "0deg");
            this.#observableCtx!.tick();
        } catch (error) {
            console.error(error);
        } finally {
            this.#isRotating = false;
        }
    }

    async rotateX90(layer: number) {
        await this.rotateAxis("x", layer, 90, false);
    }

    async rotateX90Backwards(layer: number) {
        await this.rotateAxis("x", layer, 90, true);
    }

    async rotateX180(layer: number) {
        await this.rotateAxis("x", layer, 180, false);
    }

    async rotateX180Backwards(layer: number) {
        await this.rotateAxis("x", layer, 180, true);
    }

    async rotateY90(layer: number) {
        await this.rotateAxis("y", layer, 90, false);
    }

    async rotateY90Backwards(layer: number) {
        await this.rotateAxis("y", layer, 90, true);
    }

    async rotateY180(layer: number) {
        await this.rotateAxis("y", layer, 180, false);
    }

    async rotateY180Backwards(layer: number) {
        await this.rotateAxis("y", layer, 180, true);
    }

    async rotateZ90(layer: number) {
        await this.rotateAxis("z", layer, 90, false);
    }

    async rotateZ90Backwards(layer: number) {
        await this.rotateAxis("z", layer, 90, true);
    }

    async rotateZ180(layer: number) {
        await this.rotateAxis("z", layer, 180, false);
    }

    async rotateZ180Backwards(layer: number) {
        await this.rotateAxis("z", layer, 180, true);
    }

    setCssVariable(name: string, value: string) {
        this.style.setProperty(name, value);
    }
}

globalThis.customElements.define("web-rubik", WebRubik);
