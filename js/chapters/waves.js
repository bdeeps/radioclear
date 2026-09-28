// Chapter 2: what a radio wave is, how long it is, and how it travels.
// Field view: charges surging up and down a dipole radiate an electric field (vertical, red) and a magnetic
// field (horizontal, blue) at right angles, in step, moving away at c. λ = c / f (radio.js).
// Sky view: a slice of the Earth (1 scene unit = 100 km across, heights stretched 3×) with the ionosphere
// layers (radio.js IONO). Hop geometry on a round Earth: a ray leaving at elevation e reaches height h after a
// central angle φ = acos(R·cos e / (R + h)) − e, so one hop covers 2φ·R. Take-off angles here are typical
// (10° for MW off the E layer at night, 8° for SW off the F layer).
// Ground-wave reach for high-power MW by day of a few hundred km (ITU-R P.368 curves over average land), FM
// line of sight 4.12(√h1 + √h2) km. The D layer forms at sunrise and absorbs MW; after sunset it fades within
// an hour or so and MW skywave returns from the E layer (ITU-R P.1147; Wikipedia "Skywave", "Ionosphere").
import { THREE, M, clamp } from '../kit.js';
import {
  lambdaM, fmtF, fmtL, IONO, EARTH_R, horizonKm, board, panelBg, title, text, COL, HEX, fitNarrow, narrowView, reelBoards,
  sphere, makeMast, liveLine, tube,
} from '../radio.js';

// Bands on the spectrum board (Hz). India has no long-wave broadcasting; LW is shown for scale.
const BANDS = [
  { lo: 148.5e3, hi: 283.5e3, name: 'LW', col: '#c49bff' },
  { lo: 531e3, hi: 1602e3, name: 'MW (AM)', col: '#ffd166' },
  { lo: 2.3e6, hi: 26.1e6, name: 'Shortwave', col: '#ff7a59' },
  { lo: 88e6, hi: 108e6, name: 'FM', col: '#7be08c' },
  { lo: 470e6, hi: 698e6, name: 'TV (UHF)', col: '#8ef0ff' },
  { lo: 700e6, hi: 3.6e9, name: 'Mobile', col: '#7aa2ff' },
  { lo: 2.4e9, hi: 2.5e9, name: 'Wi-Fi / microwave oven', col: '#ff5a8a' },
];
const THINGS = [
  [0.15, 'a phone'], [1.7, 'a person'], [12, 'a bus'], [20.12, 'a cricket pitch'], [72.5, 'the Qutub Minar'],
  [182, 'the Statue of Unity'], [1000, 'a kilometre'],
];
const BANDSEL = {
  mw: { name: 'Medium wave (AM)', f: 819e3, layer: 'E', el: 10 },
  sw: { name: 'Shortwave', f: 9.95e6, layer: 'F', el: 8 },
  fm: { name: 'FM', f: 100.1e6, layer: null, el: 12 },
};
const U = 100, VX = 3;                           // km per unit across; vertical stretch
const RS = EARTH_R / U;                          // Earth radius in units
const TH0 = -0.2;                               // transmitter's central angle (rad)
const hopPhi = (h, elDeg) => { const e = (elDeg * Math.PI) / 180; return Math.acos((EARTH_R * Math.cos(e)) / (EARTH_R + h)) - e; };
// point on the slice: central angle th (rad), height h (km)
const P = (th, h) => { const r = RS + (h * VX) / U; return new THREE.Vector3(r * Math.sin(th), r * Math.cos(th) - RS, 0); };

export default {
  id: 'waves',
  short: 'Radio waves',
  title: 'Radio waves: invisible light',
  subtitle: 'Shake a charge and ripples of electric and magnetic field race away at the speed of light.',
  view: { pos: [1.2, 3.6, 13.0], target: [1.0, 3.0, 0] },
  learn: `<p>Push electrons up and down a metal rod, fast. Each moving charge drags its <b>electric field</b> with it, and moving charge makes a <b>magnetic field</b>. The changes cannot spread instantly, so they ripple outwards at the speed of light, about <b>300,000 km every second</b>. That ripple of electric and magnetic field, always at right angles to each other, is a <b>radio wave</b>. It is the same stuff as light, just with much longer waves (see WaveClear).</p>
    <p>The <b>frequency</b> is how many times the charges swing each second. The <b>wavelength</b> is how far the wave travels in one swing: <b>λ = c / f</b>. AIR's medium-wave stations sit between <b>531 and 1,602 kHz</b>, spaced <b>9 kHz</b> apart in India, with waves 190 to 560 metres long. FM (88 to 108 MHz) has waves about 3 metres long. Phones use waves a few centimetres long (see MobileClear).</p>
    <p>Wavelength decides how a wave travels. Long medium waves hug the ground as a <b>ground wave</b> for hundreds of kilometres. By day a low layer of the <b>ionosphere</b>, the <b>D layer</b>, soaks up any medium wave that heads for the sky. At night the D layer fades, and the higher <b>E layer</b> bounces medium waves back down, a thousand kilometres away or more. That is why a radio picks up far-off AIR stations after dark. Shortwaves bounce off the even higher <b>F layer</b>, hop after hop, round the world. FM goes straight through the ionosphere into space, so it only reaches as far as the horizon.</p>
    <p class="tip"><b>Try it:</b> slide the frequency and watch the wave shrink. Then switch to "Around the Earth", pick medium wave and flip between day and night.</p>`,
  terms: [
    { t: 'Electromagnetic wave', d: 'Linked ripples of electric and magnetic field that travel at the speed of light. Radio, light and X-rays are all of this kind.' },
    { t: 'Frequency', d: 'How many waves pass each second, in hertz (Hz). 1 kHz is a thousand, 1 MHz a million.' },
    { t: 'Wavelength (λ)', d: 'The length of one wave: the speed of light divided by the frequency.' },
    { t: 'Ground wave', d: 'A radio wave that follows the curve of the Earth, strongest for long and medium waves.' },
    { t: 'Skywave', d: 'A radio wave bent back to Earth by the ionosphere, which lets it travel far beyond the horizon.' },
    { t: 'Ionosphere', d: 'Layers of air 60 to 500 km up, made electrically charged by sunlight, that can absorb or reflect radio waves.' },
    { t: 'Line of sight', d: 'Travel in a straight line, as FM and TV do: the signal stops near the horizon.' },
  ],
  defaults: { mode: 'field', f: 819e3, band: 'mw', night: false },
  controls: [
    { key: 'mode', type: 'seg', label: 'Show', options: [{ v: 'field', label: 'The wave' }, { v: 'sky', label: 'Around the Earth' }] },
    { key: 'f', type: 'log', label: 'Frequency', min: 150e3, max: 3e9, ends: ['150 kHz', '3 GHz'], fmt: (v) => fmtF(v) },
    { key: 'band', type: 'seg', label: 'Band (Around the Earth)', options: [{ v: 'mw', label: 'MW' }, { v: 'sw', label: 'SW' }, { v: 'fm', label: 'FM' }] },
    { key: 'night', type: 'toggle', label: 'Night time' },
  ],
  onChange(s, key) { if (key === 'band') s.mode = 'sky'; if (key === 'night' && s.mode !== 'sky') s.mode = 'sky'; if (key === 'f') s.mode = 'field'; },
  quiz: [
    { q: 'What is the wavelength of AIR\'s 1,000 kHz medium-wave signal? (c = 300,000 km/s)', options: ['3 m', '30 m', '300 m', '3 km'], answer: 2, why: 'λ = c / f = 300,000,000 ÷ 1,000,000 = 300 metres.' },
    { q: 'Why can you hear distant medium-wave stations at night but not by day?', options: ['Transmitters are more powerful at night', 'The D layer that absorbs medium waves by day fades after sunset, so waves bounce off the E layer', 'Radio waves travel faster in the dark', 'Fewer people are listening'], answer: 1, why: 'Sunlight builds the D layer, which soaks up medium waves. At night it fades and the E layer bounces them far away.' },
    { q: 'Why does an FM station only reach about as far as the horizon?', options: ['FM is too weak', 'Its short waves go straight through the ionosphere instead of bouncing back', 'FM is blocked by clouds', 'FM only works in cities'], answer: 1, why: 'At around 100 MHz the ionosphere does not bend the wave back, so FM travels in straight lines.' },
  ],
  reel: [
    { ms: 5400, caption: 'A radio wave is electric and magnetic fields rippling out at the speed of light.', set: { mode: 'field', band: 'mw', night: false }, anim: { f: [200e3, 100e6, true] }, spin: 0, view: { pos: [-1.9, 3.8, 9.0], target: [-1.9, 3.2, 0] } },
    { ms: 5600, caption: 'By day the D layer swallows medium waves; at night they bounce off the sky, far away.', set: { mode: 'sky', band: 'mw', night: false }, anim: { night: [false, true] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // ================================================================ field view
    const field = new THREE.Group(); root.add(field);
    const X0 = -4.4, Y0 = 2.0, XL = 5.0;          // antenna position and wave length on screen
    const rodMat = M.metal(0xd6dde8);
    const armT = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 16), rodMat); armT.position.set(X0, Y0 + 0.8, 0); field.add(armT);
    const armB = armT.clone(); armB.position.y = Y0 - 0.8; field.add(armB);
    const feed = sphere(0.1, M.plastic(0x2f3a4a)); feed.position.set(X0, Y0, 0); field.add(feed);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, Y0 - 1.55, 12), M.metal(0x6b7280)); stand.position.set(X0, (Y0 - 1.55) / 2, 0); field.add(stand);
    const plus = sphere(0.12, M.glow(HEX.e)), minus = sphere(0.12, M.glow(HEX.b)); field.add(plus, minus);
    // arrows sampled along the wave: E vertical (y), B horizontal (z)
    const NA = 34, eArr = [], bArr = [];
    const shaftG = new THREE.CylinderGeometry(0.025, 0.025, 1, 8), tipG = new THREE.ConeGeometry(0.07, 0.16, 10);
    const mk = (col) => { const g = new THREE.Group(), m = M.glow(col, { transparent: true, opacity: 0.85 }); const s = new THREE.Mesh(shaftG, m), t = new THREE.Mesh(tipG, m); g.add(s, t); g.s = s; g.t = t; field.add(g); return g; };
    for (let i = 0; i < NA; i++) { eArr.push(mk(HEX.e)); const b = mk(HEX.b); b.rotation.x = Math.PI / 2; bArr.push(b); }
    const setArrow = (a, L) => { const sgn = Math.sign(L) || 1, l = Math.abs(L); a.visible = l > 0.03; a.s.scale.y = Math.max(0.001, l - 0.12); a.s.position.y = sgn * (l - 0.12) / 2; a.t.position.y = sgn * (l - 0.08); a.t.rotation.z = sgn > 0 ? 0 : Math.PI; };
    const NL = 300, eLine = liveLine(NL, HEX.e), bLine = liveLine(NL, HEX.b); field.add(eLine, bLine);
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, XL, 6), M.ghost(0xffffff, 0.3)); axis.rotation.z = Math.PI / 2; axis.position.set(X0 + 0.3 + XL / 2, Y0, 0); field.add(axis);
    const ruler = new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 0.04), M.glow(0xffd166)); field.add(ruler);
    const Lab = {
      e: stage.label('Electric field', [X0 + 1.2, Y0 + 1.25, 0], field, 'hot'),
      b: stage.label('Magnetic field', [X0 + 1.4, Y0 - 0.2, 1.3], field),
      ant: stage.label('Antenna: charges surge up and down', [X0 + 0.2, Y0 - 1.75, 0.6], field),
      lam: stage.label('', [0, 0, 0], field, 'hot'),
      c: stage.label('moves away at 300,000 km/s →', [X0 + XL - 0.6, Y0 + 1.35, 0.2], field),
    };
    const spec = board(field, 5.4, 1.4, 1240, 320, (g, w, h, f) => drawSpectrum(g, w, h, f ?? 819e3), [4.0, 3.4, -1.0]);
    spec.mesh.rotation.y = -0.25;
    // ================================================================ sky view
    const sky = new THREE.Group(); sky.position.y = 3.2; root.add(sky);
    const thA = -0.27, thB = 0.36;
    const earth = new THREE.Mesh(new THREE.RingGeometry(RS - 3, RS, 128, 1, Math.PI / 2 - thB, thB - thA), new THREE.MeshBasicMaterial({ color: 0x2f5d45, side: THREE.DoubleSide }));
    earth.position.y = -RS; sky.add(earth);
    const sea = new THREE.Mesh(new THREE.RingGeometry(RS - 0.05, RS + 0.02, 128, 1, Math.PI / 2 - thB, thB - thA), new THREE.MeshBasicMaterial({ color: 0x7be08c, side: THREE.DoubleSide }));
    sea.position.y = -RS; sky.add(sea);
    const layer = (h0, h1, col, op) => { const m = new THREE.Mesh(new THREE.RingGeometry(RS + (h0 * VX) / U, RS + (h1 * VX) / U, 128, 1, Math.PI / 2 - thB, thB - thA), M.ghost(col, op)); m.position.y = -RS; m.position.z = -0.05; sky.add(m); return m; };
    const lD = layer(IONO.D[0], IONO.D[1], 0xff5a8a, 0.35), lE = layer(IONO.E[0], IONO.E[1], 0xffd166, 0.18), lF = layer(IONO.F[0], 400, 0x8ef0ff, 0.12);
    const SL = {
      d: stage.label('D layer 60–90 km (daytime)', P(0.1, 75).toArray(), sky),
      e: stage.label('E layer ~90–150 km', P(0.1, 125).toArray(), sky),
      f: stage.label('F layer ~150–500 km', P(0.1, 330).toArray(), sky),
      tx: stage.label('Transmitter', P(TH0, 0).add(new THREE.Vector3(0, -0.8, 0.3)).toArray(), sky, 'hot'),
      scale: stage.label('1,000 km', P(0.2, -40).toArray(), sky),
      note: stage.label('heights stretched 3×', P(-0.02, -150).toArray(), sky),
      hop: stage.label('', [0, 0, 0], sky, 'hot'),
      gw: stage.label('', [0, 0, 0], sky),
    };
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1000 / U, 0.06, 0.06), M.glow(0xffffff)); bar.position.copy(P(0.2, -20)); bar.rotation.z = -0.2; sky.add(bar);
    const mast = makeMast(0.9); mast.position.copy(P(TH0, 0)); mast.rotation.z = -TH0; sky.add(mast);
    // rays are rebuilt when band or day/night changes
    const rays = new THREE.Group(); sky.add(rays);
    const pulses = []; for (let i = 0; i < 18; i++) { const p = sphere(0.13, M.glow(0xffffff)); rays.parent.add(p); pulses.push(p); }
    let paths = [], rayKey = '';
    const buildRays = (s) => {
      rays.clear(); paths = [];
      const B = BANDSEL[s.band];
      const addPath = (pts, col, r = 0.07, op = 0.9) => { const m = tube(pts, r, M.glow(col, { transparent: true, opacity: op }), false, 120); rays.add(m); const c = new THREE.CatmullRomCurve3(pts); paths.push(c); return c; };
      let hopKmv = 0, gwKm = 0, absorbed = false;
      if (s.band === 'mw') {
        gwKm = 300;
        const pts = []; for (let k = 0; k <= 20; k++) pts.push(P(TH0 + (k / 20) * (gwKm / EARTH_R), 3));
        addPath(pts, 0x7be08c, 0.1);
        const phi = hopPhi(IONO.Eh, B.el);
        if (s.night) {
          const pk = []; for (let k = 0; k <= 30; k++) { const u = k / 30, th = TH0 + u * 2 * phi, hh = u <= 0.5 ? rayH(u * 2 * phi, B.el) : rayH((1 - u) * 2 * phi, B.el); pk.push(P(th, Math.min(IONO.Eh, hh))); }
          addPath(pk, 0xffd166, 0.08);
          hopKmv = 2 * phi * EARTH_R;
        } else {
          // heads up into the D layer and is soaked up
          const phD = hopPhi(IONO.D[1], B.el), pk = [];
          for (let k = 0; k <= 16; k++) { const th = TH0 + (k / 16) * phD; pk.push(P(th, rayH((k / 16) * phD, B.el))); }
          addPath(pk, 0xff5a8a, 0.08, 0.7); absorbed = true;
        }
      } else if (s.band === 'sw') {
        gwKm = 40;
        const phi = hopPhi(IONO.Fh, B.el), pk = [];
        const hops = 2;
        for (let hN = 0; hN < hops; hN++) for (let k = 0; k <= 30; k++) { const u = k / 30, th = TH0 + (hN + u) * 2 * phi; if (th > thB) break; const hh = u <= 0.5 ? rayH(u * 2 * phi, B.el) : rayH((1 - u) * 2 * phi, B.el); pk.push(P(th, Math.min(IONO.Fh, hh))); }
        addPath(pk, 0xff7a59, 0.08);
        hopKmv = 2 * phi * EARTH_R;
        const pts = []; for (let k = 0; k <= 6; k++) pts.push(P(TH0 + (k / 6) * (gwKm / EARTH_R), 3)); addPath(pts, 0x7be08c, 0.1);
      } else {
        gwKm = horizonKm(150, 10);
        const pts = []; for (let k = 0; k <= 6; k++) pts.push(P(TH0 + (k / 6) * (gwKm / EARTH_R), 3)); addPath(pts, 0x7be08c, 0.1);
        const pk = []; for (let k = 0; k <= 20; k++) { const th = TH0 + (k / 20) * 0.22; pk.push(P(th, Math.min(560, rayH((k / 20) * 0.22, B.el)))); }
        addPath(pk, 0x8ef0ff, 0.08, 0.8);
      }
      return { hopKmv, gwKm, absorbed };
    };
    let geo = { hopKmv: 0, gwKm: 0, absorbed: false };
    let t = 0, lastF = -1, mode = 'field';
    const inst = {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const narrow = fitNarrow(stage, [Lab.b, Lab.c, SL.note, SL.f], -0.12); narrowView(stage, narrow);
        if (s.mode !== mode) {
          mode = s.mode;
          if (mode === 'sky') stage.setView([-3.0, 6.0, 27], [-3.0, 5.0, 0], 1.0); else stage.setView(this_view.pos, this_view.target, 1.0);
        }
        field.visible = s.mode === 'field'; sky.visible = s.mode === 'sky';
        reelBoards([[spec, [-1.6, 4.9, -1.0], 0.75]], narrow);
        if (s.mode === 'field') {
          // on-screen scale: about 2.5 wavelengths fit along the wave
          const lam = lambdaM(s.f), cyc = 2.5, k = (Math.PI * 2 * cyc) / XL, w = 3.2;
          const q = Math.sin(w * t);
          plus.position.set(X0, Y0 + 0.75 * q, 0.0); minus.position.set(X0, Y0 - 0.75 * q, 0.0);
          for (let i = 0; i < NA; i++) {
            const x = 0.35 + (i / (NA - 1)) * XL, a = Math.sin(w * t - k * x) * (0.95 - 0.06 * x);
            eArr[i].position.set(X0 + x, Y0, 0); setArrow(eArr[i], a);
            bArr[i].position.set(X0 + x, Y0, 0); bArr[i].rotation.set(Math.PI / 2, 0, 0); setArrow(bArr[i], -a);
          }
          for (let i = 0; i < NL; i++) { const x = 0.35 + (i / (NL - 1)) * XL, a = Math.sin(w * t - k * x) * (0.95 - 0.06 * x); eLine.set(i, X0 + x, Y0 + a, 0); bLine.set(i, X0 + x, Y0, a); }
          eLine.done(); bLine.done();
          const lamU = XL / cyc;
          ruler.scale.x = lamU; ruler.position.set(X0 + 0.35 + lamU / 2 + (((w * t) / k) % lamU) * 0, Y0 - 1.35, 0);
          const th = THINGS.reduce((a, b) => (Math.abs(Math.log(b[0] / lam)) < Math.abs(Math.log(a[0] / lam)) ? b : a));
          const n = lam / th[0];
          Lab.lam.position.set(X0 + 0.35 + lamU / 2 + 0.6, Y0 - 1.65, 0);
          Lab.lam.element.innerHTML = `one wavelength: ${fmtL(lam)}<br><small>about ${n >= 10 ? Math.round(n) : n.toFixed(1)} × ${th[1]}</small>`;
          if (Math.abs(s.f - lastF) > 1) { lastF = s.f; spec.redraw(s.f); }
        } else {
          const key = s.band + s.night;
          if (key !== rayKey) { rayKey = key; geo = buildRays(s); }
          const dayK = s.night ? 0 : 1;
          lD.material.opacity += ((dayK ? 0.35 : 0.02) - lD.material.opacity) * Math.min(1, dt * 3);
          SL.d.element.style.opacity = s.night ? 0.35 : 1;
          SL.d.element.textContent = s.night ? 'D layer: faded away at night' : 'D layer 60–90 km: absorbs MW by day';
          pulses.forEach((p, i) => {
            const c = paths[i % Math.max(1, paths.length)];
            if (!c) { p.visible = false; return; }
            const u = ((t * 0.28 + i / pulses.length) % 1);
            p.visible = true; c.getPointAt(u, p.position);
            p.scale.setScalar(geo.absorbed && c === paths[1] ? 1 - u * 0.8 : 1);
          });
          if (geo.hopKmv) { SL.hop.visible = true; SL.hop.position.copy(P(TH0 + geo.hopKmv / EARTH_R, 0).add(new THREE.Vector3(0, -0.9, 0.3))); SL.hop.element.textContent = `lands ${Math.round(geo.hopKmv / 10) * 10} km away`; }
          else SL.hop.visible = false;
          SL.gw.position.copy(P(TH0 + geo.gwKm / EARTH_R / 2, 120)); SL.gw.element.textContent = s.band === 'fm' ? `line of sight ≈ ${Math.round(geo.gwKm)} km` : `ground wave ≈ ${geo.gwKm} km`;
        }
        mast.lamp.material.color.setHex(Math.sin(t * 4) > 0 ? 0xff3b3b : 0x551111);
      },
      readout(s) {
        if (s.mode === 'field') {
          const lam = lambdaM(s.f), b = BANDS.find((x) => s.f >= x.lo && s.f <= x.hi);
          return `<div class="big">${fmtF(s.f)}: λ = ${fmtL(lam)}</div>
            <div class="row"><span>Band</span><b>${b ? b.name : 'between broadcast bands'}</b></div>
            <div class="row"><span>Swings per second</span><b>${s.f >= 1e6 ? (s.f / 1e6).toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' million' : Math.round(s.f).toLocaleString('en-US')}</b></div>
            <div class="row"><span>Time for one swing</span><b>${s.f >= 1e6 ? (1e9 / s.f).toFixed(2) + ' ns' : (1e6 / s.f).toFixed(2) + ' µs'}</b></div>
            <small>λ = c / f with c = 299,792,458 m/s. The picture is slowed billions of times.</small>`;
        }
        const B = BANDSEL[s.band];
        return `<div class="big">${B.name}, ${s.night ? 'night' : 'day'}</div>
          <div class="row"><span>Example</span><b>${fmtF(B.f)}, λ = ${fmtL(lambdaM(B.f))}</b></div>
          <div class="row"><span>${s.band === 'fm' ? 'Line of sight (150 m mast)' : 'Ground wave'}</span><b>≈ ${Math.round(geo.gwKm)} km</b></div>
          <div class="row"><span>Skywave</span><b>${s.band === 'fm' ? 'none: escapes to space' : geo.absorbed ? 'absorbed in the D layer' : `one hop ≈ ${Math.round(geo.hopKmv / 10) * 10} km`}</b></div>
          ${s.band === 'mw' ? (s.night ? '<div class="ok">Night: distant AIR stations come in.</div>' : '<div class="no">Day: only nearby stations, by ground wave.</div>') : ''}`;
      },
    };
    const this_view = { pos: [1.2, 3.6, 13.0], target: [1.0, 3.0, 0] };
    return inst;
  },
};

// Height (km) of a straight ray leaving the ground at elevation el (deg), after central angle phi (rad).
function rayH(phi, elDeg) {
  const e = (elDeg * Math.PI) / 180, R = EARTH_R;
  return (R * Math.cos(e)) / Math.cos(e + phi) - R;
}

function drawSpectrum(g, w, h, f) {
  panelBg(g, w, h);
  title(g, 'The radio spectrum', 'frequency on a log scale · wavelength below');
  const x0 = 40, x1 = w - 40, lo = Math.log10(1e5), hi = Math.log10(1e10);
  const X = (v) => x0 + ((Math.log10(v) - lo) / (hi - lo)) * (x1 - x0);
  const y = 150;
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x0, y, x1 - x0, 60);
  BANDS.forEach((b, i) => {
    g.fillStyle = b.col; g.globalAlpha = 0.75; const xa = X(b.lo), xb = Math.max(X(b.hi), xa + 4);
    g.fillRect(xa, y + (i % 2 ? 30 : 0), xb - xa, 30); g.globalAlpha = 1;
    text(g, b.name, (xa + xb) / 2, i % 2 ? y + 84 : y - 10, { font: 'bold 17px sans-serif', col: b.col, align: 'center' });
  });
  for (const [v, l] of [[1e5, '100 kHz'], [1e6, '1 MHz'], [1e7, '10 MHz'], [1e8, '100 MHz'], [1e9, '1 GHz'], [1e10, '10 GHz']]) {
    const x = X(v); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y + 60, 1, 50);
    text(g, l, x, y + 128, { font: '16px sans-serif', col: 'rgba(255,255,255,.7)', align: 'center' });
    text(g, fmtL(299792458 / v), x, y + 150, { font: '15px sans-serif', col: 'rgba(255,209,102,.8)', align: 'center' });
  }
  const x = X(clamp(f, 1e5, 1e10));
  g.fillStyle = '#ffffff'; g.fillRect(x - 2, y - 30, 4, 100);
  g.beginPath(); g.moveTo(x - 10, y - 38); g.lineTo(x + 10, y - 38); g.lineTo(x, y - 26); g.fill();
  text(g, fmtF(f), x, y - 44, { font: 'bold 20px sans-serif', col: '#fff', align: x > w - 120 ? 'right' : 'center' });
  text(g, '← longer waves', x0, h - 14, { font: '15px sans-serif', col: COL.soft });
  text(g, 'shorter waves →', x1, h - 14, { font: '15px sans-serif', col: COL.soft, align: 'right' });
}
