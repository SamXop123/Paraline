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
    if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
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
      helperProcess.kill();
      helperProcess = null;
    }

    setTimeout(() => {
      start();
    }, delay);
  }

  function start() {
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

    helperProcess = spawn(helperBinary, [], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });

    updateStatus({
      mode: "helper",
      reason: "C# helper process connected."
    });

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

          // Reset retry count after successful response
          restartAttempts = 0;

          if (
            message.type === "level" &&
            typeof message.value === "number"
          ) {
            sendLevel(message.value);
          }
        } catch (_error) {
          updateStatus({
            mode: "helper-warning",
            reason: [
              "Audio helper sent invalid data.",
              "\n",
              "Continuing helper monitoring..."
            ].join("")
          });
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

    helperProcess.on("exit", (code) => {
      helperProcess = null;

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
      helperProcess.kill();
      helperProcess = null;
    }

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