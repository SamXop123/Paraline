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

    let helperReady = false;

    let stdoutBuffer = "";

    helperProcess.stdout.on("data", (chunk) => {
      if (!helperReady) {
  helperReady = true;

  updateStatus({
    mode: "helper",
    reason: "C# helper process connected."
  });
}
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
        } catch (_error) {
  console.warn("Invalid helper message received.");
  continue;
}
        }
      }
    };

helperProcess.on("exit", (code) => {
  if (!helperProcess) {
    return;
  }

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
   helperProcess.on("exit", (code) => {
 

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
