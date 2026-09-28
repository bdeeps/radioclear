// Chapter 4: tuning is resonance. A coil (L = 230 µH on the ferrite rod) and the gang capacitor (40–400 pF)
// form a tuned circuit that rings at f0 = 1/(2π√(LC)) (radio.js). Its response to a station at f is
// |H| = 1/√(1 + Q²(f/f0 − f0/f)²), with bandwidth about f0/Q. Q of a loaded ferrite-rod circuit is typically
// 50–150; the slider spans 10–200 so you can see both a sloppy and a sharp circuit.
// Stations: real AIR medium-wave frequencies (radio.js STATIONS); their evening strengths are illustrative.
import { THREE, M, clamp, approach } from '../kit.js';
import {
  STATIONS, L_ANT, C_MIN, C_MAX, fRes, CofF, resp, dB, fmtL, lambdaM, fitNarrow, narrowView, liveLine, makeGang, rod, torus, box,
  sphere, HEX, wire,
} from '../radio.js';

const F0 = 531e3, F1 = 1602e3, XW = 11;
const X = (f) => -XW / 2 + ((f - F0) / (F1 - F0)) * XW;
const H = 3.2;

export default {
  id: 'tuning',
  short: 'Tuning in',
  title: 'Tuning: a circuit that rings',
  subtitle: 'A coil and a capacitor pass one frequency and turn the rest away.',
  view: { pos: [0.6, 4.6, 12.4], target: [-0.4, 1.6, 0.6] },
  learn: `<p>Every station in range is hitting your antenna at the same time, each on its own frequency. How does a radio pick just one? With <b>resonance</b>, the same effect that lets you pump a swing higher by pushing in time with it (see WaveClear).</p>
    <p>A <b>coil</b> (inductor, L) and a <b>capacitor</b> (C) wired together make a <b>tuned circuit</b>. Charge sloshes back and forth between them, from electric field in the capacitor to magnetic field in the coil and back, at one natural frequency: <b>f = 1 / (2π√LC)</b>. Signals at that frequency build up big. Signals at other frequencies do not.</p>
    <p>Turning the tuning knob swings the gang capacitor's plates in or out. More overlap means more <b>capacitance</b> and a lower frequency. With a 230 µH coil, 40 to 400 pF tunes the whole medium-wave band.</p>
    <p>How sharp the peak is depends on the circuit's <b>Q</b> (quality factor): the peak is about f / Q wide. A sharp peak gives good <b>selectivity</b>: it can split two stations only 18 kHz apart. But one tuned circuit is never quite sharp enough on its own, as you will see. That is why real radios add the trick in the next chapter.</p>
    <p class="tip"><b>Try it:</b> turn the dial slowly and watch the peak sweep across the stations. Park on Shillong (864 kHz) and lower Q: Imphal, next door at 882 kHz, starts to leak in.</p>`,
  terms: [
    { t: 'Resonance', d: 'A big response when something is pushed at its own natural frequency.' },
    { t: 'Inductor', d: 'A coil of wire that stores energy in a magnetic field. Its size is measured in henries (H).' },
    { t: 'Capacitor', d: 'Two conductors close together that store energy in an electric field. Measured in farads (F); tuning capacitors are a few hundred picofarads.' },
    { t: 'Tuned circuit', d: 'A coil and a capacitor together, which resonate at f = 1 / (2π√LC).' },
    { t: 'Q factor', d: 'How sharp a resonance is. The width of the peak is roughly the frequency divided by Q.' },
    { t: 'Selectivity', d: 'How well a radio keeps out stations next to the one you want.' },
  ],
  defaults: { C: CofF(864e3), Q: 60 },
  controls: [
    { key: 'C', type: 'log', label: 'Turn the dial (gang capacitor)', min: C_MIN, max: C_MAX, ends: ['40 pF', '400 pF'], fmt: (v) => `${Math.round(v * 1e12)} pF → ${Math.round(fRes(L_ANT, v) / 1e3)} kHz` },
    { key: 'Q', type: 'log', label: 'Sharpness of the circuit (Q)', min: 10, max: 200, ends: ['sloppy', 'sharp'], fmt: (v) => 'Q = ' + Math.round(v) },
    { key: 'go', type: 'buttons', label: 'Jump', items: [
      { label: '◀ Station', act: (s) => { const f = fRes(L_ANT, s.C); const st = [...STATIONS].reverse().find((x) => x.f < f - 2e3) || STATIONS[STATIONS.length - 1]; s.C = CofF(st.f); } },
      { label: 'Station ▶', act: (s) => { const f = fRes(L_ANT, s.C); const st = STATIONS.find((x) => x.f > f + 2e3) || STATIONS[0]; s.C = CofF(st.f); } },
    ] },
  ],
  quiz: [
    { q: 'You turn the knob so the gang capacitor\'s plates overlap more. What happens?', options: ['The radio tunes to a higher frequency', 'The radio tunes to a lower frequency', 'The volume goes up', 'Nothing'], answer: 1, why: 'More overlap means more capacitance, and f = 1 / (2π√LC) gets smaller.' },
    { q: 'What does a higher Q do?', options: ['Makes the resonance peak narrower, so neighbouring stations are kept out', 'Makes the radio louder at every frequency', 'Changes the station', 'Uses less battery'], answer: 0, why: 'The peak is about f / Q wide, so a higher Q means a sharper peak and better selectivity.' },
    { q: 'A tuned circuit has L = 230 µH and C = 100 pF. Roughly what does it tune to?', options: ['105 kHz', '1,050 kHz', '10.5 MHz', '105 MHz'], answer: 1, why: 'f = 1 / (2π√(230×10⁻⁶ × 100×10⁻¹²)) ≈ 1.05 million hertz, in the medium-wave band.' },
  ],
  reel: [
    { ms: 5600, caption: 'Turning the dial changes a capacitor, and the circuit\'s resonance peak sweeps across the stations.', set: { Q: 70 }, anim: { C: [C_MAX * 0.95, C_MIN * 1.05, true] }, spin: 0, view: { pos: [0.2, 3.4, 7.2], target: [0, 1.7, 0.8] } },
    { ms: 5000, caption: 'A sharper circuit, higher Q, keeps a neighbouring station out.', set: { C: CofF(864e3) }, anim: { Q: [12, 180, true] }, spin: 0, view: { pos: [-1.2, 3.6, 7.2], target: [-0.6, 1.6, 0] } },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // frequency axis
    const ticks = [];
    const ax = new THREE.Mesh(new THREE.BoxGeometry(XW + 0.4, 0.06, 0.06), M.metal(0x9aa3b2)); ax.position.set(0, 0.03, 0); root.add(ax);
    for (let k = 600; k <= 1600; k += 100) { const tk = box(0.02, 0.02, 0.3, M.ghost(0xffffff, 0.5)); tk.position.set(X(k * 1e3), 0.02, 0.2); root.add(tk); if (k % 200 === 0 || k === 600) ticks.push(stage.label(`${k}`, [X(k * 1e3), -0.05, 0.55], root)); }
    stage.label('kHz', [XW / 2 + 0.4, -0.05, 0.55], root);
    // stations: glowing posts, height = signal at the antenna, lit by how much the tuned circuit lets through
    const posts = STATIONS.map((st, i) => {
      const up = i > 0 && st.f - STATIONS[i - 1].f < 30e3 ? 0.6 : 0;
      const g = new THREE.Group(); g.position.set(X(st.f), 0, 0); root.add(g);
      const ghost = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 16), M.ghost(0x8ef0ff, 0.18)); ghost.scale.y = st.s * H; ghost.position.y = st.s * H / 2; g.add(ghost);
      const lit = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 16), M.glow(0x8ef0ff)); g.add(lit);
      const lab = stage.label(`${st.name.replace('AIR ', '')}<br><small>${Math.round(st.f / 1e3)}</small>`, [0, st.s * H + 0.35 + up, 0], g);
      return { st, g, lit, lab };
    });
    // the resonance curve, drawn over the stations
    const NC = 400, curve = liveLine(NC, HEX.audio); root.add(curve);
    const curveB = liveLine(NC, HEX.audio, 0.35); root.add(curveB);
    const peak = sphere(0.12, M.glow(HEX.audio)); root.add(peak);
    const pointer = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, H + 0.6, 8), M.glow(0xff5a5a)); root.add(pointer);
    // the tuned circuit itself, in front: coil on a ferrite rod, the gang capacitor, and wires
    const lc = new THREE.Group(); lc.position.set(2.0, 0, 4.4); lc.rotation.y = -0.2; root.add(lc);
    const fer = rod(-1.2, 0.4, 0.09, 0.09, M.matte(0x2b2d33)); fer.position.y = 0.5; lc.add(fer);
    const turns = []; for (let i = 0; i < 22; i++) { const t = torus(0.12, 0.014, M.plastic(HEX.copper, { metalness: 0.5, roughness: 0.35 }), 20); t.rotation.y = Math.PI / 2; t.position.set(-0.9 + i * 0.045, 0.5, 0); lc.add(t); turns.push(t); }
    const gang = makeGang(); gang.position.set(1.3, 0, 0); gang.scale.setScalar(1.5); lc.add(gang);
    const cu = M.plastic(HEX.copper, { metalness: 0.5, roughness: 0.4 });
    lc.add(wire([[-0.9, 0.62, 0], [-0.9, 1.1, 0], [1.3, 1.1, 0], [1.3, 0.72, 0]], cu, 0.02));
    lc.add(wire([[0.05, 0.38, 0], [0.05, 0.1, 0.2], [1.1, 0.1, 0.2], [1.1, 0.2, 0]], cu, 0.02));
    const eGlow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), M.ghost(HEX.e, 0.3)); eGlow.position.set(1.3, 0.35, 0); lc.add(eGlow);
    const bGlow = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 12), M.ghost(HEX.b, 0.3)); bGlow.scale.set(1.4, 0.7, 0.7); bGlow.position.set(-0.4, 0.5, 0); lc.add(bGlow);
    const Lb = {
      coil: stage.label('Coil L = 230 µH', [-0.4, 0.05, 0.3], lc),
      cap: stage.label('Gang capacitor C', [1.3, 1.35, 0], lc, 'hot'),
      curve: stage.label('What the tuned circuit lets through', [0, H + 0.9, 0], root),
    };
    let t = 0, cur = null, glow = 0;
    const inst = {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const narrow = fitNarrow(stage, [Lb.coil, Lb.curve, Lb.cap], -0.1); narrowView(stage, narrow);
        ticks.forEach((l, i) => { l.visible = !narrow || i % 2 === 0; });
        const f0 = fRes(L_ANT, s.C);
        for (let i = 0; i < NC; i++) {
          const f = F0 * 0.97 + (i / (NC - 1)) * (F1 * 1.02 - F0 * 0.97), y = resp(f, f0, s.Q) * (H + 0.1) + 0.02;
          curve.set(i, X(f), y, 0.02); curveB.set(i, X(f), y, -0.02);
        }
        curve.done(); curveB.done();
        peak.position.set(X(f0), H + 0.12, 0); pointer.position.set(X(f0), (H + 0.6) / 2, 0);
        let best = null;
        posts.forEach((p) => {
          const a = resp(p.st.f, f0, s.Q), h = Math.max(0.001, p.st.s * a * H);
          p.lit.scale.y = h; p.lit.position.y = h / 2;
          p.lit.material.color.setHex(a > 0.7 ? 0x7be08c : a > 0.25 ? 0xffd166 : 0x8ef0ff);
          p.lab.element.style.opacity = a > 0.25 ? 1 : 0.55;
          p.lab.visible = !narrow || a > 0.25;
          if (!best || p.st.s * a > best.v) best = { v: p.st.s * a, p, a };
        });
        cur = best;
        gang.setMesh((s.C - C_MIN) / (C_MAX - C_MIN));
        // energy sloshing between capacitor (electric) and coil (magnetic), slowed about 400,000 times
        glow = approach(glow, best.a, 4, dt);
        const ph = Math.sin(t * 5);
        eGlow.material.opacity = 0.05 + 0.4 * glow * ph * ph; bGlow.material.opacity = 0.05 + 0.4 * glow * (1 - ph * ph);
      },
      readout(s) {
        const f0 = fRes(L_ANT, s.C), bw = f0 / s.Q;
        const sorted = STATIONS.map((st) => ({ st, v: st.s * resp(st.f, f0, s.Q) })).sort((a, b) => b.v - a.v);
        const [a, b] = sorted, clear = a.v > 0.25 ? dB(a.v / b.v) : 0;
        return `<div class="big">${Math.round(f0 / 1e3)} kHz${a.v > 0.3 ? ': ' + a.st.name : ''}</div>
          <div class="row"><span>f = 1 / (2π√LC)</span><b>L 230 µH, C ${Math.round(s.C * 1e12)} pF</b></div>
          <div class="row"><span>Wavelength</span><b>${fmtL(lambdaM(f0))}</b></div>
          <div class="row"><span>Width of the peak (f / Q)</span><b>${(bw / 1e3).toFixed(1)} kHz</b></div>
          <div class="row"><span>Next loudest: ${b.st.name.replace('AIR ', '')}</span><b>${a.v > 0.25 ? clear.toFixed(0) + ' dB quieter' : '—'}</b></div>
          ${a.v > 0.25 ? (clear < 20 ? '<div class="no">Not enough: you hear the neighbour underneath.</div>' : '<div class="ok">One station, cleanly.</div>') : '<div class="no">Between stations: just static.</div>'}`;
      },
    };
    return inst;
  },
};
