import * as THREE from 'three';

export class DayNightCycle {
    private scene: THREE.Scene;
    private directionalLight: THREE.DirectionalLight;
    private ambientLight: THREE.AmbientLight;
    private sun: THREE.Mesh;
    
    private dayDuration = 60000; // 1 minute day
    private nightDuration = 60000; // 1 minute night
    private totalCycleDuration = this.dayDuration + this.nightDuration;
    
    private currentTime = 0;
    private isNight = false;
    
    constructor(scene: THREE.Scene, directionalLight: THREE.DirectionalLight, ambientLight: THREE.AmbientLight) {
        this.scene = scene;
        this.directionalLight = directionalLight;
        this.ambientLight = ambientLight;
        
        this.createSun();
    }
    
    private createSun(): void {
        const sunGeometry = new THREE.SphereGeometry(10, 16, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFD9A,
            emissive: 0xFFD700,
            emissiveIntensity: 1.0
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(0, 100, 100);
        this.scene.add(this.sun);
    }
    
    public update(deltaTime: number): void {
        this.currentTime += deltaTime * 1000; // Convert to milliseconds
        
        if (this.currentTime >= this.totalCycleDuration) {
            this.currentTime = 0;
        }
        
        // Calculate time of day (0 = dawn, 0.5 = noon, 1 = dusk)
        const cycleProgress = this.currentTime / this.totalCycleDuration;
        const timeOfDay = (cycleProgress * 2) % 2;
        
        // Determine if it's night
        const wasNight = this.isNight;
        this.isNight = timeOfDay > 1;
        
        if (this.isNight !== wasNight) {
            // Night/day transition happened
            this.onTimeChange();
        }
        
        // Update sun position and lighting
        this.updateSunPosition(timeOfDay);
        this.updateLighting(timeOfDay);
        this.updateSkyColor(timeOfDay);
    }
    
    private updateSunPosition(timeOfDay: number): void {
        // Sun moves in an arc across the sky
        const angle = (timeOfDay * Math.PI);
        const sunX = Math.cos(angle) * 150;
        const sunY = Math.sin(angle) * 100 + 50;
        const sunZ = 100;
        
        this.sun.position.set(sunX, sunY, sunZ);
        this.directionalLight.position.copy(this.sun.position);
    }
    
    private updateLighting(timeOfDay: number): void {
        let lightIntensity: number;
        let ambientIntensity: number;
        
        if (timeOfDay <= 0.1 || timeOfDay >= 1.9) {
            // Dawn/Dusk
            lightIntensity = 0.3;
            ambientIntensity = 0.2;
        } else if (timeOfDay <= 1) {
            // Day
            const dayProgress = (timeOfDay - 0.1) / 0.8;
            lightIntensity = 0.3 + (1.2 - 0.3) * Math.sin(dayProgress * Math.PI);
            ambientIntensity = 0.2 + (0.8 - 0.2) * Math.sin(dayProgress * Math.PI);
        } else {
            // Night
            lightIntensity = 0.1;
            ambientIntensity = 0.05;
        }
        
        this.directionalLight.intensity = lightIntensity;
        this.ambientLight.intensity = ambientIntensity;
    }
    
    private updateSkyColor(timeOfDay: number): void {
        let skyColor: THREE.Color;
        
        if (timeOfDay <= 0.1) {
            // Dawn
            skyColor = new THREE.Color().lerpColors(
                new THREE.Color(0x191970), // Dark blue
                new THREE.Color(0xFF6347), // Orange-red
                timeOfDay * 10
            );
        } else if (timeOfDay <= 1) {
            // Day
            const dayProgress = (timeOfDay - 0.1) / 0.8;
            if (dayProgress < 0.5) {
                skyColor = new THREE.Color().lerpColors(
                    new THREE.Color(0xFF6347), // Orange-red
                    new THREE.Color(0x87CEEB), // Sky blue
                    dayProgress * 2
                );
            } else {
                skyColor = new THREE.Color().lerpColors(
                    new THREE.Color(0x87CEEB), // Sky blue
                    new THREE.Color(0xFF6347), // Orange-red
                    (dayProgress - 0.5) * 2
                );
            }
        } else if (timeOfDay <= 1.1) {
            // Dusk
            const duskProgress = (timeOfDay - 1) * 10;
            skyColor = new THREE.Color().lerpColors(
                new THREE.Color(0xFF6347), // Orange-red
                new THREE.Color(0x191970), // Dark blue
                duskProgress
            );
        } else {
            // Night
            skyColor = new THREE.Color(0x191970); // Dark blue
        }
        
        this.scene.background = skyColor;
        this.scene.fog = new THREE.Fog(skyColor.getHex(), 80, 300);
    }
    
    private onTimeChange(): void {
        // Dispatch custom event for day/night change
        const event = new CustomEvent(this.isNight ? 'nightfall' : 'dawn');
        document.dispatchEvent(event);
    }
    
    public isNightTime(): boolean {
        return this.isNight;
    }
    
    public getTimeOfDay(): number {
        const cycleProgress = this.currentTime / this.totalCycleDuration;
        return (cycleProgress * 2) % 2;
    }
}