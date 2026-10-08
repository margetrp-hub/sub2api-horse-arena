import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { DioramaState } from "./types";

type ToyCharacter = {
  group: THREE.Group;
  animate: (seconds: number, state: DioramaState, reducedMotion: boolean) => void;
};

const material = (color: number, roughness = 0.68) => new THREE.MeshStandardMaterial({ color, roughness });

function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, surface: THREE.Material, x: number, y: number, z: number) {
  const object = new THREE.Mesh(geometry, surface);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function oval(parent: THREE.Object3D, surface: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
  const object = mesh(parent, new THREE.SphereGeometry(1, 24, 16), surface, x, y, z);
  object.scale.set(sx, sy, sz);
  return object;
}

function box(parent: THREE.Object3D, surface: THREE.Material, x: number, y: number, z: number, width: number, height: number, depth: number, radius = 0.07) {
  return mesh(parent, new RoundedBoxGeometry(width, height, depth, 3, radius), surface, x, y, z);
}

function joint(parent: THREE.Object3D, x: number, y: number, z: number) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

function line(parent: THREE.Object3D, surface: THREE.Material, points: number[][], radius: number) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return mesh(parent, new THREE.TubeGeometry(curve, 16, radius, 6, false), surface, 0, 0, 0);
}

function limb(parent: THREE.Object3D, surface: THREE.Material, from: THREE.Vector3, to: THREE.Vector3, radius: number) {
  const direction = to.clone().sub(from);
  const object = mesh(parent, new THREE.CapsuleGeometry(radius, Math.max(0.01, direction.length() - radius * 2), 6, 12), surface, 0, 0, 0);
  object.position.copy(from).add(to).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return object;
}

/** Rounded desk toy proportions; the room supplies the chair at y = 0.7. */
export function createHorse(): ToyCharacter {
  const group = new THREE.Group();
  group.name = "horse-office-worker";
  const caramel = material(0xc8874d);
  const muzzle = material(0xe6b978);
  const mane = material(0x493328);
  const earPink = material(0xcd8d80);
  const shirt = material(0xf4eedc);
  const shirtShade = material(0xd8d7bd);
  const teal = material(0x386a62);
  const trouserStitch = material(0x609185);
  const hoof = material(0x3f3932, 0.48);
  const ivory = material(0xfff8e5, 0.44);
  const black = material(0x242723, 0.32);
  const coral = material(0xd96e50);
  const screen = new THREE.MeshStandardMaterial({ color: 0x95d1b6, emissive: 0x528576, emissiveIntensity: 0.36, roughness: 0.3 });

  // Stubby shoes and bent trousers anchor the character to a real sitting pose.
  for (const side of [-1, 1]) {
    box(group, teal, side * 0.23, 0.78, 0.26, 0.34, 0.34, 0.71, 0.14);
    limb(group, teal, new THREE.Vector3(side * 0.24, 0.72, 0.5), new THREE.Vector3(side * 0.24, 0.25, 0.57), 0.15);
    box(group, hoof, side * 0.24, 0.14, 0.7, 0.36, 0.25, 0.51, 0.11);
    box(group, trouserStitch, side * 0.24, 0.28, 0.57, 0.315, 0.08, 0.28, 0.025);
    line(group, black, [[side * 0.24, 0.1, 0.949], [side * 0.24, 0.2, 0.94]], 0.009);
  }

  const torso = joint(group, 0, 0.88, -0.05);
  oval(torso, shirt, 0, 0.42, 0, 0.44, 0.48, 0.31);
  box(torso, teal, 0, -0.01, 0.04, 0.67, 0.23, 0.53, 0.1);
  box(torso, shirtShade, 0, 0.15, 0.287, 0.035, 0.45, 0.016, 0.008);
  for (const y of [0.12, 0.28, 0.44]) oval(torso, mane, 0, y, 0.307, 0.016, 0.016, 0.012);
  box(torso, shirtShade, -0.23, 0.4, 0.261, 0.15, 0.16, 0.018, 0.025);
  box(torso, shirt, -0.23, 0.423, 0.275, 0.14, 0.1, 0.016, 0.015);
  box(torso, coral, -0.255, 0.496, 0.277, 0.017, 0.09, 0.018, 0.005);
  // Soft collar, little name badge, and a mint lanyard make the horse an employee.
  const collarLeft = box(torso, ivory, -0.12, 0.745, 0.193, 0.21, 0.15, 0.12, 0.025);
  collarLeft.rotation.z = -0.45;
  const collarRight = box(torso, ivory, 0.12, 0.745, 0.193, 0.21, 0.15, 0.12, 0.025);
  collarRight.rotation.z = 0.45;
  line(torso, teal, [[-0.17, 0.75, 0.23], [-0.14, 0.47, 0.32], [0.05, 0.28, 0.34], [0.17, 0.72, 0.24]], 0.018);
  const badge = joint(torso, 0.035, 0.265, 0.351);
  badge.rotation.z = -0.12;
  box(badge, teal, 0, 0, 0, 0.2, 0.24, 0.037, 0.021);
  box(badge, ivory, 0, -0.017, 0.025, 0.17, 0.174, 0.015, 0.012);
  oval(badge, coral, -0.04, 0.006, 0.037, 0.027, 0.032, 0.009);
  box(badge, teal, 0.028, 0.015, 0.04, 0.05, 0.009, 0.005, 0.002);
  box(badge, shirtShade, 0.028, -0.02, 0.04, 0.05, 0.009, 0.005, 0.002);

  // The long front-projecting muzzle and tall ears carry the horse silhouette.
  oval(torso, caramel, 0, 0.89, -0.018, 0.23, 0.39, 0.22);
  const head = joint(torso, 0, 1.0, 0.035);
  oval(head, caramel, 0, 0.21, 0.005, 0.335, 0.41, 0.315);
  const nose = box(head, caramel, 0, 0.062, 0.327, 0.54, 0.39, 0.66, 0.17);
  nose.rotation.x = -0.08;
  box(head, muzzle, 0, -0.008, 0.57, 0.58, 0.3, 0.36, 0.14);
  for (const side of [-1, 1]) {
    const nostril = oval(head, mane, side * 0.173, 0.048, 0.723, 0.04, 0.061, 0.012);
    nostril.rotation.z = side * -0.32;
    oval(head, muzzle, side * 0.245, -0.015, 0.496, 0.058, 0.092, 0.15);
  }
  line(head, mane, [[-0.17, -0.094, 0.725], [-0.01, -0.107, 0.746], [0.14, -0.086, 0.73], [0.18, -0.062, 0.714]], 0.009);
  // Eyes sit outside the bridge, with overhanging lids and a tiny glossy catchlight.
  const eyelids: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const eye = joint(head, side * 0.269, 0.279, 0.204);
    eye.rotation.y = side * 0.43;
    oval(eye, ivory, 0, 0, 0, 0.128, 0.143, 0.075);
    oval(eye, black, side * -0.012, -0.024, 0.071, 0.054, 0.074, 0.023);
    oval(eye, ivory, side * -0.017 - 0.01, 0.002, 0.092, 0.015, 0.018, 0.006);
    eyelids.push(oval(eye, caramel, 0, 0.084, 0.035, 0.134, 0.079, 0.067));
    const brow = box(eye, mane, 0, 0.168, -0.006, 0.21, 0.045, 0.065, 0.021);
    brow.rotation.z = side * -0.12;
    line(eye, muzzle, [[-0.075, -0.134, 0.016], [0, -0.151, 0.033], [0.079, -0.129, 0.008]], 0.012);
  }
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const ear = joint(head, side * 0.22, 0.49, -0.067);
    ear.rotation.z = side * -0.14;
    oval(ear, caramel, 0, 0.178, 0, 0.1, 0.255, 0.099);
    oval(ear, earPink, 0, 0.19, 0.081, 0.061, 0.177, 0.022);
    ears.push(ear);
  }
  // One swept forelock, with the remaining mane behind the eyes and down the neck.
  for (let i = 0; i < 5; i++) {
    const tuft = oval(head, mane, 0.025, 0.48 - i * 0.155, -0.245, 0.145, 0.17, 0.13);
    tuft.rotation.x = -0.25;
  }
  const forelock = oval(head, mane, -0.095, 0.522, 0.039, 0.21, 0.105, 0.23);
  forelock.rotation.z = -0.35;
  forelock.rotation.x = 0.13;
  line(torso, mane, [[0, 0.65, -0.23], [0, 0.44, -0.3], [0, 0.2, -0.31]], 0.075);
  const tail = joint(group, 0, 0.78, -0.29);
  line(tail, mane, [[0, 0, 0], [0.08, -0.19, -0.14], [0.21, -0.36, -0.16], [0.25, -0.47, -0.08]], 0.065);
  oval(tail, mane, 0.24, -0.4, -0.11, 0.12, 0.18, 0.09).rotation.z = -0.2;

  const arms: { shoulder: THREE.Group; forearm: THREE.Group }[] = [];
  for (const side of [-1, 1]) {
    const shoulder = joint(torso, side * 0.39, 0.65, 0.02);
    limb(shoulder, shirt, new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * 0.12, -0.21, 0.13), 0.15);
    const cuff = oval(shoulder, ivory, side * 0.1, -0.185, 0.13, 0.16, 0.085, 0.15);
    cuff.rotation.z = side * 0.3;
    const forearm = joint(shoulder, side * 0.11, -0.29, 0.19);
    limb(forearm, caramel, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.03, 0.46), 0.093);
    box(forearm, caramel, 0, -0.019, 0.535, 0.2, 0.15, 0.23, 0.07);
    line(forearm, mane, [[0, -0.076, 0.6], [0, -0.025, 0.647]], 0.008);
    arms.push({ shoulder, forearm });
  }
  // The phone is attached to the palm, so it moves coherently with the slack pose.
  const phone = joint(arms[0].forearm, 0.015, 0.091, 0.535);
  phone.rotation.x = -0.42;
  box(phone, hoof, 0, 0.06, 0, 0.185, 0.32, 0.04, 0.025);
  box(phone, screen, 0, 0.07, 0.025, 0.157, 0.252, 0.011, 0.016);
  box(phone, black, 0, 0.202, 0.028, 0.049, 0.011, 0.01, 0.005);
  oval(phone, ivory, -0.043, 0.118, 0.034, 0.027, 0.022, 0.006);
  box(phone, ivory, 0.023, 0.039, 0.034, 0.065, 0.021, 0.006, 0.006);
  phone.visible = false;

  let previousTime = -1;
  return {
    group,
    animate(seconds, state, reducedMotion) {
      const dt = previousTime < 0 ? 1 : Math.max(0, Math.min(0.08, seconds - previousTime));
      previousTime = seconds;
      const mix = reducedMotion ? 1 : 1 - Math.exp(-dt * 9);
      const move = reducedMotion ? 0 : 1;
      const slack = state.action === "slack";
      const caught = state.action === "caught";
      const finished = state.action === "finished";
      const working = state.action === "work" || caught;
      const breathe = Math.sin(seconds * 2.2) * 0.009 * move;
      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, slack ? -0.17 : caught ? 0.035 : finished ? -0.1 : 0.015, mix);
      torso.position.y = 0.88 + breathe;
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, slack ? 0.15 : caught ? -0.11 : finished ? -0.19 : 0.04, mix);
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, caught ? -0.3 : slack ? 0.08 : Math.sin(seconds * 0.55) * 0.045 * move, mix);
      head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, slack ? -0.08 : finished ? 0.08 : 0, mix);
      phone.visible = slack;
      for (let index = 0; index < arms.length; index++) {
        const arm = arms[index];
        const side = index === 0 ? -1 : 1;
        const typing = working ? Math.sin(seconds * (caught ? 24 : 14) + index * 2.8) * 0.045 * move : 0;
        const armLift = finished ? -1.75 : slack ? (index === 0 ? -0.28 : 0.35) : 0;
        arm.shoulder.rotation.x = THREE.MathUtils.lerp(arm.shoulder.rotation.x, armLift, mix);
        arm.shoulder.rotation.z = THREE.MathUtils.lerp(arm.shoulder.rotation.z, finished ? side * -0.42 : slack ? side * 0.13 : 0, mix);
        arm.forearm.rotation.x = THREE.MathUtils.lerp(arm.forearm.rotation.x, slack && index === 0 ? -0.38 : finished ? -0.45 : typing, mix);
        ears[index].rotation.z = THREE.MathUtils.lerp(ears[index].rotation.z, side * (caught ? -0.02 : slack ? -0.23 : -0.14) + Math.sin(seconds * 1.7 + index * 2) * 0.025 * move, mix);
        // A brief blink every few seconds; startled eyes open wider.
        const blink = !reducedMotion && seconds % 5.1 > 4.94 ? 0.058 : 0;
        eyelids[index].position.y = THREE.MathUtils.lerp(eyelids[index].position.y, caught ? 0.13 : 0.084 - blink, mix);
        eyelids[index].scale.y = THREE.MathUtils.lerp(eyelids[index].scale.y, blink > 0 ? 0.145 : caught ? 0.045 : 0.079, mix);
      }
      tail.rotation.z = Math.sin(seconds * 1.35) * 0.055 * move;
    },
  };
}

/** A stern but slightly ridiculous supervisor, standing with a clipboard. */
export function createBoss(): ToyCharacter {
  const group = new THREE.Group();
  group.name = "cow-supervisor";
  const cream = material(0xf2dfb6);
  const charcoal = material(0x343b34);
  const muzzle = material(0x626352);
  const horn = material(0xdcc7a0);
  const shirt = material(0xe8ddbd);
  const shirtShadow = material(0xbab797);
  const trousers = material(0x414f3d);
  const tie = material(0xad5c43);
  const white = material(0xfff5dc);
  const black = material(0x19241f, 0.35);
  const brass = new THREE.MeshStandardMaterial({ color: 0xb38d51, metalness: 0.5, roughness: 0.42 });
  const board = material(0x795b3f);
  const paper = material(0xf5edce);

  const feet: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    limb(group, trousers, new THREE.Vector3(side * 0.22, 1.0, 0), new THREE.Vector3(side * 0.23, 0.23, 0), 0.18);
    feet.push(box(group, charcoal, side * 0.24, 0.135, 0.09, 0.4, 0.27, 0.48, 0.1));
    line(group, black, [[side * 0.24, 0.06, 0.327], [side * 0.24, 0.17, 0.322]], 0.012);
  }
  const body = joint(group, 0, 0.98, 0);
  oval(body, shirt, 0, 0.5, 0, 0.53, 0.57, 0.34);
  box(body, trousers, 0, 0.04, 0, 0.75, 0.2, 0.5, 0.07);
  box(body, charcoal, 0, 0.11, 0.012, 0.76, 0.075, 0.51, 0.025);
  box(body, brass, 0, 0.11, 0.28, 0.12, 0.09, 0.035, 0.014);
  line(body, shirtShadow, [[0, 0.3, 0.328], [0, 0.67, 0.341], [0, 0.89, 0.2]], 0.012);
  for (const side of [-1, 1]) {
    const collar = box(body, white, side * 0.12, 0.91, 0.17, 0.24, 0.15, 0.17, 0.022);
    collar.rotation.z = side * 0.5;
  }
  box(body, tie, 0, 0.78, 0.315, 0.12, 0.14, 0.055, 0.027);
  const tieEnd = box(body, tie, 0, 0.53, 0.359, 0.13, 0.43, 0.042, 0.035);
  tieEnd.rotation.z = -0.05;
  box(body, brass, 0, 0.49, 0.385, 0.14, 0.025, 0.016, 0.008);
  box(body, shirtShadow, -0.27, 0.65, 0.285, 0.17, 0.17, 0.025, 0.023);
  box(body, shirt, -0.27, 0.67, 0.299, 0.155, 0.11, 0.018, 0.012);

  const head = joint(body, 0, 1.15, 0.016);
  oval(head, cream, 0, 0.11, 0, 0.44, 0.43, 0.34);
  oval(head, charcoal, -0.225, 0.235, 0.235, 0.192, 0.245, 0.118).rotation.z = 0.3;
  box(head, muzzle, 0, -0.094, 0.331, 0.71, 0.35, 0.38, 0.165);
  for (const side of [-1, 1]) {
    oval(head, black, side * 0.196, -0.047, 0.513, 0.045, 0.065, 0.013).rotation.z = side * 0.4;
    const ear = joint(head, side * 0.43, 0.22, -0.015);
    ear.rotation.z = side * -0.62;
    oval(ear, cream, side * 0.055, 0.025, 0, 0.2, 0.103, 0.105);
    oval(ear, muzzle, side * 0.065, 0.035, 0.084, 0.127, 0.053, 0.023);
    const eye = joint(head, side * 0.21, 0.189, 0.292);
    eye.rotation.y = side * 0.17;
    oval(eye, white, 0, 0, 0, 0.105, 0.105, 0.06);
    oval(eye, black, side * -0.014, -0.011, 0.058, 0.042, 0.056, 0.018);
    oval(eye, white, side * -0.02, 0.01, 0.074, 0.012, 0.014, 0.004);
    const brow = box(eye, charcoal, 0, 0.13, 0.01, 0.215, 0.063, 0.064, 0.02);
    brow.rotation.z = side * 0.17;
    mesh(eye, new THREE.TorusGeometry(0.135, 0.016, 8, 32), brass, 0, -0.006, 0.082);
    line(head, brass, [[side * 0.35, 0.194, 0.352], [side * 0.42, 0.19, 0.19], [side * 0.426, 0.186, 0.01]], 0.012);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.29, 0.387, -0.025),
      new THREE.Vector3(side * 0.46, 0.475, -0.025),
      new THREE.Vector3(side * 0.5, 0.635, -0.015),
      new THREE.Vector3(side * 0.425, 0.735, 0.035),
    ]);
    const geometry = new THREE.TubeGeometry(curve, 16, 0.082, 10, false);
    const position = geometry.getAttribute("position");
    for (let ring = 0; ring <= 16; ring++) {
      const center = curve.getPointAt(ring / 16);
      const taper = 1 - (ring / 16) * 0.96;
      for (let segment = 0; segment <= 10; segment++) {
        const index = ring * 11 + segment;
        position.setXYZ(index, center.x + (position.getX(index) - center.x) * taper, center.y + (position.getY(index) - center.y) * taper, center.z + (position.getZ(index) - center.z) * taper);
      }
    }
    geometry.computeVertexNormals();
    mesh(head, geometry, horn, 0, 0, 0);
  }
  line(head, brass, [[-0.087, 0.19, 0.395], [0, 0.216, 0.399], [0.087, 0.19, 0.395]], 0.014);
  line(head, black, [[-0.14, -0.192, 0.482], [0, -0.176, 0.507], [0.15, -0.185, 0.48]], 0.01);
  oval(head, charcoal, -0.045, 0.482, -0.012, 0.165, 0.075, 0.155).rotation.z = -0.2;

  limb(body, shirt, new THREE.Vector3(-0.43, 0.77, 0), new THREE.Vector3(-0.53, 0.42, 0.15), 0.15);
  limb(body, cream, new THREE.Vector3(-0.53, 0.42, 0.15), new THREE.Vector3(-0.18, 0.46, 0.43), 0.1);
  box(body, cream, -0.14, 0.455, 0.433, 0.2, 0.16, 0.18, 0.06);
  limb(body, shirt, new THREE.Vector3(0.43, 0.77, 0), new THREE.Vector3(0.57, 0.35, 0.12), 0.15);
  limb(body, cream, new THREE.Vector3(0.57, 0.35, 0.12), new THREE.Vector3(0.49, 0.42, 0.44), 0.1);
  const clipboard = joint(body, 0.41, 0.44, 0.49);
  clipboard.rotation.z = -0.12;
  clipboard.rotation.y = -0.12;
  box(clipboard, board, 0, 0, 0, 0.48, 0.66, 0.05, 0.027);
  box(clipboard, paper, 0, -0.008, 0.031, 0.41, 0.56, 0.015, 0.008);
  box(clipboard, brass, 0, 0.271, 0.05, 0.19, 0.075, 0.045, 0.014);
  for (let i = 0; i < 5; i++) {
    box(clipboard, shirtShadow, 0.035, 0.149 - i * 0.074, 0.043, 0.23 - (i % 2) * 0.043, 0.011, 0.008, 0.003);
    box(clipboard, tie, -0.135, 0.148 - i * 0.074, 0.044, 0.027, 0.027, 0.008, 0.005);
  }
  box(body, cream, 0.602, 0.425, 0.522, 0.15, 0.19, 0.16, 0.06);

  let previousTime = -1;
  return {
    group,
    animate(seconds, state, reducedMotion) {
      const dt = previousTime < 0 ? 1 : Math.max(0, Math.min(0.08, seconds - previousTime));
      previousTime = seconds;
      const mix = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
      const motion = reducedMotion ? 0 : 1;
      const inspecting = state.boss === "inspecting";
      body.position.y = 0.98 + Math.sin(seconds * 1.8) * 0.009 * motion;
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, inspecting ? Math.sin(seconds * 1.3) * 0.11 * motion : -0.13, mix);
      head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, state.boss === "warning" ? -0.11 : inspecting ? 0.055 : 0, mix);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, state.action === "caught" ? 0.12 : inspecting ? 0.035 : -0.04, mix);
      feet[1].rotation.x = inspecting ? Math.max(0, Math.sin(seconds * 6)) * 0.09 * motion : 0;
    },
  };
}
