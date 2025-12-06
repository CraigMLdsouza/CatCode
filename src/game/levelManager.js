// src/game/levelManager.js
import { LevelRegistry } from '../levels/index.js';

export class LevelManager {
  constructor(engine, services) {
    this.engine = engine;
    this.services = services;
    this.currentEntry = null;
  }

  loadLevelById(id) {
    const entry = LevelRegistry.find((l) => l.id === id);
    if (!entry) {
      if (this.services.terminal) {
        this.services.terminal.error(`Level not found: ${id}`);
      } else {
        console.error(`Level not found: ${id}`);
      }
      return;
    }

    this.currentEntry = entry;

    const levelInstance = entry.create();
    this.engine.setLevel(levelInstance);
  }

  getCurrentMeta() {
    return this.currentEntry;
  }
}
