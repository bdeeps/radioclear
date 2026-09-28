// Chapter 1: open up a 1970s–80s Indian household transistor radio, and set a modern DSP radio chip beside it.
// Tuning: L = 230 µH ferrite coil, gang + trimmer 40–400 pF, f = 1/(2π√LC) (radio.js).
// Supply: four 1.5 V D cells in series = 6 V. Current: a class-B push-pull output stage idles at about 8–15 mA
// and draws more with volume; small portables of the era were rated around 300 mW audio output. The model
// uses I ≈ 12 mA + 60 mA × volume² as a typical figure, not a measured spec of any one set.
import { THREE, exploder, approach } from '../kit.js';
import {
  makeTransistorRadio, makeDspModule, STATIONS, CofF, fmtL, lambdaM, resp, player, voice, hiss, fitNarrow, M, box,
} from '../radio.js';

const Q_ANT = 60;              // loaded Q of the ferrite antenna circuit (typical order 50–100)
const nearest = (fk) => STATIONS.reduce((a, b) => (Math.abs(b.f / 1e3 - fk) < Math.abs(a.f / 1e3 - fk) ? b : a));
// With the IF filter the set hears a station only within a few kHz of it (see chapter 5).
const heard = (fk) => { const st = nearest(fk), off = Math.abs(st.f / 1e3 - fk); return { st, k: Math.exp(-((off / 3.2) ** 2)) }; };

export default {
  id: 'anatomy',
  short: 'Inside a radio',
  title: 'Inside a transistor radio',
  subtitle: 'A ferrite rod, a tuning capacitor, a few transistors, a speaker and four big batteries.',
  view: { pos: [2.0, 2.7, 9.2], target: [1.1, 1.45, 0.3] },
  learn: `<p>For many Indian families in the 1970s and 80s, the <b>transistor radio</b> was the first electronic thing in the house. It sat on a shelf in a wooden or leatherette case, ran on four big <b>D cells</b>, and was always on for the news, film songs and the cricket.</p>
    <p>Open one up and there are surprisingly few parts. At the top lies a black <b>ferrite rod</b> wrapped in copper wire: that is the <b>antenna</b>. The tuning knob turns a <b>gang capacitor</b>, a stack of metal plates that slide between each other. Together, the coil and the capacitor pick one station out of dozens. Small metal cans called <b>IF transformers</b> filter the signal, six or seven <b>transistors</b> amplify it, a tiny <b>diode</b> pulls the sound out of the radio wave, and the <b>speaker</b> turns it back into air pressure.</p>
    <p>A radio today can be a single <b>DSP chip</b> a few millimetres across. It turns the radio wave into numbers and does the tuning and filtering with maths. The ideas inside are the same ones you will see in the old set.</p>
    <p class="tip"><b>Try it:</b> switch it on and turn the tuning knob. Watch the gang capacitor's plates slide in or out. Then take it apart and turn on X-ray.</p>`,
  terms: [
    { t: 'Transistor', d: 'A tiny switch-and-amplifier made of silicon or germanium. It replaced the glass valve in the 1950s.' },
    { t: 'Ferrite rod antenna', d: 'A coil of wire on a rod of magnetic ceramic that gathers the magnetic part of a medium-wave radio signal.' },
    { t: 'Gang capacitor', d: 'Interleaved metal plates on a shaft. Turning the knob changes how much they overlap, and so the station you tune.' },
    { t: 'IF transformer', d: 'A small screened can holding a tuned coil, used to filter the signal after it is shifted to a fixed frequency.' },
    { t: 'Diode', d: 'A one-way valve for current. In a radio it recovers the sound from the wave (detection).' },
    { t: 'DSP', d: 'Digital signal processing: doing filters and tuning with arithmetic on numbers instead of with coils.' },
  ],
  defaults: { on: true, f: 702, vol: 0.5, explode: 0, xray: false },
  controls: [
    { key: 'on', type: 'toggle', label: 'Switch it on' },
    { key: 'f', type: 'range', label: 'Tuning (medium wave)', min: 531, max: 1602, step: 1, ends: ['531 kHz', '1602 kHz'], fmt: (v) => Math.round(v) + ' kHz' },
    { key: 'vol', type: 'range', label: 'Volume', min: 0, max: 1, step: 0.01, ends: ['quiet', 'loud'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'exploded'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'X-ray the cabinet' },
    { key: 'go', type: 'buttons', label: 'Jump to a station', items: [
      { label: 'Next station', act: (s) => { const up = STATIONS.find((st) => st.f / 1e3 > s.f + 1) || STATIONS[0]; s.f = up.f / 1e3; } },
      { label: 'Listen', act: (s, inst) => inst.listen?.() },
    ] },
  ],
  quiz: [
    { q: 'What is the black rod wrapped in copper wire at the top of a transistor radio?', options: ['A battery', 'The antenna', 'A fuse', 'The speaker magnet'], answer: 1, why: 'It is a ferrite rod antenna. The magnetic part of the radio wave passes through the rod and makes a tiny voltage in the coil.' },
    { q: 'What changes when you turn the tuning knob?', options: ['The battery voltage', 'How much the plates of the gang capacitor overlap', 'The size of the speaker', 'The length of the antenna'], answer: 1, why: 'More overlap means more capacitance, and that tunes the circuit to a lower frequency.' },
    { q: 'How does a modern radio chip do the tuning and filtering?', options: ['With bigger coils', 'With arithmetic on the signal turned into numbers', 'With a crystal of galena', 'It cannot tune'], answer: 1, why: 'A DSP radio chip digitises the signal and filters it with maths, so one tiny chip replaces the coils and cans.' },
  ],
  reel: [
    { ms: 5400, caption: 'The household transistor radio: a ferrite rod, a tuning capacitor, a few transistors and a speaker.', set: { on: true, xray: false, f: 702 }, anim: { explode: [0, 1] }, spin: 0.5, view: { pos: [1.0, 2.6, 5.4], target: [0.4, 1.1, 0.2] } },
    { ms: 5000, caption: 'Turn the knob and the capacitor plates slide together, tuning in a different station.', set: { explode: 0, xray: true, on: true }, anim: { f: [1566, 594] }, spin: 0, view: { pos: [1.8, 3.0, 4.6], target: [0.6, 0.8, 0] } },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const R = makeTransistorRadio();
    root.add(R.group);
    const dsp = makeDspModule(); dsp.position.set(3.3, 0.47, 1.0); dsp.rotation.y = -0.3; root.add(dsp);
    const ped = box(1.3, 0.44, 1.1, M.matte(0x2a2f3a)); ped.position.set(3.3, 0.22, 1.0); ped.rotation.y = -0.3; root.add(ped);
    const setExplode = exploder([
      { obj: R.shell, off: [0, 0, -1.6] },
      { obj: R.front, off: [0, 0.15, 1.8] },
      { obj: R.speaker, off: [-0.4, 0, 1.0] },
      { obj: R.ferrite, off: [0, 1.4, -0.2] },
      { obj: R.pcb, off: [0.4, 0.5, 0.3] },
      { obj: R.batt, off: [0, -0.02, -0.9] },
    ]);
    const L = (t, obj, pos, cls) => stage.label(t, pos, obj, cls);
    const labels = {
      dial: L('Slide-rule dial', R.front, [-0.2, 2.02, 0.05]),
      tune: L('Tuning knob', R.front, [1.2, 1.3, 0.1]),
      grille: L('Speaker grille', R.front, [-0.62, 0.3, 0.05]),
      ferrite: L('Ferrite rod antenna', R.ferrite, [-0.6, 0.2, 0], 'hot'),
      gang: L('Gang capacitor', R.pcb, [0.3, 0.55, 0.1], 'hot'),
      cans: L('IF transformers', R.pcb, [-0.3, 0.32, -0.25]),
      trs: L('Transistors', R.pcb, [-0.4, 0.28, 0.25]),
      diode: L('Detector diode', R.pcb, [0.05, 0.15, 0.38]),
      spk: L('Speaker', R.speaker, [0, 0.72, 0]),
      batt: L('4 × D cells = 6 V', R.batt, [0.3, -0.3, 0.1]),
      dsp: L('Today: one DSP radio chip<br><small>module shown about 3× life size</small>', dsp, [0, 0.55, 0]),
    };
    const inner = [labels.ferrite, labels.gang, labels.cans, labels.trs, labels.diode, labels.spk, labels.batt];
    let cone = 0, t = 0, snd = null, noiseSnd = null, lampK = 0;
    const V = voice(2.4, 7), H = hiss(2.4, 9);
    const inst = {
      listen() { player.stopAll(); snd = player.play(V, { gain: 0, loop: true }); noiseSnd = player.play(H, { gain: 0, loop: true }); },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        player.sync();
        const narrow = fitNarrow(stage, [labels.grille, labels.dial, labels.cans, labels.diode, labels.dsp], -0.1);
        setExplode(s.explode);
        R.setXray(s.xray || s.explode > 0.05);
        [labels.dial, labels.tune].forEach((l) => { l.visible = s.explode < 0.25 && !narrow; });
        labels.grille.visible = s.explode < 0.25 && !s.xray && !narrow;
        inner.forEach((l) => { l.visible = (s.xray || s.explode > 0.25) && !(narrow && (l === labels.trs || l === labels.cans)); });
        R.setTune(s.f, 'mw'); R.setVolume(s.vol);
        const { k } = heard(s.f);
        lampK = approach(lampK, s.on ? 1 : 0, 6, dt);
        R.lamp.intensity = lampK * 1.2;
        // the cone moves with the programme (voice envelope) or static between stations
        const env = s.on ? (k * (0.5 + 0.5 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.1))) + (1 - k) * 0.25 * Math.abs(Math.sin(t * 57))) * s.vol : 0;
        cone = approach(cone, env * 0.05 * Math.sin(t * 60), 30, dt);
        R.speaker.setMove(cone);
        dsp.rotation.y = -0.3 + Math.sin(t * 0.4) * 0.15;
        if (snd) { snd.setGain(s.on ? 0.8 * s.vol * k : 0); }
        if (noiseSnd) { noiseSnd.setGain(s.on ? 0.35 * s.vol * (1 - k * 0.9) : 0); }
      },
      readout(s) {
        const f = s.f * 1e3, C = CofF(f), { st, k } = heard(s.f), I = s.on ? 12 + 60 * s.vol * s.vol : 0;
        const rej = resp(st.f, f, Q_ANT);
        return `<div class="big">${Math.round(s.f)} kHz${s.on ? (k > 0.5 ? ': ' + st.name : ': static') : ': off'}</div>
          <div class="row"><span>Wavelength λ = c / f</span><b>${fmtL(lambdaM(f))}</b></div>
          <div class="row"><span>Gang capacitor</span><b>${Math.round(C * 1e12)} pF with a 230 µH coil</b></div>
          <div class="row"><span>Battery</span><b>4 × 1.5 V = 6 V</b></div>
          <div class="row"><span>Current (typical)</span><b>${I.toFixed(0)} mA, ${(6 * I / 1000).toFixed(2)} W</b></div>
          ${s.on && k <= 0.5 ? `<div class="no">Between stations. Nearest: ${st.name}, ${Math.round(st.f / 1e3)} kHz (antenna passes ${Math.round(rej * 100)}% of it).</div>` : s.on ? '<div class="ok">Tuned in. The dial lamp is on.</div>' : ''}`;
      },
      dispose() { player.stopAll(); },
    };
    return inst;
  },
};
