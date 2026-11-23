/* Automated regression tests. Run: node tests/smoke.js
   Covers the defects found in the strict review (combat rules, relic hooks,
   state transitions, save/load, status cards and a full-run stress pass). */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = {};
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
// make asynchronous combat steps resolve deterministically
global.setTimeout = fn => { Promise.resolve().then(fn); return 0; };
require(path.join(ROOT, 'js', 'data.js'));
require(path.join(ROOT, 'js', 'ja.js'));
require(path.join(ROOT, 'js', 'engine.js'));
const Game = window.Game;
const D = window.GAME_DATA;

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.error('  FAIL  ' + name + '\n        ' + e.message); }
}
const fresh = () => { const g = new Game(); g.newRun(); return g; };
const handCard = (g, id) => g.hand.find(c => c.id === id);

console.log('\n== 基本状態 ==');
test('初期デッキとステータス', () => {
  const g = fresh();
  assert.equal(g.deck.length, 10);
  assert.equal(g.deck.filter(c => c.id === 'strike').length, 5);
  assert.equal(g.deck.filter(c => c.id === 'defend').length, 4);
  assert.equal(g.deck.filter(c => c.id === 'bash').length, 1);
  assert.equal(g.hp, 80); assert.equal(g.gold, 99);
  assert.deepEqual(g.relics, ['burningblood']);
  assert.ok(g.player && g.player.hp === 80, 'player must exist outside combat');
});

console.log('\n== ダメージ計算 ==');
test('Strike は6ダメージ、力量+3で9', () => {
  const g = fresh(); g.startCombat(['louse'], 'normal');
  g.player.statuses.strength = 3;
  const e = g.enemies[0], before = e.hp;
  g.playCard(handCard(g, 'strike').uid, 0);
  assert.equal(before - e.hp, 9);
});
test('脆弱は攻撃ダメージを1.5倍', () => {
  const g = fresh(); g.startCombat(['louse'], 'normal');
  const e = g.enemies[0]; e.statuses.vulnerable = 2;
  const before = e.hp;
  g.playCard(handCard(g, 'strike').uid, 0);
  assert.equal(before - e.hp, 9);
});
test('Body Slam は力量の影響を受けない', () => {
  const g = fresh(); g.startCombat(['louse'], 'normal');
  g.player.block = 10; g.player.statuses.strength = 3;
  const c = g.makeCard('bodyslam'); g.hand.push(c);
  const e = g.enemies[0], before = e.hp;
  g.playCard(c.uid, 0);
  assert.equal(before - e.hp, 10);
});

console.log('\n== 遺物フック ==');
test('Phonograph は戦闘中1回だけ脆弱を付与', () => {
  const g = fresh(); g.startCombat(['louse'], 'normal');
  g.relics.push('phonograph');
  const e = g.enemies[0];
  const a = g.makeCard('strike'); g.hand.push(a); g.energy = 3;
  g.playCard(a.uid, 0);
  assert.equal(e.statuses.vulnerable, 2);
  const b = g.makeCard('strike'); g.hand.push(b); g.energy = 3;
  g.playCard(b.uid, 0);
  assert.equal(e.statuses.vulnerable, 2, 'should not stack on second attack');
  g.endTurn();
  assert.equal(g.flags._phono, true, 'flag must persist across turns');
});
test('Shuriken / Kunai が発火する', () => {
  const g = fresh(); g.startCombat(['cultist'], 'normal');
  g.relics.push('shuriken', 'kunai');
  for (let i = 0; i < 3; i++) {
    const a = g.makeCard('strike'); g.hand.push(a); g.energy = 3;
    g.playCard(a.uid, 0);
  }
  assert.equal(g.player.statuses.strength, 1);
});
test('Red Skull は低HPで正確に+3力量', () => {
  const g = fresh(); g.hp = 30; g.relics.push('redskull');
  g.startCombat(['louse'], 'normal');
  assert.equal(g.player.statuses.strength, 3);
});
test('Pen Nib は10回目の攻撃を倍化', () => {
  const g = fresh(); g.startCombat(['cultist'], 'normal');
  g.relics.push('pennib'); g.flags._attackCount = 9;
  const c = g.makeCard('strike'); g.hand.push(c); g.energy = 3;
  const e = g.enemies[0], before = e.hp;
  g.playCard(c.uid, 0);
  assert.equal(before - e.hp, 12);
});

console.log('\n== カード固有ルール ==');
test('Snecko Eye でも X コストは X のまま', () => {
  const g = fresh(); g.relics.push('sneckoeye');
  g.startCombat(['louse'], 'normal');
  const w = g.makeCard('whirlwind'); g.hand.push(w);
  assert.equal(g.cardCost(w), 'X');
});
test('Battle Trance のドロー禁止は次戦闘に持ち越さない', () => {
  const g = fresh(); g.startCombat(['louse'], 'normal');
  const bt = g.makeCard('battletrance'); g.hand.push(bt);
  g.playCard(bt.uid);
  assert.equal(g.noDrawThisTurn, true);
  g.startCombat(['louse'], 'normal');
  assert.equal(g.noDrawThisTurn, false);
  assert.ok(g.hand.length > 0, 'new combat must draw cards');
});
test('ステータスカード: Burn は手札に残りダメージ、Dazed は消耗、Hex は敵に力量', () => {
  const g = fresh(); g.startCombat(['louse'], 'normal');
  // neutralise the enemy so its attack cannot change HP during this test
  g.enemies.forEach(e => { e.currentMove = { intent:'buff', name:'test', act:()=>{} }; });
  g.hand = [g.makeCard('burn'), g.makeCard('dazed'), g.makeCard('hex')];
  const hp = g.hp;
  g.endTurn();
  assert.ok(g.hand.some(c => c.id === 'burn'), 'burn stays in hand');
  assert.ok(g.hand.some(c => c.id === 'hex'), 'hex stays in hand');
  assert.ok(g.exhaustPile.some(c => c.id === 'dazed'), 'dazed is exhausted');
  assert.equal(g.hp, hp - 2, 'burn deals 2 damage');
  assert.equal(g.enemies[0].statuses.strength, 1, 'hex grants enemy strength');
});

console.log('\n== 敵・状態遷移 ==');
test('ミニオン召喚が機能し tier=minion', () => {
  const g = fresh(); g.startCombat(['gremlinleader'], 'elite');
  assert.equal(g.enemies.length, 1);
  g.spawnMinions('gremlin', 2);
  assert.equal(g.enemies.length, 3);
  assert.equal(g.enemies[1].tier, 'minion');
});
test('Feed はミニオンから最大HPを得ない', () => {
  const g = fresh(); g.startCombat(['louse'], 'normal');
  g.spawnMinions('gremlin', 1);
  const minion = g.enemies[1]; minion.hp = 1;
  const feed = g.makeCard('feed'); g.hand.push(feed); g.energy = 3;
  const max = g.player.maxHp;
  g.playCard(feed.uid, minion.slot);
  assert.equal(g.player.maxHp, max);
});
test('敵ターンの毒で全滅すれば勝利へ遷移', () => {
  const g = fresh(); g.startCombat(['louse'], 'normal');
  const e = g.enemies[0]; e.hp = 1; e.statuses.poison = 5;
  g.endTurn();
  assert.equal(g.screen, 'reward', 'screen must leave combat');
});
test('野営は両遺物所持でも立ち去れる', () => {
  const g = fresh(); g.relics.push('coffeedripper', 'fusionhammer');
  g.openRest(); g.restChoice('rest'); g.restChoice('smith');
  assert.equal(g.screen, 'rest', 'blocked choices keep you here');
  g.restChoice('leave');
  assert.equal(g.screen, 'map');
});
test('イベントで死亡したら敗北へ', () => {
  const g = fresh(); g.hp = 5; g.player.hp = 5;
  g.event = D.EVENTS.wheeloffate; g.screen = 'event';
  // force the bad branch deterministically
  const rnd = Math.random; Math.random = () => 0.99;
  g.eventChoice(0);
  Math.random = rnd;
  assert.equal(g.hp, 0);
  assert.equal(g.screen, 'defeat');
});
test('輝く光の除去はデッキ選択へ遷移する', () => {
  const g = fresh(); const before = g.deck.length;
  g.event = D.EVENTS.shininglight; g.screen = 'event';
  g.eventChoice(0);
  assert.equal(g.screen, 'deckSelect');
  g.selectDeckCard(g.deck[0].uid);
  assert.equal(g.deck.length, before - 1);
  assert.equal(g.screen, 'event');
  g.finishEvent();
  assert.equal(g.screen, 'map');
});

console.log('\n== セーブ / ロード ==');
test('戦闘中・報酬画面ではセーブできない', () => {
  const g = fresh(); g.startCombat(['louse'], 'normal');
  assert.equal(g.save(), false);
  g.endCombat(true);
  assert.equal(g.save(), false);
});
test('ロードでUIDカウンタが復元される', () => {
  const g = fresh(); g.deck[0].uid = 9999;
  assert.equal(g.save(), true);
  const g2 = new Game();
  assert.equal(g2.load(), true);
  const c = g2.makeCard('strike');
  assert.ok(c.uid > 9999, 'new uid must not collide with saved cards');
  assert.ok(g2.player && g2.player.hp === g2.hp);
});
test('破損セーブは安全に破棄される', () => {
  store.sts_save = '{broken';
  const g = new Game();
  assert.equal(g.load(), false);
  assert.equal(g.hasSave(), false);
});

console.log('\n== 全ラン応力テスト ==');
test('3ランが例外なく完了する', () => {
  // run timers synchronously so enemy turns resolve inside the loop
  const prevTimer = global.setTimeout;
  global.setTimeout = fn => { fn(); return 0; };
  const g2 = fresh();
  for (let run = 0; run < 3; run++) {
    g2.newRun();
    let steps = 0;
    while (g2.screen !== 'victory' && g2.screen !== 'defeat' && steps++ < 1500) {
      switch (g2.screen) {
        case 'map': { const ns = g2.getReachableNodes(); if (ns.length) g2.enterNode(ns[0].id); break; }
        case 'combat': {
          const p = g2.hand.filter(c => g2.canPlay(c));
          if (p.length) { const a = g2.enemies.find(e => !e.dead); g2.playCard(p[0].uid, a && a.slot); }
          else g2.endTurn();
          break;
        }
        case 'reward': g2.skipReward(); break;
        case 'rest': g2.restChoice('leave'); break;
        case 'shop': g2.finishNode(); break;
        case 'treasure': if (!g2.treasure.taken) g2.takeTreasure(); else g2.finishNode(); break;
        case 'event': if (!g2.eventResult) g2.eventChoice(0); else g2.finishEvent(); break;
        case 'deckSelect': if (g2.deck.length) g2.selectDeckCard(g2.deck[0].uid); break;
        default: throw new Error('unknown screen: ' + g2.screen);
      }
    }
    assert.ok(['victory', 'defeat'].includes(g2.screen), 'run must terminate');
  }
  global.setTimeout = prevTimer;
});

console.log('\n結果: ' + pass + ' PASS / ' + fail + ' FAIL\n');
process.exitCode = fail ? 1 : 0;
