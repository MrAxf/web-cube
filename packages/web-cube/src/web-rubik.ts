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
import {
    createObservableContext,
    ObservableContext,
} from "./utils/observable.ts";
import { style } from "./style.ts";

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
    #rotatingTime: number = 500;

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
        $style.textContent = style;
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
            if (!ev.isPrimary || ev.button !== 0) return;
            ev.preventDefault();
            if (this.#isRotating) return;

            this.#isRotating = true;
            const self = this;
            const $target = ev.target as HTMLElement;
            const $closestFace = $target.closest(".face.sticker");

            const viewportRect = $viewport.getBoundingClientRect();
            const originX = ev.clientX - viewportRect.left;
            const originY = ev.clientY - viewportRect.top;

            if (!$closestFace) {
                const xAxis = "y";
                const yAxis = originX > viewportRect.width / 2 ? "x" : "z";
                const xMultiplier = originY > viewportRect.height / 2 ? 1 : -1;

                let axis: "x" | "y" | "z" | null = null;
                let currentAngle = 0;

                function handlePointerMove(ev: PointerEvent) {
                    ev.preventDefault();

                    const currentX = ev.clientX - viewportRect.left;
                    const currentY = ev.clientY - viewportRect.top;

                    if (!axis) {
                        const xDistance = Math.abs(currentX - originX);
                        const yDistance = Math.abs(currentY - originY);
                        if (xDistance > 10 || yDistance > 10) {
                            axis = xDistance > yDistance ? xAxis : yAxis;
                        }

                        self.#mainCube!.style.setProperty(
                            `--cube-rotation-${axis}`,
                            "var(--spin-angle)",
                        );
                    } else {
                        currentAngle = Math.min(
                            Math.max(
                                (axis === "y")
                                    ? ((currentX - originX) / 3) *
                                        xMultiplier
                                    : ((originY - currentY) / 3),
                                -360,
                            ),
                            360,
                        );
                        globalThis.requestAnimationFrame(() => {
                            self.style.setProperty(
                                "--spin-angle",
                                `${currentAngle}deg`,
                            );
                        });
                    }
                }

                function handlePointerUp(ev: PointerEvent) {
                    if (!ev.isPrimary || ev.button !== 0) return;
                    ev.preventDefault();

                    const targetAngle = Math.round(currentAngle / 90) * 90;

                    if (!$closestFace) {
                        self.#rotateAxisCube({
                            axis: axis!,
                            angle: Math.abs(targetAngle) as
                                | 90
                                | 180
                                | 270
                                | 360,
                            backwards: targetAngle < 0,
                            from: currentAngle,
                        }).then(() => {
                            self.#mainCube!.style.removeProperty(
                                `--cube-rotation-${axis}`,
                            );
                            self.style.setProperty("--spin-angle", "0deg");
                            self.#isRotating = false;
                        });
                    }

                    window.removeEventListener(
                        "pointermove",
                        handlePointerMove,
                    );
                    window.removeEventListener("pointerup", handlePointerUp);
                }

                window.addEventListener("pointermove", handlePointerMove);
                window.addEventListener("pointerup", handlePointerUp);
            }
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

    //#region Private totation methods
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
        {
            axis,
            layer,
            angle,
            backwards = false,
            from = 0,
        }: {
            axis: "x" | "y" | "z";
            layer: number;
            angle: 90 | 180 | 270 | 360;
            backwards?: boolean;
            from?: number;
        },
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
                this.#rotatingTime * (Math.abs(angle - from) / 90),
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
        {
            axis,
            angle,
            backwards = false,
            from = 0,
        }: {
            axis: "x" | "y" | "z";
            angle: 0 | 90 | 180 | 270 | 360;
            backwards?: boolean;
            from?: number;
        },
    ) {
        let rotation: ((state: State) => void) | null = null;

        if (angle !== 360 && angle !== 0) {
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

        console.log({
            fromAngle: from,
            targetAngle: angle,
            distance: Math.abs(angle - from),
            multiplier: (Math.abs(angle - from) / 90),
            time: this.#rotatingTime * (Math.abs(angle - from) / 90),
        });

        await animateDegCssVar(
            this.style,
            "--spin-angle",
            from,
            angle * (backwards ? -1 : 1),
            this.#rotatingTime * (Math.abs(angle - from) / 90),
        );
        this.#mainCube!.style.removeProperty(`--cube-rotation-${axis}`);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();
    }
    //#endregion

    //#region Cube rotations
    async #withRotation(action: () => Promise<void>) {
        if (this.#isRotating) return;
        this.#isRotating = true;
        try {
            await action();
        } catch (error) {
            console.error(error);
        } finally {
            this.#isRotating = false;
        }
    }

    async rotateCubeX90() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "x",
                    angle: 90,
                    backwards: false,
                }),
        );
    }

    async rotateCubeX90Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({ axis: "x", angle: 90, backwards: true }),
        );
    }

    async rotateCubeX180() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "x",
                    angle: 180,
                    backwards: false,
                }),
        );
    }

    async rotateCubeX180Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "x",
                    angle: 180,
                    backwards: true,
                }),
        );
    }

    async rotateCubeX270() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "x",
                    angle: 270,
                    backwards: false,
                }),
        );
    }

    async rotateCubeX270Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "x",
                    angle: 270,
                    backwards: true,
                }),
        );
    }

    async rotateCubeX360() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "x",
                    angle: 360,
                    backwards: false,
                }),
        );
    }

    async rotateCubeX360Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "x",
                    angle: 360,
                    backwards: true,
                }),
        );
    }

    async rotateCubeY90() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "y",
                    angle: 90,
                    backwards: false,
                }),
        );
    }

    async rotateCubeY90Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({ axis: "y", angle: 90, backwards: true }),
        );
    }

    async rotateCubeY180() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "y",
                    angle: 180,
                    backwards: false,
                }),
        );
    }

    async rotateCubeY180Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "y",
                    angle: 180,
                    backwards: true,
                }),
        );
    }

    async rotateCubeY270() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "y",
                    angle: 270,
                    backwards: false,
                }),
        );
    }

    async rotateCubeY270Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "y",
                    angle: 270,
                    backwards: true,
                }),
        );
    }

    async rotateCubeY360() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "y",
                    angle: 360,
                    backwards: false,
                }),
        );
    }

    async rotateCubeY360Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "y",
                    angle: 360,
                    backwards: true,
                }),
        );
    }

    async rotateCubeZ90() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "z",
                    angle: 90,
                    backwards: false,
                }),
        );
    }

    async rotateCubeZ90Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({ axis: "z", angle: 90, backwards: true }),
        );
    }

    async rotateCubeZ180() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "z",
                    angle: 180,
                    backwards: false,
                }),
        );
    }

    async rotateCubeZ180Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "z",
                    angle: 180,
                    backwards: true,
                }),
        );
    }

    async rotateCubeZ270() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "z",
                    angle: 270,
                    backwards: false,
                }),
        );
    }

    async rotateCubeZ270Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "z",
                    angle: 270,
                    backwards: true,
                }),
        );
    }

    async rotateCubeZ360() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "z",
                    angle: 360,
                    backwards: false,
                }),
        );
    }

    async rotateCubeZ360Backwards() {
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis: "z",
                    angle: 360,
                    backwards: true,
                }),
        );
    }
    //#endregion

    //#region Layer rotations
    async rotateX90(layer: number) {
        await this.#rotateAxisLayer({
            axis: "x",
            layer,
            angle: 90,
            backwards: false,
        });
    }

    async rotateX90Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "x",
            layer,
            angle: 90,
            backwards: true,
        });
    }

    async rotateX180(layer: number) {
        await this.#rotateAxisLayer({
            axis: "x",
            layer,
            angle: 180,
            backwards: false,
        });
    }

    async rotateX180Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "x",
            layer,
            angle: 180,
            backwards: true,
        });
    }

    async rotateX270(layer: number) {
        await this.#rotateAxisLayer({
            axis: "x",
            layer,
            angle: 270,
            backwards: false,
        });
    }

    async rotateX270Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "x",
            layer,
            angle: 270,
            backwards: true,
        });
    }

    async rotateX360(layer: number) {
        await this.#rotateAxisLayer({
            axis: "x",
            layer,
            angle: 360,
            backwards: false,
        });
    }

    async rotateX360Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "x",
            layer,
            angle: 360,
            backwards: true,
        });
    }

    async rotateY90(layer: number) {
        await this.#rotateAxisLayer({
            axis: "y",
            layer,
            angle: 90,
            backwards: false,
        });
    }

    async rotateY90Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "y",
            layer,
            angle: 90,
            backwards: true,
        });
    }

    async rotateY180(layer: number) {
        await this.#rotateAxisLayer({
            axis: "y",
            layer,
            angle: 180,
            backwards: false,
        });
    }

    async rotateY180Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "y",
            layer,
            angle: 180,
            backwards: true,
        });
    }

    async rotateY270(layer: number) {
        await this.#rotateAxisLayer({
            axis: "y",
            layer,
            angle: 270,
            backwards: false,
        });
    }

    async rotateY270Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "y",
            layer,
            angle: 270,
            backwards: true,
        });
    }

    async rotateY360(layer: number) {
        await this.#rotateAxisLayer({
            axis: "y",
            layer,
            angle: 360,
            backwards: false,
        });
    }

    async rotateY360Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "y",
            layer,
            angle: 360,
            backwards: true,
        });
    }

    async rotateZ90(layer: number) {
        await this.#rotateAxisLayer({
            axis: "z",
            layer,
            angle: 90,
            backwards: false,
        });
    }

    async rotateZ90Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "z",
            layer,
            angle: 90,
            backwards: true,
        });
    }

    async rotateZ180(layer: number) {
        await this.#rotateAxisLayer({
            axis: "z",
            layer,
            angle: 180,
            backwards: false,
        });
    }

    async rotateZ180Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "z",
            layer,
            angle: 180,
            backwards: true,
        });
    }

    async rotateZ270(layer: number) {
        await this.#rotateAxisLayer({
            axis: "z",
            layer,
            angle: 270,
            backwards: false,
        });
    }

    async rotateZ270Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "z",
            layer,
            angle: 270,
            backwards: true,
        });
    }

    async rotateZ360(layer: number) {
        await this.#rotateAxisLayer({
            axis: "z",
            layer,
            angle: 360,
            backwards: false,
        });
    }

    async rotateZ360Backwards(layer: number) {
        await this.#rotateAxisLayer({
            axis: "z",
            layer,
            angle: 360,
            backwards: true,
        });
    }
    //#endregion

    setCssVariable(name: string, value: string) {
        this.style.setProperty(name, value);
    }
}

globalThis.customElements.define("web-rubik", WebRubik);
