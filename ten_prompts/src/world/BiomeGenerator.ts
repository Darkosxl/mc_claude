import { createNoise2D } from 'simplex-noise';
import { BlockType } from './BlockTypes';

export enum BiomeType {
    PLAINS = 'plains',
    MOUNTAINS = 'mountains',
    DESERT = 'desert'
}

export interface TerrainData {
    height: number;
    biome: BiomeType;
    surfaceBlock: BlockType;
    hasGrass: boolean;
}

export class BiomeGenerator {
    private heightNoise = createNoise2D();
    private biomeNoise = createNoise2D();
    private detailNoise = createNoise2D();
    
    public generateTerrain(worldX: number, worldZ: number): TerrainData {
        // Determine biome using two noise layers
        const biomeValue = this.biomeNoise(worldX * 0.005, worldZ * 0.005);
        const biomeValue2 = this.detailNoise(worldX * 0.003, worldZ * 0.003);
        
        let biome: BiomeType;
        if (biomeValue > 0.3) {
            biome = BiomeType.MOUNTAINS;
        } else if (biomeValue2 > 0.2) {
            biome = BiomeType.DESERT;
        } else {
            biome = BiomeType.PLAINS;
        }
        
        let height: number;
        let surfaceBlock: BlockType;
        let hasGrass = false;
        
        if (biome === BiomeType.PLAINS) {
            // Flat plains with gentle rolling hills
            height = 45 + this.heightNoise(worldX * 0.01, worldZ * 0.01) * 8;
            height += this.detailNoise(worldX * 0.05, worldZ * 0.05) * 3;
            
            surfaceBlock = BlockType.GRASS;
            hasGrass = Math.random() > 0.7; // 30% chance for grass decoration
            
        } else if (biome === BiomeType.DESERT) {
            // Flat desert with small dunes
            height = 42 + this.heightNoise(worldX * 0.02, worldZ * 0.02) * 6;
            height += this.detailNoise(worldX * 0.08, worldZ * 0.08) * 4;
            
            surfaceBlock = BlockType.SAND;
            hasGrass = false;
            
        } else {
            // Mountainous terrain
            height = 35 + this.heightNoise(worldX * 0.02, worldZ * 0.02) * 25;
            height += this.detailNoise(worldX * 0.1, worldZ * 0.1) * 8;
            
            // More dirt near peaks, stone lower down
            if (height > 55) {
                surfaceBlock = BlockType.DIRT;
            } else {
                surfaceBlock = BlockType.STONE;
            }
        }
        
        return {
            height: Math.floor(height),
            biome,
            surfaceBlock,
            hasGrass
        };
    }
    
    public shouldPlaceWater(worldX: number, worldZ: number, height: number): boolean {
        // Only place water in mountain biomes in low areas
        const biomeValue = this.biomeNoise(worldX * 0.005, worldZ * 0.005);
        const isMountainous = biomeValue > 0;
        
        return isMountainous && height < 40;
    }
}