/**
 * The main entry point for the web-cube package.
 *
 * This module exports the `WebCube` class, utility functions, and types related to the web-cube package.
 * It also provides a `define` function to register the `WebCube` custom element with a specified tag name.
 *
 * @module
 */

import { WebCube } from "./web-cube.ts";

export { WebCube };

export type { FlatState } from "./state.ts";

export * from "./utils.ts";

/**
 * Registers the `WebCube` custom element with the specified tag name.
 *
 * @param tagName - The tag name to use for the custom element.
 */
export function define(tagName: string = "web-cube"): void {
    globalThis.customElements.define(tagName, WebCube);
}
