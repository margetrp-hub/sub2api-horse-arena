import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Pause, Play, Rotate3d, RotateCcw } from "lucide";
import { icon } from "./ui/icons";
import { buildMachine, CAPSULE_RADIUS } from "./lottery-machine-model";

type LotteryMachineRuntimeOptions = { onComplete: () => void };
const DURATION = 4400;
const CAMERA = new THREE.Vector3(5.1, 3.6, 9.8);
const ease = (x: number): number => 1 - (1 - THREE.MathUtils.clamp(x, 0, 1)) ** 3;

export class LotteryMachineRuntime {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  private renderer?: THREE.WebGLRenderer;
  private controls?: OrbitControls;
  private model?: ReturnType<typeof buildMachine>;
  private environment?: THREE.WebGLRenderTarget;
  private readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0), allowSleep: true });
  private readonly bodies: CANNON.Body[] = [];
  private readonly resizeObserver: ResizeObserver;
  private readonly visibilityObserver: IntersectionObserver;
  private readonly motion = matchMedia("(prefers-reduced-motion: reduce)");
  private animationFrame = 0;
  private lastTime = 0;
  private elapsed = 0;
  private startedAt = 0;
  private impulseAt = 0;
  private mode: "idle" | "demo" | "draw" = "idle";
  private autoMotion = !this.motion.matches;
  private locked = false;
  private visible = true;
  private destroyed = false;
  private dirty = true;
  private completionTimer: number | undefined;
  private pointerStart = new THREE.Vector2();
  private pointerId: number | null = null;
  private readonly stage: HTMLDivElement;
  private readonly status: HTMLElement;
  private readonly demoButton: HTMLButtonElement;
  private readonly motionButton: HTMLButtonElement;

  constructor(private readonly mount: HTMLElement, private readonly options: LotteryMachineRuntimeOptions) {
    mount.innerHTML = `
      <div class="machine-viewport"></div>
      <div class="machine-tools" aria-label="扭蛋机视角">
        <button class="machine-tool" type="button" data-machine-demo data-focus="demo" aria-label="试玩转动，不消耗代币" data-tooltip="试玩转动 · 不消耗代币">${icon(Rotate3d)}</button>
        <button class="machine-tool" type="button" data-machine-reset data-focus="view" aria-label="重置视角" data-tooltip="重置视角">${icon(RotateCcw)}</button>
        <button class="machine-tool" type="button" data-machine-motion data-focus="motion"></button>
      </div>
      <span class="machine-demo-status" role="status"></span>
    `;
    this.stage = mount.querySelector(".machine-viewport")!;
    this.status = mount.querySelector(".machine-demo-status")!;
    this.demoButton = mount.querySelector("[data-machine-demo]")!;
    this.motionButton = mount.querySelector("[data-machine-motion]")!;
    this.demoButton.addEventListener("click", this.demo);
    mount.querySelector("[data-machine-reset]")!.addEventListener("click", this.resetView);
    this.motionButton.addEventListener("click", this.toggleMotion);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.wake();
    });
    try {
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      const canvas = this.renderer.domElement;
      canvas.className = "lottery-runtime-canvas";
      canvas.setAttribute("aria-label", "幸运扭蛋机三维模型");
      canvas.setAttribute("role", "img");
      canvas.tabIndex = 0;
      canvas.dataset.focus = "machine";
      this.stage.appendChild(canvas);
      this.setupScene();
      this.controls = new OrbitControls(this.camera, canvas);
      canvas.style.touchAction = "pan-y pinch-zoom";
      this.controls.target.set(0, 2.1, 0);
      this.controls.enablePan = false;
      this.controls.enableZoom = false;
      this.controls.enableDamping = !this.motion.matches;
      this.controls.dampingFactor = 0.09;
      this.controls.minPolarAngle = Math.PI * 0.31;
      this.controls.maxPolarAngle = Math.PI * 0.53;
      this.controls.rotateSpeed = 0.65;
      this.controls.addEventListener("change", this.markDirty);
      canvas.addEventListener("pointerdown", this.pointerDown);
      canvas.addEventListener("pointerup", this.pointerUp);
      canvas.addEventListener("pointercancel", this.pointerCancel);
      canvas.addEventListener("keydown", this.keyDown);
      canvas.addEventListener("webglcontextlost", this.contextLost);
      this.resizeObserver.observe(this.stage);
      this.visibilityObserver.observe(this.stage);
      this.motion.addEventListener("change", this.motionChanged);
      document.addEventListener("visibilitychange", this.wake);
      mount.dataset.runtimeState = "idle";
      mount.dataset.renderer = "three";
      this.updateMotionControl();
      this.resize();
      this.animationFrame = requestAnimationFrame(this.tick);
    } catch {
      this.fallback();
    }
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
    this.demoButton.disabled = locked || this.mode !== "idle" || !this.renderer;
  }

  play(): void {
    if (this.destroyed || this.mode === "draw") return;
    this.start("draw");
  }

  private readonly demo = (): void => {
    if (!this.locked && this.mode === "idle" && this.renderer) this.start("demo");
  };

  private start(mode: "demo" | "draw"): void {
    clearTimeout(this.completionTimer);
    this.mode = mode;
    this.elapsed = 0;
    this.startedAt = performance.now();
    this.impulseAt = -1;
    this.mount.dataset.runtimeState = mode === "draw" ? "playing" : "demo";
    this.status.textContent = mode === "demo" ? "试玩中 · 不消耗代币" : "";
    this.demoButton.disabled = true;
    if (this.model) this.model.delivery.visible = false;
    if (!this.renderer || this.motion.matches) {
      if (this.model) {
        this.model.crank.rotation.z -= Math.PI / 2;
        this.dirty = true;
      }
      this.completionTimer = window.setTimeout(this.complete, 120);
      return;
    }
    // Results must still settle if the tab becomes hidden during the presentation.
    if (mode === "draw") this.completionTimer = window.setTimeout(this.complete, DURATION + 100);
    this.wake();
  }

  private readonly complete = (): void => {
    if (this.destroyed || this.mode === "idle") return;
    const draw = this.mode === "draw";
    this.mode = "idle";
    clearTimeout(this.completionTimer);
    this.mount.dataset.runtimeState = "idle";
    this.status.textContent = "";
    this.demoButton.disabled = this.locked || !this.renderer;
    this.dirty = true;
    if (draw) this.options.onComplete();
  };

  private setupScene(): void {
    const renderer = this.renderer!;
    this.model = buildMachine();
    this.scene.add(this.model.group);
    this.camera.position.copy(CAMERA);
    this.camera.lookAt(0, 2.1, 0);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.65;
    room.dispose();
    pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight(0xf7f5ed, 0x778e83, 1.1));
    const key = new THREE.DirectionalLight(0xfff2dc, 2.2);
    key.position.set(-3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -4;
    key.shadow.camera.right = key.shadow.camera.top = 4;
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 20;
    key.shadow.normalBias = 0.035;
    key.shadow.bias = -0.0003;
    key.shadow.radius = 5;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xd8fff1, 0.8);
    fill.position.set(4, 4, -2);
    this.scene.add(fill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.22 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.015;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.setupPhysics();
  }

  private setupPhysics(): void {
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.3;
    const floor = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(1.2, 0.05, 1.2)), position: new CANNON.Vec3(0, 2.2, 0) });
    this.world.addBody(floor);
    this.world.addBody(new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(1.2, 0.05, 1.2)), position: new CANNON.Vec3(0, 3.94, 0) }));
    for (let i = 0; i < 24; i++) {
      const angle = i * Math.PI * 2 / 24;
      const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(0.06, 0.88, 0.15)) });
      wall.position.set(Math.cos(angle) * 1.02, 3.06, Math.sin(angle) * 1.02);
      wall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -angle);
      this.world.addBody(wall);
    }
    this.model!.capsules.forEach((_, i) => {
      const slot = i % 9;
      const layer = Math.floor(i / 9);
      const angle = slot * Math.PI * 2 / 8 + layer * 0.19;
      const radius = slot === 8 ? 0.06 : 0.68;
      const body = new CANNON.Body({
        mass: 0.12, shape: new CANNON.Sphere(CAPSULE_RADIUS),
        position: new CANNON.Vec3(Math.cos(angle) * radius, 2.46 + layer * 0.41, Math.sin(angle) * radius),
        linearDamping: 0.15, angularDamping: 0.22, sleepSpeedLimit: 0.12, sleepTimeLimit: 0.5,
      });
      body.quaternion.setFromEuler(i * 1.1, i * 0.7, i * 0.4);
      body.velocity.set(Math.sin(i * 2) * 0.25, 0, Math.cos(i * 3) * 0.25);
      this.bodies.push(body);
      this.world.addBody(body);
    });
    for (let i = 0; i < 150; i++) this.world.step(1 / 60);
    this.syncCapsules();
  }

  private syncCapsules(): void {
    this.bodies.forEach((body, i) => {
      this.model!.capsules[i].position.copy(body.position);
      this.model!.capsules[i].quaternion.copy(body.quaternion);
    });
  }

  private readonly resize = (): void => {
    if (!this.renderer) return;
    const { width, height } = this.stage.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // Frame the entire object, including the tray, in narrow and short viewports.
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(2.68 / CAMERA.length())) / Math.min(1, this.camera.aspect / 0.79);
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    this.wake();
  };

  private readonly markDirty = (): void => { this.dirty = true; };
  private readonly wake = (): void => {
    this.lastTime = 0;
    this.dirty = true;
    if (!this.animationFrame && !this.destroyed && this.renderer && this.visible && !document.hidden) {
      this.animationFrame = requestAnimationFrame(this.tick);
    }
  };

  private readonly tick = (now: number): void => {
    this.animationFrame = 0;
    if (this.destroyed || !this.renderer || !this.visible || document.hidden) return;
    this.animationFrame = requestAnimationFrame(this.tick);
    if (this.lastTime && now - this.lastTime < 1000 / 30) return;
    const dt = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.05) : 1 / 30;
    this.lastTime = now;
    this.controls?.update();
    const model = this.model!;
    if (this.mode !== "idle") {
      this.elapsed = now - this.startedAt;
      const progress = this.elapsed / DURATION;
      model.crank.rotation.z = -Math.PI * 2 * ease(this.elapsed / 1600);
      model.paddle.rotation.y = this.elapsed * 0.012;
      if (this.elapsed < 2600 && this.elapsed - this.impulseAt > 180) {
        this.impulseAt = this.elapsed;
        this.bodies.forEach((body, i) => {
          body.wakeUp();
          body.applyImpulse(new CANNON.Vec3(-body.position.z * 0.08, 0.1 + (i % 3) * 0.015, body.position.x * 0.08));
        });
      }
      this.world.step(1 / 60, dt, 3);
      this.syncCapsules();
      const drop = THREE.MathUtils.clamp((this.elapsed - 2750) / 900, 0, 1);
      model.delivery.visible = drop > 0;
      model.delivery.position.set(0, 0.705 + Math.sin(drop * Math.PI) * 0.09, 0.98 + ease(drop) * 0.39);
      model.delivery.rotation.x = -drop * Math.PI * 2;
      this.dirty = true;
      if (progress >= 1) this.complete();
    } else if (this.autoMotion && !this.locked) {
      model.group.rotation.y = Math.sin(now * 0.0005) * 0.045;
      this.world.step(1 / 60, dt, 3);
      this.syncCapsules();
      this.dirty = true;
    }
    if (this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
  };

  private readonly pointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary) { this.pointerId = null; return; }
    this.pointerId = event.pointerId;
    this.pointerStart.set(event.clientX, event.clientY);
  };
  private readonly pointerCancel = (): void => { this.pointerId = null; };
  private readonly pointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    if (Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) > 7 || !this.model) return;
    const rect = this.stage.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), this.camera);
    if (ray.intersectObject(this.model.crank, true).length) this.demo();
  };
  private readonly keyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.demo(); }
    else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      const relative = this.camera.position.clone().sub(new THREE.Vector3(0, 2.1, 0));
      const spherical = new THREE.Spherical().setFromVector3(relative);
      if (event.key === "ArrowLeft") spherical.theta -= 0.2;
      if (event.key === "ArrowRight") spherical.theta += 0.2;
      if (event.key === "ArrowUp") spherical.phi -= 0.1;
      if (event.key === "ArrowDown") spherical.phi += 0.1;
      this.camera.position.setFromSpherical(spherical).add(new THREE.Vector3(0, 2.1, 0));
      this.controls?.update();
      this.dirty = true;
    }
  };
  private readonly resetView = (): void => {
    if (this.controls) this.controls.enableDamping = false;
    this.controls?.reset();
    this.camera.position.copy(CAMERA);
    this.controls?.target.set(0, 2.1, 0);
    this.controls?.update();
    if (this.controls) this.controls.enableDamping = !this.motion.matches;
    if (this.model) this.model.group.rotation.y = 0;
    this.dirty = true;
  };
  private readonly toggleMotion = (): void => {
    this.autoMotion = !this.autoMotion;
    this.updateMotionControl();
    this.wake();
  };
  private readonly motionChanged = (): void => {
    this.autoMotion = !this.motion.matches;
    if (this.controls) this.controls.enableDamping = !this.motion.matches;
    if (this.motion.matches && this.mode !== "idle") this.complete();
    this.updateMotionControl();
    this.wake();
  };
  private updateMotionControl(): void {
    const label = this.autoMotion ? "暂停待机动画" : "播放待机动画";
    this.motionButton.innerHTML = icon(this.autoMotion ? Pause : Play);
    this.motionButton.setAttribute("aria-label", label);
    this.motionButton.setAttribute("aria-pressed", String(this.autoMotion));
    this.motionButton.dataset.tooltip = label;
  }
  private readonly contextLost = (event: Event): void => {
    event.preventDefault();
    const pendingDraw = this.mode === "draw";
    this.fallback();
    if (pendingDraw) this.complete();
  };
  private fallback(): void {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    this.controls?.dispose();
    this.renderer?.dispose();
    this.renderer = undefined;
    this.mount.dataset.renderer = "fallback";
    this.stage.innerHTML = `<img class="machine-fallback" src="${import.meta.env.BASE_URL}assets/lottery-capsule-machine.png" alt="幸运扭蛋机"><span class="machine-fallback-note">三维画面暂不可用</span>`;
    this.mount.querySelectorAll<HTMLButtonElement>(".machine-tool").forEach(button => { button.disabled = true; });
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    clearTimeout(this.completionTimer);
    this.resizeObserver.disconnect();
    this.visibilityObserver.disconnect();
    this.motion.removeEventListener("change", this.motionChanged);
    document.removeEventListener("visibilitychange", this.wake);
    this.controls?.dispose();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
    this.environment?.dispose();
    this.renderer?.dispose();
    this.mount.replaceChildren();
  }
}
