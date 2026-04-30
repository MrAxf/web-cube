# Web Cube

Web Cube is a web component for rendering and manipulating a 3D Rubik's cube.
It supports pointer interaction, programmatic rotations, state management, and
event hooks for advanced integrations.

## Features

- Interactive 3D Rubik's cube element.
- Programmatic API for cube and layer rotations.
- State management with `getState` and `setState`, including persistent sticker orientation.
- Rotation and state-change custom events.
- Works with npm and JSR.
- TypeScript types included.

## Installation

```bash
# npm
npm install @web-cube/web-cube

# JSR (Deno)
deno add jsr:@web-cube/web-cube

# JSR (Node.js)
npx jsr add @web-cube/web-cube
```

## Quick Start

```ts
import { define } from "@web-cube/web-cube";

define();
```

```html
<web-cube size="3"></web-cube>
```

```css
web-cube {
	display: block;
	width: min(460px, 100%);
	height: 460px;
}
```

## Programmatic Control

```ts
import { WebCube } from "@web-cube/web-cube";

const cube = document.querySelector("web-cube") as WebCube;

await cube.rotateCube({ axis: "x", angle: 90 });
await cube.rotateLayer({ axis: "y", layer: 0, angle: 180 });

const state = cube.getState();
cube.setState(state);
```

`getState()` includes an optional `rotations` field that stores each visible
sticker orientation as `0`, `90`, `180`, or `270`. Passing that state back to
`setState()` preserves sticker orientation between moves. Passing a color-only
state resets sticker orientations to `0`.

## Events

```ts
cube.addEventListener("web-cube:state-changed", (event) => {
	console.log(event.detail.state);
});

cube.addEventListener("web-cube:after-rotate", (event) => {
	console.log(event.detail.type, event.detail.axis, event.detail.angle);
});
```

Available events:

- `web-cube:before-rotate`
- `web-cube:after-rotate`
- `web-cube:before-cube-rotate`
- `web-cube:after-cube-rotate`
- `web-cube:before-layer-rotate`
- `web-cube:after-layer-rotate`
- `web-cube:state-changed`

## Main Attributes

- `size`: cube dimension. Default `3`.
- `speed`: animation speed in ms. Default `500`.
- `disabled-pointer-events`: disables drag interactions.
- `color-background`, `color-front`, `color-right`, `color-back`, `color-left`, `color-up`, `color-down`.

## Documentation

- Full docs: https://web-rubik-docs.pages.dev/docs

## License

MIT
