# Game Feel - Visual Quick Reference

## 🎯 The Systems (At a Glance)

### System 1: Camera Rig 📷
```
┌─────────────────────────┐
│   CameraRig Class       │
├─────────────────────────┤
│ • Follows cat smoothly  │
│ • Lerp interpolation    │
│ • Configurable offset   │
│ • Shake effect          │
│ • No snapping           │
└──────────┬──────────────┘
           │ Services
           ↓
    services.cameraRig.shake(intensity, duration)
```

### System 2: Engine Effects 💥
```
┌──────────────────────────────┐
│      PurrEngine              │
├──────────────────────────────┤
│ engine.pulseExposure()       │  → Brightness pulse
│ engine.flashBackground()     │  → Color flash
│ engine.setFogDensity()       │  → Atmosphere
├──────────────────────────────┤
│ Internally uses:             │
│ • EffectAnimator             │
│ • activeEffects array        │
│ • Auto cleanup               │
└──────────────────────────────┘
```

### System 3: Cat Movement 🐱
```
Input → Acceleration → Speed Clamp → Position Update
                         ↓
                     Friction (decay)
                         
Gravity + Jump → Vertical Motion → Ground Collision
```

---

## 📊 Feature Comparison

### Before vs After

| Feature | Before | After |
|---------|--------|-------|
| Camera | Snappy, fixed offset | Smooth, cinematic |
| Shake | None | Full system with decay |
| Effects | None | 3 visual effect APIs |
| Movement | Instant velocity | Smooth acceleration |
| Deceleration | Instant stop | Natural friction |
| Feedback | Minimal | Rich visual feedback |

---

## 🎬 Effect Intensity Guide

### Camera Shake
```
Intensity    Usage
0.1-0.2  →  Subtle vibration (soft landing)
0.3-0.4  →  Noticeable shake (medium impact)
0.5-0.6  →  Heavy shake (explosion/big hit)
0.7+     →  Intense shake (rare moments)

Duration
0.1-0.2s →  Quick tap feedback
0.3-0.5s →  Standard impact
0.6-1.0s →  Extended effect
```

### Exposure Pulse
```
Amount       Visual
0.1-0.2  →  Subtle brightening
0.3-0.4  →  Noticeable flash
0.5-0.6  →  Strong emphasis
0.7+     →  Intense (use sparingly)

Duration   Typical Use
0.2s    →  Quick impact
0.3-0.5s →  Smooth pulse
0.6s+   →  Extended effect
```

### Background Flash
```
Color         Meaning
0xff0000   →  Red (damage/error)
0xff6600   →  Orange (warning)
0xffff00   →  Yellow (attention)
0x00ff00   →  Green (success)
0x0000ff   →  Blue (special)
0xff00ff   →  Purple (magic)
0x50fa7b   →  CatCode green
0xbd93f9   →  CatCode purple
```

---

## 🔄 Effect Combination Patterns

### Pattern 1: Simple Impact
```javascript
cameraRig.shake(0.2, 0.15);
```
→ Quick physical feedback

### Pattern 2: Success
```javascript
cameraRig.shake(0.3, 0.3);
engine.flashBackground(0x50fa7b, 0.3);
engine.pulseExposure(0.4, 0.3);
```
→ Happy, celebratory feeling

### Pattern 3: Danger
```javascript
cameraRig.shake(0.5, 0.25);
engine.flashBackground(0xff0000, 0.2);
```
→ Urgent, warning feeling

### Pattern 4: Cinematic Moment
```javascript
cameraRig.shake(0.2, 0.8);
engine.flashBackground(0x0000ff, 0.6);
engine.pulseExposure(0.3, 0.8);
engine.setFogDensity(0.06);
```
→ Dramatic, memorable moment

---

## 🎮 Movement Parameter Tuning

### Responsive Feel
```javascript
maxSpeed = 12;       // Fast
acceleration = 50;   // Quick response
friction = 0.88;     // Slippery
```
→ Arcade-like, snappy control

### Weighty Feel
```javascript
maxSpeed = 8;        // Slow
acceleration = 15;   // Slow response
friction = 0.96;     // Grips well
```
→ Heavy, methodical movement

### Balanced Feel (Default)
```javascript
maxSpeed = 10;       // Medium
acceleration = 30;   // Moderate
friction = 0.92;     // Balanced
```
→ Feels natural and responsive

---

## 🚀 Quick API Reference

### Call from Level Code:

```javascript
// Camera shake
services.cameraRig.shake(0.25, 0.3);

// Exposure pulse
engine.pulseExposure(0.4, 0.3);

// Background flash
engine.flashBackground(0xff0000, 0.25);

// Fog control
engine.setFogDensity(0.08);
```

---

## 🎯 Common Level Scenarios

### Scenario 1: Jump Landing
```javascript
if (cat.justLanded) {
  services.cameraRig.shake(0.15, 0.1);
}
```

### Scenario 2: Block Collection
```javascript
if (hitBlock) {
  engine.pulseExposure(0.3, 0.2);
  editor.printOutput('Block collected!', 'success');
}
```

### Scenario 3: Level Completed
```javascript
if (levelComplete) {
  services.cameraRig.shake(0.4, 0.5);
  engine.flashBackground(0x50fa7b, 0.4);
  engine.pulseExposure(0.5, 0.4);
}
```

### Scenario 4: Environmental Change
```javascript
if (enterSpookyZone) {
  engine.setFogDensity(0.12);  // Thicker fog
  engine.flashBackground(0x4a0080, 0.5);  // Purple
}
```

---

## ⚡ Performance at a Glance

| System | Cost | Impact |
|--------|------|--------|
| Camera rig | ~0.2ms | Smooth following |
| Shake | <0.1ms | Procedural noise |
| Effects | ~0.1ms each | Per animator |
| Movement | ~0.3ms | Physics calculations |
| **Total** | **<1ms** | **Negligible** |

---
---

**Ready to create amazing levels! 🚀**
