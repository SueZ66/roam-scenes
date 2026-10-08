import {
  BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry,
  Euler, Float32BufferAttribute, Group, IcosahedronGeometry, Matrix4,
  Mesh, MeshStandardMaterial, Quaternion, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Landscape } from './types';

/** A little handmade valley. Everything is procedural and batched by material. */
export function createMeadow(): Landscape {
  const group = new Group();
  group.name = 'The Little Green Valley';
  let seed = 1978;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const materials = {
    grass: new MeshStandardMaterial({ color: '#91b96b', roughness: 1, flatShading: true, vertexColors: true }),
    rock: new MeshStandardMaterial({ color: '#8c9582', roughness: 1, flatShading: true, vertexColors: true }),
    earth: new MeshStandardMaterial({ color: '#758858', roughness: 1, flatShading: true }),
    bank: new MeshStandardMaterial({ color: '#73976b', roughness: 1 }),
    water: new MeshStandardMaterial({ color: '#66bbbd', roughness: 0.33, metalness: 0.08 }),
    foam: new MeshStandardMaterial({ color: '#b8e4cf', roughness: 0.7 }),
    wood: new MeshStandardMaterial({ color: '#a77650', roughness: 1, flatShading: true }),
    woodLight: new MeshStandardMaterial({ color: '#d3b48a', roughness: 1, flatShading: true }),
    woodDark: new MeshStandardMaterial({ color: '#655544', roughness: 1, flatShading: true }),
    plaster: new MeshStandardMaterial({ color: '#f2e8cc', roughness: 1, flatShading: true }),
    roof: new MeshStandardMaterial({ color: '#bd7459', roughness: 1, flatShading: true }),
    roofLight: new MeshStandardMaterial({ color: '#d68b69', roughness: 1, flatShading: true }),
    glass: new MeshStandardMaterial({ color: '#567f7b', roughness: 0.38, metalness: 0.13 }),
    foliage: new MeshStandardMaterial({ color: '#60855a', roughness: 1, flatShading: true }),
    foliageLight: new MeshStandardMaterial({ color: '#8fac64', roughness: 1, flatShading: true }),
    foliageDark: new MeshStandardMaterial({ color: '#476d55', roughness: 1, flatShading: true }),
    stone: new MeshStandardMaterial({ color: '#c3c3a6', roughness: 1, flatShading: true }),
    wool: new MeshStandardMaterial({ color: '#f6efda', roughness: 1, flatShading: true }),
    pink: new MeshStandardMaterial({ color: '#dfa184', roughness: 1, flatShading: true }),
    yellow: new MeshStandardMaterial({ color: '#ead17b', roughness: 1, flatShading: true }),
    leaf: new MeshStandardMaterial({ color: '#769358', roughness: 1, flatShading: true }),
  };
  type Mat = keyof typeof materials;
  const batches = new Map<Mat, BufferGeometry[]>();
  const add = (geometry: BufferGeometry, material: Mat, x: number, y: number, z: number,
    sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
    const rotation = new Quaternion().setFromEuler(new Euler(rx, ry, rz));
    geometry.applyMatrix4(new Matrix4().compose(new Vector3(x, y, z), rotation, new Vector3(sx, sy, sz)));
    const entries = batches.get(material) ?? [];
    entries.push(geometry);
    batches.set(material, entries);
  };
  const box = (material: Mat, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0, rz = 0) =>
    add(new BoxGeometry(w, h, d), material, x, y, z, 1, 1, 1, 0, ry, rz);
  const ball = (material: Mat, x: number, y: number, z: number, sx: number, sy: number, sz: number, detail = 0) =>
    add(new IcosahedronGeometry(1, detail), material, x, y, z, sx, sy, sz);
  const beam = (material: Mat, a: Vector3, b: Vector3, radius: number, sides = 5) => {
    const direction = b.clone().sub(a);
    const geometry = new CylinderGeometry(radius, radius, direction.length(), sides);
    geometry.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
    const middle = a.clone().add(b).multiplyScalar(0.5);
    add(geometry, material, middle.x, middle.y, middle.z);
  };
  const height = (x: number, z: number) => 0.34
    + 0.13 * Math.sin(x * 0.74 + z * 0.28)
    + 0.11 * Math.cos(z * 0.77)
    + 0.37 * Math.exp(-((x - 3.5) ** 2 + (z + 3.1) ** 2) / 7);
  const edge = (angle: number) => 7.12 + 0.28 * Math.sin(angle * 5 + 0.7) + 0.2 * Math.cos(angle * 3);
  const stream = (z: number) => 1.4 * Math.sin(z * 0.63) - 0.7;
  const positions: number[] = [];
  const colors: number[] = [];
  const tint = new Color();
  const triangle = (a: Vector3, b: Vector3, c: Vector3, shade: number) => {
    positions.push(...a.toArray(), ...b.toArray(), ...c.toArray());
    tint.setRGB(shade, shade, shade * (0.96 + random() * 0.07));
    for (let k = 0; k < 3; k++) colors.push(tint.r, tint.g, tint.b);
  };
  const rings = 13;
  const segments = 72;
  const point = (r: number, n: number) => {
    const angle = n / segments * Math.PI * 2;
    const radius = r / rings * edge(angle);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    return new Vector3(x, height(x, z), z);
  };
  for (let r = 0; r < rings; r++) {
    for (let n = 0; n < segments; n++) {
      const a = point(r, n); const b = point(r, n + 1);
      const c = point(r + 1, n); const d = point(r + 1, n + 1);
      if (r > 0) triangle(a, b, c, 0.94 + random() * 0.11);
      triangle(b, d, c, 0.94 + random() * 0.11);
    }
  }
  const terrain = new BufferGeometry();
  terrain.setAttribute('position', new Float32BufferAttribute(positions, 3));
  terrain.setAttribute('color', new Float32BufferAttribute(colors, 3));
  terrain.computeVertexNormals();
  const terrainMesh = new Mesh(terrain, materials.grass);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  group.add(terrainMesh);

  // Uneven strata taper into the underside of the floating island.
  const rockPositions: number[] = []; const rockColors: number[] = [];
  for (let ring = 0; ring < 3; ring++) {
    const scales = [1, 0.96, 0.83, 0.39];
    const ys = [0, -0.43, -1.5, -2.35];
    for (let n = 0; n < 36; n++) {
      const vertices: Vector3[] = [];
      for (const [r, index] of [[ring, n], [ring + 1, n], [ring + 1, n + 1], [ring, n + 1]]) {
        const angle = index! / 36 * Math.PI * 2;
        const radius = edge(angle) * scales[r!];
        const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius;
        vertices.push(new Vector3(x, r === 0 ? height(x, z) - 0.025 : ys[r!] + 0.15 * Math.sin(index! * 2.4), z));
      }
      rockPositions.push(...vertices[0].toArray(), ...vertices[2].toArray(), ...vertices[1].toArray(),
        ...vertices[0].toArray(), ...vertices[3].toArray(), ...vertices[2].toArray());
      const brightness = 0.77 + random() * 0.35;
      for (let t = 0; t < 6; t++) rockColors.push(brightness, brightness, brightness);
    }
  }
  const rock = new BufferGeometry();
  rock.setAttribute('position', new Float32BufferAttribute(rockPositions, 3));
  rock.setAttribute('color', new Float32BufferAttribute(rockColors, 3));
  rock.computeVertexNormals();
  const rockMesh = new Mesh(rock, materials.rock);
  rockMesh.castShadow = true; rockMesh.receiveShadow = true; group.add(rockMesh);
  add(new ConeGeometry(2.9, 0.7, 9), 'rock', 0, -2.55, 0, 1, 1, 1, Math.PI);

  const ribbon = (width: number, lift: number, material: Mat) => {
    const points: number[] = [];
    for (let n = 0; n < 82; n++) {
      const za = -6.36 + n / 82 * 12.73;
      const zb = -6.36 + (n + 1) / 82 * 12.73;
      const halfA = width * (1 + 0.33 * Math.exp(-((za - 3.9) ** 2) / 1.3));
      const halfB = width * (1 + 0.33 * Math.exp(-((zb - 3.9) ** 2) / 1.3));
      const a = [stream(za) - halfA, height(stream(za) - halfA, za) + lift, za];
      const b = [stream(za) + halfA, height(stream(za) + halfA, za) + lift, za];
      const c = [stream(zb) - halfB, height(stream(zb) - halfB, zb) + lift, zb];
      const d = [stream(zb) + halfB, height(stream(zb) + halfB, zb) + lift, zb];
      points.push(...a, ...c, ...b, ...b, ...c, ...d);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
    geometry.computeVertexNormals();
    add(geometry, material, 0, 0, 0);
  };
  ribbon(0.62, 0.032, 'bank'); ribbon(0.48, 0.055, 'water');
  for (let n = 0; n < 31; n++) {
    const z = -5.9 + random() * 11.8; const x = stream(z) + (random() - 0.5) * 0.53;
    box('foam', x, height(x, z) + 0.079, z, 0.11 + random() * 0.15, 0.008, 0.024, -0.3);
  }
  // A few smooth river stones anchor the creek into the landscape.
  for (let n = 0; n < 30; n++) {
    const z = -5.8 + random() * 11.6;
    const x = stream(z) + (n % 2 ? 1 : -1) * (0.68 + random() * 0.11);
    ball('stone', x, height(x, z) + 0.06, z, 0.08 + random() * 0.14, 0.09, 0.1 + random() * 0.16);
  }

  // The small cream cottage, with a broad terracotta roof and a flower box.
  const cx = -3.1; const cz = -1.55; const cy = height(cx, cz);
  box('stone', cx, cy + 0.09, cz, 2.65, 0.19, 2.12);
  box('plaster', cx, cy + 0.95, cz, 2.2, 1.7, 1.8);
  const gable = new BufferGeometry();
  gable.setAttribute('position', new Float32BufferAttribute([
    -1.1, 0, 0.903, 1.1, 0, 0.903, 0, 0.78, 0.903,
    1.1, 0, -0.903, -1.1, 0, -0.903, 0, 0.78, -0.903,
  ], 3));
  gable.computeVertexNormals(); add(gable, 'plaster', cx, cy + 1.8, cz);
  const slope = Math.atan2(0.97, 1.43);
  box('roof', cx - 0.69, cy + 2.19, cz, 1.79, 0.15, 2.29, 0, slope);
  box('roofLight', cx + 0.69, cy + 2.19, cz, 1.79, 0.15, 2.29, 0, -slope);
  box('roof', cx, cy + 2.71, cz, 0.16, 0.13, 2.34);
  for (let n = 0; n < 7; n++) {
    const z = cz - 1.04 + n * 0.345;
    beam('roofLight', new Vector3(cx - 1.43, cy + 1.77, z), new Vector3(cx, cy + 2.74, z), 0.022, 4);
    beam('roof', new Vector3(cx + 1.43, cy + 1.77, z), new Vector3(cx, cy + 2.74, z), 0.02, 4);
  }
  box('woodDark', cx + 0.35, cy + 0.78, cz + 0.915, 0.55, 1.34, 0.08);
  box('wood', cx + 0.35, cy + 0.78, cz + 0.967, 0.42, 1.19, 0.035);
  ball('yellow', cx + 0.48, cy + 0.74, cz + 1, 0.033, 0.033, 0.025);
  box('stone', cx + 0.35, cy + 0.12, cz + 1.15, 0.86, 0.22, 0.5);
  const window = (x: number, y: number, z: number, ry = 0) => {
    const geometry = new Group();
    // Window pieces are transformed together before being batched.
    const pieces: [Mat, number, number, number, number, number, number][] = [
      ['woodDark', 0, 0, 0, 0.64, 0.67, 0.085], ['glass', 0, 0, 0.049, 0.5, 0.53, 0.04],
      ['woodLight', 0, 0, 0.077, 0.045, 0.55, 0.025], ['woodLight', 0, 0, 0.077, 0.5, 0.045, 0.025],
      ['wood', -0.4, 0, 0.035, 0.16, 0.68, 0.065], ['wood', 0.4, 0, 0.035, 0.16, 0.68, 0.065],
    ];
    geometry.position.set(x, y, z); geometry.rotation.y = ry; geometry.updateMatrix();
    for (const [mat, px, py, pz, w, h, d] of pieces) {
      const geo = new BoxGeometry(w, h, d).translate(px, py, pz).applyMatrix4(geometry.matrix);
      add(geo, mat, 0, 0, 0);
    }
  };
  window(cx - 0.59, cy + 1.05, cz + 0.93);
  window(cx + 1.12, cy + 1.05, cz + 0.05, Math.PI / 2);
  box('wood', cx - 0.59, cy + 0.63, cz + 1.02, 0.78, 0.16, 0.23);
  for (let n = 0; n < 7; n++) {
    ball('foliage', cx - 0.91 + n * 0.105, cy + 0.76, cz + 1.04, 0.11, 0.11, 0.11);
    ball(n % 2 ? 'pink' : 'yellow', cx - 0.91 + n * 0.105, cy + 0.85, cz + 1.05, 0.055, 0.06, 0.055);
  }
  box('stone', cx - 0.75, cy + 2.64, cz - 0.51, 0.36, 1.02, 0.4);
  box('woodDark', cx - 0.75, cy + 3.17, cz - 0.51, 0.48, 0.13, 0.51);
  // Round attic window.
  add(new CylinderGeometry(0.19, 0.19, 0.05, 12), 'wood', cx, cy + 2.12, cz + 0.924, 1, 1, 1, Math.PI / 2);
  add(new CylinderGeometry(0.136, 0.136, 0.059, 12), 'glass', cx, cy + 2.12, cz + 0.929, 1, 1, 1, Math.PI / 2);

  // A plank bridge runs east-west over the bend in the stream.
  const bz = 1.18; const bx = stream(bz); const by = height(bx, bz) + 0.27;
  for (let n = 0; n < 12; n++) {
    box(n % 3 ? 'woodLight' : 'wood', bx - 1.16 + n * 0.21, by + 0.055 * Math.sin(n / 11 * Math.PI), bz,
      0.194, 0.1, 0.99, 0.015 * Math.sin(n * 7));
  }
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) box('wood', bx + end * 1.07, by + 0.27, bz + side * 0.49, 0.115, 0.75, 0.115);
    box('wood', bx, by + 0.49, bz + side * 0.49, 2.34, 0.085, 0.085);
    box('woodDark', bx, by - 0.075, bz + side * 0.35, 2.55, 0.16, 0.11);
  }
  const path = (points: [number, number][]) => {
    for (let p = 0; p < points.length - 1; p++) {
      const [ax, az] = points[p]; const [dx, dz] = points[p + 1];
      const count = Math.ceil(Math.hypot(dx - ax, dz - az) / 0.38);
      for (let n = 0; n < count; n++) {
        const t = n / count; const x = ax + (dx - ax) * t; const z = az + (dz - az) * t;
        add(new CylinderGeometry(0.23, 0.26, 0.07, 6), 'stone', x, height(x, z) + 0.053, z,
          0.85 + random() * 0.3, 1, 0.65 + random() * 0.2, 0, random() * 2);
      }
    }
  };
  path([[-2.73, -0.23], [-2.75, 0.5], [-1.84, 1.23], [bx - 1.26, bz]]);
  path([[bx + 1.26, bz], [2.5, 0.9], [3.67, -0.87]]);
  path([[-2.76, 0.64], [-3.43, 2.08], [-3.18, 3.53]]);

  // The mill's sails turn in the vertical plane, facing the open valley.
  const mx = 3.65; const mz = -2.15; const my = height(mx, mz);
  add(new CylinderGeometry(0.58, 0.91, 2.75, 10), 'plaster', mx, my + 1.375, mz);
  add(new CylinderGeometry(0.7, 0.74, 0.12, 10), 'wood', mx, my + 2.6, mz);
  add(new ConeGeometry(0.93, 0.95, 10), 'roof', mx, my + 3.16, mz);
  box('woodDark', mx, my + 0.51, mz + 0.86, 0.41, 0.99, 0.08);
  box('glass', mx, my + 1.7, mz + 0.72, 0.24, 0.35, 0.035);
  const rotor = new Group(); rotor.position.set(mx, my + 2.66, mz + 0.95);
  for (let n = 0; n < 4; n++) {
    const sail = new Group(); sail.rotation.z = n * Math.PI / 2;
    const spine = new Mesh(new BoxGeometry(0.08, 1.69, 0.07), materials.woodDark);
    spine.position.y = 0.8; sail.add(spine);
    const fabric = new BufferGeometry();
    fabric.setAttribute('position', new Float32BufferAttribute([
      0.02, 0.52, 0, 0.4, 0.66, 0, 0.4, 1.62, 0,
      0.02, 0.52, 0, 0.4, 1.62, 0, 0.02, 1.62, 0,
      0.02, 0.52, -0.008, 0.4, 1.62, -0.008, 0.4, 0.66, -0.008,
      0.02, 0.52, -0.008, 0.02, 1.62, -0.008, 0.4, 1.62, -0.008,
    ], 3)); fabric.computeVertexNormals();
    const cloth = new Mesh(fabric, materials.plaster); cloth.castShadow = true; sail.add(cloth);
    for (let j = 0; j < 4; j++) {
      const rib = new Mesh(new BoxGeometry(0.41, 0.035, 0.025), materials.woodLight);
      rib.position.set(0.2, 0.71 + j * 0.275, 0.025); sail.add(rib);
    }
    rotor.add(sail);
  }
  const hub = new Mesh(new CylinderGeometry(0.14, 0.14, 0.2, 8), materials.woodDark);
  hub.rotation.x = Math.PI / 2; hub.position.z = 0.07; rotor.add(hub);
  rotor.rotation.z = 0.14; group.add(rotor);

  const tree = (x: number, z: number, size: number, variant: number) => {
    const y = height(x, z);
    add(new CylinderGeometry(0.09 * size, 0.17 * size, 1.5 * size, 6), 'woodDark', x, y + 0.72 * size, z);
    if (variant === 1) {
      ball('foliage', x, y + 1.66 * size, z, 0.53 * size, 1.12 * size, 0.54 * size, 1);
      ball('foliageLight', x - 0.11 * size, y + 2.18 * size, z - 0.015, 0.4 * size, 0.7 * size, 0.4 * size);
    } else {
      beam('woodDark', new Vector3(x, y + size, z), new Vector3(x - 0.32 * size, y + 1.5 * size, z), 0.055 * size);
      ball('foliage', x - 0.36 * size, y + 1.71 * size, z + 0.12 * size, 0.78 * size, 0.74 * size, 0.73 * size, 1);
      ball('foliageLight', x + 0.28 * size, y + 2.03 * size, z - 0.06 * size, 0.75 * size, 0.87 * size, 0.71 * size, 1);
      ball('foliageDark', x + 0.22 * size, y + 1.61 * size, z + 0.37 * size, 0.62 * size, 0.6 * size, 0.61 * size);
    }
  };
  [
    [-5.05, -2.72, 1.04, 0], [-4.07, -4.26, 1.04, 1], [-2.87, -5.0, 1.2, 0],
    [-0.82, -5.32, 0.89, 1], [1.17, -5.5, 1.1, 0], [2.8, -4.96, 0.99, 1],
    [5.28, -3.23, 0.85, 1], [5.83, -0.62, 0.86, 0], [-5.6, -0.04, 0.85, 1],
    [-5.12, 1.85, 0.8, 0], [-4.86, 3.74, 0.64, 1], [3.52, 5.11, 0.7, 0],
    [5.6, 2.65, 0.66, 1], [-2.57, 5.33, 0.57, 0],
  ].forEach(([x, z, size, variant]) => tree(x, z, size, variant));

  // A light split-rail fence, with a gate left open toward the bridge.
  const fence = (ax: number, az: number, bx: number, bz: number, count: number) => {
    for (let i = 0; i <= count; i++) {
      const x = ax + (bx - ax) * i / count; const z = az + (bz - az) * i / count;
      box('woodLight', x, height(x, z) + 0.39, z, 0.1, 0.78, 0.1);
      if (i < count) {
        const dx = ax + (bx - ax) * (i + 1) / count; const dz = az + (bz - az) * (i + 1) / count;
        for (const y of [0.29, 0.57]) beam('woodLight', new Vector3(x, height(x, z) + y, z), new Vector3(dx, height(dx, dz) + y, dz), 0.042, 4);
      }
    }
  };
  fence(2.75, 4.33, 5.04, 3.52, 4); fence(5.04, 3.52, 5.12, 1.65, 3);
  fence(2.15, 2.64, 2.46, 3.82, 2);
  const sheep = (x: number, z: number, scale: number, angle: number) => {
    const y = height(x, z);
    const local = (px: number, py: number, pz: number, sx: number, sy: number, sz: number, mat: Mat) => {
      const vx = x + (px * Math.cos(angle) + pz * Math.sin(angle)) * scale;
      const vz = z + (-px * Math.sin(angle) + pz * Math.cos(angle)) * scale;
      const geo = new IcosahedronGeometry(1, mat === 'wool' ? 1 : 0);
      add(geo, mat, vx, y + py * scale, vz, sx * scale, sy * scale, sz * scale, 0, angle);
    };
    local(0, 0.42, 0, 0.42, 0.32, 0.28, 'wool');
    local(0.36, 0.47, 0, 0.2, 0.19, 0.16, 'woodDark');
    local(0.33, 0.61, 0, 0.16, 0.12, 0.14, 'wool');
    for (const side of [-1, 1]) {
      local(0.32, 0.51, side * 0.2, 0.11, 0.052, 0.075, 'woodDark');
      local(-0.22, 0.15, side * 0.16, 0.065, 0.17, 0.06, 'woodDark');
      local(0.2, 0.15, side * 0.16, 0.065, 0.17, 0.06, 'woodDark');
    }
    local(-0.4, 0.47, 0, 0.12, 0.11, 0.12, 'wool');
  };
  sheep(3.14, 2.84, 0.9, -0.7); sheep(4.2, 2.4, 0.91, 1.5);
  sheep(3.58, 3.5, 0.61, -0.25); sheep(4.59, 1.51, 0.74, 2.2);

  // Picnic blanket, basket, and a little bench under the trees.
  const px = -3.04; const pz = 3.64; const py = height(px, pz);
  box('plaster', px, py + 0.03, pz, 1.48, 0.025, 1.1, -0.18);
  for (let n = -2; n <= 2; n++) box('pink', px + n * 0.255, py + 0.047, pz, 0.065, 0.015, 1.03, -0.18);
  box('woodLight', px + 0.36, py + 0.2, pz - 0.2, 0.33, 0.3, 0.27, -0.18);
  box('wood', px + 0.36, py + 0.37, pz - 0.2, 0.38, 0.055, 0.31, -0.18);
  add(new CylinderGeometry(0.13, 0.13, 0.023, 12), 'wool', px - 0.27, py + 0.067, pz + 0.15);
  ball('pink', px - 0.27, py + 0.11, pz + 0.15, 0.08, 0.06, 0.08);
  const benchX = -4.18; const benchZ = 1.98; const benchY = height(benchX, benchZ);
  box('wood', benchX, benchY + 0.39, benchZ, 0.45, 0.1, 1.18);
  for (const end of [-1, 1]) box('woodDark', benchX, benchY + 0.2, benchZ + end * 0.43, 0.31, 0.39, 0.09);
  box('woodLight', benchX - 0.2, benchY + 0.75, benchZ, 0.08, 0.26, 1.19);
  for (const end of [-1, 1]) box('woodDark', benchX - 0.21, benchY + 0.55, benchZ + end * 0.44, 0.065, 0.6, 0.07);

  // Loose flower meadows and tiny grass tufts; all merged into a few draws.
  const flowerPatches = [[-1.85, 4.7, 0.85], [-4.3, 0.57, 0.7], [1.13, 4.82, 0.7], [4.94, 0.18, 0.57], [-1.37, -3.15, 0.65]];
  for (const [fx, fz, radius] of flowerPatches) {
    for (let n = 0; n < 27; n++) {
      const angle = random() * Math.PI * 2; const r = Math.sqrt(random()) * radius;
      const x = fx + Math.cos(angle) * r; const z = fz + Math.sin(angle) * r;
      if (Math.abs(x - stream(z)) < 0.78) continue;
      const y = height(x, z); const tall = 0.11 + random() * 0.12;
      box('leaf', x, y + tall * 0.5, z, 0.015, tall, 0.015);
      ball(n % 3 === 0 ? 'pink' : n % 3 === 1 ? 'wool' : 'yellow', x, y + tall, z, 0.055, 0.036, 0.055);
    }
  }
  for (let n = 0; n < 160; n++) {
    const angle = random() * Math.PI * 2; const radius = 1.9 + Math.sqrt(random()) * 4.65;
    const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius;
    if (Math.abs(x - stream(z)) < 0.85 || (x < -1.7 && x > -4.6 && z < 0.1 && z > -2.9)
      || (x > 2.7 && z < -1.1 && z > -3.2) || (x < -2.1 && x > -4.2 && z > 2.9 && z < 4.5)) continue;
    const y = height(x, z);
    const geo = new BufferGeometry(); const h = 0.09 + random() * 0.17;
    geo.setAttribute('position', new Float32BufferAttribute([
      -0.085, 0, 0, 0, h, 0, 0.025, 0, 0,
      0, 0, -0.08, 0, h * 0.74, 0, 0, 0, 0.045,
    ], 3)); geo.computeVertexNormals();
    add(geo, 'leaf', x, y + 0.015, z, 1, 1, 1, 0, random() * Math.PI);
  }
  // A tiny signpost at the bridge and a pair of log rounds near the cottage.
  box('woodDark', -1.34, height(-1.34, 1.67) + 0.38, 1.67, 0.08, 0.76, 0.08);
  box('woodLight', -1.34, height(-1.34, 1.67) + 0.69, 1.67, 0.49, 0.19, 0.055, -0.22);
  for (let n = 0; n < 3; n++) add(new CylinderGeometry(0.14, 0.14, 0.61, 8), 'wood', -4.18 + (n % 2) * 0.26,
    cy + 0.18 + Math.floor(n / 2) * 0.24, -0.33, 1, 1, 1, Math.PI / 2);

  for (const [material, geometries] of batches) {
    // All primitives are non-indexed and have the same attribute signature.
    const normalized = geometries.map((geometry) => {
      const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
      nonIndexed.deleteAttribute('uv');
      nonIndexed.deleteAttribute('color');
      return nonIndexed;
    });
    const merged = mergeGeometries(normalized, false);
    if (!merged) continue;
    const mesh = new Mesh(merged, materials[material]);
    mesh.castShadow = !['water', 'foam', 'bank', 'leaf'].includes(material);
    mesh.receiveShadow = true;
    group.add(mesh);
    for (const geo of geometries) geo.dispose();
    for (const geo of normalized) geo.dispose();
  }
  return {
    group,
    collectibles: [
      { position: new Vector3(-2.78, cy + 1.83, -0.2), name: '山谷来信', message: '小屋的窗台上，留着一封写给春天的信。' },
      { position: new Vector3(bx, by + 1.2, bz), name: '溪水回声', message: '站在木桥上，听见溪水把时间慢慢带走。' },
      { position: new Vector3(3.75, height(3.75, 3.4) + 1.6, 3.4), name: '柔软时光', message: '羊群替你保管了一个无所事事的午后。' },
    ],
    update: (elapsed: number) => { rotor.rotation.z = 0.14 - elapsed * 0.23; },
  };
}
