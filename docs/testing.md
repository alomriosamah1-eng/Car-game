# Testing

## Automated checks

- `pnpm check` is the TypeScript gate.
- `pnpm build` is the production bundle gate.
- WebDev preview screenshots are captured at desktop and mobile sizes for visual verification.
- The `?demo` URL path runs a deterministic autopilot so the scene can be observed without manual input.

## Manual browser checks

1. Load `/` and confirm the Babylon canvas, HUD and lower navigation render.
2. Hold throttle and steering buttons; confirm the car accelerates and changes lane.
3. Release throttle, hold brake, then hold brake from rest; confirm braking and reverse behavior.
4. Open Garage; select each car and color; confirm the 3D body changes.
5. Toggle chase/cockpit camera during motion.
6. Open Settings; switch Buttons, Wheel and Motion. Drag the wheel and confirm it recenters. Motion responds when the browser provides DeviceOrientation.
7. Open Music; choose a local audio file; play/pause and adjust volume.
8. Open Info; confirm the Offline-first and browser limitation notes are visible.
9. Resize to a mobile viewport and confirm controls remain reachable without horizontal overflow.
10. Leave and re-enter panels repeatedly; watch for runtime errors and detached overlays.

## Environment limitation

No physical Android handset or Expo Go runtime was available in this WebDev session. Native motion permission dialogs, Android audio focus, background music behavior, APK size, hardware FPS, RAM and battery drain therefore remain unverified and are listed in `docs/known-limitations.md`.

## Results from this build

`pnpm check` passed after the final scene and UI changes. `pnpm build` passed and produced the production bundle. WebDev screenshots passed at 1280x720 and 375x812. Browser interaction passed for opening Garage, selecting Seren GT, opening Settings, and activating the Wheel mode; the browser console remained empty during those checks. The `?demo` capture rendered the deterministic driving scene and HUD without a runtime error.
