import { v4 as uuid } from "uuid";
import { launchBrowser } from "../browser/launchBrowser.js";
import { startFFmpeg } from "../ffmpeg/startFFmpeg.js";
import dotenv from "dotenv";
dotenv.config();

export const startStream =
  (sessionManager, router, mediaCodecs) => async (req, res) => {
    try {
      const { url } = req.body;
      const sessionId = uuid();
      const session = sessionManager.create(sessionId);

      /* 1️⃣ Launch Chromium */
      const { browser } = await launchBrowser(url);
      session.browser = browser;

      // Allow Chromium to paint
      await new Promise((r) => setTimeout(r, 800));

      const transport = await router.createPlainTransport({
        listenIp: "0.0.0.0",
        announcedIp: process.env.ANNOUNCED_IP,
        rtcpMux: false, // ✅ REQUIRED
        comedia: true, // ✅ REQUIRED
      });

      session.plainTransport = await transport;

      const { localIp, localPort } = transport.tuple;

      console.log("📡 RTP PORT:", localPort);

      const rtpPort = transport.tuple.localPort;
      const rtcpPort = transport.rtcpTuple.localPort;

      console.log("📡 RTP PORT:", rtpPort);
      console.log("📡 RTCP PORT:", rtcpPort);

      const SSRC = 11111111;
      /* 3️⃣ Produce (NO connect call) */
      session.producer = await transport.produce({
        kind: "video",
        rtpParameters: {
          codecs: mediaCodecs,
          encodings: [{ ssrc: SSRC }],
        },
      });

      console.log("🎬 Producer paused?", session.producer.paused);

      /* 4️⃣ Start FFmpeg (RTP ONLY) */
      session.ffmpeg = startFFmpeg({
        ip: process.env.ANNOUNCED_IP, // usually 127.0.0.1 inside container
        port: localPort, // 🔥 THIS MUST EXIST
        display: ":99",
        rtpPort,
        rtcpPort,
      });

      setTimeout(async () => {
        const stats = await session.producer.getStats();
        console.log("📊 RTP STATS CHECK:", stats);
      }, 2000);

      session.ffmpeg.stderr.on("data", (d) => {
        console.log("🎥 FFmpeg:", d.toString());
      });

      session.ffmpeg.on("exit", (code) => {
        console.log("❌ FFmpeg exited:", code);
      });

      /* 5️⃣ RTP stats sanity check */
      setTimeout(async () => {
        const stats = await session.producer.getStats();
        console.log("📊 Producer RTP stats:", stats);
      }, 2000);

      res.json({ sessionId });
    } catch (err) {
      console.error("❌ startStream failed:", err);
      res.status(500).json({ error: "Failed to start session" });
    }
  };
