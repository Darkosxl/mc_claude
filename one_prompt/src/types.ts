export interface BlockType {
  id: number;
  name: string;
  color: number;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Chunk {
  x: number;
  z: number;
  blocks: Uint8Array;
  mesh?: THREE.Mesh;
}

export const BLOCK_TYPES: BlockType[] = [
  { id: 0, name: 'air', color: 0x000000 },
  { id: 1, name: 'grass', color: 0x4CAF50 },
  { id: 2, name: 'dirt', color: 0x8D6E63 },
  { id: 3, name: 'stone', color: 0x9E9E9E }
];

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;