import { spawn } from "child_process";

export function startFFmpeg({ ip, port, display, rtpPort, rtcpPort }) {
  console.log("🎥 startFFmpeg received:", {
    ip,
    port,
    display,
    rtpPort,
    rtcpPort,
  });

  return spawn("ffmpeg", [
    "-loglevel",
    "info",

    "-f",
    "x11grab",
    "-video_size",
    "1280x720",
    "-framerate",
    "30",
    "-i",
    display,

    "-an",

    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "zerolatency",
    "-pix_fmt",
    "yuv420p",
    "-profile:v",
    "baseline",
    "-level",
    "3.1",
    "-bf",
    "0",
    "-x264-params",
    "keyint=30:min-keyint=30:scenecut=0",

    "-payload_type",
    "96",
    "-ssrc",
    "11111111",

    "-f",
    "rtp",

    // ✅ RTCP mux MUST be here (URL param)
    `rtp://${ip}:${rtpPort}?rtcpport=${rtcpPort}&pkt_size=1200`,
  ]);
}
