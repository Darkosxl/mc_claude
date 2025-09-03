export enum ToolType {
    HAND = 'hand',
    WOODEN_PICKAXE = 'wooden_pickaxe'
}

export interface Tool {
    type: ToolType;
    durability: number;
    maxDurability: number;
    miningSpeed: number;
}

export class ToolSystem {
    private currentTool: Tool;
    
    constructor() {
        this.currentTool = this.createTool(ToolType.HAND);
    }
    
    public createTool(type: ToolType): Tool {
        switch (type) {
            case ToolType.WOODEN_PICKAXE:
                return {
                    type,
                    durability: 60,
                    maxDurability: 60,
                    miningSpeed: 3.0
                };
            default:
                return {
                    type: ToolType.HAND,
                    durability: 999,
                    maxDurability: 999,
                    miningSpeed: 1.0
                };
        }
    }
    
    public getCurrentTool(): Tool {
        return this.currentTool;
    }
    
    public setCurrentTool(tool: Tool): void {
        this.currentTool = tool;
    }
    
    public useTool(): boolean {
        if (this.currentTool.type !== ToolType.HAND) {
            this.currentTool.durability--;
            
            if (this.currentTool.durability <= 0) {
                // Tool breaks, revert to hand
                this.currentTool = this.createTool(ToolType.HAND);
                return false; // Tool broke
            }
        }
        return true; // Tool still working
    }
    
    public getMiningSpeed(): number {
        return this.currentTool.miningSpeed;
    }
    
    public getDurabilityPercentage(): number {
        return this.currentTool.durability / this.currentTool.maxDurability;
    }
}