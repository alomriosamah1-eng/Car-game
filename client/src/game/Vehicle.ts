import { MeshBuilder, StandardMaterial, TransformNode, Vector3, type Mesh, type Scene } from "@babylonjs/core";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { clamp, getVehicle, hexToColor3, lerp, type CarId, type InputState } from "./types";

export class Vehicle {
  readonly root: TransformNode;
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
  private spec = getVehicle("aurelia");
  private speed = 0;
  private lateralVelocity = 0;
  private steeringAngle = 0;
  private distance = 0;
  private skidPulse = 0;

  constructor(private readonly scene: Scene) {
    this.root = new TransformNode("vehicle-root", scene);
    this.root.position = new Vector3(0, 0.48, 0);

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

    this.frontBumper = MeshBuilder.CreateBox("front-bumper", { width: 2.18, height: 0.2, depth: 0.18 }, scene);
    this.frontBumper.parent = this.root;
    this.frontBumper.position.set(0, 0.36, 2.18);
    this.frontBumper.material = this.bodyMaterial;

    this.rearBumper = MeshBuilder.CreateBox("rear-bumper", { width: 2.18, height: 0.2, depth: 0.18 }, scene);
    this.rearBumper.parent = this.root;
    this.rearBumper.position.set(0, 0.36, -2.18);
    this.rearBumper.material = this.bodyMaterial;

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
  }

  setCar(carId: CarId, color: string) {
    this.spec = getVehicle(carId);
    const rgb = hexToColor3(color);
    this.bodyMaterial.diffuseColor = new Color3(rgb.r, rgb.g, rgb.b);
    this.bodyMaterial.emissiveColor = new Color3(rgb.r * 0.06, rgb.g * 0.05, rgb.b * 0.05);
  }

  update(input: InputState, dt: number) {
    const safeDt = Math.min(dt, 0.05);
    const targetSteering = input.steer * 0.48;
    this.steeringAngle = lerp(this.steeringAngle, targetSteering, 1 - Math.pow(0.001, safeDt));

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
