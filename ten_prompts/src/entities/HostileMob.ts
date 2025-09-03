import * as THREE from 'three';
import { World } from '../world/World';
import { BlockType } from '../world/BlockTypes';

export class HostileMob {
    public position: THREE.Vector3;
    public mesh: THREE.Mesh;
    private world: World;
    private speed = 4;
    private health = 20;
    private attackRange = 1.5;
    private detectionRange = 30;
    private attackCooldown = 0;
    private target: THREE.Vector3 | null = null;
    private hasLineOfSight = false;
    
    constructor(x: number, y: number, z: number, world: World) {
        this.position = new THREE.Vector3(x, y, z);
        this.world = world;
        this.createMesh();
    }
    
    private createMesh(): void {
        // Optimized hostile mob mesh
        const geometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x2F4F2F,
            emissive: 0x440000,
            emissiveIntensity: 0.2
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Add glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 0.3, -0.4);
        this.mesh.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 0.3, -0.4);
        this.mesh.add(rightEye);
    }
    
    public update(deltaTime: number, playerPosition: THREE.Vector3): boolean {
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        const distanceToPlayer = this.position.distanceTo(playerPosition);
        
        // Detection and line of sight check
        if (distanceToPlayer <= this.detectionRange) {
            this.hasLineOfSight = this.checkLineOfSight(playerPosition);
            
            if (this.hasLineOfSight) {
                this.target = playerPosition.clone();
                
                // Move towards player
                if (distanceToPlayer > this.attackRange) {
                    this.moveTowardsTarget(deltaTime);
                }
                
                // Attack if in range
                if (distanceToPlayer <= this.attackRange && this.attackCooldown <= 0) {
                    this.attackPlayer();
                    this.attackCooldown = 1.5;
                }
            }
        } else {
            this.target = null;
            this.hasLineOfSight = false;
        }
        
        // Apply gravity
        this.applyGravity(deltaTime);
        
        this.mesh.position.copy(this.position);
        return this.health > 0;
    }
    
    private checkLineOfSight(playerPosition: THREE.Vector3): boolean {
        const direction = playerPosition.clone().sub(this.position).normalize();
        const distance = this.position.distanceTo(playerPosition);
        
        // Simple raycast check - sample a few points along the line
        for (let i = 1; i < distance; i += 2) {
            const checkPos = this.position.clone().add(direction.clone().multiplyScalar(i));
            const blockType = this.world.getBlock(Math.floor(checkPos.x), Math.floor(checkPos.y + 0.5), Math.floor(checkPos.z));
            
            if (blockType !== BlockType.AIR && blockType !== BlockType.WATER) {
                return false;
            }
        }
        
        return true;
    }
    
    private moveTowardsTarget(deltaTime: number): void {
        if (!this.target) return;
        
        const direction = this.target.clone().sub(this.position).normalize();
        const moveDistance = this.speed * deltaTime;
        
        // Move horizontally
        const newPos = this.position.clone();
        newPos.x += direction.x * moveDistance;
        newPos.z += direction.z * moveDistance;
        
        // Simple collision check
        const blockType = this.world.getBlock(Math.floor(newPos.x), Math.floor(newPos.y), Math.floor(newPos.z));
        if (blockType === BlockType.AIR || blockType === BlockType.WATER) {
            this.position.x = newPos.x;
            this.position.z = newPos.z;
        }
    }
    
    private applyGravity(deltaTime: number): void {
        // Find ground
        for (let y = Math.floor(this.position.y); y >= Math.floor(this.position.y) - 3; y--) {
            const blockType = this.world.getBlock(Math.floor(this.position.x), y, Math.floor(this.position.z));
            if (blockType !== BlockType.AIR && blockType !== BlockType.WATER) {
                this.position.y = y + 1.8;
                return;
            }
        }
        
        // Fall if no ground
        this.position.y -= 20 * deltaTime;
    }
    
    private attackPlayer(): void {
        // Dispatch attack event
        const event = new CustomEvent('hostileAttack', {
            detail: { damage: 3, position: this.position.clone() }
        });
        document.dispatchEvent(event);
        
        // Visual attack effect
        this.mesh.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => {
            this.mesh.scale.set(1, 1, 1);
        }, 200);
    }
    
    public takeDamage(damage: number): void {
        this.health -= damage;
        
        // Flash red when damaged
        const material = this.mesh.material as THREE.MeshLambertMaterial;
        const originalColor = material.color.clone();
        material.color.set(0xff0000);
        
        setTimeout(() => {
            material.color.copy(originalColor);
        }, 100);
    }
    
    public isDead(): boolean {
        return this.health <= 0;
    }
}