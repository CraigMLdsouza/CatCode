// src/main.js
import * as THREE from 'three';
import { PurrEngine } from './purr/engine.js';
import { createInput } from './purr/input.js';
import { createCatModel, applyCatSkinToModel } from './game/catModel.js';
import { Cat } from './game/cat.js';
import { CameraRig } from './game/cameraRig.js';
import { LevelManager } from './game/levelManager.js';
import { LevelRegistry } from './levels/index.js';
import { HUD } from './ui/hud.js';
import { initMenu } from './ui/menu.js';
import { CodeEditor } from './ui/codeEditor.js';
import { SkinsService } from './game/skins.js';
import { initShop } from './ui/shop.js';

const container = document.getElementById('game-container');
const hudEl = document.getElementById('hud');
const codePanel = document.getElementById('code-panel');

// 1) Engine + input
const engine = new PurrEngine(container);
const input = createInput();

console.log('Main loaded with CodeEditor + JS/Python runner...');

// 2) UI services
const hud = new HUD(hudEl);
const editor = new CodeEditor(codePanel);

// 3) Skins service
const skins = new SkinsService();

// 4) Cat
const { mesh: catMesh } = createCatModel(engine.scene);
const cat = new Cat(catMesh, input);
engine.addUpdatable(cat);

// Apply initial cat skin
const initialCatSkin = skins.getEquippedCatSkin();
applyCatSkinToModel(catMesh, initialCatSkin);

// 5) CAMERA RIG - Smooth follow camera with shake
const cameraRig = new CameraRig(engine.camera, cat, {
  offset: new THREE.Vector3(0, 6, 8),  // Closer camera
  lookAtOffset: new THREE.Vector3(0, 1.5, 0),
  smoothFactor: 0.12,
});
engine.addUpdatable(cameraRig);

// 6) Shared services for levels
const services = {
  cat,
  hud,
  editor,
  cameraRig, // Expose camera rig for levels
  skins,     // Expose skins for levels & shop
  coins: 200,
};

hud.setCoins(services.coins);
engine.attachServices(services);

// 7) Level manager
const levelManager = new LevelManager(engine, services);

// Auto-load first level
if (LevelRegistry.length > 0) {
  const first = LevelRegistry[0];
  levelManager.loadLevelById(first.id);
  hud.setLevelTitle(first.title);
  editor.printOutput(`Loaded level: ${first.title}`, 'system');
} else {
  editor.printOutput('No levels registered in LevelRegistry.', 'error');
}

// --- Pyodide setup for Python ---
let pyodideReadyPromise = null;
async function ensurePyodide() {
  if (!pyodideReadyPromise) {
    if (typeof loadPyodide !== 'function') {
      throw new Error('Pyodide script not loaded. Check your <script src="...pyodide.js"> tag.');
    }
    editor.printOutput('Loading Python runtime (Pyodide)...', 'dim');
    pyodideReadyPromise = loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });
  }
  return pyodideReadyPromise;
}

// 8) Wire editor buttons: Run with level-aware test harness

editor.onRun(async (code, lang) => {
  const level = engine.currentLevel;
  editor.printOutput(`> Running code in ${lang.toUpperCase()}...`, 'dim');

  // If level provides its own test harness, use that
  if (level && typeof level.runUserCode === 'function') {
    try {
      await level.runUserCode({ code, lang, editor, services, engine, ensurePyodide });
    } catch (err) {
      editor.printOutput(String(err), 'error');
    }
    return;
  }

  // Generic fallback runner
  try {
    if (lang === 'python') {
      const pyodide = await ensurePyodide();
      const result = await pyodide.runPythonAsync(code);
      if (result !== undefined) {
        editor.printOutput(String(result), 'success');
      } else {
        editor.printOutput('Python code ran successfully (no result).', 'success');
      }
    } else {
      const result = new Function(code)();
      if (result !== undefined) {
        editor.printOutput(String(result), 'success');
      } else {
        editor.printOutput('JS code ran successfully (no result).', 'success');
      }
    }
  } catch (err) {
    editor.printOutput(String(err), 'error');
  }
});

// Hint / Explain buttons delegate to level
editor.onHint(() => {
  const level = engine.currentLevel;
  if (level && typeof level.hint === 'function') {
    level.hint(editor);
  } else {
    editor.printOutput('No hint available for this level.', 'dim');
  }
});

editor.onExplain(() => {
  const level = engine.currentLevel;
  if (level && typeof level.explain === 'function') {
    level.explain(editor);
  } else {
    editor.printOutput('No explanation available for this level.', 'dim');
  }
});

// 9) Level select menu
initMenu({
  levelManager,
  levelRegistry: LevelRegistry,
  hud,
});

// 10) Shop UI
initShop({ skins, hud, services, engine });

// 11) Start engine (only once)
engine.start();
