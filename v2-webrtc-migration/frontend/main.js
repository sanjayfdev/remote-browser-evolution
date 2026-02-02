import * as mediasoupClient from "mediasoup-client";

// --- State Management ---
let state = {
  device: null,
  transport: null,
  consumer: null,
  sessionId: null,
  sigWs: null,
  inputWs: null,
  isControlling: false,
  mouseThrottle: false, // To prevent WS flooding
};

const dom = {
  video: document.getElementById("video"),
  startBtn: document.getElementById("start"),
  urlInput: document.getElementById("url"),
  status: document.getElementById("status"),
  remoteControlBtn: document.getElementById("remote-control"),
};

const log = (msg) => {
  dom.status.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
  dom.status.scrollTop = dom.status.scrollHeight;
};

/* ---------- Initialization ---------- */
const initInteractionEvents = () => {
  dom.video.addEventListener("click", handleClick);
  dom.video.addEventListener("mousemove", handleMouseMove);
  dom.remoteControlBtn.addEventListener("click", handleControlBtn);
  dom.video.oncontextmenu = (e) => e.preventDefault();
};

/* ---------- Session Logic ---------- */
const startSession = async () => {
  const url = dom.urlInput.value.trim();
  if (!url) return alert("Enter a URL");

  try {
    log("Requesting browser boot...");
    const res = await fetch("http://127.0.0.1:3000/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    state.sessionId = data.sessionId;

    setupWebSocket();
  } catch (err) {
    log("Failed to start session: " + err.message);
  }
};

const setupWebSocket = () => {
  state.sigWs = new WebSocket("ws://127.0.0.1:8080");
  state.sigWs.onmessage = handleSignalingMessage;

  state.inputWs = new WebSocket("ws://127.0.0.1:8081");

  state.sigWs.onopen = () => {
    log("Signaling channel open.");
    sendSignaling("getRtpCapabilities", {});
  };

  state.inputWs.onopen = () => {
    log("Input channel open.");
  };

  state.sigWs.onclose = () => log("Connection closed.");
  state.inputWs.onclose = () => log("Input connection closed.");
};

// Use this for Mediasoup
const sendSignaling = (action, data) => {
  if (state.sigWs?.readyState === WebSocket.OPEN) {
    state.sigWs.send(
      JSON.stringify({ action, sessionId: state.sessionId, ...data }),
    );
  }
};

// Use this for Mouse/Keyboard
const sendInput = (action, payload) => {
  if (state.inputWs?.readyState === WebSocket.OPEN) {
    state.inputWs.send(
      JSON.stringify({
        action,
        // type,
        sessionId: state.sessionId,
        payload,
      }),
    );
  }
};

/* ---------- Mediasoup Logic ---------- */
async function handleSignalingMessage(event) {
  const msg = JSON.parse(event.data);

  switch (msg.action) {
    case "rtpCapabilities":
      state.device = new mediasoupClient.Device();
      await state.device.load({ routerRtpCapabilities: msg.data });
      sendSignaling("createTransport", {});
      break;

    case "transportCreated":
      handleTransportCreated(msg.data);
      break;

    case "consuming":
      handleConsuming(msg.data);
      break;
  }
}

async function handleTransportCreated(data) {
  state.transport = state.device.createRecvTransport(data);

  state.transport.on("connect", ({ dtlsParameters }, callback, errback) => {
    sendSignaling("connectTransport", { dtlsParameters });
    callback();
  });

  state.transport.on("connectionstatechange", (s) => log(`Transport: ${s}`));

  // Request stream immediately
  sendSignaling("consume", { rtpCapabilities: state.device.rtpCapabilities });
}

async function handleConsuming(data) {
  state.consumer = await state.transport.consume({
    id: data.consumerId,
    producerId: data.producerId,
    kind: data.kind,
    rtpParameters: data.rtpParameters,
  });

  const stream = new MediaStream([state.consumer.track]);
  dom.video.srcObject = stream;

  // UI Improvements
  dom.video.muted = true;
  dom.video.setAttribute("playsinline", "true");

  await dom.video.play();
  await state.consumer.resume();
  log("🎥 Live Stream Active");
}

/* ---------- Interaction Handling ---------- */
function handleMouseMove(e) {
  if (!state.isControlling || state.mouseThrottle) return;

  // Throttle to 30fps (approx 33ms) to save bandwidth
  state.mouseThrottle = true;
  setTimeout(() => (state.mouseThrottle = false), 33);

  const coords = calculateCoordinates(e);
  console.log("mouseMove");
  if (coords) sendInput("input", { type: "mouseMove", payload: coords });
}

function handleWheel(e) {
  if (!state.isControlling) return;
  e.preventDefault();
  e.stopPropagation();

  const deltaY = e.deltaY;

  // Normalize direction
  const direction = deltaY > 0 ? "down" : "up";

  sendInput("input", {
    type: "scroll",
    payload: {
      direction,
      amount: Math.min(Math.abs(deltaY), 100),
    },
  });
}

function handleClick(e) {
  if (!state.isControlling) return;
  console.log("clicked");
  const coords = calculateCoordinates(e);
  console.log("mouseClick");
  if (coords) sendInput("input", { type: "mouseClick", payload: coords });
}

function calculateCoordinates(e) {
  const rect = dom.video.getBoundingClientRect();
  const { activeWidth, activeHeight, offsetX, offsetY } = getActiveVideoRect(
    dom.video,
  );

  const x = e.clientX - rect.left - offsetX;
  const y = e.clientY - rect.top - offsetY;

  if (x < 0 || y < 0 || x > activeWidth || y > activeHeight) return null;

  return {
    x: Math.round(x),
    y: Math.round(y),
    videoWidth: Math.round(activeWidth),
    videoHeight: Math.round(activeHeight),
  };
}

// Logic for calculating the actual video area (handling object-fit: contain)
function getActiveVideoRect(v) {
  const videoAspect = v.videoWidth / v.videoHeight;
  const elementAspect = v.clientWidth / v.clientHeight;

  let activeWidth, activeHeight, offsetX, offsetY;

  if (elementAspect > videoAspect) {
    // black bars left/right
    activeHeight = v.clientHeight;
    activeWidth = activeHeight * videoAspect;
    offsetX = (v.clientWidth - activeWidth) / 2;
    offsetY = 0;
  } else {
    // black bars top/bottom
    activeWidth = v.clientWidth;
    activeHeight = activeWidth / videoAspect;
    offsetX = 0;
    offsetY = (v.clientHeight - activeHeight) / 2;
  }

  return { activeWidth, activeHeight, offsetX, offsetY };
}

const handleControlBtn = () => {
  state.isControlling = !state.isControlling;

  sendInput("takeControl", {});

  if (state.isControlling) {
    dom.video.style.cursor = "none";
    dom.video.focus();
    // await dom.video.requestPointerLock();
    enableKeyboardControl();
    dom.video.addEventListener("wheel", handleWheel, { passive: false });
    dom.remoteControlBtn.textContent = "Release Control";
    dom.remoteControlBtn.classList.add("active");
  } else {
    dom.video.style.cursor = "default";
    disableKeyboardControl();
    dom.remoteControlBtn.textContent = "Take Control";
    dom.video.removeEventListener("wheel", handleWheel);
    dom.remoteControlBtn.classList.remove("active");
  }
};

// Start
initInteractionEvents();
dom.startBtn.addEventListener("click", async () => {
  if (dom.startBtn.textContent.includes("Start")) {
    await startSession();
    dom.startBtn.textContent = "Stop Session";
  } else {
    location.reload();
  }
});

function handleKeyDown(e) {
  if (!state.isControlling) return;

  e.preventDefault();
  e.stopPropagation();

  sendInput("input", {
    type: "keyDown",
    payload: normalizeKeyEvent(e),
  });
}

function handleKeyUp(e) {
  if (!state.isControlling) return;

  e.preventDefault();
  e.stopPropagation();

  sendInput("input", {
    type: "keyUp",
    payload: normalizeKeyEvent(e),
  });
}

function normalizeKeyEvent(e) {
  return {
    key: e.key,
    code: e.code,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    shift: e.shiftKey,
    meta: e.metaKey,
  };
}

function enableKeyboardControl() {
  dom.video.focus(); // 👈 VERY IMPORTANT
  dom.video.addEventListener("keydown", handleKeyDown);
  dom.video.addEventListener("keyup", handleKeyUp);
}

function disableKeyboardControl() {
  dom.video.removeEventListener("keydown", handleKeyDown);
  dom.video.removeEventListener("keyup", handleKeyUp);
}
