/* ============================================================
   DATA LAYER — Slay the Spire (Ironclad focused)
   All values mirror the base game (Ascension 0).
   ============================================================ */
(function (root) {
  'use strict';

  // ---- helpers -------------------------------------------------
  // effect object shorthand builders
  const dmg = (v, up, times = 1, target = 'enemy') => ({ t: 'damage', v, up, times, target });
  const blk = (v, up) => ({ t: 'block', v, up });
  const sta = (s, v, up, target = 'enemy') => ({ t: 'status', s, v, up, target });
  const draw = (v, up) => ({ t: 'draw', v, up });
  const nrg = (v, up) => ({ t: 'energy', v, up });

  // ---- CARDS ----------------------------------------------------
  // target: 'enemy' | 'all' | 'self' | 'none'
  const CARDS = {
    // BASIC
    strike: { id:'strike', name:'Strike', type:'attack', rarity:'basic', cost:1, target:'enemy',
      text:'Deal 6 damage.', textUp:'Deal 9 damage.', effects:[dmg(6,9)] },
    defend: { id:'defend', name:'Defend', type:'skill', rarity:'basic', cost:1, target:'self',
      text:'Gain 5 Block.', textUp:'Gain 8 Block.', effects:[blk(5,8)] },
    bash: { id:'bash', name:'Bash', type:'attack', rarity:'basic', cost:2, target:'enemy',
      text:'Deal 8 damage. Apply 2 Vulnerable.', textUp:'Deal 10 damage. Apply 3 Vulnerable.',
      effects:[dmg(8,10), sta('vulnerable',2,3)] },

    // COMMON
    anger: { id:'anger', name:'Anger', type:'attack', rarity:'common', cost:0, target:'enemy',
      text:'Deal 6 damage. Add a copy of this card to your discard pile.',
      textUp:'Deal 8 damage. Add a copy of this card to your discard pile.',
      effects:[dmg(6,8), {t:'addCard', card:'anger'}] },
    armaments: { id:'armaments', name:'Armaments', type:'skill', rarity:'common', cost:1, target:'self',
      text:'Gain 5 Block. Upgrade a card in your hand for the rest of combat.',
      textUp:'Gain 8 Block. Upgrade a card in your hand for the rest of combat.',
      effects:[blk(5,8), {t:'upgradeHand'}] },
    barbarian: { id:'barbarian', name:'Barbarian', type:'attack', rarity:'common', cost:1, target:'enemy',
      text:'Deal 9 damage. Lose 2 HP.', textUp:'Deal 12 damage. Lose 2 HP.',
      effects:[dmg(9,12), {t:'selfDamage', v:2}] },
    bodyslam: { id:'bodyslam', name:'Body Slam', type:'attack', rarity:'common', cost:1, target:'enemy',
      text:'Deal damage equal to your current Block.', textUp:'Deal damage equal to your current Block.',
      effects:[{t:'damageDyn', f:'bodySlam'}] },
    clothesline: { id:'clothesline', name:'Clothesline', type:'attack', rarity:'common', cost:2, target:'enemy',
      text:'Deal 12 damage. Apply 2 Weak.', textUp:'Deal 14 damage. Apply 3 Weak.',
      effects:[dmg(12,14), sta('weak',2,3)] },
    flex: { id:'flex', name:'Flex', type:'skill', rarity:'common', cost:0, target:'self',
      text:'Gain 2 Strength. Lose 2 Strength at end of turn.',
      textUp:'Gain 4 Strength. Lose 4 Strength at end of turn.',
      effects:[{t:'tempStrength', v:2, up:4}] },
    heavyblade: { id:'heavyblade', name:'Heavy Blade', type:'attack', rarity:'common', cost:2, target:'enemy',
      text:'Deal 14 damage. Strength affects this card 3 times.',
      textUp:'Deal 18 damage. Strength affects this card 5 times.',
      effects:[{t:'damageDyn', f:'heavyBlade', v:14, up:18, mult:3, multUp:5}] },
    ironwave: { id:'ironwave', name:'Iron Wave', type:'skill', rarity:'common', cost:1, target:'self',
      text:'Gain 5 Block. Deal 5 damage.', textUp:'Gain 7 Block. Deal 7 damage.',
      effects:[blk(5,7), dmg(5,7,'enemy')] },
    pommel: { id:'pommel', name:'Pommel Strike', type:'attack', rarity:'common', cost:1, target:'enemy',
      text:'Deal 9 damage. Draw 1 card.', textUp:'Deal 10 damage. Draw 2 cards.',
      effects:[dmg(9,10), draw(1,2)] },
    shrugitoff: { id:'shrugitoff', name:'Shrug It Off', type:'skill', rarity:'common', cost:1, target:'self',
      text:'Gain 8 Block. Draw 1 card.', textUp:'Gain 11 Block. Draw 1 card.',
      effects:[blk(8,11), draw(1,1)] },
    thunderclap: { id:'thunderclap', name:'Thunderclap', type:'attack', rarity:'common', cost:1, target:'all',
      text:'Deal 4 damage to ALL enemies. Apply 1 Vulnerable to ALL enemies.',
      textUp:'Deal 7 damage to ALL enemies. Apply 1 Vulnerable to ALL enemies.',
      effects:[dmg(4,7,1,'all'), sta('vulnerable',1,1,'all')] },
    twinstrike: { id:'twinstrike', name:'Twin Strike', type:'attack', rarity:'common', cost:1, target:'enemy',
      text:'Deal 5 damage twice.', textUp:'Deal 7 damage twice.',
      effects:[dmg(5,7,2)] },
    inferno: { id:'inferno', name:'Infernal Blow', type:'attack', rarity:'common', cost:2, target:'enemy',
      text:'Deal 12 damage. Apply 2 Poison.', textUp:'Deal 16 damage. Apply 3 Poison.',
      effects:[dmg(12,16), sta('poison',2,3)] },
    battletrance: { id:'battletrance', name:'Battle Trance', type:'skill', rarity:'common', cost:0, target:'self',
      text:'Draw 3 cards. You cannot draw more cards this turn.',
      textUp:'Draw 4 cards. You cannot draw more cards this turn.',
      effects:[draw(3,4), {t:'noDraw'}] },
    dropkick: { id:'dropkick', name:'Dropkick', type:'attack', rarity:'common', cost:1, target:'enemy',
      text:'Deal 5 damage. If the enemy is Vulnerable, gain 1 Energy and draw 1 card.',
      textUp:'Deal 8 damage. If the enemy is Vulnerable, gain 1 Energy and draw 1 card.',
      effects:[{t:'conditional', cond:'targetVulnerable', do:[nrg(1,1), draw(1,1)]}, dmg(5,8)] },

    // UNCOMMON
    uppercut: { id:'uppercut', name:'Uppercut', type:'attack', rarity:'uncommon', cost:2, target:'enemy',
      text:'Deal 13 damage. Apply 1 Weak and 1 Vulnerable.',
      textUp:'Deal 17 damage. Apply 2 Weak and 2 Vulnerable.',
      effects:[dmg(13,17), sta('weak',1,2), sta('vulnerable',1,2)] },
    carnage: { id:'carnage', name:'Carnage', type:'attack', rarity:'uncommon', cost:2, target:'enemy', exhaust:true,
      text:'Deal 20 damage. Exhaust.', textUp:'Deal 28 damage. Exhaust.',
      effects:[dmg(20,28)] },
    disarm: { id:'disarm', name:'Disarm', type:'skill', rarity:'uncommon', cost:1, target:'enemy', exhaust:true,
      text:'Enemy loses 2 Strength. Exhaust.', textUp:'Enemy loses 3 Strength. Exhaust.',
      effects:[{t:'status', s:'strength', v:-2, up:-3, target:'enemy'}] },
    inflame: { id:'inflame', name:'Inflame', type:'power', rarity:'uncommon', cost:1, target:'self',
      text:'Gain 2 Strength.', textUp:'Gain 3 Strength.',
      effects:[{t:'status', s:'strength', v:2, up:3, target:'self', persistent:true}] },
    seversoul: { id:'seversoul', name:'Sever Soul', type:'attack', rarity:'uncommon', cost:2, target:'enemy',
      text:'Deal 10 damage. Exhaust all cards in your hand.',
      textUp:'Deal 16 damage. Exhaust all cards in your hand.',
      effects:[dmg(10,16), {t:'exhaustHand'}] },
    whirlwind: { id:'whirlwind', name:'Whirlwind', type:'attack', rarity:'uncommon', cost:'X', target:'all',
      text:'Deal 5 damage to ALL enemies X times.', textUp:'Deal 8 damage to ALL enemies X times.',
      effects:[{t:'whirlwind', v:5, up:8}] },
    secondwind: { id:'secondwind', name:'Second Wind', type:'skill', rarity:'uncommon', cost:1, target:'self',
      text:'Exhaust all Skill cards in your hand. Gain 5 Block for each card exhausted.',
      textUp:'Exhaust all Skill cards in your hand. Gain 8 Block for each card exhausted.',
      effects:[{t:'secondWind', v:5, up:8}] },
    seeingred: { id:'seeingred', name:'Seeing Red', type:'skill', rarity:'uncommon', cost:1, target:'self', exhaust:true,
      text:'Gain 2 Energy. Exhaust.', textUp:'Gain 2 Energy. Exhaust.',
      effects:[nrg(2,2)] },
    impervious: { id:'impervious', name:'Impervious', type:'skill', rarity:'uncommon', cost:2, target:'self', exhaust:true,
      text:'Gain 30 Block. Exhaust.', textUp:'Gain 40 Block. Exhaust.',
      effects:[blk(30,40)] },
    shockwave: { id:'shockwave', name:'Shockwave', type:'skill', rarity:'uncommon', cost:2, target:'all', exhaust:true,
      text:'Apply 3 Weak and 3 Vulnerable to ALL enemies. Exhaust.',
      textUp:'Apply 5 Weak and 5 Vulnerable to ALL enemies. Exhaust.',
      effects:[sta('weak',3,5,'all'), sta('vulnerable',3,5,'all')] },

    // RARE
    bludgeon: { id:'bludgeon', name:'Bludgeon', type:'attack', rarity:'rare', cost:3, target:'enemy',
      text:'Deal 32 damage.', textUp:'Deal 42 damage.', effects:[dmg(32,42)] },
    demonform: { id:'demonform', name:'Demon Form', type:'power', rarity:'rare', cost:3, target:'self',
      text:'At the start of each turn, gain 2 Strength.',
      textUp:'At the start of each turn, gain 3 Strength.',
      effects:[{t:'power', p:'demonForm', v:2, up:3}] },
    limitbreak: { id:'limitbreak', name:'Limit Break', type:'skill', rarity:'rare', cost:1, target:'self', exhaust:true,
      text:'Double your Strength. Exhaust.', textUp:'Double your Strength. Exhaust.',
      effects:[{t:'doubleStrength'}] },
    reaper: { id:'reaper', name:'Reaper', type:'attack', rarity:'rare', cost:2, target:'all', exhaust:true,
      text:'Deal 4 damage to ALL enemies. Heal HP equal to unblocked damage. Exhaust.',
      textUp:'Deal 7 damage to ALL enemies. Heal HP equal to unblocked damage. Exhaust.',
      effects:[{t:'reaper', v:4, up:7}] },
    offering: { id:'offering', name:'Offering', type:'skill', rarity:'rare', cost:0, target:'self', exhaust:true,
      text:'Lose 6 HP. Gain 2 Energy. Draw 3 cards. Exhaust.',
      textUp:'Lose 6 HP. Gain 2 Energy. Draw 5 cards. Exhaust.',
      effects:[{t:'selfDamage', v:6}, nrg(2,2), draw(3,5)] },
    barricade: { id:'barricade', name:'Barricade', type:'power', rarity:'rare', cost:3, target:'self',
      text:'Block no longer expires at the start of your turn.',
      textUp:'Block no longer expires at the start of your turn.',
      effects:[{t:'power', p:'barricade'}] },
    juggernaut: { id:'juggernaut', name:'Juggernaut', type:'power', rarity:'rare', cost:2, target:'self',
      text:'Whenever you gain Block, deal 5 damage to a random enemy.',
      textUp:'Whenever you gain Block, deal 7 damage to a random enemy.',
      effects:[{t:'power', p:'juggernaut', v:5, up:7}] },
    feed: { id:'feed', name:'Feed', type:'attack', rarity:'rare', cost:2, target:'enemy', exhaust:true,
      text:'Deal 10 damage. If this kills a non-minion enemy, gain 3 Max HP. Exhaust.',
      textUp:'Deal 12 damage. If this kills a non-minion enemy, gain 4 Max HP. Exhaust.',
      effects:[{t:'feed', v:10, up:12, maxhp:3, maxhpUp:4}] },
  };
  // pools for card rewards
  const COMMON_IDS = Object.values(CARDS).filter(c => c.rarity === 'common').map(c => c.id);
  const UNCOMMON_IDS = Object.values(CARDS).filter(c => c.rarity === 'uncommon').map(c => c.id);
  const RARE_IDS = Object.values(CARDS).filter(c => c.rarity === 'rare').map(c => c.id);

  // ---- STATUS DEFINITIONS (for tooltips) -----------------------
  const STATUSES = {
    vulnerable: { name:'Vulnerable', desc:'Takes 50% more damage from attacks. Loses 1 stack at end of turn.', bad:true },
    weak: { name:'Weak', desc:'Deals 25% less attack damage. Loses 1 stack at end of turn.', bad:true },
    strength: { name:'Strength', desc:'Increases damage of attacks by this amount.' },
    dexterity: { name:'Dexterity', desc:'Increases Block gained by this amount.' },
    frail: { name:'Frail', desc:'Gains 25% less Block. Loses 1 stack at end of turn.', bad:true },
    poison: { name:'Poison', desc:'Lose HP equal to stacks at start of turn, then reduce by 1.', bad:true },
    ritual: { name:'Ritual', desc:'Gains this much Strength at end of each turn.' },
    artifact: { name:'Artifact', desc:'Negates the next debuff applied.' },
    thorns: { name:'Thorns', desc:'Attackers take damage when hitting this character.' },
    platedArmor: { name:'Plated Armor', desc:'Gain Block at start of turn, then lose 1 stack.' },
    metacognition: { name:'Metacognition', desc:'Draw extra cards each turn.' },
  };

  // ---- ENEMIES --------------------------------------------------
  // move: { id, name, intent, weight, first, last, make(ctx)->{dmg?,block?,statuses?,special?} }
  // intent types: attack, attackDefend, defend, buff, debuff, attackDebuff, attackBuff, unknown, sleep
  const ENEMIES = {
    // --- ACT 1 normals ---
    cultist: {
      id:'cultist', name:'Cultist', hp:[48,54], art:'cultist', tier:'normal', act:1,
      moves:[
        { id:'incantation', name:'Incantation', intent:'buff', first:true,
          act:(e)=>{ e.addStatus('ritual',3); } },
        { id:'darkstrike', name:'Dark Strike', intent:'attack', weight:1,
          act:(e,g)=>{ g.enemyAttack(e,6); } },
      ],
      pattern:['incantation','darkstrike','darkstrike','darkstrike','darkstrike'],
    },
    jawworm: {
      id:'jawworm', name:'Jaw Worm', hp:[40,44], art:'jawworm', tier:'normal', act:1,
      moves:[
        { id:'chomp', name:'Chomp', intent:'attack', weight:25, first:true,
          act:(e,g)=>{ g.enemyAttack(e,11); } },
        { id:'thrash', name:'Thrash', intent:'attackDefend', weight:30,
          act:(e,g)=>{ g.enemyAttack(e,7); g.enemyBlock(e,5); } },
        { id:'bellow', name:'Bellow', intent:'buff', weight:45,
          act:(e)=>{ e.addStatus('strength',3); e.block += 6; } },
      ],
      pattern:['chomp'],
    },
    acidslime: {
      id:'acidslime', name:'Acid Slime (L)', hp:[32,36], art:'slime', tier:'normal', act:1,
      moves:[
        { id:'corrode', name:'Corrode', intent:'attackDebuff', first:true,
          act:(e,g)=>{ g.enemyAttack(e,7); g.playerStatus('frail',2); } },
        { id:'tackle', name:'Tackle', intent:'attack', weight:60,
          act:(e,g)=>{ g.enemyAttack(e,10); } },
        { id:'lick', name:'Lick', intent:'debuff', weight:40,
          act:(e,g)=>{ g.playerStatus('weak',2); } },
      ],
    },
    spikeslime: {
      id:'spikeslime', name:'Spike Slime (L)', hp:[28,32], art:'slime', tier:'normal', act:1,
      moves:[
        { id:'tackle', name:'Tackle', intent:'attack', first:true, weight:50,
          act:(e,g)=>{ g.enemyAttack(e,10); } },
        { id:'flameTackle', name:'Flame Tackle', intent:'attack', weight:50,
          act:(e,g)=>{ g.enemyAttack(e,8); g.playerStatus('vulnerable',2); } },
      ],
    },
    louse: {
      id:'louse', name:'Red Louse', hp:[10,15], art:'louse', tier:'normal', act:1,
      moves:[
        { id:'bite', name:'Bite', intent:'attack', weight:75,
          act:(e,g)=>{ g.enemyAttack(e,5); } },
        { id:'grow', name:'Grow', intent:'buff', weight:25,
          act:(e)=>{ e.addStatus('strength',3); } },
      ],
    },
    fungibeast: {
      id:'fungibeast', name:'Fungi Beast', hp:[22,28], art:'fungi', tier:'normal', act:1,
      moves:[
        { id:'bite', name:'Bite', intent:'attack', first:true, weight:60,
          act:(e,g)=>{ g.enemyAttack(e,6); } },
        { id:'grow', name:'Grow', intent:'buff', weight:40,
          act:(e)=>{ e.addStatus('strength',3); } },
      ],
    },
    gremlin: {
      id:'gremlin', name:'Gremlin', hp:[16,20], art:'gremlin', tier:'normal', act:1,
      moves:[
        { id:'quickPunch', name:'Quick Punch', intent:'attack', weight:50,
          act:(e,g)=>{ g.enemyAttack(e,4); } },
        { id:'punch', name:'Punch', intent:'attack', weight:50,
          act:(e,g)=>{ g.enemyAttack(e,7); } },
      ],
    },

    // --- ACT 1 ELITES ---
    gremlinnob: {
      id:'gremlinnob', name:'Gremlin Nob', hp:[82,86], art:'nob', tier:'elite', act:1,
      moves:[
        { id:'bellow', name:'Bellow', intent:'buff', first:true,
          act:(e)=>{ e.addStatus('strength',2); } },
        { id:'rush', name:'Rush', intent:'attack', weight:50,
          act:(e,g)=>{ g.enemyAttack(e,14); } },
        { id:'skullbash', name:'Skull Bash', intent:'attackDebuff', weight:50,
          act:(e,g)=>{ g.enemyAttack(e,6); if(g.skillsPlayedThisTurn>0) g.playerStatus('vulnerable',2); } },
      ],
    },
    lagavulin: {
      id:'lagavulin', name:'Lagavulin', hp:[109,115], art:'lagavulin', tier:'elite', act:1,
      moves:[
        { id:'sleep', name:'Sleep', intent:'sleep', first:true,
          act:(e)=>{ e.block += 8; } },
        { id:'siphon', name:'Siphon Soul', intent:'debuff',
          act:(e,g)=>{ g.playerStatus('strength',-1); g.playerStatus('dexterity',-1); } },
        { id:'attack', name:'Attack', intent:'attack',
          act:(e,g)=>{ g.enemyAttack(e,18); } },
      ],
      pattern:['sleep','siphon','attack','attack','attack','attack'],
    },
    sentry: {
      id:'sentry', name:'Sentry', hp:[38,42], art:'sentry', tier:'elite', act:1,
      moves:[
        { id:'bolt', name:'Beam', intent:'attack', first:true,
          act:(e,g)=>{ g.enemyAttack(e,9); } },
        { id:'bolt2', name:'Bolt', intent:'attack',
          act:(e,g)=>{ g.enemyAttack(e,9); if(g.cardsPlayedThisTurn>=3) e.addCardToDiscard('dazed'); } },
      ],
      pattern:['bolt','bolt2','bolt2','bolt2'],
    },

    // --- ACT 1 BOSSES ---
    hexaghost: {
      id:'hexaghost', name:'Hexaghost', hp:[250,250], art:'hexaghost', tier:'boss', act:1,
      moves:[
        { id:'activate', name:'Activate', intent:'buff', first:true,
          act:(e,g)=>{ e.addStatus('strength',2); } },
        { id:'inferno', name:'Inferno', intent:'attack',
          act:(e,g)=>{ for(let i=0;i<6;i++) g.enemyAttack(e, 6); } },
        { id:'sear', name:'Sear', intent:'attackDebuff',
          act:(e,g)=>{ g.enemyAttack(e,12); const c=g.drawPile.length?g.drawPile[0]:null; if(c) g.addStatusCard('burn'); } },
        { id:'tackle', name:'Tackle', intent:'attack',
          act:(e,g)=>{ g.enemyAttack(e,10); } },
        { id:'divider', name:'Divider', intent:'attack',
          act:(e,g)=>{ g.enemyAttack(e, Math.ceil(g.player.hp/2) ); } },
      ],
    },
    slimeboss: {
      id:'slimeboss', name:'Slime Boss', hp:[300,300], art:'slimeboss', tier:'boss', act:1,
      moves:[
        { id:'goop', name:'Goop Spray', intent:'debuff', first:true,
          act:(e,g)=>{ g.playerStatus('frail',2); g.playerStatus('weak',2); } },
        { id:'slam', name:'Slam', intent:'attack',
          act:(e,g)=>{ g.enemyAttack(e,35); } },
        { id:'prepare', name:'Preparing', intent:'defend',
          act:(e)=>{ e.block+=20; } },
      ],
    },
    guardian: {
      id:'guardian', name:'The Guardian', hp:[240,240], art:'guardian', tier:'boss', act:1,
      moves:[
        { id:'modeShift', name:'Mode Shift', intent:'defend', first:true,
          act:(e)=>{ e.block += 10; } },
        { id:'charge', name:'Charge Up', intent:'buff',
          act:(e)=>{ e.addStatus('strength',2); e.block += 9; } },
        { id:'slam', name:'Fierce Bash', intent:'attack',
          act:(e,g)=>{ g.enemyAttack(e,32); } },
        { id:'whirl', name:'Whirlwind', intent:'attack',
          act:(e,g)=>{ for(let i=0;i<3;i++) g.enemyAttack(e,8); } },
      ],
    },

    // --- ACT 2 normals / elites / boss (compact but faithful-enough) ---
    chosen: { id:'chosen', name:'Chosen', hp:[95,99], art:'chosen', tier:'normal', act:2,
      moves:[
        { id:'hex', name:'Hex', intent:'debuff', first:true, act:(e,g)=>{ g.addStatusCard('hex'); } },
        { id:'poke', name:'Poke', intent:'attack', weight:50, act:(e,g)=>{ g.enemyAttack(e,6); e.addStatus('strength',1); } },
        { id:'zap', name:'Zap', intent:'attackDebuff', weight:50, act:(e,g)=>{ g.enemyAttack(e,14); g.playerStatus('weak',1); } },
      ] },
    byrd: { id:'byrd', name:'Byrd', hp:[42,47], art:'byrd', tier:'normal', act:2,
      moves:[
        { id:'peck', name:'Peck', intent:'attack', weight:40, act:(e,g)=>{ g.enemyAttack(e,7); } },
        { id:'swoop', name:'Swoop', intent:'attack', weight:40, act:(e,g)=>{ g.enemyAttack(e,11); } },
        { id:'fly', name:'Fly', intent:'buff', weight:20, act:(e)=>{ e.addStatus('strength',2); } },
      ] },
    centurion: { id:'centurion', name:'Centurion', hp:[76,82], art:'centurion', tier:'normal', act:2,
      moves:[
        { id:'slash', name:'Slash', intent:'attack', weight:50, act:(e,g)=>{ g.enemyAttack(e,12); } },
        { id:'defend', name:'Defend', intent:'defend', weight:25, act:(e)=>{ e.block+=12; } },
        { id:'fury', name:'Fury', intent:'buff', weight:25, act:(e,g)=>{ e.addStatus('strength',2); g.enemyAttack(e,6); } },
      ] },
    gremlinleader: { id:'gremlinleader', name:'Gremlin Leader', hp:[140,146], art:'leader', tier:'elite', act:2,
      moves:[
        { id:'encourage', name:'Encourage', intent:'buff', act:(e)=>{ e.addStatus('strength',3); } },
        { id:'rally', name:'Rally!', intent:'buff', act:(e,g)=>{ g.spawnMinions('gremlin',2); } },
        { id:'stab', name:'Stab', intent:'attack', act:(e,g)=>{ g.enemyAttack(e,10); } },
      ] },
    bookofstabbing: { id:'bookofstabbing', name:'Book of Stabbing', hp:[164,172], art:'book', tier:'elite', act:2,
      moves:[
        { id:'stab', name:'Stab', intent:'attack', first:true, act:(e,g)=>{ g.enemyAttack(e,9); } },
        { id:'multi', name:'Multi Stab', intent:'attack', act:(e,g)=>{ let n=g.cardsPlayedThisTurn+1; for(let i=0;i<n;i++) g.enemyAttack(e,6); } },
      ] },
    bronzeautomaton: { id:'bronzeautomaton', name:'Bronze Automaton', hp:[350,350], art:'automaton', tier:'boss', act:2,
      moves:[
        { id:'boost', name:'Boost', intent:'buff', first:true, act:(e)=>{ e.addStatus('strength',2); } },
        { id:'hyperbeam', name:'Hyper Beam', intent:'attackDebuff', act:(e,g)=>{ g.enemyAttack(e,45); g.playerStatus('strength',-1); g.playerStatus('dexterity',-1); } },
        { id:'whirl', name:'Whirlwind', intent:'attack', act:(e,g)=>{ for(let i=0;i<5;i++) g.enemyAttack(e,7); } },
      ] },
    champ: { id:'champ', name:'The Champ', hp:[480,480], art:'champ', tier:'boss', act:2,
      moves:[
        { id:'defiant', name:'Defiant Stance', intent:'buff', first:true, act:(e)=>{ e.addStatus('strength',3); e.block+=10; } },
        { id:'facebreaker', name:'Face Breaker', intent:'attack', act:(e,g)=>{ g.enemyAttack(e,20); g.playerStatus('vulnerable',2); } },
        { id:'execute', name:'Execute', intent:'attack', act:(e,g)=>{ g.enemyAttack(e, e.hp<=0.5*e.maxHp?30:8 ); } },
      ] },

    // --- ACT 3 normals / elites / boss ---
    darkling: { id:'darkling', name:'Darkling', hp:[52,58], art:'darkling', tier:'normal', act:3,
      moves:[
        { id:'chomp', name:'Chomp', intent:'attack', weight:50, act:(e,g)=>{ g.enemyAttack(e,9); } },
        { id:'grow', name:'Grow', intent:'buff', weight:50, act:(e)=>{ e.addStatus('strength',3); } },
      ] },
    orbwalker: { id:'orbwalker', name:'Orb Walker', hp:[95,105], art:'orb', tier:'normal', act:3,
      moves:[
        { id:'laser', name:'Laser', intent:'attack', act:(e,g)=>{ g.enemyAttack(e,16); } },
        { id:'orbit', name:'Orbit', intent:'defend', act:(e)=>{ e.block+=12; } },
      ] },
    maw: { id:'maw', name:'The Maw', hp:[240,240], art:'maw', tier:'normal', act:3,
      moves:[
        { id:'chomp', name:'Chomp', intent:'attack', act:(e,g)=>{ g.enemyAttack(e,18); } },
        { id:'bellow', name:'Bellow', intent:'buff', act:(e)=>{ e.addStatus('strength',3); e.block+=12; } },
      ] },
    gianthead: { id:'gianthead', name:'Giant Head', hp:[500,500], art:'gianthead', tier:'elite', act:3,
      moves:[
        { id:'gaze', name:'Gaze', intent:'debuff', first:true, act:(e,g)=>{ g.playerStatus('weak',1); g.playerStatus('frail',1); } },
        { id:'smash', name:'Smash', intent:'attack', act:(e,g)=>{ g.enemyAttack(e, 5 + Math.floor(g.turn/2)); } },
      ] },
    nemesis: { id:'nemesis', name:'Nemesis', hp:[185,193], art:'nemesis', tier:'elite', act:3,
      moves:[
        { id:'scythe', name:'Scythe', intent:'attack', act:(e,g)=>{ for(let i=0;i<2;i++) g.enemyAttack(e,10); g.addStatusCard('burn'); } },
        { id:'attack', name:'Attack', intent:'attack', act:(e,g)=>{ g.enemyAttack(e,15); } },
      ] },
    awakenedone: { id:'awakenedone', name:'Awakened One', hp:[700,700], art:'awakened', tier:'boss', act:3,
      moves:[
        { id:'release', name:'Dark Torrent', intent:'attackDebuff', act:(e,g)=>{ for(let i=0;i<3;i++) g.enemyAttack(e,8); g.playerStatus('frail',2); } },
        { id:'ritual', name:'Ritual', intent:'buff', act:(e)=>{ e.addStatus('ritual',2); } },
        { id:'slash', name:'Terror', intent:'attack', act:(e,g)=>{ g.enemyAttack(e,22); } },
      ] },
    timeeater: { id:'timeeater', name:'Time Eater', hp:[720,720], art:'timeeater', tier:'boss', act:3,
      moves:[
        { id:'reverberate', name:'Reverberate', intent:'attack', act:(e,g)=>{ g.enemyAttack(e,8); } },
        { id:'headslam', name:'Head Slam', intent:'attack', act:(e,g)=>{ g.enemyAttack(e,26); e.block+=10; } },
        { id:'heal', name:'Reconstitute', intent:'buff', act:(e)=>{ e.heal(30); e.block+=20; } },
      ] },
  };

  // encounter tables per act
  const ENCOUNTERS = {
    1: {
      easy:[ ['cultist'], ['jawworm'], ['acidslime'], ['spikeslime'], ['louse','louse'], ['fungibeast'], ['gremlin','gremlin'], ['louse','fungibeast'] ],
      hard:[ ['jawworm','louse'], ['acidslime','spikeslime'], ['cultist','gremlin'], ['fungibeast','fungibeast'], ['spikeslime','louse','louse'] ],
      elite:[ ['gremlinnob'], ['lagavulin'], ['sentry','sentry','sentry'] ],
      boss:[ 'hexaghost', 'slimeboss', 'guardian' ],
    },
    2: {
      easy:[ ['chosen'], ['byrd','byrd'], ['centurion'], ['fungibeast','louse'], ['cultist','acidslime'] ],
      hard:[ ['centurion','byrd'], ['chosen','byrd'], ['centurion','centurion'], ['byrd','byrd','byrd'] ],
      elite:[ ['gremlinleader'], ['bookofstabbing'], ['lagavulin'] ],
      boss:[ 'bronzeautomaton', 'champ' ],
    },
    3: {
      easy:[ ['darkling'], ['darkling','darkling'], ['orbwalker'], ['maw'], ['jawworm','jawworm','jawworm'] ],
      hard:[ ['orbwalker','darkling'], ['maw','darkling'], ['orbwalker','orbwalker'] ],
      elite:[ ['gianthead'], ['nemesis'], ['reptomancer'] ],
      boss:[ 'awakenedone', 'timeeater' ],
    },
  };
  // minimal reptomancer definition (act3 elite) so tables stay valid
  ENEMIES.reptomancer = {
    id:'reptomancer', name:'Reptomancer', hp:[170,176], art:'reptomancer', tier:'elite', act:3,
    moves:[
      { id:'snake', name:'Summon Dagger', intent:'buff', first:true, act:(e,g)=>{ g.spawnMinions('louse',2); } },
      { id:'stab', name:'Stab', intent:'attack', act:(e,g)=>{ g.enemyAttack(e,10); } },
      { id:'venom', name:'Venom', intent:'attackDebuff', act:(e,g)=>{ g.enemyAttack(e,8); g.playerStatus('poison',3); } },
    ] };

  // ---- RELICS ---------------------------------------------------
  const RELICS = {
    burningblood: { id:'burningblood', name:'Burning Blood', desc:'Heal 6 HP after each combat.', tier:'starter',
      onCombatEnd:(g)=>{ g.healPlayer(6); } },
    vajra: { id:'vajra', name:'Vajra', desc:'At the start of combat, gain 1 Strength.', tier:'common',
      onCombatStart:(g)=>{ g.playerStatus('strength',1); } },
    anchor: { id:'anchor', name:'Anchor', desc:'At the start of combat, gain 10 Block.', tier:'common',
      onCombatStart:(g)=>{ g.gainBlock(10); } },
    bagofprep: { id:'bagofprep', name:'Bag of Prep', desc:'Draw 2 additional cards at the start of combat.', tier:'common',
      onCombatStart:(g)=>{ g.drawCards(2); } },
    orichalcum: { id:'orichalcum', name:'Orichalcum', desc:'If you end your turn with no Block, gain 6 Block.', tier:'common',
      onEndTurn:(g)=>{ if(g.player.block<=0) g.gainBlock(6); } },
    lantern: { id:'lantern', name:'Lantern', desc:'Gain 1 additional Energy on the first turn of combat.', tier:'common',
      onFirstTurn:(g)=>{ g.energy += 1; } },
   redskull: { id:'redskull', name:'Red Skull', desc:'While below 50% HP, gain 3 Strength.', tier:'common',
      onCombatStart:(g)=>{ if(g.player.hp < g.player.maxHp/2) g.playerStatus('strength',3); },
      onHPLow:(g)=>{ if(!g.flags._redskull && g.player.hp < g.player.maxHp/2){ g.flags._redskull=true; g.playerStatus('strength',3);} } },
    phonograph: { id:'phonograph', name:'Phonograph', desc:'The first Attack you play each combat applies 2 Vulnerable.', tier:'common',
      onPlayCard:(g,c)=>{ if(c.type==='attack' && !g.flags._phono){ g.flags._phono=true; for(const e of g.enemies) if(!e.dead) e.addStatus('vulnerable',2);} } },
     pennib: { id:'pennib', name:'Pen Nib', desc:'Every 10th Attack you play deals double damage.', tier:'uncommon' },
    oddmushroom: { id:'oddmushroom', name:'Odd Mushroom', desc:'Vulnerable and Weak applied to you last 1 turn less.', tier:'common' },
    sneckoeye: { id:'sneckoeye', name:'Snecko Eye', desc:'Draw 2 additional cards each turn. Card costs are randomized.', tier:'boss',
      onTurnStart:(g)=>{ g.drawCards(2); } },
    coffeedripper: { id:'coffeedripper', name:'Coffee Dripper', desc:'Gain 1 Energy each turn. Cannot Rest at campfires.', tier:'boss',
      energyBonus:1 },
    fusionhammer: { id:'fusionhammer', name:'Fusion Hammer', desc:'Gain 1 Energy each turn. Cannot Smith at campfires.', tier:'boss',
      energyBonus:1 },
    sozu: { id:'sozu', name:'Sozu', desc:'Gain 1 Energy each turn. Cannot use potions.', tier:'boss',
      energyBonus:1 },
    ectoplasm: { id:'ectoplasm', name:'Ectoplasm', desc:'Gain 1 Energy each turn. Gain no Gold from combat.', tier:'boss',
      energyBonus:1 },
    threadneedle: { id:'threadneedle', name:'Thread and Needle', desc:'Start each combat with 4 Plated Armor.', tier:'common',
      onCombatStart:(g)=>{ g.playerStatus('platedArmor',4); } },
    bronzescales: { id:'bronzescales', name:'Bronze Scales', desc:'Start combat with 3 Thorns.', tier:'common',
      onCombatStart:(g)=>{ g.playerStatus('thorns',3); } },
    shuriken: { id:'shuriken', name:'Shuriken', desc:'Every 3 Attacks played, gain 1 Strength.', tier:'uncommon',
      onPlayCard:(g,c)=>{ if(c.type==='attack'){ g.flags._shuriken=(g.flags._shuriken||0)+1; if(g.flags._shuriken%3===0) g.playerStatus('strength',1);} } },
    kunai: { id:'kunai', name:'Kunai', desc:'Every 3 Skills played, gain 1 Dexterity.', tier:'uncommon',
      onPlayCard:(g,c)=>{ if(c.type==='skill'){ g.flags._kunai=(g.flags._kunai||0)+1; if(g.flags._kunai%3===0) g.playerStatus('dexterity',1);} } },
    meatonthebone: { id:'meatonthebone', name:'Meat on the Bone', desc:'At the end of combat, heal 12 HP if below 50% HP.', tier:'boss',
      onCombatEnd:(g)=>{ if(g.player.hp<g.player.maxHp/2) g.healPlayer(12); } },
    girya: { id:'girya', name:'Girya', desc:'Raise your max HP by 5.', tier:'common',
      onPickup:(g)=>{ g.player.maxHp+=5; g.player.hp+=5; } },
  };

  // ---- POTIONS --------------------------------------------------
  const POTIONS = {
    block: { id:'block', name:'Block Potion', desc:'Gain 12 Block.', color:'#4a7fb5', use:(g)=>{ g.gainBlock(12); } },
    damage: { id:'damage', name:'Damage Potion', desc:'Deal 12 damage to target.', color:'#c0392b', target:'enemy', use:(g,e)=>{ g.dealDamage(g, e, 12, {noBlock:false}); } },
    strength: { id:'strength', name:'Strength Potion', desc:'Gain 2 Strength.', color:'#c0392b', use:(g)=>{ g.playerStatus('strength',2); } },
    dexterity: { id:'dexterity', name:'Dexterity Potion', desc:'Gain 2 Dexterity.', color:'#2e8b57', use:(g)=>{ g.playerStatus('dexterity',2); } },
    energy: { id:'energy', name:'Energy Potion', desc:'Gain 2 Energy.', color:'#e1b12c', use:(g)=>{ g.energy+=2; } },
    swift: { id:'swift', name:'Swift Potion', desc:'Draw 3 cards.', color:'#8e44ad', use:(g)=>{ g.drawCards(3); } },
    fear: { id:'fear', name:'Fear Potion', desc:'Apply 3 Vulnerable to target.', color:'#8e44ad', target:'enemy', use:(g,e)=>{ e.addStatus('vulnerable',3); } },
    weak: { id:'weak', name:'Weak Potion', desc:'Apply 3 Weak to ALL enemies.', color:'#7f8c8d', use:(g)=>{ for(const e of g.enemies) if(!e.dead) e.addStatus('weak',3); } },
    blood: { id:'blood', name:'Blood Potion', desc:'Heal 20% of Max HP.', color:'#c0392b', use:(g)=>{ g.healPlayer(Math.floor(g.player.maxHp*0.2)); } },
    explosive: { id:'explosive', name:'Explosive Potion', desc:'Deal 10 damage to ALL enemies.', color:'#d35400', use:(g)=>{ for(const e of [...g.enemies]) if(!e.dead) g.dealDamage(g,e,10); } },
    poison: { id:'poison', name:'Poison Potion', desc:'Apply 5 Poison to target.', color:'#27ae60', target:'enemy', use:(g,e)=>{ e.addStatus('poison',5); } },
    fire: { id:'fire', name:'Fire Potion', desc:'Deal 20 damage to target.', color:'#e74c3c', target:'enemy', use:(g,e)=>{ g.dealDamage(g,e,20); } },
  };

  // ---- EVENTS ---------------------------------------------------
  const EVENTS = {
    bigfish: {
      id:'bigfish', name:'Big Fish', text:'You come upon a fisherman, boat cast into the lake. He gestures to a large fish flopping around in the boat.',
      choices:[
        { text:'[Eat] Heal 12 HP.', act:(g)=>{ g.healPlayer(12); g.eventResult='すっきりと気分が晴れた。'; } },
        { text:'[Give it a hug] Gain 5 Max HP.', act:(g)=>{ g.player.maxHp+=5; g.player.hp+=5; g.eventResult='魚は気に入ったようだ。'; } },
        { text:'[Throw it back] Gain 75 Gold.', act:(g)=>{ g.gold+=75; g.eventResult='漁師が報酬を手渡した。'; } },
      ]},
    cleric: {
      id:'cleric', name:'The Cleric', text:'A strange figure stands at the foot of a large statue. He offers to heal your wounds... for a price.',
      choices:[
        { text:'[Pray] Heal 20% Max HP for 35 Gold.', cost:35, act:(g)=>{ g.healPlayer(Math.floor(g.player.maxHp*0.2)); g.eventResult='温かな光が全身を包んだ。'; } },
        { text:'[Leave]', act:(g)=>{ g.eventResult='その場を後にした。'; } },
      ]},
    deadadventurer: {
      id:'deadadventurer', name:'Dead Adventurer', text:'A bloody corpse lies here. A few possessions remain scattered nearby.',
      choices:[
        { text:'[Search] Take 25 Gold and a random potion.', act:(g)=>{ g.gold+=25; g.gainRandomPotion(); g.eventResult='戦利品を懐にしまった。'; } },
        { text:'[Say a prayer] Heal 8 HP.', act:(g)=>{ g.healPlayer(8); g.eventResult='冥福を祈った。'; } },
      ]},
    goldenidol: {
      id:'goldenidol', name:'Golden Idol', text:'A glittering statue sits upon a pedestal. A Sense of dread washes over you.',
      choices:[
        { text:'[Take the idol] Gain 125 Gold.', act:(g)=>{ g.gold+=125; g.eventResult='妙な気配が背後につきまとう。'; } },
        { text:'[Leave it]', act:(g)=>{ g.eventResult='賢明な判断だったかもしれない。'; } },
      ]},
    livingwall: {
      id:'livingwall', name:'Living Wall', text:'A massive face embedded in the stone regards you. It offers a bargain.',
      choices:[
        { text:'[Give 45 Gold] Get a random Relic.', cost:45, act:(g)=>{ g.gainRandomRelic(); g.eventResult='壁が満足げに鳴り響いた。'; } },
        { text:'[Leave]', act:(g)=>{ g.eventResult='壁は目を閉じた。'; } },
      ]},
    shininglight: {
      id:'shininglight', name:'Shining Light', text:'A brilliant light fills the chamber, and a voice offers to purify you.',
      choices:[
        { text:'[Accept] Remove a card from your deck.', act:(g)=>{ g.removeCardMode=true; } },
        { text:'[Decline] Heal 5 HP.', act:(g)=>{ g.healPlayer(5); g.eventResult='光は消え入った。'; } },
      ]},
    wheeloffate: {
      id:'wheeloffate', name:'Wheel of Fate', text:'A spinning wheel of runes. Fate awaits a bold soul.',
      choices:[
        { text:'[Spin] Gain 99 Gold... or lose 15 HP.', act:(g)=>{ if(Math.random()<0.5){g.gold+=99;g.eventResult='幸運が君に微笑んだ！';}else{g.damagePlayerDirect(15);g.eventResult='不運が襲いかかった！';} } },
        { text:'[Walk away]', act:(g)=>{ g.eventResult='誘惑に抗った。'; } },
      ]},
  };

  // status cards inserted into deck (curses / status)
  const STATUS_CARDS = {
    dazed: { id:'dazed', name:'Dazed', type:'status', rarity:'status', cost:null, target:'none', unplayable:true,
      text:'Unplayable. Ethereal.', textUp:'Unplayable. Ethereal.', effects:[] },
    burn: { id:'burn', name:'Burn', type:'status', rarity:'status', cost:null, target:'none', unplayable:true,
      text:'Unplayable. At the end of your turn, take 2 damage.', textUp:'Unplayable. At the end of your turn, take 2 damage.', effects:[] },
    hex: { id:'hex', name:'Hex', type:'status', rarity:'status', cost:null, target:'none', unplayable:true,
      text:'Unplayable. If this card is in your hand at the end of your turn, the enemy gains 1 Strength.', textUp:'Unplayable.', effects:[] },
    wound: { id:'wound', name:'Wound', type:'status', rarity:'status', cost:null, target:'none', unplayable:true,
      text:'Unplayable.', textUp:'Unplayable.', effects:[] },
  };

  // act configuration
  const ACTS = {
    1: { name:'The Overgrowth', bossPool:'boss', rows:15 },
    2: { name:'The City of the Dead', bossPool:'boss', rows:15 },
    3: { name:'The Shadowed Spire', bossPool:'boss', rows:15 },
  };

  root.GAME_DATA = { CARDS, COMMON_IDS, UNCOMMON_IDS, RARE_IDS, STATUSES, ENEMIES, ENCOUNTERS,
    RELICS, POTIONS, EVENTS, STATUS_CARDS, ACTS };
})(window);
