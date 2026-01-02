const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const path = require("path");

app.use("/viewer", express.static(path.join(__dirname, "viewer")));

let browserProcess = null;

/**
 * Start Chromium with a given URL
 */
app.post("/start-browser", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  if (browserProcess) {
    browserProcess.kill();
    browserProcess = null;
  }

  console.log("🌍 Starting Chromium:", url);

  browserProcess = spawn(
    "/usr/bin/chromium",
    [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",

      // ✅ Skyvern-style fullscreen (NOT kiosk)
      // "--start-fullscreen",
      "--window-position=0,0",
      "--window-size=1280,720",

      // Clean startup
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-infobars",
      "--disable-session-crashed-bubble",
      //   "--start-maximized",
      "--user-data-dir=/tmp/chrome-profile",

      url,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        DISPLAY: ":99",
      },
    }
  );

  browserProcess.on("exit", (code) => {
    console.log("❌ Chromium exited with code", code);
    browserProcess = null;
  });

  res.json({ status: "started" });
});

/**
 * Stop Chromium
 */
app.post("/stop-browser", (_req, res) => {
  if (browserProcess) {
    browserProcess.kill();
    browserProcess = null;
  }

  res.json({ status: "stopped" });
});

app.listen(3000, () => {
  console.log("✅ Backend running on port 3000");
});
