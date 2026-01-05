import gi
import json
import asyncio
import websockets

gi.require_version("Gst", "1.0")
gi.require_version("GstWebRTC", "1.0")

from gi.repository import Gst, GstWebRTC, GObject

Gst.init(None)

PIPELINE_DESC = """
ximagesrc display-name=:99 use-damage=0
 ! video/x-raw,width=1280,height=720,framerate=30/1
 ! videoconvert
 ! queue
 ! vp8enc deadline=1
 ! queue
 ! webrtcbin name=webrtc
"""

class WebRTCStreamer:
    def __init__(self, ws):
        self.ws = ws
        self.pipeline = Gst.parse_launch(PIPELINE_DESC)
        self.webrtc = self.pipeline.get_by_name("webrtc")

        self.webrtc.connect("on-negotiation-needed", self.on_negotiation_needed)
        self.webrtc.connect("on-ice-candidate", self.send_ice_candidate)

    async def send(self, msg):
        await self.ws.send(json.dumps(msg))

    def on_negotiation_needed(self, element):
        promise = Gst.Promise.new_with_change_func(
            self.on_offer_created, None
        )
        element.emit("create-offer", None, promise)

    def on_offer_created(self, promise, _, __):
        promise.wait()
        reply = promise.get_reply()
        offer = reply.get_value("offer")

        self.webrtc.emit("set-local-description", offer)

        asyncio.ensure_future(
            self.send({
                "type": "offer",
                "sdp": offer.sdp.as_text()
            })
        )

    def send_ice_candidate(self, _, mline, candidate):
        asyncio.ensure_future(
            self.send({
                "type": "ice",
                "sdpMLineIndex": mline,
                "candidate": candidate
            })
        )

    def set_remote_description(self, sdp):
        desc = GstWebRTC.WebRTCSessionDescription.new(
            GstWebRTC.WebRTCSDPType.ANSWER,
            Gst.SDPMessage.new_from_text(sdp)[1]
        )
        self.webrtc.emit("set-remote-description", desc)

    def add_ice_candidate(self, idx, candidate):
        self.webrtc.emit("add-ice-candidate", idx, candidate)

    def start(self):
        self.pipeline.set_state(Gst.State.PLAYING)

async def ws_handler(ws):
    streamer = WebRTCStreamer(ws)
    streamer.start()

    async for msg in ws:
        data = json.loads(msg)

        if data["type"] == "answer":
            streamer.set_remote_description(data["sdp"])

        elif data["type"] == "ice":
            streamer.add_ice_candidate(
                data["sdpMLineIndex"],
                data["candidate"]
            )

async def main():
    async with websockets.serve(ws_handler, "0.0.0.0", 9000):
        await asyncio.Future()

if __name__ == "__main__":
    GObject.threads_init()
    asyncio.run(main())
