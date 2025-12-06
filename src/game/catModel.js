// src/game/catModel.js
// Blocky cat mesh model (visuals only) + skin support

import * as THREE from 'three';

export function createCatModel(scene) {
  const Cat = new THREE.Group();

  // Store materials separately so skins can recolor them
  const bodyMats = [];
  const eyeMats = [];

  // --- BODY / BASE MATERIAL ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
  });
  bodyMats.push(bodyMat);

  // --- EYE MATERIAL ---
  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
  });
  eyeMats.push(eyeMat);

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1.2), bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  Cat.add(body);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.0, 0.7);
  Cat.add(headGroup);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), bodyMat);
  headGroup.add(head);

  // Ears
  const earGeo = new THREE.ConeGeometry(0.1, 0.25, 4);
  const earL = new THREE.Mesh(earGeo, bodyMat);
  earL.position.set(-0.18, 0.35, 0);
  earL.rotation.z = 0.3;
  earL.rotation.y = -0.2;
  headGroup.add(earL);

  const earR = new THREE.Mesh(earGeo, bodyMat);
  earR.position.set(0.18, 0.35, 0);
  earR.rotation.z = -0.3;
  earR.rotation.y = 0.2;
  headGroup.add(earR);

  // Eyes (planes)
  const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), eyeMat);
  eyeL.position.set(-0.12, 0.05, 0.26);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), eyeMat);
  eyeR.position.set(0.12, 0.05, 0.26);
  headGroup.add(eyeR);

  // If you want different mats for eyes later, push them individually:
  // eyeMats.push(eyeL.material, eyeR.material);

  // Tail (segmented)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.8, -0.6);
  Cat.add(tailGroup);
  Cat.userData.tail = [];

  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.25), bodyMat);
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, i === 0 ? 0 : -0.2);
    if (i === 0) tailGroup.add(pivot);
    else Cat.userData.tail[i - 1].add(pivot);
    seg.position.z = -0.12;
    pivot.add(seg);
    Cat.userData.tail.push(pivot);
  }

  // Legs
  const legGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
  Cat.userData.legs = [];
  [
    [-0.2, 0.6, 0.4],
    [0.2, 0.6, 0.4],
    [-0.2, 0.6, -0.4],
    [0.2, 0.6, -0.4],
  ].forEach((pos) => {
    const pivot = new THREE.Group();
    pivot.position.set(pos[0], pos[1], pos[2]);
    const leg = new THREE.Mesh(legGeo, bodyMat);
    leg.position.y = -0.3;
    leg.castShadow = true;
    pivot.add(leg);
    Cat.add(pivot);
    Cat.userData.legs.push(pivot);
  });

  // Expose mats for skinning
  Cat.userData.catMats = {
    body: bodyMats,
    eyes: eyeMats,
  };

  scene.add(Cat);

  return { mesh: Cat, materials: bodyMats };
}

/**
 * Apply a skin to the cat mesh.
 * Expected skin shape:
 * {
 *   baseColor: 0x..., // body
 *   eyeColor:  0x..., // eyes
 * }
 */
export function applyCatSkinToModel(catMesh, skin) {
  if (!catMesh || !catMesh.userData || !catMesh.userData.catMats || !skin) return;

  const { body, eyes } = catMesh.userData.catMats;

  if (body && skin.baseColor !== undefined) {
    body.forEach((mat) => {
      if (mat && mat.color) mat.color.setHex(skin.baseColor);
    });
  }

  if (eyes && skin.eyeColor !== undefined) {
    eyes.forEach((mat) => {
      if (mat && mat.color) mat.color.setHex(skin.eyeColor);
    });
  }
}
