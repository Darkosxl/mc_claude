import * as THREE from 'three';
import { World } from './world';

export class Player {
  public camera: THREE.PerspectiveCamera;
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private world: World;
  private raycaster = new THREE.Raycaster();
  
  // Movement state
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private canJump = false;

  // Physics constants
  private static readonly GRAVITY = -32;
  private static readonly JUMP_SPEED = 16;
  private static readonly MOVE_SPEED = 10;
  private static readonly PLAYER_HEIGHT = 1.8;
  private static readonly PLAYER_RADIUS = 0.3;

  constructor(world: World) {
    this.world = world;
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 10, 0);
    
    this.setupControls();
  }

  private setupControls(): void {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': this.moveForward = true; break;
        case 'KeyS': this.moveBackward = true; break;
        case 'KeyA': this.moveLeft = true; break;
        case 'KeyD': this.moveRight = true; break;
        case 'Space': 
          event.preventDefault();
          if (this.canJump) this.velocity.y = Player.JUMP_SPEED;
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': this.moveForward = false; break;
        case 'KeyS': this.moveBackward = false; break;
        case 'KeyA': this.moveLeft = false; break;
        case 'KeyD': this.moveRight = false; break;
      }
    };

    let mouseX = 0;
    let mouseY = 0;
    let phi = 0;
    let theta = 0;

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === document.body) {
        mouseX -= event.movementX * 0.002;
        mouseY -= event.movementY * 0.002;
        
        mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY));
        
        phi = mouseX;
        theta = mouseY;
        
        this.camera.rotation.set(theta, phi, 0);
      }
    };

    const onClick = () => {
      document.body.requestPointerLock();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
  }

  update(deltaTime: number): void {
    // Handle movement
    this.direction.set(0, 0, 0);
    
    if (this.moveForward) this.direction.z -= 1;
    if (this.moveBackward) this.direction.z += 1;
    if (this.moveLeft) this.direction.x -= 1;
    if (this.moveRight) this.direction.x += 1;
    
    this.direction.normalize();
    this.direction.multiplyScalar(Player.MOVE_SPEED * deltaTime);
    
    // Apply camera rotation to movement direction
    const euler = new THREE.Euler(0, this.camera.rotation.y, 0);
    this.direction.applyEuler(euler);
    
    // Apply gravity
    this.velocity.y += Player.GRAVITY * deltaTime;
    
    // Move and handle collisions
    this.moveWithCollision(deltaTime);
    
    // Update position display
    const positionElement = document.getElementById('position');
    if (positionElement) {
      positionElement.textContent = `Position: ${Math.round(this.camera.position.x)}, ${Math.round(this.camera.position.y)}, ${Math.round(this.camera.position.z)}`;
    }
  }

  private moveWithCollision(deltaTime: number): void {
    const futurePosition = this.camera.position.clone();
    
    // Move horizontally first
    futurePosition.x += this.direction.x;
    futurePosition.z += this.direction.z;
    
    // Check horizontal collision
    if (!this.checkCollision(futurePosition)) {
      this.camera.position.x = futurePosition.x;
      this.camera.position.z = futurePosition.z;
    }
    
    // Move vertically
    futurePosition.copy(this.camera.position);
    futurePosition.y += this.velocity.y * deltaTime;
    
    // Check vertical collision
    const groundY = this.getGroundHeight(this.camera.position.x, this.camera.position.z);
    
    if (futurePosition.y - Player.PLAYER_HEIGHT <= groundY) {
      // On ground
      this.camera.position.y = groundY + Player.PLAYER_HEIGHT;
      this.velocity.y = 0;
      this.canJump = true;
    } else {
      // In air
      this.camera.position.y = futurePosition.y;
      this.canJump = false;
    }
  }

  private checkCollision(position: THREE.Vector3): boolean {
    const blockX = Math.floor(position.x);
    const blockY = Math.floor(position.y - Player.PLAYER_HEIGHT);
    const blockZ = Math.floor(position.z);
    
    // Check blocks around player
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = 0; dy <= 2; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const block = this.world.getBlock(blockX + dx, blockY + dy, blockZ + dz);
          if (block !== 0) {
            // Simple AABB collision
            const blockPos = new THREE.Vector3(blockX + dx + 0.5, blockY + dy + 0.5, blockZ + dz + 0.5);
            const distance = position.distanceTo(blockPos);
            if (distance < Player.PLAYER_RADIUS + 0.5) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private getGroundHeight(x: number, z: number): number {
    for (let y = Math.floor(this.camera.position.y); y >= 0; y--) {
      const block = this.world.getBlock(Math.floor(x), y, Math.floor(z));
      if (block !== 0) {
        return y + 1;
      }
    }
    return 0;
  }

  handleMouseClick(event: MouseEvent): void {
    if (document.pointerLockElement !== document.body) return;
    
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // Raycast through voxel grid
    const rayDirection = this.raycaster.ray.direction.clone();
    const rayOrigin = this.raycaster.ray.origin.clone();
    
    const maxDistance = 10;
    const step = 0.1;
    
    for (let t = 0; t < maxDistance; t += step) {
      const point = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(t));
      const blockX = Math.floor(point.x);
      const blockY = Math.floor(point.y);
      const blockZ = Math.floor(point.z);
      
      const block = this.world.getBlock(blockX, blockY, blockZ);
      
      if (block !== 0) {
        // Hit a block
        const normal = new THREE.Vector3();
        const blockCenter = new THREE.Vector3(blockX + 0.5, blockY + 0.5, blockZ + 0.5);
        const diff = point.clone().sub(blockCenter);
        
        // Determine which face was hit
        if (Math.abs(diff.x) > Math.abs(diff.y) && Math.abs(diff.x) > Math.abs(diff.z)) {
          normal.set(Math.sign(diff.x), 0, 0);
        } else if (Math.abs(diff.y) > Math.abs(diff.z)) {
          normal.set(0, Math.sign(diff.y), 0);
        } else {
          normal.set(0, 0, Math.sign(diff.z));
        }
        
        if (event.button === 0) {
          // Left click - break block
          this.world.setBlock(blockX, blockY, blockZ, 0);
        } else if (event.button === 2) {
          // Right click - place block
          const placeX = blockX + Math.round(normal.x);
          const placeY = blockY + Math.round(normal.y);
          const placeZ = blockZ + Math.round(normal.z);
          
          // Don't place block where player is
          const playerBlockX = Math.floor(this.camera.position.x);
          const playerBlockY = Math.floor(this.camera.position.y - Player.PLAYER_HEIGHT);
          const playerBlockZ = Math.floor(this.camera.position.z);
          
          if (!(placeX === playerBlockX && placeY >= playerBlockY && placeY <= playerBlockY + 2 && placeZ === playerBlockZ)) {
            this.world.setBlock(placeX, placeY, placeZ, 1); // Place grass block
          }
        }
        break;
      }
    }
  }
}