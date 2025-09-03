import * as THREE from 'three';
import { BlockType, isTransparent } from './BlockTypes';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64; // Reduced for performance

export class OptimizedChunk {
    public x: number;
    public z: number;
    public blocks: Uint8Array;
    public mesh: THREE.Mesh | null = null;
    public needsUpdate = false;
    private material: THREE.MeshLambertMaterial;
    
    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
        this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        
        // Single optimized material
        this.material = new THREE.MeshLambertMaterial({ 
            vertexColors: true,
            transparent: false
        });
    }
    
    public getBlock(x: number, y: number, z: number): BlockType {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return BlockType.AIR;
        }
        return this.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE];
    }
    
    public setBlock(x: number, y: number, z: number, blockType: BlockType): void {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return;
        }
        this.blocks[x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE] = blockType;
        this.needsUpdate = true;
    }
    
    public generateOptimizedMesh(): THREE.BufferGeometry | null {
        const positions: number[] = [];
        const normals: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];
        
        let vertexCount = 0;
        
        // Pre-calculated colors for performance
        const blockColors = {
            [BlockType.STONE]: new THREE.Color(0x888888),
            [BlockType.DIRT]: new THREE.Color(0x8B4513),
            [BlockType.GRASS]: new THREE.Color(0x228B22),
            [BlockType.WOOD]: new THREE.Color(0x8B4513),
            [BlockType.LEAVES]: new THREE.Color(0x32CD32),
            [BlockType.SAND]: new THREE.Color(0xF4A460),
            [BlockType.WATER]: new THREE.Color(0x4682B4),
            [BlockType.TORCH]: new THREE.Color(0xFFFF00)
        };
        
        // Optimized face culling
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const blockType = this.getBlock(x, y, z);
                    if (blockType === BlockType.AIR) continue;
                    
                    const color = blockColors[blockType] || blockColors[BlockType.STONE];
                    
                    // Check all 6 faces with optimized neighbor checking
                    const neighbors = [
                        this.getBlock(x, y + 1, z), // top
                        this.getBlock(x, y - 1, z), // bottom
                        this.getBlock(x - 1, y, z), // left
                        this.getBlock(x + 1, y, z), // right
                        this.getBlock(x, y, z - 1), // front
                        this.getBlock(x, y, z + 1)  // back
                    ];
                    
                    for (let face = 0; face < 6; face++) {
                        if (isTransparent(neighbors[face])) {
                            this.addOptimizedFace(x, y, z, face, color, positions, normals, colors, indices, vertexCount);
                            vertexCount += 4;
                        }
                    }
                }
            }
        }
        
        if (positions.length === 0) return null;
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        
        return geometry;
    }
    
    private addOptimizedFace(x: number, y: number, z: number, face: number, color: THREE.Color, 
                            positions: number[], normals: number[], colors: number[], indices: number[], vertexCount: number): void {
        
        // Pre-calculated face vertices for performance
        const faceData = [
            // top
            { vertices: [[x, y+1, z], [x+1, y+1, z], [x+1, y+1, z+1], [x, y+1, z+1]], normal: [0, 1, 0] },
            // bottom
            { vertices: [[x, y, z+1], [x+1, y, z+1], [x+1, y, z], [x, y, z]], normal: [0, -1, 0] },
            // left
            { vertices: [[x, y, z], [x, y+1, z], [x, y+1, z+1], [x, y, z+1]], normal: [-1, 0, 0] },
            // right
            { vertices: [[x+1, y, z+1], [x+1, y+1, z+1], [x+1, y+1, z], [x+1, y, z]], normal: [1, 0, 0] },
            // front
            { vertices: [[x, y, z], [x+1, y, z], [x+1, y+1, z], [x, y+1, z]], normal: [0, 0, -1] },
            // back
            { vertices: [[x+1, y, z+1], [x, y, z+1], [x, y+1, z+1], [x+1, y+1, z+1]], normal: [0, 0, 1] }
        ];
        
        const data = faceData[face];
        
        // Add vertices
        for (const vertex of data.vertices) {
            positions.push(vertex[0], vertex[1], vertex[2]);
            normals.push(data.normal[0], data.normal[1], data.normal[2]);
            colors.push(color.r, color.g, color.b);
        }
        
        // Add indices for two triangles
        indices.push(
            vertexCount, vertexCount + 1, vertexCount + 2,
            vertexCount, vertexCount + 2, vertexCount + 3
        );
    }
    
    public getMaterial(): THREE.MeshLambertMaterial {
        return this.material;
    }
}