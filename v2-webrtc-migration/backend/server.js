const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

let chromiumProcess = null;
let webrtcProcess = null;

const PORT = 3000;

console.log("🚀 Control server starting...");

/**
 * Start Chromium + WebRTC
 */
app.post("/start", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  console.log("🌐 Starting browser:", url);

  stopAll();

  chromiumProcess = spawn(
    "chromium",
    [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--window-size=1280,720",
      "--window-position=0,0",
      "--user-data-dir=/tmp/chrome-profile",
      url,
    ],
    {
      env: { ...process.env, DISPLAY: ":99" },
      stdio: "inherit",
    }
  );

  console.log("📂 Spawning webrtc.py from:", __dirname);

  webrtcProcess = spawn("python3", ["webrtc.py"], {
    cwd: __dirname,
    env: {
      ...process.env,
      DISPLAY: ":99",
      GI_TYPELIB_PATH: "/usr/lib/x86_64-linux-gnu/girepository-1.0",
      GST_PLUGIN_PATH: "/usr/lib/x86_64-linux-gnu/gstreamer-1.0",
    },
  });

  webrtcProcess.stdout.on("data", (d) => {
    console.log("🟢 webrtc.py:", d.toString());
  });

  webrtcProcess.stderr.on("data", (d) => {
    console.error("🔴 webrtc.py error:", d.toString());
  });

  webrtcProcess.on("exit", (code) => {
    console.error("❌ webrtc.py exited with code", code);
  });

  res.json({ status: "started" });
});

/**
 * Stop everything
 */
app.post("/stop", (_req, res) => {
  stopAll();
  res.json({ status: "stopped" });
});

function stopAll() {
  if (chromiumProcess) chromiumProcess.kill();
  if (webrtcProcess) webrtcProcess.kill();
  chromiumProcess = null;
  webrtcProcess = null;
}

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
