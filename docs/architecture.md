# Architecture

Veloura Drive uses a thin React presentation layer around a Babylon.js scene. React owns the full-screen shell, HUD, drawer panels, settings state and browser file picker. Babylon owns the render loop, cameras, scene graph, procedural environment, vehicle meshes and per-frame gameplay update. The two layers meet through the `GameHandle` contract returned from `client/src/game/scene.ts`.

The vehicle is not a fake position-only sprite. `Vehicle.update()` integrates acceleration, rolling resistance, brake force, reverse gating, steering interpolation, grip, lateral velocity, road-boundary slowdown and wheel rotation using a clamped delta time. The model is intentionally lightweight instead of relying on an unverified native physics plugin in a browser build.

`InputManager` translates keyboard, touch, wheel and DeviceOrientation signals into one semantic `InputState`. `AudioManager` creates a user-gesture-unlocked Web Audio graph with idle, low-RPM and high-RPM layers whose frequency/gain follow RPM, throttle and braking. It also owns the local `HTMLAudioElement` for user-selected music.

`World` owns the road, lane markers, curbs, trees, buildings, water, sky plane and light. Materials are created once, repeated props use consistent low-complexity geometry, and scene disposal is explicit. No React component directly mutates Babylon meshes during the render loop.
