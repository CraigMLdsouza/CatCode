// src/purr/effectAnimator.js
// Utility for animating engine visual effects over time

export class EffectAnimator {
  constructor(duration, onUpdate, onComplete = null) {
    this.duration = duration;
    this.elapsed = 0;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.finished = false;
  }

  update(dt) {
    if (this.finished) return;

    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.duration, 1);

    this.onUpdate(progress);

    if (progress >= 1) {
      this.finished = true;
      if (this.onComplete) this.onComplete();
    }
  }
}
