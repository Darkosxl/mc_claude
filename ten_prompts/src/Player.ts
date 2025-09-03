import * as THREE from 'three';
import { World } from './world/World';
import { Input } from './Input';
import { BlockType } from './world/BlockTypes';

export class Player {
    private camera: THREE.PerspectiveCamera;
    private world: World;
    private position = new THREE.Vector3(0, 70, 0);
    private velocity = new THREE.Vector3(0, 0, 0);
    private rotation = new THREE.Euler(0, 0, 0);
    
    private speed = 150;
    private jumpPower = 12;
    private gravity = -30;
    private isOnGround = false;
    private selectedBlockType = BlockType.STONE;
    private reach = 5;
    
    constructor(camera: THREE.PerspectiveCamera, world: World) {
        this.camera = camera;
        this.world = world;
        
        this.position.set(-15, 65, 5);
        this.updateCameraPosition();
    }
    
    public update(deltaTime: number, input: Input): void {
        this.handleInput(input, deltaTime);
        this.applyPhysics(deltaTime);
        this.handleMouseLook(input);
        this.handleBlockInteraction(input);
        this.updateCameraPosition();
    }
    
    private handleInput(input: Input, deltaTime: number): void {
        const moveVector = new THREE.Vector3();
        
        if (input.isKeyPressed('KeyW')) moveVector.z -= 1;
        if (input.isKeyPressed('KeyS')) moveVector.z += 1;
        if (input.isKeyPressed('KeyA')) moveVector.x -= 1;
        if (input.isKeyPressed('KeyD')) moveVector.x += 1;
        
        if (moveVector.length() > 0) {
            moveVector.normalize();
            moveVector.multiplyScalar(this.speed * deltaTime);
            
            // Apply rotation to movement vector
            const rotationMatrix = new THREE.Matrix4().makeRotationY(this.rotation.y);
            moveVector.applyMatrix4(rotationMatrix);
            
            this.velocity.x = moveVector.x;
            this.velocity.z = moveVector.z;
        } else {
            this.velocity.x *= 0.9; // Friction
            this.velocity.z *= 0.9;
        }
        
        if (input.isKeyPressed('Space') && this.isOnGround) {
            this.velocity.y = this.jumpPower;
            this.isOnGround = false;
        }
    }
    
    private applyPhysics(deltaTime: number): void {
        this.velocity.y += this.gravity * deltaTime;
        
        // Apply movement step by step to avoid getting stuck
        const moveStep = this.velocity.clone().multiplyScalar(deltaTime);
        
        // Move horizontally first (X and Z)
        this.position.x += moveStep.x;
        this.position.z += moveStep.z;
        
        // Simple ground detection - find ground level below player
        this.isOnGround = false;
        for (let y = Math.floor(this.position.y); y >= Math.floor(this.position.y) - 3; y--) {
            const groundBlock = this.world.getBlock(Math.floor(this.position.x), y, Math.floor(this.position.z));
            if (groundBlock !== BlockType.AIR && groundBlock !== BlockType.WATER) {
                const groundLevel = y + 1;
                if (this.position.y <= groundLevel + 0.1) {
                    this.position.y = groundLevel;
                    this.velocity.y = 0;
                    this.isOnGround = true;
                }
                break;
            }
        }
        
        // Apply vertical movement if not on ground
        if (!this.isOnGround) {
            this.position.y += moveStep.y;
        }
        
        // Prevent falling through world
        if (this.position.y < 0) {
            this.position.y = 60;
        }
    }
    
    private handleMouseLook(input: Input): void {
        if (!input.isPointerLock()) return;
        
        const mouseDelta = input.getMouseDelta();
        const sensitivity = 0.002;
        
        this.rotation.y -= mouseDelta.x * sensitivity;
        this.rotation.x += mouseDelta.y * sensitivity; // Fixed: removed negative to fix inversion
        
        // Clamp vertical rotation to prevent camera flipping
        this.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.rotation.x));
    }
    
    private handleBlockInteraction(input: Input): void {
        if (!input.isPointerLock()) return;
        
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(this.camera.rotation);
        
        const raycast = this.world.raycast(this.camera.position, direction, this.reach);
        
        if (raycast.hit && raycast.position && raycast.normal) {
            if (input.isMousePressed(0)) { // Left click - mine
                this.world.setBlock(raycast.position.x, raycast.position.y, raycast.position.z, BlockType.AIR);
            } else if (input.isMousePressed(2)) { // Right click - place
                const placePos = raycast.position.clone().add(raycast.normal);
                
                // Don't place block inside player
                const playerAABB = {
                    min: new THREE.Vector3(this.position.x - 0.3, this.position.y - 1.8, this.position.z - 0.3),
                    max: new THREE.Vector3(this.position.x + 0.3, this.position.y, this.position.z + 0.3)
                };
                
                if (placePos.x < playerAABB.min.x || placePos.x > playerAABB.max.x ||
                    placePos.y < playerAABB.min.y || placePos.y > playerAABB.max.y ||
                    placePos.z < playerAABB.min.z || placePos.z > playerAABB.max.z) {
                    this.world.setBlock(placePos.x, placePos.y, placePos.z, this.selectedBlockType);
                }
            }
        }
    }
    
    private updateCameraPosition(): void {
        this.camera.position.copy(this.position);
        // Apply rotations in the correct order to prevent gimbal lock
        this.camera.rotation.set(this.rotation.x, this.rotation.y, 0, 'YXZ');
    }
    
    public setSelectedBlockType(blockType: BlockType): void {
        this.selectedBlockType = blockType;
    }
    
    public getPosition(): THREE.Vector3 {
        return this.position.clone();
    }
}