import { spawn } from "child_process";

export function startFFmpeg({ ip, display, rtpPort, rtcpPort }) {
  return spawn("ffmpeg", [
    // ---------- Logging ----------
    "-loglevel", "warning",

    // ---------- REAL-TIME CAPTURE ----------
    "-fflags", "nobuffer",
    "-flags", "low_delay",
    "-probesize", "32",
    "-analyzeduration", "0",
    "-thread_queue_size", "1",

    // ---------- X11 CAPTURE ----------
    "-f", "x11grab",
    "-video_size", "1280x720",
    "-framerate", "60",              // ⬅️ IMPORTANT
    "-i", display,

    // ---------- NO AUDIO ----------
    "-an",

    // ---------- ENCODER ----------
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-tune", "zerolatency",
    "-pix_fmt", "yuv420p",
    "-profile:v", "baseline",
    "-level", "3.1",

    // ---------- ZERO REORDERING ----------
    "-bf", "0",
    "-refs", "1",
    "-g", "30",
    "-keyint_min", "30",
    "-sc_threshold", "0",

    // ---------- FORCE CFR ----------
    "-vsync", "1",

    // ---------- RTP ----------
    "-payload_type", "96",
    "-ssrc", "11111111",
    "-f", "rtp",

    // ---------- RTP URL ----------
    `rtp://${ip}:${rtpPort}?rtcpport=${rtcpPort}&pkt_size=1200`,
  ]);
}
