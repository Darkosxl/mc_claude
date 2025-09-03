import { World } from './World';
import { BlockType } from './BlockTypes';

export class VillageGenerator {
    private world: World;
    
    constructor(world: World) {
        this.world = world;
    }
    
    public generateVillage(centerX: number, centerZ: number): void {
        // Find the ground level at village center
        let groundLevel = 45;
        for (let y = 60; y >= 40; y--) {
            const blockType = this.world.getBlock(centerX, y, centerZ);
            if (blockType !== BlockType.AIR && blockType !== BlockType.WATER) {
                groundLevel = y + 1;
                break;
            }
        }
        
        // Generate structures at ground level
        this.generateHouse(centerX - 10, centerZ - 5, groundLevel);
        this.generateFarm(centerX + 5, centerZ - 8, groundLevel);
        this.generateWatchtower(centerX, centerZ + 10, groundLevel);
        
        // Add path connecting structures
        this.generatePath(centerX - 10, centerZ - 5, centerX + 5, centerZ - 8, groundLevel);
        this.generatePath(centerX - 10, centerZ - 5, centerX, centerZ + 10, groundLevel);
    }
    
    private flattenArea(x: number, z: number, width: number, depth: number, height: number): void {
        for (let dx = 0; dx < width; dx++) {
            for (let dz = 0; dz < depth; dz++) {
                for (let y = height - 2; y <= height + 10; y++) {
                    if (y === height) {
                        this.world.setBlock(x + dx, y, z + dz, BlockType.GRASS);
                    } else if (y < height) {
                        this.world.setBlock(x + dx, y, z + dz, BlockType.DIRT);
                    } else {
                        this.world.setBlock(x + dx, y, z + dz, BlockType.AIR);
                    }
                }
            }
        }
    }
    
    private generateHouse(x: number, z: number): void {
        const height = 55;
        
        // House foundation and walls (6x8)
        for (let dx = 0; dx < 6; dx++) {
            for (let dz = 0; dz < 8; dz++) {
                // Foundation
                this.world.setBlock(x + dx, height, z + dz, BlockType.COBBLESTONE);
                
                // Walls
                if (dx === 0 || dx === 5 || dz === 0 || dz === 7) {
                    this.world.setBlock(x + dx, height + 1, z + dz, BlockType.COBBLESTONE);
                    this.world.setBlock(x + dx, height + 2, z + dz, BlockType.COBBLESTONE);
                    this.world.setBlock(x + dx, height + 3, z + dz, BlockType.COBBLESTONE);
                }
            }
        }
        
        // Door (remove blocks for entrance)
        this.world.setBlock(x + 2, height + 1, z, BlockType.AIR);
        this.world.setBlock(x + 2, height + 2, z, BlockType.AIR);
        
        // Windows
        this.world.setBlock(x, height + 2, z + 3, BlockType.AIR);
        this.world.setBlock(x + 5, height + 2, z + 4, BlockType.AIR);
        
        // Roof (wood planks)
        for (let dx = -1; dx <= 6; dx++) {
            for (let dz = -1; dz <= 8; dz++) {
                this.world.setBlock(x + dx, height + 4, z + dz, BlockType.PLANKS);
            }
        }
        
        // Interior furnishing
        this.world.setBlock(x + 1, height + 1, z + 6, BlockType.PLANKS); // Table
        this.world.setBlock(x + 4, height + 1, z + 6, BlockType.PLANKS); // Chest
        
        // Torch outside
        this.world.setBlock(x - 1, height + 3, z + 2, BlockType.TORCH);
    }
    
    private generateFarm(x: number, z: number): void {
        const height = 55;
        
        // Farm area (8x6)
        for (let dx = 0; dx < 8; dx++) {
            for (let dz = 0; dz < 6; dz++) {
                this.world.setBlock(x + dx, height, z + dz, BlockType.DIRT);
                
                // Plant crops in checkerboard pattern
                if ((dx + dz) % 2 === 0) {
                    this.world.setBlock(x + dx, height + 1, z + dz, BlockType.WHEAT);
                }
            }
        }
        
        // Farm fence
        for (let dx = -1; dx <= 8; dx++) {
            this.world.setBlock(x + dx, height + 1, z - 1, BlockType.PLANKS);
            this.world.setBlock(x + dx, height + 1, z + 6, BlockType.PLANKS);
        }
        for (let dz = -1; dz <= 6; dz++) {
            this.world.setBlock(x - 1, height + 1, z + dz, BlockType.PLANKS);
            this.world.setBlock(x + 8, height + 1, z + dz, BlockType.PLANKS);
        }
        
        // Water source in center
        this.world.setBlock(x + 3, height, z + 2, BlockType.WATER);
        this.world.setBlock(x + 4, height, z + 2, BlockType.WATER);
        this.world.setBlock(x + 3, height, z + 3, BlockType.WATER);
        this.world.setBlock(x + 4, height, z + 3, BlockType.WATER);
    }
    
    private generateWatchtower(x: number, z: number): void {
        const height = 55;
        const towerHeight = 16;
        
        // Tower base (3x3)
        for (let dx = 0; dx < 3; dx++) {
            for (let dz = 0; dz < 3; dz++) {
                for (let dy = 0; dy < towerHeight; dy++) {
                    if (dx === 1 && dz === 1 && dy > 0 && dy < towerHeight - 1) {
                        // Hollow interior (ladder space)
                        this.world.setBlock(x + dx, height + dy, z + dz, BlockType.AIR);
                    } else if (dx === 0 || dx === 2 || dz === 0 || dz === 2 || dy === 0) {
                        // Walls and foundation
                        this.world.setBlock(x + dx, height + dy, z + dz, BlockType.STONE);
                    }
                }
            }
        }
        
        // Top platform (5x5)
        for (let dx = -1; dx <= 3; dx++) {
            for (let dz = -1; dz <= 3; dz++) {
                this.world.setBlock(x + dx, height + towerHeight, z + dz, BlockType.PLANKS);
            }
        }
        
        // Battlements
        for (let dx = -1; dx <= 3; dx++) {
            for (let dz = -1; dz <= 3; dz++) {
                if ((dx === -1 || dx === 3 || dz === -1 || dz === 3) && 
                    (dx + dz) % 2 === 0) {
                    this.world.setBlock(x + dx, height + towerHeight + 1, z + dz, BlockType.STONE);
                }
            }
        }
        
        // Torches on top
        this.world.setBlock(x - 1, height + towerHeight + 2, z + 1, BlockType.TORCH);
        this.world.setBlock(x + 3, height + towerHeight + 2, z + 1, BlockType.TORCH);
        this.world.setBlock(x + 1, height + towerHeight + 2, z - 1, BlockType.TORCH);
        this.world.setBlock(x + 1, height + towerHeight + 2, z + 3, BlockType.TORCH);
        
        // Entry door
        this.world.setBlock(x + 1, height + 1, z, BlockType.AIR);
    }
    
    private generatePath(x1: number, z1: number, x2: number, z2: number): void {
        const height = 55;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const steps = Math.max(Math.abs(dx), Math.abs(dz));
        
        for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 0 : i / steps;
            const x = Math.round(x1 + dx * t);
            const z = Math.round(z1 + dz * t);
            
            this.world.setBlock(x, height + 1, z, BlockType.COBBLESTONE);
        }
    }
}