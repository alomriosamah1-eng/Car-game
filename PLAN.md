# Game Plan: Veloura Drive

## Direction

Veloura Drive is a premium, calm 3D driving experience for browser/WebDev. The shipped target is a self-contained Babylon.js scene with procedural low-cost geometry, generated visual anchors, and a mobile-first glass HUD. The art direction is pearl, mauve, dusty rose, midnight plum, and warm coastal blue at blue hour.

## Risk Tasks

### 1. Vehicle physics and reverse behavior
- **Why isolated:** Vehicle handling needs to feel responsive without introducing a heavyweight physics plugin or frame-rate-dependent drift.
- **Approach:** Use a deterministic, delta-time-clamped vehicle integrator with acceleration, rolling resistance, braking, reverse gating below a safe speed, lateral grip, steering smoothing, boundary collision, wheel rotation, RPM estimation, and camera follow.
- **Verify:** Hold throttle, release, brake, and reverse at rest; confirm speed rises/falls smoothly, reverse only engages near rest, steering changes heading and lateral position, and leaving the road slows the car instead of tunneling through the world.

### 2. Camera handoff
- **Why isolated:** Chase and cockpit cameras require different offsets and orientation rules while preserving a stable view during steering.
- **Approach:** Use two FreeCamera instances with smoothed positional interpolation. Chase targets ahead of the vehicle; cockpit follows the vehicle cabin position and yaw.
- **Verify:** Toggle the camera repeatedly while moving; confirm the handoff is stable, no snap to origin occurs, and both views show the car/world at usable scale.

### 3. Three input modes
- **Why isolated:** Buttons, wheel pointer gestures, and DeviceOrientation have different browser event lifecycles.
- **Approach:** Centralize input into semantic actions. Keyboard and touch buttons map to throttle/brake/steer. The wheel emits a normalized -1..1 value. Motion listens to `deviceorientation` and clamps gamma for gradual steering.
- **Verify:** Each mode drives the same vehicle state, wheel drag recenters on release, motion mode remains usable when no sensor event exists, and listeners are removed on dispose.

## Main Build

- **Assets needed:** generated 16:9 art-direction reference, generated coastal sky backdrop, generated transparent coupe cutout for Garage; procedural road, buildings, curbs, trees, water, and car mesh for runtime.
- **Verify:**
  - Movement direction matches input; braking and reverse are distinct at speed/rest.
  - HUD updates speed, RPM, distance, vehicle name, camera and control mode.
  - Garage car selection and color selection affect the 3D vehicle.
  - Buttons, wheel, motion mode, camera toggle, settings, local music picker, mute and sliders are functional.
  - No missing texture or placeholder UI assets; scene renders without browser console errors.
  - The scene remains readable at desktop 1280x720 and mobile 375x812.
  - `?demo` produces deterministic driving for visual verification.
  - Performance favors modest draw calls, reused materials, simple meshes, clamped update delta, no external API dependency, and no runtime network calls after the generated storage assets are cached by the host.

## Acceptance notes

The original brief asks for a native Expo/React Native Android build and Expo Go testing. This WebDev session ships a browser/Babylon.js game because native Expo project execution and QR/Expo Go device testing are not available in this environment. The limitation is documented in `docs/known-limitations.md`; no native capability is represented as verified.
