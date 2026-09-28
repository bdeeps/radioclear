// Chapter 5: inside the receiver. The superheterodyne (Armstrong, 1918) shifts whichever station you tune to
// a fixed intermediate frequency (IF) where fixed, sharp filters and most of the gain live.
// AM: LO = f + 455 kHz, image at f + 910 kHz; three IF transformers give roughly a 6–9 kHz passband.
// FM: LO = f + 10.7 MHz, image at f + 21.4 MHz, outside the 88–108 MHz band; IF passband about 200 kHz.
// (Wikipedia "Superheterodyne receiver", "Intermediate frequency"; ARRL Handbook.)
// Mixing: multiplying two sines gives their sum and difference: cos a · cos b = ½cos(a − b) + ½cos(a + b).
// The scope traces are slowed and scaled pictures of each stage, not to scale in frequency.
// Crystal set: a long-wire antenna and earth, a tuned circuit, a point-contact (galena or germanium) diode and
// high-impedance earphones. It has no battery: the sound's power, microwatts at most, comes from the wave.
import { THREE, M, clamp } from '../kit.js';
import {
  IF, MW, FMB, STATIONS, fmtF, board, panelBg, text, COL, HEX, fitNarrow, narrowView, box, rod, torus, sphere, wire, tube,
  makeSpeaker, makeGang,
} from '../radio.js';

const STAGES = [
  { id: 'ant', name: 'Antenna', col: COL.rf },
  { id: 'rf', name: 'RF amp (tuned)', col: COL.rf },
  { id: 'mix', name: 'Mixer ×', col: COL.lo },
  { id: 'if', name: 'IF amp + filters', col: COL.audio },
  { id: 'det', name: 'Detector', col: COL.good },
  { id: 'aud', name: 'Audio amp', col: COL.good },
  { id: 'spk', name: 'Speaker', col: COL.good },
];
const CRYSTAL_STEPS = ['Nothing yet', 'Antenna and earth', '+ a coil', '+ a tuning capacitor', '+ a crystal diode', '+ earphones'];

export default {
  id: 'receiver',
  short: 'Inside the receiver',
  title: 'The superheterodyne receiver',
  subtitle: 'Shift every station to one fixed frequency, then filter and amplify it there.',
  view: { pos: [0.6, 4.2, 13.8], target: [0.6, 2.6, 0.4] },
  learn: `<p>Almost every radio since the 1930s is a <b>superheterodyne</b>, or "superhet", an idea Edwin Armstrong worked out in 1918. Follow the signal from left to right.</p>
    <p>The <b>antenna</b> picks up every station at once. A tuned <b>RF amplifier</b> favours the one you want. Then comes the clever part. A <b>local oscillator</b> inside the radio makes its own wave, always <b>455 kHz</b> above the station you tune (for AM). The <b>mixer</b> multiplies the two together, which makes their sum and their <b>difference</b>. The difference is always 455 kHz, whatever station you picked. This fixed <b>intermediate frequency</b> (IF) goes through sharp, fixed filters (the IF transformer cans) and most of the amplification. So the radio gets the same sharpness on every station.</p>
    <p>The <b>detector</b> then recovers the sound. For AM it is a <b>diode</b> and a capacitor, which follow the envelope. An FM set uses 10.7 MHz as its IF and a detector that turns frequency changes into voltage. An <b>audio amplifier</b> drives the <b>speaker</b>.</p>
    <p>The simplest radio of all, the <b>crystal set</b>, has no battery. An antenna, a coil, a capacitor, a crystal diode and earphones are enough, powered only by the radio wave itself. Build one and hear why the diode matters.</p>
    <p class="tip"><b>Try it:</b> tune across the band and watch the local oscillator follow, while the IF stays at 455 kHz. Then switch to the crystal set and add the parts one by one.</p>`,
  terms: [
    { t: 'Superheterodyne', d: 'A receiver that shifts every station to one fixed intermediate frequency before filtering and detecting it.' },
    { t: 'Local oscillator', d: 'A wave generator inside the radio, tuned together with the dial to stay a fixed step above the station.' },
    { t: 'Mixer', d: 'A stage that multiplies two signals, producing their sum and difference frequencies.' },
    { t: 'Intermediate frequency (IF)', d: 'The fixed frequency a superhet works at: 455 kHz for AM, 10.7 MHz for FM.' },
    { t: 'Image frequency', d: 'A second station that also lands on the IF, twice the IF away. Good tuning ahead of the mixer keeps it out.' },
    { t: 'Detector', d: 'The stage that pulls the sound back out of the modulated wave.' },
    { t: 'Crystal set', d: 'A radio with no battery, using a crystal diode and powered only by the energy in the radio wave.' },
  ],
  defaults: { rx: 'super', band: 'am', f: 702e3, ffm: 100.1e6, step: 5 },
  controls: [
    { key: 'rx', type: 'seg', label: 'Receiver', options: [{ v: 'super', label: 'Superhet' }, { v: 'crystal', label: 'Crystal set' }] },
    { key: 'band', type: 'seg', label: 'Band', options: [{ v: 'am', label: 'AM (MW)' }, { v: 'fm', label: 'FM' }] },
    { key: 'f', type: 'range', label: 'AM station', min: MW.lo, max: MW.hi, step: MW.step, ends: ['531 kHz', '1602 kHz'], fmt: (v) => Math.round(v / 1e3) + ' kHz' },
    { key: 'ffm', type: 'range', label: 'FM station', min: FMB.lo, max: FMB.hi, step: 0.1e6, ends: ['88 MHz', '108 MHz'], fmt: (v) => (v / 1e6).toFixed(1) + ' MHz' },
    { key: 'step', type: 'range', label: 'Build the crystal set', min: 0, max: 5, step: 1, ends: ['empty', 'finished'], fmt: (v) => CRYSTAL_STEPS[v] },
  ],
  onChange(s, key) { if (key === 'step') s.rx = 'crystal'; if (key === 'f' || key === 'ffm') { s.rx = 'super'; s.band = key === 'f' ? 'am' : 'fm'; } if (key === 'band') s.rx = 'super'; },
  quiz: [
    { q: 'An AM superhet is tuned to 702 kHz. What is its local oscillator\'s frequency?', options: ['455 kHz', '702 kHz', '1,157 kHz', '247 kHz'], answer: 2, why: 'The oscillator runs 455 kHz above the station: 702 + 455 = 1,157 kHz. Their difference is the 455 kHz IF.' },
    { q: 'Why convert every station to one intermediate frequency?', options: ['It makes the radio lighter', 'So the sharp filters and most of the gain can be fixed, and work the same for every station', 'Because speakers only play 455 kHz', 'To save battery'], answer: 1, why: 'Filters tuned once at the factory to 455 kHz give the same selectivity wherever the dial is.' },
    { q: 'In a crystal set with no diode, why do the earphones stay silent?', options: ['There is no battery', 'The radio wave pushes the earphone equally both ways, so it averages to nothing', 'The coil blocks the sound', 'The antenna is too short'], answer: 1, why: 'The diode lets through only one half of each wave, so what is left follows the envelope, the sound.' },
  ],
  reel: [
    { ms: 5800, caption: 'A superhet mixes every station down to one fixed frequency, 455 kHz, then filters it there.', set: { rx: 'super', band: 'am' }, anim: { f: [594e3, 1566e3] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // ================================================================ superhet chain
    const sup = new THREE.Group(); root.add(sup);
    const XS = STAGES.map((_, i) => -6.0 + i * 2.0), Y = 0.5;
    const pcb = box(14.2, 0.06, 2.0, M.plastic(0x1f5f3a, { roughness: 0.7 })); pcb.position.set(0, 0.03, 0.3); sup.add(pcb);
    const blocks = STAGES.map((st, i) => {
      const g = new THREE.Group(); g.position.set(XS[i], 0.06, 0); sup.add(g);
      return g;
    });
    // antenna: ferrite rod
    { const fr = rod(-0.7, 0.7, 0.07, 0.07, M.matte(0x2b2d33)); fr.position.y = 0.3; blocks[0].add(fr); }
    for (let i = 0; i < 12; i++) { const t = torus(0.09, 0.012, M.plastic(HEX.copper, { metalness: 0.5 }), 16); t.rotation.y = Math.PI / 2; t.position.set(-0.25 + i * 0.04, 0.3, 0); blocks[0].add(t); }
    // RF stage: a gang section and a transistor
    const g1 = makeGang(); g1.scale.setScalar(0.9); blocks[1].add(g1);
    const tr = (b, x) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 16, 1, false, 0, Math.PI), M.plastic(0x1b1e25)); m.position.set(x, 0.1, 0.55); b.add(m); };
    tr(blocks[1], 0.3); tr(blocks[2], 0); tr(blocks[3], -0.3); tr(blocks[3], 0.35); tr(blocks[5], 0); tr(blocks[5], 0.3);
    // mixer: a chip-like block
    const mix = box(0.6, 0.25, 0.6, M.plastic(0x2f3a4a)); mix.position.y = 0.14; blocks[2].add(mix);
    // local oscillator below the mixer (towards the viewer)
    const lo = new THREE.Group(); lo.position.set(XS[2], 0.06, 1.3); sup.add(lo);
    const loCan = box(0.35, 0.4, 0.35, M.metal(0xc9ced6)); loCan.position.y = 0.2; lo.add(loCan);
    const loCore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), M.plastic(0xff5a5a)); loCore.position.y = 0.41; lo.add(loCore);
    // IF: three cans (yellow, white, black cores)
    [0xffd166, 0xf2f2f2, 0x222222].forEach((c, i) => { const k = box(0.3, 0.36, 0.3, M.metal(0xc9ced6)); k.position.set(-0.45 + i * 0.45, 0.18, 0); blocks[3].add(k); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), M.plastic(c)); s.position.set(-0.45 + i * 0.45, 0.37, 0); blocks[3].add(s); });
    // detector: a diode and a capacitor
    const dio = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12), M.clear(0xffa050, 0.85)); dio.rotation.z = Math.PI / 2; dio.position.y = 0.12; blocks[4].add(dio);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.04, 12), M.matte(0x111111)); band.rotation.z = Math.PI / 2; band.position.set(0.1, 0.12, 0); blocks[4].add(band);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 14), M.plastic(0x3b5bdb)); cap.position.set(0, 0.13, 0.5); blocks[4].add(cap);
    // audio amp: transformer
    const xf = box(0.4, 0.3, 0.3, M.metal(0x6b7280)); xf.position.set(-0.3, 0.15, 0); blocks[5].add(xf);
    const spk = makeSpeaker(0.55); spk.position.set(0, 0.6, 0.1); blocks[6].add(spk);
    // signal path: a tube along the blocks with pulses
    const pathPts = XS.map((x) => new THREE.Vector3(x, 0.12, 0.85));
    sup.add(tube(pathPts, 0.03, M.ghost(0xffffff, 0.25), false, 80));
    sup.add(tube([new THREE.Vector3(XS[2], 0.12, 1.3), new THREE.Vector3(XS[2], 0.12, 0.85)], 0.03, M.ghost(0xc49bff, 0.5), false, 10));
    const pathC = new THREE.CatmullRomCurve3(pathPts);
    const pulses = Array.from({ length: 14 }, () => { const p = sphere(0.07, M.glow(0xffffff)); sup.add(p); return p; });
    // scopes above each block
    let s0 = null, t = 0;
    const scopes = STAGES.map((st, i) => board(sup, 1.8, 1.0, 360, 200, (g, w, h) => drawScope(g, w, h, i, st, s0, t), [XS[i], 2.35, -0.3]));
    const loScope = board(sup, 1.4, 0.8, 280, 160, (g, w, h) => drawLO(g, w, h, s0, t), [XS[2] + 0.1, 0.9, 2.0]);
    loScope.mesh.rotation.x = -0.5;
    const SL = STAGES.map((st, i) => stage.label(st.name, [XS[i], 1.6, 0.2], sup, i === 3 ? 'hot' : ''));
    const loL = stage.label('Local oscillator', [XS[2] - 0.2, 0.25, 2.1], sup, 'hot');
    // ================================================================ crystal set
    const xtal = new THREE.Group(); root.add(xtal);
    const baseB = box(4.2, 0.12, 2.2, M.plastic(0xb88a55, { roughness: 0.8 })); baseB.position.set(0, 0.06, 0); xtal.add(baseB);
    const parts = [];
    // 1: antenna wire up to a pole and the earth stake
    const p1 = new THREE.Group(); xtal.add(p1);
    const poleM = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.8, 10), M.matte(0x7a5b3a)); poleM.position.set(-4.2, 2.4, -1.4); p1.add(poleM);
    p1.add(wire([[-4.2, 4.7, -1.4], [-2.5, 4.3, -1.0], [-1.6, 1.0, -0.6], [-1.5, 0.3, -0.6]], M.metal(0xd8b070), 0.02));
    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.9, 8), M.metal(0x9aa3b2)); stake.position.set(-2.6, 0.2, 1.4); p1.add(stake);
    p1.add(wire([[-1.5, 0.2, 0.6], [-2.0, 0.1, 1.2], [-2.6, 0.55, 1.4]], M.plastic(0x2a9d4a), 0.02));
    // 2: coil on a cardboard tube
    const p2 = new THREE.Group(); p2.position.set(-0.9, 0.12, 0); xtal.add(p2);
    const tubeC = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.1, 24, 1, true), M.matte(0xd9c7a0, { side: THREE.DoubleSide })); tubeC.position.y = 0.55; p2.add(tubeC);
    for (let i = 0; i < 30; i++) { const tt = torus(0.33, 0.012, M.plastic(HEX.copper, { metalness: 0.5 }), 24); tt.rotation.x = Math.PI / 2; tt.position.y = 0.12 + i * 0.03; p2.add(tt); }
    // 3: variable capacitor
    const p3 = new THREE.Group(); p3.position.set(0.3, 0.12, 0); xtal.add(p3);
    const vc = makeGang(); vc.scale.setScalar(1.3); p3.add(vc);
    // 4: crystal detector: galena crystal in a cup, a cat's whisker wire
    const p4 = new THREE.Group(); p4.position.set(1.3, 0.12, 0.4); xtal.add(p4);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.12, 16), M.metal(0xd9b36c)); cup.position.y = 0.06; p4.add(cup);
    const gal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), M.metal(0x6b6f7a, { roughness: 0.25 })); gal.position.y = 0.16; p4.add(gal);
    p4.add(wire([[0.5, 0.05, 0], [0.45, 0.5, 0], [0.2, 0.55, 0], [0.02, 0.25, 0]], M.metal(0xd8b070), 0.008));
    // 5: headphones
    const p5 = new THREE.Group(); p5.position.set(2.4, 0.12, 0.2); xtal.add(p5);
    for (const x of [-0.35, 0.35]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 24), M.plastic(0x1b1e25)); e.rotation.z = Math.PI / 2; e.position.set(x, 0.45, 0); p5.add(e); }
    p5.add(tube([[-0.42, 0.5, 0], [-0.3, 1.1, 0], [0.3, 1.1, 0], [0.42, 0.5, 0]], 0.03, M.metal(0x9aa3b2), false, 30));
    p5.add(wire([[-1.0, 0.05, -0.2], [-0.6, 0.05, 0], [-0.4, 0.4, 0]], M.plastic(0x222222), 0.015));
    const xwires = new THREE.Group(); xtal.add(xwires);
    xwires.add(wire([[-0.9, 0.2, 0.35], [-0.3, 0.2, 0.5], [0.3, 0.2, 0.4]], M.plastic(0xd9534f), 0.015));
    xwires.add(wire([[0.6, 0.25, 0.3], [1.1, 0.2, 0.4], [1.3, 0.2, 0.4]], M.plastic(0xd9534f), 0.015));
    parts.push(p1, p2, p3, p4, p5);
    const sndRings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 32), M.glow(HEX.audio, { transparent: true, opacity: 0.5 })); m.rotation.y = Math.PI / 2; xtal.add(m); return m; });
    const xScope = board(xtal, 3.2, 1.6, 640, 320, (g, w, h) => drawCrystal(g, w, h, s0, t), [0.3, 2.6, -0.8]);
    const XL = [
      stage.label('Long wire antenna', [-2.8, 4.5, -1.2], xtal),
      stage.label('Earth', [-2.6, 0.9, 1.4], xtal),
      stage.label('Coil', [-0.9, 1.45, 0], xtal),
      stage.label('Tuning capacitor', [0.3, 1.0, 0.2], xtal),
      stage.label('Crystal and cat\'s whisker', [1.4, 0.95, 0.6], xtal, 'hot'),
      stage.label('Earphones', [2.4, 1.45, 0.2], xtal),
    ];
    let rx = 'super';
    const inst = {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt; s0 = s;
        const narrow = fitNarrow(stage, [loL, XL[1]], -0.1); narrowView(stage, narrow);
        if (s.rx !== rx) { rx = s.rx; if (rx === 'crystal') stage.setView([0.6, 4.2, 9.6], [-0.4, 1.8, 0], 1.0); else stage.setView([0.6, 4.2, 13.8], [0.6, 2.6, 0.4], 1.0); }
        sup.visible = s.rx === 'super'; xtal.visible = s.rx === 'crystal';
        if (sup.visible) {
          SL.forEach((l, i) => { l.visible = !narrow || i % 2 === 0; });
          const v = new THREE.Vector3();
          pulses.forEach((p, i) => { const u = (t * 0.12 + i / pulses.length) % 1; pathC.getPointAt(u, v); p.position.copy(v); const k = Math.floor(u * 6.999); p.material.color.set(STAGES[Math.min(6, k + 1)].col); p.scale.setScalar(k < 2 ? 0.7 : 1); });
          g1.setMesh(s.band === 'am' ? (s.f - MW.lo) / (MW.hi - MW.lo) : (s.ffm - FMB.lo) / (FMB.hi - FMB.lo));
          spk.setMove(Math.sin(t * 40) * 0.02 * Math.abs(Math.sin(t * 3)));
          if ((Math.floor(t * 30) & 1) === 0) { scopes.forEach((b) => b.redraw()); loScope.redraw(); }
        } else {
          parts.forEach((p, i) => { p.visible = s.step > i; });
          xwires.visible = s.step >= 4;
          XL.forEach((l, i) => { const idx = i <= 1 ? 0 : i - 1; l.visible = s.step > idx && !(narrow && i === 1); });
          const on = s.step >= 5;
          sndRings.forEach((m, i) => { const q = (t * 0.8 + i / 3) % 1; m.visible = on; m.position.set(2.4 + 0.3 + q * 1.2, 0.57, 0.2); m.scale.setScalar(0.6 + q); m.material.opacity = 0.6 * (1 - q); });
          vc.setMesh(0.5 + 0.1 * Math.sin(t * 0.3));
          xScope.redraw();
        }
      },
      readout(s) {
        if (s.rx === 'crystal') {
          const msgs = [
            'Start with the parts laid out.',
            'The wire picks up every station at once, far too weakly to hear, and all mixed together.',
            'A coil alone resonates with the wire\'s own capacitance: it favours some band, loosely.',
            'Now it is a tuned circuit: one station rings loudest. But earphones cannot follow a million pushes a second, and they cancel out.',
            'The crystal lets current through one way only. What is left follows the envelope: the sound.',
            'You hear the station! No battery: all the power, microwatts at most, comes from the radio wave.',
          ];
          return `<div class="big">Crystal set: ${CRYSTAL_STEPS[s.step].replace('+ ', 'adding ')}</div>
            <div class="row"><span>Battery</span><b>none</b></div>
            <div class="row"><span>Sound</span><b class="${s.step >= 5 ? 'ok' : 'no'}">${s.step >= 5 ? 'faint but clear' : 'silence'}</b></div>
            <small>${msgs[s.step]}</small>`;
        }
        const am = s.band === 'am', f = am ? s.f : s.ffm, ifq = am ? IF.am : IF.fm, lo = f + ifq, img = f + 2 * ifq;
        const st = am ? STATIONS.find((x) => Math.abs(x.f - f) < 4.5e3) : null;
        return `<div class="big">${fmtF(f)}${st ? ': ' + st.name : ''}</div>
          <div class="row"><span>Local oscillator (station + IF)</span><b>${fmtF(lo)}</b></div>
          <div class="row"><span>Mixer makes</span><b>${fmtF(lo - f)} and ${fmtF(lo + f)}</b></div>
          <div class="row"><span>Intermediate frequency</span><b>${fmtF(ifq)}, always</b></div>
          <div class="row"><span>IF passband</span><b>${am ? 'about 9 kHz' : 'about 200 kHz'}</b></div>
          <div class="row"><span>Image to keep out</span><b>${fmtF(img)}${!am ? ' (outside the band)' : img > MW.hi ? ' (off the band)' : ''}</b></div>
          <div class="row"><span>Detector</span><b>${am ? 'diode + capacitor (envelope)' : 'FM discriminator'}</b></div>`;
      },
    };
    return inst;
  },
};

// ---------------------------------------------------------------- scope drawings (illustrative)
function frame(g, w, h, lab, col) {
  panelBg(g, w, h);
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(10, h / 2 + 12); g.lineTo(w - 10, h / 2 + 12); g.stroke();
  text(g, lab, 12, 26, { font: 'bold 19px sans-serif', col });
}
function trace(g, w, h, f, col, amp = 1, y0 = 0) {
  g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
  const n = 240, mid = h / 2 + 12 + y0, A = (h / 2 - 26) * amp;
  for (let i = 0; i <= n; i++) { const u = i / n, y = mid - clamp(f(u), -1.2, 1.2) * A; i ? g.lineTo(10 + u * (w - 20), y) : g.moveTo(10 + u * (w - 20), y); }
  g.stroke();
}
function drawScope(g, w, h, i, st, s, t) {
  if (!s) { panelBg(g, w, h); return; }
  const am = s.band === 'am', sp = t * 0.8;
  const audio = (u) => Math.sin(2 * Math.PI * (1.5 * u - sp * 0.4)) * 0.8;
  const fs = am ? (s.f - 531e3) / (1602e3 - 531e3) : (s.ffm - 88e6) / 20e6;
  const fc = 18 + fs * 10, flo = fc + 9, fif = 9;              // picture frequencies: station, LO, difference
  const others = (u) => 0.35 * Math.sin(2 * Math.PI * (fc * 0.7 * u - sp)) + 0.3 * Math.sin(2 * Math.PI * (fc * 1.35 * u + sp)) + 0.25 * Math.sin(2 * Math.PI * (fc * 1.8 * u));
  const want = (u) => (1 + 0.6 * audio(u)) * Math.cos(2 * Math.PI * fc * u);
  const labels = {
    ant: 'every station, tiny', rf: `${fmtF(am ? s.f : s.ffm)} favoured`, mix: 'sum and difference',
    if: `${am ? '455 kHz' : '10.7 MHz'}, filtered`, det: am ? 'one-way: follows envelope' : 'frequency → voltage', aud: 'the sound', spk: 'air pressure',
  };
  frame(g, w, h, labels[st.id], st.col);
  if (st.id === 'ant') trace(g, w, h, (u) => 0.35 * want(u) + others(u) * 0.7, st.col, 0.9);
  else if (st.id === 'rf') trace(g, w, h, (u) => 0.55 * want(u) + others(u) * 0.2, st.col, 0.8);
  else if (st.id === 'mix') trace(g, w, h, (u) => 0.55 * want(u) * Math.cos(2 * Math.PI * flo * u), st.col, 1);
  else if (st.id === 'if') trace(g, w, h, (u) => am ? 0.55 * (1 + 0.6 * audio(u)) * Math.cos(2 * Math.PI * fif * u) : 0.7 * Math.cos(2 * Math.PI * (fif * u + 0.5 * Math.sin(2 * Math.PI * 1.5 * u - sp))), st.col, 1);
  else if (st.id === 'det') { trace(g, w, h, (u) => Math.max(0, 0.55 * (1 + 0.6 * audio(u)) * Math.cos(2 * Math.PI * fif * u)), 'rgba(123,224,140,.45)', 1); trace(g, w, h, (u) => 0.55 * (1 + 0.6 * audio(u)) * 0.95, st.col, 1); }
  else trace(g, w, h, audio, st.col, st.id === 'spk' ? 1 : 0.9);
}
function drawLO(g, w, h, s, t) {
  if (!s) { panelBg(g, w, h); return; }
  const am = s.band === 'am', f = am ? s.f : s.ffm, lo = f + (am ? IF.am : IF.fm);
  frame(g, w, h, `LO ${fmtF(lo)}`, COL.lo);
  const fs = am ? (s.f - 531e3) / (1602e3 - 531e3) : (s.ffm - 88e6) / 20e6;
  trace(g, w, h, (u) => Math.cos(2 * Math.PI * (27 + fs * 10) * u), COL.lo, 0.8);
}
function drawCrystal(g, w, h, s, t) {
  panelBg(g, w, h);
  if (!s) return;
  const st = s.step, sp = t * 0.6;
  const audio = (u) => Math.sin(2 * Math.PI * (1.5 * u - sp * 0.4));
  text(g, 'Signal in the circuit', 18, 34, { font: 'bold 24px sans-serif', col: '#e8eef8' });
  const lab = ['', 'at the wire: everything, weak', 'coil: a broad hump of stations', 'tuned: one station, both halves', 'after the crystal: one half only', 'in the earphones: the sound'][st] || '';
  text(g, lab, 18, 62, { font: '19px sans-serif', col: COL.soft });
  if (!st) return;
  const car = (u) => (1 + 0.6 * audio(u)) * Math.cos(2 * Math.PI * 26 * u);
  const mess = (u) => 0.4 * Math.sin(2 * Math.PI * 19 * u + sp) + 0.3 * Math.sin(2 * Math.PI * 33 * u - sp) + 0.3 * Math.sin(2 * Math.PI * 41 * u);
  const f = st === 1 ? (u) => 0.25 * car(u) + mess(u) * 0.6 : st === 2 ? (u) => 0.45 * car(u) + mess(u) * 0.35 : st === 3 ? (u) => 0.6 * car(u) : (u) => Math.max(0, 0.6 * car(u));
  g.strokeStyle = st >= 4 ? 'rgba(142,240,255,.55)' : COL.rf; g.lineWidth = 2; g.beginPath();
  const mid = h / 2 + 40, A = h / 2 - 70;
  for (let i = 0; i <= 400; i++) { const u = i / 400, y = mid - f(u) * A; i ? g.lineTo(20 + u * (w - 40), y) : g.moveTo(20 + u * (w - 40), y); }
  g.stroke();
  if (st >= 4) { g.strokeStyle = COL.audio; g.lineWidth = 3.5; g.beginPath(); for (let i = 0; i <= 200; i++) { const u = i / 200, y = mid - 0.6 * (1 + 0.6 * audio(u)) * 0.64 * A; i ? g.lineTo(20 + u * (w - 40), y) : g.moveTo(20 + u * (w - 40), y); } g.stroke(); text(g, st >= 5 ? 'average = the sound' : 'average of what is left', w - 20, 62, { font: 'bold 19px sans-serif', col: COL.audio, align: 'right' }); }
  if (st === 3) text(g, 'average = zero: silence', w - 20, 62, { font: 'bold 19px sans-serif', col: COL.bad, align: 'right' });
}
