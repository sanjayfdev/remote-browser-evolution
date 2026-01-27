import mediasoup from "mediasoup";
import { mediaCodecs } from "../ffmpeg/config.js";

export const initMediasoup = async () => {
  const worker = await mediasoup.createWorker({
    logLevel: "warn",
    logTags: [
      "info",
      "ice",
      "dtls",
      "rtp",
      "srtp",
      "rtcp",
    ],

    /* 🔴 CRITICAL for Docker */
    rtcMinPort: 41000,
    rtcMaxPort: 41050,
  });

  worker.on("died", () => {
    console.error("💥 mediasoup worker died — exiting");
    process.exit(1);
  });

  const router = await worker.createRouter({ mediaCodecs });

  console.log("✅ mediasoup router ready");
  console.log(
    `🎧 RTC ports: ${worker.appData?.rtcMinPort || 40000}–${worker.appData?.rtcMaxPort || 49999}`
  );

  return { worker, router };
};
