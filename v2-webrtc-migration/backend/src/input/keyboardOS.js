import { exec } from "child_process";

/* ---------------- Key Mapping ---------------- */

const KEY_MAP = {
  Enter: "Return",
  Backspace: "BackSpace",
  Tab: "Tab",
  Escape: "Escape",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Delete: "Delete",
  Home: "Home",
  End: "End",
  PageUp: "Page_Up",
  PageDown: "Page_Down",
  " ": "space"
};

function mapKey(key) {
  return KEY_MAP[key] || key;
}

/* ---------------- Modifiers ---------------- */

function modifiersFromPayload(p) {
  const mods = [];
  if (p.ctrl) mods.push("ctrl");
  if (p.alt) mods.push("alt");
  if (p.shift) mods.push("shift");
  if (p.meta) mods.push("super"); // Windows / Cmd key
  return mods;
}

/* ---------------- Handlers ---------------- */

export function handleKeyDown(payload) {
  const key = mapKey(payload.key);
  const mods = modifiersFromPayload(payload);

  // press modifiers first
  mods.forEach(m => exec(`xdotool keydown ${m}`));

  exec(`xdotool keydown ${key}`);
}

export function handleKeyUp(payload) {
  const key = mapKey(payload.key);
  const mods = modifiersFromPayload(payload);

  exec(`xdotool keyup ${key}`);

  // release modifiers after
  mods.reverse().forEach(m => exec(`xdotool keyup ${m}`));
}

export function releaseAllKeys() {
  ["ctrl", "alt", "shift", "super"].forEach(k =>
    exec(`xdotool keyup ${k}`)
  );
}