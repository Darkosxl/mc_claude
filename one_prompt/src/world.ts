import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { CHUNK_SIZE, CHUNK_HEIGHT, BLOCK_TYPES, type Chunk } from './types';

export class World {
  private chunks: Map<string, Chunk> = new Map();
  private noise = createNoise2D();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private getChunkKey(x: number, z: number): string {
    return `${x},${z}`;
  }

  private getBlockIndex(x: number, y: number, z: number): number {
    return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
  }

  generateChunk(chunkX: number, chunkZ: number): Chunk {
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
    
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = chunkX * CHUNK_SIZE + x;
        const worldZ = chunkZ * CHUNK_SIZE + z;
        
        const height = Math.floor(8 + this.noise(worldX * 0.1, worldZ * 0.1) * 8);
        
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const index = this.getBlockIndex(x, y, z);
          
          if (y <= height) {
            if (y === height) {
              blocks[index] = 1; // grass
            } else if (y >= height - 3) {
              blocks[index] = 2; // dirt
            } else {
              blocks[index] = 3; // stone
            }
          } else {
            blocks[index] = 0; // air
          }
        }
      }
    }

    const chunk: Chunk = {
      x: chunkX,
      z: chunkZ,
      blocks
    };

    this.chunks.set(this.getChunkKey(chunkX, chunkZ), chunk);
    this.generateChunkMesh(chunk);
    
    return chunk;
  }

  private generateChunkMesh(chunk: Chunk): void {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    
    let vertexIndex = 0;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const blockType = chunk.blocks[this.getBlockIndex(x, y, z)];
          
          if (blockType === 0) continue; // Skip air blocks

          const worldX = chunk.x * CHUNK_SIZE + x;
          const worldZ = chunk.z * CHUNK_SIZE + z;
          
          // Check all 6 faces
          const faces = [
            { dir: [0, 1, 0], corners: [[0,1,1], [1,1,1], [1,1,0], [0,1,0]] }, // top
            { dir: [0, -1, 0], corners: [[0,0,0], [1,0,0], [1,0,1], [0,0,1]] }, // bottom
            { dir: [1, 0, 0], corners: [[1,0,0], [1,1,0], [1,1,1], [1,0,1]] }, // right
            { dir: [-1, 0, 0], corners: [[0,0,1], [0,1,1], [0,1,0], [0,0,0]] }, // left
            { dir: [0, 0, 1], corners: [[1,0,1], [1,1,1], [0,1,1], [0,0,1]] }, // front
            { dir: [0, 0, -1], corners: [[0,0,0], [0,1,0], [1,1,0], [1,0,0]] }, // back
          ];

          for (const face of faces) {
            const [dx, dy, dz] = face.dir;
            const neighborX = x + dx;
            const neighborY = y + dy;
            const neighborZ = z + dz;
            
            let shouldRender = false;
            
            if (neighborX < 0 || neighborX >= CHUNK_SIZE ||
                neighborY < 0 || neighborY >= CHUNK_HEIGHT ||
                neighborZ < 0 || neighborZ >= CHUNK_SIZE) {
              shouldRender = true;
            } else {
              const neighborBlock = chunk.blocks[this.getBlockIndex(neighborX, neighborY, neighborZ)];
              shouldRender = neighborBlock === 0;
            }

            if (shouldRender) {
              const blockColor = new THREE.Color(BLOCK_TYPES[blockType].color);
              
              for (const corner of face.corners) {
                vertices.push(
                  worldX + corner[0],
                  y + corner[1],
                  worldZ + corner[2]
                );
                colors.push(blockColor.r, blockColor.g, blockColor.b);
              }

              indices.push(
                vertexIndex, vertexIndex + 1, vertexIndex + 2,
                vertexIndex, vertexIndex + 2, vertexIndex + 3
              );
              
              vertexIndex += 4;
            }
          }
        }
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.MeshLambertMaterial({ 
      vertexColors: true,
      side: THREE.DoubleSide
    });
    
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
    }
    
    chunk.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(chunk.mesh);
  }

  getBlock(x: number, y: number, z: number): number {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    const chunk = this.chunks.get(this.getChunkKey(chunkX, chunkZ));
    
    if (!chunk || y < 0 || y >= CHUNK_HEIGHT) return 0;
    
    const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    
    return chunk.blocks[this.getBlockIndex(localX, y, localZ)];
  }

  setBlock(x: number, y: number, z: number, blockType: number): void {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    const chunk = this.chunks.get(this.getChunkKey(chunkX, chunkZ));
    
    if (!chunk || y < 0 || y >= CHUNK_HEIGHT) return;
    
    const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    
    chunk.blocks[this.getBlockIndex(localX, y, localZ)] = blockType;
    this.generateChunkMesh(chunk);
  }

  loadChunksAroundPosition(x: number, z: number, radius: number = 2): void {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const cx = chunkX + dx;
        const cz = chunkZ + dz;
        const key = this.getChunkKey(cx, cz);
        
        if (!this.chunks.has(key)) {
          this.generateChunk(cx, cz);
        }
      }
    }
  }
}