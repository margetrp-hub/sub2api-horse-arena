import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const CAPSULE_RADIUS = 0.205;

function finish(color: number, metalness = 0, roughness = 0.3): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color, metalness, roughness, clearcoat: 1, clearcoatRoughness: 0.18 });
}

function box(parent: THREE.Object3D, size: number[], position: number[], material: THREE.Material, radius = 0.08): THREE.Mesh {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent: THREE.Object3D, radius: number, height: number, y: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 64), material);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function label(parent: THREE.Object3D, text: string, width: number, height: number, position: number[], background: string, foreground: string, fontSize = 120): void {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = Math.round(768 * height / width);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = foreground;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.fillText(text, 384, canvas.height / 2 + 2, 700);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.45 }));
  mesh.position.set(position[0], position[1], position[2]);
  parent.add(mesh);
}

export function buildMachine(): {
  group: THREE.Group;
  crank: THREE.Group;
  capsules: THREE.Group[];
  delivery: THREE.Group;
  paddle: THREE.Mesh;
} {
  const group = new THREE.Group();
  const coral = finish(0xf36c58, 0.12, 0.26);
  const cherry = finish(0xbe453b, 0.18, 0.32);
  const chrome = finish(0xe3e7e3, 0.85, 0.2);
  const dark = finish(0x242d2c, 0.4, 0.32);
  const mint = finish(0xd3e998, 0.15, 0.28);
  const white = finish(0xf4f2e9, 0.06, 0.22);

  for (const x of [-0.77, 0.77]) for (const z of [-0.57, 0.57]) {
    const foot = cylinder(group, 0.18, 0.16, 0.08, dark);
    foot.position.set(x, 0.08, z);
  }
  box(group, [2.28, 0.22, 1.97], [0, 0.24, 0], dark, 0.09);
  box(group, [2.18, 0.14, 1.87], [0, 0.4, 0], chrome, 0.06);
  box(group, [2.12, 1.6, 1.78], [0, 1.21, 0], coral, 0.2);
  box(group, [2.16, 0.13, 1.83], [0, 2.01, 0], cherry, 0.05);
  cylinder(group, 1.035, 0.12, 2.12, chrome);
  cylinder(group, 0.98, 0.07, 2.2, dark);

  // The chamber uses an open glass shell so the moving capsules stay readable.
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xc9f0ed, transparent: true, opacity: 0.12, roughness: 0.08,
    metalness: 0.2, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false,
  });
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 0.98, 1.67, 80, 1, true), glass);
  chamber.position.y = 3.055;
  chamber.renderOrder = 3;
  group.add(chamber);
  const edge = new THREE.MeshPhysicalMaterial({ color: 0xe9fffa, transparent: true, opacity: 0.28, roughness: 0.1, depthWrite: false });
  for (const angle of [-0.95, 0.78, 2.9]) {
    const reflection = new THREE.Mesh(new THREE.CylinderGeometry(0.986, 0.986, 1.43, 16, 1, true, angle, 0.035), edge);
    reflection.position.y = 3.09;
    reflection.renderOrder = 4;
    group.add(reflection);
  }
  cylinder(group, 1.025, 0.1, 3.94, chrome);
  cylinder(group, 1.06, 0.16, 4.045, coral);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.04, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), coral);
  cap.scale.y = 0.19;
  cap.position.y = 4.1;
  cap.castShadow = true;
  group.add(cap);
  cylinder(group, 0.13, 0.045, 4.32, chrome);
  box(group, [0.09, 0.012, 0.014], [0, 4.347, 0], dark, 0.003);

  const paddle = box(group, [1.62, 0.06, 0.12], [0, 2.255, 0], mint, 0.025);
  cylinder(group, 0.15, 0.15, 2.28, chrome);
  box(group, [1.78, 0.51, 0.11], [0, 1.74, 0.89], cherry, 0.075);
  label(group, "OH!", 0.69, 0.32, [-0.43, 1.74, 0.953], "#be453b", "#fff5dd", 275);
  label(group, "LUCKY CLUB", 0.71, 0.17, [0.39, 1.8, 0.953], "#be453b", "#fff5dd", 98);
  label(group, "EST. 2026", 0.55, 0.1, [0.38, 1.63, 0.953], "#be453b", "#f3b9a7", 84);

  const crank = new THREE.Group();
  crank.position.set(-0.36, 1.13, 0.97);
  group.add(crank);
  const crankBack = cylinder(crank, 0.35, 0.105, 0, chrome);
  crankBack.rotation.x = Math.PI / 2;
  const crankFace = cylinder(crank, 0.286, 0.12, 0, dark);
  crankFace.rotation.x = Math.PI / 2;
  crankFace.position.z = 0.045;
  const disc = cylinder(crank, 0.25, 0.08, 0, mint);
  disc.rotation.x = Math.PI / 2;
  disc.position.z = 0.12;
  box(crank, [0.13, 0.43, 0.15], [0, 0, 0.2], chrome, 0.055);
  box(crank, [0.055, 0.21, 0.015], [0, 0, 0.281], white, 0.014);
  box(group, [0.48, 0.42, 0.065], [0.51, 1.16, 0.927], chrome, 0.06);
  box(group, [0.035, 0.24, 0.018], [0.51, 1.19, 0.968], dark, 0.007);
  label(group, "1 TOKEN", 0.36, 0.075, [0.51, 0.99, 0.971], "#dce2dd", "#303b35", 110);
  for (const x of [-0.87, 0.86]) {
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.027, 12, 8), chrome);
    bolt.position.set(x, 1.15, 0.916);
    group.add(bolt);
  }

  box(group, [1.01, 0.48, 0.09], [0, 0.62, 0.946], chrome, 0.1);
  box(group, [0.85, 0.34, 0.095], [0, 0.64, 1.001], dark, 0.07);
  box(group, [1.01, 0.1, 0.55], [0, 0.43, 1.15], cherry, 0.04);
  box(group, [0.91, 0.026, 0.41], [0, 0.493, 1.16], dark, 0.01);
  label(group, "GOOD THINGS INSIDE", 1.15, 0.1, [0, 0.275, 0.993], "#242d2c", "#d3e998", 60);
  for (let i = 0; i < 5; i++) {
    box(group, [0.02, 0.032, 0.51], [1.058, 0.8 + i * 0.09, -0.14], cherry, 0.004);
  }

  const topGeometry = new THREE.SphereGeometry(CAPSULE_RADIUS, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const bottomGeometry = new THREE.SphereGeometry(CAPSULE_RADIUS, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const bandGeometry = new THREE.TorusGeometry(CAPSULE_RADIUS * 0.985, 0.007, 6, 32);
  const colors = [0xf27060, 0x88cbbf, 0xf3ce65, 0x90bddd, 0xd5a8d8, 0xb7d67b];
  const materials = colors.map(color => finish(color, 0.02, 0.2));
  const makeCapsule = (index: number): THREE.Group => {
    const capsule = new THREE.Group();
    const top = new THREE.Mesh(topGeometry, materials[index % materials.length]);
    const bottom = new THREE.Mesh(bottomGeometry, white);
    const band = new THREE.Mesh(bandGeometry, materials[index % materials.length]);
    band.rotation.x = Math.PI / 2;
    top.castShadow = bottom.castShadow = true;
    capsule.add(top, bottom, band);
    group.add(capsule);
    return capsule;
  };
  const capsules = Array.from({ length: 36 }, (_, i) => makeCapsule(i));
  const delivery = makeCapsule(0);
  delivery.visible = false;
  return { group, crank, capsules, delivery, paddle };
}
