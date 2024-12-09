export function animateDegCssVar(
  style: CSSStyleDeclaration,
  varName: string,
  from: number,
  to: number,
  duration: number,
) {
  const start = performance.now();
  const animation = new Promise<void>((resolve) => {
    const step = (timestamp: number) => {
      const progress = timestamp - start;
      style.setProperty(
        varName,
        `${from + (to - from) * Math.min(progress / duration, 1)}deg`,
      );
      if (progress < duration) {
        requestAnimationFrame(step);
      } else {
        style.setProperty(varName, `${to}deg`);
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
  return animation;
}
