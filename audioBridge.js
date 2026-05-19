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

  function updateStatus(nextStatus) {
    helperStatus = nextStatus;
    onStatusChange(helperStatus);
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
        }
      }
    });

    helperProcess.stderr.on("data", (chunk) => {
      updateStatus({
        mode: "helper-error",
        reason: [
          "Audio helper error: ",
          chunk.toString().trim() || "Helper reported an error.",
          "\n",
          "Troubleshooting:",
          "\n- Check if your audio device is in use by another app.",
          "\n- Try restarting Paraline or your computer.",
          "\n- If this continues, rebuild the helper binary."
        ].join("")
      });
    });

    helperProcess.on("exit", (code) => {
      helperProcess = null;

      // NEW: Auto-recovery for unexpected crashes
      if (code !== 0) {
        restartHelper(
          `Helper exited unexpectedly with code ${code}`
        );

        return;
      }

      updateStatus({
        mode: "simulated",
        reason: [
          `Audio helper stopped normally (exit code ${code}).`
        ].join("")
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