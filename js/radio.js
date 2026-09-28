// RadioClear's shared parts.
//
// 1. Radio physics used across chapters, with sources:
//    - Speed of light c = 299,792,458 m/s (exact, SI). Wavelength λ = c / f.
//    - Bands (ITU Radio Regulations, Region 3 which includes India): long wave 148.5–283.5 kHz (Region 1 only:
//      India has no LW broadcasting), medium wave 531–1,602 kHz on a 9 kHz grid (Regions 1 and 3; the Americas use
//      530–1,700 kHz on 10 kHz), shortwave broadcast bands between 2.3 and 26.1 MHz, FM 88–108 MHz in India
//      (Wikipedia "Medium wave", "Shortwave bands", "FM broadcasting"; WPC National Frequency Allocation Plan).
//    - An AM broadcast channel carries audio up to about 4.5 kHz (9 kHz channel = two sidebands). FM broadcast
//      uses a peak deviation of ±75 kHz and audio up to 15 kHz, so Carson's rule gives 2 × (75 + 15) = 180 kHz
//      (ITU-R BS.450; Carson 1922). FM pre-emphasis in India is 50 µs (ITU-R BS.450, used outside the Americas).
//    - Superheterodyne intermediate frequencies: 455 kHz for AM, 10.7 MHz for FM (Wikipedia "Superheterodyne
//      receiver", "Intermediate frequency"). The local oscillator runs above the station: LO = f + IF, so the image
//      sits at f + 2 × IF. For FM 2 × 10.7 = 21.4 MHz is more than the 20 MHz width of the band, so an FM station's
//      image always lands outside the band.
//    - Tuned circuit: f = 1 / (2π√(LC)). A medium-wave ferrite-rod coil is typically a few hundred µH and the
//      classic tuning gang about 10–365 pF (e.g. RSGB Radio Communication Handbook; ARRL Handbook "Receivers").
//      This box uses L = 230 µH and C = 40–400 pF including trimmer and stray capacitance, which covers
//      523–1,657 kHz: the whole MW band with a little to spare.
//    - Selectivity of a single tuned circuit: |H| = 1 / √(1 + Q²(f/f0 − f0/f)²), bandwidth ≈ f0 / Q.
//    - Ionosphere (Wikipedia "Ionosphere"; ITU-R P.1147 for MW skywave): D layer 60–90 km, present only in
//      daylight, absorbs MW; E layer about 90–150 km (reflects MW at night); F layer 150–500 km (reflects SW).
//    - Radio horizon over a smooth Earth with standard refraction (k = 4/3): d ≈ 4.12 (√h1 + √h2) km, h in metres.
// 2. A tiny sound lab (after TelephoneClear's): a synthetic babbling voice (no words, nobody's voice), and a real
//    AM / FM transmit–receive simulation in complex baseband with noise, crackle, a limiter and de-emphasis.
// 3. A Web Audio player that starts only after a real click, obeys the kit's mute button and stays silent while
//    the Glassbox studio records a video.
// 4. Boards, labels and a generic 1970s–80s household transistor radio built from primitives (no logos).
import { THREE, M, rod, beam, box, torus, tube, sphere, clamp, latheX } from './kit.js';
import { audio } from './ui.js';

export const TAU = Math.PI * 2;
export const C0 = 299792458;
export const lambdaM = (f) => C0 / f;

// ---------------------------------------------------------------- formatting
export function fmtF(f) {
  if (f >= 1e9) return +(f / 1e9).toFixed(2) + ' GHz';
  if (f >= 1e6) return +(f / 1e6).toFixed(f >= 1e8 ? 1 : 2) + ' MHz';
  if (f >= 1e3) return Math.round(f / 1e3) + ' kHz';
  return Math.round(f) + ' Hz';
}
export function fmtL(m) {
  if (m >= 1000) return +(m / 1000).toFixed(1) + ' km';
  if (m >= 10) return Math.round(m) + ' m';
  if (m >= 1) return m.toFixed(1) + ' m';
  if (m >= 0.01) return +(m * 100).toFixed(1) + ' cm';
  return +(m * 1000).toFixed(1) + ' mm';
}

// ---------------------------------------------------------------- bands and stations
export const MW = { lo: 531e3, hi: 1602e3, step: 9e3 };
export const FMB = { lo: 88e6, hi: 108e6 };
export const IF = { am: 455e3, fm: 10.7e6 };
// Real AIR medium-wave frequencies from the station list on Wikipedia's "All India Radio" page (checked 2026).
// Frequencies and powers change over time; the evening signal strengths (0–1) are illustrative only.
export const STATIONS = [
  { f: 594e3, name: 'AIR Kolkata A', s: 0.55 },
  { f: 702e3, name: 'AIR Jalandhar', s: 0.7 },
  { f: 720e3, name: 'AIR Chennai A', s: 0.45 },
  { f: 864e3, name: 'AIR Shillong', s: 0.5 },
  { f: 882e3, name: 'AIR Imphal', s: 0.35 },
  { f: 1053e3, name: 'AIR Tuticorin', s: 0.4 },
  { f: 1134e3, name: 'AIR Kolkata (Chinsurah)', s: 0.8 },
  { f: 1566e3, name: 'AIR Nagpur', s: 0.6 },
];

// ---------------------------------------------------------------- tuned circuit
export const L_ANT = 230e-6;           // H, ferrite-rod coil
export const C_MIN = 40e-12, C_MAX = 400e-12;
export const fRes = (L, C) => 1 / (TAU * Math.sqrt(L * C));
export const CofF = (f, L = L_ANT) => 1 / ((TAU * f) ** 2 * L);
export const resp = (f, f0, Q) => 1 / Math.sqrt(1 + (Q * (f / f0 - f0 / f)) ** 2);
export const dB = (x) => 20 * Math.log10(Math.max(1e-9, x));

// Bessel function of the first kind, J_n(x), by the power series (fine for the β up to ~100 used here only
// when summed carefully; for large x we use the recurrence downward, Miller's algorithm).
export function besselJ(n, x) {
  n = Math.abs(n);
  if (x === 0) return n === 0 ? 1 : 0;
  // Miller's backward recurrence, normalised with J0 + 2ΣJ2k = 1
  const N = 2 * Math.floor((Math.max(n, x) + 15 + Math.sqrt(40 * Math.max(n, x))) / 2);
  let jp1 = 0, j = 1e-30, res = 0, sum = 0;
  for (let k = N; k > 0; k--) {
    const jm1 = (2 * k / x) * j - jp1;
    jp1 = j; j = jm1;
    if (Math.abs(j) > 1e250) { j *= 1e-250; jp1 *= 1e-250; res *= 1e-250; sum *= 1e-250; }
    if (k - 1 === n) res = j;
    if ((k - 1) % 2 === 0 && k - 1 > 0) sum += 2 * j;
  }
  sum += j;
  return res / sum;
}

// ---------------------------------------------------------------- propagation
export const IONO = { D: [60, 90], E: [90, 150], F: [150, 500], Eh: 110, Fh: 300 };
export const EARTH_R = 6371;
export const horizonKm = (h1, h2 = 10) => 4.12 * (Math.sqrt(h1) + Math.sqrt(h2));
// Longest single hop for a layer at height h (km), grazing take-off: 2·R·acos(R/(R+h)).
export const hopKm = (h) => 2 * EARTH_R * Math.acos(EARTH_R / (EARTH_R + h));

// ---------------------------------------------------------------- random numbers and DSP
export const SR = 22050;
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * r()); }
const N = (sec) => Math.max(1, Math.round(sec * SR));
function hp1(x, fc, sr = SR) { const k = 1 - Math.exp((-TAU * fc) / sr); let y = 0; for (let i = 0; i < x.length; i++) { y += k * (x[i] - y); x[i] = x[i] - y; } return x; }
function lp1(x, fc, sr) { const k = 1 - Math.exp((-TAU * fc) / sr); let y = 0; for (let i = 0; i < x.length; i++) { y += k * (x[i] - y); x[i] = y; } return x; }
function reson(x, f, bw, out = new Float32Array(x.length)) {
  const F = typeof f === 'function' ? f : () => f;
  let y1 = 0, y2 = 0, a1 = 0, a2 = 0, g = 0;
  for (let i = 0; i < x.length; i++) {
    if ((i & 31) === 0) { const r = Math.exp((-Math.PI * bw) / SR); a1 = 2 * r * Math.cos((TAU * F(i)) / SR); a2 = -r * r; g = 1 - r; }
    const y = g * x[i] + a1 * y1 + a2 * y2; y2 = y1; y1 = y; out[i] += y;
  }
  return out;
}
export function normalize(a, peak = 0.9) { let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); if (m > 0) for (let i = 0; i < a.length; i++) a[i] *= peak / m; return a; }
function fade(a, inS = 0.005, outS = 0.02) { const ni = N(inS), no = N(outS); for (let i = 0; i < ni && i < a.length; i++) a[i] *= i / ni; for (let i = 0; i < no && i < a.length; i++) a[a.length - 1 - i] *= i / no; return a; }
// RBJ biquad low-pass (Audio EQ Cookbook), Q = 0.707, at any sample rate.
function lp2(x, f, sr) {
  const w = (TAU * f) / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * 0.7071);
  const b0 = (1 - cs) / 2, b1 = 1 - cs, b2 = (1 - cs) / 2, a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; x[i] = v; }
  return x;
}
const lp4 = (x, f, sr) => lp2(lp2(x, f, sr), f, sr);

// Vowel formants F1, F2, F3 of an adult voice (Peterson & Barney, JASA 1952).
const VOWELS = [[730, 1090, 2440], [270, 2290, 3010], [300, 870, 2240], [530, 1840, 2480], [570, 840, 2410]];
// A generic synthetic announcer (after TelephoneClear): a glottal pulse train through three moving formant
// resonators, 4–5 syllables a second like real speech, with hissy consonants. It says no words.
export function voice(sec = 2.4, seed = 3, f0 = 125) {
  const n = N(sec), r = rng(seed), src = new Float32Array(n), env = new Float32Array(n), fm = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const syl = []; let t = 0.05;
  while (t < sec - 0.25) { const d = 0.14 + r() * 0.12; syl.push({ t, d, v: VOWELS[Math.floor(r() * 5)], cons: r() < 0.7, p: 0.9 + r() * 0.3 }); t += d + 0.04 + (r() < 0.15 ? 0.25 : 0.02); }
  let ph = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    let e = 0, v = VOWELS[0], p = 1;
    for (const s of syl) { if (tt >= s.t - 0.03 && tt < s.t + s.d + 0.05) { const k = (tt - s.t) / s.d; e = Math.max(e, Math.sin(Math.PI * clamp(k, 0, 1)) ** 0.6); v = s.v; p = s.p; } }
    env[i] = e;
    const f = f0 * p * (1 - 0.12 * (tt / sec)) * (1 + 0.02 * Math.sin(TAU * 5.3 * tt));
    ph += f / SR; if (ph >= 1) ph -= 1;
    const g = ph < 0.4 ? 0.5 * (1 - Math.cos((Math.PI * ph) / 0.4)) : ph < 0.56 ? Math.cos((Math.PI * (ph - 0.4)) / 0.32) : 0;
    src[i] = (g - last) * e; last = g;
    for (let k = 0; k < 3; k++) fm[k][i] = i ? fm[k][i - 1] + (v[k] - fm[k][i - 1]) * 0.004 : v[k];
  }
  const out = new Float32Array(n);
  reson(src, (i) => fm[0][i], 80, out); reson(src, (i) => fm[1][i], 100, out);
  const o3 = reson(src, (i) => fm[2][i], 140); for (let i = 0; i < n; i++) out[i] += o3[i] * 0.5;
  hp1(out, 80);
  out.env = env;
  return fade(normalize(out, 0.8));
}
export function tone(hz, sec = 2.4, amp = 0.8) { const n = N(sec), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = amp * Math.sin((TAU * hz * i) / SR); return fade(a); }
// Band static: white noise with occasional crackles, as heard between stations.
export function hiss(sec = 2.4, seed = 5) {
  const n = N(sec), r = rng(seed), a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = (r() * 2 - 1) * 0.35;
  for (let k = 0; k < sec * 12; k++) { const i0 = Math.floor(r() * n), A = 0.5 + r(); for (let j = 0; j < 90 && i0 + j < n; j++) a[i0 + j] += A * (r() * 2 - 1) * Math.exp(-j / 20); }
  lp4(a, 4500, SR);
  return normalize(a, 0.6);
}

// ---------------------------------------------------------------- AM / FM link simulation
// Complex-baseband model of one broadcast link. The carrier has amplitude 1. Noise has the same density N0
// for both modes; CNR is quoted in each receiver's own IF bandwidth (AM 9 kHz, FM 180 kHz), so FM, with a
// channel 20 times wider, starts with 13 dB less carrier-to-noise and still wins on the audio.
// Crackle: short, strong impulses (lightning and sparking motors), the static AM listeners know.
// AM receiver: IF filter ±4.5 kHz, envelope detector, audio low-pass 4.5 kHz.
// FM transmitter: 50 µs pre-emphasis, deviation dev; receiver: IF ±100 kHz, limiter and discriminator
// (angle of z[n]·z*[n−1]), audio low-pass 15 kHz, 50 µs de-emphasis.
// Audio SNR is measured by running the same link with no noise and comparing.
const cache = new Map();
let VOICE_SIM = null;
export function simulateLink({ mode = 'am', src = 'voice', toneHz = 1000, m = 0.8, dev = 75e3, cnrAm = 30, crackle = 0.5, seed = 11 } = {}) {
  const key = JSON.stringify([mode, src, toneHz, m.toFixed(2), Math.round(dev), cnrAm.toFixed(1), crackle.toFixed(2)]);
  if (cache.has(key)) return cache.get(key);
  const x = src === 'voice' ? (VOICE_SIM ||= voice(1.6, 3)) : tone(toneHz, 1.6, 0.8);
  const run = (noisy) => (mode === 'am' ? amLink(x, m, noisy ? cnrAm : null, crackle, seed) : fmLink(x, dev, noisy ? cnrAm : null, crackle, seed));
  const clean = run(false), out = run(true);
  let es = 0, en = 0;
  for (let i = 2000; i < out.length - 500; i++) { es += clean[i] ** 2; en += (out[i] - clean[i]) ** 2; }
  const snr = 10 * Math.log10(es / Math.max(1e-12, en));
  const res = { out: normalizeAudio(out, clean), clean, snr, cnr: mode === 'am' ? cnrAm : cnrAm - 10 * Math.log10(180 / 9) };
  if (cache.size > 24) cache.clear();
  cache.set(key, res);
  return res;
}
function normalizeAudio(out, clean) { let m = 0; for (const v of clean) m = Math.max(m, Math.abs(v)); const k = m > 0 ? 0.7 / m : 1; const o = new Float32Array(out.length); for (let i = 0; i < out.length; i++) o[i] = clamp(out[i] * k, -1, 1); return o; }
// Complex noise with density set so that CNR in bandwidth B (Hz) equals cnr dB at sample rate fs.
function addNoise(re, im, cnr, B, fs, crackle, r) {
  const pn = Math.pow(10, -cnr / 10) * (fs / B) / 2;          // variance per rail over the full sampled band
  const sd = Math.sqrt(pn);
  for (let i = 0; i < re.length; i++) { re[i] += gauss(r) * sd; im[i] += gauss(r) * sd; }
  // crackle: up to 10 impulses a second, each a burst about 0.2 ms long, scaled by the crackle setting
  const n = Math.round(re.length / fs * 10 * Math.min(1, crackle * 2)), len = Math.max(2, Math.round(fs * 0.0002));
  for (let k = 0; k < n; k++) {
    const i0 = Math.floor(r() * (re.length - len)), A = (2 + r() * 6) * crackle * Math.sqrt(fs / 22050) * 0.25;
    const ph = r() * TAU;
    for (let j = 0; j < len; j++) { re[i0 + j] += A * Math.cos(ph) * (1 - j / len); im[i0 + j] += A * Math.sin(ph) * (1 - j / len); }
  }
}
function amLink(x, m, cnr, crackle, seed) {
  const fs = SR, n = x.length, re = new Float32Array(n), im = new Float32Array(n);
  for (let i = 0; i < n; i++) re[i] = 1 + m * x[i] / 0.8;
  if (cnr !== null) addNoise(re, im, cnr, 9000, fs, crackle, rng(seed));
  lp4(re, 4500, fs); lp4(im, 4500, fs);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.hypot(re[i], im[i]);
  hp1(out, 60, fs); lp4(out, 4500, fs);
  return out;
}
function fmLink(x, dev, cnr, crackle, seed) {
  const K = 12, fs = SR * K, n = x.length * K;
  // pre-emphasis at the audio rate, then limit so the peak deviation is dev
  const pe = new Float32Array(x.length), a = (50e-6) * SR;
  for (let i = 0; i < x.length; i++) pe[i] = x[i] + a * (x[i] - (i ? x[i - 1] : 0));
  let pk = 0; for (const v of pe) pk = Math.max(pk, Math.abs(v)); const s = pk > 0 ? 1 / pk : 1;
  const re = new Float32Array(n), im = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const j = i / K, j0 = Math.floor(j), f = j - j0, v = ((pe[j0] || 0) * (1 - f) + (pe[j0 + 1] || 0) * f) * s;
    ph += (TAU * dev * v) / fs;
    re[i] = Math.cos(ph); im[i] = Math.sin(ph);
  }
  if (cnr !== null) addNoise(re, im, cnr - 10 * Math.log10(180 / 9), 180e3, fs, crackle, rng(seed));
  lp4(re, 100e3, fs); lp4(im, 100e3, fs);
  const d = new Float32Array(n);
  for (let i = 1; i < n; i++) { const r1 = re[i] * re[i - 1] + im[i] * im[i - 1], i1 = im[i] * re[i - 1] - re[i] * im[i - 1]; d[i] = Math.atan2(i1, r1) * fs / (TAU * dev); }
  lp4(d, 15000, fs);
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = d[i * K] / s;
  lp1(out, 1 / (TAU * 50e-6), SR);                      // de-emphasis, 3.18 kHz corner
  hp1(out, 60, SR);
  return out;
}

// ---------------------------------------------------------------- the player
let ctx = null, master = null, gestured = false;
const live = new Set(), bufs = new WeakMap();
if (typeof window !== 'undefined') ['pointerdown', 'keydown', 'touchstart'].forEach((t) => window.addEventListener(t, () => { gestured = true; }, { capture: true, passive: true }));
export const recording = () => document.body.classList.contains('gb-reel') || /[?&]reel=1/.test(location.search);
function ready() {
  if (audio.muted || recording()) return null;
  if (!gestured && !navigator.userActivation?.hasBeenActive) return null;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (!master) { master = ctx.createGain(); master.gain.value = 0.8; const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4; master.connect(comp).connect(ctx.destination); }
    return ctx;
  } catch { return null; }
}
function bufferOf(a) {
  let b = bufs.get(a);
  if (!b) { b = ctx.createBuffer(1, a.length, SR); b.copyToChannel(a, 0); bufs.set(a, b); }
  return b;
}
export const player = {
  play(a, { gain = 1, loop = false } = {}) {
    const ac = ready(); if (!ac || !a?.length) return null;
    try {
      const src = ac.createBufferSource(); src.buffer = bufferOf(a); src.loop = loop;
      const g = ac.createGain(); g.gain.value = gain; src.connect(g).connect(master);
      src.start(); const item = { src, g, setGain(v) { try { g.gain.setTargetAtTime(v, ac.currentTime, 0.05); } catch { /* closed */ } } };
      live.add(item); src.onended = () => live.delete(item);
      return item;
    } catch { return null; }
  },
  stopAll() { live.forEach((it) => { try { it.src.stop(); } catch { /* already stopped */ } }); live.clear(); },
  sync() { if (master && ctx) { const want = audio.muted || recording() ? 0 : 0.8; if (Math.abs(master.gain.value - want) > 0.01) master.gain.setTargetAtTime(want, ctx.currentTime, 0.02); if (want === 0 && live.size) this.stopAll(); } },
};

// ---------------------------------------------------------------- boards and stage helpers
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = (...a) => { draw(g, pxW, pxH, ...a); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function title(g, s, sub = '', y = 36) {
  g.fillStyle = '#e8eef8'; g.font = 'bold 26px sans-serif'; g.textAlign = 'left'; g.fillText(s, 22, y);
  if (sub) { g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.62)'; g.fillText(sub, 22, y + 26); }
}
export function text(g, s, x, y, { font = '18px sans-serif', col = 'rgba(255,255,255,.8)', align = 'left' } = {}) { g.font = font; g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); g.textAlign = 'left'; }
export const COL = { rf: '#8ef0ff', audio: '#ffd166', e: '#ff7a59', b: '#7aa2ff', good: '#7be08c', bad: '#ff5a8a', lo: '#c49bff', soft: 'rgba(255,255,255,.55)', grid: 'rgba(255,255,255,.1)' };
export const HEX = { rf: 0x8ef0ff, audio: 0xffd166, e: 0xff7a59, b: 0x7aa2ff, good: 0x7be08c, bad: 0xff5a8a, lo: 0xc49bff, copper: 0xd08a4a };
export const inReel = () => document.body.classList.contains('gb-reel');
export function fitNarrow(stage, minor = [], y0 = -0.14) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? y0 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Boards sit beside the model on a wide screen; in the tall reel video (or a phone) they move to compact places.
export function reelBoards(list, force = false) {
  const r = inReel() || force;
  list.forEach(([b, pos, scale = 1, rotY = 0]) => {
    if (!b.home) b.home = { p: b.mesh.position.clone(), r: b.mesh.rotation.clone(), s: b.mesh.scale.x };
    if (r) { b.mesh.position.set(...pos); b.mesh.scale.setScalar(scale); b.mesh.rotation.set(0, rotY, 0); }
    else { b.mesh.position.copy(b.home.p); b.mesh.scale.setScalar(b.home.s); b.mesh.rotation.copy(b.home.r); }
  });
}
// A rod that can be re-aimed every frame.
export function stick(r, mat, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, seg), mat);
  const up = new THREE.Vector3(0, 1, 0), A = new THREE.Vector3(), B = new THREE.Vector3();
  m.between = (a, b) => {
    A.set(...a); B.set(...b); const len = A.distanceTo(B);
    m.visible = len > 1e-4; if (!m.visible) return m;
    m.position.copy(A).add(B).multiplyScalar(0.5); m.scale.set(1, len, 1);
    m.quaternion.setFromUnitVectors(up, B.clone().sub(A).normalize());
    return m;
  };
  return m;
}
export const wire = (pts, mat, r = 0.03) => tube(pts, r, mat, false, Math.max(24, pts.length * 12));
// A line whose points you rewrite every frame (traces in 3D).
export function liveLine(n, color, opacity = 1) {
  const pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
  line.frustumCulled = false;
  line.set = (i, x, y, z) => { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; };
  line.done = () => { geo.attributes.position.needsUpdate = true; };
  return line;
}

// ---------------------------------------------------------------- a transmitter mast
export function makeMast(h = 3, color = 0xd9534f) {
  const g = new THREE.Group(), red = M.plastic(color), white = M.plastic(0xf2f2f2);
  const seg = 6;
  for (let i = 0; i < seg; i++) {
    const y0 = (i / seg) * h, y1 = ((i + 1) / seg) * h, w0 = 0.22 * (1 - i / seg) + 0.05, w1 = 0.22 * (1 - (i + 1) / seg) + 0.05;
    const mat = i % 2 ? white : red;
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) g.add(beam([sx * w0, y0, sz * w0], [sx * w1, y1, sz * w1], 0.018, mat, 6));
    g.add(beam([w0, y0, w0], [-w1, y1, w1], 0.01, mat, 4), beam([-w0, y0, -w0], [w1, y1, -w1], 0.01, mat, 4));
  }
  const lamp = sphere(0.06, M.glow(0xff3b3b)); lamp.position.y = h + 0.05; g.add(lamp);
  g.lamp = lamp;
  return g;
}

// ---------------------------------------------------------------- the classic transistor radio
// A generic Indian household portable of the 1970s–80s (the kind Philips, Murphy, Bush and others made in
// India): a wooden or leatherette cabinet, cloth grille, a slide-rule dial with MW and SW bands, and inside
// a ferrite rod, a two-gang tuning capacitor, IF transformers, six or seven transistors and four D cells (6 V).
// No logos. Units: 1 = 10 cm. Front faces +Z, base on the floor, centre at x = 0.
export const CAB = { w: 3.2, h: 2.0, d: 0.9 };
function dialTexture(f, band) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  const draw = (fk, bd) => {
    g.fillStyle = '#efe6c8'; g.fillRect(0, 0, 1024, 128);
    g.strokeStyle = '#3a2f22'; g.fillStyle = '#3a2f22'; g.lineWidth = 2; g.textAlign = 'center';
    // MW row: 530–1600 kHz, SW row 6–12 MHz (49, 41, 31, 25 m bands)
    const X = (v, lo, hi) => 60 + ((v - lo) / (hi - lo)) * 904;
    g.font = 'bold 18px sans-serif'; g.textAlign = 'left'; g.fillText('MW', 8, 40); g.fillText('SW', 8, 96); g.textAlign = 'center';
    g.font = '17px sans-serif';
    for (const k of [540, 600, 700, 800, 1000, 1200, 1400, 1600]) { const x = X(k, 530, 1610); g.beginPath(); g.moveTo(x, 44); g.lineTo(x, 58); g.stroke(); g.fillText(String(k), x, 36); }
    for (const [m, fr] of [['49 m', 6.0], ['41 m', 7.2], ['31 m', 9.6], ['25 m', 11.8]]) { const x = X(fr, 5.8, 12.2); g.beginPath(); g.moveTo(x, 70); g.lineTo(x, 82); g.stroke(); g.fillText(m, x, 104); }
    g.globalAlpha = 0.5; g.fillRect(60, 60, 904, 2); g.fillRect(60, 84, 904, 2); g.globalAlpha = 1;
    // pointer
    const px = bd === 'sw' ? X(fk, 5.8, 12.2) : X(fk, 530, 1610);
    g.fillStyle = '#d0302a'; g.fillRect(px - 2.5, 4, 5, 120);
  };
  draw(f, band);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { tex: t, set(fk, bd) { draw(fk, bd); t.needsUpdate = true; } };
}
function grilleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#b9a98a'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 4) { g.fillStyle = y % 8 ? 'rgba(80,60,40,.25)' : 'rgba(255,255,255,.12)'; g.fillRect(0, y, 256, 2); }
  for (let x = 0; x < 256; x += 4) { g.fillStyle = 'rgba(60,45,30,.18)'; g.fillRect(x, 0, 1, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  return t;
}
// A two-gang air-spaced variable capacitor: stator half-discs fixed, rotor half-discs on a shaft along Z.
export function makeGang() {
  const g = new THREE.Group();
  const frame = M.metal(0xc9ced6, { roughness: 0.35 });
  const base = box(0.5, 0.03, 0.56, frame); base.position.y = 0; g.add(base);
  for (const z of [-0.27, 0.27]) { const w = box(0.5, 0.42, 0.03, frame); w.position.set(0, 0.21, z); g.add(w); }
  const plate = new THREE.CylinderGeometry(0.19, 0.19, 0.008, 32, 1, false, 0, Math.PI);
  const stMat = M.metal(0xd6dde8, { roughness: 0.3 }), roMat = M.metal(0xf0d9a0, { roughness: 0.3 });
  const rotor = new THREE.Group(); rotor.position.set(0, 0.24, 0); g.add(rotor);
  for (let i = 0; i < 12; i++) {
    const z = -0.22 + i * 0.04;
    const st = new THREE.Mesh(plate, stMat); st.rotation.x = Math.PI / 2; st.rotation.y = 0; st.position.set(0, 0.24, z + 0.02); st.rotation.z = 0; st.scale.set(1, 1, 1);
    // stator plates occupy the lower half (fixed), rotated so the flat edge is horizontal
    st.rotation.set(Math.PI / 2, 0, Math.PI); g.add(st);
    const ro = new THREE.Mesh(plate, roMat); ro.rotation.set(Math.PI / 2, 0, 0); ro.position.z = z; rotor.add(ro);
  }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 12), frame); shaft.rotation.x = Math.PI / 2; shaft.position.set(0, 0.24, 0.2); g.add(shaft);
  // mesh = 0 (rotor out, minimum C) … 1 (fully meshed, maximum C): the rotor turns through 180°
  g.setMesh = (k) => { rotor.rotation.z = Math.PI * (1 - clamp(k, 0, 1)); };
  g.rotor = rotor;
  return g;
}
function makeTransistor(color = 0x1b1e25) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 16, 1, false, 0, Math.PI), M.plastic(color));
  body.position.y = 0.09; g.add(body);
  for (const x of [-0.02, 0, 0.02]) g.add(beam([x, 0, 0.01], [x, 0.06, 0.01], 0.004, M.metal(), 4));
  return g;
}
function makeCan(core = 0xffd166) {
  const g = new THREE.Group();
  const c = box(0.14, 0.16, 0.14, M.metal(0xc9ced6, { roughness: 0.3 })); c.position.y = 0.08; g.add(c);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), M.plastic(core)); s.position.y = 0.17; g.add(s);
  return g;
}
export function makeSpeaker(R = 0.6) {
  const g = new THREE.Group();
  // frame and cone face +Z; the cone's apex points back
  const coneMat = M.matte(0x2c2622, { side: THREE.DoubleSide });
  const cone = latheX([[0, R * 0.95], [-0.08, R * 0.8], [-0.2, R * 0.45], [-0.28, R * 0.18]], coneMat, { seg: 48 });
  cone.rotation.y = Math.PI / 2; g.add(cone);
  const cap = sphere(R * 0.16, M.matte(0x3a332e)); cap.scale.z = 0.4; cap.position.z = -0.24; g.add(cap);
  const rim = torus(R * 0.96, 0.025, M.metal(0x9aa3b2)); g.add(rim);
  const magnet = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.3, R * 0.3, 0.14, 32), M.metal(0x6b7280)); magnet.rotation.x = Math.PI / 2; magnet.position.z = -0.38; g.add(magnet);
  g.cone = cone; g.cap = cap;
  g.setMove = (x) => { cone.position.z = x; cap.position.z = -0.24 + x; };
  return g;
}
export function makeTransistorRadio() {
  const group = new THREE.Group();
  const { w, h, d } = CAB;
  const wood = M.plastic(0x7a4a2a, { roughness: 0.55, transparent: true, opacity: 1 });
  const trim = M.metal(0xd8c9a0, { roughness: 0.3 });
  // back shell: back, top, bottom and sides as thin panels (open at the front)
  const shell = new THREE.Group();
  const panel = (W, H, D, x, y, z) => { const p = box(W, H, D, wood); p.position.set(x, y, z); shell.add(p); return p; };
  panel(w, h, 0.05, 0, h / 2, -d / 2 + 0.025);
  panel(w, 0.06, d, 0, h - 0.03, 0); panel(w, 0.06, d, 0, 0.03, 0);
  panel(0.06, h, d, -w / 2 + 0.03, h / 2, 0); panel(0.06, h, d, w / 2 - 0.03, h / 2, 0);
  // carrying strap on top
  const strap = tube([[-1.1, h, 0], [-0.9, h + 0.35, 0], [0, h + 0.45, 0], [0.9, h + 0.35, 0], [1.1, h, 0]], 0.04, M.matte(0x3b2a1e), false, 40);
  strap.scale.z = 1.8; shell.add(strap);
  // band keys on top (piano keys)
  const keys = [];
  ['MW', 'SW1', 'SW2', 'OFF'].forEach((k, i) => { const b = box(0.16, 0.06, 0.36, M.plastic(i === 3 ? 0x3a3a3a : 0xf2eee4)); b.position.set(0.55 + i * 0.2, h + 0.03, 0.12); shell.add(b); keys.push(b); });
  // front panel: grille on the left, dial strip across the top, knobs on the right
  const front = new THREE.Group(); front.position.z = d / 2;
  const fMat = M.plastic(0x5a3620, { roughness: 0.5, transparent: true, opacity: 1 });
  const fp = box(w, h, 0.04, fMat); fp.position.y = h / 2; front.add(fp);
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.3), new THREE.MeshStandardMaterial({ map: grilleTexture(), roughness: 0.9, transparent: true, opacity: 1 }));
  grille.position.set(-0.62, 0.84, 0.025); front.add(grille);
  const gFrame = box(1.83, 1.38, 0.02, trim); gFrame.position.set(-0.62, 0.84, 0.015); front.add(gFrame);
  const dial = dialTexture(819, 'mw');
  const dialWin = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.34), new THREE.MeshBasicMaterial({ map: dial.tex, toneMapped: false, transparent: true, opacity: 1 }));
  dialWin.position.set(0, 1.72, 0.03); front.add(dialWin);
  const dFrame = box(2.98, 0.42, 0.02, trim); dFrame.position.set(0, 1.72, 0.018); front.add(dFrame);
  const lamp = new THREE.PointLight(0xffc36b, 0, 1.6); lamp.position.set(0, 1.72, 0.2); front.add(lamp);
  const knob = (x, y) => { const k = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 32), M.plastic(0x2a2a2a)); b.rotation.x = Math.PI / 2; k.add(b); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 24), trim); cap.rotation.x = Math.PI / 2; cap.position.z = 0.08; k.add(cap); const mark = box(0.02, 0.1, 0.02, M.glow(0xffffff)); mark.position.set(0, 0.13, 0.08); k.add(mark); k.position.set(x, y, 0.09); front.add(k); return k; };
  const tuneKnob = knob(0.95, 1.05), volKnob = knob(0.95, 0.45);
  // inside
  const inside = new THREE.Group();
  const speaker = makeSpeaker(0.58); speaker.position.set(-0.62, 0.84, d / 2 - 0.08); inside.add(speaker);
  // ferrite rod antenna near the top back, with the MW coil
  const ferrite = new THREE.Group();
  ferrite.add(rod(-1.2, 1.2, 0.05, 0.05, M.matte(0x2b2d33, { roughness: 0.7 })));
  const coil = new THREE.Group();
  for (let i = 0; i < 26; i++) { const t = torus(0.062, 0.008, M.plastic(HEX.copper, { metalness: 0.5, roughness: 0.35 }), 20); t.rotation.y = Math.PI / 2; t.position.x = -0.35 + i * 0.018; coil.add(t); }
  ferrite.add(coil);
  const coil2 = new THREE.Group(); for (let i = 0; i < 6; i++) { const t = torus(0.062, 0.008, M.plastic(0x7be08c, { metalness: 0.3 }), 20); t.rotation.y = Math.PI / 2; t.position.x = 0.2 + i * 0.018; coil2.add(t); } ferrite.add(coil2);
  for (const x of [-1.05, 1.05]) { const c = box(0.05, 0.18, 0.08, M.plastic(0xf2eee4)); c.position.set(x, -0.09, 0); ferrite.add(c); }
  ferrite.position.set(0, 1.28, -0.28); inside.add(ferrite);
  // PCB on the right with the tuning gang, IF cans, transistors, capacitors and the detector diode
  const pcb = new THREE.Group(); pcb.position.set(0.72, 0.42, 0); inside.add(pcb);
  const board0 = box(1.36, 0.03, 0.7, M.plastic(0x7a5b2e, { roughness: 0.7 })); pcb.add(board0);
  const rr = rng(4);
  for (let i = 0; i < 9; i++) { const tr = box(0.9 * rr() + 0.2, 0.002, 0.012, M.metal(0xd8b070)); tr.position.set(-0.3 + rr() * 0.5, 0.017, -0.3 + i * 0.07); pcb.add(tr); }
  const gang = makeGang(); gang.position.set(0.26, 0.015, 0.02); gang.scale.setScalar(0.85); pcb.add(gang);
  const cans = [0xff5a5a, 0xffd166, 0xf2f2f2, 0x222222].map((c, i) => { const k = makeCan(c); k.position.set(-0.5 + i * 0.2, 0.015, -0.2); pcb.add(k); return k; });
  const trs = [];
  for (let i = 0; i < 7; i++) { const t = makeTransistor(i < 5 ? 0x1b1e25 : 0x3a3f4b); t.position.set(-0.55 + i * 0.13, 0.015, 0.1 + (i % 2) * 0.1); pcb.add(t); trs.push(t); }
  for (let i = 0; i < 4; i++) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 14), M.plastic(0x3b5bdb)); e.position.set(-0.2 + i * 0.1, 0.075, -0.02); pcb.add(e); }
  const diode = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 10), M.clear(0xffa050, 0.8)); b.rotation.z = Math.PI / 2; b.position.y = 0.04; diode.add(b); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.01, 10), M.matte(0x111111)); band.rotation.z = Math.PI / 2; band.position.set(0.025, 0.04, 0); diode.add(band); }
  diode.position.set(0.0, 0.015, 0.28); pcb.add(diode);
  const outXf = [-0.08, 0.08].map((x) => { const t = box(0.12, 0.1, 0.1, M.metal(0x6b7280)); t.position.set(-0.52 + x, 0.065, 0.3); pcb.add(t); return t; });
  // batteries: four D cells in a holder along the bottom back
  const batt = new THREE.Group();
  const holder = box(2.6, 0.04, 0.4, M.plastic(0x2a2a2a)); holder.position.y = -0.18; batt.add(holder);
  for (let i = 0; i < 4; i++) {
    const cell = rod(-1.24 + i * 0.62, -0.66 + i * 0.62, 0.17, 0.17, M.plastic(i % 2 ? 0xd62828 : 0x1d3557));
    batt.add(cell);
    const tip = rod(-0.66 + i * 0.62, -0.63 + i * 0.62, 0.05, 0.05, M.metal()); batt.add(tip);
  }
  batt.position.set(0, 0.24, -0.2); inside.add(batt);
  // wires from the ferrite coil to the gang, and from the PCB to the speaker
  const wmat = M.plastic(0xd9534f, { roughness: 0.5 });
  inside.add(wire([[-0.2, 1.22, -0.28], [0.3, 1.0, -0.2], [0.9, 0.75, -0.05]], wmat, 0.012));
  inside.add(wire([[0.2, 0.5, 0.25], [-0.1, 0.62, 0.2], [-0.62, 0.84, 0.0]], M.plastic(0x222222), 0.012));
  group.add(shell, front, inside);
  const api = {
    group, shell, front, inside, speaker, ferrite, coil, pcb, gang, cans, trs, diode, batt, dial, tuneKnob, volKnob, lamp, keys, wood, fMat, grille, outXf,
    setXray(on, k = 0.14) {
      for (const m of [wood, fMat, grille.material]) { m.opacity = on ? k : 1; m.depthWrite = !on; m.needsUpdate = true; }
    },
    // tune in kHz on MW, or MHz on SW
    setTune(fk, band = 'mw') {
      const lo = band === 'sw' ? 5.8 : 530, hi = band === 'sw' ? 12.2 : 1610;
      tuneKnob.rotation.z = -((fk - lo) / (hi - lo)) * Math.PI * 3;
      if (band === 'mw') { const C = CofF(fk * 1e3); gang.setMesh((C - C_MIN) / (C_MAX - C_MIN)); }
      dial.set(fk, band);
    },
    setVolume(v) { volKnob.rotation.z = -v * Math.PI * 1.5; },
  };
  return api;
}

// A modern single-chip DSP radio module (the kind in phones and cheap pocket radios): one chip, a crystal,
// a few capacitors, on a board a couple of centimetres across. Shown enlarged.
export function makeDspModule() {
  const g = new THREE.Group();
  const pcb = box(1.0, 0.04, 0.8, M.plastic(0x1f6f43, { roughness: 0.6 })); g.add(pcb);
  const chip = box(0.34, 0.05, 0.34, M.plastic(0x15171c, { roughness: 0.4 })); chip.position.y = 0.045; g.add(chip);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const p = box(0.03, 0.01, 0.06, M.metal()); p.position.set(-0.13 + i * 0.052, 0.025, s * 0.2); g.add(p); }
  const xtal = box(0.2, 0.06, 0.08, M.metal(0xd6dde8)); xtal.position.set(-0.3, 0.05, 0.28); g.add(xtal);
  for (let i = 0; i < 5; i++) { const c = box(0.06, 0.04, 0.03, M.plastic(0xc9a46b)); c.position.set(0.3, 0.04, -0.3 + i * 0.13); g.add(c); }
  const ant = rod(-0.5, -0.9, 0.012, 0.012, M.metal(0xd8b070)); ant.position.y = 0.03; g.add(ant);
  g.chip = chip;
  return g;
}
export { M, rod, beam, box, torus, tube, sphere };
// On a phone-width stage, back the chapter's camera off once (the viewer can still zoom in).
export function narrowView(stage, narrow, k = 1.15) {
  if (!narrow || inReel() || !stage.home || stage.home.narrowed) return;
  const [p, t] = [stage.home.pos, stage.home.target];
  stage.setView(p.map((v, i) => t[i] + (v - t[i]) * k), t, 0.6);
  stage.home.narrowed = true;
}
