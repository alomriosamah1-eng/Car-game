import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Vehicle } from "./Vehicle";
import { World } from "./World";
import { AudioManager } from "./AudioManager";
import { InputManager } from "./InputManager";
import { DEFAULT_SNAPSHOT, type CameraMode, type CarId, type ControlMode, type GameSnapshot } from "./types";

export interface GameHandle {
  scene: Scene;
  unlockAudio: () => void;
  dispose: () => void;
  setCar: (carId: CarId, color: string) => void;
  setControlMode: (mode: ControlMode) => void;
  setCamera: (camera: CameraMode) => void;
  toggleMusic: () => boolean;
  setMusicFile: (file: File) => void;
  setEngineEnabled: (enabled: boolean) => void;
  setEffectsVolume: (value: number) => void;
  setMusicVolume: (value: number) => void;
  reset: () => void;
  startDrive: () => void;
  setPaused: (paused: boolean) => void;
}

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement, onSnapshot?: (snapshot: GameSnapshot) => void): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color3(0.1, 0.08, 0.14).toColor4(1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0042;
  scene.fogColor = new Color3(0.28, 0.22, 0.34);

  const world = new World(scene);
  const vehicle = new Vehicle(scene);
  // Start instantly with the lightweight fallback; upgrade to the realistic GLB
  // asynchronously so a slower mobile connection never shows a blank game.
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  if (!isMobile) {
    window.setTimeout(() => {
      void vehicle.loadRealExterior(`${import.meta.env.BASE_URL}assets/veloura-car-concept.glb`);
    }, 3500);
  }
  const input = new InputManager();
  const audio = new AudioManager();
  let cameraMode: CameraMode = "chase";
  let demo = new URLSearchParams(window.location.search).has("demo");
  let driveStarted = demo;
  let paused = false;
  let elapsedSeconds = 0;
  let disposed = false;

  const chaseCamera = new FreeCamera("chase-camera", new Vector3(0, 4.8, -9.6), scene);
  chaseCamera.fov = 0.82;
  chaseCamera.minZ = 0.08;
  const cockpitCamera = new FreeCamera("cockpit-camera", new Vector3(0, 1.7, 1.05), scene);
  cockpitCamera.fov = 1.12;
  cockpitCamera.minZ = 0.06;
  cockpitCamera.position.set(-0.18, 1.7, 0.15);
  scene.activeCamera = chaseCamera;

  const applyCamera = (mode: CameraMode) => {
    cameraMode = mode;
    vehicle.setCockpitVisible(mode === "cockpit");
    scene.activeCamera = mode === "chase" ? chaseCamera : cockpitCamera;
  };

  vehicle.setCockpitVisible(false);

  const handle = {
    scene,
    unlockAudio: () => audio.unlock(),
    setCar: (carId: CarId, color: string) => vehicle.setCar(carId, color),
    setControlMode: (mode: ControlMode) => input.setMode(mode),
    setCamera: applyCamera,
    toggleMusic: () => audio.toggleMusic(),
    setMusicFile: (file: File) => audio.setMusicFile(file),
    setEngineEnabled: (enabled: boolean) => audio.setEngineEnabled(enabled),
    setEffectsVolume: (value: number) => audio.setEffectsVolume(value),
    setMusicVolume: (value: number) => audio.setMusicVolume(value),
    reset: () => vehicle.reset(),
    startDrive: () => { driveStarted = true; },
    setPaused: (value: boolean) => { paused = value; },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      input.dispose();
      audio.dispose();
      vehicle.dispose();
      world.dispose();
      scene.dispose();
    },
  } satisfies GameHandle;

  const updateCamera = (dt: number) => {
    const p = vehicle.getPosition();
    const yaw = vehicle.getRotationY();
    if (cameraMode === "chase") {
      const desired = new Vector3(p.x - Math.sin(yaw) * 7.7, p.y + 2.8, p.z - Math.cos(yaw) * 8.4);
      chaseCamera.position = Vector3.Lerp(chaseCamera.position, desired, 1 - Math.pow(0.0005, dt));
      chaseCamera.setTarget(new Vector3(p.x + Math.sin(yaw) * 6.0, p.y + 0.72, p.z + Math.cos(yaw) * 6.0));
    } else {
      const desired = new Vector3(p.x - Math.cos(yaw) * 0.18, p.y + 1.48, p.z + Math.sin(yaw) * 0.18);
      cockpitCamera.position = Vector3.Lerp(cockpitCamera.position, desired, 1 - Math.pow(0.0002, dt));
      cockpitCamera.setTarget(new Vector3(p.x + Math.sin(yaw) * 7.5, p.y + 1.32, p.z + Math.cos(yaw) * 7.5));
    }
  };

  scene.onBeforeRenderObservable.add(() => {
    if (disposed) return;
    const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    elapsedSeconds += dt;
    const control = input.getState();
    if (paused) return;
    if (demo) {
      const t = performance.now() / 1000;
      control.throttle = 0.64 + Math.sin(t * 0.45) * 0.14;
      control.brake = t % 16 > 13 ? 0.45 : 0;
      control.steer = Math.sin(t * 0.26) * 0.34;
    }
    if (driveStarted && control.brake < 0.01 && control.throttle < 0.01) control.throttle = 0.24;
    vehicle.update(control, dt);
    world.update(vehicle, elapsedSeconds);
    updateCamera(dt);
    audio.update(vehicle.getRpm(), control.throttle, control.brake);
    onSnapshot?.({
      ...DEFAULT_SNAPSHOT,
      speed: vehicle.getSpeed(),
      rpm: vehicle.getRpm(),
      distance: vehicle.getDistance(),
      camera: cameraMode,
      controlMode: input.getMode(),
      carId: vehicle.getSpec().id,
      audioUnlocked: audio.unlocked,
    });
  });

  const unlock = () => audio.unlock();
  canvas.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { once: true });
  const oldDispose = handle.dispose;
  handle.dispose = () => {
    canvas.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    oldDispose();
  };

  return handle;
}
