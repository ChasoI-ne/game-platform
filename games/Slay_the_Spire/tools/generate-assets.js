/* Generates dedicated SVG image assets + item definition JSON.
   Usage: node tools/generate-assets.js
   Output:
     sprites/items/<id>.json          item definitions
     sprites/items/textures/<id>.svg  unique vector artwork per item
     sprites/ui/<name>.svg            UI icon artwork
   All artwork is original generated vector geometry. No emoji is used. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = global;
require(path.join(ROOT, 'js', 'data.js'));
require(path.join(ROOT, 'js', 'ja.js'));
const D = global.GAME_DATA;

function ensure(dir) { fs.mkdirSync(dir, { recursive: true }); }
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
function write(file, content) { fs.writeFileSync(path.join(ROOT, file), content, 'utf8'); }

// ---- symbol library: each entry is SVG markup using placeholder %C for color ----
const S = {
  sword: '<path d="M32 6 L38 24 L35 42 L29 42 L26 24Z" fill="%C"/><path d="M20 42 L44 42 L44 47 L20 47Z" fill="%C"/><rect x="29" y="47" width="6" height="12" fill="%C"/>',
  shield: '<path d="M32 8 L52 16 L50 38 Q46 51 32 57 Q18 51 14 38 L12 16Z" fill="%C"/><path d="M32 14 L44 20 L42 36 Q39 44 32 48 Q25 44 22 36 L20 20Z" fill="#0d0d12" opacity=".55"/>',
  hammer: '<rect x="28" y="22" width="8" height="36" fill="%C"/><rect x="14" y="12" width="36" height="13" rx="2" fill="%C"/>',
  axe: '<rect x="28" y="20" width="6" height="40" fill="%C"/><path d="M34 12 Q52 16 50 34 L34 30Z" fill="%C"/>',
  fist: '<path d="M18 30 Q18 20 26 20 L26 16 Q32 12 38 16 L38 20 Q48 20 48 30 L48 42 Q48 50 40 50 L26 50 Q18 50 18 42Z" fill="%C"/><path d="M24 28 h20 M24 36 h20" stroke="#0d0d12" stroke-width="2" opacity=".5"/>',
  flame: '<path d="M32 6 Q40 22 46 30 Q54 42 44 52 Q38 58 32 58 Q20 58 18 46 Q16 36 26 26 Q26 36 32 38 Q30 22 32 6Z" fill="%C"/>',
  lightning: '<path d="M36 6 L18 36 L30 36 L26 58 L48 26 L35 26Z" fill="%C"/>',
  skull: '<circle cx="32" cy="26" r="17" fill="%C"/><rect x="22" y="38" width="20" height="16" rx="3" fill="%C"/><circle cx="26" cy="25" r="4" fill="#0d0d12"/><circle cx="38" cy="25" r="4" fill="#0d0d12"/>',
  eye: '<path d="M6 32 Q32 10 58 32 Q32 54 6 32Z" fill="%C"/><circle cx="32" cy="32" r="9" fill="#0d0d12"/><circle cx="32" cy="32" r="4" fill="%C"/>',
  spiral: '<path d="M32 32 m0 -4 a4 4 0 1 1 -4 4 a9 9 0 1 1 9 -9 a15 15 0 1 1 -15 15 a22 22 0 1 1 22 -22" fill="none" stroke="%C" stroke-width="5"/>',
  star: '<path d="M32 6 L39 25 L58 25 L43 37 L49 56 L32 44 L15 56 L21 37 L6 25 L25 25Z" fill="%C"/>',
  wave: '<path d="M6 26 Q16 14 26 26 T46 26 T58 26 M6 40 Q16 28 26 40 T46 40 T58 40" fill="none" stroke="%C" stroke-width="5"/>',
  dagger: '<path d="M32 6 L37 30 L32 42 L27 30Z" fill="%C"/><path d="M22 42 L42 42 L42 46 L22 46Z" fill="%C"/><rect x="29" y="46" width="6" height="12" fill="%C"/>',
  whirl: '<path d="M32 10 Q52 10 52 24 Q52 34 40 34 Q30 34 30 42 Q30 50 40 50 Q50 50 50 44" fill="none" stroke="%C" stroke-width="5"/><path d="M32 54 Q12 54 12 40 Q12 30 24 30" fill="none" stroke="%C" stroke-width="5"/>',
  blood: '<path d="M32 6 Q44 26 44 38 Q44 52 32 56 Q20 52 20 38 Q20 26 32 6Z" fill="%C"/>',
  gears: '<circle cx="32" cy="32" r="18" fill="none" stroke="%C" stroke-width="6"/><circle cx="32" cy="32" r="6" fill="%C"/><path d="M32 8 v8 M32 48 v8 M8 32 h8 M48 32 h8" stroke="%C" stroke-width="5"/>',
  crown: '<path d="M10 46 L14 18 L26 30 L32 12 L38 30 L50 18 L54 46Z" fill="%C"/><rect x="10" y="48" width="44" height="8" fill="%C"/>',
  moon: '<path d="M40 8 A24 24 0 1 0 56 42 A20 20 0 1 1 40 8Z" fill="%C"/>',
  arrow: '<path d="M8 32 L44 32 M44 32 L32 20 M44 32 L32 44" fill="none" stroke="%C" stroke-width="6"/><path d="M48 18 L60 32 L48 46" fill="none" stroke="%C" stroke-width="5"/>',
  heart: '<path d="M32 56 Q6 38 6 24 Q6 12 18 12 Q26 12 32 20 Q38 12 46 12 Q58 12 58 24 Q58 38 32 56Z" fill="%C"/>',
  cloud: '<path d="M16 44 Q6 44 6 34 Q6 24 18 24 Q20 12 32 12 Q46 12 48 26 Q58 26 58 36 Q58 44 48 44Z" fill="%C"/>',
  chain: '<path d="M20 20 a10 10 0 1 1 14 0 M30 44 a10 10 0 1 1 -14 0 M22 20 L42 44" fill="none" stroke="%C" stroke-width="6"/>',
  rune: '<path d="M20 10 L44 10 L44 24 L20 24Z M20 40 L44 40 L44 54 L20 54Z M20 24 L44 40" fill="none" stroke="%C" stroke-width="5"/>',
  gem: '<path d="M32 6 L54 24 L32 58 L10 24Z" fill="%C"/><path d="M32 6 L32 58 M10 24 L54 24" stroke="#0d0d12" stroke-width="2" opacity=".5"/>',
  book: '<path d="M8 14 Q32 6 32 14 Q32 6 56 14 L56 52 Q32 44 32 52 Q32 44 8 52Z" fill="%C"/>',
  coin: '<circle cx="32" cy="32" r="22" fill="%C"/><circle cx="32" cy="32" r="15" fill="none" stroke="#0d0d12" stroke-width="3" opacity=".5"/>',
  chest: '<rect x="10" y="26" width="44" height="28" rx="3" fill="%C"/><path d="M10 26 Q32 8 54 26Z" fill="%C"/><rect x="29" y="30" width="6" height="12" fill="#0d0d12" opacity=".7"/>',
  campfire: '<path d="M14 54 L50 54 M18 48 L46 48" stroke="%C" stroke-width="6"/><path d="M32 10 Q42 28 40 40 Q44 52 32 54 Q20 52 24 40 Q22 28 32 10Z" fill="%C"/>',
  merchant: '<path d="M8 26 L56 26 L50 54 L14 54Z" fill="%C"/><path d="M14 26 Q32 8 50 26" fill="none" stroke="%C" stroke-width="6"/>',
  question: '<path d="M20 22 Q20 10 32 10 Q44 10 44 22 Q44 30 34 34 L34 42 L28 42 L28 32 Q36 28 36 22 Q36 16 32 16 Q26 16 26 22Z" fill="%C"/><circle cx="31" cy="50" r="4" fill="%C"/>',
  dragon: '<path d="M32 8 L44 20 L40 30 L54 26 L46 42 L34 48 L32 58 L28 48 L16 42 L10 26 L24 30 L20 20Z" fill="%C"/>',
  potion: '<path d="M26 8 L38 8 L38 22 Q52 30 52 44 Q52 56 32 56 Q12 56 12 44 Q12 30 26 22Z" fill="%C"/><rect x="26" y="4" width="12" height="6" fill="#c9a227"/>',
  book2: '<rect x="10" y="12" width="44" height="40" rx="4" fill="%C"/><path d="M18 22 h28 M18 32 h28 M18 42 h18" stroke="#0d0d12" stroke-width="3" opacity=".5"/>',
  scroll: '<path d="M14 10 h36 v44 h-36Z" fill="%C"/><path d="M20 20 h24 M20 30 h24 M20 40 h16" stroke="#0d0d12" stroke-width="3" opacity=".5"/>',
};

// curated unique symbol per item id
const CARD_SYM = {
  strike:'sword', defend:'shield', bash:'hammer', anger:'fist', armaments:'hammer', barbarian:'axe',
  bodyslam:'fist', clothesline:'fist', flex:'fist', heavyblade:'sword', ironwave:'wave', pommel:'hammer',
  shrugitoff:'shield', thunderclap:'lightning', twinstrike:'dagger', inferno:'flame', battletrance:'spiral',
  dropkick:'arrow', uppercut:'fist', carnage:'axe', disarm:'chain', inflame:'flame', seversoul:'skull',
  whirlwind:'whirl', secondwind:'cloud', seeingred:'eye', impervious:'shield', shockwave:'lightning',
  bludgeon:'hammer', demonform:'dragon', limitbreak:'star', reaper:'skull', offering:'blood', barricade:'shield',
  juggernaut:'gears', feed:'heart', dazed:'spiral', burn:'flame', hex:'eye', wound:'blood',
};
const RELIC_SYM = {
  burningblood:'blood', vajra:'gem', anchor:'chain', bagofprep:'scroll', orichalcum:'shield', lantern:'moon',
  redskull:'skull', phonograph:'cloud', pennib:'rune', oddmushroom:'spiral', sneckoeye:'eye',
  coffeedripper:'potion', fusionhammer:'hammer', sozu:'potion', ectoplasm:'cloud', threadneedle:'rune',
  bronzescales:'dragon', shuriken:'star', kunai:'dagger', meatonthebone:'heart', girya:'hammer',
};
const TYPE_COLOR = { attack:'#b23b2e', skill:'#356a9c', power:'#7245a3', status:'#6a6a6a' };
const RELIC_COLOR = { starter:'#a8322a', common:'#b08a2a', uncommon:'#4a8a6a', rare:'#6a5aa8', boss:'#a86a2a' };

function runeRow(id, color) {
  const h = hash(id);
  let out = '';
  for (let i = 0; i < 5; i++) {
    const bit = (h >> (i * 5)) & 3;
    const x = 12 + i * 10;
    if (bit === 0) out += `<circle cx="${x}" cy="58" r="1.8" fill="${color}"/>`;
    else if (bit === 1) out += `<rect x="${x-2}" y="56" width="4" height="4" fill="${color}"/>`;
    else if (bit === 2) out += `<path d="M${x-2} 60 L${x} 55 L${x+2} 60Z" fill="${color}"/>`;
    else out += `<path d="M${x-2} 56 h4 v4 h-4Z" fill="none" stroke="${color}" stroke-width="1.5"/>`;
  }
  return out;
}
function itemSVG(symbolKey, color, id, bg) {
  const sym = (S[symbolKey] || S.rune).replace(/%C/g, color);
  const h = hash(id);
  const hue = (h % 28) - 14;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${bg}" stop-opacity=".95"/><stop offset="1" stop-color="#0d0b0a" stop-opacity=".95"/>
  </linearGradient></defs>
  <rect x="1" y="1" width="62" height="62" rx="9" fill="url(#bg)" stroke="${color}" stroke-width="1.5"/>
  <path d="M5 14 V7 H12 M52 7 H59 V14 M59 50 V57 H52 M12 57 H5 V50" fill="none" stroke="${color}" stroke-width="1.6" opacity=".55"/>
  <g style="filter:drop-shadow(0 2px 2px rgba(0,0,0,.7))">${sym}</g>
  ${runeRow(id, color)}
</svg>`;
}

// ---- generate item textures + definitions ----
function addItem(id, def, sym, color, category, bg) {
  const tex = `sprites/items/textures/${id}.svg`;
  write(tex, itemSVG(sym, color, id, bg));
  write(`sprites/items/${id}.json`, JSON.stringify({
    id, name: def.name, texture: tex, description: def.text || def.desc || '', category
  }, null, 2));
}

ensure(path.join(ROOT, 'sprites/items/textures'));
// cards
for (const [id, c] of Object.entries(D.CARDS)) addItem(id, c, CARD_SYM[id]||'rune', TYPE_COLOR[c.type]||'#888', 'card', '#2a2118');
// status cards
for (const [id, c] of Object.entries(D.STATUS_CARDS)) addItem(id, c, CARD_SYM[id]||'rune', '#6a6a6a', 'status', '#241f1a');
// relics
for (const [id, r] of Object.entries(D.RELICS)) addItem(id, r, RELIC_SYM[id]||'gem', RELIC_COLOR[r.tier]||'#b08a2a', 'relic', '#2c2416');
// potions (bottle with unique liquid color)
for (const [id, p] of Object.entries(D.POTIONS)) {
  const tex = `sprites/items/textures/${id}.svg`;
  const bottle = `<path d="M26 6 L38 6 L38 22 Q52 30 52 44 Q52 57 32 57 Q12 57 12 44 Q12 30 26 22Z" fill="${p.color}" stroke="#0c0a08" stroke-width="2"/>
    <rect x="25" y="3" width="14" height="6" rx="2" fill="#c9a227"/>
    <path d="M20 40 Q26 34 32 40 T44 40" fill="none" stroke="#ffffff" stroke-width="2" opacity=".35"/>`;
  write(tex, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect x="1" y="1" width="62" height="62" rx="9" fill="#17130f" stroke="${p.color}" stroke-width="1.5"/>
    <path d="M5 14 V7 H12 M52 7 H59 V14 M59 50 V57 H52 M12 57 H5 V50" fill="none" stroke="${p.color}" stroke-width="1.6" opacity=".5"/>
    <g style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.8))">${bottle}</g>${runeRow(id,'#c9a227')}</svg>`);
  write(`sprites/items/${id}.json`, JSON.stringify({ id, name:p.name, texture:tex, description:p.desc, category:'potion' }, null, 2));
}

// ---- enemy portraits as dedicated SVG files ----
// Act 1 enemies use the richer inline vector art in js/ui.js, so no asset is needed.
const INLINE_ART = new Set(['cultist','jawworm','slime','louse','fungi','gremlin','nob',
  'lagavulin','sentry','hexaghost','slimeboss','guardian']);
ensure(path.join(ROOT, 'sprites/enemies'));
for (const [id, e] of Object.entries(D.ENEMIES)) {
  if (INLINE_ART.has(e.art)) continue;
  const sym = ({cultist:'rune',jawworm:'fist',acidslime:'wave',spikeslime:'spiral',louse:'spiral',fungibeast:'spiral',
    gremlin:'dragon',gremlinnob:'dragon',lagavulin:'wave',sentry:'gem',hexaghost:'eye',slimeboss:'wave',guardian:'shield',
    chosen:'eye',byrd:'arrow',centurion:'shield',gremlinleader:'dragon',bookofstabbing:'book2',bronzeautomaton:'gears',
    champ:'crown',darkling:'eye',orbwalker:'eye',maw:'skull',gianthead:'skull',nemesis:'dagger',awakenedone:'flame',
    timeeater:'gears',reptomancer:'dragon'})[id] || 'skull';
  const color = e.tier==='boss'?'#c0392b':e.tier==='elite'?'#a86a2a':'#6a8a5a';
  write(`sprites/enemies/${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <ellipse cx="32" cy="58" rx="22" ry="4" fill="#000" opacity=".5"/>
    ${S[sym].replace(/%C/g,color)}
  </svg>`);
}

// ---- UI icons ----
ensure(path.join(ROOT, 'sprites/ui'));
const UI_ICONS = {
  sword: S.sword, battle: S.sword, gem: S.gem, platedArmor: S.shield,
  heart: S.heart, coin: S.coin, map: S.scroll, energy: S.lightning, block: S.shield,
  draw: S.book2, discard: S.chest, relic: S.gem, potion: S.potion, chest: S.chest,
  campfire: S.campfire, shop: S.merchant, event: S.question,
  elite: S.skull, boss: S.dragon, treasure: S.coin, save: S.scroll, help: S.question,
  attack: S.sword, skill: S.shield, power: S.star, endturn: S.arrow, upgrade: S.hammer,
  vulnerable: S.heart, weak: S.wave, strength: S.fist, dexterity: S.arrow, frail: S.cloud,
  poison: S.flame, ritual: S.moon, artifact: S.gem, thorns: S.spiral,
};
for (const [name, sym] of Object.entries(UI_ICONS)) {
  const color = ({heart:'#cf4a3a',coin:'#c9a227',energy:'#e8c95a',block:'#5a8ac0',poison:'#3fa85a',weak:'#8a7a9a',vulnerable:'#c05a4a'})[name] || '#c9a227';
  write(`sprites/ui/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${sym.replace(/%C/g,color)}</svg>`);
}

console.log('Generated:',
  Object.keys(D.CARDS).length + Object.keys(D.STATUS_CARDS).length + Object.keys(D.RELICS).length + Object.keys(D.POTIONS).length, 'item textures +',
  Object.values(D.ENEMIES).filter(e=>!INLINE_ART.has(e.art)).length, 'enemy portraits +', Object.keys(UI_ICONS).length, 'UI icons');
