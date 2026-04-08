import { bench, describe } from "vitest";
import { createObservableContext } from "../src/observable.ts";

// ─── Creation cost ────────────────────────────────────────────────────────────

describe("observableOf – creation", () => {
  bench("create 10 observables", () => {
    const { observableOf } = createObservableContext();
    for (let i = 0; i < 10; i++) observableOf(i);
  });

  bench("create 54 observables (3×3 cube face cells)", () => {
    const { observableOf } = createObservableContext();
    for (let i = 0; i < 54; i++) observableOf(i);
  });

  bench("create 150 observables (5×5 cube face cells)", () => {
    const { observableOf } = createObservableContext();
    for (let i = 0; i < 150; i++) observableOf(i);
  });
});

// ─── tick() – flush dirty observables ─────────────────────────────────────────

describe("tick – flush dirty observables", () => {
  bench("tick with 10 dirty observables", () => {
    const ctx = createObservableContext();
    const obs = Array.from({ length: 10 }, (_, i) => ctx.observableOf(i));
    obs.forEach((o, i) => { o.value = i + 1; });
    ctx.tick();
  });

  bench("tick with 54 dirty observables", () => {
    const ctx = createObservableContext();
    const obs = Array.from({ length: 54 }, (_, i) => ctx.observableOf(i));
    obs.forEach((o, i) => { o.value = i + 1; });
    ctx.tick();
  });

  bench("tick with 150 dirty observables", () => {
    const ctx = createObservableContext();
    const obs = Array.from({ length: 150 }, (_, i) => ctx.observableOf(i));
    obs.forEach((o, i) => { o.value = i + 1; });
    ctx.tick();
  });
});

// ─── subscribe + notify cycle ─────────────────────────────────────────────────

describe("subscribe + notify cycle", () => {
  bench("1 subscriber, 54 observables changed + tick", () => {
    const ctx = createObservableContext();
    const obs = Array.from({ length: 54 }, (_, i) => ctx.observableOf(i));
    // subscribe each observable to a no-op listener
    obs.forEach((o) => { o.subscribe(() => {}); });
    // dirty all of them, then flush
    obs.forEach((o, i) => { o.value = i + 1; });
    ctx.tick();
  });

  bench("3 subscribers per observable, 54 observables changed + tick", () => {
    const ctx = createObservableContext();
    const obs = Array.from({ length: 54 }, (_, i) => ctx.observableOf(i));
    obs.forEach((o) => {
      o.subscribe(() => {});
      o.subscribe(() => {});
      o.subscribe(() => {});
    });
    obs.forEach((o, i) => { o.value = i + 1; });
    ctx.tick();
  });
});
