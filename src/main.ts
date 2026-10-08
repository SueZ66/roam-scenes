import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMeadow } from './scenes/meadow';
import { createAlpine } from './scenes/alpine';
import { createDesert } from './scenes/desert';
import { Soundscape } from './audio';
import './style.css';

const icons = {
  arrow: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none"><path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>',
  muted: '<svg viewBox="0 0 24 24" fill="none"><path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/></svg>',
  fullscreen: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 5v14M15 5v14"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none"><path d="m8 5 11 7-11 7V5Z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none"><path d="m12 2 2.7 6.8L22 12l-7.3 3.2L12 22l-2.7-6.8L2 12l7.3-3.2L12 2Z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  drag: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 13V6a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v8c0 4-3 6-7 6-2 0-4-1-5-3l-4-5a2 2 0 0 1 3-3l1 3Z"/></svg>',
};

const scenes = [
  { id: 'meadow', name: '风起青野', en: 'THE GREEN ESCAPE', subtitle: '山野有风，自由有形。', copy: '沿着溪流走一走，听风车慢慢转。\n没有目的地，也是一场好旅行。', tag: '草木 / 溪流 / 微风', weather: '晴 · 微风', temperature: '23°', color: '#67866a', bg: '#f3f3eb', sky: 0xf3f3eb, create: createMeadow },
  { id: 'alpine', name: '雪山来信', en: 'LETTERS FROM THE ALPS', subtitle: '在群山之间，听见安静。', copy: '松林把时间放慢，湖面收藏着雪山。\n把心事交给远方，把此刻留给自己。', tag: '雪峰 / 松林 / 湖泊', weather: '晴 · 清冽', temperature: '06°', color: '#638891', bg: '#edf2f1', sky: 0xedf2f1, create: createAlpine },
  { id: 'desert', name: '日落沙洲', en: 'WHERE THE SUN LINGERS', subtitle: '等一场日落，赴一场漫游。', copy: '穿过暖金色的沙丘，在绿洲旁停留。\n风掠过的地方，都有温柔的回响。', tag: '沙丘 / 绿洲 / 余晖', weather: '晴 · 暖阳', temperature: '31°', color: '#b68157', bg: '#f7eee2', sky: 0xf7eee2, create: createDesert },
];

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="viewport" aria-label="可拖动旋转、滚轮缩放的三维风景"></div>
  <div class="grain" aria-hidden="true"></div>
  <header class="header">
    <a href="./" class="brand" aria-label="栖游首页"><span class="brand-mark"><svg viewBox="0 0 40 40" fill="none"><path d="m5 29 12-20 7 12 5-8 9 16H5Z"/><circle cx="31" cy="7" r="3"/></svg></span><span>栖游<span class="brand-en">ROAM</span></span></a>
    <nav aria-label="主导航"><button class="nav-link active" id="landscape-nav">风景漫游<span></span></button><button class="nav-link" id="journal-open">旅途手记 <span class="journal-dot"></span></button></nav>
    <div class="header-tools"><span class="slow-label">TAKE IT SLOW.</span><button class="icon-button" id="sound" aria-label="开启环境音" aria-pressed="false" title="开启环境音">${icons.muted}</button><button class="icon-button fullscreen" id="fullscreen" aria-label="全屏浏览" title="全屏浏览">${icons.fullscreen}</button></div>
  </header>
  <main>
    <section class="hero" aria-labelledby="hero-title"><div class="eyebrow"><span class="tiny-sun">✳</span> A LITTLE WORLD. A LITTLE WONDER.</div><h1 id="hero-title">把日常，<br>留在<span class="title-accent">远方<svg viewBox="0 0 160 14" fill="none"><path d="M3 9c35-8 93-9 153-3M18 13c38-5 75-5 116-3"/></svg></span>。</h1><p class="hero-description">不必远行，也能抵达心里的旷野。<br>转动世界，发现藏在风景里的小美好。</p><button class="start-button" id="start">开始漫游 <span>${icons.arrow}</span></button><div class="hero-note"><span class="live-dot"></span><span id="hero-note">三个小世界，片刻慢生活</span></div></section>
    <aside class="world-meta" aria-label="当前场景"><span class="vertical-label">YOUR NEXT LITTLE ESCAPE</span><div class="world-index"><span id="world-number">01</span><span> / 03</span></div></aside>
    <div class="scene-caption"><div class="caption-line"></div><span id="scene-en">THE GREEN ESCAPE</span><span class="caption-coordinates" id="scene-tag">草木 / 溪流 / 微风</span></div>
    <div id="markers" aria-label="风景碎片"></div>
    <div class="scene-toolbar"><div class="drag-hint">${icons.drag}<span>拖动旋转 · 滚轮缩放</span></div><div class="toolbar-divider"></div><button class="icon-button" id="rotation" aria-label="暂停自动旋转" aria-pressed="true" title="暂停自动旋转">${icons.pause}</button><button class="icon-button" id="reset" aria-label="重置视角" title="重置视角">${icons.reset}</button></div>
    <section class="bottom-panel" aria-label="选择目的地"><div class="destination-heading"><span class="section-kicker">PICK YOUR MOMENT</span><h2>今天，去哪里？<span>01 — 03</span></h2></div><div class="scene-options" role="group" aria-label="风景场景">${scenes.map((s, i) => `<button class="scene-card ${i === 0 ? 'selected' : ''}" data-scene="${i}" aria-pressed="${i === 0}"><span class="scene-thumbnail thumb-${s.id}" aria-hidden="true"><span class="thumb-sun"></span><span class="thumb-mountain mountain-back"></span><span class="thumb-mountain mountain-front"></span><span class="thumb-water"></span><span class="thumb-tree tree-one"></span><span class="thumb-tree tree-two"></span></span><span class="card-copy"><span class="card-index">0${i + 1} <span>${['MEADOW', 'ALPINE', 'DESERT'][i]}</span></span><strong>${s.name}</strong><span class="card-detail">${s.tag.replaceAll(' / ', ' · ')}</span></span><span class="card-arrow">${icons.arrow}</span><span class="card-progress" id="card-progress-${i}">0/3</span></button>`).join('')}</div></section>
    <div class="explore-status" id="explore-status"><span class="status-star">${icons.star}</span><div><span id="collection-label">寻找散落的风景碎片</span><span id="collection-detail">点击岛上的闪光，收藏此刻</span></div><span class="collection-count" id="collection-count">0<span>/ 3</span></span></div>
  </main>
  <footer><span>MADE FOR WANDERING<span class="footer-star">✳</span>心在远方，身在此刻。</span><span class="weather"><span class="weather-sun">☼</span><span id="weather">晴 · 微风</span><span class="footer-divider"></span><span id="temperature">23°</span></span><button id="help-open">怎么玩 <span>↗</span></button></footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <div class="loading" id="loading"><div class="loading-symbol">✳</div><span>正在把远方搬到眼前</span><small>BUILDING YOUR LITTLE ESCAPE</small></div>
  <dialog id="journal" aria-labelledby="journal-title"><button class="dialog-close icon-button" aria-label="关闭旅途手记">${icons.close}</button><span class="section-kicker">A POCKETFUL OF MEMORIES</span><h2 id="journal-title">旅途手记<span>收集风景，也收集好心情。</span></h2><div class="journal-summary"><span id="journal-total">0</span> / 9 枚风景碎片</div><div id="journal-content"></div><p class="dialog-footnote">手记保存在当前浏览器，下次回来也在。</p><button class="text-button" id="reset-progress">重新收集</button></dialog>
  <dialog id="help" aria-labelledby="help-title"><button class="dialog-close icon-button" aria-label="关闭玩法说明">${icons.close}</button><span class="section-kicker">NO RUSH. JUST ROAM.</span><h2 id="help-title">把世界，转一转。</h2><div class="help-steps"><p><b>01</b><span><strong>换一个心情</strong>点击下方卡片，去青野、雪山或沙洲。</span></p><p><b>02</b><span><strong>找一个好角度</strong>拖动旋转小岛，滚轮缩放；手机上双指缩放。</span></p><p><b>03</b><span><strong>带走一点美好</strong>每座岛藏着 3 枚闪光碎片。点击收集，写进旅途手记。</span></p></div><p class="dialog-footnote">键盘 1 / 2 / 3 切换场景 · 空格暂停旋转<br>环境音默认关闭，点击右上角开启。</p><button class="start-button" id="help-done">出发吧 ${icons.arrow}</button></dialog>
`;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
let collected = new Set<string>();
try {
  const saved: unknown = JSON.parse(localStorage.getItem('roam-fragments-v1') || '[]');
  if (Array.isArray(saved)) collected = new Set(saved.filter((v): v is string => typeof v === 'string' && /^(meadow|alpine|desert)-[0-2]$/.test(v)));
} catch { /* Private browsing or stale storage never blocks the experience. */ }
let activeIndex = 0;
let exploring = false;
let toastTimer = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sound = new Soundscape();

function toast(message: string) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => $('#toast').classList.remove('visible'), 3800);
}

function openDialog(id: string) { $<HTMLDialogElement>(id).showModal(); }
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
});
$('#help-open').addEventListener('click', () => openDialog('#help'));
$('#help-done').addEventListener('click', () => { $<HTMLDialogElement>('#help').close(); startExploring(); });
$('#journal-open').addEventListener('click', () => openDialog('#journal'));
$('#sound').addEventListener('click', async () => {
  try { const enabled = await sound.toggle(); $('#sound').innerHTML = enabled ? icons.sound : icons.muted; $('#sound').setAttribute('aria-pressed', String(enabled)); $('#sound').setAttribute('aria-label', enabled ? '关闭环境音' : '开启环境音'); $('#sound').title = enabled ? '关闭环境音' : '开启环境音'; toast(enabled ? '风声已开启，慢慢听。' : '环境音已关闭'); } catch { toast('当前浏览器暂不支持环境音。'); }
});
$('#fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { toast('当前浏览器暂不支持全屏，可使用浏览器全屏功能。'); }
});

let renderer: THREE.WebGLRenderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
catch {
  $('#loading').innerHTML = '<span class="loading-symbol">☁</span><h2>这片风景需要 WebGL</h2><p>请使用支持 WebGL 的新版浏览器，并开启硬件加速。</p><button class="start-button" onclick="location.reload()">重新试试 ↗</button>';
  throw new Error('WebGL is unavailable');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
renderer.domElement.setAttribute('aria-label', '三维浮岛，可用鼠标拖动或触摸旋转');
$('#viewport').appendChild(renderer.domElement);

const world = new THREE.Scene();
world.background = new THREE.Color(scenes[0].sky);
world.fog = new THREE.Fog(scenes[0].sky, 44, 85);
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
const initialCamera = new THREE.Vector3(16, 13, 20);
camera.position.copy(initialCamera);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 19;
controls.maxDistance = 39;
controls.minPolarAngle = Math.PI * 0.15;
controls.maxPolarAngle = Math.PI * 0.46;
controls.autoRotate = !reducedMotion;
controls.autoRotateSpeed = 0.38;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.7;
const ambient = new THREE.HemisphereLight(0xffffff, 0x747967, 2.5);
world.add(ambient);
const sun = new THREE.DirectionalLight(0xfff5dc, 4.2);
sun.position.set(-8, 17, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 48 });
sun.shadow.normalBias = 0.04;
sun.shadow.bias = -0.00015;
sun.shadow.radius = 3;
world.add(sun);
const fill = new THREE.DirectionalLight(0xe7f4ff, 1.2);
fill.position.set(12, 7, -10);
world.add(fill);

// A soft painted shadow anchors the island without a ground plane or texture asset.
const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
const shadowContext = shadowCanvas.getContext('2d')!;
const gradient = shadowContext.createRadialGradient(64, 64, 3, 64, 64, 64);
gradient.addColorStop(0, 'rgba(62,72,51,0.23)'); gradient.addColorStop(0.5, 'rgba(62,72,51,0.10)'); gradient.addColorStop(1, 'rgba(62,72,51,0)');
shadowContext.fillStyle = gradient; shadowContext.fillRect(0, 0, 128, 128);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(23, 19), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -3.5; world.add(shadow);

const landscapes = scenes.map(scene => scene.create());
const island = new THREE.Group(); world.add(island); island.add(landscapes[0].group);
let transition = 1;
let elapsed = 0;
const projected = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const occlusionDirection = new THREE.Vector3();
let lastOcclusionCheck = -1;
let markerVisibility: boolean[] = [true, true, true];

function updateJournal() {
  scenes.forEach((scene, i) => {
    const count = [...collected].filter(id => id.startsWith(scene.id)).length;
    $(`#card-progress-${i}`).textContent = `${count}/3`;
    $(`#card-progress-${i}`).classList.toggle('complete', count === 3);
  });
  const count = [...collected].filter(id => id.startsWith(scenes[activeIndex].id)).length;
  $('#collection-count').innerHTML = `${count}<span>/ 3</span>`;
  $('#collection-label').textContent = count === 3 ? '这一刻，已好好收藏' : '寻找散落的风景碎片';
  $('#collection-detail').textContent = count === 3 ? '换一座小岛，让旅途继续' : '点击岛上的闪光，收藏此刻';
  $('#journal-total').textContent = String(collected.size);
  $('.journal-dot').classList.toggle('has-memory', collected.size > 0);
  $('#journal-content').innerHTML = scenes.map((scene, i) => `<section class="journal-scene"><h3><span>0${i + 1}</span>${scene.name}</h3>${landscapes[i].collectibles.map((spot, j) => `<div class="journal-entry ${collected.has(`${scene.id}-${j}`) ? 'found' : ''}"><span>${collected.has(`${scene.id}-${j}`) ? '✦' : '◇'}</span><p><strong>${collected.has(`${scene.id}-${j}`) ? spot.name : '尚未发现的风景'}</strong><small>${collected.has(`${scene.id}-${j}`) ? spot.message : '去岛上看看，惊喜就在转角。'}</small></p></div>`).join('')}</section>`).join('');
}

function collect(index: number) {
  const key = `${scenes[activeIndex].id}-${index}`;
  if (collected.has(key)) return;
  collected.add(key);
  try { localStorage.setItem('roam-fragments-v1', JSON.stringify([...collected])); } catch { /* storage may be disabled */ }
  sound.chime(index);
  const spot = landscapes[activeIndex].collectibles[index];
  const marker = $<HTMLButtonElement>(`#fragment-${index}`);
  marker.classList.add('collected'); marker.disabled = true;
  if (!exploring) startExploring(false);
  updateJournal();
  toast(collected.size === 9 ? '九枚风景，九个瞬间。你的旅途手记完整了。' : `已收藏「${spot.name}」 · ${spot.message}`);
  const nextMarker = document.querySelector<HTMLButtonElement>('.fragment:not(:disabled)');
  if (document.activeElement === marker) (nextMarker || $<HTMLButtonElement>('#journal-open')).focus();
}

function createMarkers() {
  markerVisibility = [true, true, true];
  lastOcclusionCheck = -1;
  $('#markers').innerHTML = landscapes[activeIndex].collectibles.map((spot, i) => `<button id="fragment-${i}" class="fragment ${collected.has(`${scenes[activeIndex].id}-${i}`) ? 'collected' : ''}" ${collected.has(`${scenes[activeIndex].id}-${i}`) ? 'disabled' : ''} aria-label="收集${spot.name}" style="--delay:${i * 0.6}s"><span class="fragment-ring"></span>${icons.star}<span class="fragment-tooltip">收藏 · ${spot.name}</span></button>`).join('');
  landscapes[activeIndex].collectibles.forEach((_, i) => $(`#fragment-${i}`).addEventListener('click', () => collect(i)));
}

function setRotation(value: boolean) {
  controls.autoRotate = value;
  $('#rotation').innerHTML = value ? icons.pause : icons.play;
  $('#rotation').setAttribute('aria-label', value ? '暂停自动旋转' : '开启自动旋转');
  $('#rotation').setAttribute('aria-pressed', String(value));
  $('#rotation').title = value ? '暂停自动旋转' : '开启自动旋转';
}

function setScene(index: number) {
  if (index === activeIndex) return;
  island.remove(landscapes[activeIndex].group);
  activeIndex = index;
  island.add(landscapes[index].group);
  transition = reducedMotion ? 1 : 0;
  const scene = scenes[index];
  document.documentElement.style.setProperty('--accent', scene.color);
  document.documentElement.style.setProperty('--page-bg', scene.bg);
  world.background = new THREE.Color(scene.sky);
  (world.fog as THREE.Fog).color.set(scene.sky);
  ambient.groundColor.set(index === 2 ? 0xa07351 : 0x747967);
  sun.color.set(index === 2 ? 0xffddaf : 0xfff5dc);
  $('#world-number').textContent = `0${index + 1}`;
  $('#scene-en').textContent = scene.en;
  $('#scene-tag').textContent = scene.tag;
  $('#weather').textContent = scene.weather;
  $('#temperature').textContent = scene.temperature;
  document.querySelectorAll<HTMLButtonElement>('.scene-card').forEach((button, i) => { button.classList.toggle('selected', i === index); button.setAttribute('aria-pressed', String(i === index)); });
  if (exploring) $('#hero-note').textContent = scene.subtitle;
  camera.position.copy(initialCamera); controls.target.set(0, 0.8, 0); controls.update();
  createMarkers(); updateJournal();
}

function startExploring(notify = true) {
  exploring = true; document.body.classList.add('exploring');
  $('#start').innerHTML = `我的旅途手记 <span>${icons.arrow}</span>`;
  $('#hero-note').textContent = scenes[activeIndex].subtitle;
  setRotation(false);
  if (notify) toast('转动小岛，点击闪光 ✦，发现 3 枚风景碎片。');
}

$('#start').addEventListener('click', () => { if (exploring) openDialog('#journal'); else startExploring(); });
$('#landscape-nav').addEventListener('click', () => { document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close()); });
$('#rotation').addEventListener('click', () => setRotation(!controls.autoRotate));
$('#reset').addEventListener('click', () => { camera.position.copy(initialCamera); controls.target.set(0, 0.8, 0); controls.update(); toast('已经回到最初的好风景。'); });
document.querySelectorAll<HTMLButtonElement>('.scene-card').forEach(button => button.addEventListener('click', () => setScene(Number(button.dataset.scene))));
controls.addEventListener('start', () => setRotation(false));
let resetPending = false;
$('#reset-progress').addEventListener('click', () => {
  if (!resetPending) { resetPending = true; $('#reset-progress').textContent = '再次点击，清空手记并重新收集'; window.setTimeout(() => { resetPending = false; $('#reset-progress').textContent = '重新收集'; }, 4000); return; }
  resetPending = false; collected.clear(); try { localStorage.removeItem('roam-fragments-v1'); } catch { /* optional storage */ }
  createMarkers(); updateJournal(); $('#reset-progress').textContent = '重新收集'; toast('新的旅途，从此刻开始。');
});
document.addEventListener('keydown', event => {
  const target = event.target as HTMLElement;
  if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable || event.altKey || event.ctrlKey || event.metaKey) return;
  if (['1', '2', '3'].includes(event.key)) setScene(Number(event.key) - 1);
  if (event.code === 'Space' && !/BUTTON|A/.test(target.tagName)) { event.preventDefault(); setRotation(!controls.autoRotate); }
});

function resize() {
  const width = window.innerWidth, height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  const mobile = width <= 760;
  // Preserve the island's horizontal fit on tall phones instead of cropping its sides.
  camera.fov = mobile ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(46 / 2)) / Math.min(1, width / height / 0.8))) : 38;
  camera.setViewOffset(width, height, mobile ? 0 : -width * 0.145, mobile ? height * 0.035 : height * 0.02, width, height);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize(); createMarkers(); updateJournal(); setRotation(!reducedMotion);

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  if (document.hidden) { clock.getDelta(); return; }
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;
  transition = Math.min(1, transition + delta * 2.6);
  const ease = 1 - Math.pow(1 - transition, 3);
  island.scale.setScalar(0.88 + ease * 0.12);
  island.position.y = (1 - ease) * -0.7 + (reducedMotion ? 0 : Math.sin(elapsed * 0.6) * 0.075);
  if (!reducedMotion) landscapes[activeIndex].update(elapsed, delta);
  controls.update(delta);
  renderer.render(world, camera);
  const checkOcclusion = elapsed - lastOcclusionCheck > 0.15;
  landscapes[activeIndex].collectibles.forEach((spot, i) => {
    const marker = $(`#fragment-${i}`);
    const position = spot.position.clone(); island.localToWorld(position);
    if (checkOcclusion && !collected.has(`${scenes[activeIndex].id}-${i}`)) {
      occlusionDirection.copy(position).sub(camera.position);
      const distance = occlusionDirection.length();
      raycaster.set(camera.position, occlusionDirection.normalize());
      raycaster.far = distance - 0.35;
      markerVisibility[i] = !raycaster.intersectObject(landscapes[activeIndex].group, true).some(hit => hit.object instanceof THREE.Mesh && (!Array.isArray(hit.object.material) && hit.object.material.opacity > 0.65));
    }
    projected.copy(position).project(camera);
    const x = (projected.x * 0.5 + 0.5) * innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * innerHeight;
    marker.style.left = `${x}px`; marker.style.top = `${y}px`;
    const visible = markerVisibility[i] && projected.z < 1 && projected.z > -1 && y > 100 && y < innerHeight - (innerWidth <= 760 ? 200 : 195) && x > (innerWidth <= 760 ? 15 : innerWidth * 0.32) && x < innerWidth - 40;
    marker.classList.toggle('occluded', !visible || transition < 0.7);
    marker.setAttribute('aria-hidden', String(!visible));
    marker.tabIndex = visible && !collected.has(`${scenes[activeIndex].id}-${i}`) ? 0 : -1;
  });
  if (checkOcclusion) lastOcclusionCheck = elapsed;
}
frame();
requestAnimationFrame(() => { $('#loading').classList.add('loaded'); setTimeout(() => $('#loading').remove(), 600); });

// Read-only diagnostics make browser verification possible without changing gameplay.
Object.defineProperty(window, '__roam', { get: () => ({ scene: scenes[activeIndex].id, collected: [...collected], drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, autoRotate: controls.autoRotate, camera: camera.position.toArray(), sceneNames: scenes.map(s => s.name) }) });
