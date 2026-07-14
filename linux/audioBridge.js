const child_process = require("child_process");

function findAudioCaptureUtility() {
  try {
    child_process.execSync("which parec", { stdio: "ignore" });
    return {
      command: "parec",
      args: ["-d", "@DEFAULT_MONITOR@", "--format=s16le", "--channels=2", "--rate=44100", "--raw"]
    };
  } catch {
    try {
      child_process.execSync("which pw-record", { stdio: "ignore" });
      return {
        command: "pw-record",
        args: ["-P", "{ stream.capture.sink=true }", "--format=s16", "--channels=2", "--rate=44100", "--raw", "-"]
      };
    } catch {
      return null;
    }
  }
}

function createAudioBridge(sendLevel, onStatusChange = () => {}, sendColors = () => {}) {
  let helperProcess = null;
  let helperStatus = {
    mode: "simulated",
    reason: "Helper not started yet."
  };

  let audioBuffer = Buffer.alloc(0);
  let lastLevel = 0;
  let intervalId = null;

  function updateStatus(nextStatus) {
    if (helperStatus.mode === nextStatus.mode && helperStatus.reason === nextStatus.reason) {
      return false;
    }
    helperStatus = nextStatus;
    onStatusChange(helperStatus);
    return true;
  }

  function start() {
    stop();

    const config = findAudioCaptureUtility();
    if (!config) {
      updateStatus({
        mode: "simulated",
        reason: "Neither 'parec' nor 'pw-record' found. Please install pulseaudio-utils or pipewire-utils."
      });
      return;
    }

    try {
      helperProcess = child_process.spawn(config.command, config.args, {
        stdio: ["ignore", "pipe", "pipe"]
      });

      updateStatus({
        mode: "helper",
        reason: `Linux audio capture active using ${config.command}.`
      });

      helperProcess.stdout.on("data", (chunk) => {
        audioBuffer = Buffer.concat([audioBuffer, chunk]);
        // Safety limit to prevent memory leak
        if (audioBuffer.length > 256 * 1024) {
          audioBuffer = audioBuffer.subarray(audioBuffer.length - 256 * 1024);
        }
      });

      helperProcess.stderr.on("data", (chunk) => {
        const errStr = chunk.toString().trim();
        console.error(`[AudioBridge] Stderr: ${errStr}`);
      });

      helperProcess.on("error", (err) => {
        console.error("[AudioBridge] Process error:", err);
        updateStatus({
          mode: "helper-error",
          reason: `Audio bridge process error: ${err.message}`
        });
      });

      helperProcess.on("exit", (code) => {
        console.log(`[AudioBridge] Process exited with code ${code}`);
        helperProcess = null;
        if (helperStatus.mode === "helper") {
          updateStatus({
            mode: "simulated",
            reason: `Audio bridge exited (code ${code}).`
          });
        }
      });

      // Start the 33ms level calculator interval
      intervalId = setInterval(() => {
        const bytesAvailable = audioBuffer.length;
        // 16-bit stereo = 2 channels * 2 bytes = 4 bytes per frame
        const frames = Math.floor(bytesAvailable / 4);

        if (frames > 0) {
          const processLength = frames * 4;
          const processBuffer = audioBuffer.subarray(0, processLength);
          audioBuffer = audioBuffer.subarray(processLength);

          let sumSquares = 0;
          const sampleCount = frames * 2; // Left + Right samples
          for (let i = 0; i < processLength; i += 2) {
            const sample = processBuffer.readInt16LE(i) / 32768.0;
            sumSquares += sample * sample;
          }

          lastLevel = Math.sqrt(sumSquares / sampleCount);
        } else {
          // Decay level if no samples received
          lastLevel *= 0.92;
        }

        const level = Math.max(0, Math.min(1, lastLevel));
        sendLevel(level);
      }, 33);

    } catch (err) {
      console.error("[AudioBridge] Start failed:", err);
      updateStatus({
        mode: "helper-error",
        reason: `Failed to start audio capture: ${err.message}`
      });
    }
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (helperProcess) {
      helperProcess.kill();
      helperProcess = null;
    }
    audioBuffer = Buffer.alloc(0);
    lastLevel = 0;
    updateStatus({
      mode: "simulated",
      reason: "Helper stopped."
    });
  }

  function getStatus() {
    return helperStatus;
  }

  return {
    start,
    stop,
    getStatus
  };
}

module.exports = {
  createAudioBridge
};
