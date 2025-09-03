import * as THREE from 'three';

export class CinematicCamera {
    private camera: THREE.PerspectiveCamera;
    private isActive = false;
    private time = 0;
    private duration = 25; // 25 second flythrough
    private startPosition = new THREE.Vector3();
    private startRotation = new THREE.Euler();
    
    // Cinematic waypoints
    private waypoints = [
        { position: new THREE.Vector3(0, 75, 15), lookAt: new THREE.Vector3(0, 70, 10) }, // Start - overview
        { position: new THREE.Vector3(-5, 68, 5), lookAt: new THREE.Vector3(-10, 56, -5) }, // Approach house
        { position: new THREE.Vector3(-15, 58, -2), lookAt: new THREE.Vector3(-10, 56, -2) }, // House side view
        { position: new THREE.Vector3(-8, 60, -8), lookAt: new THREE.Vector3(-8, 56, -2) }, // House front
        { position: new THREE.Vector3(2, 58, -5), lookAt: new THREE.Vector3(7, 56, -5) }, // Move to farm
        { position: new THREE.Vector3(10, 62, -2), lookAt: new THREE.Vector3(7, 56, -5) }, // Farm overview
        { position: new THREE.Vector3(5, 65, 5), lookAt: new THREE.Vector3(0, 65, 10) }, // Move to tower
        { position: new THREE.Vector3(-3, 75, 12), lookAt: new THREE.Vector3(1, 70, 11) }, // Tower approach
        { position: new THREE.Vector3(1, 78, 8), lookAt: new THREE.Vector3(1, 70, 11) }, // Tower top view
        { position: new THREE.Vector3(5, 85, 15), lookAt: new THREE.Vector3(0, 65, 5) }  // Final overview
    ];
    
    constructor(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
    }
    
    public startCinematic(): void {
        this.startPosition.copy(this.camera.position);
        this.startRotation.copy(this.camera.rotation);
        this.time = 0;
        this.isActive = true;
    }
    
    public stopCinematic(): void {
        this.isActive = false;
        this.camera.position.copy(this.startPosition);
        this.camera.rotation.copy(this.startRotation);
    }
    
    public update(deltaTime: number): void {
        if (!this.isActive) return;
        
        this.time += deltaTime;
        
        if (this.time >= this.duration) {
            this.stopCinematic();
            return;
        }
        
        // Normalize time to 0-1
        const t = this.time / this.duration;
        
        // Calculate which waypoints to interpolate between
        const segmentCount = this.waypoints.length - 1;
        const segmentIndex = Math.floor(t * segmentCount);
        const segmentT = (t * segmentCount) - segmentIndex;
        
        const currentWaypoint = this.waypoints[Math.min(segmentIndex, this.waypoints.length - 1)];
        const nextWaypoint = this.waypoints[Math.min(segmentIndex + 1, this.waypoints.length - 1)];
        
        // Smooth interpolation using easeInOutCubic
        const smoothT = this.easeInOutCubic(segmentT);
        
        // Interpolate position
        const position = currentWaypoint.position.clone().lerp(nextWaypoint.position, smoothT);
        const lookAt = currentWaypoint.lookAt.clone().lerp(nextWaypoint.lookAt, smoothT);
        
        // Add slight bobbing motion for dynamic feel
        position.y += Math.sin(this.time * 2) * 0.5;
        
        this.camera.position.copy(position);
        this.camera.lookAt(lookAt);
    }
    
    private easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    public isActiveCinematic(): boolean {
        return this.isActive;
    }
}