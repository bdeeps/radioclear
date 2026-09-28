// Chapter 3: putting a voice on a carrier. AM varies the carrier's size; FM varies its frequency.
// The 3D wave between the mast and the radio, and the top three rows of the scope, are drawn with the
// carrier slowed and scaled so the eye can follow it (about 30 carrier cycles per window).
// The spectrum is exact for a single tone: AM gives a carrier and two sidebands of height m/2 at fc ± fm;
// FM gives lines at fc ± n·fm of height |Jn(β)| with β = Δf / fm (Bessel functions, radio.js).
// Bandwidths: AM 2 × highest audio (9 kHz channel in India carries up to 4.5 kHz); FM by Carson's rule
// 2 × (Δf + fm) with Δf up to 75 kHz and fm up to 15 kHz (ITU-R BS.450).
// "Listen" and the measured audio SNR come from simulateLink() in radio.js: a real complex-baseband AM or FM
// link with Gaussian noise and crackle, an envelope detector for AM and a limiter-discriminator for FM.
import { THREE, M, clamp } from '../kit.js';
import {
  simulateLink, besselJ, voice, board, panelBg, title, text, COL, HEX, fitNarrow, narrowView, reelBoards, liveLine, makeMast,
  makeSpeaker, player, rng, box, fmtF, SR,
} from '../radio.js';

const NP = 700;
const cnrOf = (k) => 45 - 25 * k;
const MODE = { am: { name: 'AM', f: 819e3 }, fm: { name: 'FM', f: 100.1e6 } };

export default {
  id: 'modulation',
  short: 'AM and FM',
  title: 'Riding a wave: AM and FM',
  subtitle: 'A voice cannot fly on its own. It hitches a ride on a fast carrier wave, by changing its size or its frequency.',
  view: { pos: [1.2, 4.2, 12.8], target: [1.0, 3.5, 0] },
  learn: `<p>Your voice is a slow wobble, a few hundred to a few thousand times a second. Waves that slow would need an antenna kilometres long, and every station would talk over every other. So a radio station makes a fast, steady <b>carrier wave</b> on its own frequency, say <b>819 kHz</b>, and makes the voice change it. This is <b>modulation</b>.</p>
    <p>In <b>AM</b> (amplitude modulation) the voice changes the carrier's <b>size</b>. Trace the tops of the peaks and you see the voice: this outline is the <b>envelope</b>. In <b>FM</b> (frequency modulation) the size stays fixed and the voice nudges the <b>frequency</b> up and down, by up to 75 kHz for FM broadcasts. The waves bunch up and spread out in time with the sound.</p>
    <p>Modulation spreads a station's signal into <b>sidebands</b> either side of the carrier. An AM station needs only 9 kHz of room, so there is space for many of them. An FM station takes about 200 kHz but sounds better. Lightning, motors and switches make bursts of <b>static</b> that change the size of the wave. An AM set hears every burst as a crackle. An FM set ignores the size and listens only to the timing, so most of the static vanishes. How FM stations share the band is the story of FMClear.</p>
    <p class="tip"><b>Try it:</b> turn up the static and press "Listen" for AM, then for FM. Push the AM depth past 100% and see the envelope fold over.</p>`,
  terms: [
    { t: 'Carrier', d: 'The steady high-frequency wave a station sends, on its own frequency.' },
    { t: 'Modulation', d: 'Changing a carrier wave so that it carries a message.' },
    { t: 'AM', d: 'Amplitude modulation: the message changes the size of the carrier.' },
    { t: 'FM', d: 'Frequency modulation: the message changes the frequency of the carrier.' },
    { t: 'Envelope', d: 'The outline traced by the peaks of an AM wave. It has the shape of the sound.' },
    { t: 'Sideband', d: 'The extra frequencies either side of the carrier that the message creates.' },
    { t: 'Deviation', d: 'How far an FM carrier\'s frequency swings; ±75 kHz at full volume for FM broadcasts.' },
  ],
  defaults: { mode: 'am', src: 'tone', toneHz: 1000, m: 0.7, dev: 75e3, stat: 0.4 },
  controls: [
    { key: 'mode', type: 'seg', label: 'Modulation', options: [{ v: 'am', label: 'AM' }, { v: 'fm', label: 'FM' }] },
    { key: 'src', type: 'seg', label: 'Message', options: [{ v: 'tone', label: 'A whistle' }, { v: 'voice', label: 'A voice' }] },
    { key: 'toneHz', type: 'log', label: 'Whistle pitch', min: 200, max: 4000, ends: ['200 Hz', '4 kHz'], fmt: (v) => Math.round(v) + ' Hz' },
    { key: 'm', type: 'range', label: 'AM depth', min: 0, max: 1.3, step: 0.01, ends: ['0%', '130%'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'dev', type: 'range', label: 'FM deviation', min: 5e3, max: 75e3, step: 1e3, ends: ['±5 kHz', '±75 kHz'], fmt: (v) => '±' + Math.round(v / 1e3) + ' kHz' },
    { key: 'stat', type: 'range', label: 'Static and noise', min: 0, max: 1, step: 0.01, ends: ['clear', 'stormy'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'hear', type: 'buttons', label: 'Listen', items: [
      { label: 'Listen', act: (s, inst) => inst.listen?.() },
      { label: 'Stop', act: () => player.stopAll() },
    ] },
  ],
  quiz: [
    { q: 'In AM, what does the voice change?', options: ['The carrier\'s frequency', 'The carrier\'s size (amplitude)', 'The speed of the wave', 'The colour of the wave'], answer: 1, why: 'Amplitude modulation makes the carrier bigger and smaller in the shape of the sound.' },
    { q: 'Why does FM sound cleaner than AM in a thunderstorm?', options: ['Lightning cannot reach FM', 'Static mostly changes a wave\'s size, and an FM set ignores size', 'FM stations are closer', 'FM uses bigger speakers'], answer: 1, why: 'An FM receiver clips the wave to a fixed size and listens only to its frequency, so bursts of static mostly disappear.' },
    { q: 'An AM station sends a 3 kHz whistle on an 819 kHz carrier. Where are its sidebands?', options: ['At 3 kHz and 819 kHz', 'At 816 kHz and 822 kHz', 'At 1,638 kHz', 'There are none'], answer: 1, why: 'The sidebands sit at the carrier plus and minus the sound frequency: 819 − 3 and 819 + 3 kHz.' },
  ],
  reel: [
    { ms: 5600, caption: 'AM: the voice changes the size of the carrier wave. Static shows up as crackle.', set: { mode: 'am', src: 'tone', toneHz: 700, m: 0.8, stat: 0 }, anim: { stat: [0, 0.8] }, spin: 0, view: { pos: [0, 5.0, 11.0], target: [0, 4.6, 0] } },
    { ms: 5400, caption: 'FM: the voice nudges the frequency instead, and most of the static disappears.', set: { mode: 'fm', src: 'tone', toneHz: 700, dev: 75e3, stat: 0.8 }, anim: {}, spin: 0, view: { pos: [0, 5.0, 11.0], target: [0, 4.6, 0] } },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const XA = -4.6, XB = 4.6, YW = 2.3;
    const mast = makeMast(3.2); mast.position.set(XA - 0.3, 0, -0.2); root.add(mast);
    const txBox = box(1.0, 0.7, 0.8, M.plastic(0x2f3a4a)); txBox.position.set(XA - 0.9, 0.35, 1.2); root.add(txBox);
    const mic = new THREE.Group(); { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.3, 6, 16), M.metal(0x9aa3b2)); b.position.y = 1.0; mic.add(b); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), M.metal(0x6b7280)); st.position.y = 0.45; mic.add(st); } mic.position.set(XA - 1.6, 0, 1.6); root.add(mic);
    // receiver: a small radio with a speaker
    const rx = new THREE.Group(); rx.position.set(XB + 0.4, 0, 0); root.add(rx);
    const cab = box(1.5, 1.0, 0.5, M.plastic(0x7a4a2a)); cab.position.y = 0.5; rx.add(cab);
    const spk = makeSpeaker(0.32); spk.position.set(-0.3, 0.5, 0.2); rx.add(spk);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6, 6), M.metal()); ant.position.set(0.5, 1.7, 0); ant.rotation.z = -0.3; rx.add(ant);
    const wave = liveLine(NP, HEX.rf); root.add(wave);
    const env1 = liveLine(NP, HEX.audio, 0.7), env2 = liveLine(NP, HEX.audio, 0.7); root.add(env1, env2);
    const L = {
      mic: stage.label('Voice in', [XA - 1.6, 1.55, 1.6], root),
      tx: stage.label('Transmitter', [XA - 0.9, 0.95, 1.2], root),
      rx: stage.label('Radio', [XB + 0.4, 1.3, 0.3], root),
      env: stage.label('Envelope = the sound', [0, YW + 1.35, 0], root, 'hot'),
    };
    const V = voice(2.4, 5);
    const r = rng(21);
    const spikes = Array.from({ length: 16 }, () => ({ x: r(), a: 0.5 + r(), w: 0.004 + r() * 0.006 }));
    // message value at display phase u (0..1 across the window), time t
    let s0 = null, t = 0, simRes = null;
    const msg = (u) => {
      if (s0.src === 'voice') { const i = Math.floor(((t * 0.35 + u * 0.06) * SR) % V.length); return V[i] / 0.8; }
      const cyc = 1.2 + 1.8 * Math.log2(s0.toneHz / 200) / Math.log2(20);
      return Math.sin(2 * Math.PI * (cyc * u - t * 0.7));
    };
    const statAt = (u) => { if (!s0.stat) return 0; let v = 0; for (const sp of spikes) { const d = ((u - sp.x - t * 0.09) % 1 + 1) % 1; if (d < sp.w) v += sp.a * Math.sin(d / sp.w * Math.PI); } return v * s0.stat * 0.9; };
    // AM: (1 + m·x)·cos; FM: cos(phase) with frequency fc·(1 + k·x)
    const CYC = 30;
    const sig = (u) => {
      const x = msg(u);
      if (s0.mode === 'am') return (1 + s0.m * x) * Math.cos(2 * Math.PI * CYC * u);
      return 0; // FM handled by integration
    };
    const scope = board(root, 4.6, 2.8, 1080, 660, (g, w, h) => {
      panelBg(g, w, h);
      if (!s0) return;
      title(g, s0.mode === 'am' ? 'AM: the sound sets the size' : 'FM: the sound sets the frequency', 'slowed and scaled so you can see it');
      const rows = [['SOUND', COL.audio], ['CARRIER', COL.lo], ['ON AIR', COL.rf], ['HEARD', COL.good]];
      const x0 = 150, pw = w - 180, rh = (h - 90) / 4;
      const fmPh = fmPhase(300);
      rows.forEach(([lab, col], j) => {
        const mid = 86 + j * rh + rh / 2;
        g.strokeStyle = COL.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, mid); g.lineTo(x0 + pw, mid); g.stroke();
        text(g, lab, 20, mid + 6, { font: 'bold 19px sans-serif', col });
        g.strokeStyle = col; g.lineWidth = 2.2; g.beginPath();
        const n = 300;
        for (let i = 0; i <= n; i++) {
          const u = i / n; let v;
          if (j === 0) v = msg(u) * 0.8;
          else if (j === 1) v = Math.cos(2 * Math.PI * CYC * u) * 0.6;
          else if (j === 2) v = (s0.mode === 'am' ? sig(u) * 0.42 : Math.cos(fmPh[i]) * 0.6) + statAt(u) * 0.5;
          else v = heard(u) * 0.8;
          const y = mid - clamp(v, -1.25, 1.25) * (rh / 2 - 6);
          i ? g.lineTo(x0 + u * pw, y) : g.moveTo(x0 + u * pw, y);
        }
        g.stroke();
      });
      if (s0.mode === 'am' && s0.m > 1) text(g, 'Over 100%: the envelope folds over, the sound distorts', x0 + pw, 86 + 2 * rh + 20, { font: 'bold 17px sans-serif', col: COL.bad, align: 'right' });
    }, [1.5, 5.0, -1.6]);
    const spec = board(root, 3.6, 2.8, 880, 660, (g, w, h) => { if (s0) drawSpec(g, w, h, s0); }, [5.8, 5.0, -1.6]);
    spec.mesh.rotation.y = -0.2;
    // FM phase across the window: frequency CYC·(1 + k·x)
    const fmPhase = (n) => { const out = new Float32Array(n + 1), k = 0.45 * (s0.dev / 75e3); let ph = 0; for (let i = 0; i <= n; i++) { out[i] = ph; ph += (2 * Math.PI * CYC * (1 + k * msg(i / n))) / n; } return out; };
    // the demodulated sound on screen: AM hears the static bursts, FM (limiter) keeps only a trace of them
    const heard = (u) => {
      const x = msg(u), st = statAt(u);
      if (s0.mode === 'am') return clamp(Math.abs(1 + s0.m * x) - 1, -1.3, 1.3) / Math.max(0.3, s0.m) * 0.8 * (s0.m ? 1 : 0) + st * 0.9;
      return x * (s0.dev / 75e3) * 0.8 / Math.max(0.2, s0.dev / 75e3) + st * 0.06;
    };
    let lastKey = '', changedAt = 0, simKey = '';
    const keyOf = (s) => [s.mode, s.src, Math.round(s.toneHz), s.m.toFixed(2), Math.round(s.dev), s.stat.toFixed(2)].join('|');
    const runSim = (s) => simulateLink({ mode: s.mode, src: s.src, toneHz: s.toneHz, m: s.m, dev: s.dev, cnrAm: cnrOf(s.stat), crackle: s.stat });
    let cone = 0;
    const inst = {
      listen() { player.stopAll(); simRes = runSim(s0); simKey = keyOf(s0); player.play(simRes.out, { gain: 0.8, loop: true }); },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt; s0 = s;
        player.sync();
        const narrow = fitNarrow(stage, [L.mic, L.tx], -0.08); narrowView(stage, narrow);
        reelBoards([[scope, [0, 7.3, -1.6], 1.0], [spec, [0, 4.6, -1.3], 0.8]]);
        const phoneOnly = narrow && !document.body.classList.contains('gb-reel');
        scope.mesh.visible = spec.mesh.visible = !phoneOnly;
        // the 3D wave from mast to radio
        const fmPh = s.mode === 'fm' ? fmPhase(NP - 1) : null;
        for (let i = 0; i < NP; i++) {
          const u = i / (NP - 1), x = XA + u * (XB - XA), st = statAt(u) * 0.55;
          const y = s.mode === 'am' ? sig(u) * 0.55 : Math.cos(fmPh[i]) * 0.7;
          wave.set(i, x, YW + y + st, 0);
          const e = s.mode === 'am' ? (1 + s.m * msg(u)) * 0.55 : 0.7;
          env1.set(i, x, YW + e, 0); env2.set(i, x, YW - e, 0);
        }
        wave.done(); env1.done(); env2.done();
        env1.visible = env2.visible = s.mode === 'am'; L.env.visible = s.mode === 'am' && !narrow;
        cone = heard(0.95) * 0.03;
        spk.setMove(cone);
        scope.redraw(); spec.redraw();
        mast.lamp.material.color.setHex(Math.sin(t * 4) > 0 ? 0xff3b3b : 0x551111);
      },
      readout(s) {
        s0 = s;
        const k = keyOf(s), now = performance.now();
        if (k !== lastKey) { lastKey = k; changedAt = now; }
        if (k !== simKey && now - changedAt > 400) { simRes = runSim(s); simKey = k; }
        const fmHz = s.src === 'voice' ? (s.mode === 'am' ? 4500 : 15000) : s.toneHz;
        const bw = s.mode === 'am' ? 2 * fmHz : 2 * (s.dev + fmHz);
        const beta = s.dev / s.toneHz;
        const snr = simKey === k && simRes ? `${simRes.snr.toFixed(0)} dB` : 'measuring…';
        return `<div class="big">${MODE[s.mode].name} on ${fmtF(MODE[s.mode].f)}</div>
          <div class="row"><span>Signal width (${s.mode === 'am' ? '2 × audio' : 'Carson: 2 × (Δf + audio)'})</span><b>${(bw / 1e3).toFixed(bw < 2e4 ? 1 : 0)} kHz</b></div>
          ${s.mode === 'am' ? `<div class="row"><span>Depth m</span><b class="${s.m > 1 ? 'no' : ''}">${Math.round(s.m * 100)}%</b></div>` : `<div class="row"><span>Deviation Δf${s.src === 'tone' ? ', index β = Δf / f' : ''}</span><b>±${Math.round(s.dev / 1e3)} kHz${s.src === 'tone' ? ', β = ' + beta.toFixed(1) : ''}</b></div>`}
          <div class="row"><span>Carrier-to-noise in the channel</span><b>${(s.mode === 'am' ? cnrOf(s.stat) : cnrOf(s.stat) - 13).toFixed(0)} dB</b></div>
          <div class="row"><span>Sound-to-noise after the receiver (measured)</span><b>${snr}</b></div>
          ${s.mode === 'am' && s.m > 1 ? '<div class="no">Over-modulated: the sound is distorted.</div>' : s.mode === 'fm' && cnrOf(s.stat) - 13 < 10 ? '<div class="no">Near the FM threshold: clicks creep in.</div>' : ''}`;
      },
      dispose() { player.stopAll(); },
    };
    return inst;
  },
};

// The spectrum around the carrier: exact lines for a whistle, a sketch of the spread for a voice.
function drawSpec(g, w, h, s) {
  panelBg(g, w, h);
  const am = s.mode === 'am', span = am ? 10e3 : 160e3;
  title(g, 'Spectrum around the carrier', am ? 'carrier ± 10 kHz · box = 9 kHz AM channel' : 'carrier ± 160 kHz · box = 200 kHz FM channel');
  const x0 = 40, x1 = w - 40, y0 = h - 70, H = h - 190, xc = (x0 + x1) / 2;
  const X = (df) => xc + (df / span) * (x1 - x0) / 2;
  const chan = am ? 4.5e3 : 100e3;
  g.fillStyle = 'rgba(123,224,140,.08)'; g.fillRect(X(-chan), y0 - H - 10, X(chan) - X(-chan), H + 10);
  g.strokeStyle = 'rgba(123,224,140,.5)'; g.lineWidth = 2; g.strokeRect(X(-chan), y0 - H - 10, X(chan) - X(-chan), H + 10);
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  const bar = (df, a, col) => { const x = X(df); if (x < x0 || x > x1) return; g.fillStyle = col; g.fillRect(x - 3, y0 - a * H, 6, a * H); };
  if (s.src === 'tone') {
    if (am) { bar(0, 1, COL.lo); bar(-s.toneHz, Math.min(1, s.m / 2), COL.rf); bar(s.toneHz, Math.min(1, s.m / 2), COL.rf); }
    else {
      const beta = s.dev / s.toneHz, nMax = Math.ceil(span / s.toneHz);
      for (let n = -nMax; n <= nMax; n++) { const a = Math.abs(besselJ(n, beta)); bar(n * s.toneHz, Math.min(1, a * 1.6), n === 0 ? COL.lo : COL.rf); }
      text(g, 'lines at the carrier ± whole numbers of the pitch', xc, y0 + 44, { font: '16px sans-serif', col: COL.soft, align: 'center' });
    }
  } else {
    g.fillStyle = COL.rf; g.globalAlpha = 0.7;
    const top = am ? 4.5e3 : s.dev + 15e3;
    g.beginPath(); g.moveTo(X(-top), y0);
    for (let i = 0; i <= 80; i++) { const df = -top + (2 * top * i) / 80, a = am ? (Math.abs(df) < 150 ? 0 : 0.35 * Math.exp(-Math.abs(df) / 1500) + 0.05) : 0.3 * (1 - (df / top) ** 2) + 0.03; g.lineTo(X(df), y0 - a * H); }
    g.lineTo(X(top), y0); g.fill(); g.globalAlpha = 1;
    if (am) bar(0, 1, COL.lo);
  }
  const lab = am ? [[-10e3, '−10'], [-5e3, '−5'], [0, 'carrier'], [5e3, '+5'], [10e3, '+10 kHz']] : [[-150e3, '−150'], [-75e3, '−75'], [0, 'carrier'], [75e3, '+75'], [150e3, '+150 kHz']];
  lab.forEach(([df, l]) => text(g, l, X(df), y0 + 24, { font: '16px sans-serif', col: 'rgba(255,255,255,.7)', align: 'center' }));
  if (!am) { const c = s.dev + (s.src === 'tone' ? s.toneHz : 15e3); g.strokeStyle = COL.audio; g.setLineDash([6, 6]); for (const d of [-c, c]) { g.beginPath(); g.moveTo(X(d), y0); g.lineTo(X(d), y0 - H - 10); g.stroke(); } g.setLineDash([]); text(g, 'Carson width', X(c), y0 - H - 16, { font: '15px sans-serif', col: COL.audio, align: 'center' }); }
}
