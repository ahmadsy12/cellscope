import * as THREE from 'three';

export function projectByHand(i) {
  const { camera, points, renderer } = window.cs;
  const pos = points.geometry.attributes.position;
  const v = new THREE.Vector4(pos.getX(i), pos.getY(i), pos.getZ(i), 1);
  camera.updateMatrixWorld();

  console.log('1. model space:', v.clone());

  v.applyMatrix4(points.matrixWorld);
  console.log('2. world space:', v.clone());

  v.applyMatrix4(camera.matrixWorldInverse);
  console.log('3. view space:', v.clone());

  v.applyMatrix4(camera.projectionMatrix);
  console.log('4. clip space:', v.clone());

  const ndc = new THREE.Vector3(v.x / v.w, v.y / v.w, v.z / v.w);
  console.log('5. NDC:', ndc);

  const canvas = renderer.domElement;
  const pixelX = (ndc.x * 0.5 + 0.5) * canvas.width;
  const pixelY = (1 - (ndc.y * 0.5 + 0.5)) * canvas.height;
  console.log('6. pixels:', pixelX, pixelY);

  const ref = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).project(camera);
  console.log('library NDC:', ref);
}