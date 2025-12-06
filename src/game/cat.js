// src/game/cat.js
// Cat logic: movement with acceleration/friction, gravity, animation, physics feel

import * as THREE from 'three';

export class Cat {
  constructor(mesh, input) {
    this.mesh = mesh;
    this.input = input;

    this.position = new THREE.Vector3(0, 1, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Movement parameters - JUICY
    this.maxSpeed = 10;        // Max horizontal speed
    this.acceleration = 30;    // How quickly to reach max speed
    this.friction = 0.92;      // Drag when no input (0-1, lower = more friction)
    this.jumpStrength = 12;    // jump velocity
    this.gravity = 28;         // Gravity acceleration

    this.onGround = false;
    this.legPhase = 0;
  }

  update(dt, engine) {
    // --- INPUT: Calculate desired direction ---
    const inputDir = new THREE.Vector3(
      (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0),
      0,
      (this.input.down ? 1 : 0) - (this.input.up ? 1 : 0)
    );

    // --- ACCELERATION: Apply input force ---
    if (inputDir.lengthSq() > 0) {
      inputDir.normalize();

      // Accelerate in desired direction
      const accelVector = inputDir.multiplyScalar(this.acceleration * dt);
      this.velocity.add(accelVector);

      // Clamp horizontal speed
      const horizontalVel = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
      const speed = horizontalVel.length();
      if (speed > this.maxSpeed) {
        horizontalVel.normalize().multiplyScalar(this.maxSpeed);
        this.velocity.x = horizontalVel.x;
        this.velocity.z = horizontalVel.z;
      }

      // Face movement direction
      const angle = Math.atan2(inputDir.x, inputDir.z);
      this.mesh.rotation.y = angle;

      // Advance leg animation
      this.legPhase += dt * 10;
    } else {
      // --- FRICTION: Slow down when no input ---
      this.velocity.x *= this.friction;
      this.velocity.z *= this.friction;

      // Stop completely if very slow
      if (this.velocity.lengthSq() < 0.01) {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }

      this.legPhase *= 0.9; // slow down swinging
    }

    // --- GRAVITY + JUMP ---
    this.velocity.y -= this.gravity * dt; // gravity
    if (this.onGround && this.input.jump) {
      this.velocity.y = this.jumpStrength;
      this.onGround = false;
    }

    // --- POSITION UPDATE ---
    this.position.addScaledVector(this.velocity, dt);

    // --- GROUND COLLISION ---
    const groundLevel = 0.5;
    if (this.position.y <= groundLevel) {
      this.position.y = groundLevel;
      this.velocity.y = 0;
      this.onGround = true;
    }

    // --- APPLY TO MESH ---
    this.mesh.position.copy(this.position);

    // --- LEG ANIMATION ---
    if (this.mesh.userData.legs) {
      const amp = 0.5;
      this.mesh.userData.legs.forEach((legPivot, i) => {
        const offset = (i % 2 === 0 ? 0 : Math.PI);
        legPivot.rotation.x = Math.sin(this.legPhase + offset) * amp;
      });
    }

    // --- TAIL WAGGING ---
    if (this.mesh.userData.tail) {
      this.mesh.userData.tail.forEach((seg, i) => {
        seg.rotation.x = Math.sin(this.legPhase * 0.5 + i * 0.3) * 0.3;
      });
    }

    // --- OPTIONAL: Tilt cat based on velocity direction (adds visual feedback) ---
    const horizontalSpeed = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).length();
    const tiltAmount = Math.min(horizontalSpeed / this.maxSpeed, 1) * 0.15;
    const moveDir = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      this.mesh.rotation.z = moveDir.x * tiltAmount;
      this.mesh.rotation.x = -moveDir.z * tiltAmount;
    }
  }
}
