import { Router } from "express";
import { startStream, stopStream } from "../controllers/browser.controller.js";

const streamRouter = (sessionManager, router, mediaCodecs) => {
  const streamRouter = Router();
  streamRouter.post("/start", startStream(sessionManager, router, mediaCodecs));

  streamRouter.post("/stop", stopStream(sessionManager));
  return streamRouter;
};

export default streamRouter;
