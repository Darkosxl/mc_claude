import { BlockType } from './world/BlockTypes';
import { ToolType, Tool, ToolSystem } from './ToolSystem';

export interface InventoryItem {
    type: BlockType | ToolType;
    count: number;
}

export interface Recipe {
    ingredients: { type: BlockType | ToolType; count: number }[];
    result: { type: BlockType | ToolType; count: number };
}

export class InventorySystem {
    private items: InventoryItem[] = [];
    private isOpen = false;
    private hotbarSlots = 9;
    private selectedSlot = 0;
    private toolSystem: ToolSystem;
    
    private recipes: Recipe[] = [
        {
            ingredients: [{ type: BlockType.WOOD, count: 3 }, { type: BlockType.WOOD, count: 2 }],
            result: { type: ToolType.WOODEN_PICKAXE, count: 1 }
        }
    ];
    
    constructor() {
        this.toolSystem = new ToolSystem();
        this.createInventoryUI();
        this.setupEventListeners();
        
        // Start with some basic items
        this.addItem(BlockType.WOOD, 10);
        this.addItem(BlockType.STONE, 5);
    }
    
    private createInventoryUI(): void {
        const inventoryHTML = `
            <div id="inventory" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                border: 2px solid #ccc;
                padding: 20px;
                display: none;
                z-index: 2000;
                color: white;
                font-family: monospace;
            ">
                <h3>Inventory & Crafting</h3>
                <div id="inventorySlots" style="display: grid; grid-template-columns: repeat(9, 40px); gap: 2px; margin: 10px 0;"></div>
                <div id="crafting" style="margin-top: 20px;">
                    <h4>Crafting Recipes:</h4>
                    <button id="craftPickaxe" style="padding: 5px; margin: 2px;">Craft Wooden Pickaxe (3 Wood)</button>
                </div>
                <div style="margin-top: 10px; font-size: 12px;">Press E to close</div>
            </div>
            
            <div id="hotbar" style="
                position: fixed;
                bottom: 60px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 2px;
                z-index: 1500;
            "></div>
            
            <div id="toolDurability" style="
                position: fixed;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 5px 10px;
                font-size: 12px;
                font-family: monospace;
                z-index: 1500;
            "></div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', inventoryHTML);
        this.updateHotbar();
        this.updateToolDurability();
    }
    
    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                this.toggleInventory();
            }
            
            // Hotbar selection (1-9)
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                this.selectedSlot = num - 1;
                this.updateHotbar();
            }
        });
        
        document.getElementById('craftPickaxe')?.addEventListener('click', () => {
            this.craftItem(0); // First recipe
        });
    }
    
    public addItem(type: BlockType | ToolType, count: number): void {
        const existing = this.items.find(item => item.type === type);
        if (existing) {
            existing.count += count;
        } else {
            this.items.push({ type, count });
        }
        this.updateInventoryDisplay();
        this.updateHotbar();
    }
    
    public removeItem(type: BlockType | ToolType, count: number): boolean {
        const item = this.items.find(item => item.type === type);
        if (item && item.count >= count) {
            item.count -= count;
            if (item.count === 0) {
                this.items = this.items.filter(i => i !== item);
            }
            this.updateInventoryDisplay();
            this.updateHotbar();
            return true;
        }
        return false;
    }
    
    public getSelectedItem(): InventoryItem | null {
        return this.items[this.selectedSlot] || null;
    }
    
    public getToolSystem(): ToolSystem {
        return this.toolSystem;
    }
    
    private toggleInventory(): void {
        this.isOpen = !this.isOpen;
        const inventory = document.getElementById('inventory');
        if (inventory) {
            inventory.style.display = this.isOpen ? 'block' : 'none';
        }
        
        if (this.isOpen) {
            this.updateInventoryDisplay();
        }
    }
    
    private updateInventoryDisplay(): void {
        const slotsDiv = document.getElementById('inventorySlots');
        if (!slotsDiv) return;
        
        slotsDiv.innerHTML = '';
        
        for (let i = 0; i < 36; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = `
                width: 40px;
                height: 40px;
                border: 1px solid #666;
                background: #333;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                position: relative;
            `;
            
            const item = this.items[i];
            if (item) {
                slot.textContent = this.getItemName(item.type);
                if (item.count > 1) {
                    const count = document.createElement('div');
                    count.textContent = item.count.toString();
                    count.style.cssText = 'position: absolute; bottom: 0; right: 2px; font-size: 8px;';
                    slot.appendChild(count);
                }
            }
            
            slotsDiv.appendChild(slot);
        }
    }
    
    private updateHotbar(): void {
        const hotbarDiv = document.getElementById('hotbar');
        if (!hotbarDiv) return;
        
        hotbarDiv.innerHTML = '';
        
        for (let i = 0; i < this.hotbarSlots; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = `
                width: 50px;
                height: 50px;
                border: 2px solid ${i === this.selectedSlot ? '#fff' : '#666'};
                background: ${i === this.selectedSlot ? '#444' : '#222'};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: white;
                position: relative;
            `;
            
            const item = this.items[i];
            if (item) {
                slot.textContent = this.getItemName(item.type);
                if (item.count > 1) {
                    const count = document.createElement('div');
                    count.textContent = item.count.toString();
                    count.style.cssText = 'position: absolute; bottom: 0; right: 2px; font-size: 8px;';
                    slot.appendChild(count);
                }
            }
            
            hotbarDiv.appendChild(slot);
        }
    }
    
    private updateToolDurability(): void {
        const durabilityDiv = document.getElementById('toolDurability');
        if (!durabilityDiv) return;
        
        const tool = this.toolSystem.getCurrentTool();
        if (tool.type === ToolType.HAND) {
            durabilityDiv.style.display = 'none';
        } else {
            durabilityDiv.style.display = 'block';
            const percentage = this.toolSystem.getDurabilityPercentage();
            durabilityDiv.innerHTML = `
                ${this.getItemName(tool.type)}: ${tool.durability}/${tool.maxDurability}
                <div style="width: 100px; height: 4px; background: #333; margin-top: 2px;">
                    <div style="width: ${percentage * 100}%; height: 100%; background: ${percentage > 0.3 ? '#4f4' : '#f44'};"></div>
                </div>
            `;
        }
    }
    
    private craftItem(recipeIndex: number): void {
        const recipe = this.recipes[recipeIndex];
        if (!recipe) return;
        
        // Check if we have all ingredients
        for (const ingredient of recipe.ingredients) {
            const item = this.items.find(i => i.type === ingredient.type);
            if (!item || item.count < ingredient.count) {
                return; // Not enough ingredients
            }
        }
        
        // Remove ingredients
        for (const ingredient of recipe.ingredients) {
            this.removeItem(ingredient.type, ingredient.count);
        }
        
        // Add result
        this.addItem(recipe.result.type, recipe.result.count);
        
        // If crafted tool is a tool, equip it
        if (recipe.result.type === ToolType.WOODEN_PICKAXE) {
            const tool = this.toolSystem.createTool(ToolType.WOODEN_PICKAXE);
            this.toolSystem.setCurrentTool(tool);
            this.updateToolDurability();
        }
    }
    
    private getItemName(type: BlockType | ToolType): string {
        const names: { [key: string]: string } = {
            [BlockType.WOOD]: 'Wood',
            [BlockType.STONE]: 'Stone',
            [BlockType.DIRT]: 'Dirt',
            [BlockType.SAND]: 'Sand',
            [ToolType.WOODEN_PICKAXE]: 'W.Pick',
            [ToolType.HAND]: 'Hand'
        };
        return names[type] || 'Item';
    }
    
    public update(): void {
        this.updateToolDurability();
    }
}