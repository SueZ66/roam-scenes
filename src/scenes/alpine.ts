import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  Euler,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Landscape } from './types';

/** A little alpine lake, built entirely from geometry, with no network assets. */
export function createAlpine(): Landscape {
  const group = new Group();
  group.name = 'alpine-landscape';
  let seed = 7431;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const material = (color: string, roughness = 0.88) =>
    new MeshStandardMaterial({ color, roughness, flatShading: true });
  const grass = material('#899d73');
  const sand = material('#c5c4a2');
  const stone = material('#91a09f');
  const rock = new MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });
  const snow = material('#edf6f1');
  const pine = material('#245b50');
  const pineLight = material('#387663');
  const pineDark = material('#1c4742');
  const wood = material('#694d3c');
  const woodLight = material('#ad8660');
  const roof = material('#425965');
  const windowMaterial = new MeshStandardMaterial({ color: '#ffd99a', emissive: '#ebae4e', emissiveIntensity: 0.45, roughness: 0.4 });
  const ice = material('#bde5dd', 0.35);
  const buckets = new Map<MeshStandardMaterial, BufferGeometry[]>();
  function batch(geometry: BufferGeometry, mat: MeshStandardMaterial, position = new Vector3(), rotation = new Euler(), scale = new Vector3(1, 1, 1)) {
    const transformed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    // All static batches use the same attribute layout, including custom faceted pieces.
    transformed.deleteAttribute('uv');
    transformed.applyMatrix4(new Matrix4().compose(position, new Quaternion().setFromEuler(rotation), scale));
    if (!transformed.getAttribute('normal')) transformed.computeVertexNormals();
    const geometries = buckets.get(mat) ?? [];
    geometries.push(transformed);
    buckets.set(mat, geometries);
    geometry.dispose();
  }
  function box(w: number, h: number, d: number, mat: MeshStandardMaterial, x: number, y: number, z: number, ry = 0) {
    batch(new BoxGeometry(w, h, d), mat, new Vector3(x, y, z), new Euler(0, ry, 0));
  }
  function triangles(vertices: number[], colors?: number[]) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    if (colors) geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  }
  function triangle(target: number[], a: Vector3, b: Vector3, c: Vector3) {
    target.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  const ring: Vector3[] = [];
  const bottom: Vector3[] = [];
  const segments = 19;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const radius = 6.9 + Math.sin(i * 2.13) * 0.32;
    ring.push(new Vector3(Math.cos(angle) * radius, 0.12 + random() * 0.10, Math.sin(angle) * radius * 0.88));
    bottom.push(new Vector3(Math.cos(angle + 0.035) * radius * 0.68, -1.4 - random() * 0.76, Math.sin(angle + 0.035) * radius * 0.63));
  }
  const topVertices: number[] = [];
  const cliffVertices: number[] = [];
  const cliffColors: number[] = [];
  const underside = new Vector3(0.3, -2.35, -0.4);
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    triangle(topVertices, new Vector3(0, 0.19, 0), ring[j], ring[i]);
    triangle(cliffVertices, ring[i], ring[j], bottom[i]);
    triangle(cliffVertices, ring[j], bottom[j], bottom[i]);
    triangle(cliffVertices, bottom[i], bottom[j], underside);
    for (let face = 0; face < 3; face++) {
      const c = new Color(['#697978', '#7c8984', '#576c70', '#8e9890', '#607577'][(i + face * 2) % 5]);
      for (let vertex = 0; vertex < 3; vertex++) cliffColors.push(c.r, c.g, c.b);
    }
  }
  batch(triangles(topVertices), grass);
  batch(triangles(cliffVertices, cliffColors), rock);

  // A generous, asymmetric basin leaves a tree-lined bank and a little eastern clearing.
  const lakeOutline = [
    [-4.95, 0.2], [-4.55, -1.1], [-3.1, -1.45], [-1.35, -1.05],
    [0.5, -0.82], [2.35, -0.4], [3.28, 0.6], [3.50, 2.0],
    [2.85, 3.40], [1.35, 4.48], [-0.2, 4.80], [-2.0, 4.22],
    [-3.58, 3.47], [-4.75, 2.22],
  ];
  const lakeCenter = new Vector3(-0.65, 0.26, 1.65);
  const shoreVertices: number[] = [];
  const waterVertices: number[] = [];
  const waterColors: number[] = [];
  const waterRing = lakeOutline.map(([x, z]) => new Vector3(x, 0.265, z));
  for (let i = 0; i < waterRing.length; i++) {
    const j = (i + 1) % waterRing.length;
    const a = waterRing[i];
    const b = waterRing[j];
    const outerA = a.clone().sub(lakeCenter).multiplyScalar(1.08).add(lakeCenter).setY(0.245);
    const outerB = b.clone().sub(lakeCenter).multiplyScalar(1.08).add(lakeCenter).setY(0.245);
    triangle(shoreVertices, outerA, lakeCenter.clone().setY(0.245), outerB);
    triangle(waterVertices, lakeCenter, b, a);
    const centerColor = new Color('#42bbc2');
    const edgeColor = new Color(i > 7 ? '#82d4cd' : '#359fa9');
    waterColors.push(centerColor.r, centerColor.g, centerColor.b, edgeColor.r, edgeColor.g, edgeColor.b, edgeColor.r, edgeColor.g, edgeColor.b);
  }
  batch(triangles(shoreVertices), sand);
  const waterGeometry = triangles(waterVertices, waterColors);
  const waterMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.16, flatShading: true });
  const waterMesh = new Mesh(waterGeometry, waterMaterial);
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  function mountain(x: number, z: number, radius: number, height: number, sides: number, twist: number) {
    const vertices: number[] = [];
    const colors: number[] = [];
    const cap: number[] = [];
    const low: Vector3[] = [];
    const middle: Vector3[] = [];
    const snowline: Vector3[] = [];
    const summit = new Vector3(x - radius * 0.16, 0.20 + height, z - radius * 0.14);
    for (let i = 0; i < sides; i++) {
      const angle = i / sides * Math.PI * 2 + twist;
      const r = radius * (0.80 + random() * 0.3);
      const base = new Vector3(x + Math.cos(angle) * r, 0.21, z + Math.sin(angle) * r * 0.79);
      low.push(base);
      middle.push(base.clone().lerp(summit, 0.35 + random() * 0.12));
      snowline.push(base.clone().lerp(summit, 0.65 + random() * 0.13));
    }
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      triangle(vertices, low[i], middle[i], low[j]);
      triangle(vertices, low[j], middle[i], middle[j]);
      triangle(vertices, middle[i], snowline[i], middle[j]);
      triangle(vertices, middle[j], snowline[i], snowline[j]);
      triangle(cap, snowline[i], summit, snowline[j]);
      for (let face = 0; face < 4; face++) {
        const c = new Color(['#829495', '#697f83', '#a3b3ad', '#819d9a', '#566f79'][(i + face) % 5]);
        for (let k = 0; k < 3; k++) colors.push(c.r, c.g, c.b);
      }
    }
    batch(triangles(vertices, colors), rock);
    batch(triangles(cap), snow);
  }
  mountain(-3.8, -3.05, 1.80, 3.9, 6, 0.15);
  mountain(-1.35, -3.75, 2.30, 6.3, 7, 0.38);
  mountain(1.30, -3.35, 2.15, 4.9, 6, -0.14);
  mountain(3.45, -2.75, 1.68, 3.15, 5, 0.3);

  function tree(x: number, z: number, height: number) {
    const y = 0.22;
    batch(new CylinderGeometry(0.055, 0.075, height * 0.6, 5), wood, new Vector3(x, y + height * 0.3, z));
    const rotation = new Euler(0, random() * Math.PI, 0);
    batch(new ConeGeometry(height * 0.31, height * 0.67, 6), pineDark, new Vector3(x, y + height * 0.48, z), rotation);
    batch(new ConeGeometry(height * 0.25, height * 0.6, 6), pine, new Vector3(x, y + height * 0.69, z), rotation);
    batch(new ConeGeometry(height * 0.18, height * 0.49, 6), pineLight, new Vector3(x, y + height * 0.93, z), rotation);
  }
  const trees = [
    [-5.2, -1.9, 1.9], [-5.7, -0.7, 1.45], [-5.5, 0.5, 1.65], [-5.6, 1.7, 1.22],
    [-4.8, 3.35, 1.35], [-4.0, 4.15, 0.95], [-3.25, 4.85, 1.20], [-2.1, 5.2, 0.80],
    [4.9, -1.9, 1.65], [5.45, -0.65, 1.30], [5.45, 0.5, 1.00], [5.5, 1.85, 1.65],
    [4.6, 3.0, 1.18], [3.5, 4.2, 0.92], [2.3, -1.4, 1.0], [-2.9, -1.3, 0.82],
    [-3.8, -1.2, 1.1], [0.5, -1.1, 0.8], [4.1, -1.8, 1.2],
  ];
  trees.forEach(([x, z, h]) => tree(x, z, h));

  // Weathered cabin with a real pitched roof, glowing panes, and a miniature porch.
  const cx = 4.23;
  const cz = 0.53;
  box(1.27, 0.22, 1.28, stone, cx, 0.30, cz);
  box(1.08, 0.88, 1.05, woodLight, cx, 0.78, cz);
  for (let i = 0; i < 5; i++) {
    box(1.14, 0.037, 1.10, wood, cx, 0.43 + i * 0.17, cz);
  }
  const ridge = 1.72;
  const eave = 1.16;
  const roofVertices = [
    cx - 0.74, eave, cz - 0.69, cx, ridge, cz - 0.69, cx - 0.74, eave, cz + 0.69,
    cx - 0.74, eave, cz + 0.69, cx, ridge, cz - 0.69, cx, ridge, cz + 0.69,
    cx, ridge, cz - 0.69, cx + 0.74, eave, cz - 0.69, cx, ridge, cz + 0.69,
    cx, ridge, cz + 0.69, cx + 0.74, eave, cz - 0.69, cx + 0.74, eave, cz + 0.69,
  ];
  for (let i = 0; i < roofVertices.length; i += 9) {
    for (let component = 0; component < 3; component++) {
      [roofVertices[i + 3 + component], roofVertices[i + 6 + component]] = [roofVertices[i + 6 + component], roofVertices[i + 3 + component]];
    }
  }
  batch(triangles(roofVertices), roof);
  batch(triangles([
    cx - 0.54, 1.20, cz + 0.526, cx + 0.54, 1.20, cz + 0.526, cx, ridge - 0.10, cz + 0.526,
    cx + 0.54, 1.20, cz - 0.526, cx - 0.54, 1.20, cz - 0.526, cx, ridge - 0.10, cz - 0.526,
  ]), woodLight);
  box(0.28, 0.62, 0.045, wood, cx + 0.24, 0.65, cz + 0.56);
  box(0.32, 0.28, 0.055, windowMaterial, cx - 0.25, 0.88, cz + 0.56);
  box(0.045, 0.30, 0.07, wood, cx - 0.25, 0.88, cz + 0.59);
  box(0.36, 0.035, 0.07, wood, cx - 0.25, 0.88, cz + 0.59);
  box(0.04, 0.3, 0.34, windowMaterial, cx - 0.556, 0.87, cz - 0.05);
  box(0.20, 0.66, 0.24, stone, cx + 0.35, 1.56, cz - 0.20);
  box(1.15, 0.09, 0.33, woodLight, cx, 0.37, cz + 0.76);
  // Boardwalk follows the shoreline down to the turquoise water.
  for (let i = 0; i < 10; i++) box(0.17, 0.075, 0.60, woodLight, 4.39 - i * 0.18, 0.38, 1.89);
  for (const x of [4.3, 3.05]) {
    for (const z of [1.66, 2.12]) box(0.075, 0.43, 0.075, wood, x, 0.30, z);
  }
  // Flat stepping stones soften the path from the cabin to the dock.
  for (let i = 0; i < 4; i++) {
    batch(new CylinderGeometry(0.17, 0.2, 0.05, 5), sand, new Vector3(4.3 - i * 0.04, 0.255, 1.24 + i * 0.13));
  }

  // Small shoreline boulders, alpine grass tufts and little snow fields.
  const boulders = [[-4.2, 3.8], [-3.5, 4.8], [1.5, 4.8], [3.2, 3.8], [5.6, -1.2], [-5.5, 2.8], [-4.4, -1.1], [0.1, -1.1]];
  boulders.forEach(([x, z], i) => {
    batch(new ConeGeometry(0.28 + (i % 3) * 0.13, 0.42 + (i % 2) * 0.14, 5), stone, new Vector3(x, 0.39, z), new Euler(0, i, 0), new Vector3(1, 1, 0.8));
  });
  for (const [x, z, size] of [[-2.7, -1.2, 0.65], [1.0, -1.18, 0.54], [3.3, -1.4, 0.5], [-4.4, -2.0, 0.43]]) {
    batch(new CylinderGeometry(size, size * 1.1, 0.04, 6), snow, new Vector3(x, 0.265, z), new Euler(0, x, 0), new Vector3(1, 1, 0.5));
  }
  for (let i = 0; i < 18; i++) {
    const angle = i / 18 * Math.PI * 2;
    const x = Math.cos(angle) * 5.95;
    const z = Math.sin(angle) * 5.2;
    if (z < -1.5) continue;
    batch(new ConeGeometry(0.055, 0.26, 3), pineLight, new Vector3(x, 0.32, z));
    batch(new ConeGeometry(0.045, 0.18, 3), pineLight, new Vector3(x + 0.11, 0.28, z + 0.05), new Euler(0, angle, -0.2));
  }

  // The icy shallow at the west bank subtly catches the light.
  batch(new CylinderGeometry(0.30, 0.32, 0.025, 5), ice, new Vector3(-4.28, 0.292, 1.42), new Euler(0, 0.4, 0), new Vector3(1, 1, 0.55));
  batch(new CylinderGeometry(0.19, 0.22, 0.02, 5), ice, new Vector3(-4.13, 0.291, 1.86), new Euler(0, 1, 0), new Vector3(1, 1, 0.55));

  for (const [mat, geometries] of buckets) {
    const merged = mergeGeometries(geometries, false);
    if (merged) {
      const mesh = new Mesh(merged, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    geometries.forEach((geometry) => geometry.dispose());
  }

  const boat = new Group();
  boat.position.set(2.42, 0.31, 2.62);
  boat.rotation.y = -0.5;
  const hullPoints = [new Vector3(0, 0.14, -0.66), new Vector3(0.28, 0.12, -0.3), new Vector3(0.25, 0.12, 0.45), new Vector3(0, 0.14, 0.67), new Vector3(-0.25, 0.12, 0.45), new Vector3(-0.28, 0.12, -0.3)];
  const hullVertices: number[] = [];
  for (let i = 0; i < hullPoints.length; i++) {
    const j = (i + 1) % hullPoints.length;
    triangle(hullVertices, hullPoints[i], hullPoints[j], new Vector3(0, -0.05, 0));
    // Interior triangles keep the little rowboat visibly open from above.
    triangle(hullVertices, hullPoints[j], hullPoints[i], new Vector3(0, 0.015, 0));
  }
  const hull = new Mesh(triangles(hullVertices), wood);
  hull.castShadow = true;
  boat.add(hull);
  for (const z of [-0.24, 0.23]) {
    const seat = new Mesh(new BoxGeometry(0.51, 0.045, 0.13), woodLight);
    seat.position.set(0, 0.13, z);
    seat.castShadow = true;
    boat.add(seat);
  }
  const oar = new Mesh(new BoxGeometry(0.045, 0.045, 1.22), woodLight);
  oar.position.set(0.12, 0.18, 0);
  oar.rotation.y = 0.88;
  boat.add(oar);
  const blade = new Mesh(new BoxGeometry(0.12, 0.045, 0.27), woodLight);
  blade.position.set(0.60, 0.18, 0.39);
  blade.rotation.y = 0.88;
  boat.add(blade);
  group.add(boat);

  // A handful of long, quiet glints makes the animated lake readable at a distance.
  const glints = new Group();
  const glintMaterial = new MeshStandardMaterial({ color: '#cef6e9', transparent: true, opacity: 0.49, roughness: 0.30, depthWrite: false });
  for (let i = 0; i < 13; i++) {
    const glint = new Mesh(new BoxGeometry(0.22 + random() * 0.47, 0.008, 0.018), glintMaterial);
    glint.position.set(-3.4 + random() * 5.3, 0.286, -0.1 + random() * 3.9);
    glints.add(glint);
  }
  group.add(glints);

  return {
    group,
    collectibles: [
      { position: new Vector3(-3.30, 1.02, 3.58), name: '湖光', message: '把一抹湖蓝，收进口袋。' },
      { position: new Vector3(2.4, 1.07, 2.65), name: '归舟', message: '小舟轻晃，时间也慢了下来。' },
      { position: new Vector3(4.24, 2.17, 0.66), name: '山居', message: '雪山脚下，有一盏为你亮着的灯。' },
    ],
    update(elapsed: number, _delta: number) {
      boat.position.y = 0.315 + Math.sin(elapsed * 1.25) * 0.025;
      boat.rotation.z = Math.sin(elapsed * 1.05) * 0.034;
      boat.rotation.y = -0.5 + Math.sin(elapsed * 0.45) * 0.07;
      glints.children.forEach((glint, i) => {
        glint.scale.x = 0.7 + Math.sin(elapsed * 0.72 + i * 1.7) * 0.3;
        glint.position.y = 0.286 + Math.sin(elapsed * 0.82 + i) * 0.006;
      });
      waterMaterial.roughness = 0.24 + Math.sin(elapsed * 0.3) * 0.025;
    },
  };
}
