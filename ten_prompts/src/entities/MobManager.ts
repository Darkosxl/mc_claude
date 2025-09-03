import * as THREE from 'three';
import { World } from '../world/World';
import { BlockType } from '../world/BlockTypes';
import { Zombie } from './Zombie';

class Mob {
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public mesh: THREE.Mesh;
    private direction: THREE.Vector3;
    private moveTimer = 0;
    private changeDirectionTime = 3;
    private speed = 2;
    private world: World;
    
    constructor(x: number, y: number, z: number, color: number, world: World) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2
        ).normalize();
        this.world = world;
        
        // Create mob mesh (simple cube for now)
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const material = new THREE.MeshLambertMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
    }
    
    public update(deltaTime: number, allMobs: Mob[]): void {
        this.moveTimer += deltaTime;
        
        // Change direction periodically
        if (this.moveTimer >= this.changeDirectionTime) {
            this.direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                0,
                (Math.random() - 0.5) * 2
            ).normalize();
            this.moveTimer = 0;
            this.changeDirectionTime = 2 + Math.random() * 4;
        }
        
        // Apply separation from other mobs
        const separationForce = this.getSeparationForce(allMobs);
        this.direction.add(separationForce).normalize();
        
        // Move
        this.velocity.copy(this.direction).multiplyScalar(this.speed * deltaTime);
        
        // Simple gravity and ground detection
        this.velocity.y = -10 * deltaTime;
        
        const newPos = this.position.clone().add(this.velocity);
        
        // Check ground collision
        const groundY = this.getGroundHeight(newPos.x, newPos.z);
        if (newPos.y <= groundY + 0.4) {
            newPos.y = groundY + 0.4;
            this.velocity.y = 0;
        }
        
        // Check horizontal collisions
        if (this.isBlocked(newPos.x, newPos.y, newPos.z)) {
            // Change direction if blocked
            this.direction.multiplyScalar(-1);
            this.moveTimer = this.changeDirectionTime; // Force direction change
        } else {
            this.position.copy(newPos);
        }
        
        this.mesh.position.copy(this.position);
    }
    
    private getSeparationForce(allMobs: Mob[]): THREE.Vector3 {
        const separationForce = new THREE.Vector3();
        const separationRadius = 2;
        
        for (const other of allMobs) {
            if (other === this) continue;
            
            const distance = this.position.distanceTo(other.position);
            if (distance < separationRadius && distance > 0) {
                const pushAway = this.position.clone().sub(other.position);
                pushAway.normalize().multiplyScalar((separationRadius - distance) / separationRadius);
                separationForce.add(pushAway);
            }
        }
        
        return separationForce.multiplyScalar(0.5);
    }
    
    private getGroundHeight(x: number, z: number): number {
        for (let y = 80; y >= 20; y--) {
            const blockType = this.world.getBlock(Math.floor(x), y, Math.floor(z));
            if (blockType !== BlockType.AIR && blockType !== BlockType.WATER) {
                return y + 1;
            }
        }
        return 55; // Default ground level
    }
    
    private isBlocked(x: number, y: number, z: number): boolean {
        const blockType = this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        return blockType !== BlockType.AIR && blockType !== BlockType.WATER;
    }
}

export class MobManager {
    private scene: THREE.Scene;
    private world: World;
    private mobs: Mob[] = [];
    private zombies: Zombie[] = [];
    private playerPosition = new THREE.Vector3();
    
    constructor(scene: THREE.Scene, world: World) {
        this.scene = scene;
        this.world = world;
    }
    
    public spawnMobs(): void {
        const mobColors = [0xFFFFFF, 0xFFFF00, 0xFF69B4, 0x32CD32, 0xFF4500]; // White sheep, yellow chicken, pink pig, green, orange
        
        for (let i = 0; i < 5; i++) {
            // Spawn near village but not too close to structures
            const x = -5 + Math.random() * 25;
            const z = -5 + Math.random() * 25;
            const y = 60; // Will fall to ground
            
            const mob = new Mob(x, y, z, mobColors[i], this.world);
            this.mobs.push(mob);
            this.scene.add(mob.mesh);
        }
    }
    
    public update(deltaTime: number, playerPos?: THREE.Vector3): void {
        if (playerPos) {
            this.playerPosition.copy(playerPos);
        }
        
        for (const mob of this.mobs) {
            mob.update(deltaTime, this.mobs);
        }
        
        // Update zombies
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            const isAlive = zombie.update(deltaTime, this.playerPosition);
            
            if (!isAlive) {
                this.scene.remove(zombie.mesh);
                this.zombies.splice(i, 1);
            }
        }
    }
    
    public spawnZombies(count: number): void {
        for (let i = 0; i < count; i++) {
            // Spawn zombies around player but not too close
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            
            const x = this.playerPosition.x + Math.cos(angle) * distance;
            const z = this.playerPosition.z + Math.sin(angle) * distance;
            const y = 60; // Will fall to ground
            
            const zombie = new Zombie(x, y, z, this.world);
            this.zombies.push(zombie);
            this.scene.add(zombie.mesh);
        }
    }
    
    public clearZombies(): void {
        for (const zombie of this.zombies) {
            this.scene.remove(zombie.mesh);
        }
        this.zombies = [];
    }
    
    public getZombieCount(): number {
        return this.zombies.length;
    }
}