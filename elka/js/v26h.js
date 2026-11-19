/* 2.6 · ручная режиссура мультфильмов: для каждой реплики — кто куда идёт, как играет, что на сцене, какой план у камеры, паузы */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL;
function c() { return D.ctx; }
// действия: place (поставить на место), walk (дойти), turn, emote (jump/shout/bounce/sag/lean/nod/shiver/spin/sleepy/flinch),
// sleep/wake, knock, exit, pop (появиться с облачком), prop/unprop, fx (boom/breath/salute/pigeon/chariot/puff), all (эмоция всем)
// cam: wide | close | two:A,B ; pre/post — паузы до и после реплики (сек)
var DIR = {
  'M1-01': { cam: 'wide', do: [['prop', 'throne', 0.7], ['place', 'MET', 0.7], ['place', 'ENO', 0.2], ['prop', 'letters', 0.45]] },
  'M1-02': { cam: 'close', do: [['emote', 'MET', 'lean']] },
  'M1-03': { do: [['emote', 'MET', 'sag']], post: 0.4 },
  'M1-04': { cam: 'two:MET,ENO', do: [['walk', 'ENO', 0.33], ['emote', 'ENO', 'nod'], ['point', 'ENO', 'letters']] },
  'M1-05': { cam: 'close', do: [['emote', 'MET', 'shout'], ['point', 'MET', 'ENO']] },
  'M1-06': { do: [['emote', 'ENO', 'jump']], post: 0.9, after: [['exit', 'ENO']] },
  'M1-07': { cam: 'close', do: [['emote', 'MET', 'bounce']], post: 0.6 },
  'M1-08': { cam: 'wide', do: [['prop', 'tree', 0.5], ['place', 'SNE', 0.24], ['emote', 'SNE', 'jump']] },
  'M1-09': { do: [['prop', 'sleigh', 0.9], ['walk', 'MOR', 0.76], ['emote', 'MOR', 'nod'], ['wave', 'MOR']] },
  'M1-10': { cam: 'close', do: [['turn', 'SNE', 1], ['emote', 'SNE', 'jump']] },

  'M2-01': { cam: 'wide', do: [['prop', 'den', 0.66], ['place', 'GIA', 0.66], ['sleep', 'GIA']], post: 0.4 },
  'M2-02': { do: [['emote', 'MET', 'shout'], ['fx', 'shake', 0.3]] },
  'M2-03': { cam: 'close', do: [['emote', 'GIA', 'sleepy']] },
  'M2-04': { do: [['walk', 'MET', 0.42], ['emote', 'MET', 'lean'], ['point', 'MET', 'GIA']] },
  'M2-05': { do: [['emote', 'GIA', 'sleepy']] },
  'M2-06': { do: [['emote', 'MET', 'bounce']], post: 0.3 },
  'M2-07': { cam: 'wide', do: [['wake', 'GIA'], ['emote', 'GIA', 'jump'], ['fx', 'shake', 0.7], ['fx', 'puff', 0.66]], post: 0.6 },
  'M2-08': { cam: 'wide', do: [['place', 'MOR', 0.35], ['place', 'SNE', 0.62], ['emote', 'MOR', 'sag']] },
  'M2-09': { cam: 'two:MOR,SNE', do: [['emote', 'SNE', 'lean']] },
  'M2-10': { do: [['emote', 'MOR', 'jump']] },

  'M3-01': { cam: 'wide', do: [['prop', 'hut', 0.62], ['fx', 'snore', 0.62]], post: 0.5 },
  'M3-02': { do: [['emote', 'SNE', 'nod']] },
  'M3-03': { do: [['emote', 'MOR', 'lean']] },
  'M3-04': { cam: 'close', do: [['pop', 'EME', 0.7], ['fx', 'puff', 0.7], ['emote', 'EME', 'sag']] },
  'M3-05': { do: [['emote', 'SNE', 'jump']] },
  'M3-06': { do: [['emote', 'EME', 'bounce']] },
  'M3-07': { cam: 'two:MOR,EME', do: [['emote', 'MOR', 'nod']] },
  'M3-08': { do: [['prop', 'hole', 0.93], ['emote', 'EME', 'jump']] },
  'M3-09': { cam: 'close', do: [['pop', 'SHU', 0.93], ['fx', 'splash', 0.93], ['emote', 'SHU', 'shout']] },
  'M3-10': { cam: 'wide', do: [['all', 'jump']], post: 0.5 },

  'M4-01': { cam: 'wide', do: [['prop', 'yhut', 0.9], ['place', 'MET', 0.3], ['emote', 'YAG', 'lean']] },
  'M4-02': { do: [['emote', 'MET', 'shout']] },
  'M4-04': { cam: 'wide', do: [['emote', 'YAG', 'shiver'], ['flip', 'yhut']], post: 0.5 },
  'M4-05': { cam: 'close', do: [['emote', 'MET', 'shout'], ['fx', 'shake', 0.3]] },
  'M4-06': { do: [['emote', 'YAG', 'lean']] },
  'M4-07': { do: [['emote', 'MET', 'sag']], post: 0.4 },
  'M4-08': { cam: 'wide', do: [['fx', 'chariot', 0], ['emote', 'BEL', 'shout']] },
  'M4-09': { do: [['emote', 'EME', 'sag']] },
  'M4-10': { do: [['emote', 'BEL', 'spin']] },

  'M5-01': { cam: 'wide', do: [['prop', 'castle', 0.5], ['place', 'KOS', 0.72], ['place', 'MET', 0.22], ['emote', 'KOS', 'lean']] },
  'M5-02': { do: [['emote', 'MET', 'shout']] },
  'M5-03': { cam: 'close', do: [['emote', 'KOS', 'bounce']] },
  'M5-04': { do: [['emote', 'MET', 'nod']] },
  'M5-05': { do: [['walk', 'KOS', 0.62], ['emote', 'KOS', 'lean']] },
  'M5-06': { do: [['emote', 'MET', 'sag']] },
  'M5-07': { cam: 'two:KOS,MET', do: [['prop', 'scroll', '@KOS'], ['fx', 'puff', 0.5]] },
  'M5-08': { cam: 'two:KOS,MET', do: [['walk', 'MET', 0.45], ['emote', 'MET', 'lean']] },
  'M5-09': { cam: 'two:KOS,MET', do: [['emote', 'KOS', 'bounce'], ['hold', 'KOS', 'scroll']], post: 2.4, after: [['sign', 'MET', 'scroll']] },
  'M5-10': { cam: 'two:KOS,MET', do: [['pass', 'scroll', '@MET'], ['hold', 'MET', 'scroll'], ['stamp', 'KOS', 'scroll'], ['emote', 'KOS', 'shiver']], post: 0.8 },

  'M6-01': { cam: 'wide', do: [['place', 'KIK', 0.75], ['place', 'MOR', 0.3], ['place', 'SNE', 0.15], ['emote', 'KOL', 'jump']] },
  'M6-02': { do: [['emote', 'KIK', 'lean']] },
  'M6-03': { do: [['walk', 'KOL', 0.36], ['emote', 'KOL', 'bounce']], post: 0.2, after: [['knock', 'MOR']] },
  'M6-04': { cam: 'two:MOR,KOL', pre: 0.6 },
  'M6-05': { do: [['emote', 'KOL', 'bounce']] },
  'M6-06': { do: [['emote', 'SNE', 'lean']] },
  'M6-07': { do: [['emote', 'KOL', 'sag']] },
  'M6-08': { do: [['emote', 'MOR', 'nod']] },
  'M6-09': { do: [['emote', 'KOL', 'jump']] },
  'M6-10': { do: [['place', 'EME', 0.55], ['emote', 'EME', 'lean']] },
  'M6-11': { cam: 'close', do: [['emote', 'KOL', 'spin'], ['fx', 'shake', 0.2]] },

  'M7-01': { cam: 'wide', do: [['prop', 'bridge', 0.72]], post: 0.3 },
  'M7-02': { cam: 'close', do: [['emote', 'GOR', 'shout']] },
  'M7-03': { do: [['emote', 'GOR', 'lean']] },
  'M7-04': { do: [['emote', 'GOR', 'bounce']] },
  'M7-05': { do: [['all', 'jump']] },
  'M7-06': { do: [['fx', 'breath', 0], ['fx', 'shake', 0.4]] },
  'M7-07': { do: [['emote', 'GOR', 'bounce']] },
  'M7-08': { do: [['emote', 'GOR', 'shout']] },
  'M7-09': { cam: 'two:PLO,GOR', do: [['walk', 'PLO', 0.46], ['emote', 'PLO', 'jump'], ['point', 'PLO', 'GOR']] },
  'M7-10': { do: [['emote', 'GOR', 'bounce']] },
  'M7-11': { do: [['turn', 'PLO', -1], ['emote', 'PLO', 'sag']] },
  'M7-12': { do: [['emote', 'SNE', 'nod']] },

  'M8-01': { cam: 'wide', do: [['emote', 'MOR', 'sag']] },
  'M8-02': { do: [['prop', 'map', '@BEL'], ['hold', 'BEL', 'map'], ['emote', 'BEL', 'shout']] },
  'M8-03': { do: [['emote', 'EME', 'sag']] },
  'M8-04': { cam: 'two:VAS,BEL', do: [['emote', 'VAS', 'lean'], ['point', 'VAS', 'map']], post: 1.1, after: [['flip', 'map']] },   // 2.12.47: Белка переворачивает карту, когда Василиса договорила
  'M8-05': { do: [['emote', 'SNE', 'jump']] },
  'M8-06': { do: [['unprop', 'map'], ['prop', 'scroll', '@VAS'], ['pset', 'scroll', 'kind', 'plan'], ['hold', 'VAS', 'scroll'], ['emote', 'VAS', 'nod']] },
  'M8-07': { do: [['emote', 'MOR', 'nod']] },
  'M8-08': { do: [['unprop', 'scroll'], ['emote', 'VAS', 'lean'], ['wave', 'VAS']] },
  'M8-09': { cam: 'close', do: [['emote', 'BEL', 'spin']] },
  'M8-10': { do: [['emote', 'VAS', 'lean']] },
  'M8-11': { do: [['emote', 'EME', 'bounce']] },

  'M9-01': { cam: 'wide', do: [['prop', 'oak', 0.86], ['emote', 'VAS', 'nod']] },
  'M9-02': { do: [['emote', 'KOL', 'bounce']] },
  'M9-03': { do: [['emote', 'VAS', 'lean']] },
  'M9-04': { cam: 'close', do: [['emote', 'KOT', 'sleepy']] },
  'M9-05': { do: [['emote', 'SNE', 'jump']] },
  'M9-06': { do: [['emote', 'KOT', 'sleepy']], post: 0.4 },
  'M9-07': { cam: 'close', do: [['prop', 'oak', 0.3], ['emote', 'KOS', 'shout']] },
  'M9-08': { cam: 'wide', do: [['prop', 'oak', 0.93], ['emote', 'BEL', 'bounce'], ['point', 'BEL', 'oak']] },   // 2.12.46: дуб с сундуком и табличкой «Тут игла» в кадре, Белка на неё показывает
  'M9-09': { do: [['emote', 'KOS', 'shiver']] },

  'M10-01': { cam: 'wide', do: [['place', 'MET', 0.25], ['place', 'KOS', 0.72], ['emote', 'KOS', 'shout']] },
  'M10-02': { do: [['emote', 'MET', 'lean']] },
  'M10-03': { cam: 'close', do: [['emote', 'KOS', 'shiver']] },
  'M10-04': { do: [['emote', 'MET', 'nod']] },
  'M10-05': { do: [['prop', 'scroll', '@KOS'], ['pset', 'scroll', 'sign', 1], ['pset', 'scroll', 'stamp', 1], ['emote', 'KOS', 'lean'], ['point', 'MET', 'scroll']] },   // 2.12.46: тот самый договор — с подписью Метелицы и печатью Кощея
  'M10-06': { cam: 'close', do: [['emote', 'MET', 'shout'], ['fx', 'shake', 0.4]] },
  'M10-07': { do: [['emote', 'KOS', 'shiver']] },
  'M10-08': { do: [['unprop', 'scroll'], ['emote', 'MET', 'sag']], post: 0.5 },
  'M10-09': { cam: 'wide', do: [['prop', 'tree', 0.5], ['walk', 'MOR', 0.3], ['emote', 'MOR', 'shout']] },
  'M10-10': { do: [['emote', 'MET', 'shout'], ['fx', 'shake', 0.3]], post: 0.4 },

  'M11-01': { cam: 'wide', do: [['prop', 'tree', 0.5], ['emote', 'MET', 'sag']] },
  'M11-02': { do: [['emote', 'SNE', 'nod']] },
  'M11-03': { cam: 'close', do: [['emote', 'MET', 'sag']] },
  'M11-04': { do: [['emote', 'MOR', 'lean']] },
  'M11-05': { do: [['emote', 'SNE', 'nod']] },
  'M11-06': { do: [['fx', 'pigeon', 0], ['emote', 'MOR', 'sag']] },
  'M11-07': { cam: 'two:MOR,MET', do: [['walk', 'MOR', 0.42], ['emote', 'MOR', 'nod'], ['point', 'MOR', 'tree']] },
  'M11-08': { do: [['emote', 'MET', 'jump']] },
  'M11-09': { do: [['emote', 'KOS', 'lean']] },
  'M11-10': { do: [['emote', 'VAS', 'lean']] },
  'M11-11': { do: [['emote', 'KOS', 'sag']] },
  'M11-12': { do: [['emote', 'EME', 'bounce'], ['wave', 'EME']] },
  'M11-13': { cam: 'wide', do: [['pop', 'SHU', 0.5], ['all', 'jump'], ['fx', 'salute', 0]], post: 1.6 },

  'M12-01': { cam: 'wide', do: [['prop', 'pies', 0.4], ['place', 'SOL', 0.12], ['place', 'RAZ', 0.68], ['place', 'ENO', 0.9]], post: 0.3 },
  'M12-02': { cam: 'close', do: [['emote', 'SOL', 'lean'], ['point', 'SOL', 'RAZ']] },
  'M12-03': { cam: 'two:SOL,RAZ', do: [['emote', 'RAZ', 'bounce'], ['wave', 'RAZ']] },
  'M12-04': { do: [['turn', 'SOL', 1], ['emote', 'SOL', 'shiver']], pre: 0.4 },
  'M12-05': { do: [['emote', 'RAZ', 'jump']] },
  'M12-06': { cam: 'close', do: [['emote', 'ENO', 'sag']] },
  'M12-07': { cam: 'wide', do: [['emote', 'SOL', 'shout'], ['fx', 'shake', 0.3], ['point', 'SOL', 'pies']] },
  'M12-08': { do: [['emote', 'RAZ', 'bounce']] },
  'M12-09': { cam: 'close', do: [['emote', 'ENO', 'spin'], ['point', 'ENO', 'RAZ']] },
  'M12-10': { do: [['emote', 'RAZ', 'shiver']] },
  'M12-11': { cam: 'wide', do: [['emote', 'SOL', 'lean']], post: 2.6, after: [['fx', 'boom', '@RAZ'], ['all', 'knockStay']] },
  'M12-12': { pre: 0.2 },
  // М13 «Стройка века»
  'M13-02': { cam: 'close', do: [['emote', 'MET', 'shout']] }, 'M13-03': { do: [['emote', 'ENO', 'nod']] }, 'M13-05': { cam: 'two:ENO,EN2', do: [['emote', 'ENO', 'lean']] },
  'M13-07': { cam: 'close', do: [['emote', 'MET', 'shout'], ['fx', 'shake', 0.2]] }, 'M13-09': { cam: 'close', do: [['emote', 'MET', 'shout'], ['fx', 'shake', 0.3]] },
  'M13-10': { do: [['emote', 'ENO', 'bounce']] }, 'M13-11': { cam: 'wide', post: 0.6 }, 'M13-12': { cam: 'close', do: [['emote', 'MET', 'shout'], ['fx', 'shake', 0.4]] },
  'M13-13': { do: [['emote', 'ENO', 'lean']] }, 'M13-14': { cam: 'close', do: [['emote', 'EN2', 'sag']], post: 0.8 },
  // М14 «Леший»
  'M14-01': { do: [['place', 'SNE', 0.47], ['place', 'LES', 0.84], ['ride', 'SNE', 'sleigh']] }, 'M14-02': { cam: 'close', do: [['emote', 'LES', 'shout']] }, 'M14-04': { do: [['emote', 'LES', 'bounce'], ['emote', 'LES', 'lean']], post: 1.0, after: [['emote', 'SNE', 'nod'], ['exit', 'SNE']] }, 'M14-05': { pre: 0.6, post: 2.2, do: [['emote', 'LES', 'lean'], ['loop', 'SNE']] }, 'M14-06': { do: [['emote', 'SNE', 'sag']] },
  'M14-07': { cam: 'close', do: [['emote', 'LES', 'lean']] }, 'M14-09': { cam: 'close', do: [['emote', 'LES', 'sag']] }, 'M14-10': { cam: 'wide', post: 0.6 },
  // М15 «Снегоходы»
  'M15-02': { cam: 'close', do: [['emote', 'ENO', 'spin']] }, 'M15-04': { do: [['emote', 'ENO', 'jump']] }, 'M15-05': { cam: 'two:ENO,EN2', do: [['emote', 'EN2', 'lean']] },
  'M15-06': { cam: 'wide', do: [['emote', 'MET', 'shout']] }, 'M15-07': { cam: 'close', do: [['emote', 'CRW', 'shiver']] }, 'M15-08': { cam: 'two:MET,CRW', do: [['emote', 'MET', 'shout']] },
  'M15-09': { cam: 'close', do: [['emote', 'CRW', 'lean']] }, 'M15-10': { cam: 'wide', do: [['emote', 'RAZ', 'jump'], ['fx', 'shake', 0.2]] }, 'M15-11': { post: 0.6 },
  // М16 «Белка»
  'M16-02': { cam: 'close', do: [['emote', 'BEL', 'jump']] }, 'M16-04': { do: [['emote', 'BEL', 'bounce']] }, 'M16-05': { cam: 'close', do: [['emote', 'BEL', 'sag']] }, 'M16-07': { do: [['emote', 'BEL', 'jump']] },
  // М21 «Фамильное ведро» и М22 «Братья по морозилке» (Эскимо и Пломбир)
  'M21-01': { cam: 'wide', do: [['place', 'PLO', 0.72], ['place', 'MOR', 0.1], ['place', 'SNE', 0.22], ['place', 'ESK', -0.08], ['walk', 'ESK', 0.45]], post: 0.6 }, 'M21-02': { do: [['emote', 'ESK', 'jump']] }, 'M21-03': { cam: 'two:ESK,PLO', do: [['emote', 'PLO', 'flinch']] },
  'M21-04': { do: [['emote', 'ESK', 'lean']], post: 0.3 }, 'M21-05': { do: [['emote', 'PLO', 'shout']] }, 'M21-06': { cam: 'close', do: [['emote', 'ESK', 'bounce']] }, 'M21-07': { cam: 'close', do: [['emote', 'PLO', 'jump']] },
  'M21-08': { cam: 'two:ESK,PLO', do: [['emote', 'ESK', 'nod']], post: 0.5 }, 'M21-09': { cam: 'wide', do: [['emote', 'SNE', 'jump']] }, 'M21-10': { cam: 'two:ESK,PLO', do: [['emote', 'ESK', 'shout'], ['emote', 'PLO', 'shout']] }, 'M21-11': { cam: 'wide', do: [['emote', 'MOR', 'bounce']], post: 0.5 },
  'M22-01': { cam: 'wide', do: [['place', 'PLO', 0.72], ['place', 'ESK', 0.45], ['place', 'MOR', 0.1], ['place', 'SNE', 0.22]], post: 0.3 }, 'M22-02': { do: [['emote', 'PLO', 'jump']] }, 'M22-03': { do: [['emote', 'ESK', 'lean']] },
  'M22-04': { cam: 'two:ESK,PLO', do: [['emote', 'PLO', 'sag']], post: 0.3 }, 'M22-05': { do: [['emote', 'ESK', 'nod']] }, 'M22-06': { cam: 'wide' }, 'M22-07': { cam: 'two:ESK,PLO', do: [['emote', 'ESK', 'jump'], ['emote', 'PLO', 'jump']], post: 0.4 },
  'M22-08': { cam: 'wide', do: [['emote', 'MOR', 'bounce']] }, 'M22-09': { cam: 'two:ESK,PLO', do: [['emote', 'PLO', 'lean']] }, 'M22-10': { do: [['emote', 'ESK', 'jump']], post: 1.2, after: [['fx', 'salute', 0.5]] },
  // М17 «Пломбир»
  'M17-01': { cam: 'wide', pre: 0.3, do: [['place', 'PLO', 0.6], ['place', 'SNE', 0.3], ['place', 'MOR', 0.12], ['still', 'PLO']] }, 'M17-03': { cam: 'close', do: [['emote', 'PLO', 'sleepy']], post: 0.4 }, 'M17-05': { do: [['still', 'PLO', false], ['emote', 'PLO', 'jump']] }, 'M17-07': { cam: 'close', do: [['emote', 'PLO', 'sag']] }, 'M17-08': { cam: 'wide', post: 0.6 },
  // М18 «Таран»
  'M18-02': { cam: 'two:ENO,EN2', do: [['emote', 'ENO', 'lean']] }, 'M18-05': { do: [['emote', 'EN2', 'nod']] }, 'M18-07': { cam: 'wide', post: 0.3 }, 'M18-08': { cam: 'close', do: [['emote', 'RAZ', 'jump']] },
  'M18-09': { do: [['emote', 'ENO', 'shout'], ['exit', 'ENO', 1]] }, 'M18-10': { cam: 'close', do: [['emote', 'MOR', 'bounce']] }, 'M18-11': { post: 0.6 },
  // М19 «Снегоуборщик»
  'M19-01': { cam: 'wide', do: [['emote', 'MET', 'jump']] }, 'M19-03': { cam: 'close', do: [['emote', 'MET', 'shout'], ['fx', 'shake', 0.3]] }, 'M19-04': { do: [['emote', 'ENO', 'nod']] },
  'M19-06': { cam: 'close', do: [['emote', 'ENO', 'jump']] }, 'M19-07': { do: [['emote', 'MOR', 'lean']] }, 'M19-08': { cam: 'close', do: [['emote', 'MET', 'shout']], post: 0.6 },
  // М20 «Бешеные еноты»
  'M20-01': { pre: 0.3, post: 0.5 }, 'M20-02': { cam: 'two:ENO,EN2', do: [['prop', 'pies', 0.5]] }, 'M20-05': { cam: 'close', do: [['emote', 'EN2', 'lean']] }, 'M20-06': { do: [['emote', 'ENO', 'nod']] },
  'M20-07': { pre: 0.2, post: 0.5 }, 'M20-08': { cam: 'close', do: [['emote', 'SOL', 'lean'], ['point', 'SOL', 'ENO']] }, 'M20-10': { do: [['point', 'SOL', 'RAZ']] },
  'M20-11': { cam: 'close', do: [['emote', 'RAZ', 'shout']] }, 'M20-12': { do: [['emote', 'SOL', 'lean']] },
  'M20-13': { pre: 0.2, post: 0.5 }, 'M20-14': { cam: 'close', do: [['emote', 'SOL', 'lean']] }, 'M20-15': { cam: 'close', do: [['emote', 'RAZ', 'jump']] }, 'M20-16': { cam: 'wide', do: [['emote', 'SOL', 'shout'], ['fx', 'shake', 0.4]] },
  'M20-17': { pre: 0.2, post: 0.8 }, 'M20-18': { cam: 'wide', do: [['emote', 'EN2', 'lean']] }, 'M20-19': { post: 0.4 }, 'M20-20': { cam: 'close', do: [['emote', 'ENO', 'sag']], post: 1 },
  'M11-14': { do: [['emote', 'SOL', 'bounce']] }, 'M11-15': { do: [['emote', 'RAZ', 'bounce']] }
};
Z.MDIR = DIR;
// реквизит
function drawProp(k, x, gy, B, t, p) {
  var ctx = c(), l = Math.max(2, B * 0.02);
  if (k === 'throne') { ctx.save(); ctx.translate(x, gy); D.poly([-B * 0.5, 0, -B * 0.42, -B * 1.4, -B * 0.2, -B * 1.1, 0, -B * 1.6, B * 0.2, -B * 1.1, B * 0.42, -B * 1.4, B * 0.5, 0], 'rgba(190,230,255,0.9)', l); D.rr(-B * 0.42, -B * 0.5, B * 0.84, B * 0.18, B * 0.05); ctx.fillStyle = '#9fd8ff'; ctx.fill(); ctx.restore(); }
  else if (k === 'letters') { for (var i = 0; i < 6; i++) { ctx.save(); ctx.translate(x + (i - 2.5) * B * 0.1, gy - B * 0.05 - (i % 2) * B * 0.06); ctx.rotate((i - 2.5) * 0.25); D.rr(-B * 0.09, -B * 0.06, B * 0.18, B * 0.12, 2); ctx.fillStyle = '#fff8e8'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); D.poly([-B * 0.09, -B * 0.06, 0, 0, B * 0.09, -B * 0.06], 'rgba(0,0,0,0)', l * 0.4); ctx.restore(); } }
  else if (k === 'tree') { D.bigTree(x, gy, B * 2.3, t, {}); }
  else if (k === 'sleigh') { ctx.save(); ctx.translate(x, gy - B * 0.1); D.noRider = true; D.sleigh(0, 0, B * (p && p.follow ? 0.75 : 1.1), p && p.follow ? -1 : 1, p && p.mv ? t : 0, 0); D.noRider = false; ctx.restore(); }
  else if (k === 'den') { ctx.beginPath(); ctx.ellipse(x, gy, B * 1.3, B * 0.9, 0, Math.PI, 0); ctx.fillStyle = '#eef4ff'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, gy, B * 0.75, B * 0.55, 0, Math.PI, 0); ctx.fillStyle = '#2a3050'; ctx.fill(); }
  else if (k === 'hut') { Z.drawHut(x, gy, B * 1.05, t, false, { noLegs: true }); }
  else if (k === 'yhut') { // избушка Яги: приходит, переминается, кудахчет; на M4-04 подпрыгивает и поворачивается к лесу передом (к нам задом)
    var snd = function (n, v) { if (Z.nsnd) Z.nsnd(n, v, true); };
    var pt = p.t || 0, walkIn = Math.max(0, 1 - pt / 1.8), ox = walkIn * walkIn * B * 2.6, u = 0, turned = false, jmp = 0, cr = 0, walk = walkIn > 0, wph = t * 7;
    if (walkIn > 0 && !p.s0) { p.s0 = 1; snd('steps', 0.45); }
    if (walkIn <= 0 && !p.s3) { p.s3 = 1; snd('cluck', 0.4); }
    if (p.flip) { if (p.ft == null) p.ft = t; u = t - p.ft;
      if (u < 0.35) cr = u / 0.35; else if (u < 0.95) { jmp = Math.sin((u - 0.35) / 0.6 * Math.PI); turned = u > 0.65; } else turned = true;
      if (u > 0.05 && !p.s1) { p.s1 = 1; snd('bawk', 0.45); snd('creak', 0.35); } if (u > 0.92 && !p.s2) { p.s2 = 1; snd('stomp', 0.55); } }
    if (!walk && !(p.flip && u < 1.2)) { // в покое: переминается и время от времени клюёт/подпрыгивает
      var cyc = (pt % 3.6) / 3.6; wph = Math.sin(pt * 2.4) * 0.6;
      if (cyc > 0.78) { var q = (cyc - 0.78) / 0.22; cr = Math.sin(q * Math.PI) * 0.6; if (q > 0.5 && p.pk !== Math.floor(pt / 3.6)) { p.pk = Math.floor(pt / 3.6); snd(Math.random() < 0.3 ? 'creak' : 'cluck', 0.3); } }
      walk = true; }
    Z.drawHut(x + ox, gy, B * 0.72, t, walk, { turned: turned, crouch: cr, jump: jmp, smoke: !turned, dir: -1, walk: wph, moving: walkIn > 0 || !p.flip || u > 1.2 }); }
  else if (k === 'hole') { D.ell(x, gy + B * 0.02, B * 0.35, B * 0.08, '#2f6f9f', l); D.ell(x, gy + B * 0.02, B * 0.26, B * 0.05, '#4aa0d8'); }
  else if (k === 'bridge') D.kbridge(x, gy - B * 0.04, B * 4.2, B * 1.45, l, t, 0.28);
  else if (k === 'castle') { // замок Кощея: дальний план, непрозрачный, приглушённые тона
    var cb = B * 0.7, cy0 = gy - B * 0.15, wl = Math.max(1.5, B * 0.03), glow = 0.6 + 0.4 * Math.sin(t * 3);
    var stone = function (x0, y0, w, h, c1, c2) { var g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h); ctx.lineWidth = wl; ctx.strokeStyle = OL; ctx.strokeRect(x0, y0, w, h); ctx.strokeStyle = 'rgba(30,24,60,0.18)'; ctx.lineWidth = wl * 0.5; ctx.beginPath(); for (var r0 = 1; r0 * cb * 0.3 < h; r0++) { var yy = y0 + r0 * cb * 0.3; ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy); for (var c0 = (r0 % 2) * 0.5; c0 * cb * 0.5 < w; c0++) { var xx = x0 + c0 * cb * 0.5; ctx.moveTo(xx, yy); ctx.lineTo(xx, yy - cb * 0.3); } } ctx.stroke(); };
    var teeth = function (x0, y0, w) { var n = Math.max(2, Math.round(w / (cb * 0.2))); for (var q = 0; q < n; q += 2) { var tw = w / n; ctx.fillStyle = '#6a6498'; ctx.fillRect(x0 + q * tw, y0 - cb * 0.14, tw, cb * 0.14); ctx.lineWidth = wl; ctx.strokeStyle = OL; ctx.strokeRect(x0 + q * tw, y0 - cb * 0.14, tw, cb * 0.14); } };
    var win = function (wx, wy) { ctx.globalAlpha = 0.35 * glow; D.circ(wx, wy, cb * 0.13, '#7fffd0'); ctx.globalAlpha = 1; D.rr(wx - cb * 0.06, wy - cb * 0.1, cb * 0.12, cb * 0.18, cb * 0.06); ctx.fillStyle = '#3fd8a0'; ctx.fill(); ctx.lineWidth = wl * 0.8; ctx.strokeStyle = OL; ctx.stroke(); };
    // донжон
    stone(x - cb * 0.55, cy0 - cb * 2.5, cb * 1.1, cb * 2.5, '#7a74a8', '#5a5488'); teeth(x - cb * 0.55, cy0 - cb * 2.5, cb * 1.1);
    D.poly([x - cb * 0.62, cy0 - cb * 2.64, x, cy0 - cb * 3.5, x + cb * 0.62, cy0 - cb * 2.64], '#8a4a6a', wl); win(x, cy0 - cb * 2.0);
    // стена
    stone(x - cb * 1.5, cy0 - cb * 1.35, cb * 3.0, cb * 1.35, '#726ca0', '#545080'); teeth(x - cb * 1.5, cy0 - cb * 1.35, cb * 3.0);
    // башни
    [-1, 1].forEach(function (sd) { var tx = x + sd * cb * 1.55; stone(tx - cb * 0.33, cy0 - cb * 2.1, cb * 0.66, cb * 2.1, '#807ab0', '#5c5690'); D.poly([tx - cb * 0.42, cy0 - cb * 2.1, tx, cy0 - cb * 2.95, tx + cb * 0.42, cy0 - cb * 2.1], '#8a4a6a', wl); win(tx, cy0 - cb * 1.5); ctx.strokeStyle = OL; ctx.lineWidth = wl; ctx.beginPath(); ctx.moveTo(tx, cy0 - cb * 2.95); ctx.lineTo(tx, cy0 - cb * 3.3); ctx.stroke(); D.poly([tx, cy0 - cb * 3.3, tx + sd * cb * 0.3 + Math.sin(t * 4 + sd) * cb * 0.04, cy0 - cb * 3.2, tx, cy0 - cb * 3.1], '#a8222d', wl * 0.6); });
    // ворота с решёткой
    ctx.beginPath(); ctx.moveTo(x - cb * 0.32, cy0); ctx.lineTo(x - cb * 0.32, cy0 - cb * 0.55); ctx.arc(x, cy0 - cb * 0.55, cb * 0.32, Math.PI, 0); ctx.lineTo(x + cb * 0.32, cy0); ctx.closePath(); ctx.fillStyle = '#120c20'; ctx.fill(); ctx.lineWidth = wl; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = '#6a6080'; ctx.lineWidth = wl * 0.8; ctx.beginPath(); for (var g2 = -2; g2 <= 2; g2++) { ctx.moveTo(x + g2 * cb * 0.12, cy0 - cb * 0.82 + Math.abs(g2) * cb * 0.06); ctx.lineTo(x + g2 * cb * 0.12, cy0); } for (var h2 = 1; h2 <= 3; h2++) { ctx.moveTo(x - cb * 0.3, cy0 - h2 * cb * 0.2); ctx.lineTo(x + cb * 0.3, cy0 - h2 * cb * 0.2); } ctx.stroke();
    // снег у подножия
    D.ell(x, cy0 + cb * 0.02, cb * 1.9, cb * 0.12, '#e8f0ff', wl * 0.6); }
  else if (k === 'scroll') { ctx.save(); ctx.translate(x, gy - B * 0.85 - Math.sin(t * 2) * B * 0.03); ctx.scale(1.35, 1.35); D.rr(-B * 0.28, -B * 0.36, B * 0.56, B * 0.72, B * 0.04); ctx.fillStyle = '#fff3d6'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); if (p.kind !== 'plan') for (var s = 0; s < 6; s++) { ctx.fillStyle = s < 4 ? '#8a7a6a' : '#b8a898'; ctx.fillRect(-B * 0.2, -B * 0.15 + s * B * 0.065, B * (s < 4 ? 0.4 : 0.38), s < 4 ? B * 0.022 : B * 0.01); }   /* 2.12.47: строки ниже заголовка, заголовок ниже верхнего валика */ D.ell(0, -B * 0.38, B * 0.32, B * 0.06, '#e8d8b0', l * 0.6); D.ell(0, B * 0.38, B * 0.32, B * 0.06, '#e8d8b0', l * 0.6);
    // 2.12.46: у Василисы это не договор, а её план «на сорок страниц»: стрелки «направо — налево — победа»
    if (p.kind === 'plan') { D.text(Z.TT('ПЛАН', 'PLAN'), 0, -B * 0.225, B * 0.08, '#3f2a8a');
      D.text('→', -B * 0.08, -B * 0.1, B * 0.1, '#2a7a4a'); D.text('←', B * 0.08, B * 0.01, B * 0.1, '#2a7a4a'); D.text('★', 0, B * 0.13, B * 0.11, '#e0a020');
      D.text(Z.TT('стр. 1 из 40', 'p. 1 of 40'), 0, B * 0.25, B * 0.042, '#8a7a6a'); }
    else D.text(Z.TT('ДОГОВОР', 'CONTRACT'), 0, -B * 0.225, B * 0.066, '#5a3a20');
    if (p.kind !== 'plan') { ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-B * 0.2, B * 0.27); ctx.lineTo(B * 0.2, B * 0.27); ctx.stroke(); }
    if (p.sign) { var sp = Math.min(1, p.sign); ctx.strokeStyle = '#2a3a8a'; ctx.lineWidth = 2.2; ctx.beginPath(); for (var q = 0; q <= 30 * sp; q++) { var u = q / 30; ctx[q ? 'lineTo' : 'moveTo'](-B * 0.18 + u * B * 0.24, B * 0.24 - Math.sin(u * 19) * B * 0.03 - Math.sin(u * 5) * B * 0.015); } ctx.stroke(); }
    if (p.stamp) { ctx.globalAlpha = Math.min(1, p.stamp * 3); D.circ(B * 0.14, B * 0.12, B * 0.08, 'rgba(200,40,60,0.25)'); ctx.strokeStyle = '#c8283c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(B * 0.14, B * 0.12, B * 0.08, 0, 7); ctx.stroke(); D.text('☠', B * 0.14, B * 0.12, B * 0.08, '#c8283c'); ctx.globalAlpha = 1; }
    ctx.restore(); }
  else if (k === 'map') {   // 2.12.46: карта Белки — горы, лес, замок Кощея, тропа, роза ветров и подпись; до замечания Василисы — вверх ногами, потом плавно переворачивается
    var fa = p.flip ? Math.min(1, ((Z.time || 0) - (p.flipAt || 0)) / 0.7) : 0, fe = fa * fa * (3 - 2 * fa);
    ctx.save(); ctx.translate(x, gy - B * 0.62); ctx.scale(1.3, 1.3); ctx.rotate(Math.PI * (1 - fe) + 0.05);
    var MW = B * 0.36, MH = B * 0.26;
    D.rr(-MW, -MH, MW * 2, MH * 2, B * 0.03); ctx.fillStyle = '#f2e6c8'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    D.text(Z.TT('КАРТА', 'MAP'), -MW * 0.45, -MH * 0.72, B * 0.06, '#6b4a2f');
    [[-0.62, 0.05], [-0.38, -0.05], [-0.15, 0.08]].forEach(function (q) { D.poly([MW * q[0] - B * 0.07, MH * (q[1] + 0.35), MW * q[0], MH * (q[1] - 0.25), MW * q[0] + B * 0.07, MH * (q[1] + 0.35)], '#9aa1b5', Math.max(1, l * 0.5)); D.poly([MW * q[0] - B * 0.025, MH * (q[1] - 0.08), MW * q[0], MH * (q[1] - 0.25), MW * q[0] + B * 0.025, MH * (q[1] - 0.08)], '#ffffff'); });
    [[0.1, 0.55], [0.22, 0.62], [-0.55, 0.62]].forEach(function (q) { D.poly([MW * q[0] - B * 0.03, MH * q[1] + B * 0.03, MW * q[0], MH * q[1] - B * 0.05, MW * q[0] + B * 0.03, MH * q[1] + B * 0.03], '#3f8a4a'); });
    ctx.fillStyle = '#5a5070'; ctx.fillRect(MW * 0.5, -MH * 0.5, B * 0.1, B * 0.08); D.poly([MW * 0.5 - B * 0.01, -MH * 0.5, MW * 0.5 + B * 0.05, -MH * 0.5 - B * 0.06, MW * 0.5 + B * 0.11, -MH * 0.5], '#8a4a6a');
    ctx.setLineDash([4, 3]); ctx.strokeStyle = '#e8484f'; ctx.lineWidth = Math.max(1.2, l * 0.7); ctx.beginPath(); ctx.moveTo(-MW * 0.8, MH * 0.75); ctx.quadraticCurveTo(-MW * 0.1, MH * 0.9, MW * 0.05, MH * 0.15); ctx.quadraticCurveTo(MW * 0.2, -MH * 0.3, MW * 0.52, -MH * 0.3); ctx.stroke(); ctx.setLineDash([]);
    D.text('✕', MW * 0.55, -MH * 0.12, B * 0.08, '#e8484f');
    var rx = MW * 0.72, ry = MH * 0.55; ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = Math.max(1, l * 0.5); ctx.beginPath(); ctx.moveTo(rx, ry - B * 0.06); ctx.lineTo(rx, ry + B * 0.06); ctx.moveTo(rx - B * 0.06, ry); ctx.lineTo(rx + B * 0.06, ry); ctx.stroke(); D.text(Z.TT('С', 'N'), rx, ry - B * 0.085, B * 0.045, '#c8283c');
    ctx.restore(); }
  else if (k === 'oak') { D.rr(x - B * 0.2, gy - B * 2, B * 0.4, B * 2, B * 0.1); ctx.fillStyle = '#6b4a2f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); D.circ(x, gy - B * 2.3, B * 0.85, '#3f6a3a', l); D.circ(x - B * 0.6, gy - B * 1.9, B * 0.5, '#4a7a45', l); D.circ(x + B * 0.6, gy - B * 1.95, B * 0.5, '#456f40', l); ctx.strokeStyle = '#9aa1b5'; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(x + B * 0.35, gy - B * 1.6); ctx.lineTo(x + B * 0.45, gy - B * 1.0); ctx.stroke(); D.rr(x + B * 0.2, gy - B * 1.0, B * 0.5, B * 0.36, B * 0.05); ctx.fillStyle = '#8a5a35'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd54a'; ctx.fillRect(x + B * 0.2, gy - B * 0.86, B * 0.5, B * 0.05); D.circ(x + B * 0.45, gy - B * 0.8, B * 0.04, '#ffd54a'); }
  else if (k === 'pies') { ctx.save(); ctx.translate(x, gy); var T0 = B * 1.25;
    D.rr(-T0 * 0.6, -T0 * 0.5, T0 * 1.2, T0 * 0.1, T0 * 0.03); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    D.rr(-T0 * 0.6, -T0 * 0.42, T0 * 1.2, T0 * 0.12, T0 * 0.02); ctx.fillStyle = '#e8e0f0'; ctx.fill(); ctx.stroke(); for (var tc = 0; tc < 6; tc++) D.circ(-T0 * 0.5 + tc * T0 * 0.2, -T0 * 0.36, T0 * 0.025, '#e8484f');
    [-0.45, 0.45].forEach(function (q) { D.rr(q * T0 - T0 * 0.05, -T0 * 0.3, T0 * 0.1, T0 * 0.3, T0 * 0.02); ctx.fillStyle = '#7a4a20'; ctx.fill(); ctx.stroke(); });
    for (var pi = 0; pi < 5; pi++) { D.ell(-T0 * 0.4 + pi * T0 * 0.15, -T0 * 0.56, T0 * 0.07, T0 * 0.045, '#e0a050', l * 0.6); D.ell(-T0 * 0.42 + pi * T0 * 0.15, -T0 * 0.575, T0 * 0.03, T0 * 0.012, '#f8d090'); }
    if (D.samovar) D.samovar(T0 * 0.4, -T0 * 0.52, T0 * 0.42, t, l);   // 2.11.5: самовар с чайником и чашками вместо жёлтого кувшина
    D.ell(-T0 * 0.02, -T0 * 0.54, T0 * 0.07, T0 * 0.02, '#ffffff', l * 0.5); D.ell(-T0 * 0.02, -T0 * 0.565, T0 * 0.045, T0 * 0.012, '#c0392b');
    ctx.restore(); }
}
Z.MDIR.drawProp = drawProp;
})();
/* руки, перо, щука, передний план */
(function () {
var Z = window.Z, D = Z.D, OL = D.OL;
function c() { return D.ctx; }
// цвет рукава и варежки у каждого
var ARM = { MOR: ['#c9323c', '#e8484f'], SNE: ['#4a90d8', '#ffffff'], MET: ['#8a7cd8', '#e8eefb'], EME: ['#d84a4a', '#ffd7b0'], BEL: ['#ff8a3d', '#ffb07a'], KOL: null, PLO: ['#ffffff', '#ffffff'],
  VAS: ['#ffffff', '#ffe2c8'], KOT: ['#8e98b8', '#c9d0e4'], YAG: ['#5a2a6a', '#e8d0b0'], LES: ['#7a5a3a', '#5aa05a'], KIK: ['#5aa06a', '#7cc08a'], GIA: ['#bfe6ff', '#e8f4ff'], GOR: null, KOS: ['#2a2340', '#e8e0d0'], RAZ: ['#c83a3a', '#f1c9a0'], SOL: ['#3a4a8a', '#f1c9a0'], ENO: ['#8a8f9e', '#3d3d3d'], SHU: null };
// плечо — доля роста над землёй
var SHO = { MOR: 0.6, SNE: 0.6, MET: 0.62, EME: 0.55, BEL: 0.55, PLO: 0.55, VAS: 0.6, KOT: 0.5, YAG: 0.55, LES: 0.6, KIK: 0.55, GIA: 0.55, KOS: 0.6, RAZ: 0.55, SOL: 0.55, ENO: 0.5 };
// рука: ПОЗА, а не погоня за точкой. ang — угол руки от горизонтали вперёд (вверх положительный), bend — сгиб локтя.
// Длина постоянная, локоть всегда гнётся вниз — рука не выкручивается и не «летает».
Z.armGeom = function (v, x, y, H, dir, ang, ext) {
  var sx = x + dir * H * 0.13, syy = y - H * (SHO[v] || 0.55), Lr = H * 0.36 * (ext || 1);
  var a = -ang; return { sx: sx, sy: syy, hx: sx + dir * Math.cos(a) * Lr, hy: syy + Math.sin(a) * Lr };
};
Z.drawArm = function (v, x, y, H, dir, ang, ext) {
  var a = ARM[v]; if (!a) return null;
  var g = Z.armGeom(v, x, y, H, dir, ang, ext), ctx = c(), w = Math.max(4, H * 0.07);
  var mx = (g.sx + g.hx) / 2, my = (g.sy + g.hy) / 2, len = Math.hypot(g.hx - g.sx, g.hy - g.sy), bend = H * 0.05;
  var nx = -(g.hy - g.sy) / len, ny = (g.hx - g.sx) / len; if (ny < 0) { nx = -nx; ny = -ny; }
  var ex = mx + nx * bend, ey = my + ny * bend;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = OL; ctx.lineWidth = w + 4; ctx.beginPath(); ctx.moveTo(g.sx, g.sy); ctx.quadraticCurveTo(ex, ey, g.hx, g.hy); ctx.stroke();
  ctx.strokeStyle = a[0]; ctx.lineWidth = w; ctx.stroke();
  D.circ(g.hx, g.hy, w * 0.75, a[1], 2.5);
  return { x: g.hx, y: g.hy };
};
// гусиное перо
Z.drawQuill = function (x, y, s, rot) {
  var ctx = c(); ctx.save(); ctx.translate(x, y); ctx.rotate(rot || -0.6);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.25, -s * 0.5, s * 0.1, -s * 1.1); ctx.quadraticCurveTo(-s * 0.15, -s * 0.5, 0, 0); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
  ctx.strokeStyle = '#c9cfdc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.1, -s * 1.05); ctx.stroke();
  ctx.restore();
};
// Щука: царственная, хитрая, в короне. Высовывается из проруби вертикально, жестикулирует плавником.
function iceHole(x, y, R, l, front) {
  var ctx = c();
  if (!front) {
    D.ell(x, y, R * 0.52, R * 0.13, '#eaf4ff', l);            // ледяной бортик
    D.ell(x, y + R * 0.005, R * 0.43, R * 0.09, '#1d4f7a');     // тёмная вода
    D.ell(x - R * 0.08, y - R * 0.01, R * 0.22, R * 0.035, 'rgba(120,200,255,0.45)');
  } else { // передняя кромка льда поверх тела
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, R * 0.52, R * 0.13, 0, 0, Math.PI); ctx.ellipse(x, y + R * 0.005, R * 0.43, R * 0.09, 0, Math.PI, 0, true); ctx.closePath();
    ctx.fillStyle = '#eaf4ff'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.beginPath(); ctx.ellipse(x, y, R * 0.52, R * 0.13, 0, 0, Math.PI); ctx.stroke(); ctx.restore();
    var tt = Z.time || 0; for (var k = 0; k < 2; k++) { var q = (tt * 0.6 + k * 0.5) % 1; ctx.globalAlpha = 0.6 * (1 - q); ctx.strokeStyle = '#bfe6ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + R * 0.01, R * (0.22 + q * 0.2), R * (0.04 + q * 0.04), 0, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1;
  }
}
Z.drawPike = function (x, y, H, d, talk, t, noHole) {
  var ctx = c(), R = H, l = Math.max(2, R * 0.035), sw = Math.sin(t * 2.2) * 0.05;
  if (!noHole) iceHole(x, y, R, l, false);
  ctx.save(); ctx.translate(x, y); ctx.scale(-d, 1); ctx.rotate(sw);
  if (!noHole) { ctx.save(); ctx.beginPath(); ctx.rect(-R, -R * 2, R * 2, R * 2 + R * 0.01); ctx.clip(); }
  var jaw = talk ? 0.03 + 0.06 * Math.abs(Math.sin(t * 15)) : 0.012, gest = talk ? Math.sin(t * 5) : Math.sin(t * 1.3) * 0.3;
  // спинной плавник (позади)
  D.poly([R * 0.2, -R * 0.38, R * 0.42, -R * 0.5 + sw * R, R * 0.44, -R * 0.3, R * 0.24, -R * 0.18], '#e2683a', l * 0.8);
  // дальний грудной плавник «руку в бок»
  D.poly([R * 0.18, -R * 0.42, R * 0.36, -R * 0.36, R * 0.3, -R * 0.24, R * 0.2, -R * 0.3], '#d4592e', l * 0.7);
  // тело + голова одним контуром
  var bp = new Path2D(); bp.moveTo(R * 0.21, R * 0.02);
  bp.bezierCurveTo(R * 0.3, -R * 0.3, R * 0.24, -R * 0.62, R * 0.06, -R * 0.86);
  bp.quadraticCurveTo(-R * 0.1, -R * 0.98, -R * 0.34, -R * 0.94);
  bp.quadraticCurveTo(-R * 0.55, -R * 0.9, -R * 0.7, -R * 0.83);
  bp.quadraticCurveTo(-R * 0.72, -R * 0.8, -R * 0.68, -R * 0.79 + jaw * R);
  bp.quadraticCurveTo(-R * 0.5, -R * 0.72 + jaw * R, -R * 0.3, -R * 0.7 + jaw * R * 0.6);
  bp.quadraticCurveTo(-R * 0.22, -R * 0.66, -R * 0.24, -R * 0.55);
  bp.bezierCurveTo(-R * 0.29, -R * 0.35, -R * 0.27, -R * 0.12, -R * 0.22, R * 0.02); bp.closePath();
  var g = ctx.createLinearGradient(R * 0.28, 0, -R * 0.28, 0); g.addColorStop(0, '#2f5a3a'); g.addColorStop(0.45, '#5f9a5e'); g.addColorStop(0.75, '#b8d898'); g.addColorStop(1, '#f2f4d8');
  ctx.fillStyle = g; ctx.fill(bp);
  // щучий узор: светлые продолговатые пятна по спине
  ctx.save(); ctx.clip(bp);
  for (var r0 = 0; r0 < 5; r0++) for (var c0 = 0; c0 < 2; c0++) { var yy = -R * 0.12 - r0 * R * 0.13 - c0 * R * 0.065, xx = R * 0.19 - c0 * R * 0.09; if (yy < -R * 0.74) continue; D.ell(xx, yy, R * 0.022, R * 0.038, 'rgba(225,240,170,0.6)'); }
  ctx.fillStyle = 'rgba(30,60,40,0.35)'; ctx.fillRect(-R * 0.75, -R * 0.84, R * 0.5, R * 0.03); // тень под мордой
  ctx.restore();
  ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(bp);
  // пасть: тёмная щель + зубки + хитрая улыбка в уголке
  ctx.beginPath(); ctx.moveTo(-R * 0.69, -R * 0.81); ctx.quadraticCurveTo(-R * 0.5, -R * 0.76, -R * 0.31, -R * 0.75); ctx.quadraticCurveTo(-R * 0.5, -R * 0.73 + jaw * R, -R * 0.67, -R * 0.79 + jaw * R); ctx.closePath(); ctx.fillStyle = '#7a1e30'; ctx.fill();
  for (var tth = 0; tth < 5; tth++) { var tx = -R * (0.64 - tth * 0.065); D.poly([tx, -R * 0.795 + tth * R * 0.008, tx + R * 0.02, -R * 0.765 + tth * R * 0.008, tx + R * 0.04, -R * 0.79 + tth * R * 0.008], '#ffffff'); }
  ctx.strokeStyle = OL; ctx.lineWidth = l * 0.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 0.69, -R * 0.81); ctx.quadraticCurveTo(-R * 0.5, -R * 0.76, -R * 0.31, -R * 0.75); ctx.quadraticCurveTo(-R * 0.26, -R * 0.76, -R * 0.25, -R * 0.8); ctx.stroke();
  // жабра
  ctx.lineWidth = l * 0.6; ctx.strokeStyle = 'rgba(30,50,40,0.55)'; ctx.beginPath(); ctx.moveTo(-R * 0.02, -R * 0.84); ctx.quadraticCurveTo(-R * 0.1, -R * 0.74, -R * 0.06, -R * 0.64); ctx.stroke(); ctx.strokeStyle = OL;
  // ноздря
  D.circ(-R * 0.6, -R * 0.86, R * 0.012, OL);
  // глаз: крупный, золотой, с тяжёлым веком — смотрит свысока
  var ex = -R * 0.24, ey = -R * 0.86, blink = (t % 4.2) < 0.12;
  D.circ(ex, ey, R * 0.085, '#ffffff', l * 0.7);
  if (!blink) { D.circ(ex - R * 0.02, ey + R * 0.01, R * 0.06, '#f2c33a'); D.circ(ex - R * 0.028, ey + R * 0.012, R * 0.034, '#1a1a2e'); D.circ(ex - R * 0.012, ey - R * 0.008, R * 0.014, '#ffffff'); }
  // веко
  ctx.beginPath(); ctx.arc(ex, ey, R * 0.087, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(ex + R * 0.087, ey - (blink ? -R * 0.02 : R * 0.015)); ctx.quadraticCurveTo(ex, ey + (blink ? R * 0.09 : -R * 0.005), ex - R * 0.087, ey - R * 0.0); ctx.closePath(); ctx.fillStyle = '#4f8556'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
  // ресницы
  ctx.lineWidth = l * 0.6; ctx.beginPath(); for (var e = 0; e < 3; e++) { var a0 = Math.PI * (1.15 + e * 0.12); ctx.moveTo(ex + Math.cos(a0) * R * 0.085, ey + Math.sin(a0) * R * 0.05); ctx.lineTo(ex + Math.cos(a0) * R * 0.125, ey + Math.sin(a0) * R * 0.09 - R * 0.01); } ctx.stroke();
  // приподнятая бровь
  ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(-R * 0.34, -R * 0.96 - (talk ? Math.abs(Math.sin(t * 3)) * R * 0.02 : 0)); ctx.quadraticCurveTo(-R * 0.25, -R * 1.0, -R * 0.15, -R * 0.96); ctx.stroke();
  // корона набекрень
  ctx.save(); ctx.translate(-R * 0.05, -R * 0.97); ctx.rotate(0.28);
  D.poly([-R * 0.13, 0, -R * 0.16, -R * 0.15, -R * 0.08, -R * 0.08, 0, -R * 0.2, R * 0.08, -R * 0.08, R * 0.16, -R * 0.15, R * 0.13, 0], '#ffd54a', l * 0.8);
  ctx.fillStyle = '#e8a820'; ctx.fillRect(-R * 0.13, -R * 0.035, R * 0.26, R * 0.035);
  D.circ(0, -R * 0.1, R * 0.025, '#e8484f'); D.circ(-R * 0.16, -R * 0.15, R * 0.016, '#ffffff'); D.circ(0, -R * 0.2, R * 0.016, '#ffffff'); D.circ(R * 0.16, -R * 0.15, R * 0.016, '#ffffff');
  ctx.restore();
  // ближний грудной плавник — «рука», жестикулирует
  ctx.save(); ctx.translate(-R * 0.18, -R * 0.5); ctx.rotate(-0.5 - gest * 0.45);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-R * 0.12, -R * 0.1, -R * 0.24, -R * 0.06); ctx.quadraticCurveTo(-R * 0.2, R * 0.02, -R * 0.24, R * 0.07); ctx.quadraticCurveTo(-R * 0.1, R * 0.08, 0, R * 0.05); ctx.closePath();
  ctx.fillStyle = '#ef7a44'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  ctx.strokeStyle = 'rgba(150,50,20,0.6)'; ctx.lineWidth = l * 0.4; ctx.beginPath(); for (var f = 0; f < 3; f++) { ctx.moveTo(-R * 0.02, R * 0.02); ctx.lineTo(-R * 0.21, -R * 0.04 + f * R * 0.05); } ctx.stroke();
  ctx.restore();
  if (!noHole) ctx.restore();
  ctx.restore();
  if (!noHole) {
    iceHole(x, y, R, l, true);
    // капли с плавника
    for (var dq = 0; dq < 3; dq++) { var ph = (t * 0.8 + dq / 3) % 1; ctx.globalAlpha = 1 - ph; D.circ(x + d * (-R * 0.3 + dq * R * 0.04) * 0, y - R * 0.45 + ph * R * 0.45, R * 0.014, '#bfe6ff'); } ctx.globalAlpha = 1;
  }
};
})();
