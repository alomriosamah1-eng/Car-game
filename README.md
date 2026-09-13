# Veloura Drive

**Veloura Drive** is a polished, offline-first 3D coastal driving experience built with React and Babylon.js. It uses a calm pearl / mauve / blue-hour visual identity, a lightweight procedural environment, selectable cars, dynamic vehicle audio, and a glass HUD designed mobile-first.

## Run

```bash
pnpm install
pnpm dev
```

Open the WebDev preview. Add `?demo` to the URL for deterministic autopilot verification.

## Features

- Playable 3D driving with acceleration, rolling resistance, braking, reverse gating, steering, grip and boundary collision.
- Three car profiles: Aurelia S, Seren GT and Mira E; car color customization updates the runtime mesh.
- Chase and cockpit camera modes.
- Buttons, pointer steering wheel and DeviceOrientation motion input.
- Dynamic RPM-based Web Audio layers for idle, low and high engine states.
- Local music picker using browser file input; play/pause and volume.
- Arabic/English UI toggle, responsive mobile layout, Garage, Settings, Music and Info panels.
- Generated art direction, coastal backdrop and transparent coupe visual asset.

## Scope note

The prompt requested a native Android Expo/React Native app and physical Expo Go verification. The current environment exposes the WebDev/Babylon game pipeline, so this repository is the browser implementation with limitations documented honestly in `docs/known-limitations.md`. It is not an APK and it does not claim native sensor/audio behavior was verified.

## Documentation

- `PLAN.md` — staged build plan, risk tasks and verification criteria.
- `STRUCTURE.md` — module ownership and runtime contract.
- `ASSETS.md` — generated assets, URLs and licensing decisions.
- `docs/performance.md` — performance and memory strategy.
- `docs/testing.md` — browser test plan and results to record.
- `docs/known-limitations.md` — Expo, motion, local music and audio limitations.
