/* ============================================================
   ENGINE — game state, run/map flow, and combat logic
   ============================================================ */
(function (root) {
  'use strict';
  const D = root.GAME_DATA;

  // Intent preview table: enemyId.moveId -> { dmg, times?, label? }
  // Used only for the number shown above the enemy's intent icon.
  const INTENT = {
    'cultist.darkstrike':{dmg:6},
    'jawworm.chomp':{dmg:11}, 'jawworm.thrash':{dmg:7},
    'acidslime.corrode':{dmg:7}, 'acidslime.tackle':{dmg:10},
    'spikeslime.tackle':{dmg:10}, 'spikeslime.flameTackle':{dmg:8},
    'louse.bite':{dmg:5},
    'fungibeast.bite':{dmg:6},
    'gremlin.quickPunch':{dmg:4}, 'gremlin.punch':{dmg:7},
    'gremlinnob.rush':{dmg:14}, 'gremlinnob.skullbash':{dmg:6},
    'lagavulin.attack':{dmg:18},
    'sentry.bolt':{dmg:9}, 'sentry.bolt2':{dmg:9},
    'hexaghost.inferno':{dmg:6,times:6}, 'hexaghost.sear':{dmg:12}, 'hexaghost.tackle':{dmg:10}, 'hexaghost.divider':{dmg:0,dynamic:'halfHp'},
    'slimeboss.slam':{dmg:35},
    'guardian.slam':{dmg:32}, 'guardian.whirl':{dmg:8,times:3},
    'chosen.poke':{dmg:6}, 'chosen.zap':{dmg:14},
    'byrd.peck':{dmg:7}, 'byrd.swoop':{dmg:11},
    'centurion.slash':{dmg:12}, 'centurion.fury':{dmg:6},
    'gremlinleader.stab':{dmg:10},
    'bookofstabbing.stab':{dmg:9}, 'bookofstabbing.multi':{dmg:6,dynamic:'cards'},
    'bronzeautomaton.hyperbeam':{dmg:45}, 'bronzeautomaton.whirl':{dmg:7,times:5},
    'champ.facebreaker':{dmg:20}, 'champ.execute':{dmg:0,dynamic:'champExecute'},
    'darkling.chomp':{dmg:9},
    'orbwalker.laser':{dmg:16},
    'maw.chomp':{dmg:18},
    'gianthead.smash':{dmg:5,dynamic:'giantHead'},
    'nemesis.scythe':{dmg:10,times:2}, 'nemesis.attack':{dmg:15},
    'awakenedone.release':{dmg:8,times:3}, 'awakenedone.slash':{dmg:22},
    'timeeater.reverberate':{dmg:8}, 'timeeater.headslam':{dmg:26},
    'reptomancer.stab':{dmg:10}, 'reptomancer.venom':{dmg:8},
  };

  let UID = 1;
  const rnd = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const shuffle = (arr)=>{ for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];} return arr; };

  function Game() {
    this.ui = null;
    this.screen = 'title';
    this._busy = false;
    this._turnToken = 0;
  }
  const P = Game.prototype;

  P.refresh = function(){ if(this.ui && this.ui.render) this.ui.render(); };
  P.log = function(msg){ this.logs = this.logs||[]; this.logs.push(msg); if(this.logs.length>8) this.logs.shift(); };
  P.uid = function(){ return UID++; };
  P.makeCard = function(id, upgraded){
    const def = D.CARDS[id] || D.STATUS_CARDS[id];
    if(!def) throw new Error('不明なカードID: '+id);
    // `type` is also stored on the instance because relic hooks receive card instances.
    return { uid:this.uid(), id, type:def.type, upgraded:!!upgraded, costOverride:null };
  };
  P.cardDef = function(c){
    const def = D.CARDS[c.id] || D.STATUS_CARDS[c.id];
    if(!def) throw new Error('不明なカードID: '+c.id);
    return def;
  };
  P.cardCost = function(c){
    if(c.costOverride!==null && c.costOverride!==undefined) return c.costOverride;
    return this.cardDef(c).cost;
  };
  P.cardText = function(c){ const d=this.cardDef(c); return c.upgraded?d.textUp:d.text; };
  P.cardName = function(c){ const d=this.cardDef(c); return d.name + (c.upgraded?'+':''); };

  // ---------------------------------------------------------------
  // RUN MANAGEMENT
  // ---------------------------------------------------------------
  P.newRun = function(){
    this._busy = false;
    this._combatEnded = false;
    this._turnToken++;
    this.noDrawThisTurn = false;
    this._lastXCost = 0;
    this._returnScreen = null;
    this.act = 1;
    this.maxHp = 80; this.hp = 80; this.gold = 99;
    // player exists outside combat too: campfires, events, relics and potions use it
    this.player = this.makePlayer();
    this.deck = [];
    for(let i=0;i<5;i++) this.deck.push(this.makeCard('strike'));
    for(let i=0;i<4;i++) this.deck.push(this.makeCard('defend'));
    this.deck.push(this.makeCard('bash'));
    this.relics = ['burningblood'];
    this.potions = [null,null,null];
    this.logs = [];
    this.flags = {};
    this.removeCardMode = false;
    this.smithMode = false;
    this.eventResult = null;
    this.reward = null;
    this.treasure = null;
    this.event = null;
    this.shop = null;
    this.startAct(1);
  };

  P.makePlayer = function(){
    return { isPlayer:true, hp:this.hp, maxHp:this.maxHp, block:0, statuses:{}, powers:{} };
  };
  P.hasRelic = function(id){ return this.relics.indexOf(id)>=0; };
  P.callRelics = function(hook){ if(!hook) return; const args=[this].concat([].slice.call(arguments,1));
    for(const r of this.relics){ const rel=D.RELICS[r]; if(rel && rel[hook]) rel[hook].apply(null,args); } };
  P.energyBonus = function(){ let b=0; for(const r of this.relics){ const rel=D.RELICS[r]; if(rel&&rel.energyBonus) b+=rel.energyBonus; } return b; };

  P.startAct = function(act){
    this.act = act;
    this.currentRow = -1;
    this.generateMap(act);
    this.screen = 'map';
    this.log('第'+act+'幕 — '+D.ACTS[act].name);
    this.refresh();
  };

  P.generateMap = function(act){
    const rows = [];
    const ROW = 15;
    for(let r=0;r<ROW;r++){
      let count;
      if(r===0) count=3;
      else if(r===ROW-1) count=1;               // boss
      else count = rnd(2,4);
      const nodes=[];
      for(let c=0;c<count;c++){
        nodes.push({ id:'n'+r+'_'+c, row:r, col:c, type:this.pickNodeType(r,ROW,act), visited:false, reachable:r===0, next:[] });
      }
      rows.push(nodes);
    }
    // connect rows
    for(let r=0;r<ROW-1;r++){
      const A=rows[r], B=rows[r+1];
      A.forEach((a,ai)=>{
        const pos = A.length===1?0.5:ai/(A.length-1);
        let bi = Math.round(pos*(B.length-1));
        bi = clamp(bi,0,B.length-1);
        a.next.push(B[bi].id);
        if(Math.random()<0.55 && bi>0) a.next.push(B[bi-1].id);
        if(Math.random()<0.55 && bi<B.length-1) a.next.push(B[bi+1].id);
        a.next = [...new Set(a.next)];
      });
      // ensure every node in B has an incoming edge
      B.forEach((bn,bi)=>{
        const has=A.some(a=>a.next.indexOf(bn.id)>=0);
        if(!has){
          const pos=B.length===1?0.5:bi/(B.length-1);
          const ai=clamp(Math.round(pos*(A.length-1)),0,A.length-1);
          A[ai].next.push(bn.id);
        }
      });
    }
    this.map = rows;
  };

  P.pickNodeType = function(r,ROW,act){
    if(r===ROW-1) return 'boss';
    if(r===ROW-2) return 'rest';
    if(r===0) return 'monster';
    const roll=Math.random();
    if(r>=6 && roll<0.11) return 'elite';
    if(r>=5 && roll<0.20) return 'rest';
    if(roll<0.26) return 'shop';
    if(r>=3 && roll<0.33) return 'treasure';
    if(roll<0.53) return 'event';
    return 'monster';
  };

  P.getReachableNodes = function(){
    const out=[];
    if(!this.map) return out;
    for(const row of this.map) for(const n of row) if(n.reachable && !n.visited) out.push(n);
    return out;
  };
  P.findNode = function(id){ for(const row of this.map) for(const n of row) if(n.id===id) return n; return null; };

  P.enterNode = function(id){
    if(this._busy) return;
    const n=this.findNode(id);
    if(!n || !n.reachable || n.visited) return;
    n.visited=true; n.reachable=false;
    for(const row of this.map) for(const m of row) m.reachable=false;
    this.currentRow=n.row;
    this.currentNode=n;
    for(const nid of n.next){ const m=this.findNode(nid); if(m) m.reachable=true; }
    switch(n.type){
      case 'monster': this.startCombat(this.pickEncounter('easy'), 'normal'); break;
      case 'elite': this.startCombat(this.pickEncounter('elite'), 'elite'); break;
      case 'boss': this.startCombat([D.ENCOUNTERS[this.act].boss[rnd(0,D.ENCOUNTERS[this.act].boss.length-1)]], 'boss'); break;
      case 'rest': this.openRest(); break;
      case 'shop': this.openShop(); break;
      case 'treasure': this.openTreasure(); break;
      case 'event': this.openEvent(); break;
    }
    this.refresh();
  };

  P.pickEncounter = function(kind){
    const tbl=D.ENCOUNTERS[this.act];
    const list = kind==='elite' ? tbl.elite : (Math.random()<0.55?tbl.easy:tbl.hard);
    return pick(list).slice();
  };

  P.finishNode = function(){
    this.eventResult=null; this.shop=null;
    if(this.currentNode && this.currentNode.type==='boss'){
      if(this.act<3){ this.startAct(this.act+1); return; }
      this.screen='victory'; this.refresh(); return;
    }
    this.screen='map'; this.refresh();
  };

  // ---------------------------------------------------------------
  // COMBAT SETUP
  // ---------------------------------------------------------------
  P.makeEnemy = function(id, slot){
    const def=D.ENEMIES[id];
    const hp=rnd(def.hp[0],def.hp[1]);
    const g=this;
    const e={ id, def, name:def.name, art:def.art, tier:def.tier,
      hp, maxHp:hp, block:0, statuses:{}, powers:{}, dead:false, slot,
      moveHistory:[], currentMove:null, intent:null, isPlayer:false,
      addStatus:function(s,n){ g.applyEnemyStatus(this,s,n); },
      addCardToDiscard:function(id){ g.addStatusCard(id, true); },
      heal:function(n){ this.hp=Math.min(this.maxHp,this.hp+n); } };
    this.chooseEnemyMove(e);
    return e;
  };

  P.startCombat = function(encounter, type){
    this.combatType=type;
    this._combatEnded=false;
    this._turnToken++;
    this.noDrawThisTurn=false;
    this._lastXCost=0;
    // counters such as Pen Nib persist across combats within a run
    this.flags=this.flags||{};
    this.flags._phono=false;
    this.energy=3 + this.energyBonus();
    this.turn=0;
    this.player=this.makePlayer();
    this.enemies = encounter.map((id,i)=>this.makeEnemy(id,i));
    this.drawPile = shuffle(this.deck.map(c=>({uid:c.uid,id:c.id,type:this.cardDef(c).type,upgraded:c.upgraded,costOverride:null})));
    this.hand=[]; this.discardPile=[]; this.exhaustPile=[];
    this.cardsPlayedThisTurn=0; this.skillsPlayedThisTurn=0;
    this.screen='combat';
    this.log('戦闘開始！');
    this.callRelics('onCombatStart');
    this.startPlayerTurn(true);
    this.refresh();
  };

  P.spawnMinions = function(id, n){
    if(this.screen!=='combat' || !this.enemies) return;
    for(let i=0;i<n;i++){
      const e=this.makeEnemy(id, this.enemies.length);
      e.tier='minion'; // summoned creatures are not eligible for Feed's max-HP gain
      this.enemies.push(e);
    }
    this.log('敵が現れた！');
  };

  P.chooseEnemyMove = function(e){
    const def=e.def;
    let move=null;
    if(def.pattern){
      const idx=e.moveHistory.length % def.pattern.length;
      const id=def.pattern[idx];
      move=def.moves.find(m=>m.id===id) || def.moves[0];
    } else {
      const first=def.moves.filter(m=>m.first);
      const normal=def.moves.filter(m=>!m.first);
      if(first.length && e.moveHistory.length===0) move=pick(first);
      else {
        let pool=normal.length?normal:def.moves;
        // crude no-repeat guard
        const last=e.moveHistory[e.moveHistory.length-1];
        if(pool.length>1 && last){ const filtered=pool.filter(m=>m.id!==last); if(filtered.length) pool=filtered; }
        const total=pool.reduce((s,m)=>s+(m.weight||1),0);
        let roll=Math.random()*total;
        for(const m of pool){ roll-=(m.weight||1); if(roll<=0){move=m;break;} }
        move=move||pool[0];
      }
    }
    e.currentMove=move;
    e.intent=this.computeIntent(e);
  };

  P.computeIntent = function(e){
    const m=e.currentMove;
    if(!m) return {kind:'unknown'};
    const info=INTENT[e.id+'.'+m.id] || {};
    const preview={ kind:m.intent, name:m.name, dmg:info.dmg||0, times:info.times||1, dynamic:info.dynamic||null };
    if(m.intent==='sleep') preview.kind='sleep';
    return preview;
  };

  // ---------------------------------------------------------------
  // PLAYER TURN
  // ---------------------------------------------------------------
  P.startPlayerTurn = function(first){
    if(this.player.hp<=0){ this.endCombat(false); return; }
    this.turn++;
    this.cardsPlayedThisTurn=0; this.skillsPlayedThisTurn=0;
    if(!this.player.powers.barricade) this.player.block=0;
    this.energy=3 + this.energyBonus();
    if(first) this.callRelics('onFirstTurn');
    // plated armor
    const pa=this.player.statuses.platedArmor||0;
    if(pa>0){ this.gainBlock(pa); this.player.statuses.platedArmor=pa-1; if(!this.player.statuses.platedArmor) delete this.player.statuses.platedArmor; }
    // poison tick
    if(this.player.statuses.poison>0){
      const p=this.player.statuses.poison;
      this.damagePlayerDirect(p, true);
      this.player.statuses.poison--;
      if(!this.player.statuses.poison) delete this.player.statuses.poison;
      if(this.player.hp<=0){ this.endCombat(false); return; }
    }
    // powers
    if(this.player.powers.demonForm) this.playerStatus('strength',this.player.powers.demonForm);
    this.callRelics('onTurnStart');
    this.drawCards(5);
    this.refresh();
  };

  P.drawCards = function(n){
    for(let i=0;i<n;i++){
      if(this.noDrawThisTurn) break;
      if(this.hand.length>=10) break;
      if(this.drawPile.length===0){
        if(this.discardPile.length===0) break;
        this.drawPile=shuffle(this.discardPile.slice()); this.discardPile=[];
        this.log('捨て札を山札にシャッフルした。');
      }
      const c=this.drawPile.pop();
      if(this.hasRelic('sneckoeye') && this.cardDef(c).cost!=='X') c.costOverride=rnd(0,3);
      this.hand.push(c);
      // fire breathing
      if(this.player.powers.fireBreathing && (this.cardDef(c).type==='status')){
        for(const e of [...this.enemies]) if(!e.dead) this.dealDamage(this.player,e,this.player.powers.fireBreathing);
      }
    }
    this.refresh();
  };

  P.gainBlock = function(amount){
    let a=amount;
    if(this.player.statuses.dexterity) a+=this.player.statuses.dexterity;
    if(this.player.statuses.frail) a=Math.floor(a*0.75);
    a=Math.max(0,a);
    this.player.block+=a;
    if(this.player.powers.juggernaut){
      const alive=this.enemies.filter(e=>!e.dead);
      if(alive.length) this.dealDamage(this.player,pick(alive),this.player.powers.juggernaut,{noBlock:false});
    }
  };

  P.playerStatus = function(s,n){
    if(n<0 && this.player.statuses.artifact){ this.player.statuses.artifact--; if(!this.player.statuses.artifact) delete this.player.statuses.artifact; return; }
    if(this.hasRelic('oddmushroom') && (s==='vulnerable'||s==='weak') && n>0) n=Math.max(0,n-1);
    if(n===0) return;
    this.player.statuses[s]=(this.player.statuses[s]||0)+n;
    if(this.player.statuses[s]<=0) delete this.player.statuses[s];
  };

  // ---------------------------------------------------------------
  // DAMAGE
  // ---------------------------------------------------------------
  P.calcAttack = function(source, target, base, strMult){
    let dmg=base;
    const str=source.statuses.strength||0;
    dmg += str*(strMult===undefined?1:strMult);
    if(source.statuses.weak) dmg=Math.floor(dmg*0.75);
    if(target.statuses.vulnerable) dmg=Math.floor(dmg*1.5);
    return Math.max(0,Math.floor(dmg));
  };

  P.dealDamage = function(source,target,amount,opts){
    opts=opts||{};
    if(target.dead) return 0;
    let dmg=amount;
    if(opts.noBlock){ /* ignore block */ }
    else {
      const absorbed=Math.min(target.block||0,dmg);
      target.block-=absorbed; dmg-=absorbed;
    }
    if(dmg>0){
      target.hp-=dmg;
      if(target.hp<0) target.hp=0;
      if(target===this.player){ this.hp=target.hp; this.callRelics('onHPLow'); }
      // thorns
      if(opts.attack!==false && target.statuses.thorns && source && source!==target){
        this.damageDirect(source,target.statuses.thorns,{thorns:true});
      }
      if(this.ui && this.ui.onDamage) this.ui.onDamage(target,dmg,false);
      if(target.hp<=0) this.killEntity(target);
    }
    return dmg;
  };

  P.damageDirect = function(target,amount,opts){
    if(!target || target.dead) return;
    target.hp-=amount; if(target.hp<0) target.hp=0;
    if(target===this.player){ this.hp=target.hp; this.callRelics('onHPLow'); }
    if(target.hp<=0) this.killEntity(target);
  };
  P.damagePlayerDirect = function(n,ignoreBlock){ if(ignoreBlock) this.damageDirect(this.player,n); else this.dealDamage(null,this.player,n); };
  P.healPlayer = function(n){ const before=this.player.hp; this.player.hp=clamp(this.player.hp+n,0,this.player.maxHp); this.hp=this.player.hp;
    if(this.ui&&this.ui.onDamage&&this.player.hp>before) this.ui.onDamage(this.player,this.player.hp-before,true); };

  P.killEntity = function(ent){
    if(ent.dead) return;
    ent.dead=true; ent.hp=0;
    if(ent===this.player){
      this.log('力尽きた。');
    } else {
      this.log(ent.name+'を倒した！');
    }
  };

  P.enemyAttack = function(e, amount){
    const dmg=this.calcAttack(e,this.player,amount);
    this.dealDamage(e,this.player,dmg,{attack:true});
  };
  P.enemyBlock = function(e,n){ e.block+=n; };

  // ---------------------------------------------------------------
  // PLAYING CARDS
  // ---------------------------------------------------------------
  P.canPlay = function(c){
    const def=this.cardDef(c);
    if(def.unplayable) return false;
    let cost=this.cardCost(c);
    if(cost==='X') cost=0;
    if(cost===null) return false;
    return this.energy>=cost;
  };

  P.playCard = function(uid, targetIndex){
    if(this.screen!=='combat' || this._busy) return;
    const idx=this.hand.findIndex(c=>c.uid===uid);
    if(idx<0) return;
    const c=this.hand[idx];
    const def=this.cardDef(c);
    if(!this.canPlay(c)) { this.log('エネルギーが足りない。'); return; }
    let target=this.enemies.find(e=>!e.dead && (targetIndex===undefined || e.slot===targetIndex)) || this.enemies.find(e=>!e.dead);
    if(!target && def.target!=='self') return;

    let cost=this.cardCost(c);
    if(cost==='X'){ cost=this.energy; this.energy=0; this._lastXCost=cost; }
    else this.energy-=cost;

    this.hand.splice(idx,1);
    this.cardsPlayedThisTurn++;
    if(def.type==='skill') this.skillsPlayedThisTurn++;

    let damageMult=1;
    // relic: pen nib doubles every 10th attack (handled via modifier)
    if(def.type==='attack' && this.hasRelic('pennib')){
      this.flags._attackCount=(this.flags._attackCount||0)+1;
      if(this.flags._attackCount%10===0) damageMult=2;
    }

    this.log(this.cardName(c)+'を使用');
    this.callRelics('onPlayCard',c);

    for(const eff of def.effects){
      this.resolveEffect(eff,c,target,damageMult);
      if(this.player.hp<=0) break;
    }

    if(def.exhaust) this.exhaustPile.push(c);
    else this.discardPile.push(c);

    this.checkCombatEnd();
    this.refresh();
  };

  P.resolveEffect = function(eff,c,target,mult){
    mult=mult||1;
    const up=c.upgraded;
    const V=(e)=>up?e.up:e.v;
    switch(eff.t){
      case 'damage': {
        const base=V(eff)*mult;
        const times=eff.times||1;
        const targets = eff.target==='all' ? this.enemies.filter(e=>!e.dead) : [target];
        for(let i=0;i<times;i++) for(const t of targets){
          if(!t||t.dead) continue;
          const dmg=this.calcAttack(this.player,t,base);
          this.dealDamage(this.player,t,dmg,{attack:true});
        }
        break;
      }
      case 'damageDyn': {
        let base=0, strMult=1;
        if(eff.f==='bodySlam'){ base=this.player.block; strMult=0; } // Body Slam ignores Strength
        else if(eff.f==='heavyBlade'){ base=V(eff); strMult=up?eff.multUp:eff.mult; }
        const dmg=this.calcAttack(this.player,target,base,strMult)*mult;
        this.dealDamage(this.player,target,dmg,{attack:true});
        break;
      }
      case 'block': this.gainBlock(V(eff)); break;
      case 'status': {
        const amt=V(eff);
        if(eff.target==='self') this.playerStatus(eff.s,amt);
        else if(eff.target==='all'){ for(const e of this.enemies) if(!e.dead) this.applyEnemyStatus(e,eff.s,amt); }
        else if(target) this.applyEnemyStatus(target,eff.s,amt);
        break;
      }
      case 'draw': this.drawCards(V(eff)); break;
      case 'energy': this.energy+=V(eff); break;
      case 'heal': this.healPlayer(V(eff)); break;
      case 'selfDamage': this.damagePlayerDirect(V(eff),true); break;
      case 'addCard': {
        const card=this.makeCard(eff.card,up);
        this.discardPile.push(card); break;
      }
      case 'upgradeHand': {
        const options=this.hand.filter(x=>!x.upgraded && this.cardDef(x).rarity!=='status');
        if(options.length){ const c=pick(options); c.upgraded=true; this.log(this.cardName(c)+'を戦闘中のみ強化'); }
        break;
      }
      case 'tempStrength': {
        this.playerStatus('strength',V(eff));
        this.player._tempStrength=(this.player._tempStrength||0)+V(eff);
        break;
      }
      case 'noDraw': this.noDrawThisTurn=true; break;
      case 'conditional': {
        let ok=false;
        if(eff.cond==='targetVulnerable') ok=target && target.statuses.vulnerable>0;
        if(ok) for(const e of eff.do) this.resolveEffect(e,c,target,mult);
        break;
      }
      case 'exhaustHand': {
        const rest=this.hand.splice(0);
        rest.forEach(x=>this.exhaustPile.push(x)); break;
      }
      case 'whirlwind': {
        const n=this._lastXCost||0;
        for(let i=0;i<n;i++) for(const e of this.enemies) if(!e.dead){
          const dmg=this.calcAttack(this.player,e,V(eff));
          this.dealDamage(this.player,e,dmg,{attack:true});
        }
        break;
      }
      case 'secondWind': {
        const skills=this.hand.filter(x=>this.cardDef(x).type==='skill');
        skills.forEach(s=>{ const i=this.hand.indexOf(s); this.hand.splice(i,1); this.exhaustPile.push(s); });
        this.gainBlock(V(eff)*skills.length); break;
      }
      case 'power': {
        if(eff.p==='demonForm') this.player.powers.demonForm=V(eff);
        else if(eff.p==='barricade') this.player.powers.barricade=true;
        else if(eff.p==='juggernaut') this.player.powers.juggernaut=V(eff);
        else if(eff.p==='fireBreathing') this.player.powers.fireBreathing=V(eff);
        break;
      }
      case 'doubleStrength': {
        const s=this.player.statuses.strength||0;
        if(s>0) this.player.statuses.strength=s*2; break;
      }
      case 'reaper': {
        let total=0;
        for(const e of this.enemies) if(!e.dead){
          const dmg=this.calcAttack(this.player,e,V(eff));
          total+=this.dealDamage(this.player,e,dmg,{attack:true});
        }
        this.healPlayer(total); break;
      }
      case 'feed': {
        const wasAlive=target && !target.dead;
        const dmg=this.calcAttack(this.player,target,V(eff));
        this.dealDamage(this.player,target,dmg,{attack:true});
        if(wasAlive && target.dead && target.tier!=='minion'){
          this.player.maxHp += (up?eff.maxhpUp:eff.maxhp);
          this.healPlayer(up?eff.maxhpUp:eff.maxhp);
        }
        break;
      }
    }
  };

  P.addStatusCard = function(id, toDiscard){
    const pile = toDiscard ? this.discardPile : this.drawPile;
    pile.push(this.makeCard(id));
    if(!toDiscard) shuffle(this.drawPile);
  };

  P.applyEnemyStatus = function(e,s,n){
    if(n<0 && e.statuses.artifact){ e.statuses.artifact--; if(!e.statuses.artifact) delete e.statuses.artifact; return; }
    e.statuses[s]=(e.statuses[s]||0)+n;
    if(e.statuses[s]<=0) delete e.statuses[s];
  };

  // ---------------------------------------------------------------
  // END TURN / ENEMY TURN
  // ---------------------------------------------------------------
  P.endTurn = function(){
    if(this.screen!=='combat' || this._busy) return;
    this._busy=true;
    // temp strength
    if(this.player._tempStrength){ this.playerStatus('strength',-this.player._tempStrength); this.player._tempStrength=0; }
    // Status cards: Burn/Hex stay in hand, Dazed is Ethereal (exhausted)
    const keep=[];
    for(const c of [...this.hand]){
      const id=this.cardDef(c).id;
      if(id==='burn'){ this.damagePlayerDirect(2,true); keep.push(c); continue; }
      if(id==='dazed'){ this.exhaustPile.push(c); continue; }
      if(id==='hex'){
        for(const e of this.enemies) if(!e.dead) e.addStatus('strength',1);
        keep.push(c); continue;
      }
      this.discardPile.push(c);
    }
    this.hand=keep;
    if(this.player.hp<=0){ this.endCombat(false); return; }
    // relic end-turn
    this.callRelics('onEndTurn');
    // decrement player debuffs
    ['vulnerable','weak','frail'].forEach(s=>{ if(this.player.statuses[s]){ this.player.statuses[s]--; if(!this.player.statuses[s]) delete this.player.statuses[s]; } });
    this.noDrawThisTurn=false;
    this.enemyTurn();
  };

  P.enemyTurn = function(){
    const token=this._turnToken;
    const step=(i)=>{
      if(token!==this._turnToken) return;              // stale timer from an older combat
      if(this.player.hp<=0 || this.checkCombatEnd()){ this.endCombat(this.player.hp>0); return; }
      if(i>=this.enemies.length){
        this._busy=false;
        if(this.player.hp<=0) this.endCombat(false);
        else this.startPlayerTurn(false);
        return;
      }
      const e=this.enemies[i];
      if(e.dead){ step(i+1); return; }
      if(e.statuses.poison>0){
        this.damageDirect(e,e.statuses.poison);
        e.statuses.poison--;
        if(!e.statuses.poison) delete e.statuses.poison;
        if(e.dead){ step(i+1); return; }
      }
      e.block=0;
      const move=e.currentMove;
      if(move){ move.act(e,this); }
      if(e.statuses.vulnerable){ e.statuses.vulnerable--; if(!e.statuses.vulnerable) delete e.statuses.vulnerable; }
      if(e.statuses.weak){ e.statuses.weak--; if(!e.statuses.weak) delete e.statuses.weak; }
      if(e.statuses.ritual) e.addStatus('strength',e.statuses.ritual);
      e.moveHistory.push(move?move.id:'none');
      this.chooseEnemyMove(e);
      if(this.player.hp<=0 || this.checkCombatEnd()){ this.endCombat(this.player.hp>0); return; }
      this.refresh();
      setTimeout(()=>step(i+1), 450);
    };
    step(0);
  };

  // addStatus helper on enemy (bound)
  // defined via extension below

  P.checkCombatEnd = function(){
    if(this.player.hp<=0){ this._busy=true; setTimeout(()=>this.endCombat(false),100); return true; }
    if(this.enemies.every(e=>e.dead)){ this._busy=true; setTimeout(()=>this.endCombat(true),500); return true; }
    return false;
  };

  P.endCombat = function(victory){
    if(this._combatEnded) return;
    this._combatEnded=true;
    this._busy=false;
    if(!victory){
      this.screen='defeat'; this.refresh(); return;
    }
    this.callRelics('onCombatEnd');
    this.hp=this.player.hp; this.maxHp=this.player.maxHp;
    // rewards
    const type=this.combatType||'normal';
    const gold = type==='boss'? rnd(95,120) : type==='elite'? rnd(25,40) : rnd(10,22);
    const reward={ gold: this.hasRelic('ectoplasm')?0:gold, cards:[], potion:null, relic:null };
    const rarities = type==='boss' ? ['rare','rare','uncommon'] : type==='elite' ? ['uncommon','rare','common'] : ['common','common','uncommon'];
    for(let i=0;i<3;i++){
      const pool = (Math.random()<0.05||rarities[i]==='rare')?D.RARE_IDS : rarities[i]==='uncommon'?D.UNCOMMON_IDS:D.COMMON_IDS;
      reward.cards.push(pick(pool));
    }
    reward.cards=[...new Set(reward.cards)];
    if(this.potions.some(p=>!p) && Math.random()<0.4) reward.potion=pick(Object.keys(D.POTIONS));
    if(type==='elite') reward.relic=this.randomRelicId(['common','uncommon']);
    if(type==='boss') reward.relic=this.randomRelicId(['boss','uncommon','rare']);
    this.reward=reward;
    this.screen='reward';
    this.refresh();
  };

  P.randomRelicId = function(tiers){
    const pool=Object.values(D.RELICS).filter(r=>r.tier!=='starter' && !this.hasRelic(r.id) && (!tiers||tiers.indexOf(r.tier)>=0));
    if(!pool.length) return null;
    return pick(pool).id;
  };
  P.gainRandomRelic = function(){ const id=this.randomRelicId(); if(id) this.gainRelic(id); };
  P.gainRelic = function(id){ if(!id||this.hasRelic(id)) return; this.relics.push(id); const r=D.RELICS[id]; if(r&&r.onPickup) r.onPickup(this); this.log('遺物を入手: '+r.name); };
  P.gainRandomPotion = function(){ const slot=this.potions.indexOf(null); if(slot>=0) this.potions[slot]=pick(Object.keys(D.POTIONS)); };

  P.takeRewardGold = function(){ if(!this.reward) return; this.gold+=this.reward.gold; this.reward.gold=0; this.refresh(); };
  P.takeRewardCard = function(id){ if(!this.reward) return; this.deck.push(this.makeCard(id)); this.reward.cards=[]; this.refresh(); };
  P.takeRewardPotion = function(){ if(!this.reward||!this.reward.potion) return; const s=this.potions.indexOf(null);
    if(s>=0){ this.potions[s]=this.reward.potion; this.reward.potion=null; this.refresh(); } };
  P.takeRewardRelic = function(){ if(!this.reward||!this.reward.relic) return; this.gainRelic(this.reward.relic); this.reward.relic=null; this.refresh(); };
  P.skipReward = function(){ this.reward=null; this.finishNode(); };

  // ---------------------------------------------------------------
  // POTIONS
  // ---------------------------------------------------------------
  P.usePotion = function(slot,targetIndex){
    const id=this.potions[slot]; if(!id) return;
    if(this.hasRelic('sozu')) { this.log('ソウがポーション使用を妨げる。'); return; }
    if(this.screen!=='combat'){
      if(id!=='blood'){ this.log('このポーションは戦闘中のみ使える。'); return; }
      this.healPlayer(Math.floor(this.player.maxHp*0.2));
      this.potions[slot]=null; this.refresh(); return;
    }
    const pot=D.POTIONS[id];
    let e=null;
    if(pot.target){ e=this.enemies.find(x=>!x.dead && x.slot===targetIndex)||this.enemies.find(x=>!x.dead); if(!e) return; }
    pot.use(this,e);
    this.potions[slot]=null;
    this.checkCombatEnd();
    this.refresh();
  };
  P.discardPotion = function(slot){ if(!this.potions[slot]) return; this.potions[slot]=null; this.log('ポーションを捨てた。'); this.refresh(); };

  // ---------------------------------------------------------------
  // NON-COMBAT NODES
  // ---------------------------------------------------------------
  P.openRest = function(){ this.screen='rest'; this.refresh(); };
  P.restChoice = function(choice){
    if(this.screen!=='rest') return;
    if(choice==='rest'){
      if(this.hasRelic('coffeedripper')){ this.log('コーヒードリッパーが休息を妨げる。'); return; }
      this.healPlayer(Math.floor(this.maxHp*0.3));
    } else if(choice==='smith'){
      if(this.hasRelic('fusionhammer')){ this.log('融合ハンマーが鍛冶を妨げる。'); return; }
      this.smithMode=true; this.screen='deckSelect'; this.refresh(); return;
    }
    // 'leave' or any invalid choice always lets the player continue
    this.finishNode();
  };

  P.openShop = function(){
    const cards=[];
    const pool=[...D.COMMON_IDS,...D.UNCOMMON_IDS,...D.RARE_IDS];
    shuffle(pool);
    for(let i=0;i<5;i++){ const id=pool[i]; const rare=D.CARDS[id].rarity;
      const price = rare==='rare'?rnd(135,175):rare==='uncommon'?rnd(95,130):rnd(45,70);
      cards.push({ id, price, sold:false }); }
    const relicIds=[]; for(let i=0;i<2;i++){ const id=this.randomRelicId(); if(id) relicIds.push({id,price:rnd(140,200),sold:false}); }
    const potIds=[]; for(let i=0;i<3;i++){ potIds.push({id:pick(Object.keys(D.POTIONS)),price:rnd(50,80),sold:false}); }
    this.shop={ cards, relics:relicIds, potions:potIds, removeUsed:false, removePrice:75 };
    this.screen='shop'; this.refresh();
  };
  P.buy = function(kind,index){
    const s=this.shop; if(!s) return;
    const item=s[kind][index]; if(!item||item.sold) return;
    if(this.gold<item.price){ this.log('ゴールドが足りない。'); return; }
    this.gold-=item.price; item.sold=true;
    if(kind==='cards') this.deck.push(this.makeCard(item.id));
    else if(kind==='relics') this.gainRelic(item.id);
    else if(kind==='potions'){ const slot=this.potions.indexOf(null); if(slot>=0) this.potions[slot]=item.id; else { this.gold+=item.price; item.sold=false; this.log('ポーションスロットが空いていない。'); } }
    this.refresh();
  };
  P.buyRemove = function(){ const s=this.shop; if(!s||s.removeUsed) return;
    if(this.gold<s.removePrice){ this.log('ゴールドが足りない。'); return; }
    this.gold-=s.removePrice; s.removeUsed=true; this.removeCardMode=true; this._returnScreen='shop';
    this.screen='deckSelect'; this.refresh(); };

  P.openTreasure = function(){ const relicId=this.randomRelicId();
    this.treasure={ gold:rnd(65,120), relic:relicId, potion:Math.random()<0.5?pick(Object.keys(D.POTIONS)):null, taken:false };
    this.screen='treasure'; this.refresh(); };
  P.takeTreasure = function(){
    const t=this.treasure; if(!t||t.taken) return; t.taken=true;
    this.gold+=t.gold; if(t.relic) this.gainRelic(t.relic);
    if(t.potion){ const s=this.potions.indexOf(null); if(s>=0) this.potions[s]=t.potion; }
    this.refresh();
  };

  P.openEvent = function(){ const ids=Object.keys(D.EVENTS); this.event=D.EVENTS[pick(ids)]; this.eventResult=null; this.screen='event'; this.refresh(); };
  P.eventChoice = function(i){
    if(!this.event||this.eventResult) return;
    const ch=this.event.choices[i]; if(!ch) return;
    if(ch.cost && this.gold<ch.cost){ this.log('ゴールドが足りない。'); return; }
    if(ch.cost) this.gold-=ch.cost;
    ch.act(this);
    if(this.hp<=0){ this.screen='defeat'; this.refresh(); return; }
    if(this.removeCardMode){ this._returnScreen='event'; this.screen='deckSelect'; this.refresh(); return; }
    if(this.screen==='event') this.refresh();
  };
  P.finishEvent = function(){ this.finishNode(); };

  P.selectDeckCard = function(uid){
    const idx=this.deck.findIndex(c=>c.uid===uid); if(idx<0) return;
    if(this.smithMode){ const c=this.deck[idx]; if(!c.upgraded){ c.upgraded=true; this.log(this.cardName(c)+'を強化した。'); }
      this.smithMode=false; this.finishNode(); return; }
    if(this.removeCardMode){ this.deck.splice(idx,1); this.removeCardMode=false; this.log('カードを除去した。');
      if(this._returnScreen==='shop'){ this._returnScreen=null; this.screen='shop'; this.refresh(); }
      else if(this._returnScreen==='event'){ this._returnScreen=null; this.eventResult='カードを除去した。'; this.screen='event'; this.refresh(); }
      else this.finishNode(); return; }
  };

  // ---------------------------------------------------------------
  // SAVE / LOAD
  // ---------------------------------------------------------------
  P.save = function(){
    // Combat/reward state is intentionally not persisted; saving there would allow skipping fights.
    if(this.screen==='combat' || this.screen==='reward'){ this.log('戦闘中と報酬画面ではセーブできません。'); return false; }
    try{
      const s={ version:2, act:this.act,maxHp:this.maxHp,hp:this.hp,gold:this.gold,deck:this.deck,relics:this.relics,
        potions:this.potions,map:this.map,currentRow:this.currentRow,currentNode:this.currentNode&&this.currentNode.id,flags:this.flags };
      localStorage.setItem('sts_save',JSON.stringify(s)); this.log('セーブしました。'); return true;
    }catch(e){ this.log('セーブに失敗しました。'); return false; }
  };
  P.hasSave = function(){ try{ return !!localStorage.getItem('sts_save'); }catch(e){ return false; } };
  P.load = function(){
    try{
      const s=JSON.parse(localStorage.getItem('sts_save')); if(!s) return false;
      // validate before touching live state
      const valid = s.version===2 && Number.isInteger(s.act) && s.act>=1 && s.act<=3 &&
        Number.isFinite(s.hp) && s.hp>=0 && Number.isFinite(s.maxHp) && s.maxHp>0 &&
        Number.isFinite(s.gold) && Array.isArray(s.deck) && s.deck.length>0 &&
        Array.isArray(s.relics) && Array.isArray(s.potions) && s.potions.length===3 &&
        Array.isArray(s.map) && s.map.length===15 && s.deck.every(c=>c&&Number.isInteger(c.uid)&&D.CARDS[c.id]);
      if(!valid){ this.deleteSave(); return false; }
      this.act=s.act; this.maxHp=s.maxHp; this.hp=s.hp; this.gold=s.gold;
      // restore UID counter so freshly created cards never collide with saved ones
      let maxUid=0; for(const c of s.deck) maxUid=Math.max(maxUid,c.uid);
      UID=Math.max(UID,maxUid+1);
      this.deck=s.deck; this.relics=s.relics; this.potions=s.potions; this.map=s.map;
      this.currentRow=s.currentRow; this.currentNode=this.findNode(s.currentNode);
      this.flags=s.flags||{}; this.player=this.makePlayer();
      this.logs=[]; this.smithMode=false; this.removeCardMode=false; this._returnScreen=null;
      this._busy=false; this._combatEnded=false; this._turnToken++;
      this.noDrawThisTurn=false; this.screen='map'; this.refresh(); return true;
    }catch(e){ this.deleteSave(); return false; }
  };
  P.deleteSave = function(){ try{ localStorage.removeItem('sts_save'); }catch(e){} };

  root.Game = Game;
})(window);
