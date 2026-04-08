function easeInOutCubic(progress: number): number {
  if (progress < 0.5) {
    return 4 * progress * progress * progress;
  }
  return 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function animateDegCssVar(
  style: CSSStyleDeclaration,
  varName: string,
  from: number,
  to: number,
  duration: number,
  options?: {
    signal?: AbortSignal;
    easing?: (progress: number) => number;
  },
) {
  const { signal, easing = easeInOutCubic } = options ?? {};

  if (signal?.aborted) {
    return Promise.resolve();
  }

  if (duration <= 0) {
    style.setProperty(varName, `${to}deg`);
    return Promise.resolve();
  }

  const start = performance.now();
  const animation = new Promise<void>((resolve) => {
    let rafId = 0;

    const handleAbort = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    };

    signal?.addEventListener("abort", handleAbort, { once: true });

    const step = (timestamp: number) => {
      if (signal?.aborted) {
        handleAbort();
        return;
      }

      const progress = timestamp - start;
      const normalizedProgress = Math.min(progress / duration, 1);
      const easedProgress = easing(normalizedProgress);

      style.setProperty(
        varName,
        `${from + (to - from) * easedProgress}deg`,
      );

      if (progress < duration) {
        rafId = requestAnimationFrame(step);
      } else {
        signal?.removeEventListener("abort", handleAbort);
        style.setProperty(varName, `${to}deg`);
        resolve();
      }
    };

    rafId = requestAnimationFrame(step);
  });

  return animation;
}
