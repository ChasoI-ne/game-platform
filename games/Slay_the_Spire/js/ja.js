/* ============================================================
   LOCALIZATION — Japanese display text for all game data.
   Internal ids stay in English; only player-facing strings change.
   ============================================================ */
(function (root) {
  'use strict';
  const D = root.GAME_DATA;
  if (!D) return;

  const CARDS = {
    strike:{name:'打撃',text:'6ダメージを与える。',textUp:'9ダメージを与える。'},
    defend:{name:'防御',text:'ブロックを5得る。',textUp:'ブロックを8得る。'},
    bash:{name:'殴打',text:'8ダメージを与え、脆弱を2付与する。',textUp:'10ダメージを与え、脆弱を3付与する。'},
    anger:{name:'怒り',text:'6ダメージを与える。このカードのコピーを捨て札に加える。',textUp:'8ダメージを与える。このカードのコピーを捨て札に加える。'},
    armaments:{name:'武装',text:'ブロックを5得る。手札のカードを1枚、戦闘中のみ強化する。',textUp:'ブロックを8得る。手札のカードを1枚、戦闘中のみ強化する。'},
    barbarian:{name:'野蛮人',text:'9ダメージを与え、HPを2失う。',textUp:'12ダメージを与え、HPを2失う。'},
    bodyslam:{name:'ボディスラム',text:'現在のブロックと同量のダメージを与える。',textUp:'現在のブロックと同量のダメージを与える。'},
    clothesline:{name:'クロスライン',text:'12ダメージを与え、弱体を2付与する。',textUp:'14ダメージを与え、弱体を3付与する。'},
    flex:{name:'屈伸',text:'力量を2得る。ターン終了時に力量を2失う。',textUp:'力量を4得る。ターン終了時に力量を4失う。'},
    heavyblade:{name:'ヘビーブレード',text:'14ダメージ。力量が3倍効く。',textUp:'18ダメージ。力量が5倍効く。'},
    ironwave:{name:'アイアンウェーブ',text:'ブロックを5得るし、5ダメージを与える。',textUp:'ブロックを7得るし、7ダメージを与える。'},
    pommel:{name:'柄打ち',text:'9ダメージを与え、カードを1枚引く。',textUp:'10ダメージを与え、カードを2枚引く。'},
    shrugitoff:{name:'軽くあしらう',text:'ブロックを8得るし、カードを1枚引く。',textUp:'ブロックを11得るし、カードを1枚引く。'},
    thunderclap:{name:'雷鳴',text:'すべての敵に4ダメージと脆弱を1付与。',textUp:'すべての敵に7ダメージと脆弱を1付与。'},
    twinstrike:{name:'ツインストライク',text:'5ダメージを2回与える。',textUp:'7ダメージを2回与える。'},
    inferno:{name:'地獄の一撃',text:'12ダメージを与え、毒を2付与する。',textUp:'16ダメージを与え、毒を3付与する。'},
    battletrance:{name:'バトルトランス',text:'カードを3枚引く。このターン、これ以上カードを引けない。',textUp:'カードを4枚引く。このターン、これ以上カードを引けない。'},
    dropkick:{name:'ドロップキック',text:'5ダメージ。敵が脆弱ならエネルギーを1得てカードを1枚引く。',textUp:'8ダメージ。敵が脆弱ならエネルギーを1得てカードを1枚引く。'},
    uppercut:{name:'アッパーカット',text:'13ダメージ。弱体と脆弱を1付与。',textUp:'17ダメージ。弱体と脆弱を2付与。'},
    carnage:{name:'大虐殺',text:'20ダメージを与える。消耗。',textUp:'28ダメージを与える。消耗。'},
    disarm:{name:'武装解除',text:'敵の力量を2減らす。消耗。',textUp:'敵の力量を3減らす。消耗。'},
    inflame:{name:'燃え上がる',text:'力量を2得る。',textUp:'力量を3得る。'},
    seversoul:{name:'魂の切断',text:'10ダメージ。手札のカードをすべて消耗する。',textUp:'16ダメージ。手札のカードをすべて消耗する。'},
    whirlwind:{name:'つむじ風',text:'すべての敵にX回、5ダメージを与える。',textUp:'すべての敵にX回、8ダメージを与える。'},
    secondwind:{name:'息を継ぐ',text:'手札のスキルをすべて消耗し、1枚につきブロックを5得る。',textUp:'手札のスキルをすべて消耗し、1枚につきブロックを8得る。'},
    seeingred:{name:'見切り',text:'エネルギーを2得る。消耗。',textUp:'エネルギーを2得る。消耗。'},
    impervious:{name:'鉄壁',text:'ブロックを30得る。消耗。',textUp:'ブロックを40得る。消耗。'},
    shockwave:{name:'衝撃波',text:'すべての敵に弱体と脆弱を3付与。消耗。',textUp:'すべての敵に弱体と脆弱を5付与。消耗。'},
    bludgeon:{name:'猛打',text:'32ダメージを与える。',textUp:'42ダメージを与える。'},
    demonform:{name:'鬼の姿',text:'ターン開始時に力量を2得る。',textUp:'ターン開始時に力量を3得る。'},
    limitbreak:{name:'限界突破',text:'現在の力量を2倍にする。消耗。',textUp:'現在の力量を2倍にする。消耗。'},
    reaper:{name:'死神の鎌',text:'すべての敵に4ダメージ。与えたダメージ分だけHPを回復。消耗。',textUp:'すべての敵に7ダメージ。与えたダメージ分だけHPを回復。消耗。'},
    offering:{name:'生贄',text:'HPを6失い、エネルギーを2得てカードを3枚引く。消耗。',textUp:'HPを6失い、エネルギーを2得てカードを5枚引く。消耗。'},
    barricade:{name:'バリケード',text:'ターン開始時にブロックが消えなくなる。',textUp:'ターン開始時にブロックが消えなくなる。'},
    juggernaut:{name:'ジャガーノート',text:'ブロックを得るするたび、ランダムな敵に5ダメージ。',textUp:'ブロックを得るするたび、ランダムな敵に7ダメージ。'},
    feed:{name:'捕食',text:'10ダメージ。敵を倒すと最大HPが3増える。消耗。',textUp:'12ダメージ。敵を倒すと最大HPが4増える。消耗。'},
  };
  CARDS.dazed = {name:'目眩',text:'使用不可。',textUp:'使用不可。'};
  CARDS.burn = {name:'火傷',text:'使用不可。ターン終了時に2ダメージを受ける。',textUp:'使用不可。ターン終了時に2ダメージを受ける。'};
  CARDS.hex = {name:'呪い',text:'使用不可。手札にあると敵が力量を1得る。',textUp:'使用不可。'};
  CARDS.wound = {name:'傷',text:'使用不可。',textUp:'使用不可。'};

  const STATUSES = {
    vulnerable:{name:'脆弱',desc:'攻撃ダメージを50%多く受ける。ターン終了時に1減る。',bad:true},
    weak:{name:'弱体',desc:'攻撃ダメージが25%減る。ターン終了時に1減る。',bad:true},
    strength:{name:'力量',desc:'攻撃ダメージがこの値だけ増える。'},
    dexterity:{name:'敏捷',desc:'得るできるブロックがこの値だけ増える。'},
    frail:{name:'虚弱',desc:'得るできるブロックが25%減る。ターン終了時に1減る。',bad:true},
    poison:{name:'毒',desc:'ターン開始時にスタック数だけHPを失い、その後1減る。',bad:true},
    ritual:{name:'儀式',desc:'ターン終了時にこの値だけ力量を得る。'},
    artifact:{name:'アーティファクト',desc:'次のデバフを1回無効化する。'},
    thorns:{name:'棘',desc:'攻撃してきた相手にダメージを返す。'},
    platedArmor:{name:'プレートアーマー',desc:'ターン開始時にブロックを得て、その後1減る。'},
    metacognition:{name:'メタ認知',desc:'毎ターン追加でカードを引く。'},
  };

  const ENEMIES = {
    cultist:'カルト教徒', jawworm:'顎虫', acidslime:'酸性スライム(大)', spikeslime:'棘スライム(大)',
    louse:'赤い虱', fungibeast:'キノコ獣', gremlin:'グレムリン', gremlinnob:'グレムリンの野郎',
    lagavulin:'ラガヴーリン', sentry:'警衛機', hexaghost:'ヘクスゴースト', slimeboss:'スライムボス',
    guardian:'守護者', chosen:'選ばれし者', byrd:'バード', centurion:'百人隊長',
    gremlinleader:'グレムリンの長', bookofstabbing:'刺突の書', bronzeautomaton:'青銅の自動人形',
    champ:'チャンピオン', darkling:'ダークリング', orbwalker:'オーブウォーカー', maw:'大広口',
    gianthead:'巨大な頭', nemesis:'ネメシス', awakenedone:'覚醒者', timeeater:'時を喰らう者',
    reptomancer:'爬虫類使い',
  };

  const RELICS = {
    burningblood:{name:'燃える血',desc:'戦闘後にHPを6回復する。'},
    vajra:{name:'ヴァジラ',desc:'戦闘開始時に力量を1得る。'},
    anchor:{name:'錨',desc:'戦闘開始時にブロックを10得る。'},
    bagofprep:{name:'準備の袋',desc:'戦闘開始時にカードを2枚多く引く。'},
    orichalcum:{name:'オリハルコン',desc:'ブロックが0の状態でターンを終えると、ブロックを6得る。'},
    lantern:{name:'ランタン',desc:'戦闘の1ターン目、エネルギーを1多く得る。'},
    redskull:{name:'赤い頭蓋骨',desc:'HPが50%未満の間、力量を3得る。'},
    phonograph:{name:'蓄音機',desc:'戦闘中に初めて攻撃を出す時、すべての敵に脆弱を2付与。'},
    pennib:{name:'ペン先',desc:'10回目の攻撃が2倍のダメージになる。'},
    oddmushroom:{name:'奇妙なキノコ',desc:'自分に付与される脆弱と弱体が1ターン短くなる。'},
    sneckoeye:{name:'スネコの目',desc:'毎ターンカードを2枚多く引く。カードのコストがランダム(0〜3)になる。'},
    coffeedripper:{name:'コーヒードリッパー',desc:'毎ターンエネルギーを1多く得る。キャンプで休めない。'},
    fusionhammer:{name:'融合ハンマー',desc:'毎ターンエネルギーを1多く得る。キャンプで鍛造できない。'},
    sozu:{name:'ソウ',desc:'毎ターンエネルギーを1多く得る。ポーションを使えない。'},
    ectoplasm:{name:'エクトプラズム',desc:'毎ターンエネルギーを1多く得る。戦闘でゴールドを得られない。'},
    threadneedle:{name:'糸と針',desc:'戦闘開始時にプレートアーマーを4得る。'},
    bronzescales:{name:'青銅の鱗',desc:'戦闘開始時に棘を3得る。'},
    shuriken:{name:'手裏剣',desc:'攻撃を3回出すごとに力量を1得る。'},
    kunai:{name:'苦無',desc:'スキルを3回出すごとに敏捷を1得る。'},
    meatonthebone:{name:'骨付き肉',desc:'戦闘後、HPが50%未満なら12回復する。'},
    girya:{name:'ギルヤ',desc:'最大HPが5増える。'},
  };

  const POTIONS = {
    block:{name:'ブロックポーション',desc:'ブロックを12得る。'},
    damage:{name:'ダメージポーション',desc:'敵に12ダメージ。'},
    strength:{name:'力量ポーション',desc:'力量を2得る。'},
    dexterity:{name:'敏捷ポーション',desc:'敏捷を2得る。'},
    energy:{name:'エネルギーポーション',desc:'エネルギーを2得る。'},
    swift:{name:'迅速ポーション',desc:'カードを3枚引く。'},
    fear:{name:'恐怖ポーション',desc:'敵に脆弱を3付与。'},
    weak:{name:'弱体ポーション',desc:'すべての敵に弱体を3付与。'},
    blood:{name:'血液ポーション',desc:'最大HPの20%回復。'},
    explosive:{name:'爆発ポーション',desc:'すべての敵に10ダメージ。'},
    poison:{name:'毒ポーション',desc:'敵に毒を5付与。'},
    fire:{name:'炎のポーション',desc:'敵に20ダメージ。'},
  };

  const EVENTS = {
    bigfish:{name:'大魚',text:'湖に舟を浮かべる漁師が、舟の中で跳ねる大きな魚を指さしている。',
      choices:['[食べる] HPを12回復する。','[抱きしめる] 最大HPが5増える。','[逃がす] ゴールドを75得る。']},
    cleric:{name:'聖職者',text:'巨大な像の足元に、奇妙な人物が立っている。代償を払えば傷を癒してくれるという。',
      choices:['[祈る] 35ゴールドで最大HPの20%回復。','[立ち去る]']},
    deadadventurer:{name:'死んだ冒険者',text:'血まみれの死体が横たわっている。周囲には持ち物が散らばっている。',
      choices:['[探す] 25ゴールドとランダムなポーションを得る。','[祈る] HPを8回復する。']},
    goldenidol:{name:'黄金の偶像',text:'台座の上にきらめく像がある。不気味な気配が背中を伝う。',
      choices:['[取る] 125ゴールドを得る。','[置いていく]']},
    livingwall:{name:'生きた壁',text:'石壁に埋め込まれた巨大な顔がこちらを見つめ、取引を提案してきた。',
      choices:['[45ゴールドを渡す] ランダムな遺物を得る。','[立ち去る]']},
    shininglight:{name:'輝く光',text:'部屋いっぱいに輝く光が広がり、声が「お前を清めよう」と囁く。',
      choices:['[受け入れる] デッキからカードを1枚除去する。','[断る] HPを5回復する。']},
    wheeloffate:{name:'運命の輪',text:'ルーンが刻まれた車輪が回る。運命は大胆な者に微笑むという。',
      choices:['[回す] 99ゴールドを得る…またはHPを15失う。','[立ち去る]']},
  };

  const MOVES = {
    incantation:'詠唱', darkstrike:'闇の一撃', chomp:'噛みつき', thrash:'暴れまわる', bellow:'咆哮',
    corrode:'腐食', tackle:'体当たり', lick:'なめる', flameTackle:'炎の体当たり', bite:'噛む', grow:'成長',
    quickPunch:'素早いパンチ', punch:'パンチ', rush:'突進', skullbash:'頭突き', sleep:'睡眠',
    siphon:'魂の吸収', attack:'攻撃', bolt:'ビーム', bolt2:'ボルト', activate:'起動', inferno:'業火',
    sear:'焼き尽くす', divider:'分割', goop:'粘液噴霧', slam:'スラム', prepare:'準備',
    modeShift:'モードシフト', charge:'チャージアップ', whirl:'つむじ風', hex:'呪い', poke:'突く', zap:'電撃',
    peck:'つつく', swoop:'急降下', fly:'飛行', slash:'斬撃', defend:'防御', fury:'怒り',
    encourage:'鼓舞', rally:'召集', stab:'刺す', multi:'連続刺し', boost:'ブースト',
    hyperbeam:'ハイパービーム', defiant:'不屈の構え', facebreaker:'顔面破壊', execute:'処刑',
    laser:'レーザー', orbit:'周回', gaze:'睨む', smash:'打ち砕く', scythe:'鎌', venom:'毒',
    release:'暗黒の奔流', ritual:'儀式', reverberate:'反響', headslam:'頭突き', heal:'再生',
    snake:'召喚',
  };

  const ACTS = { 1:{name:'繁茂の森'}, 2:{name:'死者の街'}, 3:{name:'影の尖塔'} };

  // apply
  for (const [id, v] of Object.entries(CARDS)) if (D.CARDS[id] && !D.CARDS[id]._ja) Object.assign(D.CARDS[id], v, {_ja:true});
  for (const [id, v] of Object.entries(CARDS)) if (D.STATUS_CARDS[id]) Object.assign(D.STATUS_CARDS[id], v);
  for (const [id, v] of Object.entries(STATUSES)) if (D.STATUSES[id]) Object.assign(D.STATUSES[id], v);
  for (const [id, name] of Object.entries(ENEMIES)) if (D.ENEMIES[id]) {
    D.ENEMIES[id].name = name;
    D.ENEMIES[id].moves.forEach(m=>{ if(MOVES[m.id]) m.name=MOVES[m.id]; });
  }
  for (const [id, v] of Object.entries(RELICS)) if (D.RELICS[id]) Object.assign(D.RELICS[id], v);
  for (const [id, v] of Object.entries(POTIONS)) if (D.POTIONS[id]) Object.assign(D.POTIONS[id], v);
  for (const [id, v] of Object.entries(EVENTS)) if (D.EVENTS[id]) {
    D.EVENTS[id].name=v.name; D.EVENTS[id].text=v.text;
    D.EVENTS[id].choices.forEach((c,i)=>{ if(v.choices[i]) c.text=v.choices[i]; });
  }
  for (const [id, v] of Object.entries(ACTS)) if (D.ACTS[id]) D.ACTS[id].name=v.name;

  root.JA = { CARDS, STATUSES, ENEMIES, RELICS, POTIONS, EVENTS, ACTS };
})(window);
