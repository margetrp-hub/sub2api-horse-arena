import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createBoss, createHorse } from "./ToyCharacters";
import type { DioramaState } from "./types";

type Surface = THREE.MeshStandardMaterial;

const PALETTE = {
  cream: 0xf4e6cc, paper: 0xfff5dc, green: 0x294f48, teal: 0x448a83,
  coral: 0xd96d51, wood: 0xb67745, dark: 0x343d38, brass: 0xbc9462,
};

/** A fixed-camera miniature. Its clock belongs to the page's game loop. */
export class OfficeDiorama {
  private readonly scene = new THREE.Scene();
  private readonly room = new THREE.Group();
  private readonly workstation = new THREE.Group();
  private readonly camera = new THREE.OrthographicCamera(-7, 7, 6, -6, 0.1, 80);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly resizeObserver: ResizeObserver;
  private readonly textures = new Set<THREE.Texture>();
  private readonly materials = new Map<string, Surface>();
  private readonly horse = createHorse();
  private readonly boss = createBoss();
  private readonly door = new THREE.Group();
  private readonly pendant = new THREE.Group();
  private readonly screenMaterial = new THREE.MeshBasicMaterial({ toneMapped: false });
  private lastNow = 0;
  private doorOpen = 0;
  private bossApproach = 0;
  private disposed = false;
  private reducedState = "";
  private needsRender = true;

  constructor(private readonly mount: HTMLElement) {
    try {
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      throw new Error("当前浏览器无法创建三维画面，请启用 WebGL 后重试。");
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.setAttribute("role", "img");
    this.renderer.domElement.setAttribute("aria-label", "薅乐马微缩网吧：小马上班、摸鱼，牛老板从右后方查岗");
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    mount.append(this.renderer.domElement);

    this.camera.position.set(5.4, 7.5, 13);
    this.camera.lookAt(0, 1.5, 0);
    this.scene.add(this.room);
    this.workstation.scale.setScalar(1.15);
    this.workstation.position.set(-0.25, 0, -0.02);
    this.room.add(this.workstation);
    this.scene.add(new THREE.HemisphereLight(0xfff4dc, 0x7b8070, 2.25));
    const sun = new THREE.DirectionalLight(0xffe2ad, 3.5);
    sun.position.set(-4, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -7;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 24;
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -0.00015;
    sun.shadow.radius = 3;
    sun.target.position.set(0, 0, 0);
    this.scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0xb6ded8, 0.7);
    fill.position.set(6, 5, -2);
    this.scene.add(fill);

    this.buildRoom();
    this.buildWorkstation();
    this.buildDecorations();
    this.horse.group.position.set(-1.15, 0.09, 0.62);
    this.horse.group.rotation.y = Math.PI / 2;
    this.boss.group.position.set(2.24, 0.075, -2.2);
    this.boss.group.rotation.y = -0.25;
    this.boss.group.visible = false;
    this.workstation.add(this.horse.group);
    this.room.add(this.boss.group);
    this.mergeStaticMeshes();
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(mount);
    this.resize();
  }

  async load(): Promise<void> {
    const texture = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}assets/screen-real-v4/moba.webp`);
    if (this.disposed) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    this.textures.add(texture);
    this.screenMaterial.map = texture;
    this.screenMaterial.needsUpdate = true;
    this.needsRender = true;
  }

  render(nowMs: number, state: DioramaState, reducedMotion = false): void {
    if (this.disposed) return;
    const reducedState = reducedMotion ? `${state.action}/${state.boss}` : "";
    if (reducedMotion && this.reducedState === reducedState && !this.needsRender) return;
    this.reducedState = reducedState;
    const seconds = reducedMotion ? 0 : nowMs / 1000;
    const delta = this.lastNow ? Math.min(80, Math.max(0, nowMs - this.lastNow)) / 1000 : 0;
    this.lastNow = nowMs;
    const blend = reducedMotion ? 1 : 1 - Math.exp(-delta * 5);
    const targetDoor = state.boss === "away" ? 0 : state.boss === "warning" ? 0.58 : 1.14;
    const targetBoss = state.boss === "inspecting" ? 1 : 0;
    this.doorOpen += (targetDoor - this.doorOpen) * blend;
    this.bossApproach += (targetBoss - this.bossApproach) * blend;
    this.door.rotation.y = -this.doorOpen;
    this.boss.group.visible = state.boss !== "away";
    this.boss.group.position.set(2.24 - this.bossApproach * 0.19, 0.075, -2.13 + this.bossApproach * 0.67);
    this.horse.animate(seconds, state, reducedMotion);
    this.boss.animate(seconds, state, reducedMotion);
    this.pendant.rotation.z = reducedMotion ? 0 : Math.sin(seconds * 0.65) * 0.008;
    this.renderer.render(this.scene, this.camera);
    this.needsRender = false;
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resizeObserver.disconnect();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>(this.materials.values());
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      const entries = Array.isArray(object.material) ? object.material : [object.material];
      entries.forEach((material) => {
        materials.add(material);
        Object.values(material).forEach((value: unknown) => {
          if (value instanceof THREE.Texture) this.textures.add(value);
        });
      });
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  private readonly resize = (): void => {
    if (this.disposed) return;
    const { width, height } = this.mount.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    this.renderer.setSize(width, height, false);
    this.needsRender = true;
    this.camera.updateMatrixWorld(true);
    const bounds = new THREE.Box3();
    // Frame the compact workstation and doorway without spending space on empty floor.
    for (const x of [-3.6, 3.6]) {
      for (const y of [-0.49, 4.86]) {
        for (const z of [-2.7, 2.78]) {
          bounds.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(this.camera.matrixWorldInverse));
        }
      }
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const aspect = width / height;
    const halfHeight = Math.max(size.y, size.x / aspect) * 0.515;
    this.camera.left = center.x - halfHeight * aspect;
    this.camera.right = center.x + halfHeight * aspect;
    this.camera.top = center.y + halfHeight;
    this.camera.bottom = center.y - halfHeight;
    this.camera.updateProjectionMatrix();
  };

  private surface(color: number, roughness = 0.76, metalness = 0): Surface {
    const key = `${color}-${roughness}-${metalness}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
      this.materials.set(key, material);
    }
    return material;
  }

  private box(parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], color: number, radius = 0.05): THREE.Mesh {
    const geometry = new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map((value) => value / 2.1)));
    const mesh = new THREE.Mesh(geometry, this.surface(color));
    mesh.position.set(...position);
    mesh.castShadow = size[0] * size[1] * size[2] > 0.016;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private cylinder(parent: THREE.Object3D, top: number, bottom: number, height: number, position: [number, number, number], color: number, segments = 24): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), this.surface(color));
    mesh.position.set(...position);
    mesh.castShadow = Math.max(top, bottom) > 0.15 && height > 0.2;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private line(parent: THREE.Object3D, points: THREE.Vector3[], radius: number, color: number): THREE.Mesh {
    const curve = new THREE.CatmullRomCurve3(points);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, radius, 6, false), this.surface(color));
    mesh.castShadow = false;
    parent.add(mesh);
    return mesh;
  }

  private canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器无法绘制网吧素材。");
    draw(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    this.textures.add(texture);
    return texture;
  }

  private plaque(parent: THREE.Object3D, width: number, height: number, position: [number, number, number], background: string, title: string, subtitle = ""): THREE.Mesh {
    const texture = this.canvasTexture(640, 256, (ctx) => {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 640, 256);
      ctx.fillStyle = "#fff0d7";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${subtitle ? 119 : 72}px Georgia, 'Microsoft YaHei', serif`;
      ctx.fillText(title, 320, subtitle ? 107 : 130);
      if (subtitle) {
        ctx.font = "600 34px 'Microsoft YaHei', sans-serif";
        ctx.fillText(subtitle, 320, 209);
      }
    });
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  private buildRoom(): void {
    this.box(this.room, [7.35, 0.5, 5.52], [0, -0.25, 0], 0xb68963, 0.19);
    this.box(this.room, [7.18, 0.09, 5.39], [0, 0.02, 0], 0xd7cab0, 0.1);
    const tileGeometry = new THREE.BoxGeometry(0.751, 0.035, 0.751);
    const tiles = [0xe7ddc5, 0xd8ccb1, 0xe6d6b6, 0xd5c8ad].map((color) => this.surface(color));
    for (let column = 0; column < 9; column += 1) {
      for (let row = 0; row < 7; row += 1) {
        const tile = new THREE.Mesh(tileGeometry, tiles[(column + row * 3) % tiles.length]);
        tile.position.set((column - 4) * 0.77, 0.078, (row - 3) * 0.77);
        tile.receiveShadow = true;
        this.room.add(tile);
      }
    }
    // The two wall piers and lintel leave a genuine door opening at the back right.
    for (const [x, width] of [[-1.15, 4.76], [3.39, 0.32]]) {
      this.box(this.room, [width, 1.58, 0.24], [x, 0.87, -2.55], PALETTE.green, 0.04);
      this.box(this.room, [width, 1.63, 0.24], [x, 2.465, -2.55], PALETTE.cream, 0.04);
      this.box(this.room, [width, 0.065, 0.31], [x, 1.67, -2.53], PALETTE.brass, 0.02);
      this.box(this.room, [width, 0.13, 0.31], [x, 0.17, -2.51], 0x203f39, 0.025);
    }
    this.box(this.room, [7.1, 1.16, 0.24], [0, 3.86, -2.55], PALETTE.cream, 0.05);
    this.box(this.room, [7.23, 0.15, 0.36], [0, 4.49, -2.55], 0x35584d, 0.06);
    this.box(this.room, [0.24, 1.58, 1.77], [-3.52, 0.87, -1.61], PALETTE.green, 0.04);
    this.box(this.room, [0.24, 2.85, 1.77], [-3.52, 3.085, -1.61], PALETTE.cream, 0.04);
    this.box(this.room, [0.32, 0.09, 1.84], [-3.49, 1.67, -1.61], PALETTE.brass, 0.025);
    this.box(this.room, [0.34, 0.15, 1.88], [-3.52, 4.49, -1.61], 0x35584d, 0.05);

    this.box(this.room, [0.14, 3.31, 0.38], [1.3, 1.72, -2.49], 0xbd8e61, 0.025);
    this.box(this.room, [0.14, 3.31, 0.38], [3.18, 1.72, -2.49], 0xbd8e61, 0.025);
    this.box(this.room, [2.02, 0.16, 0.38], [2.24, 3.31, -2.49], 0xbd8e61, 0.025);
    this.door.position.set(3.09, 0, -2.55);
    this.room.add(this.door);
    this.box(this.door, [1.73, 3.08, 0.12], [-0.865, 1.64, 0], 0xc88e59, 0.045);
    this.box(this.door, [1.43, 0.89, 0.055], [-0.865, 0.82, 0.087], 0xb57c4a, 0.055);
    this.box(this.door, [1.33, 1.23, 0.065], [-0.865, 2.19, 0.094], 0x446b61, 0.045);
    this.plaque(this.door, 1.15, 0.46, [-0.865, 2.26, 0.134], "#446b61", "员工通道");
    const handle = this.cylinder(this.door, 0.07, 0.07, 0.1, [-1.49, 1.49, 0.13], PALETTE.brass);
    handle.rotation.x = Math.PI / 2;
    this.box(this.room, [2, 0.03, 0.67], [2.21, 0.111, -1.96], 0xb28b63, 0.03);
    this.contactShadow(-1, 0.65, 3.5, 2.9, 0.25);
    this.contactShadow(2.24, -1.96, 1.5, 0.65, 0.16);

    this.box(this.room, [2.5, 0.28, 0.032], [0, -0.26, 2.762], PALETTE.green, 0.07);
    this.plaque(this.room, 2.25, 0.215, [0, -0.26, 2.782], "#294f48", "OH! · NIGHT SHIFT 008");
  }

  private buildWorkstation(): void {
    const desk = new THREE.Group();
    desk.position.set(0.67, 0.095, 0.62);
    desk.rotation.y = -Math.PI / 2;
    this.workstation.add(desk);
    this.box(desk, [2.72, 0.16, 1.9], [0, 0.94, 0], PALETTE.wood, 0.095);
    this.box(desk, [2.77, 0.055, 1.94], [0, 1.035, 0], 0xd0a16c, 0.025);
    for (const x of [-1.16, 1.16]) {
      for (const z of [-0.7, 0.7]) this.box(desk, [0.105, 0.89, 0.105], [x, 0.45, z], PALETTE.dark, 0.025);
      this.box(desk, [0.095, 0.1, 1.52], [x, 0.21, 0], PALETTE.dark, 0.025);
    }
    this.box(desk, [0.65, 0.67, 0.84], [0.86, 0.46, -0.04], 0xd7d3bd, 0.055);
    this.box(desk, [0.47, 0.48, 0.035], [0.86, 0.47, 0.401], 0xb8bcac, 0.02);
    for (let row = 0; row < 4; row += 1) this.box(desk, [0.3, 0.018, 0.02], [0.86, 0.38 + row * 0.07, 0.425], 0x747c70, 0.007);
    const monitor = new THREE.Group();
    monitor.position.set(-0.17, 0, -0.2);
    monitor.rotation.y = 0.96;
    desk.add(monitor);
    this.box(monitor, [0.58, 0.075, 0.5], [0, 1.115, 0], 0xb8b9a3, 0.045);
    this.box(monitor, [0.24, 0.18, 0.24], [0, 1.235, -0.05], PALETTE.cream, 0.04);
    this.box(monitor, [1.35, 1.08, 0.83], [0, 1.77, 0], 0xd6cfb3, 0.15);
    this.box(monitor, [1.27, 1.03, 0.15], [0, 1.77, 0.405], 0xf0e7cd, 0.105);
    this.box(monitor, [1.085, 0.76, 0.08], [0, 1.81, 0.501], 0x36453f, 0.085);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.955, 0.71625), this.screenMaterial);
    screen.position.set(0, 1.815, 0.548);
    monitor.add(screen);
    this.box(monitor, [0.075, 0.035, 0.024], [0.455, 1.366, 0.494], 0x8cbe81, 0.008);
    for (let row = 0; row < 5; row += 1) this.box(monitor, [0.2, 0.021, 0.016], [-0.4, 1.68 + row * 0.058, -0.424], 0x9b9b85, 0.006);
    this.box(desk, [1.29, 0.055, 0.42], [-0.19, 1.107, 0.68], 0xb1b29d, 0.04);
    const keyGeometry = new RoundedBoxGeometry(0.079, 0.035, 0.076, 1, 0.008);
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 12; column += 1) {
        const key = new THREE.Mesh(keyGeometry, this.surface(column === 0 && row === 0 ? PALETTE.coral : 0xf1e5ca));
        key.position.set(-0.72 + column * 0.096, 1.154, 0.532 + row * 0.094);
        key.castShadow = false;
        desk.add(key);
      }
    }
    this.box(desk, [0.45, 0.028, 0.07], [-0.25, 1.179, 0.814], 0xe0d2b4, 0.014);
    this.box(desk, [0.43, 0.014, 0.45], [0.78, 1.076, 0.67], PALETTE.teal, 0.06);
    this.box(desk, [0.19, 0.105, 0.265], [0.78, 1.13, 0.66], 0xf0e7ce, 0.08);
    this.line(desk, [new THREE.Vector3(0.79, 1.16, 0.51), new THREE.Vector3(0.98, 1.09, 0.29), new THREE.Vector3(0.69, 1.09, 0.07), new THREE.Vector3(0.53, 1.15, -0.17)], 0.012, 0x454c42);
    this.line(desk, [new THREE.Vector3(-0.16, 1.09, -0.53), new THREE.Vector3(-0.48, 0.6, -0.82), new THREE.Vector3(-0.22, 0.17, -0.74), new THREE.Vector3(0.64, 0.25, -0.48)], 0.018, 0x494b3e);
    this.noodleCup(desk, -1.0, 1.085, -0.3);
    this.sodaCan(desk, 1.06, 1.08, -0.5);

    const chair = new THREE.Group();
    chair.position.set(-1.15, 0.1, 0.62);
    chair.rotation.y = Math.PI / 2;
    this.workstation.add(chair);
    this.cylinder(chair, 0.065, 0.085, 0.51, [0, 0.37, 0], 0x646e66);
    for (let spoke = 0; spoke < 5; spoke += 1) {
      const angle = spoke * Math.PI * 2 / 5;
      const leg = this.box(chair, [0.1, 0.085, 0.55], [Math.sin(angle) * 0.23, 0.13, Math.cos(angle) * 0.23], 0x525e57, 0.035);
      leg.rotation.y = angle;
      const wheel = this.cylinder(chair, 0.075, 0.075, 0.1, [Math.sin(angle) * 0.47, 0.085, Math.cos(angle) * 0.47], PALETTE.dark, 12);
      wheel.rotation.x = Math.PI / 2;
    }
    this.box(chair, [1.08, 0.18, 0.95], [0, 0.62, 0], PALETTE.teal, 0.12);
    this.box(chair, [0.11, 0.7, 0.11], [0, 0.95, -0.46], 0x4d635c, 0.03);
    const back = this.box(chair, [1.02, 0.81, 0.2], [0, 1.24, -0.51], PALETTE.teal, 0.11);
    back.rotation.x = -0.1;
    this.box(chair, [0.73, 0.035, 0.025], [0, 1.22, -0.622], 0x36726e, 0.008);
  }

  private buildDecorations(): void {
    this.box(this.room, [2.63, 1.01, 0.18], [-1.48, 3.55, -2.3], PALETTE.coral, 0.13);
    this.plaque(this.room, 2.42, 0.9, [-1.48, 3.55, -2.199], "#d96d51", "OH!", "摸 鱼 网 吧 · HAOLÉMA");
    this.plaque(this.room, 1.55, 0.42, [2.24, 3.67, -2.405], "#294f48", "老板办公室");
    this.wallClock(0.63, 3.48, -2.335);
    this.box(this.room, [1.41, 0.95, 0.11], [-0.79, 2.31, -2.34], 0xc18b57, 0.04);
    this.box(this.room, [1.23, 0.78, 0.025], [-0.79, 2.31, -2.27], 0xb4a17d, 0.015);
    const noteA = this.plaque(this.room, 0.55, 0.59, [-1.07, 2.31, -2.248], "#466e5d", "今日目标", "准时下班");
    noteA.rotation.z = 0.055;
    const noteB = this.plaque(this.room, 0.48, 0.49, [-0.44, 2.28, -2.23], "#cc7756", "摸鱼", "请低调");
    noteB.rotation.z = -0.07;
    this.box(this.room, [0.15, 0.09, 0.016], [-0.44, 2.548, -2.208], 0xe9cd8a, 0.006);

    this.box(this.room, [1.38, 0.12, 0.61], [-2.67, 1.69, -2.1], PALETTE.wood, 0.045);
    for (const x of [-3.13, -2.18]) {
      this.box(this.room, [0.055, 0.32, 0.05], [x, 1.48, -2.2], PALETTE.dark, 0.013);
      this.box(this.room, [0.055, 0.05, 0.42], [x, 1.56, -2.06], PALETTE.dark, 0.013);
    }
    [0xc96f54, 0xdbb258, 0x477b72, 0xd9c7a1].forEach((color, index) => {
      const book = this.box(this.room, [0.13, 0.45 + index % 2 * 0.1, 0.3], [-3.12 + index * 0.16, 1.98 + index % 2 * 0.05, -2.11], color, 0.012);
      book.rotation.z = index === 3 ? -0.13 : 0;
    });
    this.box(this.room, [0.49, 0.35, 0.28], [-2.21, 1.96, -2.12], 0xd9b782, 0.055);
    for (let line = 0; line < 5; line += 1) this.box(this.room, [0.19, 0.012, 0.014], [-2.3, 1.87 + line * 0.033, -1.969], 0x69684c, 0.004);
    this.plaque(this.room, 0.16, 0.09, [-2.07, 2.04, -1.971], "#294f48", "FM");

    this.buildFridge();
    this.plant(2.91, 0.1, 1.72, 0.65);
    this.plant(-3.03, 0.1, 1.75, 0.45);
    this.box(this.room, [0.59, 0.68, 0.57], [2.91, 0.45, -0.4], 0x53685b, 0.075);
    this.box(this.room, [0.49, 0.03, 0.46], [2.91, 0.805, -0.4], 0x263e35, 0.03);
    this.plaque(this.room, 0.29, 0.24, [2.91, 0.53, -0.107], "#53685b", "纸");
    this.box(this.room, [0.55, 0.035, 0.41], [2.91, 0.1, 0.12], 0xede0bb, 0.04).rotation.y = 0.12;
    this.contactShadow(2.9, 1.72, 0.8, 0.65, 0.18);
    this.contactShadow(-2.89, -1.48, 1.1, 0.85, 0.2);

    this.pendant.position.set(0.2, 4.8, -0.75);
    this.room.add(this.pendant);
    this.cylinder(this.pendant, 0.018, 0.018, 0.66, [0, -0.33, 0], PALETTE.dark, 8);
    this.cylinder(this.pendant, 0.21, 0.66, 0.34, [0, -0.79, 0], PALETTE.green, 32);
    this.cylinder(this.pendant, 0.65, 0.65, 0.045, [0, -0.982, 0], PALETTE.brass, 32);
    const diffuser = this.cylinder(this.pendant, 0.59, 0.59, 0.025, [0, -1.008, 0], 0xffedc4, 32);
    diffuser.material = new THREE.MeshStandardMaterial({ color: 0xffe4ad, emissive: 0xffbd64, emissiveIntensity: 0.65 });
    const warm = new THREE.PointLight(0xffc581, 4, 7, 2);
    warm.position.set(0, -1.12, 0);
    this.pendant.add(warm);
  }

  private buildFridge(): void {
    const fridge = new THREE.Group();
    fridge.position.set(-2.89, 0.12, -1.44);
    fridge.scale.setScalar(0.82);
    fridge.rotation.y = 0.09;
    this.room.add(fridge);
    this.box(fridge, [1.09, 1.93, 0.94], [0, 0.965, 0], 0xdbd9bc, 0.12);
    this.box(fridge, [0.96, 1.67, 0.11], [0, 0.99, 0.486], PALETTE.green, 0.07);
    this.box(fridge, [0.74, 1.18, 0.045], [0, 0.95, 0.55], 0x91aa92, 0.035);
    for (let shelf = 0; shelf < 3; shelf += 1) {
      this.box(fridge, [0.71, 0.035, 0.11], [0, 0.46 + shelf * 0.36, 0.585], PALETTE.cream, 0.012);
      for (let drink = 0; drink < 3; drink += 1) {
        this.cylinder(fridge, 0.073, 0.073, 0.23, [-0.23 + drink * 0.23, 0.61 + shelf * 0.36, 0.591], [PALETTE.coral, 0xd0ad55, PALETTE.teal][drink], 12);
      }
    }
    this.box(fridge, [0.065, 0.47, 0.09], [0.373, 1.04, 0.63], PALETTE.brass, 0.03);
    this.plaque(fridge, 0.68, 0.22, [0, 1.668, 0.548], "#294f48", "冰镇快乐");
    this.box(fridge, [0.88, 0.09, 0.78], [0, 0.03, 0], PALETTE.dark, 0.03);
    this.sodaCan(fridge, -0.24, 1.945, 0.09);
    this.sodaCan(fridge, 0.15, 1.945, -0.08);
  }

  private noodleCup(parent: THREE.Object3D, x: number, y: number, z: number): void {
    this.cylinder(parent, 0.16, 0.12, 0.26, [x, y + 0.13, z], PALETTE.coral);
    this.cylinder(parent, 0.169, 0.169, 0.025, [x, y + 0.265, z], PALETTE.paper);
    this.cylinder(parent, 0.145, 0.145, 0.011, [x, y + 0.283, z], 0xc69a55);
    for (let index = 0; index < 2; index += 1) {
      const chopstick = this.cylinder(parent, 0.01, 0.012, 0.54, [x + 0.015 + index * 0.05, y + 0.47, z], 0xe9c58b, 6);
      chopstick.rotation.z = -0.32;
      chopstick.rotation.x = 0.23;
    }
  }

  private sodaCan(parent: THREE.Object3D, x: number, y: number, z: number): void {
    this.cylinder(parent, 0.105, 0.105, 0.31, [x, y + 0.16, z], PALETTE.coral);
    this.cylinder(parent, 0.102, 0.102, 0.018, [x, y + 0.321, z], 0xc5cbbb);
    this.cylinder(parent, 0.104, 0.104, 0.025, [x, y + 0.014, z], 0xc5cbbb);
    this.box(parent, [0.045, 0.014, 0.065], [x, y + 0.336, z], 0x7d8a7e, 0.015);
    this.box(parent, [0.102, 0.13, 0.008], [x, y + 0.16, z + 0.107], PALETTE.cream, 0.02);
  }

  private wallClock(x: number, y: number, z: number): void {
    const outer = this.cylinder(this.room, 0.365, 0.365, 0.09, [x, y, z], PALETTE.green, 40);
    outer.rotation.x = Math.PI / 2;
    const texture = this.canvasTexture(256, 256, (ctx) => {
      ctx.fillStyle = "#f5e8cf";
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "#344b40";
      ctx.lineCap = "round";
      for (let hour = 0; hour < 12; hour += 1) {
        const angle = hour * Math.PI / 6;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(128 + Math.sin(angle) * 96, 128 - Math.cos(angle) * 96);
        ctx.lineTo(128 + Math.sin(angle) * 107, 128 - Math.cos(angle) * 107);
        ctx.stroke();
      }
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(77, 91); ctx.stroke();
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(178, 59); ctx.stroke();
      ctx.fillStyle = "#d96d51";
      ctx.beginPath(); ctx.arc(128, 128, 9, 0, Math.PI * 2); ctx.fill();
    });
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.32, 40), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }));
    face.position.set(x, y, z + 0.052);
    this.room.add(face);
  }

  private plant(x: number, y: number, z: number, scale: number): void {
    const plant = new THREE.Group();
    plant.position.set(x, y, z);
    plant.scale.setScalar(scale);
    this.room.add(plant);
    this.cylinder(plant, 0.35, 0.26, 0.49, [0, 0.245, 0], 0xbc7753);
    this.cylinder(plant, 0.366, 0.366, 0.09, [0, 0.48, 0], 0xd79970);
    this.cylinder(plant, 0.323, 0.323, 0.018, [0, 0.527, 0], 0x665a39);
    const leafGeometry = new THREE.SphereGeometry(1, 14, 10);
    for (let index = 0; index < 9; index += 1) {
      const angle = index * 2.4;
      const height = 0.99 + (index % 3) * 0.22;
      const radius = 0.24 + (index % 2) * 0.12;
      const tip = new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      this.line(plant, [new THREE.Vector3(0, 0.53, 0), new THREE.Vector3(tip.x * 0.5, height * 0.8, tip.z * 0.5), tip], 0.018, 0x416244);
      const leaf = new THREE.Mesh(leafGeometry, this.surface(index % 2 ? 0x577c4c : 0x6d8f50));
      leaf.scale.set(0.18, 0.4, 0.074);
      leaf.position.copy(tip);
      leaf.rotation.set(0.4, -angle, -0.3 + index % 3 * 0.3);
      leaf.castShadow = true;
      plant.add(leaf);
    }
  }

  private contactShadow(x: number, z: number, width: number, depth: number, opacity: number): void {
    const texture = this.canvasTexture(128, 128, (ctx) => {
      const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 63);
      gradient.addColorStop(0, "rgba(51,39,26,0.8)");
      gradient.addColorStop(0.42, "rgba(51,39,26,0.45)");
      gradient.addColorStop(1, "rgba(51,39,26,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, depthWrite: false, toneMapped: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.102, z);
    this.room.add(mesh);
  }

  private mergeStaticMeshes(): void {
    this.room.updateMatrixWorld(true);
    const batches = new Map<string, THREE.Mesh[]>();
    const animatedRoots = new Set<THREE.Object3D>([this.horse.group, this.boss.group, this.door, this.pendant]);
    this.room.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || Array.isArray(object.material) || object.material === this.screenMaterial) return;
      for (let parent: THREE.Object3D | null = object; parent; parent = parent.parent) {
        if (animatedRoots.has(parent)) return;
      }
      const key = `${object.material.uuid}-${object.castShadow}-${object.receiveShadow}`;
      const batch = batches.get(key) ?? [];
      batch.push(object);
      batches.set(key, batch);
    });
    const retired = new Set<THREE.BufferGeometry>();
    batches.forEach((meshes) => {
      if (meshes.length < 2) return;
      const transformed = meshes.map((mesh) => {
        const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        return geometry.applyMatrix4(mesh.matrixWorld);
      });
      const geometry = mergeGeometries(transformed, false);
      transformed.forEach((part) => part.dispose());
      if (!geometry) return;
      const merged = new THREE.Mesh(geometry, meshes[0].material);
      merged.castShadow = meshes[0].castShadow;
      merged.receiveShadow = meshes[0].receiveShadow;
      meshes.forEach((mesh) => {
        retired.add(mesh.geometry);
        mesh.removeFromParent();
      });
      this.room.add(merged);
    });
    retired.forEach((geometry) => geometry.dispose());
  }

}
