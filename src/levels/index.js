// src/levels/index.js
import * as A1 from './arrays01.js';
import * as A2 from './arrays02.js';
export const LevelRegistry = [
  {
    ...A1.meta,
    create: A1.createLevel
  },
  {
    ...A2.meta,
    create: A2.createLevel
  },
];
