import { handleKeyPress } from "./handleKeyPress.js";
import { handleMouseClick } from "./handleMouseClick.js";
import {
  handleClick,
  mapToDisplay,
  mouseDown,
  mouseUp,
} from "./handleInputsOS.js";
import { handleScroll } from "./handleScroll.js";

export async function handleInput(session, data) {
  const page = session.page; // Puppeteer page
  if (!page) return;
  console.log("handleInput called");
  const { type, payload } = data;

  if (type === "mouseClick") {
    // await handleMouseClick(session, payload);
    mapToDisplay(session, payload);
    handleClick();
  }

  if (type === "keyPress") {
    await handleKeyPress(page, payload);
  }

  if (type === "scroll") {
    await handleScroll(session, payload);
  }

  if (type === "mouseMove") {
    mapToDisplay(session, payload);
  }

  if (data.type === "mouseDown") {
    mouseDown(1);
  }

  if (data.type === "mouseUp") {
    mouseUp(1);
  }
}
