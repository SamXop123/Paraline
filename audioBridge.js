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

  function updateStatus(nextStatus) {
    helperStatus = nextStatus;
    onStatusChange(helperStatus);
  }

  function findHelperBinary() {
    const appPath = app.getAppPath();
    const candidates = [
      path.join(process.resourcesPath, "audio-helper", "Paraline.AudioBridge.exe"),
      path.join(appPath, "build", "audio-helper", "Paraline.AudioBridge.exe"),
      path.join(appPath, "audio-helper", "bin", "Release", "net8.0-windows", "win-x64", "publish", "Paraline.AudioBridge.exe"),
      path.join(appPath, "audio-helper", "bin", "Debug", "net8.0-windows", "Paraline.AudioBridge.exe"),
      path.join(appPath, "audio-helper", "bin", "Release", "net8.0-windows", "Paraline.AudioBridge.exe")
    ];

    return candidates.find((candidatePath) => fs.existsSync(candidatePath)) || null;
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

  if (message.type === "level" && typeof message.value === "number") {
    sendLevel(message.value);
  }
} catch (error) {
  console.warn(
    "Ignoring malformed helper message:",
    error.message,
    line
  );

  continue;
}

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
      updateStatus({
        mode: "simulated",
        reason: [
          `Audio helper stopped (exit code ${code}).`,
          "\n",
          "Troubleshooting:",
          "\n- The audio capture process exited unexpectedly.",
          "\n- Try restarting Paraline.",
          "\n- If the problem persists, rebuild the helper binary."
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
