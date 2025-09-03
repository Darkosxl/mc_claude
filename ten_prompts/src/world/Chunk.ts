import * as THREE from 'three';
import { BlockType, BLOCK_COLORS, isTransparent, isEmissive } from './BlockTypes';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

export class Chunk {
    public x: number;
    public z: number;
    public blocks: Uint8Array;
    public mesh: THREE.Mesh | null = null;
    public needsUpdate = true;
    
    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
        this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
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
    
    public generateMesh(): THREE.BufferGeometry | null {
        const positions: number[] = [];
        const normals: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];
        
        let vertexCount = 0;
        
        const addFace = (x: number, y: number, z: number, direction: number, blockType: BlockType) => {
            const color = new THREE.Color(BLOCK_COLORS[blockType] || 0x888888);
            
            if (isEmissive(blockType)) {
                color.multiplyScalar(2);
            }
            
            const faceVertices = this.getFaceVertices(x, y, z, direction);
            const faceNormal = this.getFaceNormal(direction);
            
            for (let i = 0; i < 4; i++) {
                positions.push(...faceVertices[i]);
                normals.push(...faceNormal);
                colors.push(color.r, color.g, color.b);
            }
            
            indices.push(
                vertexCount, vertexCount + 1, vertexCount + 2,
                vertexCount, vertexCount + 2, vertexCount + 3
            );
            vertexCount += 4;
        };
        
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const blockType = this.getBlock(x, y, z);
                    if (blockType === BlockType.AIR) continue;
                    
                    // Check each face
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
                            addFace(x, y, z, face, blockType);
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
        geometry.computeBoundingSphere();
        
        return geometry;
    }
    
    private getFaceVertices(x: number, y: number, z: number, face: number): number[][] {
        const vertices = [
            // top
            [[x, y+1, z], [x+1, y+1, z], [x+1, y+1, z+1], [x, y+1, z+1]],
            // bottom
            [[x, y, z+1], [x+1, y, z+1], [x+1, y, z], [x, y, z]],
            // left
            [[x, y, z], [x, y+1, z], [x, y+1, z+1], [x, y, z+1]],
            // right
            [[x+1, y, z+1], [x+1, y+1, z+1], [x+1, y+1, z], [x+1, y, z]],
            // front
            [[x, y, z], [x+1, y, z], [x+1, y+1, z], [x, y+1, z]],
            // back
            [[x+1, y, z+1], [x, y, z+1], [x, y+1, z+1], [x+1, y+1, z+1]]
        ];
        
        return vertices[face];
    }
    
    private getFaceNormal(face: number): number[] {
        const normals = [
            [0, 1, 0],  // top
            [0, -1, 0], // bottom
            [-1, 0, 0], // left
            [1, 0, 0],  // right
            [0, 0, -1], // front
            [0, 0, 1]   // back
        ];
        
        return normals[face];
    }
}