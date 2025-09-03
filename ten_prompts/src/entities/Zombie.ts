import * as THREE from 'three';
import { World } from '../world/World';
import { BlockType } from '../world/BlockTypes';

export class Zombie {
    public position: THREE.Vector3;
    public mesh: THREE.Mesh;
    private world: World;
    private target: THREE.Vector3 | null = null;
    private speed = 3;
    private health = 20;
    private attackRange = 2;
    private attackCooldown = 0;
    
    constructor(x: number, y: number, z: number, world: World) {
        this.position = new THREE.Vector3(x, y, z);
        this.world = world;
        
        this.createMesh();
    }
    
    private createMesh(): void {
        // Simple zombie mesh (dark green box)
        const geometry = new THREE.BoxGeometry(0.8, 1.8, 0.4);
        const material = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
    }
    
    public update(deltaTime: number, playerPosition: THREE.Vector3): boolean {
        this.attackCooldown -= deltaTime;
        
        // Move towards player
        this.target = playerPosition.clone();
        const direction = this.target.sub(this.position).normalize();
        
        // Simple ground following movement
        const moveDistance = this.speed * deltaTime;
        const newPos = this.position.clone();
        newPos.x += direction.x * moveDistance;
        newPos.z += direction.z * moveDistance;
        
        // Find ground level
        const groundY = this.getGroundHeight(newPos.x, newPos.z);
        newPos.y = groundY + 0.9;
        
        // Check if movement is blocked
        if (!this.isBlocked(newPos.x, newPos.y, newPos.z)) {
            this.position.copy(newPos);
        }
        
        this.mesh.position.copy(this.position);
        
        // Attack player if in range
        const distanceToPlayer = this.position.distanceTo(playerPosition);
        if (distanceToPlayer <= this.attackRange && this.attackCooldown <= 0) {
            this.attackPlayer();
            this.attackCooldown = 1.0; // 1 second cooldown
        }
        
        return this.health > 0;
    }
    
    private getGroundHeight(x: number, z: number): number {
        for (let y = 80; y >= 20; y--) {
            const blockType = this.world.getBlock(Math.floor(x), y, Math.floor(z));
            if (blockType !== BlockType.AIR && blockType !== BlockType.WATER) {
                return y + 1;
            }
        }
        return 55;
    }
    
    private isBlocked(x: number, y: number, z: number): boolean {
        const blockType = this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        return blockType !== BlockType.AIR && blockType !== BlockType.WATER;
    }
    
    private attackPlayer(): void {
        // Dispatch attack event
        const event = new CustomEvent('zombieAttack', {
            detail: { damage: 2, zombiePosition: this.position.clone() }
        });
        document.dispatchEvent(event);
    }
    
    public takeDamage(damage: number): void {
        this.health -= damage;
    }
    
    public isDead(): boolean {
        return this.health <= 0;
    }
}