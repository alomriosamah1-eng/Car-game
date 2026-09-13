# Memory

- Project initialized as WebDev `web-static` because the available game-dev pipeline is Babylon.js in React.
- Babylon dependency installed: `@babylonjs/core`.
- Generated and uploaded three project-specific visual anchors through WebDev storage.
- Runtime geometry is procedural; no GLB or third-party GitHub asset is currently trusted or bundled.
- Main risk slices implemented first: vehicle movement, camera handoff, input modes.
- Browser audio must be unlocked by a user gesture. The scene uses a dynamic Web Audio synthesizer plus local file playback.
- Future debugging focus: verify Babylon deep import paths and `Color3` material types with `pnpm check`; then visually verify at desktop and mobile sizes.
