# Game Feel Upgrade - Quick Start Guide

## For Level Designers

### Get Camera Shake Working

In your level's `update()` method:

```javascript
update(dt, engine, services) {
  const { cat, cameraRig, editor } = services;
  
  // Shake on player landing
  if (cat.justLanded) {
    services.cameraRig.shake(0.2, 0.15);
  }
}
```

**That's it!** The camera will shake.

---

### Add Visual Effects

In the same update method:

```javascript
// Flash background on success
engine.flashBackground(0x50fa7b, 0.3);  // Green, 0.3 seconds

// Pulse brightness on impact
engine.pulseExposure(0.4, 0.25);  // 0.4 intensity, 0.25 seconds

// Create atmosphere with fog
engine.setFogDensity(0.08);  // Direct value
```

---

### Example: Simple Power-Up Effect

```javascript
update(dt, engine, services) {
  const { cat, cameraRig, editor } = services;
  
  // If cat touches power-up block
  const block = detectCollision(cat);
  if (block && block.isPowerUp) {
    // Cinematic effect combo
    cameraRig.shake(0.3, 0.4);
    engine.flashBackground(0xffff00, 0.3);  // Yellow
    engine.pulseExposure(0.5, 0.4);
    
    editor.printOutput('⚡ POWERED UP!', 'success');
  }
}
```

---

## For Programmers: Tuning Player Movement

Edit `src/game/cat.js`:

```javascript
// Make movement snappier
this.acceleration = 50;      // Was 30 (faster response)
this.friction = 0.88;        // Was 0.92 (less slippery)
this.maxSpeed = 12;          // Was 10 (faster max)

// Or: Make movement more deliberate
this.acceleration = 15;      // Slower response
this.friction = 0.96;        // Grippier
this.maxSpeed = 7;           // Slower max
```

---

## For Programmers: Tuning Camera

Edit `src/main.js`:

```javascript
const cameraRig = new CameraRig(engine.camera, cat, {
  offset: new THREE.Vector3(0, 10, 15),    // Higher/further for cinematic
  lookAtOffset: new THREE.Vector3(0, 2, 0), // Look higher
  smoothFactor: 0.08,                      // Smoother (was 0.12)
});
```

**Smoothness Guide:**
- 0.05 = Very cinematic, laggy feel
- 0.12 = Balanced (default)
- 0.20+ = Snappy, tight feel

---

## Common Effects Patterns

### Impact Feedback
```javascript
cameraRig.shake(0.25, 0.2);
engine.pulseExposure(0.2, 0.2);
```

### Success/Victory
```javascript
cameraRig.shake(0.4, 0.5);
engine.flashBackground(0x50fa7b, 0.4);  // Green
engine.pulseExposure(0.5, 0.4);
```

### Danger/Warning
```javascript
cameraRig.shake(0.5, 0.3);
engine.flashBackground(0xff0000, 0.25);  // Red
```

### Cinematic Moment
```javascript
engine.setFogDensity(0.06);
cameraRig.shake(0.15, 0.8);
engine.flashBackground(0x0000ff, 0.6);  // Blue
```

### Fog Transition
```javascript
// Entering spooky area
engine.setFogDensity(0.12);  // Thicker fog

// Exiting spooky area
engine.setFogDensity(0.025); // Normal fog
```

---

## Debugging

**Camera not shaking?**
```javascript
// Make sure you're using services.cameraRig
services.cameraRig.shake(0.5, 0.5);  // ✅ Correct
engine.cameraRig.shake(0.5, 0.5);    // ❌ Wrong
```

**Effects not visible?**
```javascript
// Use more intense values
engine.pulseExposure(0.5, 0.3);  // More noticeable
engine.flashBackground(0xff0000, 0.5);  // More visible
```

**Movement feels wrong?**
```javascript
// Check the cat parameters
console.log(cat.maxSpeed);      // Should be ~10
console.log(cat.acceleration);  // Should be ~30
console.log(cat.friction);      // Should be ~0.92
```

---

## Files to Know

- **src/game/cameraRig.js** - Camera system (don't edit usually)
- **src/game/cat.js** - Player movement (tune physics here)
- **src/main.js** - Camera config (change offset/smoothness here)
- **src/purr/engine.js** - Effect methods (don't edit)
- **Your level files** - Where you call the APIs

---

## Next: Create Your First Effect Level

1. Create `src/levels/myEffectLevel.js`
2. Copy structure from `src/levels/cameraShakeDemo.js`
3. Add your effects using the APIs above
4. Register in `src/levels/index.js`
5. Test!

See `GAMEFEEL_UPGRADE.md` for complete reference.

---

Done! Have fun creating amazing game feel!
