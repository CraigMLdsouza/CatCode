# CatCode 
<img width="512" height="512" alt="catcode" src="https://github.com/user-attachments/assets/3dc66b93-841a-4fd3-9cc2-57e15f736371" />

CatCode is an open-source, browser-based 3D game where you learn Data Structures & Algorithms (DSA) by guiding a cat through interactive levels and solving real coding problems.

# How to run locally?

- If you have python installed: (recommended)
```bash
git clone https://github.com/CraigMLdsouza/CatCode.git
python -m http.server 8000
```
Then Open http://localhost:8000/ on a browser of your choice.

- Else:
Use Live server extension to achieve the same result.

## Overview

Each level combines:

- Physical gameplay (movement, puzzles, exploration)
- Real code execution (JavaScript & Python)
- Automatic test-based evaluation
- DSA concepts (Arrays, Strings, Hash Maps, Logic)

Built on top of a custom lightweight game engine called **Purr** (Programmable Underlying Resource Runner).

## Features

### Gameplay & Learning

- 3D Cat Character with physics-based movement (WASD + Jump)
- Interactive Levels that visually represent DSA problems
- In-Game Code Editor (based on CodeMirror)
- Real-time Evaluation with automated test cases
- Hint & Explain System for when you get stuck

### Engine & Visuals (Purr Engine)

- Cinematic Rendering using Three.js
- Advanced Post-Processing:
  - Bloom (Neon/Glow effects)
  - SSAO (Screen Space Ambient Occlusion for depth)
  - FXAA (Anti-aliasing)
  - Filmic Tone Mapping
  - Dynamic Lighting with soft shadows and rim lighting

### Language Support

- JavaScript (Native ES6 execution)
- Python (Full support via Pyodide Wasm)

## Tech Stack

- **Three.js** – 3D Rendering & Scene Graph
- **CodeMirror** – Embedded Code Editor
- **Pyodide** – Python Runtime in WebAssembly
- **Vanilla JavaScript** (ES Modules) – No bundlers, no frameworks
- **HTML5 / CSS3** – UI Overlay

**No backend required. 100% client-side.**

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/CraigMLdsouza/CatCode.git
cd catcode
```

### 2. Start a Local Server

Due to browser security policies (CORS) for ES Modules and WebAssembly, you must run CatCode using a local server. You cannot open `index.html` directly.

**Using Python:**

```bash
python -m http.server
```

**Using Node.js:**

```bash
npx serve
```

### 3. Play

Open your browser to:

```
http://localhost:8000
```


## How to Play

- **Move:** Use WASD or Arrow Keys. Space to jump.
- **Interact:** Approach terminals or obstacles to trigger coding challenges.
- **Solve:**
  - Open the Level Menu.
  - Read the DSA problem description.
  - Select your language (JS or Python).
  - Write your solution in the editor.
- **Run:** Click "Run Code" to execute against test cases.
- **Win:** Passing all tests unlocks the path or solves the level.

## Project Structure

```
catcode/
│
├── index.html           # Entry point (Import Map + UI)
├── README.md            # Documentation
│
└── src/
    ├── main.js          # Game bootstrapper
    │
    ├── purr/            # CORE ENGINE
    │   ├── engine.js    # Renderer, Post-Processing, Loop
    │   ├── input.js     # Input handling (Keyboard/Mouse)
    │
    ├── game/            # GAMEPLAY LOGIC
    │   ├── cat.js       # Player controller
    │   ├── levelManager.js
    │
    ├── ui/              # INTERFACE
    │   ├── codeEditor.js
    │   ├── hud.js
    │
    └── levels/          # CONTENT
        ├── arrays01.js  # "Two Sum" level
        ├── arrays02.js
        └── index.js     # Level registry
```


## Creating a New Level

A level in CatCode is a JavaScript module that exports a `meta` object and a `createLevel()` factory function. It interacts with the game world, editor, and HUD.

### Level File Structure

Create a file under `src/levels/`, e.g., `src/levels/arrays03.js`.

### Basic Skeleton

```javascript
// src/levels/arrays03.js
import { createGround, createArrayBlocks, getBlockUnderCat } from '../game/levelUtils.js';

export const meta = {
  id: 'arrays-03',
  title: 'Arrays – Example Level',
  difficulty: 'easy',         // "easy" | "medium" | "hard"
  tags: ['arrays', 'example'], // used for search/filter
  mode: 'platform',            // "platform", "code", "hybrid"
  description: 'Short description shown in the browser.'
};

export function createLevel() {
  // Private state for this level instance
  let ground = null;
  let blocks = [];

  return {
    id: meta.id,
    title: meta.title,

    // Called once when the level is loaded
    build(engine, services) {
      const { cat, editor, hud } = services || {};

      // Set up world
      ground = createGround(engine.scene);
      blocks = createArrayBlocks(engine.scene, [1, 2, 3, 4], { z: 0, y: 0.5 });

      // Place cat
      if (cat) {
        cat.position.set(0, 1, -5);
        cat.velocity.set(0, 0, 0);
        cat.mesh.position.copy(cat.position);
      }

      // HUD + Editor setup
      if (hud) hud.setLevelTitle(meta.title);
      if (editor) {
        editor.clearOutput();
        editor.printOutput(meta.title, 'system');
        editor.printOutput(meta.description);
      }
    },

    // Called every frame (dt = delta time)
    update(dt, engine, services) {
      const { cat, editor } = services || {};
      if (!cat || !editor) return;

      // Example: check if cat is standing on a block
      const hit = getBlockUnderCat(cat, blocks);
      if (hit) {
        editor.printOutput(`You are on index ${hit.block.index}`, 'info');
      }
    },

    // Optional: custom code runner with tests
    async runUserCode({ code, lang, editor, ensurePyodide, services, engine }) {
       // Implement tests here (see Logic section below)
    },

    // Hint button
    hint(editor) {
      if (editor) editor.printOutput('Hint: arrays are 0-indexed.', 'hint');
    },

    // Explain button
    explain(editor) {
      if (editor) editor.printOutput('Explanation: Logic goes here.', 'system');
    },

    // Cleanup when switching away from this level
    destroy(engine) {
      if (ground) {
        engine.scene.remove(ground);
        ground = null;
      }
      if (blocks && blocks.length) {
        for (const b of blocks) engine.scene.remove(b.mesh);
        blocks = [];
      }
    }
  };
}
```

### Metadata (`meta`)

The `meta` object controls how the level appears in the Level Browser:

- **`id`:** Unique identifier string.
- **`title`:** Display name.
- **`difficulty`:** Used for labeling and filtering.
- **`tags`:** Array of strings for search.
- **`mode`:** Hints at gameplay style (platform, code, hybrid).

### Lifecycle Methods

- **`build(engine, services)`:** Called on load. Setup scene objects, position the cat, and initialize UI.
- **`update(dt, engine, services)`:** Called every frame. Handle gameplay logic like collisions or triggers.
- **`runUserCode({ ... })`:** Called when the user clicks "Run". Execute code (JS/Python), compare results against test cases, and provide feedback.
- **`destroy(engine)`:** Called on unload. Crucial: Remove all meshes created in `build()` to prevent memory leaks and ghost objects.

### Services

The `services` object is passed into level methods and contains shared game state:

```javascript
const services = {
  cat,       // Cat entity (position, velocity, mesh)
  hud,       // HUD controller (setLevelTitle, setCoins)
  editor,    // CodeEditor instance (setCode, printOutput)
  coins: 0   // Global coin counter
};
```

### Utilities (`levelUtils.js`)

Helpers are available in `src/game/levelUtils.js` to simplify Three.js operations:

- **`createGround(scene)`:** Adds a base plane.
- **`createArrayBlocks(scene, values, options)`:** Creates visual array platforms.
- **`getBlockUnderCat(cat, blocks)`:** Detects which block the cat is standing on.

### Registering the Level

To make the level playable, add it to the registry in `src/levels/index.js`:

```javascript
import * as A3 from './arrays03.js'; // Import your new file

export const LevelRegistry = [
  // ... existing levels
  { ...A3.meta, create: A3.createLevel }, // Register here
];
```


## Roadmap

- [x] Core Engine (Purr) with Post-Processing
- [x] Level Browser & Test Harness
- [ ] Save System (LocalStorage/Cloud)
- [ ] New Biomes (Forest, Cyberpunk City, Desert)
- [ ] Multiplayer/Co-op puzzles
- [ ] Leaderboards

## Contributing

Contributions are welcome! Whether it's adding new DSA problems, improving the cat's animations, or optimizing the engine.

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Open a Pull Request.

## License

Distributed under the MIT License. See LICENSE for more information.
