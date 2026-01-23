import { spawn } from "child_process";

export function startFFmpeg({ ip, rtpPort, rtcpPort, display }) {
   console.log("🧪 startFFmpeg received", { ip, rtpPort, rtcpPort, display });
  const DISPLAY = display || ":99";

  return spawn("ffmpeg", [
    "-loglevel", "warning",

    "-fflags", "nobuffer",
    "-flags", "low_delay",
    "-probesize", "32",
    "-analyzeduration", "0",

    "-f", "x11grab",
    "-video_size", "1280x720",
    "-framerate", "30",
    "-i", DISPLAY,

    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-tune", "zerolatency",
    "-profile:v", "baseline",
    "-level", "3.1",
    "-pix_fmt", "yuv420p",

    "-x264-params",
    "keyint=30:min-keyint=30:scenecut=0:repeat-headers=1",

    "-bf", "0",
    "-b:v", "4M",
    "-maxrate", "4M",
    "-bufsize", "2M",

    "-an",

    "-f", "rtp",
    "-payload_type", "96",
    "-ssrc", "11111111",
    `rtp://${ip}:${rtpPort}?rtcpport=${rtcpPort}&localrtcpport=${rtcpPort}`,
  ]);
}
