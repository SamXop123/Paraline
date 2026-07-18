(function (globalScope) {
  function createRendererLoop({
    renderFrame,
    clearCanvas,
    resetTiming,
    initialHidden = false,
    requestFrame = globalScope.requestAnimationFrame.bind(globalScope),
    cancelFrame = globalScope.cancelAnimationFrame.bind(globalScope)
  }) {
    let animationFrameId = null;
    let hidden = initialHidden;
    let started = false;
    let destroyed = false;

    function scheduleFrame() {
      if (destroyed || !started || hidden || animationFrameId !== null) {
        return;
      }

      let scheduledFrameId = null;
      scheduledFrameId = requestFrame((now) => handleFrame(scheduledFrameId, now));
      animationFrameId = scheduledFrameId;
    }

    function handleFrame(frameId, now) {
      if (animationFrameId !== frameId) {
        return;
      }

      animationFrameId = null;

      if (destroyed || !started || hidden) {
        return;
      }

      renderFrame(now);
      scheduleFrame();
    }

    function cancelPendingFrame() {
      if (animationFrameId === null) {
        return;
      }

      cancelFrame(animationFrameId);
      animationFrameId = null;
    }

    return {
      start() {
        if (destroyed || started) {
          return;
        }

        started = true;
        scheduleFrame();
      },

      setHidden(nextHidden) {
        const normalizedHidden = Boolean(nextHidden);
        if (destroyed || normalizedHidden === hidden) {
          return;
        }

        hidden = normalizedHidden;
        if (hidden) {
          cancelPendingFrame();
          clearCanvas();
          return;
        }

        resetTiming();
        scheduleFrame();
      },

      destroy() {
        if (destroyed) {
          return;
        }

        destroyed = true;
        started = false;
        cancelPendingFrame();
      }
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createRendererLoop };
  } else {
    globalScope.createRendererLoop = createRendererLoop;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
