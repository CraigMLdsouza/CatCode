# Creating a New Level

A level in CatCode is just a JavaScript module that:

- Exports a `meta` object (metadata for menus / search)
- Exports a `createLevel()` function that returns a level instance with specific methods
- Optionally uses:
  - The game world (ground, blocks, cat, etc.)
  - The editor (JS/Python code + tests)
  - HUD, coins, etc.

Then it's registered in `levels/index.js`.

## File Structure

Create a file under `src/levels/`, e.g.:

```
src/levels/
  arrays03.js
```

### Basic Skeleton

```javascript
// src/levels/arrays03.js
import { createGround, createArrayBlocks, getBlockUnderCat } from '../game/levelUtils.js';

export const meta = {
  id: 'arrays-03',
  title: 'Arrays – Example Level',
  difficulty: 'easy',           // "easy" | "medium" | "hard"
  tags: ['arrays', 'example'],  // used for search/filter
  mode: 'platform',             // e.g. "platform", "code", "hybrid"
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

      // Example: set up world
      ground = createGround(engine.scene);
      blocks = createArrayBlocks(engine.scene, [1, 2, 3, 4], { z: 0, y: 0.5 });

      // Example: place cat
      if (cat) {
        cat.position.set(0, 1, -5);
        cat.velocity.set(0, 0, 0);
        cat.mesh.position.copy(cat.position);
      }

      // Example: HUD + editor intro text
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
      // Implement tests here if the level has a coding component
    },

    // Hint button
    hint(editor) {
      if (!editor) return;
      editor.printOutput('Hint: This is just an example.', 'hint');
    },

    // Explain button
    explain(editor) {
      if (!editor) return;
      editor.printOutput('Explanation: Add real logic here.', 'system');
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

You can omit methods you don't need (`runUserCode`, `hint`, `explain`, etc.), but this is the full pattern.

## What `meta` Controls

`meta` is used by the level browser UI and search:

```javascript
export const meta = {
  id: 'arrays-02',                     // must be unique
  title: 'Arrays – Sum elements',      // shown in menu & HUD
  difficulty: 'easy',                  // used for labels / filtering
  tags: ['arrays', 'sum', 'basics'],   // searchable tags
  mode: 'code',                        // e.g. "platform", "code", "hybrid"
  description: 'Write a function that returns the sum of all elements in the array.'
};
```

The browser uses this to:

- Render cards
- Highlight the current level
- Support text search (title, id, tags, difficulty, mode)

## Lifecycle Methods of a Level

A level instance (the object returned from `createLevel()`) can implement these:

### `build(engine, services)`

Called when the level is loaded or reloaded.

Use it to:

- Set up the 3D scene (ground, platforms, decorations)
- Position/reset the cat
- Initialize editor content and instructions
- Initialize internal state flags (solved, failed, etc.)

Example:

```javascript
build(engine, services) {
  const { cat, editor, hud } = services || {};

  ground = createGround(engine.scene);
  blocks = createArrayBlocks(engine.scene, [10, 20, 30], { z: 0, y: 0.5 });

  if (cat) {
    cat.position.set(0, 1, -5);
    cat.velocity.set(0, 0, 0);
    cat.mesh.position.copy(cat.position);
  }

  if (hud) hud.setLevelTitle(meta.title);

  if (editor) {
    editor.clearOutput();
    editor.printOutput(meta.title, 'system');
    editor.printOutput(meta.description);
  }
}
```

### `update(dt, engine, services)`

Called every frame. Use this for gameplay / world logic:

- Checking if the cat stands on a specific block
- Triggering success/failure
- Animating objects, opening doors, etc.

Example:

```javascript
update(dt, engine, services) {
  const { cat, editor, hud } = services || {};
  if (!cat || !editor) return;

  const hit = getBlockUnderCat(cat, blocks);
  if (!hit) return;

  if (hit.block.index === 2) {
    editor.printOutput('Nice! You found index 2.', 'success');
  }
}
```

### `async runUserCode({ code, lang, editor, ensurePyodide, services, engine })`

Optional. This is called when the player presses Run in the editor.

Use it to:

- Define test cases
- Execute code in JS or Python
- Compare actual vs expected
- Print results to the editor output

Example pattern (JS + Python):

```javascript
async runUserCode({ code, lang, editor, ensurePyodide }) {
  const tests = [
    { input: [1, 2, 3], expected: 6 },
    { input: [3, 5, 7, 10], expected: 25 },
  ];

  editor.printOutput('Running tests...', 'dim');

  try {
    if (lang === 'python') {
      const pyodide = await ensurePyodide();
      await pyodide.runPythonAsync(code + '\n');

      for (const t of tests) {
        const pyArr = JSON.stringify(t.input);
        const result = await pyodide.runPythonAsync(`sum_array(${pyArr})`);
        if (result !== t.expected) {
          editor.printOutput(
            `Test failed: sum_array(${JSON.stringify(t.input)}) expected ${t.expected}, got ${result}`,
            'error'
          );
          return;
        }
      }

      editor.printOutput('All Python tests passed!', 'success');
      return;
    } else {
      // JavaScript
      const wrapped = new Function(
        code + '\nreturn (typeof sumArray === "function" ? sumArray : null);'
      );
      const fn = wrapped();
      if (!fn) {
        editor.printOutput('Function sumArray(arr) is not defined.', 'error');
        return;
      }

      for (const t of tests) {
        const result = fn(t.input.slice());
        if (result !== t.expected) {
          editor.printOutput(
            `Test failed: sumArray(${JSON.stringify(t.input)}) expected ${t.expected}, got ${result}`,
            'error'
          );
          return;
        }
      }

      editor.printOutput('All JavaScript tests passed!', 'success');
    }
  } catch (err) {
    editor.printOutput(String(err), 'error');
  }
}
```

This is exactly how `arrays-01` and `arrays-02` are structured.

### `hint(editor)`

Called when the player clicks Hint.

```javascript
hint(editor) {
  if (!editor) return;
  editor.printOutput('Hint: arrays are 0-indexed. Index 2 is the third element.', 'hint');
}
```

### `explain(editor)`

Called when the player clicks Explain.

```javascript
explain(editor) {
  if (!editor) return;
  editor.printOutput(
    'Explanation: arr[2] is the third element. Your function should return arr[2].',
    'system'
  );
}
```

### `destroy(engine)`

Called when leaving the level.

You must remove any objects you added to the scene:

```javascript
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
```

## What's in `services`?

`services` is a shared object created in `main.js` and passed into levels. Right now, it looks roughly like this:

```javascript
const services = {
  cat,       // the cat entity (position, velocity, mesh)
  hud,       // HUD controller (setLevelTitle, setCoins)
  editor,    // CodeEditor instance (setCode, printOutput, etc.)
  coins: 0,  // numeric coin counter
  // you can add more in the future: shop, inventory, etc.
};
```

In a level, you'll typically use:

```javascript
build(engine, services) {
  const { cat, hud, editor } = services || {};
  // ...
}
```

## Using `levelUtils` for World Building

`src/game/levelUtils.js` provides helpers so you don't have to touch Three.js directly:

- **`createGround(scene, color?, size?)`** → Adds a plane under the cat
- **`createArrayBlocks(scene, values, options?)`** → Creates a row of array-like platforms with indices + values
- **`getBlockUnderCat(cat, blocks, radius?)`** → Helps you detect which block the cat is standing on

Example:

```javascript
import { createGround, createArrayBlocks, getBlockUnderCat } from '../game/levelUtils.js';

build(engine, services) {
  ground = createGround(engine.scene);
  blocks = createArrayBlocks(engine.scene, [10, 20, 30, 40], { z: 0, y: 0.5 });
}

update(dt, engine, services) {
  const { cat, editor } = services || {};
  const hit = getBlockUnderCat(cat, blocks);
  if (hit) {
    editor.printOutput(`You are on arr[${hit.block.index}] = ${hit.block.value}`, 'info');
  }
}
```

## Registering the Level

Finally, add your level to the registry so the Level Browser sees it.

In `src/levels/index.js`:

```javascript
// src/levels/index.js
import * as A1 from './arrays01.js';
import * as A2 from './arrays02.js';
import * as A3 from './arrays03.js';   // ⬅ your new file

export const LevelRegistry = [
  { ...A1.meta, create: A1.createLevel },
  { ...A2.meta, create: A2.createLevel },
  { ...A3.meta, create: A3.createLevel },  // ⬅ registered here
];
```

Now:

- It appears automatically in the level list
- It can be searched by tag/title
- It can be loaded and played via the menu
