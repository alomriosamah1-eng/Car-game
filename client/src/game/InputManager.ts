import { DEFAULT_INPUT, type ControlMode, type InputState } from "./types";

type TouchAction = "throttle" | "brake" | "left" | "right";

export class InputManager {
  private readonly input: InputState = { ...DEFAULT_INPUT };
  private mode: ControlMode = "buttons";
  private wheelValue = 0;
  private orientationValue = 0;
  private keys = new Set<string>();
  private readonly onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.key.toLowerCase());
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(event.key.toLowerCase())) event.preventDefault();
  };
  private readonly onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
  private readonly onTouch = (event: Event) => {
    const detail = (event as CustomEvent<{ action: TouchAction; pressed: boolean }>).detail;
    if (!detail) return;
    if (detail.action === "throttle") this.input.throttle = detail.pressed ? 1 : 0;
    if (detail.action === "brake") this.input.brake = detail.pressed ? 1 : 0;
    if (detail.action === "left") this.input.steer = detail.pressed ? -1 : this.input.steer === -1 ? 0 : this.input.steer;
    if (detail.action === "right") this.input.steer = detail.pressed ? 1 : this.input.steer === 1 ? 0 : this.input.steer;
  };
  private readonly onWheel = (event: Event) => {
    const detail = (event as CustomEvent<{ value: number }>).detail;
    if (detail && typeof detail.value === "number") this.wheelValue = Math.max(-1, Math.min(1, detail.value));
  };
  private readonly onOrientation = (event: DeviceOrientationEvent) => {
    if (typeof event.gamma === "number") this.orientationValue = Math.max(-1, Math.min(1, event.gamma / 26));
  };

  constructor() {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("veloura-input", this.onTouch);
    window.addEventListener("veloura-wheel", this.onWheel);
    window.addEventListener("deviceorientation", this.onOrientation);
  }

  setMode(mode: ControlMode) {
    this.mode = mode;
  }

  getMode() {
    return this.mode;
  }

  getState() {
    const keyboardThrottle = this.keys.has("arrowup") || this.keys.has("w") ? 1 : 0;
    const keyboardBrake = this.keys.has("arrowdown") || this.keys.has("s") || this.keys.has(" ") ? 1 : 0;
    const keyboardSteer = this.keys.has("arrowleft") || this.keys.has("a") ? -1 : this.keys.has("arrowright") || this.keys.has("d") ? 1 : 0;
    const steer = this.mode === "wheel" ? this.wheelValue : this.mode === "motion" ? this.orientationValue : keyboardSteer || this.input.steer;
    return {
      throttle: Math.max(keyboardThrottle, this.input.throttle),
      brake: Math.max(keyboardBrake, this.input.brake),
      steer,
    } satisfies InputState;
  }

  resetTouch() {
    this.input.throttle = 0;
    this.input.brake = 0;
    this.input.steer = 0;
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("veloura-input", this.onTouch);
    window.removeEventListener("veloura-wheel", this.onWheel);
    window.removeEventListener("deviceorientation", this.onOrientation);
  }
}
