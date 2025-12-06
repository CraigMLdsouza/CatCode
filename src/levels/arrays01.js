// src/levels/arrays01.js
// Story level: "The Bridge of Indexes"
// Proper bridge, collidable blocks, code-gated passage, improved graphics, and in-world tooltips.

import {
  createGround,
  createArrayBlocks,
  getBlockUnderCat,
  checkCollisions,
  createCollider,
} from '../game/levelUtils.js';
import * as THREE from 'three';

export const meta = {
  id: 'arrays-01',
  title: 'The Bridge of Indexes',
  difficulty: 'easy',
  tags: ['arrays', 'indexing', 'platform', 'story'],
  mode: 'platform',
  description:
    'A bridge over the Data Abyss is unstable. Pass the tests to stabilize it, then cross to arr[2].'
};

function makeLabelSprite(text, options = {}) {
  const {
    font = '12px JetBrains Mono, monospace',
    padding = 8,
    textColor = '#f8f8f2',
    bgColor = 'rgba(10,10,20,0.9)',
    borderColor = '#44475a',
    borderWidth = 1,
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  ctx.font = font;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = 14; // approx for 12px

  const w = textWidth + padding * 2;
  const h = textHeight + padding * 2;

  canvas.width = w * 2;
  canvas.height = h * 2;

  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.roundRect(0.5, 0.5, w - 1, h - 1, 6);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padding, h / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  const aspect = w / h;
  const baseHeight = 0.4;
  sprite.scale.set(baseHeight * aspect, baseHeight, 1);

  return sprite;
}

export function createLevel() {
  let ground = null;
  let blocks = [];
  let abyss = null;
  let bridgeDeck = null;
  let rails = [];
  let supports = [];
  let blockColliders = [];
  let lastSafePos = new THREE.Vector3();

  let solvedMovement = false;
  let solvedCode = false;

  const values = [10, 20, 30, 40, 50];
  const targetIndex = 2;

  // Gate between left side and target tile
  let gateX = null;
  let gateMessageShown = false;

  // Visual / label helpers
  let blockLabels = [];
  let gateLabelLocked = null;
  let gateLabelOpen = null;
  let extraLights = [];

  function allSolved() {
    return solvedMovement && solvedCode;
  }

  return {
    id: meta.id,
    title: meta.title,

    build(engine, services) {
      const { cat, editor, hud, skins } = services || {};

      solvedMovement = false;
      solvedCode = false;
      gateMessageShown = false;
      gateX = null;

      blockLabels = [];
      extraLights = [];

      const arenaSkin = skins ? skins.getEquippedArenaSkin() : null;

      // --- 1) Main platform + abyss ---
      ground = createGround(engine.scene, arenaSkin);

      const abyssGeo = new THREE.PlaneGeometry(80, 80);
      const abyssMat = new THREE.MeshStandardMaterial({
        color: 0x050509,
        emissive: 0x000000,
        metalness: 0.3,
        roughness: 0.95,
      });
      abyss = new THREE.Mesh(abyssGeo, abyssMat);
      abyss.rotation.x = -Math.PI / 2;
      abyss.position.y = -4;
      engine.scene.add(abyss);

      // --- 2) Bridge deck spanning the abyss ---
      const span = (values.length - 1) * 1.8 + 4; // little padding
      const deckGeo = new THREE.BoxGeometry(span, 0.25, 2.0);
      const deckMat = new THREE.MeshStandardMaterial({
        color: arenaSkin?.groundColor ?? 0x1e1e2f,
        metalness: 0.3,
        roughness: 0.5,
      });
      bridgeDeck = new THREE.Mesh(deckGeo, deckMat);
      bridgeDeck.position.set(0, 0.4, 0);
      bridgeDeck.castShadow = true;
      bridgeDeck.receiveShadow = true;
      engine.scene.add(bridgeDeck);

      // --- 3) Rails ---
      rails = [];
      function createRail(zOffset) {
        const railGeo = new THREE.BoxGeometry(span, 0.12, 0.1);
        const railMat = new THREE.MeshStandardMaterial({
          color: arenaSkin?.accentColor ?? 0xbd93f9,
          emissive: arenaSkin?.accentColor ?? 0xbd93f9,
          emissiveIntensity: 0.4,
        });
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(0, 0.85, zOffset);
        rail.castShadow = false;
        rail.receiveShadow = false;
        engine.scene.add(rail);
        rails.push(rail);
      }
      createRail(0.95);
      createRail(-0.95);

      // --- 4) Supports down into the abyss ---
      supports = [];
      const supportCount = 4;
      for (let i = 0; i < supportCount; i++) {
        const t = i / (supportCount - 1);
        const x = -span / 2 + 1.0 + t * (span - 2.0);
        const supportGeo = new THREE.BoxGeometry(0.3, 4, 0.3);
        const supportMat = new THREE.MeshStandardMaterial({
          color: 0x111118,
          metalness: 0.1,
          roughness: 0.8,
        });
        const support = new THREE.Mesh(supportGeo, supportMat);
        support.position.set(x, -1.6, 0);
        support.castShadow = true;
        support.receiveShadow = true;
        engine.scene.add(support);
        supports.push(support);
      }

      // --- 5) Array tiles on the bridge ---
      blocks = createArrayBlocks(
        engine.scene,
        values,
        { z: 0, y: 0.65, spacing: 1.8 },
        arenaSkin
      );

      // Emphasize target index tile
      const targetBlock = blocks[targetIndex];
      if (targetBlock) {
        targetBlock.mesh.position.y += 0.1;
        if (targetBlock.mesh.material && targetBlock.mesh.material.emissive) {
          targetBlock.mesh.material.emissive.setHex(0x50fa7b);
          targetBlock.mesh.material.emissiveIntensity = 0.7;
        }
      }

      // --- 6) Compute gate position between blocks[1] and blocks[2] ---
      if (blocks[1] && blocks[2]) {
        const x1 = blocks[1].mesh.position.x;
        const x2 = blocks[2].mesh.position.x;
        gateX = (x1 + x2) / 2;
      } else {
        gateX = null;
      }

      // --- 7) Colliders for blocks ---
      blockColliders = [];
      blocks.forEach((b) => {
        const col = createCollider(engine.scene, {
          position: [b.mesh.position.x, b.mesh.position.y + 0.15, b.mesh.position.z],
          size: [1.2, 0.6, 1.2],
          collisionRadius: 0.9,
          visible: false,
          castShadow: false,
          receiveShadow: false,
        });
        blockColliders.push(col);
      });

      // --- 8) Floating labels above each block: "arr[i]" ---
      blockLabels = [];
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const isTarget = i === targetIndex;
        const labelText = isTarget ? `arr[${i}]  (TARGET)` : `arr[${i}]`;

        const label = makeLabelSprite(labelText, {
          textColor: isTarget ? '#50fa7b' : '#f8f8f2',
          bgColor: isTarget ? 'rgba(5,20,10,0.95)' : 'rgba(10,10,20,0.9)',
          borderColor: isTarget ? '#50fa7b' : '#44475a',
        });
        label.position.set(b.mesh.position.x, b.mesh.position.y + 0.8, b.mesh.position.z);
        label.renderOrder = 999;
        engine.scene.add(label);
        blockLabels.push(label);
      }

      // --- 9) Gate tooltip sprites: locked and open states ---
      if (gateX !== null) {
        gateLabelLocked = makeLabelSprite('⛔ GATE LOCKED – solve code', {
          textColor: '#ff5555',
          bgColor: 'rgba(40,5,10,0.95)',
          borderColor: '#ff5555',
        });
        gateLabelLocked.position.set(gateX, 1.6, 0);
        gateLabelLocked.renderOrder = 1000;
        engine.scene.add(gateLabelLocked);

        gateLabelOpen = makeLabelSprite('✅ GATE OPEN – cross to arr[2]', {
          textColor: '#50fa7b',
          bgColor: 'rgba(5,20,10,0.95)',
          borderColor: '#50fa7b',
        });
        gateLabelOpen.position.copy(gateLabelLocked.position);
        gateLabelOpen.visible = false;
        gateLabelOpen.renderOrder = 1000;
        engine.scene.add(gateLabelOpen);
      }

      // --- 10) Extra lighting near the bridge for nicer look ---
      const leftLight = new THREE.PointLight(0xbd93f9, 0.6, 30);
      leftLight.position.set(-span / 2, 3.5, 4);
      engine.scene.add(leftLight);

      const rightLight = new THREE.PointLight(0x50fa7b, 0.6, 30);
      rightLight.position.set(span / 2, 3.5, -4);
      engine.scene.add(rightLight);

      extraLights.push(leftLight, rightLight);

      // --- 11) Place cat on the left side of the bridge ---
      if (cat) {
        if (cat.mesh && !engine.scene.children.includes(cat.mesh)) {
          engine.scene.add(cat.mesh);
        }

        const startBlock = blocks[0];
        cat.position.set(startBlock.mesh.position.x, 1.2, startBlock.mesh.position.z - 0.2);
        cat.velocity.set(0, 0, 0);
        cat.mesh.position.copy(cat.position);

        lastSafePos.copy(cat.position);
      }

      if (hud) {
        hud.setLevelTitle(meta.title);
      }

      if (editor) {
        editor.clearOutput();
        editor.printOutput('✨ Story: The Bridge of Indexes ✨', 'system');
        editor.printOutput(
          'A narrow bridge spans the Data Abyss. Each tile is an element in an array.',
          'info'
        );
        editor.printOutput(
          `World array: [${values.join(', ')}] (indices 0..${values.length - 1})`,
          'info'
        );
        editor.printOutput(
          'Look above the tiles: each one is labeled arr[i]. The green one is your target.',
          'hint'
        );
        editor.printOutput(
          'Code gate: the right side of the bridge is blocked until your code passes all tests.',
          'hint'
        );
        editor.printOutput(
          'Movement: after the gate opens, reach arr[2] (the third tile).',
          'hint'
        );

        editor.setLanguage('js');
        editor.setCode(
`// The Bridge of Indexes
// Implement getThirdElement(arr) so it returns arr[2].
// Once tests pass, the gate in the bridge will unlock.

function getThirdElement(arr) {
  // TODO: return the third element (index 2)
}

// Quick test:
// console.log(getThirdElement([10, 20, 30, 40, 50])); // should be 30

def get_third_element(arr):
  # TODO in Python
  # return arr[2]
`
        );
      }
    },

    update(dt, engine, services) {
      const { cat, editor, hud } = services || {};
      if (!cat || !editor) return;

      // --- 1) Code gate: clamp cat before gate until code passes ---
      if (!solvedCode && gateX !== null && cat.position.x > gateX) {
        cat.position.x = gateX;
        cat.mesh.position.x = gateX;

        if (lastSafePos.x > gateX) {
          lastSafePos.x = gateX;
        }

        if (!gateMessageShown) {
          editor.printOutput(
            '⛔ The bridge is blocked here. Solve the code task to unlock the gate.',
            'hint'
          );
          gateMessageShown = true;
        }
      }

      // If code solved, visually switch gate labels
      if (solvedCode && gateLabelLocked && gateLabelOpen) {
        gateLabelLocked.visible = false;
        gateLabelOpen.visible = true;
      }

      // --- 2) Collision with blocks: keep cat on the bridge ---
      const collisions = checkCollisions(cat, blockColliders, 0.55);

      if (collisions.length > 0) {
        lastSafePos.copy(cat.position);
      } else {
        cat.position.lerp(lastSafePos, 0.25);
        cat.mesh.position.copy(cat.position);
      }

      // --- 3) Movement objective: reach arr[2] once gate is open ---
      if (!solvedMovement) {
        const hit = getBlockUnderCat(cat, blocks);
        if (!hit) return;

        const b = hit.block;

        if (b.index === targetIndex) {
          if (!solvedCode) {
            editor.printOutput(
              'You reached arr[2], but the gate should have been locked. Try solving the code first.',
              'hint'
            );
            return;
          }

          solvedMovement = true;
          editor.printOutput(
            `Movement success: you reached arr[${b.index}] = ${b.value} on the far side.`,
            'success'
          );

          services.coins = (services.coins || 0) + 20;
          if (hud) hud.setCoins(services.coins);
        } else {
          editor.printOutput(
            `You are on arr[${b.index}] = ${b.value}. That is not arr[${targetIndex}].`,
            'info'
          );
        }
      }

      // --- 4) Final reward once both movement + code are done ---
      if (allSolved()) {
        editor.printOutput(
          'All tests passed and the bridge is fully stable. +10 coins.',
          'system'
        );
        if (!services._arrays01Rewarded) {
          services._arrays01Rewarded = true;
          services.coins = (services.coins || 0) + 10;
          if (hud) hud.setCoins(services.coins);
        }
      }
    },

    async runUserCode({ code, lang, editor, ensurePyodide }) {
      const tests = [
        { input: [10, 20, 30, 40, 50], expected: 30 },
        { input: [1, 2, 3], expected: 3 },
        { input: [7, 8, 9, 10], expected: 9 },
      ];

      editor.printOutput('Running level tests...', 'dim');

      try {
        if (lang === 'python') {
          const pyodide = await ensurePyodide();
          await pyodide.runPythonAsync(code + '\n');

          for (const t of tests) {
            const pyArr = JSON.stringify(t.input);
            const result = await pyodide.runPythonAsync(
              `get_third_element(${pyArr})`
            );
            if (result !== t.expected) {
              editor.printOutput(
                `Test failed: get_third_element(${JSON.stringify(t.input)}) ` +
                  `expected ${t.expected}, got ${result}`,
                'error'
              );
              return;
            }
          }

          editor.printOutput('All Python tests passed!', 'success');
          solvedCode = true;
          return;
        } else {
          const wrapped = new Function(
            code +
              '\nreturn (typeof getThirdElement === "function" ? getThirdElement : null);'
          );
          const fn = wrapped();
          if (!fn) {
            editor.printOutput('Function getThirdElement(arr) is not defined.', 'error');
            return;
          }

          for (const t of tests) {
            const result = fn(t.input.slice());
            if (result !== t.expected) {
              editor.printOutput(
                `Test failed: getThirdElement(${JSON.stringify(t.input)}) ` +
                  `expected ${t.expected}, got ${result}`,
                'error'
              );
              return;
            }
          }

          editor.printOutput(
            'All JavaScript tests passed! The bridge gate unlocks.',
            'success'
          );
          solvedCode = true;
        }
      } catch (err) {
        editor.printOutput(String(err), 'error');
      }
    },

    destroy(engine) {
      if (ground) {
        engine.scene.remove(ground);
        ground = null;
      }
      if (abyss) {
        engine.scene.remove(abyss);
        abyss = null;
      }
      if (bridgeDeck) {
        engine.scene.remove(bridgeDeck);
        bridgeDeck = null;
      }
      rails.forEach(r => engine.scene.remove(r));
      rails = [];
      supports.forEach(s => engine.scene.remove(s));
      supports = [];
      blockColliders.forEach(c => engine.scene.remove(c));
      blockColliders = [];
      if (blocks && blocks.length) {
        for (const b of blocks) {
          engine.scene.remove(b.mesh);
        }
        blocks = [];
      }
      blockLabels.forEach(lbl => {
        if (lbl && lbl.parent) lbl.parent.remove(lbl);
        else if (lbl && lbl.parentNode) lbl.parentNode.remove(lbl);
        else if (lbl && lbl.parent) lbl.parent.remove(lbl);
        engine.scene.remove(lbl);
      });
      blockLabels = [];
      if (gateLabelLocked) {
        engine.scene.remove(gateLabelLocked);
        gateLabelLocked = null;
      }
      if (gateLabelOpen) {
        engine.scene.remove(gateLabelOpen);
        gateLabelOpen = null;
      }
      extraLights.forEach(l => engine.scene.remove(l));
      extraLights = [];
    },

    hint(editor) {
      if (!editor) return;
      editor.printOutput(
        'Hint: arrays are 0-indexed. Index 2 is the third element.',
        'hint'
      );
      editor.printOutput(
        'JS: function getThirdElement(arr) { return arr[2]; }',
        'dim'
      );
      editor.printOutput(
        'Python: def get_third_element(arr): return arr[2]',
        'dim'
      );
      editor.printOutput(
        'Look at the labels above the tiles: the green "arr[2] (TARGET)" is your goal.',
        'dim'
      );
    },

    explain(editor) {
      if (!editor) return;
      editor.printOutput(
        'Explanation: arr[2] refers to the third element. ' +
          'The in-world labels mirror the array indices visually: arr[0], arr[1], arr[2], ...',
        'system'
      );
    }
  };
}
