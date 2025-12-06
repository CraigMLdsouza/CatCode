// src/game/cameraRig.js
// Smooth follow camera system with shake & cinematic effects

import * as THREE from 'three';

export class CameraRig {
  constructor(camera, target, options = {}) {
    this.camera = camera;
    this.target = target; // The cat object

    // Configuration
    this.offset = options.offset || new THREE.Vector3(0, 8, 12);
    this.lookAtOffset = options.lookAtOffset || new THREE.Vector3(0, 1.5, 0);
    this.smoothFactor = options.smoothFactor || 0.12; // Lower = smoother

    // Desired position (interpolation target)
    this.desiredPosition = new THREE.Vector3();
    this.desiredLookAt = new THREE.Vector3();

    // Shake state
    this.shakeIntensity = 0;
    this.shakeDecay = 0;
    this.shakeDuration = 0;
  }

  /**
   * Apply camera shake effect
   * @param {number} intensity - Strength of shake (0-1 typical)
   * @param {number} duration - How long to shake in seconds
   */
  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeDecay = intensity / duration; // Decay per second
  }

  update(dt, engine) {
    // Calculate desired position relative to target
    const targetPos = this.target.position;
    this.desiredPosition.copy(this.offset).add(targetPos);
    this.desiredLookAt.copy(this.lookAtOffset).add(targetPos);

    // Smooth interpolation to desired position
    this.camera.position.lerp(this.desiredPosition, this.smoothFactor);

    // Smooth look-at
    const currentLookAt = new THREE.Vector3();
    this.camera.getWorldDirection(currentLookAt);
    const desiredLookAtDirection = this.desiredLookAt.clone().sub(this.camera.position).normalize();
    currentLookAt.lerp(desiredLookAtDirection, this.smoothFactor * 0.5);

    // Update camera to look in smoothed direction
    const lookTarget = this.camera.position.clone().addScaledVector(
      desiredLookAtDirection,
      100 // Far point to look at
    );
    this.camera.lookAt(lookTarget);

    // --- SHAKE EFFECT ---
    if (this.shakeIntensity > 0) {
      // Apply procedural perlin-like noise (using sine waves)
      const shakeX = Math.sin(Math.random() * 6.28) * this.shakeIntensity;
      const shakeY = Math.sin(Math.random() * 6.28) * this.shakeIntensity;
      const shakeZ = Math.sin(Math.random() * 6.28) * this.shakeIntensity;

      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
      this.camera.position.z += shakeZ;

      // Decay shake over time
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }
  }
}
