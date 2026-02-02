import express from "express";
import cors from "cors";
import { mediaCodecs } from "./ffmpeg/config.js";
import { SessionManager } from "./sessions/sessionManager.js";
import { initMediasoup } from "./mediasoup/init.js";
import streamRouter from "./routes/browser.routes.js";
import dotenv from "dotenv";
import { startSignalingWs } from "./ws/signalling.js";
import { startInputWs } from "./ws/signalling.js";

dotenv.config();

const PORT = process.env.HTTP_PORT || 3000;
console.log("🌍 ENV BOOT CHECK:", {
  ANNOUNCED_IP: process.env.ANNOUNCED_IP,
  DISPLAY: process.env.DISPLAY,
});

const app = express();
app.use(express.json());
app.use(cors());

/* ---------- mediasoup ---------- */
const { worker, router } = await initMediasoup();

/* ---------- sessions ---------- */
const sessionManager = new SessionManager();

/* ---------- start WS signaling ---------- */
startSignalingWs({ router, sessionManager });
startInputWs(sessionManager );

app.use("/", streamRouter(sessionManager, router, mediaCodecs));

console.log("ENV:", {
  HTTP_PORT: process.env.HTTP_PORT,
  WS_PORT: process.env.WS_PORT,
  ANNOUNCED_IP: process.env.ANNOUNCED_IP,
});

/* ---------- start HTTP API ---------- */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HTTP API running on http://localhost:${PORT}`);
});
