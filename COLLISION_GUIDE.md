# Collision System Guide

## Overview

The collision system provides simple, circle-based collision detection for game objects. Perfect for collecting items, triggering events, or avoiding obstacles.

## API Reference

### `checkCollisions(cat, colliders, catRadius)`

Check what the cat is currently colliding with.

```javascript
const collisions = checkCollisions(cat, colliders, 0.5);

if (collisions.length > 0) {
  // Handle collision
  const hitObject = collisions[0];
  // Do something with hitObject
}
```

**Parameters:**
- `cat`: Cat entity (must have `position` property)
- `colliders`: Array of objects with `position` and `collisionRadius`
- `catRadius`: Cat collision radius (default 0.5)

**Returns:** Array of colliding objects

---

### `createCollider(scene, options)`

Create a visible, collidable object in the scene.

```javascript
const coin = createCollider(scene, {
  position: [5, 1, -3],
  size: [0.3, 0.3, 0.3],
  color: 0xffff00,
  collisionRadius: 0.4
});

coins.push(coin);
```

**Options:**
- `position`: [x, y, z] position
- `size`: [width, height, depth] dimensions
- `color`: Hex color (default 0x50fa7b)
- `collisionRadius`: Collision detection radius (default 0.7)
- `castShadow`: Whether to cast shadows (default true)
- `receiveShadow`: Whether to receive shadows (default true)
- `visible`: Whether mesh is visible (default true)

**Returns:** THREE.Mesh with collision properties

---

### `createObstacle(scene, options)`

Create an invisible collision obstacle (wall, barrier, etc.).

```javascript
const wall = createObstacle(scene, {
  position: [0, 0, 5],
  size: [5, 2, 0.2],
  collisionRadius: 2.5
});

obstacles.push(wall);
```

**Options:** Same as `createCollider`, but `visible` defaults to `false`

---

## Example Level with Collisions

```javascript
// src/levels/coinCollector.js

import { 
  createGround, 
  createArrayBlocks, 
  getBlockUnderCat,
  createCollider,
  createObstacle,
  checkCollisions 
} from '../game/levelUtils.js';

export const meta = {
  id: 'coin-collector',
  title: 'Coin Collector',
  difficulty: 'easy',
  tags: ['collection', 'collision'],
  mode: 'platform',
  description: 'Collect all the coins!'
};

export function createLevel() {
  let ground = null;
  let blocks = [];
  let coins = [];
  let obstacles = [];
  let coinsCollected = 0;

  return {
    id: meta.id,
    title: meta.title,

    build(engine, services) {
      const { cat, editor, hud } = services;

      // Setup level
      ground = createGround(engine.scene);
      blocks = createArrayBlocks(engine.scene, [1, 2, 3, 4, 5], { z: 0 });

      // Create coins to collect
      coins = [
        createCollider(engine.scene, {
          position: [0, 1.5, 0],
          size: [0.2, 0.2, 0.2],
          color: 0xffff00,
          collisionRadius: 0.3
        }),
        createCollider(engine.scene, {
          position: [3, 1.5, 0],
          size: [0.2, 0.2, 0.2],
          color: 0xffff00,
          collisionRadius: 0.3
        }),
        createCollider(engine.scene, {
          position: [6, 1.5, 0],
          size: [0.2, 0.2, 0.2],
          color: 0xffff00,
          collisionRadius: 0.3
        })
      ];

      // Create obstacles (invisible walls)
      obstacles = [
        createObstacle(engine.scene, {
          position: [5, 1, 2],
          size: [3, 2, 0.2],
          collisionRadius: 1.5
        })
      ];

      if (cat) {
        cat.position.set(-15, 1, 0);
        cat.velocity.set(0, 0, 0);
        cat.mesh.position.copy(cat.position);
      }

      if (editor) {
        editor.clearOutput();
        editor.printOutput('🪙 Collect all coins!', 'system');
      }

      coinsCollected = 0;
    },

    update(dt, engine, services) {
      const { cat, editor, cameraRig } = services;
      if (!cat) return;

      // Check coin collisions
      const coinCollisions = checkCollisions(cat, coins, 0.6);
      for (const coin of coinCollisions) {
        if (coin.visible) {
          coin.visible = false;
          coinsCollected++;
          cameraRig.shake(0.15, 0.15);
          engine.pulseExposure(0.3, 0.2);
          editor.printOutput(`Coin collected! (${coinsCollected}/3)`, 'info');

          if (coinsCollected === 3) {
            editor.printOutput('🎉 All coins collected!', 'success');
            cameraRig.shake(0.4, 0.5);
            engine.flashBackground(0x50fa7b, 0.4);
          }
        }
      }

      // Check obstacle collisions (push cat back)
      const obstacleCollisions = checkCollisions(cat, obstacles, 0.6);
      if (obstacleCollisions.length > 0) {
        // Simple: slow cat down
        cat.velocity.x *= 0.5;
        cat.velocity.z *= 0.5;
        editor.printOutput('⚠️ Hit an obstacle!', 'error');
      }
    },

    hint(editor) {
      if (editor) {
        editor.printOutput('💡 Collect all coins to win!', 'hint');
      }
    },

    explain(editor) {
      if (editor) {
        editor.printOutput(
          '📚 This level demonstrates collision detection.\n' +
          'Use checkCollisions() to detect when cat hits objects.',
          'system'
        );
      }
    },

    destroy(engine) {
      if (ground) engine.scene.remove(ground);
      if (blocks.length) {
        blocks.forEach(b => engine.scene.remove(b.mesh));
      }
      if (coins.length) {
        coins.forEach(c => engine.scene.remove(c));
      }
      if (obstacles.length) {
        obstacles.forEach(o => engine.scene.remove(o));
      }
    }
  };
}
```

---

## Tips & Tricks

### Invisible Walls

```javascript
// Create a wall you can't see but can't pass through
const invisibleWall = createObstacle(scene, {
  position: [10, 1, 0],
  size: [2, 3, 0.2],
  visible: false
});
```

### Collectibles

```javascript
// Create a visible, collectible object
const gem = createCollider(scene, {
  position: [5, 2, 0],
  size: [0.3, 0.3, 0.3],
  color: 0x50fa7b,
  castShadow: true
});
```

### Large Collision Radius

```javascript
// Make an object easier to collect
const powerUp = createCollider(scene, {
  position: [0, 2, 0],
  size: [0.5, 0.5, 0.5],
  color: 0xbd93f9,
  collisionRadius: 1.5  // Large collision area
});
```

### Trigger Zones

```javascript
// Create an invisible trigger area
const goalZone = createObstacle(scene, {
  position: [20, 1, 0],
  size: [3, 3, 3],
  collisionRadius: 2.0,
  visible: false
});

// In update loop:
if (checkCollisions(cat, [goalZone]).length > 0) {
  editor.printOutput('You reached the goal!', 'success');
}
```

---

## Performance Notes

- Collision detection is O(n) where n = number of colliders
- Use `visible = false` for invisible obstacles (no rendering cost)
- Keep collision arrays updated (remove collected items)

---

Done! Collision system ready to use in your levels.
