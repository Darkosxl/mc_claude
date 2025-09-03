export enum BlockType {
    AIR = 0,
    STONE = 1,
    DIRT = 2,
    GRASS = 3,
    WOOD = 4,
    LEAVES = 5,
    WATER = 6,
    SAND = 7,
    COBBLESTONE = 8,
    PLANKS = 9,
    TORCH = 10,
    WHEAT = 11,
    CACTUS = 12,
    FENCE = 13,
    SANDSTONE = 14
}

export const BLOCK_COLORS: { [key: number]: number } = {
    [BlockType.STONE]: 0x888888,
    [BlockType.DIRT]: 0x8B4513,
    [BlockType.GRASS]: 0x228B22,
    [BlockType.WOOD]: 0x8B4513,
    [BlockType.LEAVES]: 0x32CD32,
    [BlockType.WATER]: 0x4682B4,
    [BlockType.SAND]: 0xF4A460,
    [BlockType.COBBLESTONE]: 0x696969,
    [BlockType.PLANKS]: 0xDEB887,
    [BlockType.TORCH]: 0xFFFF00,
    [BlockType.WHEAT]: 0xF0E68C
};

export function isTransparent(blockType: BlockType): boolean {
    return blockType === BlockType.AIR || blockType === BlockType.WATER;
}

export function isEmissive(blockType: BlockType): boolean {
    return blockType === BlockType.TORCH;
}