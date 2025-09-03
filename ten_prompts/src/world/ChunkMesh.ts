import * as THREE from 'three';
import { BlockType, isTransparent, isEmissive } from './BlockTypes';
import { Chunk, CHUNK_SIZE } from './Chunk';

export class ChunkMesh {
    public meshes: THREE.Mesh[] = [];
    
    public generateMeshes(chunk: Chunk, materials: Map<BlockType, THREE.MeshLambertMaterial>): THREE.Mesh[] {
        const geometryData = new Map<BlockType, {
            positions: number[];
            normals: number[];
            uvs: number[];
            indices: number[];
            vertexCount: number;
        }>();
        
        // Initialize geometry data for each block type
        const blockTypes = [BlockType.STONE, BlockType.DIRT, BlockType.GRASS, BlockType.WOOD, BlockType.LEAVES, BlockType.PLANKS, BlockType.COBBLESTONE, BlockType.WATER, BlockType.TORCH];
        for (const blockType of blockTypes) {
            geometryData.set(blockType, {
                positions: [],
                normals: [],
                uvs: [],
                indices: [],
                vertexCount: 0
            });
        }
        
        // Generate faces for each block
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < 128; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const blockType = chunk.getBlock(x, y, z);
                    if (blockType === BlockType.AIR) continue;
                    
                    const data = geometryData.get(blockType);
                    if (!data) continue;
                    
                    // Check each face
                    const neighbors = [
                        chunk.getBlock(x, y + 1, z), // top
                        chunk.getBlock(x, y - 1, z), // bottom
                        chunk.getBlock(x - 1, y, z), // left
                        chunk.getBlock(x + 1, y, z), // right
                        chunk.getBlock(x, y, z - 1), // front
                        chunk.getBlock(x, y, z + 1)  // back
                    ];
                    
                    for (let face = 0; face < 6; face++) {
                        if (isTransparent(neighbors[face])) {
                            this.addFace(x, y, z, face, data);
                        }
                    }
                }
            }
        }
        
        // Create meshes for each block type with data
        const meshes: THREE.Mesh[] = [];
        for (const [blockType, data] of geometryData) {
            if (data.positions.length === 0) continue;
            
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
            geometry.setIndex(data.indices);
            geometry.computeBoundingSphere();
            
            const material = materials.get(blockType);
            if (material) {
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(chunk.x * CHUNK_SIZE, 0, chunk.z * CHUNK_SIZE);
                mesh.frustumCulled = true;
                mesh.matrixAutoUpdate = false;
                mesh.updateMatrix();
                meshes.push(mesh);
            }
        }
        
        return meshes;
    }
    
    private addFace(x: number, y: number, z: number, face: number, data: any): void {
        const faceVertices = this.getFaceVertices(x, y, z, face);
        const faceNormal = this.getFaceNormal(face);
        const faceUVs = this.getFaceUVs();
        
        for (let i = 0; i < 4; i++) {
            data.positions.push(...faceVertices[i]);
            data.normals.push(...faceNormal);
            data.uvs.push(...faceUVs[i]);
        }
        
        data.indices.push(
            data.vertexCount, data.vertexCount + 1, data.vertexCount + 2,
            data.vertexCount, data.vertexCount + 2, data.vertexCount + 3
        );
        data.vertexCount += 4;
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
    
    private getFaceUVs(): number[][] {
        return [[0, 1], [1, 1], [1, 0], [0, 0]];
    }
}