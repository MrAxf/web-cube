import { FlatState } from "./state.ts";

export type RotationTrigger =
  | "pointer-event"
  | "function-call"

export type RotationEventDetail =
  | {
      type: "cube";
      axis: "x" | "y" | "z";
      angle: number;
      fromAngle: number;
      toAngle: number;
      backwards: boolean;
      speed: number;
      triggeredBy: RotationTrigger;
    }
  | {
      type: "layer";
      axis: "x" | "y" | "z";
      layer: number;
      angle: number;
      fromAngle: number;
      toAngle: number;
      backwards: boolean;
      speed: number;
      triggeredBy: RotationTrigger;
    };

/**
 * The event for a rotation.
 */
export type RotationEvent = CustomEvent<RotationEventDetail>;

/**
 * The event for a state change.
 */
export type StateChangeEvent = CustomEvent<{ state: FlatState }>;

function createRotationEvent(
  name: string,
  detail: RotationEventDetail,
): RotationEvent {
  return new CustomEvent(name, { detail });
}

export const beforeRotate = (detail: RotationEventDetail) =>
  createRotationEvent("web-cube:before-rotate", detail);
export const afterRotate = (detail: RotationEventDetail) =>
  createRotationEvent("web-cube:after-rotate", detail);
export const beforeCubeRotate = (detail: RotationEventDetail) =>
  createRotationEvent("web-cube:before-cube-rotate", detail);
export const afterCubeRotate = (detail: RotationEventDetail) =>
  createRotationEvent("web-cube:after-cube-rotate", detail);
export const beforeLayerRotate = (detail: RotationEventDetail) =>
  createRotationEvent("web-cube:before-layer-rotate", detail);
export const afterLayerRotate = (detail: RotationEventDetail) =>
  createRotationEvent("web-cube:after-layer-rotate", detail);

export const stateChanged = () => new CustomEvent("web-cube:state-changed");
