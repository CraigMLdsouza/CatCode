// src/purr/input.js
//
// Basic keyboard input handler for Purr.
// Returns a simple state object you can read anywhere.

export function createInput() {
  const state = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false
  };

  function onKeyDown(e) {
    switch (e.key) {
      case 'w':
      case 'ArrowUp':
        state.up = true;
        break;
      case 's':
      case 'ArrowDown':
        state.down = true;
        break;
      case 'a':
      case 'ArrowLeft':
        state.left = true;
        break;
      case 'd':
      case 'ArrowRight':
        state.right = true;
        break;
      case ' ':
        state.jump = true;
        break;
    }
  }

  function onKeyUp(e) {
    switch (e.key) {
      case 'w':
      case 'ArrowUp':
        state.up = false;
        break;
      case 's':
      case 'ArrowDown':
        state.down = false;
        break;
      case 'a':
      case 'ArrowLeft':
        state.left = false;
        break;
      case 'd':
      case 'ArrowRight':
        state.right = false;
        break;
      case ' ':
        state.jump = false;
        break;
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // In case you want to clean up later
  state._destroy = () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };

  return state;
}
