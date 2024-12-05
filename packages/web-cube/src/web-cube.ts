import {
    createState,
    FlatState,
    getCurrentState,
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
import { animateDegCssVar } from "./animate.ts";
import { createCubes } from "./cube.ts";
import { createObservableContext, ObservableContext } from "./observable.ts";
import { style } from "./style.ts";
import { CubeRotationOptions, Face, LayerRotationOptions } from "./utils.ts";
import {
    afterCubeRotate,
    afterLayerRotate,
    afterRotate,
    beforeCubeRotate,
    beforeLayerRotate,
    beforeRotate,
    RotationEventDetail,
} from "./cube-events.ts";

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

/**
 * The `WebCube` class represents a custom HTML element that renders and manages a 3D Rubik's cube.
 * It handles the creation, manipulation, and rotation of the cube and its layers.
 */
export class WebCube extends HTMLElement {
    // Attributes
    #size: number = 3;
    #speed: number = 500;
    #disabledPointerEvents: boolean = false;

    // HTML Elements
    #$viewport: HTMLDivElement | null = null;
    #$mainCube: HTMLDivElement | null = null;
    #cubeGroups: Record<"x" | "y" | "z", HTMLDivElement[][]> | null = null;

    #resizeObserver: ResizeObserver | null = null;
    #viewportPointerEvent: ((ev: PointerEvent) => void) | null = null;

    // State
    #state: State | null = null;
    #isRotating: boolean = false;
    #observableCtx: ObservableContext | null = null;

    static observedAttributes = [
        "size",
        "speed",
        "disabled-pointer-events",
    ];

    /**
     * Creates a new `WebCube` instance.
     */
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    /**
     * Called when the element is connected to the DOM.
     */
    connectedCallback() {
        const css = new CSSStyleSheet();
        css.replaceSync(style);
        this.shadowRoot!.adoptedStyleSheets = [css];

        this.#createCube();
    }

    /**
     * Called when the element is disconnected from the DOM.
     */
    disconnectedCallback() {
        this.#diposeCube();
    }

    /**
     * Called when an observed attribute changes.
     * @param name The name of the attribute that changed.
     * @param oldValue The previous value of the attribute.
     * @param newValue The new value of the attribute.
     */
    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;
        if (name === "size") {
            try {
                this.#size = parseInt(newValue, 10);
            } catch (error) {
                this.#size = 3;
            }
            if (this.#size <= 0) {
                this.#size = 1;
            }
            if (this.#$viewport) {
                this.#diposeCube();
                this.#createCube();
            }
        }
        if (name === "speed") {
            try {
                this.#speed = parseInt(newValue, 10);
            } catch (error) {
                this.#speed = 500;
            }
            if (this.#speed <= 0) {
                this.#size = 500;
            }
            if (this.#$viewport) {
                this.#diposeCube();
                this.#createCube();
            }
        }
        if (name === "disabled-pointer-events") {
            this.#disabledPointerEvents = newValue === null ||
                newValue !== "false";
            if (this.#$viewport) {
                if (this.#disabledPointerEvents) {
                    this.#diposePointerEvents();
                } else {
                    this.#createPointerEvents();
                }
            }
        }
    }

    #createCube() {
        this.style.setProperty("--cube-size", `${this.#size}`);

        this.#observableCtx = createObservableContext();
        this.#state = createState(this.#observableCtx, this.#size);

        this.#observableCtx.tick();

        this.#$viewport = document.createElement("div");
        this.#$viewport.setAttribute("data-viewport", "");
        let previousSize = 0;
        this.#resizeObserver = new ResizeObserver((entries) => {
            const entrie = entries[0];
            const { width, height } = entrie.contentRect;
            const size = Math.min(width, height);
            if (previousSize === size) return;
            previousSize = size;
            const blockSize = Math.floor((size * 0.45) / this.#size);
            this.style.setProperty("--block-size", `${blockSize}px`);
            this.style.setProperty(
                "--cube-start",
                `${(blockSize * this.#size / -2) + (blockSize / 2)}px`,
            );
        });
        this.#resizeObserver.observe(this.#$viewport);
        this.#$viewport.classList.add("viewport");

        const $cubeContain = document.createElement("div");
        $cubeContain.classList.add("cube-contain");

        const $mainCube = document.createElement("div");
        $mainCube.classList.add("main-cube");
        this.#$mainCube = $mainCube;

        const [cubes, cubeGroups] = createCubes(this.#size, this.#state!);
        this.#cubeGroups = cubeGroups;
        $mainCube.append(...cubes);

        $cubeContain.appendChild($mainCube);
        this.#$viewport.appendChild($cubeContain);

        if (!this.#disabledPointerEvents) {
            this.#createPointerEvents();
        }

        this.shadowRoot!.appendChild(this.#$viewport);
    }

    #diposeCube() {
        if (this.#resizeObserver) {
            this.#resizeObserver.disconnect();
            this.#resizeObserver = null;
        }

        this.#$viewport?.remove();
        this.#$viewport = null;
    }

    #createPointerEvents() {
        this.#viewportPointerEvent = (ev) => {
            ev.preventDefault();

            if (this.#isRotating) return;

            this.#isRotating = true;
            const self = this;
            const $target = ev.target as HTMLElement;
            const $closestFace = $target.closest(".face.sticker") as
                | HTMLElement
                | null;

            const viewportRect = this.#$viewport!.getBoundingClientRect();
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

                            self.#$mainCube!.style.setProperty(
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
                        self.#$mainCube!.style.removeProperty(
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
        };
        this.#$viewport!.addEventListener(
            "pointerdown",
            this.#viewportPointerEvent,
        );
    }

    #diposePointerEvents() {
        this.#$viewport!.removeEventListener(
            "pointerdown",
            this.#viewportPointerEvent!,
        );
        this.#viewportPointerEvent = null;
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
            speed = this.#speed,
        }: {
            axis: "x" | "y" | "z";
            layer: number;
            angle: 0 | 90 | 180 | 270 | 360;
            backwards?: boolean;
            from?: number;
            speed?: number;
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

        const evDetail: RotationEventDetail = {
            type: "layer",
            axis,
            layer,
            angle,
            fromAngle: from,
            toAngle: realAngle,
            backwards: backwards,
            speed,
        };

        this.dispatchEvent(beforeRotate(evDetail));
        this.dispatchEvent(beforeLayerRotate(evDetail));

        this.#setCubesToRotate(axis, layer);
        await animateDegCssVar(
            this.style,
            "--spin-angle",
            from,
            realAngle,
            speed * (Math.abs(realAngle - from) / 90),
        );
        this.#resetCubesRotate(axis, layer);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();

        this.dispatchEvent(afterRotate(evDetail));
        this.dispatchEvent(afterLayerRotate(evDetail));
    }

    async #rotateAxisCube(
        {
            axis,
            angle,
            backwards = false,
            from = 0,
            speed = this.#speed,
        }: {
            axis: "x" | "y" | "z";
            angle: 0 | 90 | 180 | 270 | 360;
            backwards?: boolean;
            from?: number;
            speed?: number;
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

        const evDetail: RotationEventDetail = {
            type: "cube",
            axis,
            angle,
            fromAngle: from,
            toAngle: realAngle,
            backwards: backwards,
            speed,
        };

        this.dispatchEvent(beforeRotate(evDetail));
        this.dispatchEvent(beforeCubeRotate(evDetail));

        this.#$mainCube!.style.setProperty(
            `--cube-rotation-${axis}`,
            "var(--spin-angle)",
        );

        await animateDegCssVar(
            this.style,
            "--spin-angle",
            from,
            realAngle,
            speed *
                (Math.abs(realAngle - from) / 90),
        );
        this.#$mainCube!.style.removeProperty(`--cube-rotation-${axis}`);
        this.style.setProperty("--spin-angle", "0deg");
        this.#observableCtx!.tick();

        this.dispatchEvent(afterRotate(evDetail));
        this.dispatchEvent(afterCubeRotate(evDetail));
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

    /**
     * Sets the state of the cube.
     * @param newState The new state of the cube.
     */
    setState(newState: FlatState) {
        setState(this.#state!, newState);
        this.#observableCtx!.tick();
    }

    /**
     * Gets the current state of the cube.
     * @returns The current state of the cube.
     */
    getState(): FlatState {
        return getCurrentState(this.#state!);
    }

    /**
     * Rotates the entire cube.
     * @param params The parameters Object for the rotation.
     * @param params.axis The axis to rotate the cube. Must be "x", "y", or "z".
     * @param params.angle The angle to rotate the cube. Must be 90, 180, 270, or 360.
     * @param params.backwards Whether to rotate the cube backwards. Defaults to false.
     * @param params.speed The speed of the rotation in milliseconds. Defaults to the instance speed.
     * @returns A Promise that resolves when the rotation is complete.
     */
    async rotateCube({
        axis,
        angle,
        backwards = false,
        speed = this.#speed,
    }: CubeRotationOptions): Promise<void> {
        if (["x", "y", "z"].includes(axis) === false) {
            throw new Error(`Invalid axis ${axis}`);
        }
        if ([90, 180, 270, 360].includes(angle) === false) {
            throw new Error(`Invalid angle ${angle}`);
        }
        if (speed <= 0) {
            throw new Error(`Invalid speed ${speed}`);
        }
        await this.#withRotation(
            () =>
                this.#rotateAxisCube({
                    axis,
                    angle,
                    backwards,
                    speed,
                }),
        );
    }

    /**
     * Rotates a layer of the cube.
     * @param params The parameters Object for the rotation.
     * @param params.axis The axis of the layer to rotate. Must be "x", "y", or "z".
     * @param params.layer The index of the layer to rotate. Must be between 0 and the size of the cube.
     * @param params.angle The angle to rotate the layer. Must be 90, 180, 270, or 360.
     * @param params.backwards Whether to rotate the layer backwards. Defaults to false.
     * @param params.speed The speed of the rotation in milliseconds. Defaults to the instance speed.
     * @returns A Promise that resolves when the rotation is complete.
     */
    async rotateLayer({
        axis,
        layer,
        angle,
        backwards = false,
        speed = this.#speed,
    }: LayerRotationOptions): Promise<void> {
        if (["x", "y", "z"].includes(axis) === false) {
            throw new Error(`Invalid axis ${axis}`);
        }
        if ([90, 180, 270, 360].includes(angle) === false) {
            throw new Error(`Invalid angle ${angle}`);
        }
        if (layer < 0 || layer >= this.#size) {
            throw new Error(`Invalid layer ${layer}`);
        }
        if (speed <= 0) {
            throw new Error(`Invalid speed ${speed}`);
        }
        await this.#withRotation(
            () =>
                this.#rotateAxisLayer({
                    axis,
                    layer,
                    angle,
                    backwards,
                    speed,
                }),
        );
    }

    /**
     * The size of the cube.
     * @type {number}
     */
    get size() {
        return this.#size;
    }
}
