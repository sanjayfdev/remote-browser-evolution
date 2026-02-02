import { exec } from "child_process";

export const mapToDisplay = (session, payload) => {
  const { x, y, videoWidth, videoHeight } = payload;
  const { width, height } = session.display;

  const scaleX = width / videoWidth;
  const scaleY = height / videoHeight;

  const finalX = Math.round(x * scaleX);
  const finalY = Math.round(y * scaleY);
  moveMouse(finalX, finalY);
  // console.log("moved", finalX, finalY);
};

export const handleClick = () => {
  // console.log('clicked')
  mouseDown(1);
  mouseUp(1);
};

function moveMouse(x, y) {
  exec(`DISPLAY=:99 xdotool mousemove ${x} ${y}`);
}

export function mouseDown(button = 1) {
  exec(`xdotool mousedown ${button}`);
}

export function mouseUp(button = 1) {
  exec(`xdotool mouseup ${button}`);
}

export function onTakeControl(session) {
  exec(`xdotool search --onlyvisible --class chrome windowactivate`);
}

export async function handleKeyPress(page, payload) {
  console.log(payload);
  const { key } = payload;
  try {
    await page.keyboard.press(key);
  } catch (err) {
    console.error("Key press failed:", key);
  }
}

export function handleKeyPressOS(payload) {
  const { key, ctrl, alt, shift, meta } = payload;

  let modifiers = [];
  if (ctrl) modifiers.push("ctrl");
  if (alt) modifiers.push("alt");
  if (shift) modifiers.push("shift");
  if (meta) modifiers.push("super");

  const combo = [...modifiers, key].join("+");

  exec(`xdotool key ${combo}`);
}

export const handleMouseWheel = (payload) => {
  const { direction, amount = 1 } = payload;

  const button = direction === "up" ? 4 : 5;

   // Convert wheel delta into discrete scroll steps
  const clicks = Math.max(1, Math.round(amount / 30));

  for (let i = 0; i < clicks; i++) {
    exec(`xdotool click ${button}`);
  } 
};
