import * as THREE from 'three';
import { World } from './world';
import { Player } from './player';

class Game {
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private world!: World;
  private player!: Player;
  private clock = new THREE.Clock();

  constructor() {
    this.init();
  }

  private init(): void {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Create world and player
    this.world = new World(this.scene);
    this.player = new Player(this.world);

    // Setup lighting
    this.setupLighting();

    // Setup event listeners
    this.setupEventListeners();

    // Load initial chunks
    this.world.loadChunksAroundPosition(0, 0, 3);

    // Start game loop
    this.gameLoop();
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
  }

  private setupEventListeners(): void {
    // Window resize
    window.addEventListener('resize', () => {
      this.player.camera.aspect = window.innerWidth / window.innerHeight;
      this.player.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Mouse click for block interaction
    document.addEventListener('mousedown', (event) => {
      this.player.handleMouseClick(event);
    });

    // Prevent context menu on right click
    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    // Pointer lock error handling
    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock failed');
    });

    // Exit pointer lock with Escape
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && document.pointerLockElement) {
        document.exitPointerLock();
      }
    });
  }

  private gameLoop(): void {
    requestAnimationFrame(() => this.gameLoop());

    const deltaTime = this.clock.getDelta();
    
    // Update player
    this.player.update(deltaTime);

    // Load chunks around player
    const playerPos = this.player.camera.position;
    this.world.loadChunksAroundPosition(playerPos.x, playerPos.z, 2);

    // Render
    this.renderer.render(this.scene, this.player.camera);
  }
}

// Start the game
new Game();

// Error handling
window.addEventListener('error', (event) => {
  console.error('Game error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});