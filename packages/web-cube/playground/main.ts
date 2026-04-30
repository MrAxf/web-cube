/// <reference types="vite/client" />

import { define, WebCube } from "../src/index";
import "./styles.css";

define();

type Axis = "x" | "y" | "z";
type Angle = 90 | 180 | 270 | 360;
type FaceName = "background" | "front" | "right" | "back" | "left" | "up" | "down";

type PaletteVariant = {
  background: string;
  front: string;
  right: string;
  back: string;
  left: string;
  up: string;
  down: string;
};

type PaletteSet = {
  light: PaletteVariant;
  dark: PaletteVariant;
};

const STORAGE_KEYS = {
  theme: "web-cube-playground-theme",
  size: "web-cube-playground-size",
  speed: "web-cube-playground-speed",
  palette: "web-cube-playground-palette",
  orientationArrows: "web-cube-playground-orientation-arrows",
};

const ORIENTATION_ARROW_STYLE_ID = "playground-orientation-arrows";

const ORIENTATION_ARROW_STYLE = /* css */ `
.sticker::before {
  content: "";
  display: block;
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  width: 34%;
  height: 48%;
  background: color-mix(in oklab, var(--sticker-color), black 38%);
  clip-path: polygon(50% 0, 100% 38%, 70% 38%, 70% 100%, 30% 100%, 30% 38%, 0 38%);
  opacity: 0.28;
  pointer-events: none;
  transform: translate(-50%, -50%) rotate(var(--sticker-rotation, 0deg));
  transform-origin: center;
}

.sticker[data-face="1"]::before {
  transform: translate(-50%, -50%) rotate(calc(180deg + var(--sticker-rotation, 0deg)));
}
`;

const PALETTES: Record<string, PaletteSet> = {
  classic: {
    light: {
      background: "#242424",
      front: "#ffffff",
      right: "#009A44",
      back: "#FFD700",
      left: "#003DA5",
      up: "#BA0C2F",
      down: "#FE5000",
    },
    dark: {
      background: "#0f1317",
      front: "#f5f5f5",
      right: "#2de27a",
      back: "#ffd54d",
      left: "#4d84ff",
      up: "#ff5f74",
      down: "#ff9f58",
    },
  },
  pastel: {
    light: {
      background: "#2f343d",
      front: "#fff2d9",
      right: "#b7f3cf",
      back: "#ffe3b0",
      left: "#c6d7ff",
      up: "#ffc3ce",
      down: "#ffd7bc",
    },
    dark: {
      background: "#10161d",
      front: "#fef2dd",
      right: "#9df8c4",
      back: "#ffd08a",
      left: "#a9c2ff",
      up: "#ffaab9",
      down: "#ffc299",
    },
  },
  signal: {
    light: {
      background: "#111111",
      front: "#f8f8f8",
      right: "#09ef80",
      back: "#ffe100",
      left: "#2b6dff",
      up: "#ff3855",
      down: "#ff8f1f",
    },
    dark: {
      background: "#06090e",
      front: "#f7fbff",
      right: "#25ff9f",
      back: "#fff06b",
      left: "#5f90ff",
      up: "#ff6a80",
      down: "#ffad53",
    },
  },
};

const COLOR_FACES: FaceName[] = [
  "background",
  "front",
  "right",
  "back",
  "left",
  "up",
  "down",
];

const $html = document.documentElement;
const $controls = document.getElementById("controls") as HTMLDivElement;
const $webCube = document.getElementById("cube") as WebCube;
const $themeToggle = document.getElementById("theme-toggle") as HTMLButtonElement;
const $sizeInput = document.getElementById("size-input") as HTMLInputElement;
const $sizeValue = document.getElementById("size-value") as HTMLOutputElement;
const $speedInput = document.getElementById("speed-input") as HTMLInputElement;
const $speedValue = document.getElementById("speed-value") as HTMLOutputElement;
const $paletteSelect = document.getElementById("palette-select") as HTMLSelectElement;
const $orientationArrows = document.getElementById("orientation-arrows") as HTMLInputElement;
const $resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const $layerAxis = document.getElementById("layer-axis") as HTMLSelectElement;
const $layerIndex = document.getElementById("layer-index") as HTMLSelectElement;
const $layerAngle = document.getElementById("layer-angle") as HTMLSelectElement;
const $layerBackwards = document.getElementById("layer-backwards") as HTMLInputElement;
const $rotateLayerBtn = document.getElementById("rotate-layer-btn") as HTMLButtonElement;
const $advancedLayerControls = document.getElementById("advanced-layer-controls") as HTMLDivElement;

let initialState = $webCube.getState();

function getCurrentTheme(): "light" | "dark" {
  return $html.dataset.theme === "dark" ? "dark" : "light";
}

function getSavedPalette(): string {
  const saved = localStorage.getItem(STORAGE_KEYS.palette);
  if (saved && Object.hasOwn(PALETTES, saved)) {
    return saved;
  }
  return "classic";
}

function updateControlLock() {
  const isBusy = $webCube.isRotating;
  const $$buttons = $controls.querySelectorAll("button");
  $$buttons.forEach(($button) => {
    if ($button.id === "theme-toggle") {
      return;
    }
    $button.disabled = isBusy;
  });
}

async function runRotationTask(action: () => Promise<void>) {
  if ($webCube.isRotating) {
    return;
  }
  updateControlLock();
  try {
    await action();
  } finally {
    updateControlLock();
  }
}

function setTheme(theme: "light" | "dark") {
  $html.dataset.theme = theme;
  $themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  $themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function setCubeColor(face: FaceName, color: string) {
  $webCube.setAttribute(`color-${face}`, color);
  const $input = document.getElementById(`color-${face}`) as HTMLInputElement | null;
  if ($input && $input.value.toLowerCase() !== color.toLowerCase()) {
    $input.value = color;
  }
}

function applyPalette(name: string) {
  if (!Object.hasOwn(PALETTES, name)) {
    return;
  }
  const currentTheme = getCurrentTheme();
  const palette = PALETTES[name][currentTheme];
  COLOR_FACES.forEach((face) => {
    setCubeColor(face, palette[face]);
  });
  $paletteSelect.value = name;
  localStorage.setItem(STORAGE_KEYS.palette, name);
}

function setPaletteCustom() {
  $paletteSelect.value = "custom";
  localStorage.setItem(STORAGE_KEYS.palette, "custom");
}

function setOrientationArrows(enabled: boolean) {
  $orientationArrows.checked = enabled;
  localStorage.setItem(STORAGE_KEYS.orientationArrows, enabled ? "true" : "false");

  const shadowRoot = $webCube.shadowRoot;
  if (!shadowRoot) return;

  const $existingStyle = shadowRoot.getElementById(ORIENTATION_ARROW_STYLE_ID);
  if (!enabled) {
    $existingStyle?.remove();
    return;
  }

  if ($existingStyle) return;

  const $style = document.createElement("style");
  $style.id = ORIENTATION_ARROW_STYLE_ID;
  $style.textContent = ORIENTATION_ARROW_STYLE;
  shadowRoot.appendChild($style);
}

function refreshLayerOptions() {
  const size = Number.parseInt($sizeInput.value, 10);
  const selectedLayer = Number.parseInt($layerIndex.value || "0", 10);

  $layerIndex.innerHTML = "";
  for (let layer = 0; layer < size; layer += 1) {
    const $option = document.createElement("option");
    $option.value = String(layer);
    $option.textContent = `Layer ${layer}`;
    $layerIndex.appendChild($option);
  }

  const nextLayer = Number.isNaN(selectedLayer)
    ? 0
    : Math.min(selectedLayer, Math.max(0, size - 1));
  $layerIndex.value = String(nextLayer);
}

function createAdvancedLayerButton(axis: Axis, layer: number, angle: number): HTMLButtonElement {
  const $button = document.createElement("button");
  $button.type = "button";
  $button.dataset.layerBtn = "";
  $button.dataset.axis = axis;
  $button.dataset.layer = String(layer);
  $button.dataset.angle = String(angle);
  $button.textContent = `${axis.toUpperCase()} L${layer} ${angle > 0 ? "+" : ""}${angle}`;
  return $button;
}

function renderAdvancedLayerControls() {
  const size = Number.parseInt($sizeInput.value, 10);
  $advancedLayerControls.innerHTML = "";

  (["x", "y", "z"] as Axis[]).forEach((axis) => {
    const $group = document.createElement("section");
    $group.className = "advanced-axis-group";
    const $title = document.createElement("strong");
    $title.textContent = `Axis ${axis.toUpperCase()}`;
    const $grid = document.createElement("div");
    $grid.className = "button-grid";

    for (let layer = 0; layer < size; layer += 1) {
      [90, -90, 180, -180].forEach((angle) => {
        $grid.appendChild(createAdvancedLayerButton(axis, layer, angle));
      });
    }

    $group.appendChild($title);
    $group.appendChild($grid);
    $advancedLayerControls.appendChild($group);
  });
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const initialTheme = savedTheme === "dark" ? "dark" : "light";
  setTheme(initialTheme);

  $themeToggle.addEventListener("click", () => {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if ($paletteSelect.value !== "custom") {
      applyPalette($paletteSelect.value);
    }
  });
}

function initPropertyControls() {
  const savedSize = localStorage.getItem(STORAGE_KEYS.size);
  const savedSpeed = localStorage.getItem(STORAGE_KEYS.speed);
  const savedOrientationArrows = localStorage.getItem(STORAGE_KEYS.orientationArrows);

  const size = Math.max(1, Math.min(7, Number.parseInt(savedSize ?? "3", 10) || 3));
  const speed = Math.max(100, Math.min(1000, Number.parseInt(savedSpeed ?? "500", 10) || 500));

  $sizeInput.value = String(size);
  $speedInput.value = String(speed);
  $sizeValue.textContent = String(size);
  $speedValue.textContent = `${speed}ms`;

  $webCube.setAttribute("size", String(size));
  $webCube.setAttribute("speed", String(speed));
  setOrientationArrows(savedOrientationArrows !== "false");
  initialState = $webCube.getState();

  $sizeInput.addEventListener("input", () => {
    const newSize = Number.parseInt($sizeInput.value, 10);
    $sizeValue.textContent = String(newSize);
    $webCube.setAttribute("size", String(newSize));
    localStorage.setItem(STORAGE_KEYS.size, String(newSize));
    refreshLayerOptions();
    renderAdvancedLayerControls();
    initialState = $webCube.getState();
  });

  $speedInput.addEventListener("input", () => {
    const newSpeed = Number.parseInt($speedInput.value, 10);
    $speedValue.textContent = `${newSpeed}ms`;
    $webCube.setAttribute("speed", String(newSpeed));
    localStorage.setItem(STORAGE_KEYS.speed, String(newSpeed));
  });

  $orientationArrows.addEventListener("change", () => {
    setOrientationArrows($orientationArrows.checked);
  });
}

function initColorControls() {
  const $$colorInputs = document.querySelectorAll<HTMLInputElement>("[data-color-input]");
  $$colorInputs.forEach(($input) => {
    $input.addEventListener("input", () => {
      const face = $input.id.replace("color-", "") as FaceName;
      setCubeColor(face, $input.value);
      setPaletteCustom();
    });
  });
}

function initPaletteControl() {
  const initialPalette = getSavedPalette();
  applyPalette(initialPalette);

  $paletteSelect.addEventListener("change", () => {
    if ($paletteSelect.value === "custom") {
      setPaletteCustom();
      return;
    }
    applyPalette($paletteSelect.value);
  });
}

function initCubeRotationControls() {
  const $$cubeButtons = $controls.querySelectorAll<HTMLButtonElement>("button[data-cube-btn]");
  $$cubeButtons.forEach(($button) => {
    $button.addEventListener("click", async () => {
      const axis = $button.dataset.axis as Axis;
      const rawAngle = Number.parseInt($button.dataset.angle || "90", 10);
      const angle = Math.abs(rawAngle) as Angle;
      const backwards = rawAngle < 0;
      const speed = Number.parseInt($speedInput.value, 10);

      await runRotationTask(() =>
        $webCube.rotateCube({
          axis,
          angle,
          backwards,
          speed,
        }),
      );
    });
  });
}

function initLayerRotationControls() {
  refreshLayerOptions();
  renderAdvancedLayerControls();

  $rotateLayerBtn.addEventListener("click", async () => {
    const axis = $layerAxis.value as Axis;
    const layer = Number.parseInt($layerIndex.value, 10);
    const angle = Number.parseInt($layerAngle.value, 10) as Angle;
    const backwards = $layerBackwards.checked;
    const speed = Number.parseInt($speedInput.value, 10);

    await runRotationTask(() =>
      $webCube.rotateLayer({
        axis,
        layer,
        angle,
        backwards,
        speed,
      }),
    );
  });

  $advancedLayerControls.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const $button = target.closest("button[data-layer-btn]") as HTMLButtonElement | null;
    if (!$button) {
      return;
    }

    const axis = $button.dataset.axis as Axis;
    const layer = Number.parseInt($button.dataset.layer || "0", 10);
    const rawAngle = Number.parseInt($button.dataset.angle || "90", 10);
    const angle = Math.abs(rawAngle) as Angle;
    const backwards = rawAngle < 0;
    const speed = Number.parseInt($speedInput.value, 10);

    await runRotationTask(() =>
      $webCube.rotateLayer({
        axis,
        layer,
        angle,
        backwards,
        speed,
      }),
    );
  });
}

function initResetControl() {
  $resetBtn.addEventListener("click", () => {
    if ($webCube.isRotating) {
      return;
    }
    $webCube.setState(initialState);
  });
}

function init() {
  initTheme();
  initPropertyControls();
  initPaletteControl();
  initColorControls();
  initCubeRotationControls();
  initLayerRotationControls();
  initResetControl();
  updateControlLock();
}

init();
