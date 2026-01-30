import * as mediasoupClient from "mediasoup-client";

const video = document.getElementById("video");
const startBtn = document.getElementById("start");
const urlInput = document.getElementById("url");
const status = document.getElementById("status");
const remoteControlBtn = document.getElementById("remote-control");

let device;
let transport;
let consumer;
let sessionId;
let ws;

function log(msg) {
  status.textContent += msg + "\n";
}

/* ---------- Start session ---------- */
startBtn.onclick = async () => {
  status.textContent = "";
  const url = urlInput.value.trim();
  if (!url) return alert("Enter a URL");

  log("Starting session...");

  const res = await fetch("http://127.0.0.1:3000/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  sessionId = data.sessionId;
  log("Session ID: " + sessionId);

  ws = new WebSocket("ws://127.0.0.1:8080");

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        action: "getRtpCapabilities",
        sessionId,
      }),
    );
  };
  console.log("🔌 WS connected");

  ws.onmessage = handleWsMessage;
};

/* ---------- WebSocket signaling ---------- */
async function handleWsMessage(event) {
  const msg = JSON.parse(event.data);

  console.log("📨 WS message:", msg.action);
  /* ---------- RTP Capabilities ---------- */
  if (msg.action === "rtpCapabilities") {
    device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: msg.data });

    ws.send(
      JSON.stringify({
        action: "createTransport",
        sessionId,
      }),
    );
  }

  /* ---------- Transport ---------- */
  if (msg.action === "transportCreated") {
    transport = device.createRecvTransport(msg.data);

    // ✅ FIX 1: FORCE H264
    const h264Codecs = device.rtpCapabilities.codecs.filter(
      (c) => c.kind === "video" && c.mimeType.toLowerCase() === "video/h264",
    );

    if (transport.setCodecPreferences) {
      transport.setCodecPreferences(h264Codecs);
    }

    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      ws.send(
        JSON.stringify({
          action: "connectTransport",
          sessionId,
          dtlsParameters,
        }),
      );
      callback(); // ✅ mediasoup-client handles state
    });

    transport.on("connectionstatechange", (state) => {
      console.log("🚦 Transport state:", state);
    });

    // ✅ FIX 2: Immediately request consume
    ws.send(
      JSON.stringify({
        action: "consume",
        sessionId,
        rtpCapabilities: device.rtpCapabilities,
      }),
    );
  }

  /* ---------- Consumer ---------- */
  if (msg.action === "consuming") {
    consumer = await transport.consume({
      id: msg.data.consumerId,
      producerId: msg.data.producerId,
      kind: msg.data.kind,
      rtpParameters: msg.data.rtpParameters,
    });

    const stream = new MediaStream();
    stream.addTrack(consumer.track);

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    await video.play();

    // ✅ FIX 3: resume AFTER attaching
    await consumer.resume();

    log("🎥 Streaming started");

    // 🔍 Debug (optional, but very useful)
    // setInterval(async () => {
    //   const stats = await consumer.getStats();
    //   console.log("📊 Consumer stats:", [...stats.values()]);
    // }, 2000);
  }

  interactionEvents();
}

function interactionEvents() {
  video.removeEventListener("click", handleClick);
  video.addEventListener("click", handleClick);
  video.removeEventListener("mousemove", handleMouseMove);
  video.addEventListener("mousemove", handleMouseMove);
  remoteControlBtn.addEventListener("click", handleControlBtn);
}

function getActiveVideoRect(video) {
  const videoAspect = video.videoWidth / video.videoHeight;
  const elementAspect = video.clientWidth / video.clientHeight;

  let activeWidth, activeHeight, offsetX, offsetY;

  if (elementAspect > videoAspect) {
    // Black bars on left/right
    activeHeight = video.clientHeight;
    activeWidth = activeHeight * videoAspect;
    offsetX = (video.clientWidth - activeWidth) / 2;
    offsetY = 0;
  } else {
    // Black bars on top/bottom
    activeWidth = video.clientWidth;
    activeHeight = activeWidth / videoAspect;
    offsetX = 0;
    offsetY = (video.clientHeight - activeHeight) / 2;
  }

  return { activeWidth, activeHeight, offsetX, offsetY };
}

function handleClick(e) {
  const rect = video.getBoundingClientRect();
  console.log(rect);
  const { activeWidth, activeHeight, offsetX, offsetY } =
    getActiveVideoRect(video);

  const x = e.clientX - rect.left - offsetX;
  const y = e.clientY - rect.top - offsetY;
  console.log("x , y", x, y);
  console.log("height, width", activeHeight, activeWidth);
  // ❌ Click inside black bars → ignore
  if (x < 0 || y < 0 || x > activeWidth || y > activeHeight) {
    console.log("Click in black bar, ignored");
    return;
  }

  ws.send(
    JSON.stringify({
      action: "input",
      type: "mouseClick",
      sessionId,
      payload: {
        x,
        y,
        videoWidth: activeWidth,
        videoHeight: activeHeight,
      },
    }),
  );
}

function handleMouseMove(e) {
  const rect = video.getBoundingClientRect();
  console.log(rect);
  const { activeWidth, activeHeight, offsetX, offsetY } =
    getActiveVideoRect(video);
  const x = e.clientX - rect.left - offsetX;
  const y = e.clientY - rect.top - offsetY;
  console.log("x , y", x, y);
  console.log("height, width", activeHeight, activeWidth);
  // ❌ Move inside black bars → ignore
  if (x < 0 || y < 0 || x > activeWidth || y > activeHeight) {
    console.log("Move in black bar, ignored");
    return;
  }
  ws.send(
    JSON.stringify({
      action: "input",
      type: "mouseMove",
      sessionId,
      payload: {
        x,
        y,
        videoWidth: activeWidth,
        videoHeight: activeHeight,
      },
    }),
  );
}

function enableRemoteControl() {
  video.style.pointerEvents = "auto";
  log("🖱️ Remote control enabled");
}

function disableRemoteControl() {
  video.style.pointerEvents = "none";
  log("🚫 Remote control disabled");
}

const handleControlBtn = () => {
  ws.send(
    JSON.stringify({
      action: "takeControl",
      sessionId,
    }),
  );
  if (video.style.pointerEvents === "auto") {
    disableRemoteControl();
    remoteControlBtn.textContent = "Take Control";
  } else {
    enableRemoteControl();
    remoteControlBtn.textContent = "Disable Control";
  }
  remoteControlBtn.disabled = true;
};
