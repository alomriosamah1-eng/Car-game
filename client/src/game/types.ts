export type ControlMode = "buttons" | "wheel" | "motion";
export type CameraMode = "chase" | "cockpit";
export type CarId = "aurelia" | "seren" | "mira";

export interface VehicleSpec {
  id: CarId;
  name: string;
  subtitle: string;
  topSpeed: number;
  acceleration: number;
  braking: number;
  handling: number;
  weight: number;
  grip: number;
  defaultColor: string;
  accent: string;
}

export interface InputState {
  throttle: number;
  brake: number;
  steer: number;
}

export interface GameSnapshot {
  speed: number;
  rpm: number;
  distance: number;
  camera: CameraMode;
  controlMode: ControlMode;
  carId: CarId;
  color: string;
  audioUnlocked: boolean;
}

export const VEHICLES: VehicleSpec[] = [
  {
    id: "aurelia",
    name: "Aurelia S",
    subtitle: "Grand tourer",
    topSpeed: 172,
    acceleration: 17,
    braking: 42,
    handling: 1.08,
    weight: 1540,
    grip: 0.94,
    defaultColor: "#f4eee6",
    accent: "#d2a28e",
  },
  {
    id: "seren",
    name: "Seren GT",
    subtitle: "Light sport",
    topSpeed: 188,
    acceleration: 20,
    braking: 45,
    handling: 1.22,
    weight: 1320,
    grip: 1.02,
    defaultColor: "#d8d4ed",
    accent: "#a49bcf",
  },
  {
    id: "mira",
    name: "Mira E",
    subtitle: "Electric calm",
    topSpeed: 160,
    acceleration: 24,
    braking: 48,
    handling: 1.14,
    weight: 1760,
    grip: 0.98,
    defaultColor: "#cadbd2",
    accent: "#90b3a5",
  },
];

export const COLORS = ["#f4eee6", "#d8d4ed", "#cadbd2", "#d7a6b3", "#22242d"];

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function getVehicle(id: CarId) {
  return VEHICLES.find((vehicle) => vehicle.id === id) ?? VEHICLES[0];
}

export function hexToColor3(hex: string) {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16) / 255;
  const g = Number.parseInt(value.slice(2, 4), 16) / 255;
  const b = Number.parseInt(value.slice(4, 6), 16) / 255;
  return { r, g, b };
}

export function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatSpeed(speed: number) {
  return `${Math.max(0, Math.round(speed * 3.6))}`;
}

export function formatRpm(rpm: number) {
  return `${Math.round(rpm / 100) * 100}`;
}

export const DEFAULT_SNAPSHOT: GameSnapshot = {
  speed: 0,
  rpm: 850,
  distance: 0,
  camera: "chase",
  controlMode: "buttons",
  carId: "aurelia",
  color: VEHICLES[0].defaultColor,
  audioUnlocked: false,
};

export const DEFAULT_INPUT: InputState = { throttle: 0, brake: 0, steer: 0 };
