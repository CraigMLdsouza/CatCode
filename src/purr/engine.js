// src/purr/engine.js

// 1. Core
import * as THREE from 'three';

// 2. Addons
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- NEW IMPORTS FOR VISUAL EFFECTS ---
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { EffectAnimator } from './effectAnimator.js';

export class PurrEngine {
  /**
   * @param {HTMLElement} container
   * @param {Object} config - Optional config object for debug flags
   */
  constructor(container, config = { debug: false, bloom: true, ao: true }) {
    if (!container) throw new Error('PurrEngine requires a container element');

    this.container = container;
    this.config = config;
    this._running = false;
    this.services = null;

    // --- 1. RENDERER SETUP ---
    this.renderer = new THREE.WebGLRenderer({ 
        antialias: false, // We use FXAA instead
        powerPreference: "high-performance",
        stencil: false,
        depth: true
    });
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    
    // Cinematic Tone Mapping (High Contrast)
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2; // Slightly brighter to compensate for SSAO
    
    this.container.appendChild(this.renderer.domElement);

    // --- 2. SCENE & CAMERA ---
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e); 
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.025); // Thicker fog for depth

    this.camera = new THREE.PerspectiveCamera(60, this._getAspect(), 0.1, 1000);
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 0, 0);

    // --- 3. COMPOSER (Visual Stack) ---
    this._initPostProcessing();

    // --- 4. LIGHTING ---
    this._initLighting();
    
    // --- 5. DEBUG TOOLS ---
    if (this.config.debug) {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
    }

    // --- LOOP STATE ---
    this.clock = new THREE.Clock();
    this.updatables = new Set(); 
    this.currentLevel = null;

    // --- EFFECT ANIMATORS ---
    this.activeEffects = [];

    // Store initial exposure for restoration
    this.baseExposure = this.renderer.toneMappingExposure;

    // --- RESIZE HANDLER ---
    window.addEventListener('resize', () => this._onResize());
  }

  // ------------- INITIALIZATION HELPERS -------------

  _initLighting() {
    // 1. Hemisphere (Sky + Ground bounce)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222244, 0.6);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // 2. Main Directional Light (The "Sun")
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    
    // Large shadow frustum to cover entire level
    const shadowSize = 80; // Large coverage area
    dirLight.shadow.camera.left = -shadowSize;
    dirLight.shadow.camera.right = shadowSize;
    dirLight.shadow.camera.top = shadowSize;
    dirLight.shadow.camera.bottom = -shadowSize;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.mapSize.width = 4096;  // Ultra HD shadows
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.bias = -0.001;
    dirLight.shadow.normalBias = 0.02;
    this.scene.add(dirLight);

    // 3. Rim Light (Backlight) - Adds "pop" to object edges
    // A cool cyan/purple rim light fits the "Purr"/Tech aesthetic
    const rimLight = new THREE.SpotLight(0xbd93f9, 4.0); // Bright Purple/Pink
    rimLight.position.set(-10, 10, -10);
    rimLight.lookAt(0, 0, 0);
    this.scene.add(rimLight);
    
    // Grid
    const grid = new THREE.GridHelper(100, 100, 0x444444, 0x111111);
    grid.position.y = -0.01;
    this.scene.add(grid);

    this.lights = { hemiLight, dirLight, rimLight };
  }

  _initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Pass 1: Base Render
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Pass 2: SSAO (Ambient Occlusion) - Adds contact shadows
    if (this.config.ao) {
        const ssaoPass = new SSAOPass(this.scene, this.camera, width, height);
        ssaoPass.kernelRadius = 16;      // Wider shadows
        ssaoPass.minDistance = 0.005;
        ssaoPass.maxDistance = 0.1;
        ssaoPass.output = SSAOPass.OUTPUT.Default;
        this.composer.addPass(ssaoPass);
    }

    // Pass 3: Bloom (Glow)
    if (this.config.bloom) {
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            1.5, 0.4, 0.85
        );
        bloomPass.strength = 0.6; // Softer glow
        bloomPass.radius = 0.5;
        bloomPass.threshold = 0.8; 
        this.composer.addPass(bloomPass);
    }

    // Pass 4: FXAA (Anti-Aliasing) - Fixes jagged edges
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
    this.fxaaPass = fxaaPass; // Save ref to update on resize
    this.composer.addPass(fxaaPass);

    // Pass 5: Output (Tone Mapping & Color Correction)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  // ------------- PUBLIC API -------------

  attachServices(services) {
    this.services = services;
  }

  addUpdatable(obj) {
    this.updatables.add(obj);
  }

  removeUpdatable(obj) {
    this.updatables.delete(obj);
  }

  /**
   * Pulse exposure (brightness) effect
   * @param {number} amount - How much to change exposure (0.5 = 50% brighter)
   * @param {number} duration - How long effect lasts in seconds
   */
  pulseExposure(amount, duration) {
    const startExposure = this.renderer.toneMappingExposure;
    const peakExposure = startExposure + amount;

    const animator = new EffectAnimator(
      duration,
      (progress) => {
        // Use sine curve for smooth pulse (up and down)
        const curve = Math.sin(progress * Math.PI);
        this.renderer.toneMappingExposure = startExposure + curve * amount;
      },
      () => {
        // Restore base exposure
        this.renderer.toneMappingExposure = startExposure;
      }
    );

    this.activeEffects.push(animator);
  }

  /**
   * Change fog density
   * @param {number} value - Fog density (typical: 0.01 - 0.1)
   */
  setFogDensity(value) {
    if (this.scene.fog && this.scene.fog.isFogExp2) {
      this.scene.fog.density = value;
    }
  }

  /**
   * Flash background with a color
   * @param {number} color - Hex color (e.g., 0xff0000 for red)
   * @param {number} duration - How long to flash in seconds
   */
  flashBackground(color, duration) {
    const startColor = this.scene.background.clone();
    const flashColor = new THREE.Color(color);

    const animator = new EffectAnimator(
      duration,
      (progress) => {
        // Fade from flash color back to original
        const reversedProgress = 1 - progress;
        this.scene.background.lerpColors(startColor, flashColor, reversedProgress);
      },
      () => {
        // Restore original background
        this.scene.background.copy(startColor);
      }
    );

    this.activeEffects.push(animator);
  }

  setLevel(levelInstance) {
    // Let the old level clean up ONLY what it owns
    if (this.currentLevel && typeof this.currentLevel.destroy === 'function') {
      this.currentLevel.destroy(this, this.services);
    }

    this.currentLevel = levelInstance || null;

    if (this.currentLevel && typeof this.currentLevel.build === 'function') {
      this.currentLevel.build(this, this.services);
    }
  }


  start() {
    if (this._running) return;
    this._running = true;
    this.clock.start();
    this._loop();
  }

  stop() {
    this._running = false;
  }

  // ------------- INTERNALS -------------

  _loop() {
    if (!this._running) return;

    const delta = this.clock.getDelta();
    const dt = Math.min(delta, 0.05);

    // Update all registered updatables
    for (const obj of this.updatables) {
      if (obj && typeof obj.update === 'function') {
        obj.update(dt, this);
      }
    }

    // Update active effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      this.activeEffects[i].update(dt);
      if (this.activeEffects[i].finished) {
        this.activeEffects.splice(i, 1);
      }
    }

    if (this.currentLevel && typeof this.currentLevel.update === 'function') {
      this.currentLevel.update(dt, this, this.services);
    }

    if (this.controls) this.controls.update();

    this.composer.render();

    requestAnimationFrame(() => this._loop());
  }

  _cleanupScene() {
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
        const child = this.scene.children[i];
        if (child.isLight || child.isGridHelper) continue;
        this._disposeNode(child);
        this.scene.remove(child);
    }
  }

  _disposeNode(node) {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
        if (Array.isArray(node.material)) {
            node.material.forEach(m => this._disposeMaterial(m));
        } else {
            this._disposeMaterial(node.material);
        }
    }
    if (node.children) {
        for (const child of node.children) this._disposeNode(child);
    }
  }

  _disposeMaterial(material) {
    material.dispose();
    for (const key of Object.keys(material)) {
        const value = material[key];
        if (value && typeof value === 'object' && 'minFilter' in value) {
            value.dispose();
        }
    }
  }

  _getAspect() {
    return this.container.clientWidth / this.container.clientHeight;
  }

  _onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    // Update FXAA resolution or edges will look wrong after resize
    if (this.fxaaPass) {
        this.fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
    }
  }
}