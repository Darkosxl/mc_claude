import * as THREE from 'three';

export class BlockTextures {
    private static canvas: HTMLCanvasElement;
    private static ctx: CanvasRenderingContext2D;
    
    public static createStoneTexture(): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        // Base stone color
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, 64, 64);
        
        // Add stone texture with random dark spots
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 3 + 1;
            
            ctx.fillStyle = `rgba(${60 + Math.random() * 40}, ${60 + Math.random() * 40}, ${60 + Math.random() * 40}, 0.6)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    public static createDirtTexture(): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        // Base dirt color
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 64, 64);
        
        // Add dirt texture with darker patches
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 4 + 2;
            
            ctx.fillStyle = `rgba(${70 + Math.random() * 30}, ${30 + Math.random() * 20}, ${10 + Math.random() * 15}, 0.7)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    public static createWoodTexture(): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        // Base wood color
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 64, 64);
        
        // Wood rings
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 5; i < 32; i += 4 + Math.random() * 3) {
            ctx.beginPath();
            ctx.arc(32, 32, i, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Add some vertical grain
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 64;
            ctx.strokeStyle = `rgba(80, 50, 30, 0.3)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + Math.random() * 10 - 5, 64);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    public static createPlanksTexture(): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        // Base plank color
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, 64, 64);
        
        // Horizontal planks
        const plankHeight = 16;
        for (let y = 0; y < 64; y += plankHeight) {
            // Plank separator
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(0, y, 64, 2);
            
            // Wood grain within plank
            for (let i = 0; i < 5; i++) {
                const grainY = y + 2 + Math.random() * (plankHeight - 4);
                ctx.strokeStyle = `rgba(150, 120, 90, 0.4)`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, grainY);
                ctx.lineTo(64, grainY + Math.random() * 4 - 2);
                ctx.stroke();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    public static createGrassTexture(): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        // Base grass color
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, 0, 64, 64);
        
        // Add grass texture with lighter green spots
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 2 + 1;
            
            ctx.fillStyle = `rgba(${40 + Math.random() * 60}, ${140 + Math.random() * 60}, ${40 + Math.random() * 40}, 0.6)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    public static createLeavesTexture(): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        
        // Base leaf color
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(0, 0, 64, 64);
        
        // Add leaf texture with varied greens
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            const size = Math.random() * 3 + 1;
            
            ctx.fillStyle = `rgba(${20 + Math.random() * 80}, ${150 + Math.random() * 80}, ${20 + Math.random() * 80}, 0.7)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
}