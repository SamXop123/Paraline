"use client";

export interface OptimizedCanvasOptions {
  canvas: HTMLCanvasElement;
  onRender: (ctx: CanvasRenderingContext2D, width: number, height: number, deltaTime: number, time: number) => void;
  onResize?: (width: number, height: number, dpr: number) => void;
  active?: boolean;
  idleFps?: number; // default: 30 fps
}

/**
 * High-performance canvas runner for visualizers.
 * - Eliminates layout thrashing: 0 getBoundingClientRect() calls in the render loop
 * - Viewport culling: completely pauses rAF loop when off-screen via IntersectionObserver
 * - Tab visibility culling: pauses when document is hidden
 * - Idle throttling: caps unhovered/idle previews to 30 FPS while allowing 60+ FPS on hover
 * - DPR clamp: caps devicePixelRatio to 2 to prevent GPU fill-rate exhaustion on 3x/4x displays
 */
export function setupOptimizedCanvas({
  canvas,
  onRender,
  onResize,
  active = true,
  idleFps = 30,
}: OptimizedCanvasOptions): () => void {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};

  let animationFrameId: number | null = null;
  let isIntersecting = false;
  let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
  let lastTime = performance.now();
  let lastFrameTime = 0;
  let elapsedVirtualTime = 0;

  let currentWidth = 0;
  let currentHeight = 0;
  let currentDpr = 1;

  // Max DPR capped at 2 for performance on high-density screens
  const getDpr = () => typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const updateSize = (w: number, h: number) => {
    if (w <= 0 || h <= 0) return;
    const dpr = getDpr();
    const pixelWidth = Math.floor(w * dpr);
    const pixelHeight = Math.floor(h * dpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight || currentDpr !== dpr) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      currentDpr = dpr;
      currentWidth = w;
      currentHeight = h;
      onResize?.(w, h, dpr);
    } else {
      currentWidth = w;
      currentHeight = h;
    }
  };

  // Initial sizing
  const initialRect = canvas.getBoundingClientRect();
  if (initialRect.width > 0 && initialRect.height > 0) {
    updateSize(initialRect.width, initialRect.height);
  }

  // Check initial visibility
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  if (initialRect.bottom > -150 && initialRect.top < viewportH + 150) {
    isIntersecting = true;
  }

  const renderLoop = (now: number) => {
    if (!isIntersecting || !isTabVisible) {
      animationFrameId = null;
      return;
    }

    // Frame rate pacing: throttle unhovered cards to idleFps (~30 FPS)
    const targetInterval = active ? 0 : 1000 / idleFps;
    if (targetInterval > 0 && now - lastFrameTime < targetInterval) {
      animationFrameId = requestAnimationFrame(renderLoop);
      return;
    }

    const deltaTime = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    lastFrameTime = now;
    elapsedVirtualTime += deltaTime;

    if (currentWidth > 0 && currentHeight > 0) {
      onRender(ctx, currentWidth, currentHeight, deltaTime, elapsedVirtualTime);
    }

    animationFrameId = requestAnimationFrame(renderLoop);
  };

  const startLoop = () => {
    if (animationFrameId === null && isIntersecting && isTabVisible) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(renderLoop);
    }
  };

  const stopLoop = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  // 1. ResizeObserver: tracks dimension changes without getBoundingClientRect in rAF
  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize && entry.contentBoxSize[0]) {
          updateSize(entry.contentBoxSize[0].inlineSize, entry.contentBoxSize[0].blockSize);
        } else {
          updateSize(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });
    resizeObserver.observe(canvas);
  }

  // 2. IntersectionObserver: halts loop when offscreen (150px buffer pre-warms)
  let intersectionObserver: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { rootMargin: "150px" }
    );
    intersectionObserver.observe(canvas);
  }

  // 3. Tab Visibility listener
  const handleVisibilityChange = () => {
    isTabVisible = !document.hidden;
    if (isTabVisible && isIntersecting) {
      startLoop();
    } else {
      stopLoop();
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Start immediately if visible
  startLoop();

  // Cleanup
  return () => {
    stopLoop();
    if (resizeObserver) resizeObserver.disconnect();
    if (intersectionObserver) intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
