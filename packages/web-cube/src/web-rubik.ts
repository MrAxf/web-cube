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
import { Face } from "./utils/faces.ts";

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
            ev.preventDefault();

            if (this.#isRotating) return;

            this.#isRotating = true;
            const self = this;
            const $target = ev.target as HTMLElement;
            const $closestFace = $target.closest(".face.sticker") as
                | HTMLElement
                | null;

            const viewportRect = $viewport.getBoundingClientRect();
            const originX = ev.clientX - viewportRect.left;
            const originY = ev.clientY - viewportRect.top;
            const currentFace = $closestFace
                ? parseInt($closestFace.dataset.face!)
                : null;

            if (currentFace === null) {
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

                            self.#mainCube!.style.setProperty(
                                `--cube-rotation-${axis}`,
                                "var(--spin-angle)",
                            );
                        }
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
                    ev.preventDefault();

                    const targetAngle = Math.round(currentAngle / 90) * 90;

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

                    window.removeEventListener(
                        "pointermove",
                        handlePointerMove,
                    );
                    window.removeEventListener("pointerup", handlePointerUp);
                }

                window.addEventListener("pointermove", handlePointerMove);
                window.addEventListener("pointerup", handlePointerUp);
            } else if (
                currentFace === Face.Front || currentFace === Face.Left
            ) {
                let axis: "x" | "y" | "z" | null = null;
                let layer = 0;
                let currentAngle = 0;

                function handlePointerMove(ev: PointerEvent) {
                    ev.preventDefault();

                    const currentX = ev.clientX - viewportRect.left;
                    const currentY = ev.clientY - viewportRect.top;

                    if (!axis) {
                        const xDistance = Math.abs(currentX - originX);
                        const yDistance = Math.abs(currentY - originY);
                        if (xDistance > 10 || yDistance > 10) {
                            axis = xDistance > yDistance
                                ? "y"
                                : currentFace === Face.Front
                                ? "x"
                                : "z";
                            layer = parseInt(
                                $closestFace!.dataset[axis] as string,
                            );

                            self.#setCubesToRotate(axis, layer);
                        }
                    } else {
                        currentAngle = Math.min(
                            Math.max(
                                (axis === "y")
                                    ? ((currentX - originX) / 3)
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
                    ev.preventDefault();

                    const targetAngle = Math.round(currentAngle / 90) * 90;

                    self.#rotateAxisLayer({
                        axis: axis!,
                        layer,
                        angle: Math.abs(targetAngle) as
                            | 90
                            | 180
                            | 270
                            | 360,
                        backwards: targetAngle < 0,
                        from: currentAngle,
                    }).then(() => {
                        self.#resetCubesRotate(axis!, layer);
                        self.style.setProperty("--spin-angle", "0deg");
                        self.#isRotating = false;
                    });

                    window.removeEventListener(
                        "pointermove",
                        handlePointerMove,
                    );
                    window.removeEventListener(
                        "pointerup",
                        handlePointerUp,
                    );
                }

                window.addEventListener("pointermove", handlePointerMove);
                window.addEventListener("pointerup", handlePointerUp);
            } else if (currentFace === Face.Up) {
                let axis: "x" | "y" | "z" | null = null;
                let layer = 0;
                let currentAngle = 0;

                function handlePointerMove(ev: PointerEvent) {
                    ev.preventDefault();

                    const currentX = ev.clientX - viewportRect.left;
                    const currentY = ev.clientY - viewportRect.top;
                    const xDistance = currentX - originX;
                    const yDistance = currentY - originY;

                    const rotatedX = Math.cos(Math.PI / 6) * xDistance -
                        Math.sin(Math.PI / 6) * yDistance;
                    const rotatedY = Math.sin(Math.PI / 3) * xDistance +
                        Math.cos(Math.PI / 3) * yDistance;

                    if (!axis) {
                        const rotatedXAbs = Math.abs(rotatedX);
                        const rotatedYAbs = Math.abs(rotatedY);
                        if (rotatedXAbs > 10 || rotatedYAbs > 10) {
                            axis = rotatedXAbs > rotatedYAbs ? "z" : "x";
                            layer = parseInt(
                                $closestFace!.dataset[axis] as string,
                            );

                            self.#setCubesToRotate(axis, layer);
                        }
                    } else {
                        currentAngle = Math.min(
                            Math.max(
                                (axis === "z")
                                    ? (rotatedX / 3)
                                    : (-rotatedY / 3),
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
                    ev.preventDefault();

                    const targetAngle = Math.round(currentAngle / 90) * 90;

                    self.#rotateAxisLayer({
                        axis: axis!,
                        layer,
                        angle: Math.abs(targetAngle) as
                            | 90
                            | 180
                            | 270
                            | 360,
                        backwards: targetAngle < 0,
                        from: currentAngle,
                    }).then(() => {
                        self.#resetCubesRotate(axis!, layer);
                        self.style.setProperty("--spin-angle", "0deg");
                        self.#isRotating = false;
                    });

                    window.removeEventListener(
                        "pointermove",
                        handlePointerMove,
                    );
                    window.removeEventListener(
                        "pointerup",
                        handlePointerUp,
                    );
                }

                window.addEventListener("pointermove", handlePointerMove);
                window.addEventListener("pointerup", handlePointerUp);
            } else {
                this.#isRotating = false;
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
            angle: 0 | 90 | 180 | 270 | 360;
            backwards?: boolean;
            from?: number;
        },
    ) {
        let rotation: ((state: State, layer: number) => void) | null = null;

        const realAngle = angle * (backwards ? -1 : 1);

        if (angle !== 360 && angle !== 0) {
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
            from,
            realAngle,
            this.#rotatingTime * (Math.abs(realAngle - from) / 90),
        );
        this.#resetCubesRotate(axis, layer);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();
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

        const realAngle = angle * (backwards ? -1 : 1);

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

        await animateDegCssVar(
            this.style,
            "--spin-angle",
            from,
            realAngle,
            this.#rotatingTime *
                (Math.abs(realAngle - from) / 90),
        );
        this.#mainCube!.style.removeProperty(`--cube-rotation-${axis}`);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();
    }

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

    async rotateCube({
        axis,
        angle,
        backwards = false,
    }: {
        axis: "x" | "y" | "z";
        angle: 90 | 180 | 270 | 360;
        backwards?: boolean;
    }) {
        if (["x", "y", "z"].includes(axis) === false) {
            throw new Error(`Invalid axis ${axis}`);
        }
        if ([90, 180, 270, 360].includes(angle) === false) {
            throw new Error(`Invalid angle ${angle}`);
        }
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis,
                    angle,
                    backwards,
                }),
        );
    }

    async rotateLayer({
        axis,
        layer,
        angle,
        backwards = false,
    }: {
        axis: "x" | "y" | "z";
        layer: number;
        angle: 90 | 180 | 270 | 360;
        backwards?: boolean;
    }) {
        if (["x", "y", "z"].includes(axis) === false) {
            throw new Error(`Invalid axis ${axis}`);
        }
        if ([90, 180, 270, 360].includes(angle) === false) {
            throw new Error(`Invalid angle ${angle}`);
        }
        if (layer < 0 || layer >= this.#size) {
            throw new Error(`Invalid layer ${layer}`);
        }
        await this.#withRotation(
            () =>
                this.#rotateAxisLayer({
                    axis,
                    layer,
                    angle,
                    backwards,
                }),
        );
    }

    setCssVariable(name: string, value: string) {
        this.style.setProperty(name, value);
    }
}

globalThis.customElements.define("web-rubik", WebRubik);
