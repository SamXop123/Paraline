const { app, Notification } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function createAudioBridge(sendLevel, onStatusChange = () => {}) {
  let helperProcess = null;

  let helperStatus = {
    mode: "simulated",
    reason: "Helper not started yet."
  };

  // Auto-restart configuration
  let restartAttempts = 0;
  const MAX_RESTART_ATTEMPTS = 5;
  const BASE_RESTART_DELAY = 1000;

  // Prevent restart on intentional shutdown
  let expectedExit = false;

  // NEW: prevent duplicate restart scheduling
  let isRestarting = false;

  // Healthy uptime tracking
  let healthyTimer = null;
  const HEALTHY_UPTIME_MS = 30000;

  // NEW: parse error tracking
  let parseErrorCount = 0;
  const MAX_PARSE_ERRORS = 5;

  function updateStatus(nextStatus) {
    helperStatus = nextStatus;
    onStatusChange(helperStatus);
  }

  function showFailureNotification(message) {
    if (Notification.isSupported()) {
      new Notification({
        title: "Paraline Audio Helper",
        body: message
      }).show();
    }
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

  // Auto restart with exponential backoff
  function restartHelper(reason = "Unknown crash") {
    // NEW: prevent duplicate restart scheduling
    if (isRestarting) {
      return;
    }

    isRestarting = true;

    // NEW: reset parse errors on restart
    parseErrorCount = 0;

    if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
      isRestarting = false;

      updateStatus({
        mode: "simulated",
        reason: [
          "Audio helper failed to restart after multiple attempts.",
          "\n",
          `Last error: ${reason}`
        ].join("")
      });

      showFailureNotification(
        "Audio helper could not be restarted. Running in simulated mode."
      );

      return;
    }

    restartAttempts++;

    const delay =
      BASE_RESTART_DELAY * Math.pow(2, restartAttempts - 1);

    updateStatus({
      mode: "helper-restarting",
      reason: `Restarting audio helper (${restartAttempts}/${MAX_RESTART_ATTEMPTS}) in ${delay}ms...`
    });

    if (helperProcess) {
      expectedExit = true;
      helperProcess.kill();
      helperProcess = null;
    }

    setTimeout(() => {
      isRestarting = false;
      start();
    }, delay);
  }

  function start() {
    // NEW: reset parse errors on fresh start
    parseErrorCount = 0;

    const helperBinary = findHelperBinary();

    if (!helperBinary) {
      updateStatus({
        mode: "simulated",
        reason: [
          "Audio capture helper not found.",
          "\n",
          "Troubleshooting:",
          "\n- The required C# audio helper binary is missing.",
          "\n- Please build it with: dotnet build .\\audio-helper\\Paraline.AudioBridge.csproj",
          "\n- Or run: npm run build:helper",
          "\n- See DEVELOPMENT.md for setup instructions."
        ].join("")
      });

      return;
    }

    expectedExit = false;

    helperProcess = spawn(helperBinary, [], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });

    updateStatus({
      mode: "helper",
      reason: "C# helper process connected."
    });

    // Reset retry count only after healthy uptime
    clearTimeout(healthyTimer);

    healthyTimer = setTimeout(() => {
      restartAttempts = 0;

      updateStatus({
        mode: "helper",
        reason: "Audio helper running normally."
      });
    }, HEALTHY_UPTIME_MS);

    let stdoutBuffer = "";

    helperProcess.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();

      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        try {
          const message = JSON.parse(line);

          // Reset parse error counter after valid parse
          parseErrorCount = 0;

          if (
            message.type === "level" &&
            typeof message.value === "number"
          ) {
            sendLevel(message.value);
          }
        } catch (_error) {
          parseErrorCount++;

          updateStatus({
            mode: "helper-warning",
            reason: [
              "Audio helper sent invalid data.",
              "\n",
              `Parse errors: ${parseErrorCount}/${MAX_PARSE_ERRORS}`
            ].join("")
          });

          // NEW: restart helper after repeated parse failures
          if (parseErrorCount >= MAX_PARSE_ERRORS) {
            restartHelper(
              "Too many invalid helper responses"
            );
          }
        }
      }
    });

    helperProcess.stderr.on("data", (chunk) => {
      updateStatus({
        mode: "helper-error",
        reason: [
          "Audio helper error: ",
          chunk.toString().trim() || "Helper reported an error."
        ].join("")
      });
    });

    helperProcess.on("exit", (code, signal) => {
      clearTimeout(healthyTimer);

      helperProcess = null;

      // Ignore intentional shutdowns
      if (expectedExit) {
        expectedExit = false;

        updateStatus({
          mode: "simulated",
          reason: "Helper stopped intentionally."
        });

        return;
      }

      // NEW: avoid duplicate restart scheduling
      if (isRestarting) {
        return;
      }

      // Restart helper automatically after crash
      if (code !== 0) {
        restartHelper(
          `Helper crashed with exit code ${code}`
        );

        return;
      }

      updateStatus({
        mode: "simulated",
        reason: `Audio helper stopped (exit code ${code}).`
      });
    });
  }

  function stop() {
    if (helperProcess) {
      expectedExit = true;

      helperProcess.kill();
      helperProcess = null;
    }

    clearTimeout(healthyTimer);

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