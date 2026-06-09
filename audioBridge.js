const { app } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function createAudioBridge(sendLevel, onStatusChange = () => {}) {
  let helperProcess = null;

  let helperStatus = {
    mode: "simulated",
    reason: "Helper not started yet."
  };

  // NEW: Parse error recovery variables
  let parseErrorCount = 0;
  const MAX_PARSE_ERRORS = 3;

  // NEW: Restart retry tracking
  let restartAttempts = 0;
  const MAX_RESTART_ATTEMPTS = 3;
  let lastStatusUpdate = 0;

  let retryCount = 0;
  const MAX_IMMEDIATE_RETRIES = 3;
  const MAX_TOTAL_RETRIES = 10;
  const INITIAL_RETRY_DELAY = 2000; // 2 seconds
  const MAX_RETRY_DELAY = 30000; // 30 seconds
  const RECOVERY_CHECK_INTERVAL = 60000; // 1 minute
  const SUCCESS_RESET_THRESHOLD = 30000; // Reset retry count after 30s of success

  let helperReady = false;
  let stdoutBuffer = "";
  const MAX_STDOUT_BUFFER_BYTES = 64 * 1024;
  let isStopping = false;
  let recoveryTimer = null;
  let successStartTime = null;

  function updateStatus(nextStatus) {
    if (
      helperStatus.mode === nextStatus.mode &&
      helperStatus.reason === nextStatus.reason
    ) {
      return false;
    }

    helperStatus = nextStatus;
    onStatusChange(helperStatus);
    return true;
  }

  function findHelperBinary() {
    const appPath = app.getAppPath();

    const candidates = [
      path.join(
        process.resourcesPath,
        "audio-helper",
        "Paraline.AudioBridge.exe"
      ),
      path.join(
        appPath,
        "build",
        "audio-helper",
        "Paraline.AudioBridge.exe"
      ),
      path.join(
        appPath,
        "audio-helper",
        "bin",
        "Release",
        "net8.0-windows",
        "win-x64",
        "publish",
        "Paraline.AudioBridge.exe"
      ),
      path.join(
        appPath,
        "audio-helper",
        "bin",
        "Debug",
        "net8.0-windows",
        "Paraline.AudioBridge.exe"
      ),
      path.join(
        appPath,
        "audio-helper",
        "bin",
        "Release",
        "net8.0-windows",
        "Paraline.AudioBridge.exe"
      )
    ];

    return (
      candidates.find((candidatePath) =>
        fs.existsSync(candidatePath)
      ) || null
    );
  }

  // NEW: Automatic helper restart logic
  function restartHelper(reason = "Unknown error") {
    if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
      updateStatus({
        mode: "simulated",
        reason: [
          "Helper recovery failed after multiple restart attempts.",
          "\n",
          `Last reason: ${reason}`
        ].join("")
      });

      return;
    }

    restartAttempts++;

    if (helperProcess) {
      helperProcess.kill();
      helperProcess = null;
    }

    updateStatus({
      mode: "helper-restarting",
      reason: `Restarting audio helper (${restartAttempts}/${MAX_RESTART_ATTEMPTS})...`
    });

    setTimeout(() => {
      start();
    }, 1500);
    return candidates.find((p) => fs.existsSync(p)) || null;
  }

  function start() {
    const helperBinary = findHelperBinary();

    if (!helperBinary) {
      updateStatus({
        mode: "simulated",
        reason:
          "Audio capture helper not found.\n" +
          "- Build C# helper first\n" +
          "- Or run npm run build:helper"
      });

      return;
    }

    isStopping = false;
    helperReady = false;
    stdoutBuffer = "";

    helperProcess = spawn(helperBinary, [], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });

    helperProcess.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();

      if (stdoutBuffer.length > MAX_STDOUT_BUFFER_BYTES) {
        stdoutBuffer = "";
        console.warn("stdout buffer cleared due to overflow");
        return;
      }

      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const message = JSON.parse(line);

          // RESET counters after successful parsing
          parseErrorCount = 0;
          restartAttempts = 0;

          if (
            message.type === "level" &&
            typeof message.value === "number"
          ) {
            sendLevel(message.value);
          }
        } catch (_error) {
          // NEW: Controlled parse error handling
          parseErrorCount++;

          updateStatus({
            mode: "helper-warning",
            reason: [
              `Invalid helper output detected (${parseErrorCount}/${MAX_PARSE_ERRORS}).`,
              "\n",
              "Attempting automatic recovery..."
            ].join("")
          });

          // Restart helper after threshold exceeded
          if (parseErrorCount >= MAX_PARSE_ERRORS) {
            restartHelper(
              "Too many malformed helper messages."
            );
          }
          if (!helperReady) {
            helperReady = true;
            retryCount = 0;
            successStartTime = Date.now();
            clearRecoveryTimer();

            updateStatus({
              mode: "helper",
              reason: "C# helper process connected."
            });
          } else {
            // Reset retry count if helper has been stable
            resetRetryCountOnSuccess();
          }

          if (message.type === "level" && typeof message.value === "number") {
            sendLevel(message.value);
          }
        } catch {
          console.warn("Invalid helper message received");
        }
      }
    });

    helperProcess.stderr.on("data", (chunk) => {
      const errorMessage = chunk.toString().trim();
      console.error(errorMessage);

      const now = Date.now();

      if (now - lastStatusUpdate < 1000) return;

      lastStatusUpdate = now;

      updateStatus({
        mode: "helper-error",
        reason:
          "Audio helper error: " +
          (errorMessage || "unknown error")
      });
    });

    helperProcess.on("error", (err) => {
      console.error("Failed to spawn audio helper process:", err);
      updateStatus({
        mode: "helper-error",
        reason: `Failed to spawn audio helper: ${err.message}`
      });
    });

    helperProcess.on("exit", (code) => {
      helperProcess = null;

      // NEW: Auto-recovery for unexpected crashes
      if (code !== 0) {
        restartHelper(
          `Helper exited unexpectedly with code ${code}`
        );
      if (isStopping) {
        clearRecoveryTimer();
        return;
      }

      retryCount++;

      // Calculate exponential backoff delay
      const delay = calculateRetryDelay(retryCount);

      if (retryCount <= MAX_IMMEDIATE_RETRIES) {
        // Immediate retries with exponential backoff
        updateStatus({
          mode: "reconnecting",
          reason: `Helper crashed. Restarting ${retryCount}/${MAX_IMMEDIATE_RETRIES} (retrying in ${Math.round(delay/1000)}s)`
        });

        setTimeout(() => {
          if (!isStopping) {
            start();
          }
        }, delay);

        return;
      }

      if (retryCount <= MAX_TOTAL_RETRIES) {
        // Extended recovery mode
        updateStatus({
          mode: "reconnecting",
          reason: `Helper crashed. Extended recovery mode (${retryCount}/${MAX_TOTAL_RETRIES}). Next retry in ${Math.round(delay/1000)}s`
        });

        setTimeout(() => {
          if (!isStopping) {
            start();
          }
        }, delay);

        return;
      }

      updateStatus({
        mode: "simulated",
        reason: [
          `Audio helper stopped normally (exit code ${code}).`
        ].join("")
      // Permanent failure - schedule periodic recovery attempts
      updateStatus({
        mode: "simulated",
        reason:
          `Audio helper stopped permanently (exit ${code}).\n` +
          `Max retry limit reached (${MAX_TOTAL_RETRIES} attempts).\n` +
          "Will attempt recovery every minute."
      });

      // Schedule periodic recovery attempts
      scheduleRecovery();
    });
  }

  function stop() {
    isStopping = true;
    clearRecoveryTimer();
    
    if (helperProcess) {
      helperProcess.kill();
      helperProcess = null;
    }

    helperReady = false;
    successStartTime = null;

    updateStatus({
      mode: "simulated",
      reason: "Helper stopped."
    });
  }

  function getStatus() {
    return helperStatus;
  }

  function calculateRetryDelay(attemptNumber) {
    return Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, attemptNumber - 1),
      MAX_RETRY_DELAY
    );
  }

  function scheduleRecovery() {
    clearRecoveryTimer();

    recoveryTimer = setTimeout(() => {
      if (isStopping) {
        return;
      }

      retryCount = 0; // Reset retry count for recovery attempt
      start();
    }, RECOVERY_CHECK_INTERVAL);
  }

  function clearRecoveryTimer() {
    if (recoveryTimer) {
      clearTimeout(recoveryTimer);
      recoveryTimer = null;
    }
  }

  function resetRetryCountOnSuccess() {
    if (retryCount > 0 && successStartTime && Date.now() - successStartTime > SUCCESS_RESET_THRESHOLD) {
      retryCount = 0;
      console.log("Helper stable for 30s, reset retry count");
    }
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