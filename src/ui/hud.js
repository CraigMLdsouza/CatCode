// src/ui/hud.js
// Tiny HUD showing level title and coins.

export class HUD {
  constructor(rootEl) {
    this.root = rootEl;
    this.levelTitle = '';
    this.coins = 0;
    this.render();
  }

  setLevelTitle(title) {
    this.levelTitle = title || '';
    this.render();
  }

  setCoins(coins) {
    this.coins = coins || 0;
    this.render();
  }

  render() {
    this.root.textContent = `Level: ${this.levelTitle || '—'} | Coins: ${this.coins}`;
  }
}
