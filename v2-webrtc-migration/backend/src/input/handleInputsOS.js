import { exec } from "child_process";

export const mapToDisplay = (session, payload) => {
  const { x, y, videoWidth, videoHeight } = payload;
  const { width, height } = session.display;

  const scaleX = width / videoWidth;
  const scaleY = height / videoHeight;

  const finalX = Math.round(x * scaleX);
  const finalY = Math.round(y * scaleY);
  moveMouse(finalX, finalY);
  console.log("moved", finalX, finalY);
};

export const handleClick = () => {
  console.log('clicked')
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
