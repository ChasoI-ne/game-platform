/* ============================================================
   UI — rendering, SVG art, tooltips, interaction (Japanese UI)
   All item visuals reference dedicated SVG assets in sprites/.
   ============================================================ */
(function(root){
  'use strict';
  const D=root.GAME_DATA;
  const $=sel=>document.querySelector(sel);
  const el=(tag,cls,html)=>{const e=document.createElement(tag); if(cls)e.className=cls; if(html!==undefined)e.innerHTML=html; return e;};
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const icon=(name,cls)=>`<img class="icon ${cls||''}" src="sprites/ui/${name}.svg" alt="">`;
  const itemImg=id=>`<img class="item-img" src="sprites/items/textures/${id}.svg" alt="">`;
  const RARITY={basic:'基本',common:'コモン',uncommon:'アンコモン',rare:'レア',status:'ステータス',starter:'初期',boss:'ボス',normal:'通常',elite:'エリート'};
  const rar=v=>RARITY[v]||v;

  // ---------- dedicated vector enemy artwork (inline, original geometry) ----------
  function svg(body,extra){
    return `<svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="g" cx="40%" cy="30%"><stop offset="0" stop-color="#ffffff" stop-opacity=".26"/><stop offset="1" stop-color="#000000" stop-opacity=".18"/></radialGradient>
      <filter id="eyeGlow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <ellipse cx="60" cy="110" rx="40" ry="7" fill="#000" opacity=".45"/>${body}${extra||''}</svg>`;
  }
  function eyes(x1,x2,y,color,r){ r=r||5;color=color||'#ff4b3a';
    return `<g filter="url(#eyeGlow)"><circle cx="${x1}" cy="${y}" r="${r}" fill="${color}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${color}"/></g>`; }
  function creature(cfg){ const body=`<path d="${cfg.path}" fill="${cfg.fill||'#4a4a55'}" stroke="#111" stroke-width="2"/>`;
    return svg(body+`<path d="${cfg.path}" fill="url(#g)"/>`+eyes(cfg.ex1,cfg.ex2,cfg.ey,cfg.eye,cfg.er),cfg.extra); }
  const ART={
    cultist:()=>svg(`<path d="M60 20 C35 20 28 45 30 72 L34 102 L86 102 L90 72 C92 45 85 20 60 20Z" fill="#3b2f4a" stroke="#160f1e" stroke-width="2"/>
      <path d="M60 26 C44 26 40 48 42 70 L78 70 C80 48 76 26 60 26Z" fill="#0a0710"/><path d="M38 70 L82 70 L88 104 L32 104Z" fill="#2a2038" stroke="#160f1e" stroke-width="2"/>
      ${eyes(52,68,56,'#d33bff',4)}<path d="M50 82 Q60 90 70 82" stroke="#d33bff" fill="none" stroke-width="2"/>`),
    jawworm:()=>creature({fill:'#6b7a4a',path:'M22 78 Q18 40 60 38 Q102 40 98 78 Q96 102 60 102 Q24 102 22 78Z',ex1:48,ex2:72,ey:60,eye:'#ffe14b',er:6,
      extra:'<path d="M40 88 L46 74 L52 88 L58 74 L64 88 L70 74 L76 88" stroke="#2a2a18" stroke-width="3" fill="none"/>'}),
    slime:()=>svg(`<path d="M18 92 Q12 44 60 40 Q108 44 102 92 Q100 104 60 104 Q20 104 18 92Z" fill="#4aa86a" stroke="#1d5e38" stroke-width="2"/>
      <path d="M28 58 Q34 46 46 48" stroke="#9ff0b8" stroke-width="4" fill="none" opacity=".7"/>${eyes(46,74,66,'#0c3d20',6)}<path d="M48 84 Q60 92 72 84" stroke="#0c3d20" stroke-width="3" fill="none"/>`),
    louse:()=>creature({fill:'#7a2f28',path:'M32 80 Q24 44 60 42 Q96 44 88 80 Q84 100 60 100 Q36 100 32 80Z',ex1:48,ex2:72,ey:64,eye:'#ffcf3a',er:5,
      extra:'<path d="M38 46 L28 28 M82 46 L92 28 M50 42 L46 26 M70 42 L74 26" stroke="#4a1c17" stroke-width="3"/>'}),
    fungi:()=>creature({fill:'#8a5a6a',path:'M34 82 Q28 48 60 46 Q92 48 86 82 Q82 100 60 100 Q38 100 34 82Z',ex1:49,ex2:71,ey:66,eye:'#ff8ad0',er:5,
      extra:'<path d="M40 48 Q36 22 58 20 Q82 22 78 48Z" fill="#b07a8a" stroke="#5a3a45" stroke-width="2"/><circle cx="50" cy="34" r="4" fill="#f0c"/>'}),
    gremlin:()=>creature({fill:'#6a8a4a',path:'M40 82 Q34 52 60 50 Q86 52 80 82 Q76 100 60 100 Q44 100 40 82Z',ex1:50,ex2:70,ey:66,eye:'#ffe14b',er:5,
      extra:'<path d="M40 56 L20 42 L38 66 M80 56 L100 42 L82 66" fill="#6a8a4a" stroke="#33401f" stroke-width="2"/>'}),
    nob:()=>creature({fill:'#9a6a3a',path:'M26 84 Q20 42 60 38 Q100 42 94 84 Q90 104 60 104 Q30 104 26 84Z',ex1:46,ex2:74,ey:60,eye:'#ff3b1e',er:7,
      extra:'<path d="M34 46 L24 18 L48 40 M86 46 L96 18 L72 40" fill="#7a5228" stroke="#3a2410" stroke-width="3"/>'}),
    lagavulin:()=>svg(`<path d="M16 96 Q10 40 60 34 Q110 40 104 96 Q102 108 60 108 Q18 108 16 96Z" fill="#3a4a3a" stroke="#101a10" stroke-width="2"/>
      ${eyes(46,74,74,'#66ff88',5)}<path d="M44 90 Q60 98 76 90" stroke="#1a2a1a" stroke-width="4" fill="none"/>`),
    sentry:()=>svg(`<path d="M42 30 L78 30 L92 64 L78 100 L42 100 L28 64Z" fill="#5a6470" stroke="#1a1f26" stroke-width="3"/>
      <circle cx="60" cy="62" r="16" fill="#1a1f26"/><circle cx="60" cy="62" r="7" fill="#ff5a3a" filter="url(#eyeGlow)"/>`),
    hexaghost:()=>svg(`<path d="M60 12 L96 34 L96 78 L60 104 L24 78 L24 34Z" fill="#2a1f3a" stroke="#5a2f7a" stroke-width="2"/>
      <path d="M60 22 L84 38 L84 72 L60 90 L36 72 L36 38Z" fill="#170f24"/>${eyes(48,72,50,'#ff3ba0',5)}`),
    slimeboss:()=>svg(`<path d="M8 100 Q4 30 60 26 Q116 30 112 100 Q110 112 60 112 Q10 112 8 100Z" fill="#3f9a6a" stroke="#145c38" stroke-width="3"/>
      ${eyes(40,80,66,'#0a3a20',8)}<path d="M40 88 Q60 100 80 88" stroke="#0a3a20" stroke-width="4" fill="none"/>`),
    guardian:()=>svg(`<path d="M30 34 L90 34 L100 60 L86 100 L34 100 L20 60Z" fill="#7a6a4a" stroke="#2a2418" stroke-width="3"/>
      <rect x="46" y="56" width="28" height="14" rx="3" fill="#ffcc44" filter="url(#eyeGlow)"/>`),
    player:()=>svg(`<path d="M40 108 L40 66 Q40 46 60 46 Q80 46 80 66 L80 108Z" fill="#7a828c" stroke="#22262c" stroke-width="2"/>
      <path d="M46 48 Q60 30 74 48 L74 60 L46 60Z" fill="#9aa2ac" stroke="#22262c" stroke-width="2"/>${eyes(53,67,54,'#66b0ff',3)}
      <path d="M88 40 L96 96" stroke="#c8c8d0" stroke-width="6"/><path d="M26 66 L26 96 Q26 104 36 104 L40 104 L40 66Z" fill="#5a6270" stroke="#22262c" stroke-width="2"/>`),
  };
  const artFor=k=>(ART[k]||ART.gremlin)();
  // Act 1 uses the richer inline art; later acts use their dedicated SVG asset.
  const enemyArt=e=>ART[e.art] ? ART[e.art]() : `<img class="enemy-img" src="sprites/enemies/${e.id}.svg" alt="">`;

  // ---------- UI ----------
  const UI={
    game:null, selectedCard:null, selectedPotion:null,
    init(game){
      this.game=game; game.ui=this;
      document.addEventListener('click',e=>this.onClick(e));
      document.addEventListener('contextmenu',e=>{
        const pot=e.target.closest('.potion-slot[data-act="potion"]');
        if(pot){ e.preventDefault(); game.discardPotion(parseInt(pot.dataset.slot)); return; }
        if(e.target.closest('[data-act]')) e.preventDefault();
      });
      document.addEventListener('mouseover',e=>this.onHover(e));
      document.addEventListener('mousemove',e=>this.moveTooltip(e));
      document.addEventListener('mouseout',e=>this.onOut(e));
      window.addEventListener('keydown',e=>this.onKey(e));
    },
    render(){
      const g=this.game, app=$('#app');
      if(this._lastScreen && this._lastScreen!==g.screen){ const m=document.getElementById('pileModal'); if(m)m.remove(); }
      this._lastScreen=g.screen;
      app.innerHTML='';
      if(g.screen==='title'){ app.appendChild(this.title()); return; }
      app.appendChild(this.topbar());
      const s=el('div','screen');
      switch(g.screen){
        case 'map': s.appendChild(this.map()); break;
        case 'combat': s.appendChild(this.combat()); break;
        case 'reward': s.appendChild(this.reward()); break;
        case 'rest': s.appendChild(this.rest()); break;
        case 'shop': s.appendChild(this.shop()); break;
        case 'treasure': s.appendChild(this.treasure()); break;
        case 'event': s.appendChild(this.event()); break;
        case 'deckSelect': s.appendChild(this.deckSelect()); break;
        case 'defeat': s.appendChild(this.result(false)); break;
        case 'victory': s.appendChild(this.result(true)); break;
        default: s.appendChild(this.map());
      }
      app.appendChild(s);
      $('#tooltip').classList.add('hidden');
    },

    topbar(){
      const g=this.game, t=el('div','topbar');
      t.innerHTML=`<div class="brand">SLAY THE SPIRE<small>第${g.act}幕 · ${esc(D.ACTS[g.act].name)}</small></div>
        <div class="stat">${icon('heart')}<div class="hpbar"><div class="fill" style="width:${100*g.hp/g.maxHp}%"></div><div class="txt">${g.hp} / ${g.maxHp}</div></div></div>
        <div class="stat">${icon('coin')}<b class="gold">${g.gold}</b></div>
        <div class="stat">${icon('map')} ${g.currentRow<0?0:g.currentRow+1} / 15 階</div>
        <div class="spacer"></div>
        <div class="relic-row">${g.relics.map(r=>`<div class="relic" data-tip="relic:${r}">${itemImg(r)}</div>`).join('')}</div>
        <div class="potion-row">${g.potions.map((p,i)=>p?`<div class="potion-slot" data-act="potion" data-slot="${i}" data-tip="potion:${p}">${itemImg(p)}</div>`:`<div class="potion-slot empty" data-tip="raw:空のポーションスロット">${icon('potion')}</div>`).join('')}</div>
        <button class="btn small save-btn" data-act="save">${icon('save')} 保存</button>`;
      return t;
    },

    title(){
      const w=el('div','screen title-screen');
      w.innerHTML=`<div class="title-emblem">${icon('sword')}</div>
        <h1 class="title-font">Slay the Spire</h1>
        <div class="sub">尖塔を登れ · Web版</div>
        <div class="title-menu">
          <button class="btn primary" data-act="newRun">${icon('battle')} 新しい冒険</button>
          ${this.game.hasSave()?`<button class="btn" data-act="load">${icon('save')} 続きから</button>`:''}
          <button class="btn" data-act="help">${icon('help')} 遊び方</button>
        </div>
        <div class="title-foot">ファンメイドのトリビュート · アイアンクラッド · 全3幕</div>`;
      return w;
    },

    map(){
      const g=this.game, wrap=el('div','map-wrap'), inner=el('div','map-inner');
      const ROW=15, y0=150, dy=88, x0=380, dx=112, height=y0+(ROW-1)*dy+80;
      const pos={};
      g.map.forEach((row,r)=>row.forEach((n,c)=>{ pos[n.id]={ x:x0+(c-(row.length-1)/2)*dx, y:y0+(ROW-1-n.row)*dy }; }));
      let lines='';
      g.map.forEach(row=>row.forEach(n=>{ const a=pos[n.id]; if(!a)return;
        n.next.forEach(id=>{ const b=pos[id]; if(!b)return; const lit=n.visited;
          lines+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${lit?'#c9a227':'#4a3a2a'}" stroke-width="${lit?3:2}" opacity="${lit?.75:.5}" stroke-dasharray="${lit?'':'6 6'}"/>`; });
      }));
      inner.innerHTML=`<div class="map-title title-font">${esc(D.ACTS[g.act].name)}</div>
        <div class="map-sub">進む道を選べ · 現在地 ${g.currentRow+1} / 15 階</div>
        <svg class="map-svg" style="height:${height}px">${lines}</svg>`;
      const LBL={monster:'戦闘',elite:'エリート',rest:'野営',shop:'商店',treasure:'宝箱',event:'事件',boss:'ボス'};
      const ICO={monster:'battle',elite:'elite',rest:'campfire',shop:'shop',treasure:'treasure',event:'event',boss:'boss'};
      g.map.forEach(row=>row.forEach(n=>{
        const p=pos[n.id];
        const cls=['map-node',n.visited?'visited':'',n.reachable?'reachable':'',g.currentNode&&g.currentNode.id===n.id?'current':'',n.reachable?'':'locked'].join(' ');
        const node=el('div',cls);
        node.dataset.act='node'; node.dataset.id=n.id; node.dataset.type=n.type;
        node.style.left=p.x+'px'; node.style.top=p.y+'px'; node.setAttribute('data-tip','node:'+n.type);
        node.innerHTML=`${icon(ICO[n.type])}<span class="lbl">${LBL[n.type]}</span>`;
        inner.appendChild(node);
      }));
      inner.style.height=height+'px'; wrap.appendChild(inner);
      requestAnimationFrame(()=>{ wrap.scrollTop=wrap.scrollHeight; });
      return wrap;
    },

    combat(){
      const g=this.game, w=el('div','combat');
      w.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column';
      const arena=el('div','combat-arena');
      arena.innerHTML=`<div class="combat-bg"></div><div class="enemies">${g.enemies.map(e=>this.enemyHTML(e)).join('')}</div>
        <div class="player-side">
          <div class="player-block" data-tip="raw:ブロック — 受けるダメージを吸収する">${icon('block')}<span>${g.player.block}</span></div>
          <div class="player-art">${artFor('player')}</div>
          <div class="player-status status-row">${this.statusHTML(g.player)}</div>
          <div class="player-name">アイアンクラッド</div>
        </div>
        <div class="combat-hud">
          <div class="pile" data-act="viewPile" data-pile="draw" data-tip="raw:山札 — クリックで表示">${icon('draw')}<div class="n">${g.drawPile.length}</div>山札</div>
          <div class="energy-orb" data-tip="raw:エネルギー — カードを出すのに使う">${icon('energy')}<div class="v">${g.energy}</div><div class="l">エネルギー</div></div>
          <div class="pile" data-act="viewPile" data-pile="discard" data-tip="raw:捨て札 — クリックで表示">${icon('discard')}<div class="n">${g.discardPile.length}</div>捨て札</div>
        </div>
        <button class="btn end-turn-btn" data-act="endTurn">ターン終了 ⏎</button>`;
      w.appendChild(arena);
      const handArea=el('div','hand-area'), hand=el('div','hand'), n=g.hand.length;
      g.hand.forEach((c,i)=>{
        const off=i-(n-1)/2, rot=off*3.2, lift=Math.abs(off)*4;
        const tmp=el('div'); tmp.innerHTML=this.cardHTML(c,{inHand:true,playable:g.canPlay(c)});
        const card=tmp.firstChild;
        card.style.transform=`rotate(${rot}deg) translateY(${lift}px)`;
        card.dataset.act='card'; card.dataset.uid=c.uid; card.dataset.idx=i;
        hand.appendChild(card);
      });
      handArea.appendChild(hand); w.appendChild(handArea);
      return w;
    },

    enemyHTML(e){
      const g=this.game, it=e.intent||{kind:'unknown'};
      const ICON={attack:'attack',attackDefend:'attack',defend:'block',buff:'upgrade',debuff:'weak',attackDebuff:'attack',attackBuff:'attack',sleep:'help',unknown:'help'};
      const LABEL={attack:'攻撃',attackDefend:'攻撃＋防御',defend:'防御',buff:'強化',debuff:'弱化',attackDebuff:'攻撃＋弱化',attackBuff:'攻撃＋強化',sleep:'睡眠中',unknown:'不明'};
      let dmgHTML='';
      if(it.dmg || it.dynamic){
        let d=it.dmg||0, times=it.times||1;
        if(it.dynamic==='halfHp') d=Math.ceil(g.player.hp/2);
        else if(it.dynamic==='giantHead') d=5+Math.floor(g.turn/2);
        else if(it.dynamic==='champExecute') d=e.hp<=e.maxHp/2?30:8;
        else if(it.dynamic==='cards') times=g.cardsPlayedThisTurn+1;
        const adj=g.calcAttack(e,g.player,d);
        dmgHTML=`<span class="intent-dmg ${g.player.statuses.vulnerable?'vuln':''}">${adj}${times>1?' × '+times:''}</span>`;
      }
      const selected=this.selectedCard&&g.hand.find(c=>c.uid===this.selectedCard);
      const targetable=!!(selected&&g.cardDef(selected).target==='enemy');
      return `<div class="enemy ${e.dead?'dead':''} ${targetable?'targeted':''}" data-act="enemy" data-slot="${e.slot}" data-tip="enemy:${e.id}">
        <div class="enemy-intent" data-tip="intent:${e.id}">${icon(ICON[it.kind]||'help')}${dmgHTML}<span class="muted intent-label">${LABEL[it.kind]||'不明'}</span></div>
        <div class="enemy-art">${enemyArt(e)}</div>
        <div class="enemy-name">${esc(e.name)}</div>
        ${e.block?`<div class="enemy-block">${icon('block')}${e.block}</div>`:''}
        <div class="hpbar enemy-hp"><div class="fill" style="width:${100*e.hp/e.maxHp}%"></div><div class="txt">${e.hp}/${e.maxHp}</div></div>
        <div class="status-row">${this.statusHTML(e)}</div>
      </div>`;
    },

    statusHTML(ent){
      const out=[];
      for(const s in ent.statuses){ const n=ent.statuses[s]; if(!n)continue;
        const def=D.STATUSES[s]||{name:s,desc:''};
        const cls=def.bad?'bad':'good';
        out.push(`<span class="status-chip ${cls}" data-tip="status:${s}">${icon(s in {vulnerable:1,weak:1,strength:1,dexterity:1,frail:1,poison:1,ritual:1,artifact:1,thorns:1,platedArmor:1}?s:'gem')} ${n}</span>`);
      }
      return out.join('');
    },

    cardHTML(c,opts){
      opts=opts||{}; const def=this.game.cardDef(c), cost=this.game.cardCost(c);
      const cls=['card',(!opts.playable!==false&&opts.inHand&&!this.game.canPlay(c))?'unplayable':'',c.upgraded?'upgraded':''].join(' ');
      const type=def.type||'attack';
      let desc=this.game.cardText(c);
      desc=esc(desc).replace(/(ダメージ|ブロック|脆弱|弱体|力量|敏捷|毒|エネルギー|消耗|最大HP|HP)/g,'<span class="kw">$1</span>');
      const rarity=def.rarity==='basic'?'':rar(def.rarity);
      const tip=opts.tip || ('card:'+c.uid);
      return `<div class="${cls}" data-type="${type}" ${opts.attrs||''} data-tip="${esc(tip)}">
        <div class="cost">${cost===null?'—':cost}</div>
        <div class="rarity">${rarity}</div>
        <div class="cname">${esc(this.game.cardName(c))}</div>
        <div class="art">${itemImg(c.id)}</div>
        <div class="desc">${desc}</div>
        <div class="ctype">${({attack:'攻撃',skill:'スキル',power:'パワー',status:'ステータス'})[type]||type}</div>
      </div>`;
    },

    reward(){
      const g=this.game,r=g.reward||{}, w=el('div','screen-panel');
      w.innerHTML=`<div class="panel-box">
        <h2>勝利！</h2><div class="flavor">先へ進む道が開けた……</div>
        <div class="reward-row">
          ${r.gold?`<div class="reward-icon" data-act="rewardGold"><div class="big">${icon('coin')}</div><div>${r.gold} ゴールド</div><button class="btn small">受け取る</button></div>`:''}
          ${r.potion?`<div class="reward-icon" data-act="rewardPotion"><div class="big">${itemImg(r.potion)}</div><div>${esc(D.POTIONS[r.potion].name)}</div><button class="btn small">受け取る</button></div>`:''}
          ${r.relic?`<div class="reward-icon" data-act="rewardRelic"><div class="big">${itemImg(r.relic)}</div><div>${esc(D.RELICS[r.relic].name)}</div><button class="btn small">受け取る</button></div>`:''}
        </div>
        ${r.cards&&r.cards.length?`<div class="flavor" style="margin-top:8px">デッキに加えるカードを選べ:</div>
          <div class="reward-cards">${r.cards.map(id=>{
            const c=g.makeCard(id), def=g.cardDef(c);
            const tip=`<h4>${esc(g.cardName(c))}</h4><div class="tt-sub">${({attack:'攻撃',skill:'スキル',power:'パワー'})[def.type]} · ${rar(def.rarity)}</div>${esc(g.cardText(c))}`;
            return this.cardHTML(c,{attrs:`data-act="rewardCard" data-id="${id}"`,tip:'raw:'+tip});
          }).join('')}</div>`:''}
        <div class="panel-actions"><button class="btn primary" data-act="skipReward">次へ →</button></div>
      </div>`;
      return w;
    },

    rest(){
      const g=this.game, w=el('div','screen-panel');
      w.innerHTML=`<div class="panel-box">
        <h2>野営</h2><div class="flavor">尖塔の影で、ひと息つく。</div>
        <div class="rest-options">
          <div class="rest-opt" data-act="rest" data-choice="rest"><div class="ico">${icon('campfire')}</div><h3>休息</h3><p>HPを<b>${Math.floor(g.maxHp*0.3)}</b>回復する。${g.hasRelic('coffeedripper')?'<br><span class="warn">コーヒードリッパーが邪魔をする。</span>':''}</p></div>
          <div class="rest-opt" data-act="rest" data-choice="smith"><div class="ico">${icon('upgrade')}</div><h3>鍛冶</h3><p>デッキのカードを1枚<code>強化</code>する。${g.hasRelic('fusionhammer')?'<br><span class="warn">融合ハンマーが邪魔をする。</span>':''}</p></div>
          <div class="rest-opt" data-act="rest" data-choice="leave"><div class="ico">${icon('endturn')}</div><h3>立ち去る</h3><p>何もせず、次の階へ進む。</p></div>
        </div>
      </div>`;
      return w;
    },

    shop(){
      const g=this.game,s=g.shop||{}, w=el('div','screen-panel');
      const cardItems=(s.cards||[]).map((it,i)=>`<div class="shop-item ${it.sold?'sold':''}">
        <div class="nm">${esc(D.CARDS[it.id].name)} <span class="muted">(${({common:'コモン',uncommon:'アンコモン',rare:'レア'})[D.CARDS[it.id].rarity]||''})</span></div><div class="price">${icon('coin')}${it.price}</div>
        <button class="btn small buy" data-act="buy" data-kind="cards" data-idx="${i}" ${it.sold||g.gold<it.price?'disabled':''}>購入</button></div>`).join('');
      const relicItems=(s.relics||[]).map((it,i)=>`<div class="shop-item ${it.sold?'sold':''}">
        <div class="mini-item">${itemImg(it.id)}</div><div class="nm">${esc(D.RELICS[it.id].name)}</div><div class="price">${icon('coin')}${it.price}</div>
        <button class="btn small buy" data-act="buy" data-kind="relics" data-idx="${i}" ${it.sold||g.gold<it.price?'disabled':''}>購入</button></div>`).join('');
      const potItems=(s.potions||[]).map((it,i)=>`<div class="shop-item ${it.sold?'sold':''}">
        <div class="mini-item">${itemImg(it.id)}</div><div class="nm">${esc(D.POTIONS[it.id].name)}</div><div class="price">${icon('coin')}${it.price}</div>
        <button class="btn small buy" data-act="buy" data-kind="potions" data-idx="${i}" ${it.sold||g.gold<it.price?'disabled':''}>購入</button></div>`).join('');
      w.innerHTML=`<div class="panel-box wide">
        <h2>商人</h2><div class="flavor">「冒険者さん、ただでは売りませんよ」 · 所持金 <b class="gold">${g.gold}</b></div>
        <div class="shop-grid">
          <div class="shop-col"><h3>カード</h3>${cardItems}</div>
          <div class="shop-col"><h3>遺物</h3>${relicItems}</div>
          <div class="shop-col"><h3>ポーション</h3>${potItems}
            <button class="btn small" style="margin-top:8px" data-act="buyRemove" ${s.removeUsed||g.gold<s.removePrice?'disabled':''}>カードを除去 · ${icon('coin')}${s.removePrice||75}</button>
          </div>
        </div>
        <div class="panel-actions"><button class="btn primary" data-act="leaveShop">店を出る →</button></div>
      </div>`;
      return w;
    },

    treasure(){
      const g=this.game,t=g.treasure||{}, w=el('div','screen-panel');
      w.innerHTML=`<div class="panel-box">
        <h2>宝箱！</h2><div class="treasure-chest">${icon('chest')}</div>
        ${t.taken?`<div class="flavor"><b class="gold">${t.gold} ゴールド</b>${t.relic?`、遺物「<b>${esc(D.RELICS[t.relic].name)}</b>」`:''}${t.potion?`、そして「${esc(D.POTIONS[t.potion].name)}」`:''}を手に入れた。</div>
          <div class="panel-actions"><button class="btn primary" data-act="leaveTreasure">次へ →</button></div>`
        :`<div class="flavor">見事な宝箱。中には財宝が光っている。</div>
          <div class="panel-actions"><button class="btn primary" data-act="takeTreasure">宝箱を開ける</button></div>`}
      </div>`;
      return w;
    },

    event(){
      const g=this.game,ev=g.event||{}, w=el('div','screen-panel');
      w.innerHTML=`<div class="panel-box">
        <div class="event-art">${icon(ev.id==='goldenidol'?'coin':ev.id==='cleric'?'help':ev.id==='deadadventurer'?'elite':ev.id==='bigfish'?'battle':ev.id==='livingwall'?'block':ev.id==='shininglight'?'power':'event')}</div>
        <h2>${esc(ev.name)}</h2><div class="event-text">${esc(ev.text)}</div>
        ${!g.eventResult?`<div class="event-choices">${ev.choices.map((c,i)=>`<button class="event-choice" data-act="eventChoice" data-idx="${i}">${esc(c.text)}</button>`).join('')}</div>`
        :`<div class="event-result">${esc(g.eventResult)}</div><div class="panel-actions"><button class="btn primary" data-act="finishEvent">次へ →</button></div>`}
      </div>`;
      return w;
    },

    deckSelect(){
      const g=this.game, w=el('div','screen-panel');
      w.innerHTML=`<div class="panel-box wide">
        <h2>${g.smithMode?'鍛冶 — 強化するカードを選ぶ':'除去 — 削除するカードを選ぶ'}</h2>
        <div class="flavor">${g.smithMode?'カードを1枚選び、この冒険の間ずっと強化する。':'カードを1枚選び、デッキから永久に除去する。'}</div>
        <div class="deck-grid">${g.deck.map(c=>this.cardHTML(c,{attrs:`data-act="deckCard" data-uid="${c.uid}"`})).join('')}</div>
        <div class="panel-actions">${!g.smithMode&&!g.removeCardMode?'<button class="btn" data-act="cancelDeck">キャンセル</button>':''}</div>
      </div>`;
      return w;
    },

    result(win){
      const g=this.game, w=el('div',`screen-panel ${win?'victory':'defeat'}`);
      w.innerHTML=`<div class="big-result">${win?'尖塔は陥落した':'敗北'}</div>
        <div class="result-sub">${win?'尖塔を制し、生還を果たした。':'ここで旅は終わり、尖塔に飲み込まれた。'}</div>
        <div class="flavor" style="font-size:15px">到達した幕: <b class="gold">${g.act}</b> · デッキ: <b>${g.deck.length}</b> 枚 · ゴールド: <b class="gold">${g.gold}</b></div>
        <div class="panel-actions"><button class="btn primary" data-act="newRun">新しい冒険</button><button class="btn" data-act="toTitle">タイトルへ</button></div>`;
      return w;
    },

    showPile(kind){
      const g=this.game, cards=kind==='draw'?g.drawPile.slice().sort(()=>Math.random()-0.5):g.discardPile;
      const overlay=el('div','screen-panel'); overlay.id='pileModal'; overlay.style.zIndex=150;
      overlay.innerHTML=`<div class="panel-box wide"><h2>${kind==='draw'?'山札':'捨て札'}</h2>
        <div class="deck-grid">${cards.map(c=>this.cardHTML(c)).join('')||'<div class="flavor">空だ。</div>'}</div>
        <div class="panel-actions"><button class="btn primary" data-act="closeModal">閉じる</button></div></div>`;
      document.body.appendChild(overlay);
    },

    showHelp(){
      const overlay=el('div','screen-panel'); overlay.id='pileModal'; overlay.style.zIndex=150;
      overlay.innerHTML=`<div class="panel-box wide" style="text-align:left"><h2 class="center">遊び方</h2>
        <div class="help-body">
        <p><b class="gold">目的:</b> 尖塔の全3幕を登りきれ。各幕は15階で、最後はボス戦。最終ボスを倒せば勝利だ。</p>
        <p><b class="gold">戦闘:</b> 毎ターン<b>エネルギー3</b>を得て、カードを<b>5枚</b>引く。カードをクリックして使う（攻撃は敵を選ぶ）。ターン終了はボタンまたは<kbd>Enter</kbd>。</p>
        <p><b class="gold">ブロック</b>はダメージを吸収するが、自分のターン開始時に消える。<b>脆弱</b>(攻撃を50%多く受ける)や<b>弱体</b>(攻撃ダメージが25%減)は毎ターン減る。</p>
        <p><b class="gold">マップ:</b> 道を選んで進め。戦闘でゴールドとカード、エリートで遺物、野営で回復や強化、商店で買い物、事件で選択ができる。</p>
        <p><b class="gold">デッキ:</b> 初期デッキは打撃×5、防御×4、殴打×1。登るほど強いカードを加えろ。キー: <kbd>1</kbd>〜<kbd>9</kbd>でカード、<kbd>Enter</kbd>でターン終了、<kbd>Esc</kbd>で選択解除。</p>
        </div><div class="panel-actions"><button class="btn primary" data-act="closeModal">わかった</button></div></div>`;
      document.body.appendChild(overlay);
    },

    onClick(e){
      const t=e.target.closest('[data-act]'); if(!t)return;
      const g=this.game, act=t.dataset.act;
      switch(act){
        case 'newRun': g.deleteSave(); g.newRun(); break;
        case 'load': if(!g.load()){ this.toast('セーブデータを読み込めませんでした'); g.screen='title'; g.refresh(); } break;
        case 'save': this.toast(g.save()?'セーブしました':'この画面ではセーブできません'); break;
        case 'help': this.showHelp(); break;
        case 'closeModal': { const m=$('#pileModal'); if(m)m.remove(); break; }
        case 'toTitle': g.screen='title'; g.refresh(); break;
        case 'node': g.enterNode(t.dataset.id); break;
        case 'card': this.clickCard(parseInt(t.dataset.uid)); break;
        case 'enemy': this.clickEnemy(parseInt(t.dataset.slot)); break;
        case 'endTurn': g.endTurn(); break;
        case 'potion': this.clickPotion(parseInt(t.dataset.slot)); break;
        case 'viewPile': this.showPile(t.dataset.pile); break;
        case 'rewardGold': g.takeRewardGold(); break;
        case 'rewardCard': g.takeRewardCard(t.dataset.id); break;
        case 'rewardPotion': g.takeRewardPotion(); break;
        case 'rewardRelic': g.takeRewardRelic(); break;
        case 'skipReward': g.skipReward(); break;
        case 'rest': g.restChoice(t.dataset.choice); break;
        case 'buy': g.buy(t.dataset.kind,parseInt(t.dataset.idx)); break;
        case 'buyRemove': g.buyRemove(); break;
        case 'leaveShop': g.finishNode(); break;
        case 'takeTreasure': g.takeTreasure(); break;
        case 'leaveTreasure': g.finishNode(); break;
        case 'eventChoice': g.eventChoice(parseInt(t.dataset.idx)); break;
        case 'finishEvent': g.finishEvent(); break;
        case 'deckCard': g.selectDeckCard(parseInt(t.dataset.uid)); break;
        case 'cancelDeck': g.smithMode=false;g.removeCardMode=false;g.screen=g._returnScreen||'map';g._returnScreen=null;g.refresh(); break;
      }
    },
    clickCard(uid){
      const g=this.game,c=g.hand.find(x=>x.uid===uid); if(!c)return;
      if(g.cardDef(c).unplayable){ this.toast('このカードは使用できない'); return; }
      if(!g.canPlay(c)){ this.toast('エネルギーが足りない'); return; }
      const def=g.cardDef(c);
      if(def.target==='enemy'&&g.enemies.some(e=>!e.dead)){
        this.selectedCard=this.selectedCard===uid?null:uid; this.selectedPotion=null; this.render();
        if(this.selectedCard) this.toast('対象を選べ');
      } else { const alive=g.enemies.find(e=>!e.dead); g.playCard(uid,alive?alive.slot:undefined); }
    },
    clickEnemy(slot){
      const g=this.game;
      if(this.selectedCard){ g.playCard(this.selectedCard,slot); this.selectedCard=null; return; }
      if(this.selectedPotion!==null){ g.usePotion(this.selectedPotion,slot); this.selectedPotion=null; }
    },
    clickPotion(slot){
      const g=this.game,id=g.potions[slot]; if(!id)return;
      if(g.hasRelic('sozu')){ this.toast('ソウがポーション使用を妨げる'); return; }
      const pot=D.POTIONS[id];
      if(pot.target){ this.selectedPotion=slot; this.selectedCard=null; this.render(); this.toast(pot.name+'の対象を選べ'); }
      else g.usePotion(slot);
    },
    onKey(e){
      const g=this.game;
      if(e.key==='Escape'){ this.selectedCard=null;this.selectedPotion=null;this.render();return; }
      if(g.screen!=='combat')return;
      if(e.key==='Enter'||e.key==='e'){ g.endTurn(); return; }
      if(/^[1-9]$/.test(e.key)){ const c=g.hand[parseInt(e.key)-1]; if(c)this.clickCard(c.uid); }
    },

    onHover(e){ const t=e.target.closest('[data-tip]'); if(!t)return; this._tipKey=t.dataset.tip; this.showTooltip(); },
    onOut(e){
      const t=e.target.closest('[data-tip]'); if(!t)return;
      if(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest('[data-tip]')===t)return;
      $('#tooltip').classList.add('hidden');
    },
    moveTooltip(e){
      const tt=$('#tooltip'); if(tt.classList.contains('hidden'))return;
      let x=e.clientX+16,y=e.clientY+16;
      if(x+300>window.innerWidth)x=e.clientX-300;
      if(y+200>window.innerHeight)y=e.clientY-200;
      tt.style.left=x+'px'; tt.style.top=y+'px';
    },
    showTooltip(){
      const key=this._tipKey; if(!key)return; const tt=$('#tooltip'), g=this.game;
      let html=''; const [kind,val]=key.split(':');
      if(kind==='card'){
        const c=g.hand.concat(g.drawPile,g.discardPile,g.exhaustPile,g.deck).find(x=>x.uid==val);
        if(!c){tt.classList.add('hidden');return;}
        const def=g.cardDef(c);
        html=`<h4>${esc(g.cardName(c))}</h4><div class="tt-sub">${({attack:'攻撃',skill:'スキル',power:'パワー',status:'ステータス'})[def.type]} · ${rar(def.rarity)} · ${g.cardCost(c)===null?'—':g.cardCost(c)} エネルギー</div>${g.cardText(c)}`;
      } else if(kind==='status'){
        const s=D.STATUSES[val]; if(!s){tt.classList.add('hidden');return;}
        html=`<h4>${s.name}</h4><div class="${s.bad?'tt-bad':'tt-good'}">${s.desc}</div>`;
      } else if(kind==='relic'){
        const r=D.RELICS[val]; if(!r){tt.classList.add('hidden');return;}
        html=`<h4>${esc(r.name)}</h4><div class="tt-sub">遺物 · ${rar(r.tier)}</div>${esc(r.desc)}`;
      } else if(kind==='potion'){
        const p=D.POTIONS[val]; if(!p){tt.classList.add('hidden');return;}
        html=`<h4>${esc(p.name)}</h4><div class="tt-sub">ポーション</div>${esc(p.desc)}<div class="tt-sub">右クリックで捨てる</div>`;
      } else if(kind==='enemy'){
        const e=g.enemies.find(x=>x.id===val); if(!e){tt.classList.add('hidden');return;}
        html=`<h4>${esc(e.name)}</h4><div class="tt-sub">${rar(e.tier)} · ${e.hp}/${e.maxHp} HP</div><div>技: ${esc(e.def.moves.map(m=>m.name).join('、'))}</div>`;
      } else if(kind==='intent'){
        const e=g.enemies.find(x=>x.id===val); if(!e){tt.classList.add('hidden');return;}
        html=`<h4>予告: ${esc(e.currentMove?e.currentMove.name:'不明')}</h4><div class="tt-sub">この敵が次のターンに行う行動だ。</div>`;
      } else if(kind==='node'){
        const names={monster:'敵と戦う。ゴールドとカード報酬を得る。',elite:'強敵。遺物と良い報酬が手に入る。',rest:'休息で回復、または鍛冶で強化。',shop:'ゴールドでカード・遺物・ポーションを買う。',treasure:'ゴールドと遺物、時々ポーション。',event:'選択肢のある出来事が起こる。',boss:'この幕のボス。難しいが報酬も大きい。'};
        html=`<h4>${({monster:'戦闘',elite:'エリート',rest:'野営',shop:'商店',treasure:'宝箱',event:'事件',boss:'ボス'})[val]||val}</h4><div>${names[val]||''}</div>`;
      } else if(kind==='raw') html=val;
      if(!html){tt.classList.add('hidden');return;}
      tt.innerHTML=html; tt.classList.remove('hidden');
    },

    toast(msg){
      const t=$('#toast'); t.textContent=msg; t.classList.add('show');
      clearTimeout(this._toastT); this._toastT=setTimeout(()=>t.classList.remove('show'),1400);
    },
    onDamage(target,dmg,heal){
      if(dmg==null||dmg<=0)return;
      let x,y;
      if(target===this.game.player){ x=window.innerWidth*0.09; y=window.innerHeight*0.5; }
      else {
        const idx=this.game.enemies.indexOf(target), nodes=document.querySelectorAll('.enemy-art'), node=nodes[idx];
        if(node){ const r=node.getBoundingClientRect(); x=r.left+r.width/2; y=r.top+r.height/2; }
        else { x=window.innerWidth*0.6; y=window.innerHeight*0.25; }
      }
      const f=el('div','floater'+(heal?' heal':''),(heal?'+':'−')+dmg);
      f.style.left=x+'px'; f.style.top=y+'px'; $('#floaters').appendChild(f); setTimeout(()=>f.remove(),1000);
    },
  };
  root.UI=UI;
})(window);
