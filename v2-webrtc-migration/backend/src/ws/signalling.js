import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { handleInput } from "../input/handleInput.js";
import { onTakeControl } from "../input/mouseInputs.js";
import { releaseAllKeys } from "../input/keyboardOS.js";

dotenv.config();

export function startSignalingWs({ router, sessionManager }) {
  const WS_PORT = process.env.WS_PORT || 8080;
  const announcedIp = process.env.ANNOUNCED_IP;

  if (process.env.NODE_ENV === "production" && !announcedIp) {
    throw new Error("❌ ANNOUNCED_IP must be set in production");
  }

  const wss = new WebSocketServer({ port: WS_PORT, host: "0.0.0.0" });

  console.log(`📡 WebSocket signaling running on :${WS_PORT}`);

  wss.on("connection", (ws) => {
    ws.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        const session = sessionManager.get(data.sessionId);

        if (!session) {
          ws.send(JSON.stringify({ error: "Invalid sessionId" }));
          return;
        }

        /* 1️⃣ RTP Capabilities */
        if (data.action === "getRtpCapabilities") {
          ws.send(
            JSON.stringify({
              action: "rtpCapabilities",
              data: router.rtpCapabilities,
            }),
          );
        }

        /* 2️⃣ Create WebRTC Transport */
        if (data.action === "createTransport") {
          const transport = await router.createWebRtcTransport({
            listenIps: [
              {
                ip: "0.0.0.0",
                announcedIp: announcedIp || undefined,
              },
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
          });

          transport.on("dtlsstatechange", (state) => {
            if (state === "closed") {
              console.warn("⚠️ DTLS transport closed");
              transport.close();
            }
          });

          transport.on("iceconnectionstatechange", (state) => {
            console.log("🧊 ICE state:", state);
          });

          session.webRtcTransport = transport;
          session.transports.add(transport);

          ws.send(
            JSON.stringify({
              action: "transportCreated",
              data: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
              },
            }),
          );
        }

        /* 3️⃣ DTLS Connect */
        if (data.action === "connectTransport") {
          await session.webRtcTransport.connect({
            dtlsParameters: data.dtlsParameters,
          });
        }

        /* 4️⃣ Consume Producer */
        if (data.action === "consume") {
          const consumer = await session.webRtcTransport.consume({
            producerId: session.producer.id,
            rtpCapabilities: data.rtpCapabilities,
            paused: true,
          });

          consumer.on("transportclose", () => {
            console.log("🧹 Consumer closed");
          });

          await consumer.resume();

          ws.send(
            JSON.stringify({
              action: "consuming",
              data: {
                consumerId: consumer.id,
                producerId: session.producer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
              },
            }),
          );
        }
      } catch (err) {
        console.error("❌ WS message error:", err.message);
        ws.send(JSON.stringify({ error: "Invalid WS payload" }));
      }
    });

    ws.on("close", () => {
      console.log("🔌 WS client disconnected");
    });
  });

  return wss;
}

export function startInputWs(sessionManager ) {
  const WS_PORT = process.env.INPUT_WS_PORT || 8081;

  const wss = new WebSocketServer({ port: WS_PORT, host: "0.0.0.0" });
  console.log(`📡 WebSocket signaling running on :${WS_PORT}`);

  wss.on("connection", (ws) => {
    ws.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        const session = sessionManager.get(data.sessionId);
        if (!session) {
          return ws.send(JSON.stringify({ error: "Invalid sessionId" }));
        }

        /* 5️⃣ Input Events */
        if (data.action === "input") {
          await handleInput(session, data);
        }

        // take control of the mouse and keyboard
        if (data.action === "takeControl") {
          onTakeControl(session);
        }
      } catch (err) {
        console.error("❌ WS message error:", err.message);
        ws.send(JSON.stringify({ error: "Invalid WS payload" }));
      }
    });

    ws.on("close", ()=>{
      releaseAllKeys();
    })
  });
}
