import {
  BufferGeometry, Color, CylinderGeometry, DoubleSide, Euler, Float32BufferAttribute,
  Group, IcosahedronGeometry, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Shape,
  ExtrudeGeometry, SphereGeometry, TorusGeometry, Vector3, BoxGeometry,
  Points, PointsMaterial,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Landscape } from './types';

/** A pocket of shade at the end of an amber sea. Everything is generated locally. */
export function createDesert(): Landscape {
  const group = new Group();
  group.name = '暮色沙海';
  const batches = new Map<string, BufferGeometry[]>();
  const stone = '#c87d51';
  let seed = 810;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const put = (
    geometry: BufferGeometry, color: string,
    position: [number, number, number] = [0, 0, 0],
    rotation: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
  ) => {
    let geo = geometry.index ? geometry.toNonIndexed() : geometry;
    if (geo !== geometry) geometry.dispose();
    geo = geo.applyMatrix4(new Matrix4().compose(
      new Vector3(...position), new Quaternion().setFromEuler(new Euler(...rotation)), new Vector3(...scale),
    ));
    // All batches share the minimal attribute set, including custom leaf geometry.
    geo.deleteAttribute('uv');
    geo.deleteAttribute('color');
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();
    if (!batches.has(color)) batches.set(color, []);
    batches.get(color)!.push(geo);
  };
  const box = (size: [number, number, number], color: string, at: [number, number, number], rotation = 0) =>
    put(new BoxGeometry(...size), color, at, [0, rotation, 0]);
  const rock = (at: [number, number, number], scale: [number, number, number], color = stone) =>
    put(new IcosahedronGeometry(1, 0), color, at, [random() * 0.3, random() * 6, random() * 0.25], scale);
  const height = (x: number, z: number) => {
    const h = 0.3
      + 1.25 * Math.exp(-((x - 3.6) ** 2 / 7 + (z + 2.4) ** 2 / 11))
      + 0.9 * Math.exp(-((x + 3.6) ** 2 / 11 + (z + 3.5) ** 2 / 5))
      + 0.3 * Math.exp(-((x - 1.2) ** 2 / 15 + (z - 3.7) ** 2 / 5));
    const oasis = Math.exp(-((x + 3.2) ** 2 / 7 + (z - 2.5) ** 2 / 4));
    return h * (1 - oasis * 0.35);
  };
  const islandRadius = (a: number) => 6.9 + Math.sin(a * 5 + 0.3) * 0.23 + Math.sin(a * 9) * 0.12;

  // Irregular low-poly top and exposed bands on the cut-away island.
  const sectors = 64;
  const rings = 12;
  const terrainVertices: number[] = [];
  const terrainColors: number[] = [];
  const duneColors = ['#e6b16f', '#eabc81', '#dfaa68', '#edbf83', '#e4ae70'].map((c) => new Color(c));
  const terrainPoint = (ring: number, sector: number) => {
    const a = sector / sectors * Math.PI * 2;
    const radius = islandRadius(a) * ring / rings;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    return [x, height(x, z), z];
  };
  const triangle = (a: number[], b: number[], c: number[]) => {
    terrainVertices.push(...a, ...b, ...c);
    const color = duneColors[Math.floor(random() * duneColors.length)];
    for (let j = 0; j < 3; j++) terrainColors.push(color.r, color.g, color.b);
  };
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < sectors; s++) {
      const a = terrainPoint(r, s);
      const b = terrainPoint(r, s + 1);
      const c = terrainPoint(r + 1, s);
      const d = terrainPoint(r + 1, s + 1);
      triangle(a, b, c);
      triangle(b, d, c);
    }
  }
  const terrainGeometry = new BufferGeometry();
  terrainGeometry.setAttribute('position', new Float32BufferAttribute(terrainVertices, 3));
  terrainGeometry.setAttribute('color', new Float32BufferAttribute(terrainColors, 3));
  terrainGeometry.computeVertexNormals();
  const terrain = new Mesh(terrainGeometry, new MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  terrain.receiveShadow = true;
  group.add(terrain);

  const bands = [
    { y: -0.24, radius: 1.01, color: '#cb8f60' },
    { y: -0.85, radius: 0.98, color: '#b57550' },
    { y: -1.48, radius: 0.9, color: '#965c45' },
    { y: -2.02, radius: 0.7, color: '#764e42' },
    { y: -2.26, radius: 0.37, color: '#624640' },
  ];
  for (let band = 0; band < bands.length; band++) {
    const vertices: number[] = [];
    const bottom = bands[band];
    for (let s = 0; s < sectors; s++) {
      const edge = (index: number, upper: boolean) => {
        const a = index / sectors * Math.PI * 2;
        const item = upper ? bands[band - 1] : bottom;
        const radius = islandRadius(a) * (item?.radius ?? 1);
        const x = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;
        const y = item ? item.y + Math.sin(a * 6 + band) * 0.08 : height(x, z);
        return [x, y, z];
      };
      const a = edge(s, true), b = edge(s + 1, true), c = edge(s, false), d = edge(s + 1, false);
      vertices.push(...a, ...c, ...b, ...b, ...c, ...d);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    put(geometry, bottom.color);
  }
  put(new CylinderGeometry(2.6, 0.4, 0.18, 12), '#624640', [0, -2.24, 0]);

  // A wind-carved arch: asymmetric silhouette and visible sandstone strata.
  const archShape = new Shape();
  archShape.moveTo(-2.45, 0);
  archShape.lineTo(-2.5, 1.6);
  archShape.lineTo(-2.2, 3.05);
  archShape.lineTo(-1.5, 4.16);
  archShape.lineTo(-0.55, 4.64);
  archShape.lineTo(0.6, 4.73);
  archShape.lineTo(1.61, 4.11);
  archShape.lineTo(2.1, 2.8);
  archShape.lineTo(2.34, 0);
  archShape.lineTo(1.22, 0);
  archShape.lineTo(1.13, 1.95);
  archShape.lineTo(0.85, 2.85);
  archShape.lineTo(0.3, 3.32);
  archShape.lineTo(-0.43, 3.31);
  archShape.lineTo(-1.01, 2.8);
  archShape.lineTo(-1.24, 1.75);
  archShape.lineTo(-1.32, 0);
  archShape.closePath();
  put(new ExtrudeGeometry(archShape, { depth: 0.82, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.14, bevelThickness: 0.13, curveSegments: 1 }), stone, [0.35, 0.7, -2]);
  // Weathered slabs produce a readable irregular edge without a high-poly asset.
  rock([-1.76, 1.11, -1.58], [0.85, 0.72, 0.84], '#d18a58');
  rock([2.48, 1.2, -1.54], [0.75, 0.55, 0.7], '#bd734c');
  rock([-1.87, 3.22, -1.55], [0.55, 0.64, 0.67], '#d48b59');
  rock([1.15, 5.26, -1.61], [0.63, 0.2, 0.58], '#db9b66');
  put(new CylinderGeometry(0.68, 0.83, 0.15, 6), '#e1a472', [-1.71, 2.42, -1.63], [0, 0.2, 0], [1, 1, 0.9]);
  put(new CylinderGeometry(0.52, 0.59, 0.13, 6), '#e1a472', [2.21, 3.32, -1.61], [0, 0.4, 0], [1, 1, 0.9]);
  for (let i = 0; i < 10; i++) {
    const x = -5.2 + random() * 9.8;
    const z = -4.6 + random() * 1.2;
    const size = 0.2 + random() * 0.55;
    rock([x, height(x, z) + size * 0.25, z], [size, size * 0.55, size * 0.75], i % 2 ? '#d79962' : '#c88a58');
  }

  // Organic shore, crystalline shallow water and a fine foam-like highlight.
  const pondGeometry = (rx: number, rz: number, y: number) => {
    const positions: number[] = [];
    for (let i = 0; i < 52; i++) {
      const point = (n: number) => {
        const a = n / 52 * Math.PI * 2;
        const r = 1 + Math.sin(a * 3 + 0.4) * 0.07 + Math.sin(a * 5) * 0.035;
        return [-3.2 + Math.cos(a) * rx * r, y, 2.45 + Math.sin(a) * rz * r];
      };
      positions.push(-3.2, y, 2.45, ...point(i + 1), ...point(i));
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  };
  put(pondGeometry(2.0, 1.4, 0.34), '#f4d59a');
  const water = new Mesh(pondGeometry(1.76, 1.15, 0.366), new MeshStandardMaterial({ color: '#2aa7a0', roughness: 0.26, metalness: 0.14, transparent: true, opacity: 0.96, side: DoubleSide }));
  water.receiveShadow = true;
  group.add(water);
  put(pondGeometry(1.3, 0.75, 0.369), '#35998e');
  const ripples: Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ripple = new Mesh(new TorusGeometry(0.3 + i * 0.2, 0.01, 3, 38), new MeshStandardMaterial({ color: '#a1dfbf', roughness: 0.4, transparent: true, opacity: 0.55 }));
    ripple.rotation.x = -Math.PI / 2;
    ripple.scale.y = 0.48;
    ripple.position.set(-3.1, 0.384, 2.5);
    group.add(ripple);
    ripples.push(ripple);
  }
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2;
    if (a > 0.4 && a < 1.8) continue;
    const x = -3.2 + Math.cos(a) * 1.93;
    const z = 2.45 + Math.sin(a) * 1.3;
    rock([x, 0.4, z], [0.22 + random() * 0.15, 0.14, 0.18], '#f0d09a');
  }

  const palmCrowns: { mesh: Mesh; phase: number }[] = [];
  const palm = (x: number, z: number, trunkHeight: number, lean: number, phase: number) => {
    const base = height(x, z);
    const segments = 9;
    for (let i = 0; i < segments; i++) {
      const t = (i + 0.5) / segments;
      put(new CylinderGeometry(0.11 - t * 0.025, 0.145 - t * 0.034, trunkHeight / segments * 1.13, 7), i % 2 ? '#936b42' : '#b0814f', [x + lean * t * t, base + trunkHeight * t, z], [0, 0, -lean * t / trunkHeight * 2]);
    }
    const crown = new Group();
    crown.position.set(x + lean, base + trunkHeight, z);
    group.add(crown);
    const leafVertices: number[] = [];
    for (let j = 0; j < 9; j++) {
      const angle = j / 9 * Math.PI * 2 + phase;
      const length = 1.38 + (j % 3) * 0.14;
      const sections = 5;
      const p = (s: number, side: number) => {
        const t = s / sections;
        const width = Math.sin(t * Math.PI) * 0.22;
        const distance = t * length;
        const elevation = Math.sin(t * Math.PI * 0.94) * 0.4 - t * t * 0.4;
        return [Math.cos(angle) * distance + Math.sin(angle) * width * side, elevation, Math.sin(angle) * distance - Math.cos(angle) * width * side];
      };
      for (let s = 0; s < sections; s++) {
        const l = p(s, -1), r = p(s, 1), nl = p(s + 1, -1), nr = p(s + 1, 1);
        leafVertices.push(...l, ...nl, ...r, ...r, ...nl, ...nr);
      }
    }
    const leaves = new BufferGeometry();
    leaves.setAttribute('position', new Float32BufferAttribute(leafVertices, 3));
    leaves.computeVertexNormals();
    const mesh = new Mesh(leaves, new MeshStandardMaterial({ color: '#477d54', roughness: 0.9, side: DoubleSide, flatShading: true }));
    mesh.castShadow = true;
    crown.add(mesh);
    palmCrowns.push({ mesh, phase });
    for (let i = 0; i < 3; i++) {
      put(new SphereGeometry(0.105, 6, 4), '#765236', [x + lean + Math.cos(i * 2.1) * 0.16, base + trunkHeight - 0.09, z + Math.sin(i * 2.1) * 0.16]);
    }
  };
  palm(-4.65, 1.16, 2.7, 0.42, 0.2);
  palm(-2.14, 1.17, 3.12, -0.26, 1.1);
  palm(-5.11, 3.16, 1.91, 0.25, 2.4);

  // A tiny adobe roadside shelter, with stairs, parapets, striped awning and jars.
  const hutX = 3.85, hutZ = 1.35, hutBase = height(hutX, hutZ) - 0.04;
  box([1.7, 1.45, 1.52], '#eac397', [hutX, hutBase + 0.725, hutZ]);
  box([1.88, 0.16, 1.7], '#f4d7a8', [hutX, hutBase + 1.47, hutZ]);
  for (const dx of [-0.79, 0.79]) box([0.12, 0.26, 1.58], '#e4b789', [hutX + dx, hutBase + 1.64, hutZ]);
  box([1.64, 0.26, 0.12], '#e4b789', [hutX, hutBase + 1.64, hutZ - 0.75]);
  box([0.54, 0.92, 0.045], '#75503e', [hutX - 0.22, hutBase + 0.46, hutZ + 0.775]);
  box([0.43, 0.78, 0.045], '#426f69', [hutX - 0.22, hutBase + 0.42, hutZ + 0.801]);
  for (const dx of [-0.29, 0.29]) box([0.07, 1.03, 0.1], '#f6d9ac', [hutX - 0.22 + dx, hutBase + 0.48, hutZ + 0.79]);
  box([0.65, 0.09, 0.1], '#f6d9ac', [hutX - 0.22, hutBase + 1.02, hutZ + 0.79]);
  put(new SphereGeometry(0.04, 5, 4), '#e9b86b', [hutX - 0.08, hutBase + 0.48, hutZ + 0.83]);
  box([0.045, 0.43, 0.42], '#7a6350', [hutX + 0.863, hutBase + 0.92, hutZ + 0.02]);
  for (let i = 0; i < 3; i++) box([0.06, 0.47, 0.038], '#dfb483', [hutX + 0.9, hutBase + 0.92, hutZ - 0.11 + i * 0.14]);
  for (let i = 0; i < 6; i++) {
    const step = i + 1;
    box([0.53, step * 0.21, 0.29], '#d4a574', [hutX - 1.13, hutBase + step * 0.105, hutZ + 0.93 - i * 0.26]);
  }
  for (let i = 0; i < 6; i++) {
    put(new BoxGeometry(0.29, 0.055, 1.25), i % 2 ? '#f2dfb7' : '#b76040', [hutX - 0.1 + (i - 2.5) * 0.28, hutBase + 1.11, hutZ + 1.32], [0.1, 0, 0]);
  }
  for (const dx of [-0.8, 0.6]) put(new CylinderGeometry(0.035, 0.045, 1.1, 5), '#876141', [hutX + dx, hutBase + 0.5, hutZ + 1.86]);
  box([1.6, 0.035, 0.9], '#b3694d', [hutX - 0.1, hutBase + 0.04, hutZ + 1.46]);
  for (let i = 0; i < 6; i++) box([1.45, 0.008, 0.025], '#e4c18b', [hutX - 0.1, hutBase + 0.064, hutZ + 1.11 + i * 0.13]);

  const pot = (x: number, z: number, s: number, color: string) => {
    const y = height(x, z);
    put(new SphereGeometry(0.24, 8, 6), color, [x, y + 0.25 * s, z], [0, 0, 0], [s, 1.2 * s, s]);
    put(new CylinderGeometry(0.12, 0.13, 0.16, 8, 1, true), color, [x, y + 0.52 * s, z], [0, 0, 0], [s, s, s]);
    put(new CylinderGeometry(0.1, 0.1, 0.014, 8), '#695240', [x, y + 0.48 * s, z], [0, 0, 0], [s, s, s]);
  };
  pot(5.0, 2.28, 0.9, '#bf7450');
  pot(4.8, 2.85, 0.62, '#d99262');
  pot(3.5, 3.72, 0.72, '#5c8d82');

  const cactus = (x: number, z: number, size: number, orientation: number) => {
    const y = height(x, z);
    put(new CylinderGeometry(0.13 * size, 0.16 * size, 1.03 * size, 7), '#63886c', [x, y + 0.55 * size, z]);
    put(new SphereGeometry(0.13 * size, 7, 4), '#63886c', [x, y + 1.065 * size, z]);
    for (const side of [-1, 1]) {
      const dx = Math.cos(orientation) * side;
      const dz = Math.sin(orientation) * side;
      const armY = y + (side === -1 ? 0.46 : 0.7) * size;
      put(new CylinderGeometry(0.075 * size, 0.085 * size, 0.34 * size, 6), '#6e9878', [x + dx * 0.16 * size, armY, z + dz * 0.16 * size], [0, -orientation, Math.PI / 2]);
      put(new CylinderGeometry(0.075 * size, 0.085 * size, 0.35 * size, 6), '#6e9878', [x + dx * 0.31 * size, armY + 0.15 * size, z + dz * 0.31 * size]);
      put(new SphereGeometry(0.075 * size, 6, 4), '#6e9878', [x + dx * 0.31 * size, armY + 0.325 * size, z + dz * 0.31 * size]);
    }
  };
  cactus(4.8, -0.7, 0.83, 0);
  cactus(0.7, 4.75, 0.75, 0.3);
  cactus(-4.95, -1.18, 0.63, -0.3);

  // Gentle stepping stones guide the player through the front half of the island.
  for (let i = 0; i < 13; i++) {
    const t = i / 12;
    const x = -1.4 + t * 4.2;
    const z = 3.55 + Math.sin(t * Math.PI) * 0.76;
    put(new CylinderGeometry(0.16, 0.2, 0.065, 6), i % 2 ? '#f2cf96' : '#d59862', [x, height(x, z) + 0.025, z], [0, i * 0.7, 0], [1.35, 1, 0.78]);
  }
  for (let i = 0; i < 17; i++) {
    const a = random() * Math.PI * 2;
    const radius = 5.45 + random() * 0.85;
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    rock([x, height(x, z) + 0.03, z], [0.1 + random() * 0.14, 0.07, 0.13], i % 3 ? '#ce955f' : '#f3ce97');
  }
  // Delicate dry grass, shown as angular straw fans.
  for (const [x, z] of [[1.85, 4.88], [-1.47, 4.72], [5.14, 0.32], [-4.3, -2.8], [3.8, -4.2]]) {
    const y = height(x, z);
    for (let j = 0; j < 4; j++) {
      put(new CylinderGeometry(0.009, 0.015, 0.24 + j * 0.045, 3), '#a78c52', [x + (j - 1.5) * 0.035, y + 0.11, z], [0.1, 0, (j - 1.5) * 0.27]);
    }
  }

  for (const [color, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    if (!merged) continue;
    const mesh = new Mesh(merged, new MeshStandardMaterial({ color, roughness: 0.92, flatShading: true, side: DoubleSide }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    for (const geometry of geometries) geometry.dispose();
  }

  const dustPositions = new Float32Array(54 * 3);
  for (let i = 0; i < 54; i++) {
    dustPositions[i * 3] = (random() - 0.5) * 11;
    dustPositions[i * 3 + 1] = 0.8 + random() * 3.5;
    dustPositions[i * 3 + 2] = (random() - 0.5) * 10;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute('position', new Float32BufferAttribute(dustPositions, 3));
  const dust = new Points(dustGeo, new PointsMaterial({ color: '#ffe2a6', size: 0.035, transparent: true, opacity: 0.48, depthWrite: false }));
  group.add(dust);

  return {
    group,
    collectibles: [
      { position: new Vector3(-3.15, 1.0, 3.62), name: '绿洲来信', message: '走得再远，也有一汪清凉在等你。' },
      { position: new Vector3(0.35, 1.46, -0.8), name: '风的拱门', message: '时间穿过岩石，留下风的形状。' },
      { position: new Vector3(3.45, hutBase + 0.91, 3.8), name: '沙海驿站', message: '在日落之前，把匆忙留在门外。' },
    ],
    update(elapsed: number, _delta: number) {
      for (const { mesh, phase } of palmCrowns) {
        mesh.rotation.z = Math.sin(elapsed * 0.7 + phase) * 0.025;
        mesh.rotation.x = Math.cos(elapsed * 0.55 + phase) * 0.017;
      }
      for (let i = 0; i < ripples.length; i++) {
        const p = (elapsed * 0.15 + i / 3) % 1;
        ripples[i].scale.set(0.8 + p * 1.1, (0.8 + p * 1.1) * 0.6, 1);
        (ripples[i].material as MeshStandardMaterial).opacity = (1 - p) * 0.36;
      }
      dust.rotation.y = elapsed * 0.018;
      dust.position.y = Math.sin(elapsed * 0.35) * 0.12;
    },
  };
}
