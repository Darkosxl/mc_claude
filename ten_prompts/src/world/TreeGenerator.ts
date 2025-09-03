import { World } from './World';
import { BlockType } from './BlockTypes';

export class TreeGenerator {
    private world: World;
    
    constructor(world: World) {
        this.world = world;
    }
    
    public generateTree(x: number, y: number, z: number): void {
        // Generate trunk (4 blocks high)
        for (let i = 0; i < 4; i++) {
            this.world.setBlock(x, y + i, z, BlockType.WOOD);
        }
        
        // Generate leaf canopy in a 5x5x3 area around the top
        const leafY = y + 4;
        const leafRadius = 2;
        
        for (let dx = -leafRadius; dx <= leafRadius; dx++) {
            for (let dz = -leafRadius; dz <= leafRadius; dz++) {
                for (let dy = 0; dy < 3; dy++) {
                    const distance = Math.sqrt(dx * dx + dz * dz + dy * dy);
                    
                    // Random leaf placement within radius
                    if (distance <= leafRadius + 0.5 && Math.random() > 0.2) {
                        // Don't replace the trunk block
                        if (!(dx === 0 && dz === 0 && dy === 0)) {
                            this.world.setBlock(x + dx, leafY + dy, z + dz, BlockType.LEAVES);
                        }
                    }
                }
            }
        }
        
        // Add a few extra leaves for natural look
        const extraLeaves = [
            [x + 1, leafY + 2, z],
            [x - 1, leafY + 2, z],
            [x, leafY + 2, z + 1],
            [x, leafY + 2, z - 1],
            [x, leafY + 3, z]
        ];
        
        for (const [lx, ly, lz] of extraLeaves) {
            if (Math.random() > 0.3) {
                this.world.setBlock(lx, ly, lz, BlockType.LEAVES);
            }
        }
    }
    
    public generateForest(centerX: number, centerZ: number, radius: number, treeCount: number): void {
        for (let i = 0; i < treeCount; i++) {
            // Random position within radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            const x = Math.floor(centerX + Math.cos(angle) * distance);
            const z = Math.floor(centerZ + Math.sin(angle) * distance);
            
            // Find ground level
            let groundY = 55;
            for (let y = 80; y >= 40; y--) {
                const blockType = this.world.getBlock(x, y, z);
                if (blockType === BlockType.GRASS || blockType === BlockType.DIRT) {
                    groundY = y + 1;
                    break;
                }
            }
            
            // Only place tree if on solid ground and not too close to village
            const distanceFromVillage = Math.sqrt(x * x + z * z);
            if (distanceFromVillage > 25) {
                this.generateTree(x, groundY, z);
            }
        }
    }
}