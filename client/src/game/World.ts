import { Color3, Color4, HemisphericLight, MeshBuilder, PBRMaterial, StandardMaterial, Texture, TransformNode, Vector3, type Scene } from "@babylonjs/core";
import { Vehicle } from "./Vehicle";

const skyUrl = `${import.meta.env.BASE_URL}assets/veloura-coastal-sky.png`;
const nightSkyUrl = `${import.meta.env.BASE_URL}assets/veloura-coastal-night.png`;

function material(scene: Scene, name: string, color: Color3, roughness = 0.76) {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = color;
  m.roughness = roughness;
  m.metallic = 0.06;
  return m;
}

function makeTree(scene: Scene, parent: TransformNode, x: number, z: number, scale: number, tint: Color3) {
  const root = new TransformNode("tree-root", scene);
  root.parent = parent;
  root.position.set(x, 0, z);
  root.scaling.setAll(scale);
  const trunk = MeshBuilder.CreateCylinder("tree-trunk", { diameterTop: 0.16, diameterBottom: 0.3, height: 2.8, tessellation: 8 }, scene);
  trunk.parent = root;
  trunk.position.y = 1.4;
  trunk.material = material(scene, "trunk-mat", new Color3(0.22, 0.16, 0.13), 0.9);
  const canopy = MeshBuilder.CreateSphere("tree-canopy", { diameter: 2.2, segments: 8 }, scene);
  canopy.parent = root;
  canopy.position.y = 3.15;
  canopy.scaling.y = 0.7;
  canopy.material = material(scene, "canopy-mat", tint, 0.92);
  return root;
}

function makeBuilding(scene: Scene, parent: TransformNode, x: number, z: number, width: number, height: number, color: Color3) {
  const building = MeshBuilder.CreateBox("building", { width, height, depth: 4.3 }, scene);
  building.parent = parent;
  building.position.set(x, height / 2, z);
  building.material = material(scene, "building-mat", color, 0.86);
  for (let row = 0; row < Math.floor(height / 1.8); row += 1) {
    const window = MeshBuilder.CreateBox("window", { width: 0.42, height: 0.42, depth: 0.035 }, scene);
    window.parent = building;
    window.position.set(-width * 0.18 + (row % 2) * width * 0.33, 0.8 + row * 1.55 - height / 2, -2.18);
    const windowMat = material(scene, "window-mat", new Color3(0.76, 0.58, 0.5), 0.28);
    windowMat.emissiveColor = new Color3(0.22, 0.1, 0.08);
    window.material = windowMat;
  }
}

export class World {
  readonly root: TransformNode;
  private readonly roadMaterial: PBRMaterial;
  private readonly laneMaterial: StandardMaterial;
  private readonly curbMaterial: PBRMaterial;
  private readonly backdrop: ReturnType<typeof MeshBuilder.CreatePlane>;
  private readonly nightBackdrop: ReturnType<typeof MeshBuilder.CreatePlane>;
  private readonly daySkyMaterial: StandardMaterial;
  private readonly nightSkyMaterial: StandardMaterial;
  private readonly hemi: HemisphericLight;

  constructor(private readonly scene: Scene) {
    this.root = new TransformNode("world-root", scene);
    scene.clearColor = new Color4(0.18, 0.15, 0.24, 1);

    this.hemi = new HemisphericLight("soft-sky-light", new Vector3(-0.15, 1, -0.25), scene);
    this.hemi.intensity = 0.86;
    this.hemi.diffuse = new Color3(0.94, 0.84, 0.9);
    this.hemi.groundColor = new Color3(0.25, 0.19, 0.3);

    this.roadMaterial = material(scene, "asphalt", new Color3(0.07, 0.075, 0.1), 0.88);
    this.laneMaterial = new StandardMaterial("lane-markers", scene);
    this.laneMaterial.diffuseColor = new Color3(0.83, 0.53, 0.64);
    this.laneMaterial.emissiveColor = new Color3(0.12, 0.04, 0.07);
    this.curbMaterial = material(scene, "pale-curb", new Color3(0.56, 0.48, 0.52), 0.9);

    const terrain = MeshBuilder.CreateGround("terrain", { width: 220, height: 1800 }, scene);
    terrain.parent = this.root;
    terrain.position.z = 840;
    terrain.material = material(scene, "terrain-mat", new Color3(0.13, 0.16, 0.14), 0.96);

    const road = MeshBuilder.CreateGround("road", { width: 13.5, height: 1800 }, scene);
    road.parent = this.root;
    road.position.y = 0.018;
    road.position.z = 840;
    road.material = this.roadMaterial;

    for (let z = -35; z < 1740; z += 9) {
      const dash = MeshBuilder.CreateBox("center-dash", { width: 0.16, height: 0.028, depth: 4.6 }, scene);
      dash.parent = this.root;
      dash.position.set(0, 0.06, z);
      dash.material = this.laneMaterial;
      for (const x of [-6.65, 6.65]) {
        const line = MeshBuilder.CreateBox("edge-line", { width: 0.12, height: 0.03, depth: 8.2 }, scene);
        line.parent = this.root;
        line.position.set(x, 0.065, z);
        line.material = this.laneMaterial;
      }
    }

    for (const x of [-7.2, 7.2]) {
      const curb = MeshBuilder.CreateBox("curb", { width: 0.42, height: 0.24, depth: 1800 }, scene);
      curb.parent = this.root;
      curb.position.set(x, 0.13, 840);
      curb.material = this.curbMaterial;
    }

    for (let i = 0; i < 72; i += 1) {
      const z = -12 + i * 26;
      const side = i % 2 === 0 ? 1 : -1;
      const zone = i < 24 ? "coast" : i < 48 ? "town" : "garden";
      const treeTint = zone === "coast" ? new Color3(0.20, 0.31, 0.25) : zone === "town" ? new Color3(0.25, 0.27, 0.24) : new Color3(0.28, 0.36, 0.25);
      makeTree(scene, this.root, side * (10.5 + (i % 3) * 1.6), z, 0.82 + (i % 4) * 0.08, treeTint);
      if (zone === "town" || i % 4 === 0) makeBuilding(scene, this.root, -side * (16.8 + (i % 3) * 2), z + 8, 5.3 + (i % 2) * 2, 4.3 + (i % 4) * 0.7, zone === "town" ? new Color3(0.38, 0.34, 0.40) : new Color3(0.5, 0.39, 0.4));
      if (zone === "coast" && i % 5 === 0) makeBuilding(scene, this.root, side * 20, z + 14, 8.6, 2.4, new Color3(0.48, 0.42, 0.38));
      if (zone === "garden" && i % 6 === 0) makeTree(scene, this.root, -side * 15.5, z + 10, 1.35, new Color3(0.14, 0.25, 0.19));
    }

    this.backdrop = MeshBuilder.CreatePlane("coastal-backdrop", { width: 220, height: 90 }, scene);
    this.backdrop.position.set(0, 22, 145);
    this.backdrop.rotation.y = Math.PI;
    this.daySkyMaterial = new StandardMaterial("coastal-backdrop-material", scene);
    const skyTexture = new Texture(skyUrl, scene, true, false);
    skyTexture.vScale = -1;
    skyTexture.vOffset = 1;
    this.daySkyMaterial.diffuseTexture = skyTexture;
    this.daySkyMaterial.emissiveTexture = skyTexture;
    this.daySkyMaterial.disableLighting = true;
    this.daySkyMaterial.backFaceCulling = false;
    this.backdrop.material = this.daySkyMaterial;

    this.nightBackdrop = this.backdrop.clone("night-backdrop")!;
    this.nightBackdrop.position.z = 145;
    this.nightSkyMaterial = new StandardMaterial("night-backdrop-material", scene);
    const nightTexture = new Texture(nightSkyUrl, scene, true, false);
    nightTexture.vScale = -1;
    nightTexture.vOffset = 1;
    this.nightSkyMaterial.diffuseTexture = nightTexture;
    this.nightSkyMaterial.emissiveTexture = nightTexture;
    this.nightSkyMaterial.disableLighting = true;
    this.nightSkyMaterial.backFaceCulling = false;
    this.nightSkyMaterial.alpha = 0;
    this.nightSkyMaterial.transparencyMode = 2;
    this.nightBackdrop.material = this.nightSkyMaterial;

    const water = MeshBuilder.CreateGround("water", { width: 50, height: 900 }, scene);
    water.parent = this.root;
    water.position.set(-35, -0.06, 840);
    water.material = material(scene, "water-mat", new Color3(0.16, 0.22, 0.32), 0.2);
  }

  update(vehicle: Vehicle, elapsedSeconds = 0) {
    const position = vehicle.getPosition();
    this.backdrop.position.z = position.z + 145;
    this.nightBackdrop.position.z = position.z + 145;
    const cycle = elapsedSeconds % 600;
    const transition = cycle < 285 ? 0 : cycle < 315 ? (cycle - 285) / 30 : cycle < 585 ? 1 : (600 - cycle) / 15;
    const nightBlend = Math.max(0, Math.min(1, transition));
    this.nightSkyMaterial.alpha = nightBlend;
    this.hemi.intensity = 0.86 - nightBlend * 0.48;
    this.hemi.diffuse = Color3.Lerp(new Color3(0.94, 0.84, 0.9), new Color3(0.18, 0.23, 0.42), nightBlend);
    this.hemi.groundColor = Color3.Lerp(new Color3(0.25, 0.19, 0.3), new Color3(0.03, 0.04, 0.10), nightBlend);
    this.roadMaterial.albedoColor = Color3.Lerp(new Color3(0.07, 0.075, 0.1), new Color3(0.035, 0.04, 0.075), nightBlend);
    this.scene.fogColor = Color3.Lerp(new Color3(0.28, 0.22, 0.34), new Color3(0.035, 0.04, 0.11), nightBlend);
    // Keep the authored route centered on the vehicle. This makes the coastal world
    // effectively endless without popping or running out of buildings and trees.
    this.root.position.z = position.z;
  }

  dispose() {
    this.root.dispose(false, true);
    this.backdrop.dispose(false, true);
    this.nightBackdrop.dispose(false, true);
  }
}
