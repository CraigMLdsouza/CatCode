// src/game/levelUtils.js
// Shared helpers for CatCode levels

import * as THREE from 'three';

// Simple ground plane themed by arena skin
// arenaSkin?: { groundColor?: number }
export function createGround(scene, arenaSkin, size = 40) {
  const groundColor = arenaSkin?.groundColor ?? 0x222222;

  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshStandardMaterial({ color: groundColor });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;        // <- was ground.y = 10 (bug)
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}

/**
 * Create a row of blocks representing an array.
 * Themed by arena skin.
 * Returns an array of { mesh, index, value }.
 *
 * arenaSkin?: { blockColor?: number, accentColor?: number }
 */
export function createArrayBlocks(scene, values, options = {}, arenaSkin) {
  const {
    startX = -((values.length - 1) * 0.9), // center approx
    z = 0,
    y = 0,
    spacing = 1.8
  } = options;

  const blockColor = arenaSkin?.blockColor ?? 0x282a36;
  const accentColor = arenaSkin?.accentColor ?? 0x44475a;

  const blocks = [];

  values.forEach((value, i) => {
    const x = startX + i * spacing;

    // Base block
    const geo = new THREE.BoxGeometry(1.2, 0.3, 1.2);
    const mat = new THREE.MeshStandardMaterial({ 
      color: blockColor,
      emissive: accentColor,
      emissiveIntensity: 0.15,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    // Glowing top accent
    const topGeo = new THREE.BoxGeometry(1.0, 0.05, 1.0);
    const topMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.5,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.18;
    mesh.add(top);

    blocks.push({ mesh, index: i, value });
  });

  return blocks;
}

/**
 * Find which block the cat is currently standing on (if any).
 * Returns { block } or null.
 */
export function getBlockUnderCat(cat, blocks, radius = 0.8) {
  const cx = cat.position.x;
  const cz = cat.position.z;

  for (const b of blocks) {
    const px = b.mesh.position.x;
    const pz = b.mesh.position.z;
    const dx = cx - px;
    const dz = cz - pz;
    if (dx * dx + dz * dz <= radius * radius) {
      return { block: b };
    }
  }

  return null;
}

/**
 * Collision detection utility - Check if cat collides with objects
 * @param {Cat} cat - Cat entity with position
 * @param {Array} colliders - Array of meshes/objects with position and dimensions
 * @param {number} catRadius - Cat collision radius (default 0.5)
 * @returns {Array} Array of colliding objects
 */
export function checkCollisions(cat, colliders, catRadius = 0.5) {
  const collisions = [];
  const catPos = cat.position;

  for (const collider of colliders) {
    const objPos = collider.position || collider.mesh?.position;
    if (!objPos) continue;

    const dx = catPos.x - objPos.x;
    const dz = catPos.z - objPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Simple radius-based collision
    const colliderRadius = collider.collisionRadius || 0.7;
    if (distance < catRadius + colliderRadius) {
      collisions.push(collider);
    }
  }

  return collisions;
}

/**
 * Create a collidable object in the scene
 * @param {THREE.Scene} scene - Scene to add to
 * @param {Object} options - Configuration object
 * @returns {THREE.Mesh} The created mesh with collision properties
 */
export function createCollider(scene, options = {}) {
  const {
    position = [0, 0, 0],
    size = [1, 1, 1],
    color = 0x50fa7b,
    collisionRadius = 0.7,
    castShadow = true,
    receiveShadow = true,
    visible = true
  } = options;

  const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const mat = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);

  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  mesh.visible = visible;
  mesh.collisionRadius = collisionRadius;

  scene.add(mesh);
  return mesh;
}

/**
 * Create an obstacle/wall in the scene (for collision only, typically invisible)
 * @param {THREE.Scene} scene - Scene to add to
 * @param {Object} options - Configuration object
 * @returns {THREE.Mesh} The created obstacle mesh
 */
export function createObstacle(scene, options = {}) {
  const {
    position = [0, 0, 0],
    size = [2, 2, 0.2],
    collisionRadius = 1.0,
    visible = false
  } = options;

  return createCollider(scene, {
    position,
    size,
    color: 0xff0000,
    collisionRadius,
    visible,
    castShadow: false,
    receiveShadow: false,
    ...options
  });
}
