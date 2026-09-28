// Chapter 6: radio in India. A stylised stretch of the east coast (1 scene unit = 40 km across; masts not to
// scale in height). Coverage circles use the chapter 2 numbers: MW ground wave a few hundred km (farther over
// sea water, which conducts well: ITU-R P.368), FM about 60 km from a 150 m mast (4.12(√h1 + √h2)), and a
// community station's 100 W from a 30 m mast, about 12 km (MIB community radio policy guidelines).
// Facts, with sources in history.json:
// - AIR reaches about 92% of India's area and 99.19% of its people, in 23 languages and 179 dialects
//   (Prasar Bharati figures as quoted by Wikipedia "All India Radio").
// - Vividh Bharati began 3 October 1957; Mann Ki Baat began 3 October 2014 and airs monthly.
// - Community radio: Anna FM, Chennai, 1 February 2004; policy widened to NGOs in December 2006; 481 stations
//   in 2023 (TRAI recommendations, 2023).
// - Cyclone bulletins: once a cyclonic storm forms, IMD issues bulletins every three hours and AIR broadcasts
//   them for coastal people and fishermen (IMD RSMC New Delhi, cyclone warning services).
// - December 2004 tsunami: a ham radio DXpedition led by Bharathi Prasad (VU2RBI) in Port Blair kept the
//   Andaman Islands in touch with the mainland (VOA, 5 January 2005; Dayton Hamvention 2005 award).
// - DRM digital radio on AIR medium-wave transmitters at Jalandhar, Kolkata, Nagpur, Rajkot and Tuticorin.
//   DRM30 carries roughly 6–35 kbit/s in a 9 or 10 kHz channel depending on mode (Wikipedia "Digital Radio Mondiale").
import { THREE, M } from '../kit.js';
import { board, panelBg, text, COL, fitNarrow, narrowView, reelBoards, makeMast, makeTransistorRadio, box, sphere, tube, horizonKm } from '../radio.js';

const KM = 40;                      // km per unit
const TX = { mw: [-1.6, 0, 0.5], fm: [-5.2, 0, -1.0], cr: [-8.6, 0, 1.6], hamA: [-4.0, 0, -3.2], hamB: [13.2, 0, -2.0] };
const R = { mw: 320 / KM, fm: horizonKm(150, 10) / KM, cr: 12 / KM };
const STORIES = {
  reach: { name: 'Akashvani\'s reach', big: '99.19%', sub: 'of Indians within reach of AIR', lines: ['About 92% of the land area, over 400 stations', '23 languages and 179 dialects', 'Vividh Bharati film songs since 1957', 'Mann Ki Baat, every month since 2014', 'Ball-by-ball cricket commentary for generations'] },
  cyclone: { name: 'Cyclone warnings', big: 'every 3 h', sub: 'IMD cyclone bulletins, broadcast on AIR', lines: ['Once a cyclonic storm forms, bulletins every three hours', 'Four-stage warnings for coast and fishermen', 'Medium wave reaches boats far beyond FM range', 'A battery radio works when power and phones fail'] },
  ham: { name: 'Ham radio in disasters', big: '2004', sub: 'Tsunami: hams keep the Andamans in touch', lines: ['A DXpedition led by Bharathi Prasad, VU2RBI, was on air in Port Blair', 'When the waves hit, they relayed messages to the mainland', 'Shortwave bounces off the F layer: no towers needed', 'Hams also helped after the Latur and Gujarat earthquakes'] },
  community: { name: 'Community radio', big: '481', sub: 'community stations on air in 2023', lines: ['First: Anna FM, Anna University, Chennai, 2004', '2006 policy lets NGOs and farm universities run them', '100 watts from a 30 m mast: about 12 km', 'Local news, farming tips and songs in the local tongue'] },
  drm: { name: 'Digital radio (DRM)', big: '6–35 kbit/s', sub: 'digital sound in the same AM channel', lines: ['Digital Radio Mondiale fits in a 9 kHz channel', 'Near-FM sound on medium wave, with text on screen', 'AIR runs DRM on big MW transmitters, e.g. Nagpur, Kolkata', 'You need a DRM receiver to hear it'] },
};

export default {
  id: 'india',
  short: 'Radio in India',
  title: 'Radio in India',
  subtitle: 'From Akashvani in every home to cyclone warnings at sea, ham operators and village stations.',
  view: { pos: [3.0, 13.0, 17.5], target: [1.2, 0.6, -0.4] },
  learn: `<p>In India, radio reaches places nothing else does. <b>All India Radio</b>, called <b>Akashvani</b> ("voice from the sky"), is heard by about <b>99% of the population</b> across some 92% of the country, in 23 languages. Generations grew up on <b>Vividh Bharati</b>'s film songs, the news at fixed hours, and <b>cricket commentary</b> that made you see every ball. Since 2014 the Prime Minister's monthly <b>Mann Ki Baat</b> has gone out on the same network.</p>
    <p>Radio also saves lives. When a <b>cyclone</b> forms over the Bay of Bengal or the Arabian Sea, the India Meteorological Department issues bulletins every three hours and AIR broadcasts them. Medium wave travels hundreds of kilometres over the sea, far beyond FM, and a battery radio keeps working when power lines and phone towers are down. After the <b>2004 tsunami</b>, amateur <b>ham radio</b> operators visiting Port Blair kept the Andaman Islands in touch with the mainland. Shortwave bounced off the sky, so they needed no towers at all.</p>
    <p><b>Community radio</b> stations, run by colleges, NGOs and farm universities, broadcast with just 100 watts to villages about 12 km around. And <b>DRM</b> (Digital Radio Mondiale) puts digital, near-FM sound into AIR's old medium-wave channels. For FM stations and how they share the band, see FMClear. For television, see TVStationClear and TVClear.</p>
    <p class="tip"><b>Try it:</b> step through the stories. In "Cyclone warnings", compare the medium-wave and FM circles and see which boats would hear the warning.</p>`,
  terms: [
    { t: 'Akashvani', d: 'All India Radio\'s on-air name since 1956, meaning "voice from the sky".' },
    { t: 'Vividh Bharati', d: 'AIR\'s popular entertainment service, on air since 1957.' },
    { t: 'Ham radio', d: 'Amateur radio: licensed hobbyists who build stations and talk across the world, and help in disasters.' },
    { t: 'Community radio', d: 'A small, low-power local station run by and for a community, not for profit.' },
    { t: 'DRM', d: 'Digital Radio Mondiale: digital broadcasting that fits into the same channels as AM radio.' },
    { t: 'Cyclone bulletin', d: 'An official warning from the India Meteorological Department about a cyclone\'s track and strength.' },
  ],
  defaults: { story: 'reach' },
  controls: [
    { key: 'story', type: 'seg', label: 'Story', options: [{ v: 'reach', label: 'Reach' }, { v: 'cyclone', label: 'Cyclone' }, { v: 'ham', label: 'Ham radio' }, { v: 'community', label: 'Community' }, { v: 'drm', label: 'Digital' }] },
  ],
  quiz: [
    { q: 'Why is medium-wave AIR so useful for cyclone warnings at sea?', options: ['It is louder than FM', 'Its ground wave travels hundreds of kilometres over sea water, far beyond FM\'s horizon', 'Boats cannot receive FM by law', 'It works only at night'], answer: 1, why: 'Medium waves hug the Earth, and sea water conducts well, so they reach boats far offshore.' },
    { q: 'How did ham operators link the Andaman Islands to the mainland after the 2004 tsunami?', options: ['Through undersea cables', 'With shortwave radio bounced off the ionosphere', 'Through mobile towers', 'With satellite TV'], answer: 1, why: 'Shortwave reflects off the F layer, so two small stations 1,200 km apart can talk with no towers in between.' },
    { q: 'About how far does a typical Indian community radio station reach?', options: ['1 km', '12 km', '300 km', 'The whole country'], answer: 1, why: 'The policy allows 100 watts from a mast about 30 m high, which covers roughly 12 km around.' },
  ],
  reel: [
    { ms: 5600, caption: 'In a cyclone, medium-wave AIR reaches boats far out at sea, beyond the reach of FM.', set: { story: 'cyclone' }, anim: {}, spin: 0.25, view: { pos: [3.0, 10.5, 15.0], target: [1.6, 0, 0.2] } },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // land and sea
    const land = box(12.5, 0.3, 11, M.matte(0x5d7a45)); land.position.set(-6.25, -0.15, 0); root.add(land);
    const beach = box(0.5, 0.31, 11, M.matte(0xd9c38b)); beach.position.set(-0.2, -0.14, 0); root.add(beach);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(15, 11), M.matte(0x2f7fb8, { roughness: 0.35 })); sea.rotation.x = -Math.PI / 2; sea.position.set(7.5, -0.05, 0); root.add(sea);
    const island = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.3, 18), M.matte(0x5d7a45)); island.position.set(13.4, -0.02, -2.0); island.scale.z = 1.8; root.add(island);
    // transmitters
    const mw = makeMast(2.6); mw.position.set(...TX.mw); root.add(mw);
    const fm = makeMast(1.8, 0x7aa2ff); fm.position.set(...TX.fm); root.add(fm);
    const cr = makeMast(0.8, 0x7be08c); cr.position.set(...TX.cr); root.add(cr);
    const city = new THREE.Group(); city.position.set(TX.fm[0] + 0.8, 0, TX.fm[2] + 0.6); root.add(city);
    for (let i = 0; i < 9; i++) { const h = 0.3 + ((i * 37) % 7) * 0.12; const b = box(0.28, h, 0.28, M.matte(0xb8b0a0)); b.position.set((i % 3) * 0.36, h / 2, Math.floor(i / 3) * 0.36); city.add(b); }
    const village = new THREE.Group(); village.position.set(TX.cr[0] + 0.5, 0, TX.cr[2] + 0.2); root.add(village);
    for (let i = 0; i < 5; i++) { const hut = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.25, 6), M.matte(0xb8864b)); hut.position.set((i % 3) * 0.35, 0.28, Math.floor(i / 3) * 0.4); const w = box(0.26, 0.16, 0.26, M.matte(0xe6d7b8)); w.position.set(hut.position.x, 0.08, hut.position.z); village.add(hut, w); }
    // a household radio, shown big-ish near the village
    const R0 = makeTransistorRadio(); R0.group.scale.setScalar(0.35); R0.group.position.set(-10.2, 0, 3.6); R0.group.rotation.y = 0.5; root.add(R0.group);
    R0.setTune(702, 'mw');
    // ham stations: a hut with a wire dipole on two poles, one on the mainland, one on the island
    const hamSt = (p) => { const g = new THREE.Group(); g.position.set(...p); const h = box(0.4, 0.3, 0.4, M.matte(0xe6d7b8)); h.position.y = 0.15; g.add(h); for (const x of [-0.6, 0.6]) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), M.matte(0x7a5b3a)); pl.position.set(x, 0.5, 0); g.add(pl); } g.add(tube([[-0.6, 1.0, 0], [0, 0.9, 0], [0.6, 1.0, 0]], 0.012, M.metal(0xd8b070), false, 10)); root.add(g); return g; };
    const hamA = hamSt(TX.hamA), hamB = hamSt(TX.hamB);
    const hamArc = tube(Array.from({ length: 21 }, (_, i) => { const u = i / 20; return [TX.hamA[0] + (TX.hamB[0] - TX.hamA[0]) * u, 1.0 + Math.sin(Math.PI * u) * 5.2, TX.hamA[2] + (TX.hamB[2] - TX.hamA[2]) * u]; }), 0.06, M.glow(0xff7a59, { transparent: true, opacity: 0.85 }), false, 60);
    root.add(hamArc);
    const layerF = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), M.ghost(0x8ef0ff, 0.08)); layerF.rotation.x = -Math.PI / 2; layerF.position.set(4.6, 6.25, -2.6); root.add(layerF);
    // boats
    const boats = [2.2, 3.6, 5.2, 7.0, 9.0].map((x, i) => { const g = new THREE.Group(); const hull = box(0.5, 0.14, 0.2, M.plastic(0xd9534f)); hull.position.y = 0.05; g.add(hull); const mastB = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 6), M.matte(0x7a5b3a)); mastB.position.set(0, 0.3, 0); g.add(mastB); const bulb = sphere(0.07, M.glow(0x7be08c)); bulb.position.y = 0.5; g.add(bulb); g.bulb = bulb; g.position.set(x, 0, 1.5 - i * 0.9); root.add(g); return g; });
    // cyclone: a spiral of cloud particles, turning anticlockwise (northern hemisphere)
    const NCY = 260, cyc = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 6, 4), M.ghost(0xf2f2f2, 0.55), NCY); root.add(cyc);
    const cy0 = [9.8, 0.9, -2.4], o = new THREE.Object3D();
    // coverage rings on the ground
    const ring = (r, col) => { const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.06, r, 128), M.glow(col, { transparent: true, opacity: 0.8, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; root.add(m); const f = new THREE.Mesh(new THREE.CircleGeometry(r, 96), M.ghost(col, 0.08)); f.rotation.x = -Math.PI / 2; root.add(f); m.fill = f; return m; };
    const rMW = ring(R.mw, 0xffd166), rFM = ring(R.fm, 0x7aa2ff), rCR = ring(R.cr, 0x7be08c);
    const place = (m, p, y) => { m.position.set(p[0], y, p[2]); m.fill.position.set(p[0], y - 0.005, p[2]); };
    place(rMW, TX.mw, 0.03); place(rFM, TX.fm, 0.05); place(rCR, TX.cr, 0.07);
    // expanding wave rings from the active transmitter
    const waves = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 6, 64), M.glow(0xffffff, { transparent: true, opacity: 0.5 })); m.rotation.x = Math.PI / 2; root.add(m); return m; });
    const info = board(root, 7.6, 3.6, 1140, 540, (g, w, h, st) => drawInfo(g, w, h, st || 'reach'), [2.5, 3.4, -5.6]);
    const L = {
      mw: stage.label('AIR medium wave', [TX.mw[0], 3.0, TX.mw[2]], root, 'hot'),
      fm: stage.label('FM', [TX.fm[0], 2.2, TX.fm[2]], root),
      cr: stage.label('Community radio', [TX.cr[0], 1.2, TX.cr[2]], root),
      sea: stage.label('Bay of Bengal', [6.0, 0.1, 3.8], root),
      isl: stage.label('Andamans: really ~1,200 km away', [13.4, 0.9, -2.0], root),
      cyc: stage.label('Cyclone', [cy0[0], 2.2, cy0[2]], root),
      boats: stage.label('Fishing boats', [5.4, 0.9, 1.2], root),
      home: stage.label('A radio at home', [-10.2, 1.1, 3.6], root),
      scale: stage.label('each grid square ≈ 40 km', [-3.5, 0.05, 5.2], root),
    };
    let t = 0, story = '';
    const inst = {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const narrow = fitNarrow(stage, [L.sea, L.scale, L.home, L.isl], -0.08); narrowView(stage, narrow);
        reelBoards([[info, [1.8, 6.6, -5.6], 0.95]], narrow);
        if (s.story !== story) { story = s.story; info.redraw(story); }
        const st = s.story;
        rMW.visible = rMW.fill.visible = st === 'reach' || st === 'cyclone' || st === 'drm';
        rFM.visible = rFM.fill.visible = st === 'reach' || st === 'cyclone';
        rCR.visible = rCR.fill.visible = st === 'reach' || st === 'community';
        hamArc.visible = layerF.visible = st === 'ham';
        hamA.visible = hamB.visible = true;
        cyc.visible = L.cyc.visible = st === 'cyclone';
        L.boats.visible = st === 'cyclone' && !narrow;
        // cyclone spiral
        if (cyc.visible) {
          for (let i = 0; i < NCY; i++) { const k = i / NCY, arm = i % 3, rr = 0.25 + k * 3.0, a = k * 9 + arm * (Math.PI * 2 / 3) + t * (1.4 - k * 0.6); o.position.set(cy0[0] + Math.cos(a) * rr, cy0[1] + Math.sin(i) * 0.12, cy0[2] - Math.sin(a) * rr); o.scale.setScalar(0.8 + (1 - k) * 0.8); o.updateMatrix(); cyc.setMatrixAt(i, o.matrix); }
          cyc.instanceMatrix.needsUpdate = true;
        }
        // boats bob; their lamps show whether they can hear MW (and FM)
        boats.forEach((b, i) => {
          b.position.y = 0.03 * Math.sin(t * 2 + i); b.rotation.z = 0.08 * Math.sin(t * 1.6 + i);
          const dMW = Math.hypot(b.position.x - TX.mw[0], b.position.z - TX.mw[2]);
          b.bulb.visible = st === 'cyclone'; b.bulb.material.color.setHex(dMW < R.mw ? 0x7be08c : 0xff5a5a);
        });
        // wave rings from the active transmitter
        const src = st === 'community' ? [TX.cr, R.cr * 2.2] : st === 'ham' ? [TX.hamA, 1.6] : [TX.mw, R.mw];
        waves.forEach((m, i) => { const q = (t * 0.35 + i / 3) % 1; m.position.set(src[0][0], 0.25, src[0][2]); m.scale.setScalar(0.2 + q * src[1]); m.material.opacity = 0.55 * (1 - q); });
        L.fm.visible = st === 'reach' || st === 'cyclone';
        L.cr.visible = st === 'reach' || st === 'community';
        L.isl.visible = (st === 'ham' || st === 'reach') && !narrow;
        mw.lamp.material.color.setHex(Math.sin(t * 4) > 0 ? 0xff3b3b : 0x551111);
      },
      readout(s) {
        const st = s.story;
        if (st === 'reach') return `<div class="big">Akashvani: 99.19% of people</div>
          <div class="row"><span>Area covered</span><b>about 92%</b></div>
          <div class="row"><span>Languages / dialects</span><b>23 / 179</b></div>
          <div class="row"><span>MW ground wave (high power)</span><b>≈ ${Math.round(R.mw * KM)} km</b></div>
          <div class="row"><span>FM from a 150 m mast</span><b>≈ ${Math.round(R.fm * KM)} km</b></div>
          <small>Coverage figures as reported by Prasar Bharati.</small>`;
        if (st === 'cyclone') { const n = boats.filter((b) => Math.hypot(b.position.x - TX.mw[0], b.position.z - TX.mw[2]) < R.mw).length, nf = boats.filter((b) => Math.hypot(b.position.x - TX.fm[0], b.position.z - TX.fm[2]) < R.fm).length;
          return `<div class="big">Cyclone warning on air</div>
          <div class="row"><span>Boats in MW range</span><b class="ok">${n} of ${boats.length}</b></div>
          <div class="row"><span>Boats in FM range</span><b class="no">${nf} of ${boats.length}</b></div>
          <div class="row"><span>IMD bulletins</span><b>every 3 hours</b></div>
          <div class="ok">A battery radio works when power and phones are down.</div>`; }
        if (st === 'ham') return `<div class="big">Port Blair to the mainland</div>
          <div class="row"><span>Distance</span><b>about 1,200 km</b></div>
          <div class="row"><span>Path</span><b>shortwave off the F layer</b></div>
          <div class="row"><span>Towers or cables needed</span><b>none</b></div>
          <small>December 2004: a DXpedition led by Bharathi Prasad, VU2RBI, relayed messages after the tsunami.</small>`;
        if (st === 'community') return `<div class="big">About ${Math.round(R.cr * KM)} km of reach</div>
          <div class="row"><span>Transmitter power</span><b>100 W</b></div>
          <div class="row"><span>Antenna height</span><b>up to 30 m</b></div>
          <div class="row"><span>Stations on air (2023)</span><b>481</b></div>
          <div class="row"><span>First station</span><b>Anna FM, Chennai, 2004</b></div>`;
        return `<div class="big">DRM: digital sound on MW</div>
          <div class="row"><span>Channel width</span><b>same 9 kHz as AM</b></div>
          <div class="row"><span>Data rate</span><b>about 6 to 35 kbit/s</b></div>
          <div class="row"><span>Reach</span><b>like the AM it replaces</b></div>
          <small>AIR broadcasts DRM from medium-wave sites such as Jalandhar, Kolkata, Nagpur, Rajkot and Tuticorin.</small>`;
      },
    };
    return inst;
  },
};

function drawInfo(g, w, h, key) {
  const S = STORIES[key];
  panelBg(g, w, h);
  g.fillStyle = COL.audio; g.fillRect(0, 0, 10, h);
  text(g, S.name, 40, 66, { font: 'bold 44px sans-serif', col: '#e8eef8' });
  text(g, S.big, 40, 170, { font: 'bold 92px sans-serif', col: COL.audio });
  text(g, S.sub, 40, 214, { font: '28px sans-serif', col: 'rgba(255,255,255,.75)' });
  S.lines.forEach((l, i) => { g.fillStyle = COL.rf; g.beginPath(); g.arc(50, 280 + i * 52, 7, 0, Math.PI * 2); g.fill(); text(g, l, 72, 290 + i * 52, { font: '27px sans-serif', col: 'rgba(255,255,255,.88)' }); });
}
