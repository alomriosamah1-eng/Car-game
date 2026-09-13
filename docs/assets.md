# Assets and licenses

## Shipped assets

The shipped build uses three generated visual assets stored through WebDev storage. `veloura-reference.png` is a 2560x1440 art-direction reference. `veloura-coastal-sky.png` is the 2560x1440 scenic backdrop loaded by Babylon. `veloura-car-cutout.png` is the 1920x1920 transparent coupe used by the Garage panel. These were generated for this project with Manus built-in image generation and are not sourced from a third-party repository.

The game world and the three runtime vehicles are procedural Babylon meshes. This is a deliberate licensing and performance decision: no external GLB, audio pack, or UI icon pack is silently bundled.

The exterior now also loads `veloura-car-concept.glb`, the Khronos glTF Sample Assets **Car Concept** model, when available. The model is credited to Eric Chadwick / Darmstadt Graphics Group GmbH and is listed under Creative Commons Attribution 4.0 International in the Khronos showcase. The Khronos and 3D Commerce logos included in the sample are identified by Khronos as non-copyrightable legal marks. The source and credit are documented at [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/Models-showcase.md). The procedural exterior remains as a runtime fallback if the GLB cannot be loaded; the custom cockpit, steering wheel and driver details remain project-owned Babylon geometry.

## GitHub research decisions

The research workflow inspected BabylonJS/Babylon.js (Apache-2.0), mmmovania/BabylonPhysicsTutorials (Apache-2.0), manuelhintermayr/babylon-js-car-example (MIT), pmndrs/cannon-es (MIT), KayKit City Builder Bits (CC0), TheDuckCow/godot-road-generator (MIT), Khronos glTF CarConcept (CC BY 4.0), Swastyy/gltf-car (CC BY 4.0), Antonio-R1/engine-sound-generator (MIT), romainsimon/uisfx (MIT code and CC0 audio), Heroicons (MIT), Tabler Icons (MIT), and game-icons (mixed CC BY/CC0 by icon).

These repositories were not copied into the application. The reason is scope discipline: the current build can provide a stable playable scene without adding large assets, a native physics dependency, WASM loaders, or license notices for content that has not been integrated. The research remains a documented upgrade path. If a native production build is started, `cannon-es` or a Babylon raycast vehicle adapter is the most practical physics candidate, while KayKit City Builder Bits and Khronos CarConcept are the clearest asset candidates after attribution and trademark review.

## Offline rule

Every runtime texture used by the application is either generated and hosted in project storage or created procedurally. There are no runtime API calls, remote CDN asset dependencies, login requirements, or cloud gameplay services.
