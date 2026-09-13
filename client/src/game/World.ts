import { Color3, Color4, HemisphericLight, MeshBuilder, PBRMaterial, StandardMaterial, Texture, TransformNode, Vector3, type Scene } from "@babylonjs/core";
import { Vehicle } from "./Vehicle";

const skyUrl = "/manus-storage/veloura-coastal-sky_2077940b.png";

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

  constructor(private readonly scene: Scene) {
    this.root = new TransformNode("world-root", scene);
    scene.clearColor = new Color4(0.18, 0.15, 0.24, 1);

    const hemi = new HemisphericLight("soft-sky-light", new Vector3(-0.15, 1, -0.25), scene);
    hemi.intensity = 0.86;
    hemi.diffuse = new Color3(0.94, 0.84, 0.9);
    hemi.groundColor = new Color3(0.25, 0.19, 0.3);

    this.roadMaterial = material(scene, "asphalt", new Color3(0.07, 0.075, 0.1), 0.88);
    this.laneMaterial = new StandardMaterial("lane-markers", scene);
    this.laneMaterial.diffuseColor = new Color3(0.83, 0.53, 0.64);
    this.laneMaterial.emissiveColor = new Color3(0.12, 0.04, 0.07);
    this.curbMaterial = material(scene, "pale-curb", new Color3(0.56, 0.48, 0.52), 0.9);

    const terrain = MeshBuilder.CreateGround("terrain", { width: 190, height: 900 }, scene);
    terrain.parent = this.root;
    terrain.position.z = 390;
    terrain.material = material(scene, "terrain-mat", new Color3(0.13, 0.16, 0.14), 0.96);

    const road = MeshBuilder.CreateGround("road", { width: 13.5, height: 900 }, scene);
    road.parent = this.root;
    road.position.y = 0.018;
    road.position.z = 390;
    road.material = this.roadMaterial;

    for (let z = -35; z < 840; z += 9) {
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
      const curb = MeshBuilder.CreateBox("curb", { width: 0.42, height: 0.24, depth: 900 }, scene);
      curb.parent = this.root;
      curb.position.set(x, 0.13, 390);
      curb.material = this.curbMaterial;
    }

    for (let i = 0; i < 32; i += 1) {
      const z = -12 + i * 26;
      const side = i % 2 === 0 ? 1 : -1;
      makeTree(scene, this.root, side * (10.5 + (i % 3) * 1.6), z, 0.82 + (i % 4) * 0.08, i % 2 ? new Color3(0.18, 0.27, 0.23) : new Color3(0.26, 0.32, 0.25));
      if (i % 3 === 0) makeBuilding(scene, this.root, -side * 16.8, z + 8, 5.3 + (i % 2) * 2, 4.3 + (i % 4) * 0.7, i % 2 ? new Color3(0.35, 0.32, 0.38) : new Color3(0.5, 0.39, 0.4));
    }

    this.backdrop = MeshBuilder.CreatePlane("coastal-backdrop", { width: 220, height: 90 }, scene);
    this.backdrop.position.set(0, 22, 145);
    this.backdrop.rotation.y = Math.PI;
    const skyMaterial = new StandardMaterial("coastal-backdrop-material", scene);
    const skyTexture = new Texture(skyUrl, scene, true, false);
    skyTexture.vScale = -1;
    skyTexture.vOffset = 1;
    skyMaterial.diffuseTexture = skyTexture;
    skyMaterial.emissiveTexture = skyTexture;
    skyMaterial.disableLighting = true;
    skyMaterial.backFaceCulling = false;
    this.backdrop.material = skyMaterial;

    const water = MeshBuilder.CreateGround("water", { width: 50, height: 900 }, scene);
    water.parent = this.root;
    water.position.set(-35, -0.06, 390);
    water.material = material(scene, "water-mat", new Color3(0.16, 0.22, 0.32), 0.2);
  }

  update(vehicle: Vehicle) {
    const position = vehicle.getPosition();
    const recycleLimit = 730;
    if (position.z > recycleLimit) {
      position.z -= 560;
      this.root.getChildMeshes().forEach((mesh) => {
        if (mesh !== vehicle.root && mesh.position.z > 700) mesh.position.z -= 560;
      });
    }
  }

  dispose() {
    this.root.dispose(false, true);
    this.backdrop.dispose(false, true);
  }
}
