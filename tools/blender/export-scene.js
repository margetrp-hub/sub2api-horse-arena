import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OfficeDiorama } from "../../src/diorama/OfficeDiorama.ts";

const status = document.querySelector("#status");
const button = document.querySelector("#export");
const source = new OfficeDiorama(document.querySelector("#scene"));

function cameraInfo(camera) {
  camera.updateMatrixWorld(true);
  return { name: camera.name, type: camera.type, worldMatrix: camera.matrixWorld.toArray(),
    position: camera.getWorldPosition(new THREE.Vector3()).toArray(),
    quaternion: camera.getWorldQuaternion(new THREE.Quaternion()).toArray(),
    left: camera.left, right: camera.right, top: camera.top, bottom: camera.bottom,
    near: camera.near, far: camera.far, zoom: camera.zoom };
}

function prepareExport() {
  // This tool reads TypeScript-private scene members only in its own instance.
  source.scene.name = "Haolema_Source";
  source.room.name = "Room";
  source.workstation.name = "Workstation";
  source.horse.group.name = "Horse";
  source.boss.group.name = "Boss";
  source.door.name = "Door";
  source.pendant.name = "Pendant";
  source.screenMaterial.name = "CRT_Game_Display";
  source.screenMaterial.map.name = "moba.webp";
  const imageSources = [], sourceLights = [];
  let objectId = 0, materialId = 0, textureId = 0;
  const materials = new Set(), textures = new Set();
  source.scene.traverse(object => {
    if (object.material === source.screenMaterial) {
      object.name = "CRT_Game_Screen";
      object.parent.name = "CRT_Monitor";
      object.parent.parent.name = "Desk";
    }
    if (object.isLight) sourceLights.push({ type: object.type, color: object.color.toArray(), intensity: object.intensity,
      position: object.position.toArray(), target: object.target?.position.toArray() });
    if (!object.name) object.name = `${object.type}_${String(++objectId).padStart(3, "0")}`;
    for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
      if (materials.has(material)) continue;
      materials.add(material);
      if (!material.name) material.name = `Surface_${String(++materialId).padStart(3, "0")}`;
      for (const value of Object.values(material)) {
        if (!value?.isTexture || textures.has(value)) continue;
        textures.add(value);
        const image = value.image;
        if (!value.name) value.name = image?.src ? new URL(image.src).pathname.split("/").pop() : `Canvas_Artwork_${String(++textureId).padStart(3, "0")}`;
        imageSources.push({ name: value.name, source: image?.src ? new URL(image.src).pathname : "source-generated canvas artwork", width: image?.width, height: image?.height });
      }
    }
  });
  const scene = source.scene.clone(true), removed = [];
  scene.traverse(object => {
    // Blender will provide real contact shadows and studio lighting.
    if (object.isLight) removed.push(object);
    else if (object.material?.isMeshBasicMaterial && object.material.transparent && object.material.depthWrite === false) {
      object.name = "Baked_Contact_Shadow";
      removed.push(object);
    }
  });
  const removedContactShadows = removed.filter(object => object.name === "Baked_Contact_Shadow").length;
  removed.forEach(object => object.removeFromParent());
  const camera = source.camera.clone();
  const originalCamera = cameraInfo(source.camera);
  // glTF orthographic cameras have a centered frustum. Move the clone in camera
  // space to preserve Three's asymmetric source framing without changing it.
  const offsetX = (camera.left + camera.right) / 2, offsetY = (camera.top + camera.bottom) / 2;
  const halfWidth = (camera.right - camera.left) / 2, halfHeight = (camera.top - camera.bottom) / 2;
  camera.translateX(offsetX); camera.translateY(offsetY);
  camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight;
  camera.name = "ReferenceCamera";
  camera.updateProjectionMatrix();
  scene.add(camera);
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene);
  return { scene, metadata: { coordinateSystem: "Three.js/glTF right-handed, Y up; Blender importer converts to Z up", pose: { action: "work", boss: "inspecting", reducedMotion: true },
    viewport: { width: 1020, height: 626 }, camera: cameraInfo(camera), originalCamera,
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: bounds.getSize(new THREE.Vector3()).toArray() },
    namedNodes: ["Room", "Workstation", "Horse", "Boss", "Door", "Pendant", "Desk", "CRT_Monitor", "CRT_Game_Screen", "ReferenceCamera"],
    screenMaterial: "CRT_Game_Display", imageSources, removedContactShadows, sourceLights,
    note: "Source static meshes remain batched under Room. Original canvas signs are embedded; contact shadow cards and runtime lights are omitted for Blender lighting." } };
}

button.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "Exporting GLB…";
  try {
    const { scene, metadata } = prepareExport();
    const binary = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true, trs: true });
    // Round-trip the complete binary through Three's independent glTF loader.
    const imported = await new GLTFLoader().parseAsync(binary, "");
    const screen = imported.scene.getObjectByName("CRT_Game_Screen");
    if (!screen?.material.map || !imported.scene.getObjectByName("Boss") || !imported.cameras.length) throw new Error("GLB round-trip lost screen texture, boss, or camera");
    let meshes = 0; imported.scene.traverse(object => { if (object.isMesh) meshes++; });
    window.exportMetadata = { ...metadata, roundTrip: { meshes, cameras: imported.cameras.length, screenTextureLoaded: true } };
    const link = document.createElement("a"), url = URL.createObjectURL(new Blob([binary], { type: "model/gltf-binary" }));
    link.href = url; link.download = "workstation-source.glb"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Export complete";
    window.exportComplete = true;
  } catch (error) { status.textContent = String(error); window.exportError = String(error); console.error(error); }
});

try {
  await source.load();
  source.render(0, { action: "work", boss: "inspecting" }, true);
  status.textContent = "Source scene and embedded game texture ready";
  button.disabled = false;
  window.exportReady = true;
} catch (error) { status.textContent = String(error); window.exportError = String(error); console.error(error); }
window.addEventListener("pagehide", () => source.destroy(), { once: true });
