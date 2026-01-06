import asyncio
import json
import gi
import websockets

gi.require_version("Gst", "1.0")
gi.require_version("GstWebRTC", "1.0")

from gi.repository import Gst, GstWebRTC, GObject

Gst.init(None)

PIPELINE_DESC = """
ximagesrc display-name=:99 use-damage=0
 ! videoconvert
 ! vp8enc deadline=1 cpu-used=4
 ! queue name=videoq
 ! fakesink
webrtcbin name=webrtc
"""

class WebRTCSession:
    def __init__(self, ws):
        self.ws = ws

        self.pipeline = Gst.parse_launch(PIPELINE_DESC)
        self.webrtc = self.pipeline.get_by_name("webrtc")
        self.videoq = self.pipeline.get_by_name("videoq")

        # 🔑 MANUAL PAD REQUEST + LINK (CRITICAL)
        webrtc_sink_pad = self.webrtc.get_request_pad("sink_%u")
        if not webrtc_sink_pad:
            raise RuntimeError("❌ Failed to get webrtcbin sink pad")

        queue_src_pad = self.videoq.get_static_pad("src")
        queue_src_pad.link(webrtc_sink_pad)

        # Signals
        self.webrtc.connect("on-negotiation-needed", self.on_negotiation_needed)
        self.webrtc.connect("on-ice-candidate", self.on_ice_candidate)

        self.pipeline.set_state(Gst.State.PLAYING)

    async def send(self, msg):
        await self.ws.send(json.dumps(msg))

    def on_negotiation_needed(self, element):
        promise = Gst.Promise.new_with_change_func(self.on_offer_created, None)
        element.emit("create-offer", None, promise)

    def on_offer_created(self, promise, _):
        reply = promise.get_reply()
        offer = reply.get_value("offer")

        # ✅ CORRECT SIGNATURE
        self.webrtc.emit("set-local-description", offer, None)

        asyncio.get_event_loop().create_task(
            self.send({
                "type": "offer",
                "sdp": offer.sdp.as_text()
            })
        )

    def on_ice_candidate(self, _, mline, candidate):
        asyncio.get_event_loop().create_task(
            self.send({
                "type": "ice",
                "sdpMLineIndex": mline,
                "candidate": candidate
            })
        )

    def handle_answer(self, sdp):
        res, msg = Gst.SDPMessage.new_from_text(sdp)
        answer = GstWebRTC.WebRTCSessionDescription.new(
            GstWebRTC.WebRTCSDPType.ANSWER,
            msg
        )
        self.webrtc.emit("set-remote-description", answer, None)

    def add_ice_candidate(self, idx, candidate):
        self.webrtc.emit("add-ice-candidate", idx, candidate)


async def handler(ws):
    print("🟢 WebRTC client connected")
    session = WebRTCSession(ws)

    async for message in ws:
        data = json.loads(message)

        if data["type"] == "answer":
            session.handle_answer(data["sdp"])

        elif data["type"] == "ice":
            session.add_ice_candidate(
                data["sdpMLineIndex"],
                data["candidate"]
            )


async def main():
    print("✅ WebRTC signaling server running on :9000")
    async with websockets.serve(handler, "0.0.0.0", 9000):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
