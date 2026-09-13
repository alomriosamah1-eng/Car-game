import { MeshBuilder, StandardMaterial, TransformNode, Vector3, type AbstractMesh, type Mesh, type Scene } from "@babylonjs/core";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";
import { clamp, getVehicle, hexToColor3, lerp, type CarId, type InputState } from "./types";

export class Vehicle {
  readonly root: TransformNode;
  private readonly cockpitRoot: TransformNode;
  private readonly body: Mesh;
  private readonly cabin: Mesh;
  private readonly hood: Mesh;
  private readonly frontBumper: Mesh;
  private readonly rearBumper: Mesh;
  private readonly wheels: Mesh[] = [];
  private readonly tireMaterial: StandardMaterial;
  private readonly bodyMaterial: StandardMaterial;
  private readonly glassMaterial: StandardMaterial;
  private readonly lightMaterial: StandardMaterial;
  private readonly interiorMaterial: StandardMaterial;
  private readonly leatherMaterial: StandardMaterial;
  private readonly skinMaterial: StandardMaterial;
  private readonly steeringWheel: Mesh;
  private proceduralExterior: AbstractMesh[] = [];
  private realExterior: TransformNode | null = null;
  private cockpitVisible = false;
  private spec = getVehicle("aurelia");
  private speed = 0;
  private lateralVelocity = 0;
  private steeringAngle = 0;
  private distance = 0;
  private skidPulse = 0;

  constructor(private readonly scene: Scene) {
    this.root = new TransformNode("vehicle-root", scene);
    this.root.position = new Vector3(0, 0.48, 0);
    this.cockpitRoot = new TransformNode("cockpit-root", scene);
    this.cockpitRoot.parent = this.root;

    this.bodyMaterial = new StandardMaterial("body-material", scene);
    this.bodyMaterial.diffuseColor = new Color3(0.96, 0.93, 0.9);
    this.bodyMaterial.specularColor = new Color3(0.8, 0.76, 0.72);
    this.bodyMaterial.specularPower = 80;

    this.glassMaterial = new StandardMaterial("glass-material", scene);
    this.glassMaterial.diffuseColor = new Color3(0.08, 0.09, 0.13);
    this.glassMaterial.alpha = 0.76;
    this.glassMaterial.specularPower = 96;

    this.tireMaterial = new StandardMaterial("tire-material", scene);
    this.tireMaterial.diffuseColor = new Color3(0.035, 0.038, 0.047);
    this.tireMaterial.specularPower = 18;

    this.lightMaterial = new StandardMaterial("light-material", scene);
    this.lightMaterial.diffuseColor = new Color3(1, 0.45, 0.34);
    this.lightMaterial.emissiveColor = new Color3(0.65, 0.12, 0.08);

    this.interiorMaterial = new StandardMaterial("interior-material", scene);
    this.interiorMaterial.diffuseColor = new Color3(0.055, 0.045, 0.06);
    this.interiorMaterial.specularPower = 28;
    this.leatherMaterial = new StandardMaterial("leather-material", scene);
    this.leatherMaterial.diffuseColor = new Color3(0.18, 0.12, 0.13);
    this.leatherMaterial.specularPower = 38;
    this.skinMaterial = new StandardMaterial("skin-material", scene);
    this.skinMaterial.diffuseColor = new Color3(0.56, 0.34, 0.27);
    this.skinMaterial.specularPower = 20;

    this.body = MeshBuilder.CreateSphere("vehicle-body", { diameter: 2, segments: 24 }, scene);
    this.body.parent = this.root;
    this.body.position.y = 0.5;
    this.body.scaling.set(1.16, 0.31, 2.28);
    this.body.material = this.bodyMaterial;

    this.hood = MeshBuilder.CreateSphere("vehicle-hood", { diameter: 2, segments: 20 }, scene);
    this.hood.parent = this.root;
    this.hood.position.set(0, 0.68, 1.2);
    this.hood.scaling.set(1.08, 0.16, 0.9);
    this.hood.material = this.bodyMaterial;

    this.cabin = MeshBuilder.CreateSphere("vehicle-cabin", { diameter: 2, segments: 20 }, scene);
    this.cabin.parent = this.root;
    this.cabin.position.set(0, 0.86, -0.2);
    this.cabin.scaling.set(0.86, 0.34, 1.02);
    this.cabin.rotation.x = -0.05;
    this.cabin.material = this.glassMaterial;

    // Cockpit: visible only from the interior camera, but owned by the same vehicle root.
    const dashboard = MeshBuilder.CreateBox("cockpit-dashboard", { width: 1.92, height: 0.24, depth: 0.62 }, scene);
    dashboard.parent = this.cockpitRoot;
    dashboard.position.set(0, 1.06, 1.02);
    dashboard.rotation.x = -0.08;
    dashboard.material = this.interiorMaterial;

    const instrumentCluster = MeshBuilder.CreateBox("instrument-cluster", { width: 0.74, height: 0.14, depth: 0.06 }, scene);
    instrumentCluster.parent = this.cockpitRoot;
    instrumentCluster.position.set(-0.1, 1.19, 0.73);
    instrumentCluster.material = this.interiorMaterial;

    this.steeringWheel = MeshBuilder.CreateTorus("cockpit-steering-wheel", { diameter: 0.66, thickness: 0.085, tessellation: 24 }, scene);
    this.steeringWheel.parent = this.cockpitRoot;
    this.steeringWheel.position.set(-0.62, 1.08, 0.7);
    this.steeringWheel.material = this.leatherMaterial;
    const wheelHub = MeshBuilder.CreateSphere("steering-hub", { diameter: 0.2, segments: 12 }, scene);
    wheelHub.parent = this.steeringWheel;
    wheelHub.position.z = -0.02;
    wheelHub.material = this.leatherMaterial;
    for (const angle of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
      const spoke = MeshBuilder.CreateBox(`steering-spoke-${angle}`, { width: 0.045, height: 0.3, depth: 0.04 }, scene);
      spoke.parent = this.steeringWheel;
      spoke.position.z = -0.02;
      spoke.rotation.z = angle;
      spoke.material = this.leatherMaterial;
    }

    const driverTorso = MeshBuilder.CreateSphere("driver-torso", { diameter: 1, segments: 16 }, scene);
    driverTorso.parent = this.cockpitRoot;
    driverTorso.position.set(-0.18, 0.95, -1.45);
    driverTorso.scaling.set(0.48, 0.7, 0.34);
    driverTorso.material = this.leatherMaterial;
    const driverHead = MeshBuilder.CreateSphere("driver-head", { diameter: 0.42, segments: 16 }, scene);
    driverHead.parent = this.cockpitRoot;
    driverHead.position.set(-0.18, 1.62, -1.42);
    driverHead.material = this.skinMaterial;
    const hair = MeshBuilder.CreateSphere("driver-hair", { diameter: 0.46, segments: 16 }, scene);
    hair.parent = this.cockpitRoot;
    hair.position.set(-0.18, 1.72, -1.46);
    hair.scaling.set(1, 0.72, 0.9);
    hair.material = this.interiorMaterial;
    for (const side of [-1, 1]) {
      const arm = MeshBuilder.CreateSphere(`driver-arm-${side}`, { diameter: 1, segments: 12 }, scene);
      arm.parent = this.cockpitRoot;
      arm.position.set(-0.42 + side * 0.14, 1.17, 0.42);
      arm.scaling.set(0.08, 0.08, 0.3);
      arm.material = this.skinMaterial;
    }

    this.frontBumper = MeshBuilder.CreateBox("front-bumper", { width: 2.18, height: 0.2, depth: 0.18 }, scene);
    this.frontBumper.parent = this.root;
    this.frontBumper.position.set(0, 0.36, 2.18);
    this.frontBumper.material = this.bodyMaterial;

    this.rearBumper = MeshBuilder.CreateBox("rear-bumper", { width: 2.18, height: 0.2, depth: 0.18 }, scene);
    this.rearBumper.parent = this.root;
    this.rearBumper.position.set(0, 0.36, -2.18);
    this.rearBumper.material = this.bodyMaterial;

    const grilleMaterial = new StandardMaterial("grille-material", scene);
    grilleMaterial.diffuseColor = new Color3(0.018, 0.02, 0.026);
    grilleMaterial.specularPower = 75;
    const grille = MeshBuilder.CreateBox("front-grille", { width: 1.04, height: 0.24, depth: 0.07 }, scene);
    grille.parent = this.root;
    grille.position.set(0, 0.51, 2.29);
    grille.material = grilleMaterial;
    for (const x of [-0.72, 0.72]) {
      const mirror = MeshBuilder.CreateSphere(`side-mirror-${x}`, { diameter: 0.28, segments: 12 }, scene);
      mirror.parent = this.root;
      mirror.position.set(x * 1.22, 0.86, 0.52);
      mirror.scaling.set(0.9, 0.55, 0.65);
      mirror.material = this.bodyMaterial;
      const tailMaterial = new StandardMaterial(`tail-light-${x}`, scene);
      tailMaterial.diffuseColor = new Color3(0.8, 0.08, 0.05);
      tailMaterial.emissiveColor = new Color3(0.35, 0.015, 0.01);
      const tail = MeshBuilder.CreateBox(`tail-light-${x}`, { width: 0.48, height: 0.11, depth: 0.055 }, scene);
      tail.parent = this.root;
      tail.position.set(x, 0.61, -2.25);
      tail.material = tailMaterial;
    }
    for (const x of [-1.08, 1.08]) {
      const skirt = MeshBuilder.CreateBox(`side-skirt-${x}`, { width: 0.12, height: 0.15, depth: 2.55 }, scene);
      skirt.parent = this.root;
      skirt.position.set(x, 0.32, 0);
      skirt.material = this.bodyMaterial;
    }

    const spoiler = MeshBuilder.CreateBox("vehicle-spoiler", { width: 1.82, height: 0.08, depth: 0.38 }, scene);
    spoiler.parent = this.root;
    spoiler.position.set(0, 0.95, -1.22);
    spoiler.material = this.bodyMaterial;

    const headlightMaterial = new StandardMaterial("headlight-material", scene);
    headlightMaterial.diffuseColor = new Vector3(0.95, 0.98, 1) as never;
    headlightMaterial.emissiveColor = new Vector3(0.65, 0.78, 1) as never;
    for (const x of [-0.72, 0.72]) {
      const headlight = MeshBuilder.CreateBox(`headlight-${x}`, { width: 0.34, height: 0.12, depth: 0.06 }, scene);
      headlight.parent = this.root;
      headlight.position.set(x, 0.61, 2.24);
      headlight.material = headlightMaterial;
    }

    for (const x of [-0.98, 0.98]) {
      for (const z of [-1.48, 1.48]) {
        const wheel = MeshBuilder.CreateCylinder(`wheel-${x}-${z}`, { diameter: 0.72, height: 0.26, tessellation: 18 }, scene);
        wheel.parent = this.root;
        wheel.position.set(x, 0.28, z);
        wheel.rotation.z = Math.PI / 2;
        wheel.material = this.tireMaterial;
        this.wheels.push(wheel);
        const hub = MeshBuilder.CreateCylinder(`hub-${x}-${z}`, { diameter: 0.34, height: 0.275, tessellation: 16 }, scene);
        hub.parent = wheel;
        hub.rotation.z = Math.PI / 2;
        const hubMaterial = new StandardMaterial(`hub-material-${x}-${z}`, scene);
        hubMaterial.diffuseColor = new Color3(0.72, 0.5, 0.38);
        hub.material = hubMaterial;
      }
    }

    this.setCar("aurelia", "#f4eee6");
    this.proceduralExterior = this.root.getChildMeshes().filter((mesh) => !mesh.isDescendantOf(this.cockpitRoot));
  }

  async loadRealExterior(url: string) {
    try {
      const separator = url.lastIndexOf("/");
      const rootUrl = separator >= 0 ? url.slice(0, separator + 1) : "";
      const fileName = separator >= 0 ? url.slice(separator + 1) : url;
      const result = await SceneLoader.ImportMeshAsync("", rootUrl, fileName, this.scene);
      const importedRoot = result.meshes[0];
      if (!importedRoot) return false;
      const container = new TransformNode("real-car-exterior", this.scene);
      container.parent = this.root;
      importedRoot.parent = container;
      const bounds = container.getHierarchyBoundingVectors(true);
      const size = Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y, bounds.max.z - bounds.min.z) || 1;
      const scale = 4.55 / size;
      container.scaling.setAll(scale);
      container.position.set(0, -bounds.min.y * scale + 0.06, 0);
      container.rotation.y = Math.PI;
      this.realExterior = container;
      this.realExterior.setEnabled(!this.cockpitVisible);
      this.proceduralExterior.forEach((mesh) => { mesh.isVisible = false; });
      return true;
    } catch (error) {
      console.warn("Veloura real car model could not load; using procedural fallback", error);
      return false;
    }
  }

  setCar(carId: CarId, color: string) {
    this.spec = getVehicle(carId);
    const rgb = hexToColor3(color);
    this.bodyMaterial.diffuseColor = new Color3(rgb.r, rgb.g, rgb.b);
    this.bodyMaterial.emissiveColor = new Color3(rgb.r * 0.06, rgb.g * 0.05, rgb.b * 0.05);
  }

  setCockpitVisible(visible: boolean) {
    this.cockpitVisible = visible;
    this.cockpitRoot.setEnabled(visible);
    this.cabin.isVisible = !visible;
    this.realExterior?.setEnabled(!visible);
    if (!this.realExterior) this.proceduralExterior.forEach((mesh) => { mesh.isVisible = !visible; });
  }

  update(input: InputState, dt: number) {
    const safeDt = Math.min(dt, 0.05);
    const targetSteering = input.steer * 0.48;
    this.steeringAngle = lerp(this.steeringAngle, targetSteering, 1 - Math.pow(0.001, safeDt));
    this.steeringWheel.rotation.y = -this.steeringAngle * 1.25;

    const maxSpeed = this.spec.topSpeed / 3.6;
    const movingForward = this.speed > 0.4;
    const reverse = !movingForward && input.brake > 0.15;
    if (reverse) {
      this.speed = Math.max(-7.5, this.speed - input.brake * 8.5 * safeDt);
    } else {
      const throttleForce = input.throttle * this.spec.acceleration;
      const rollingResistance = 0.75 + Math.abs(this.speed) * 0.018;
      this.speed += (throttleForce - Math.sign(this.speed || 1) * rollingResistance) * safeDt;
      if (input.brake > 0.01) {
        const brakeForce = this.spec.braking * input.brake * safeDt;
        if (Math.abs(this.speed) <= brakeForce) this.speed = 0;
        else this.speed -= Math.sign(this.speed) * brakeForce;
      }
      this.speed = clamp(this.speed, -7.5, maxSpeed);
    }

    const speedRatio = clamp(Math.abs(this.speed) / maxSpeed, 0, 1);
    const steeringGrip = this.spec.handling * (0.25 + speedRatio * 0.95);
    this.root.rotation.y += this.steeringAngle * steeringGrip * safeDt * (this.speed >= 0 ? 1 : -1);
    this.lateralVelocity = lerp(this.lateralVelocity, Math.sin(this.root.rotation.y) * this.speed, safeDt * 6.5 * this.spec.grip);
    this.root.position.x += this.lateralVelocity * safeDt;
    this.root.position.z += Math.cos(this.root.rotation.y) * this.speed * safeDt;

    const laneLimit = 5.35;
    if (this.root.position.x < -laneLimit) {
      this.root.position.x = -laneLimit;
      this.speed *= 0.82;
      this.skidPulse = 1;
    } else if (this.root.position.x > laneLimit) {
      this.root.position.x = laneLimit;
      this.speed *= 0.82;
      this.skidPulse = 1;
    }

    this.distance = Math.max(this.distance, this.root.position.z);
    const spin = this.speed * safeDt * 2.6;
    this.wheels.forEach((wheel) => {
      wheel.rotation.x += spin;
    });
    this.skidPulse = Math.max(0, this.skidPulse - safeDt * 2.8);
  }

  reset() {
    this.root.position.set(0, 0.48, 0);
    this.root.rotation.set(0, 0, 0);
    this.speed = 0;
    this.distance = 0;
    this.lateralVelocity = 0;
  }

  getSpeed() {
    return this.speed;
  }

  getRpm() {
    const normalized = clamp(Math.abs(this.speed) / (this.spec.topSpeed / 3.6), 0, 1);
    return 820 + normalized * 5450 + this.skidPulse * 420;
  }

  getDistance() {
    return this.distance;
  }

  getPosition() {
    return this.root.position;
  }

  getRotationY() {
    return this.root.rotation.y;
  }

  getSpec() {
    return this.spec;
  }

  dispose() {
    this.root.dispose(false, true);
  }
}
