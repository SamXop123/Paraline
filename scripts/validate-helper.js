const fs = require("fs");
const path = require("path");

const helperPath = path.join(
  process.cwd(),
  "build",
  "audio-helper",
  "Paraline.AudioBridge.exe"
);

if (!fs.existsSync(helperPath)) {
  console.error("\n❌ Audio helper executable not found.");
  console.error(`Expected: ${helperPath}`);
  console.error("\nRun:");
  console.error("npm run build:helper");
  process.exit(1);
}

console.log("✅ Audio helper executable found.");