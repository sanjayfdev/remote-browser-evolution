import { execSync } from "child_process";

export function getDisplaySize() {
  const out = execSync("xdpyinfo | grep dimensions").toString();
  const match = out.match(/(\d+)x(\d+)\s+pixels/);

  if (!match) throw new Error("Cannot read X11 display size");

  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
  };
}