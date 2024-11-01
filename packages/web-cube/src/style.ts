export const style = `
:host {
    --cube-size: 2;
    --block-size: 150px;
    --cube-start: -150px;

    --color-background: #242424;
    --color-up: #BA0C2F;
    --color-down: #FE5000;
    --color-front: #ffffff;
    --color-back: #FFD700;
    --color-left: #003DA5;
    --color-right: #009A44;

    --cube-rotation-x: 0deg;
    --cube-rotation-y: 0deg;
    --cube-rotation-z: 0deg;

    --spin-angle: 0deg;

    touch-action: none;

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
}`