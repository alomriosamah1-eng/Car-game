# Performance

Veloura Drive targets a stable browser WebGL experience on mid-range devices rather than maximum visual effects. The runtime scene uses simple boxes, cylinders, planes and a small number of materials. There is no imported GLB, no shadow map, no post-process chain, and no online scene streaming. The world is a fixed road strip with repeated lightweight roadside props; this keeps draw-call and geometry costs predictable.

The simulation clamps each frame delta to 50ms so a tab switch or temporary stall cannot produce a large physics jump. Camera motion is interpolated rather than rebuilt every frame. React state is updated from the Babylon loop for HUD data only; core movement remains outside React. Audio uses three small Web Audio oscillator layers instead of loading large audio banks.

The generated backdrop is stored outside the source tree through WebDev storage. It is a 2560x1440 PNG reference asset; production packaging can transcode it to a GPU-compressed format in a native build. The current browser build favors a single backdrop texture and no texture atlas.

A future native build should add Android texture compression, LOD variants for the environment, object pooling for traffic/props, explicit scene unloads between routes, and persistent settings via AsyncStorage/MMKV.
