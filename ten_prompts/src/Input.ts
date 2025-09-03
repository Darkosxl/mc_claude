export class Input {
    private keys = new Set<string>();
    private keyPressHandlers = new Map<string, () => void>();
    private mousePosition = { x: 0, y: 0 };
    private mouseDelta = { x: 0, y: 0 };
    private isPointerLocked = false;
    private mouseButtons = new Set<number>();
    
    constructor() {
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => {
            if (!this.keys.has(e.code)) {
                this.keys.add(e.code);
                const handler = this.keyPressHandlers.get(e.code);
                if (handler) handler();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            }
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });
        
        document.addEventListener('mousedown', (e) => {
            this.mouseButtons.add(e.button);
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouseButtons.delete(e.button);
            e.preventDefault();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
        });
        
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    public isKeyPressed(key: string): boolean {
        return this.keys.has(key);
    }
    
    public onKeyPress(key: string, handler: () => void): void {
        this.keyPressHandlers.set(key, handler);
    }
    
    public getMouseDelta(): { x: number; y: number } {
        const delta = { ...this.mouseDelta };
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        return delta;
    }
    
    public isMousePressed(button: number): boolean {
        return this.mouseButtons.has(button);
    }
    
    public isPointerLock(): boolean {
        return this.isPointerLocked;
    }
    
    public update(): void {
        // Called each frame to handle continuous input
    }
}