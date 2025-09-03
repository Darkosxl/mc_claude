export class HealthSystem {
    private maxHealth = 20;
    private currentHealth = 20;
    private healthElement: HTMLElement | null = null;
    
    constructor() {
        this.createHealthBar();
        this.updateHealthDisplay();
        
        // Listen for zombie attacks
        document.addEventListener('zombieAttack', (event: any) => {
            this.takeDamage(event.detail.damage);
        });
    }
    
    private createHealthBar(): void {
        const healthBar = document.createElement('div');
        healthBar.id = 'healthBar';
        healthBar.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 2px;
            z-index: 1001;
        `;
        
        for (let i = 0; i < this.maxHealth / 2; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.style.cssText = `
                width: 16px;
                height: 16px;
                background-color: #FF0000;
                position: relative;
                transform: rotate(-45deg);
                margin: 2px;
            `;
            
            // Create heart shape with pseudo-elements effect
            heart.innerHTML = `
                <div style="
                    width: 16px;
                    height: 16px;
                    background-color: #FF0000;
                    border-radius: 50%;
                    position: absolute;
                    left: -8px;
                    top: 0;
                "></div>
                <div style="
                    width: 16px;
                    height: 16px;
                    background-color: #FF0000;
                    border-radius: 50%;
                    position: absolute;
                    right: -8px;
                    top: 0;
                "></div>
            `;
            
            healthBar.appendChild(heart);
        }
        
        document.body.appendChild(healthBar);
        this.healthElement = healthBar;
    }
    
    private updateHealthDisplay(): void {
        if (!this.healthElement) return;
        
        const hearts = this.healthElement.querySelectorAll('.heart');
        const fullHearts = Math.floor(this.currentHealth / 2);
        const hasHalfHeart = this.currentHealth % 2 === 1;
        
        hearts.forEach((heart, index) => {
            const heartEl = heart as HTMLElement;
            
            if (index < fullHearts) {
                // Full heart
                heartEl.style.opacity = '1';
                heartEl.style.filter = 'none';
            } else if (index === fullHearts && hasHalfHeart) {
                // Half heart
                heartEl.style.opacity = '1';
                heartEl.style.filter = 'brightness(0.5)';
            } else {
                // Empty heart
                heartEl.style.opacity = '0.2';
                heartEl.style.filter = 'grayscale(1)';
            }
        });
    }
    
    public takeDamage(damage: number): void {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        this.updateHealthDisplay();
        
        if (this.currentHealth <= 0) {
            this.onPlayerDeath();
        }
    }
    
    public heal(amount: number): void {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        this.updateHealthDisplay();
    }
    
    private onPlayerDeath(): void {
        // Handle player death
        const event = new CustomEvent('playerDeath');
        document.dispatchEvent(event);
    }
    
    public getCurrentHealth(): number {
        return this.currentHealth;
    }
    
    public getMaxHealth(): number {
        return this.maxHealth;
    }
    
    public isAlive(): boolean {
        return this.currentHealth > 0;
    }
}