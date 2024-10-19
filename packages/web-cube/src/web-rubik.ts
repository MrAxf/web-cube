import {
    createState,
    ReadonlyState,
    rotateCubeX180,
    rotateCubeX90,
    rotateCubeX90Backwards,
    rotateCubeY180,
    rotateCubeY90,
    rotateCubeY90Backwards,
    rotateCubeZ180,
    rotateCubeZ90,
    rotateCubeZ90Backwards,
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
} from "./state.ts";
import { animateDegCssVar } from "./utils/animate.ts";
import { createCubes } from "./utils/cube.ts";
import { createObservableContext, ObservableContext } from "./utils/observable.ts";

const styles = `
:host {
    --cube-size: 2;
    --block-size: 150px;
    --cube-start: -150px;

    --color-background: #242424;
    --color-up: #dd2020;
    --color-down: #ff8c00;
    --color-front: #ffffff;
    --color-back: #e2f105;
    --color-left: #1111aa;
    --color-right: #00aa11;

    --cube-rotation-x: 0deg;
    --cube-rotation-y: 0deg;
    --cube-rotation-z: 0deg;

    --spin-angle: 0deg;

    * {
        margin: 0;
        padding: 0;
    }
    *, *::before, *::after {
        box-sizing: border-box;
    }
}

.viewport {
    position: relative;
    width: 100%;
    height: 100%;
    display: block;
    transform-style: preserve-3d;
    perspective: 3000px;

    --hola: var(--spinangle);

    & .cube-contain {
        position: absolute;
        width: var(--block-size);
        height: var(--block-size);
        transform-style: preserve-3d;
        top: 50%;
        left: 50%;
        transform: translateX(-50%) translateY(-50%) rotateX(330deg)
            rotateY(45deg);
        & .main-cube {
            position: absolute;
            width: var(--block-size);
            height: var(--block-size);
            transform-style: preserve-3d;
            top: 0;
            left: 0;
            transform: rotateX(var(--cube-rotation-x))
                rotateY(var(--cube-rotation-y)) rotateZ(var(--cube-rotation-z));

            & .cube {
                position: absolute;
                width: var(--block-size);
                height: var(--block-size);
                transform-style: preserve-3d;
                top: 0;
                left: 0;

                & .face {
                    position: absolute;
                    background-color: var(--color-background);
                    width: var(--block-size);
                    height: var(--block-size);
                    --sticker-color: var(--color-background);

                    &:nth-child(1) {
                        transform: rotateY(0deg)
                            translateZ(calc(var(--block-size) / 2));
                    }

                    &:nth-child(2) {
                        transform: rotateY(90deg)
                            translateZ(calc(var(--block-size) / 2));
                    }

                    &:nth-child(3) {
                        transform: rotateY(180deg)
                            translateZ(calc(var(--block-size) / 2));
                    }

                    &:nth-child(4) {
                        transform: rotateY(-90deg)
                            translateZ(calc(var(--block-size) / 2));
                    }

                    &:nth-child(5) {
                        transform: rotateX(90deg)
                            translateZ(calc(var(--block-size) / 2));
                    }

                    &:nth-child(6) {
                        transform: rotateX(-90deg)
                            translateZ(calc(var(--block-size) / 2));
                    }

                    &.sticker {
                        &::after {
                            content: "";
                            display: block;
                            position: absolute;
                            width: 80%;
                            height: 80%;
                            margin: 10%;
                            border-radius: 10%;
                            background-color: var(--sticker-color);
                        }
                    }
                }
            }
        }
    }
}`;

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
    cube: {
        x: {
            90: {
                forward: rotateCubeX90,
                backwards: rotateCubeX90Backwards,
            },
            180: rotateCubeX180,
        },
        y: {
            90: {
                forward: rotateCubeY90,
                backwards: rotateCubeY90Backwards,
            },
            180: rotateCubeY180,
        },
        z: {
            90: {
                forward: rotateCubeZ90,
                backwards: rotateCubeZ90Backwards,
            },
            180: rotateCubeZ180,
        },
    },
};

export class WebRubik extends HTMLElement {
    #size: number = 3;
    #observableCtx: ObservableContext | null = null;
    #state: State | null = null;
    #mainCube: HTMLDivElement | null = null;
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
        this.#mainCube = $mainCube;

        const [cubes, cubeGroups] = createCubes(this.#size, this.#state!);
        this.#cubeGroups = cubeGroups;
        $mainCube.append(...cubes);

        $cubeContain.appendChild($mainCube);
        $viewport.appendChild($cubeContain);

        $viewport.addEventListener("pointerdown", (ev) => {
            ev.preventDefault();
            if (!ev.isPrimary || ev.button !== 0) return;
            this.#isRotating = true;
            const self = this;
            const $target = ev.target as HTMLElement;
            const $closestFace = $target.closest(".face.sticker");

            const viewportRect = $viewport.getBoundingClientRect();
            const pointerX = ev.clientX - viewportRect.left;
            const pointerY = ev.clientY - viewportRect.top;
            const isCubeMovevent = $target.closest(".main-cube") === null;
            
            console.log(pointerX, pointerY, isCubeMovevent);

            function handlePointerMove(ev: PointerEvent) {
                ev.preventDefault();
                console.log("move", ev.isPrimary);
            }

            function handlePointerUp(ev: PointerEvent) {
                ev.preventDefault();
                if (!ev.isPrimary || ev.button !== 0) return;
                self.#isRotating = false;
                console.log("up", ev);
                window.removeEventListener("pointermove", handlePointerMove);
                window.removeEventListener("pointerup", handlePointerUp);
            }

            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
        });

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

    async #rotateAxisLayer(
        axis: "x" | "y" | "z",
        layer: number,
        angle: 90 | 180 | 270 | 360,
        backwards: boolean = false,
    ) {
        if (this.#isRotating) return;
        this.#isRotating = true;
        try {
            let rotation: ((state: State, layer: number) => void) | null = null;

            if (angle !== 360) {
                const realAngle = angle === 270 ? 90 : angle;
                const realBackwards = angle === 270 ? !backwards : backwards;
                const posibleRotation = ROTATIONS[axis][realAngle];
                if (realAngle === 90) {
                    rotation = realBackwards
                        ? (posibleRotation as any).backwards
                        : (posibleRotation as any).forward;
                } else {
                    rotation = posibleRotation as any;
                }

                rotation!(this.#state!, layer);
            }
            this.#setCubesToRotate(axis, layer);
            await animateDegCssVar(
                this.style,
                "--spin-angle",
                0,
                angle * (backwards ? -1 : 1),
                500 * (Math.abs(angle) / 90),
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

    async #rotateAxisCube(
        axis: "x" | "y" | "z",
        angle: 90 | 180 | 270 | 360,
        backwards: boolean = false,
    ) {
        if (this.#isRotating) return;
        this.#isRotating = true;
        try {
            let rotation: ((state: State) => void) | null = null;

            if (angle !== 360) {
                const realAngle = angle === 270 ? 90 : angle;
                const realBackwards = angle === 270 ? !backwards : backwards;
                const posibleRotation = ROTATIONS["cube"][axis][realAngle];
                if (realAngle === 90) {
                    rotation = realBackwards
                        ? (posibleRotation as any).backwards
                        : (posibleRotation as any).forward;
                } else {
                    rotation = posibleRotation as any;
                }

                rotation!(this.#state!);
            }
            this.#mainCube!.style.setProperty(
                `--cube-rotation-${axis}`,
                "var(--spin-angle)",
            );
            await animateDegCssVar(
                this.style,
                "--spin-angle",
                0,
                angle * (backwards ? -1 : 1),
                500 * (Math.abs(angle) / 90),
            );
            this.#mainCube!.style.setProperty("--cube-rotation-x", "0deg");
            this.style.setProperty("--spin-angle", "0deg");
            this.#observableCtx!.tick();
        } catch (error) {
            console.error(error);
        } finally {
            this.#isRotating = false;
        }
    }

    async rotateCubeX90() {
        await this.#rotateAxisCube("x", 90, false);
    }

    async rotateCubeX90Backwards() {
        await this.#rotateAxisCube("x", 90, true);
    }

    async rotateCubeX180() {
        await this.#rotateAxisCube("x", 180, false);
    }

    async rotateCubeX180Backwards() {
        await this.#rotateAxisCube("x", 180, true);
    }

    async rotateCubeX270() {
        await this.#rotateAxisCube("x", 270, false);
    }

    async rotateCubeX270Backwards() {
        await this.#rotateAxisCube("x", 270, true);
    }

    async rotateCubeX360() {
        await this.#rotateAxisCube("x", 360, false);
    }

    async rotateCubeX360Backwards() {
        await this.#rotateAxisCube("x", 360, true);
    }

    async rotateCubeY90() {
        await this.#rotateAxisCube("y", 90, false);
    }

    async rotateCubeY90Backwards() {
        await this.#rotateAxisCube("y", 90, true);
    }

    async rotateCubeY180() {
        await this.#rotateAxisCube("y", 180, false);
    }

    async rotateCubeY180Backwards() {
        await this.#rotateAxisCube("y", 180, true);
    }

    async rotateCubeY270() {
        await this.#rotateAxisCube("y", 270, false);
    }

    async rotateCubeY270Backwards() {
        await this.#rotateAxisCube("y", 270, true);
    }

    async rotateCubeY360() {
        await this.#rotateAxisCube("y", 360, false);
    }

    async rotateCubeY360Backwards() {
        await this.#rotateAxisCube("y", 360, true);
    }

    async rotateCubeZ90() {
        await this.#rotateAxisCube("z", 90, false);
    }

    async rotateCubeZ90Backwards() {
        await this.#rotateAxisCube("z", 90, true);
    }

    async rotateCubeZ180() {
        await this.#rotateAxisCube("z", 180, false);
    }

    async rotateCubeZ180Backwards() {
        await this.#rotateAxisCube("z", 180, true);
    }

    async rotateCubeZ270() {
        await this.#rotateAxisCube("z", 270, false);
    }

    async rotateCubeZ270Backwards() {
        await this.#rotateAxisCube("z", 270, true);
    }

    async rotateCubeZ360() {
        await this.#rotateAxisCube("z", 360, false);
    }

    async rotateCubeZ360Backwards() {
        await this.#rotateAxisCube("z", 360, true);
    }

    async rotateX90(layer: number) {
        await this.#rotateAxisLayer("x", layer, 90, false);
    }

    async rotateX90Backwards(layer: number) {
        await this.#rotateAxisLayer("x", layer, 90, true);
    }

    async rotateX180(layer: number) {
        await this.#rotateAxisLayer("x", layer, 180, false);
    }

    async rotateX180Backwards(layer: number) {
        await this.#rotateAxisLayer("x", layer, 180, true);
    }

    async rotateX270(layer: number) {
        await this.#rotateAxisLayer("x", layer, 270, false);
    }

    async rotateX270Backwards(layer: number) {
        await this.#rotateAxisLayer("x", layer, 270, true);
    }

    async rotateX360(layer: number) {
        await this.#rotateAxisLayer("x", layer, 360, false);
    }

    async rotateX360Backwards(layer: number) {
        await this.#rotateAxisLayer("x", layer, 360, true);
    }

    async rotateY90(layer: number) {
        await this.#rotateAxisLayer("y", layer, 90, false);
    }

    async rotateY90Backwards(layer: number) {
        await this.#rotateAxisLayer("y", layer, 90, true);
    }

    async rotateY180(layer: number) {
        await this.#rotateAxisLayer("y", layer, 180, false);
    }

    async rotateY180Backwards(layer: number) {
        await this.#rotateAxisLayer("y", layer, 180, true);
    }

    async rotateY270(layer: number) {
        await this.#rotateAxisLayer("y", layer, 270, false);
    }

    async rotateY270Backwards(layer: number) {
        await this.#rotateAxisLayer("y", layer, 270, true);
    }

    async rotateY360(layer: number) {
        await this.#rotateAxisLayer("y", layer, 360, false);
    }

    async rotateY360Backwards(layer: number) {
        await this.#rotateAxisLayer("y", layer, 360, true);
    }

    async rotateZ90(layer: number) {
        await this.#rotateAxisLayer("z", layer, 90, false);
    }

    async rotateZ90Backwards(layer: number) {
        await this.#rotateAxisLayer("z", layer, 90, true);
    }

    async rotateZ180(layer: number) {
        await this.#rotateAxisLayer("z", layer, 180, false);
    }

    async rotateZ180Backwards(layer: number) {
        await this.#rotateAxisLayer("z", layer, 180, true);
    }

    async rotateZ270(layer: number) {
        await this.#rotateAxisLayer("z", layer, 270, false);
    }

    async rotateZ270Backwards(layer: number) {
        await this.#rotateAxisLayer("z", layer, 270, true);
    }

    async rotateZ360(layer: number) {
        await this.#rotateAxisLayer("z", layer, 360, false);
    }

    async rotateZ360Backwards(layer: number) {
        await this.#rotateAxisLayer("z", layer, 360, true);
    }

    setCssVariable(name: string, value: string) {
        this.style.setProperty(name, value);
    }
}

globalThis.customElements.define("web-rubik", WebRubik);
