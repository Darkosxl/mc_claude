import * as THREE from 'three';
import { World } from './world/World';
import { Player } from './Player';
import { Input } from './Input';
import { BlockType } from './world/BlockTypes';
import { VillageGenerator } from './world/VillageGenerator';
import { MobManager } from './entities/MobManager';
import { CinematicCamera } from './CinematicCamera';
import { TreeGenerator } from './world/TreeGenerator';
import { DayNightCycle } from './DayNightCycle';
import { HealthSystem } from './HealthSystem';

export class Game {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private world: World;
    private player: Player;
    private input: Input;
    private mobManager: MobManager;
    private cinematicCamera: CinematicCamera;
    private dayNightCycle: DayNightCycle;
    private healthSystem: HealthSystem;
    private directionalLight: THREE.DirectionalLight;
    private ambientLight: THREE.AmbientLight;
    
    private lastTime = 0;
    private frameCount = 0;
    private fpsUpdateTime = 0;
    private isRunning = false;
    private isCinematic = false;

    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            stencil: false,
            depth: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setPixelRatio(1.0);
        this.renderer.setSize(window.innerWidth * 0.9, window.innerHeight * 0.9);
        this.renderer.shadowMap.enabled = false;
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        document.getElementById('gameContainer')?.appendChild(this.renderer.domElement);
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 80, 300);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(-15, 65, 5);
        
        this.world = new World(this.scene);
        this.player = new Player(this.camera, this.world);
        this.input = new Input();
        this.mobManager = new MobManager(this.scene, this.world);
        this.cinematicCamera = new CinematicCamera(this.camera);
        
        this.setupLighting();
        this.setupEventListeners();
        
        const villageGen = new VillageGenerator(this.world);
        villageGen.generateVillage(0, 0);
        
        const treeGen = new TreeGenerator(this.world);
        treeGen.generateForest(0, 0, 60, 15);
        
        this.mobManager.spawnMobs();
    }
    
    private setupLighting(): void {
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.scene.add(this.ambientLight);
        
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.directionalLight.position.set(50, 100, 50);
        this.scene.add(this.directionalLight);
        
        // Initialize day/night cycle
        this.dayNightCycle = new DayNightCycle(this.scene, this.directionalLight, this.ambientLight);
        
        // Initialize health system
        this.healthSystem = new HealthSystem();
        
        // Add torch lights
        this.world.addTorchLights(this.scene);
        
        // Listen for day/night events
        document.addEventListener('nightfall', () => {
            this.mobManager.spawnZombies(3);
        });
        
        document.addEventListener('dawn', () => {
            this.mobManager.clearZombies();
        });
    }
    
    private setupEventListeners(): void {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth * 0.9, window.innerHeight * 0.9);
        });
        
        this.input.onKeyPress('KeyF', () => {
            this.toggleCinematic();
        });
        
        this.input.onKeyPress('Digit1', () => {
            this.player.setSelectedBlockType(BlockType.STONE);
        });
        
        this.input.onKeyPress('Digit2', () => {
            this.player.setSelectedBlockType(BlockType.WOOD);
        });
        
        this.input.onKeyPress('Digit3', () => {
            this.player.setSelectedBlockType(BlockType.PLANKS);
        });
        
        this.input.onKeyPress('Digit4', () => {
            this.player.setSelectedBlockType(BlockType.DIRT);
        });
        
        this.renderer.domElement.addEventListener('click', () => {
            if (!this.isCinematic) {
                this.renderer.domElement.requestPointerLock();
            }
        });
    }
    
    private toggleCinematic(): void {
        this.isCinematic = !this.isCinematic;
        const hud = document.getElementById('hud');
        
        if (this.isCinematic) {
            document.exitPointerLock();
            if (hud) hud.style.display = 'none';
            this.cinematicCamera.startCinematic();
        } else {
            if (hud) hud.style.display = 'block';
            this.cinematicCamera.stopCinematic();
        }
    }
    
    public start(): void {
        this.isRunning = true;
        this.gameLoop(0);
    }
    
    private gameLoop = (currentTime: number): void => {
        if (!this.isRunning) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/30);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime > 1000) {
            const fps = Math.round(this.frameCount * 1000 / (currentTime - this.fpsUpdateTime));
            const fpsElement = document.getElementById('fpsCounter');
            if (fpsElement) fpsElement.textContent = `FPS: ${fps}`;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
        
        requestAnimationFrame(this.gameLoop);
    };
    
    private update(deltaTime: number): void {
        this.input.update();
        
        if (this.isCinematic) {
            this.cinematicCamera.update(deltaTime);
        } else {
            this.player.update(deltaTime, this.input);
        }
        
        this.mobManager.update(deltaTime, this.player.getPosition());
        this.world.update();
        this.dayNightCycle.update(deltaTime);
    }
    
    private render(): void {
        this.renderer.render(this.scene, this.camera);
    }
}