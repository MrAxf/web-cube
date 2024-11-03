# Web Cube

Web Cube is a JavaScript package for creating and manipulating cubes in web
applications. This package provides a simple and efficient API for working with
three-dimensional cubes, allowing rotations, transformations, and rendering in a
web environment.

## Features

- Create three-dimensional cubes.
- Apply rotations and transformations.
- Efficient rendering in the browser.
- Simple and easy-to-use API.

## Installation

You can install the package using npm:

```bash
npm install @web-cube/webcube
```

or from JSR with Deno:

```bash
deno add jsr:@web-cube/webcube
```

or NPM:

```bash
npx jsr add @web-cube/webcube
```

## Quickstart

Here's a simple example to get you started:

Add a JS file with the following

```javascript
import { define } from "@web-cube/webcube";

define();
```

and a HTML with:

```html
<web-cube></web-cube>
```

Also you can specify the size with the `size` attribute:

```html
<web-cube size="4"></web-cube>
```
