import {
  handleClick,
  handleKeyPressOS,
  handleMouseWheel,
  mapToDisplay,
} from "./mouseInputs.js";
import { handleKeyDown, handleKeyUp } from "./keyboardOS.js";

export async function handleInput(session, data) {
  const page = session.page;
  if (!page) return;
  const { type, payload } = data.payload;

  switch (type) {
    case "mouseMove":
      mapToDisplay(session, payload);
      break;

    case "mouseClick":
      mapToDisplay(session, payload);
      handleClick();
      break;

    case "keyDown":
      handleKeyDown(payload);
      break;

    case "keyUp":
      handleKeyUp(payload);
      break;

    case "keyPress":
      handleKeyPressOS(payload);
      break;

    case "scroll":
      handleMouseWheel(payload);
      break;
  }
}
