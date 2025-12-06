// src/levels/arrays02.js
// Arrays – Sum all elements in the array.

import { createGround, createArrayBlocks } from '../game/levelUtils.js';

export const meta = {
  id: 'arrays-02',
  title: 'Arrays - Sum elements',
  difficulty: 'easy',
  tags: ['arrays', 'sum', 'basics'],
  mode: 'code',
  description: 'Write a function that returns the sum of all elements in the array.'
};

export function createLevel() {
  let ground = null;
  let blocks = [];

  // We'll visualize an example array in the world
  const sampleValues = [3, 5, 7, 10];

  return {
    id: meta.id,
    title: meta.title,

    build(engine, services) {
      const { cat, editor, hud } = services || {};

      // Basic ground + decorative array
      ground = createGround(engine.scene);
      blocks = createArrayBlocks(engine.scene, sampleValues, { z: 0, y: 0.5 });

      if (cat) {
        cat.position.set(blocks[0].mesh.position.x, 1, blocks[0].mesh.position.z - 5);
        cat.velocity.set(0, 0, 0);
        cat.mesh.position.copy(cat.position);
      }

      if (hud) {
        hud.setLevelTitle(meta.title);
      }

      if (editor) {
        editor.clearOutput();
        editor.printOutput(meta.title, 'system');
        editor.printOutput(meta.description);
        editor.printOutput(`Example array in the world: [${sampleValues.join(', ')}]`);
        editor.printOutput(
          'Task: Implement a function that returns the sum of all elements.',
          'hint'
        );
        editor.printOutput(
          'You can use either JavaScript or Python (switch at top-right).',
          'dim'
        );

        // Default JS template
        editor.setLanguage('js');
        editor.setCode(
`// Implement this function so that it returns
// the sum of all elements in the array.
function sumArray(arr) {
  // TODO
}

// You can test locally:
console.log(sumArray([1, 2, 3])); // 6`
        );
      }
    },

    destroy(engine) {
      if (ground) {
        engine.scene.remove(ground);
        ground = null;
      }
      if (blocks && blocks.length) {
        for (const b of blocks) {
          engine.scene.remove(b.mesh);
        }
        blocks = [];
      }
    },

    async runUserCode({ code, lang, editor, ensurePyodide }) {
      const tests = [
        { input: [], expected: 0 },
        { input: [1], expected: 1 },
        { input: [1, 2, 3], expected: 6 },
        { input: [3, 5, 7, 10], expected: 25 },
        { input: [-1, 1, -2, 2], expected: 0 },
      ];

      editor.printOutput('Running tests for sum of array...', 'dim');

      try {
        if (lang === 'python') {
          const pyodide = await ensurePyodide();

          await pyodide.runPythonAsync(code + '\n');

          for (const t of tests) {
            const pyArr = JSON.stringify(t.input);
            const result = await pyodide.runPythonAsync(
              `sum_array(${pyArr})`
            );
            if (result !== t.expected) {
              editor.printOutput(
                `Test failed: sum_array(${JSON.stringify(t.input)}) ` +
                `expected ${t.expected}, got ${result}`,
                'error'
              );
              return;
            }
          }

          editor.printOutput('All Python tests passed for sum_array!', 'success');
          return;
        } else {
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
                `Test failed: sumArray(${JSON.stringify(t.input)}) ` +
                `expected ${t.expected}, got ${result}`,
                'error'
              );
              return;
            }
          }

          editor.printOutput('All JavaScript tests passed for sumArray!', 'success');
        }
      } catch (err) {
        editor.printOutput(String(err), 'error');
      }
    },

    hint(editor) {
      if (!editor) return;
      editor.printOutput(
        'Hint: Initialize a variable to 0 and loop through the array, adding each element.',
        'hint'
      );
      editor.printOutput(
        'JS: let s = 0; for (const x of arr) s += x;',
        'dim'
      );
      editor.printOutput(
        'Python: s = 0; for x in arr: s += x',
        'dim'
      );
    },

    explain(editor) {
      if (!editor) return;
      editor.printOutput(
        'Explanation: The sum is just the total of all elements.\n' +
        'Iterate through the array, accumulate into a running total, and return it.\n' +
        'Edge cases: empty array should give 0.',
        'system'
      );
    }
  };
}
