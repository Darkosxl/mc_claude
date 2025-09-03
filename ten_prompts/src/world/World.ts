import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk';
import { BlockType } from './BlockTypes';

export class World {
    private scene: THREE.Scene;
    private chunks = new Map<string, Chunk>();
    private chunkMaterial: THREE.MeshLambertMaterial;
    private noise2D = createNoise2D();
    private renderDistance = 4;
    private torchLights: THREE.PointLight[] = [];
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.chunkMaterial = new THREE.MeshLambertMaterial({
            vertexColors: true,
            transparent: false
        });
        
        this.generateInitialChunks();
    }
    
    private generateInitialChunks(): void {
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.generateChunk(x, z);
            }
        }
    }
    
    private generateChunk(chunkX: number, chunkZ: number): Chunk {
        const chunk = new Chunk(chunkX, chunkZ);
        const key = `${chunkX},${chunkZ}`;
        
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const worldX = chunkX * CHUNK_SIZE + x;
                const worldZ = chunkZ * CHUNK_SIZE + z;
                
                const height = Math.floor(30 + this.noise2D(worldX * 0.02, worldZ * 0.02) * 20);
                const grassHeight = height + Math.floor(this.noise2D(worldX * 0.1, worldZ * 0.1) * 3);
                
                for (let y = 0; y < CHUNK_HEIGHT; y++) {
                    let blockType = BlockType.AIR;
                    
                    if (y < height - 5) {
                        blockType = BlockType.STONE;
                    } else if (y < height) {
                        blockType = BlockType.DIRT;
                    } else if (y === height && y < grassHeight) {
                        blockType = BlockType.GRASS;
                    } else if (y < 25) {
                        blockType = BlockType.WATER;
                    }
                    
                    chunk.setBlock(x, y, z, blockType);
                }
            }
        }
        
        this.chunks.set(key, chunk);
        return chunk;
    }
    
    public getBlock(x: number, y: number, z: number): BlockType {
        if (y < 0 || y >= CHUNK_HEIGHT) return BlockType.AIR;
        
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        const chunk = this.chunks.get(`${chunkX},${chunkZ}`);
        
        if (!chunk) return BlockType.AIR;
        
        const localX = x - chunkX * CHUNK_SIZE;
        const localZ = z - chunkZ * CHUNK_SIZE;
        
        return chunk.getBlock(localX, y, localZ);
    }
    
    public setBlock(x: number, y: number, z: number, blockType: BlockType): void {
        if (y < 0 || y >= CHUNK_HEIGHT) return;
        
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        const chunk = this.chunks.get(`${chunkX},${chunkZ}`);
        
        if (!chunk) return;
        
        const localX = x - chunkX * CHUNK_SIZE;
        const localZ = z - chunkZ * CHUNK_SIZE;
        
        chunk.setBlock(localX, y, localZ, blockType);
        
        // Mark neighboring chunks for update if on edge
        if (localX === 0) this.markChunkForUpdate(chunkX - 1, chunkZ);
        if (localX === CHUNK_SIZE - 1) this.markChunkForUpdate(chunkX + 1, chunkZ);
        if (localZ === 0) this.markChunkForUpdate(chunkX, chunkZ - 1);
        if (localZ === CHUNK_SIZE - 1) this.markChunkForUpdate(chunkX, chunkZ + 1);
    }
    
    private markChunkForUpdate(chunkX: number, chunkZ: number): void {
        const chunk = this.chunks.get(`${chunkX},${chunkZ}`);
        if (chunk) {
            chunk.needsUpdate = true;
        }
    }
    
    public update(): void {
        for (const chunk of this.chunks.values()) {
            if (chunk.needsUpdate) {
                this.rebuildChunkMesh(chunk);
                chunk.needsUpdate = false;
            }
        }
    }
    
    private rebuildChunkMesh(chunk: Chunk): void {
        if (chunk.mesh) {
            this.scene.remove(chunk.mesh);
            chunk.mesh.geometry.dispose();
        }
        
        const geometry = chunk.generateMesh();
        if (geometry) {
            chunk.mesh = new THREE.Mesh(geometry, this.chunkMaterial);
            chunk.mesh.position.set(chunk.x * CHUNK_SIZE, 0, chunk.z * CHUNK_SIZE);
            chunk.mesh.frustumCulled = true;
            chunk.mesh.matrixAutoUpdate = false;
            chunk.mesh.updateMatrix();
            this.scene.add(chunk.mesh);
        }
    }
    
    public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number): {
        hit: boolean;
        position?: THREE.Vector3;
        normal?: THREE.Vector3;
        blockType?: BlockType;
    } {
        const step = 0.1;
        const position = origin.clone();
        const dir = direction.clone().normalize().multiplyScalar(step);
        
        for (let distance = 0; distance < maxDistance; distance += step) {
            position.add(dir);
            
            const x = Math.floor(position.x);
            const y = Math.floor(position.y);
            const z = Math.floor(position.z);
            
            const blockType = this.getBlock(x, y, z);
            if (blockType !== BlockType.AIR && blockType !== BlockType.WATER) {
                // Calculate normal by checking which face was hit
                const prevPos = position.clone().sub(dir);
                const normal = new THREE.Vector3();
                
                if (Math.abs(prevPos.x - (x + 0.5)) > Math.abs(prevPos.y - (y + 0.5)) &&
                    Math.abs(prevPos.x - (x + 0.5)) > Math.abs(prevPos.z - (z + 0.5))) {
                    normal.x = prevPos.x > x + 0.5 ? 1 : -1;
                } else if (Math.abs(prevPos.y - (y + 0.5)) > Math.abs(prevPos.z - (z + 0.5))) {
                    normal.y = prevPos.y > y + 0.5 ? 1 : -1;
                } else {
                    normal.z = prevPos.z > z + 0.5 ? 1 : -1;
                }
                
                return {
                    hit: true,
                    position: new THREE.Vector3(x, y, z),
                    normal,
                    blockType
                };
            }
        }
        
        return { hit: false };
    }
    
    public addTorchLights(scene: THREE.Scene): void {
        // Find all torch blocks and add point lights
        for (const chunk of this.chunks.values()) {
            for (let x = 0; x < CHUNK_SIZE; x++) {
                for (let y = 0; y < CHUNK_HEIGHT; y++) {
                    for (let z = 0; z < CHUNK_SIZE; z++) {
                        if (chunk.getBlock(x, y, z) === BlockType.TORCH) {
                            const worldX = chunk.x * CHUNK_SIZE + x;
                            const worldZ = chunk.z * CHUNK_SIZE + z;
                            
                            const light = new THREE.PointLight(0xFFFF88, 1.0, 15);
                            light.position.set(worldX + 0.5, y + 0.5, worldZ + 0.5);
                            scene.add(light);
                            this.torchLights.push(light);
                        }
                    }
                }
            }
        }
    }
}