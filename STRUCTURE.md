# Veloura Drive Structure

```text
React frame
└── GameCanvas.tsx
    ├── Babylon Engine lifecycle
    ├── HUD / panels / responsive controls
    └── game/scene.ts
        ├── World.ts       procedural road, coast, buildings, trees, water
        ├── Vehicle.ts     vehicle mesh + delta-time movement model
        ├── InputManager.ts semantic keyboard, touch, wheel and motion input
        ├── AudioManager.ts Web Audio layered RPM synth + local music element
        └── types.ts       data contracts, specs, formatting helpers
```

## Ownership

`GameCanvas.tsx` owns React UI state and the Babylon engine lifecycle. `scene.ts` owns the Babylon scene, delegates gameplay to plain TypeScript classes, and exposes a narrow `GameHandle` contract. `World` owns environment meshes and scene lighting. `Vehicle` owns car meshes and movement state. `InputManager` owns DOM listeners and emits a normalized `InputState`. `AudioManager` owns Web Audio nodes and the local audio element. No gameplay rule is hidden in React state.

## Runtime contract

- The engine is initialized once per component lifecycle and disposed on unmount.
- The scene update is one `onBeforeRenderObservable` callback with a clamped delta.
- Input listeners are removed by `InputManager.dispose()`.
- Audio is unlocked on a user gesture and never attempts autoplay before interaction.
- All persistent preferences in this build are in React state for the active session; native Android persistent storage is a future Expo-only concern.

## Performance choices

The environment uses low-complexity procedural meshes and shared materials, a single active scene, no physics plugin, no imported GLB pipeline, no post-processing stack, no particle systems, and a clamped simulation delta. The car model is composed of a small number of boxes/cylinders, which is intentional for medium hardware/browser WebGL targets.
