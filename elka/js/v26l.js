// v2.6l: сцены перед уровнями — озвучены и представляют тех, кто впервые появляется на уровне
(function () {
  var Z = window.Z;
  var DATA = [["LV-00", "SNE", "Еноты Метелицы уже у опушки! Ставь снеговиков у дороги — защитим ёлку!", "The Witch's raccoons are at the forest edge! Put snowmen by the road — let's protect the tree!", ["e:raccoon"]], ["LV-01", "SNE", "Сосулькины шныряют там, где меньше вышек. А с пеньков бить дальше — пользуйся!", "Icicles sneak where there are fewer towers. And towers on stumps shoot farther — use them!", ["e:icicle"]], ["LV-02", "SNE", "Везём подарки в лесную сторожку! Прикрой сани — еноты так и норовят их стащить.", "We're taking gifts to the forest lodge! Cover the sleigh — the raccoons keep trying to steal them.", ["e:raccoon", "e:thrower"]], ["LV-03", "MOR", "Я вернулся из дозора! Укажи, куда идти, — задержу любого. Смотри, Морозяка: толстый, да медленный.", "I'm back from patrol! Tell me where to go and I'll hold anyone back. Look, a Frostbrute: fat, but slow.", ["e:fat"]], ["LV-04", "MET", "Мои еноты-метатели разнесут ваших снеговиков, а плотники выстроят мне частоколы!", "My raccoon throwers will smash your snowmen, and my carpenters will build me palisades!", ["e:thrower", "e:engineer"]], ["LV-05", "SNE", "В этой чаще живёт Леший. Он путает дороги и водит кругами. Не дай ему сбить наши сани!", "Leshy lives in this thicket. He tangles the roads and leads you in circles. Don't let him lose our sleigh!", ["e:leshy"]], ["LV-06", "MET", "Ледяной Великан, просыпайся! Растопчи их крепость!", "Ice Giant, wake up! Stomp their fortress flat!", ["e:giant"]], ["LV-07", "SNE", "Дедушка, я с тобой — буду лечить и замораживать! Ой, еноты пригнали снегоходы. Быстрые!", "Grandpa, I'm with you — I'll heal and freeze! Oh, the raccoons brought snowmobiles. They're fast!", ["e:sled", "e:raccoon"]], ["LV-08", "MET", "Вороны на шарах — бомбите их вышки! А разбойники пусть взрывают всё подряд!", "Crows in balloons — bomb their towers! And let the bandits blow up everything!", ["e:crow", "e:raz"]], ["LV-09", "MOR", "Гляди-ка, Емеля на печи — он с нами! А Лепила лепит из сугробов часовых. Ломай их!", "Look, Emelya on his stove — he's with us! And the Sculptor builds sentries from snowdrifts. Break them!", ["a:emelya", "e:sculptor"]], ["LV-10", "MET", "Баба-Яга, вылетай из избушки! Пусть ступа пронесётся над их обороной!", "Baba Yaga, fly out of your hut! Let the mortar sweep over their defenses!", ["e:yaga"]], ["LV-11", "SNE", "К нам белка Шишка прискакала — шишки у неё меткие! А в погребах враги лезут из-под земли. Смотри в оба!", "Shishka the squirrel came to help — her pinecones never miss! And in the cellars, enemies climb out of the ground. Watch out!", ["a:belka"]], ["LV-12", "SNE", "Последний деревенский обоз. Мостов много — ставь вышки у переправ!", "The last village convoy. Lots of bridges — put towers by the crossings!", ["e:raz", "e:sled"]], ["LV-13", "MET", "Я сама поведу колесницу! Сметите эту деревню!", "I will drive the chariot myself! Sweep this village away!", ["e:chariot"]], ["LV-14", "MOR", "Озеро. Метелица прислала сани-тараны — они пробивают баррикады. Бей издалека!", "The lake. The Witch sent battering sleighs — they break barricades. Hit them from afar!", ["e:ram"]], ["LV-15", "SNE", "Колобок с нами! А на мостках Кикимора и Снегоплюхи — они делятся надвое. Бей по площади!", "Kolobok is with us! And on the piers — Kikimora and Snowplops, they split in two. Use splash damage!", ["a:kolobok", "e:split"]], ["LV-16", "SNE", "Пломбир, снеговик-богатырь, прикроет наши сани! Плывём к острову — держимся вместе!", "Plombir, the snowman hero, will guard our sleigh! We sail to the island — stay together!", ["a:plombir"]], ["LV-17", "MOR", "Ледоход! Льдины плывут и меняют дорогу. Строй там, где лёд держит.", "Ice drift! The floes move and change the road. Build where the ice holds.", ["e:ram", "e:split"]], ["LV-18", "MET", "Кикимора, зажигай огоньки в камышах! А мои плотники пусть строят вдвое быстрее!", "Kikimora, light the lanterns in the reeds! And let my carpenters build twice as fast!", ["e:kiki"]], ["LV-19", "SNE", "Бобры построили плотину. Нажми на неё — и волна смоет врагов!", "The beavers built a dam. Tap it — and the wave will wash the enemies away!", ["e:raccoon", "e:sled"]], ["LV-20", "MET", "Змей Горыныч, на Калинов мост! Три головы лучше одной!", "Zmey Gorynych, to Kalinov Bridge! Three heads are better than one!", ["e:gorynych"]], ["LV-21", "MOR", "Горы. Здесь её снегоуборщики — броня толстая, бей баллистой. И берегись лавин!", "The mountains. Her snowplows are here — thick armor, use ballistas. And beware of avalanches!", ["e:plow"]], ["LV-22", "SNE", "Василиса Премудрая с нами! Враги стали быстрее — колдуй вовремя.", "Vasilisa the Wise is with us! The enemies got faster — cast your spells in time.", ["a:vasilisa"]], ["LV-23", "SNE", "Горячие источники. Пар прячет врагов. Сани пройдут, если ты прикроешь.", "Hot springs. The steam hides the enemies. The sleigh will make it if you cover us.", ["e:sculptor", "e:fat"]], ["LV-24", "MET", "В ледяных пещерах темно. Мои лучшие воины придут из тьмы!", "It's dark in the ice caves. My best warriors will come out of the darkness!", ["e:fat", "e:thrower"]], ["LV-25", "MOR", "Кот-Баюн пришёл — его песня усыпляет врагов! А вороны прилетят стаями, береги небо.", "Kot-Bayun is here — his song puts enemies to sleep! And crows will come in flocks, guard the sky.", ["a:kot", "e:crow"]], ["LV-26", "SNE", "Ущелье и камнепады. Последний горный обоз — дальше только полюс!", "A gorge and rockfalls. The last mountain convoy — only the Pole lies ahead!", ["e:plow", "e:ram"]], ["LV-27", "MET", "Кощей, защищай свой замок! Пока цел сундук — ты бессмертен!", "Koschei, defend your castle! While the chest is whole, you are immortal!", ["e:koschei"]], ["LV-28", "SNE", "Северное сияние! Красиво… Но её строители опять торопятся. Сноси их постройки!", "The Northern Lights! Beautiful… But her builders are rushing again. Demolish their buildings!", ["e:engineer", "e:sculptor"]], ["LV-29", "MET", "Моя метеостанция! Ветер свернёт ваши снаряды, а броню моих воинов не пробить!", "My weather station! The wind will bend your shots, and my warriors' armor can't be pierced!", ["e:plow"]], ["LV-30", "MOR", "Льдины дрейфуют. Детям полюса тоже нужны подарки — вперёд!", "The floes are drifting. The children of the Pole need gifts too — onward!", ["e:ram", "e:sled"]], ["LV-31", "MET", "Ледокол, круши их оборону! Быстрее, быстрее!", "Icebreaker, crush their defenses! Faster, faster!", ["e:sled", "e:fat"]], ["LV-32", "SNE", "Ледяной лабиринт. Звезда мерцает над замком — ещё чуть-чуть!", "The ice maze. The Star is shining above the castle — almost there!", ["e:split", "e:icicle"]], ["LV-33", "MOR", "Последний обоз. После него — к Метелице!", "The last convoy. After it — to the Witch!", ["e:raccoon", "e:plow"]], ["LV-34", "MET", "Я сама выйду на бой! Звезду вы не получите!", "I will fight you myself! You will never get the Star!", ["e:witch"]]];
  var WHO = { MOR: 'moroz', SNE: 'sneg', MET: 'met' }, NM = { MOR: ['Дед Мороз', 'Grandfather Frost'], SNE: ['Снегурочка', 'Snow Maiden'], MET: ['Метелица', 'Blizzard Witch'] };
  // рост относительно Деда Мороза (1) и высота рисунка на 100 единиц масштаба (замерено) — великаны выше всех, белка и колобок маленькие
  var REL = { raccoon: 0.45, thrower: 0.5, engineer: 0.47, sculptor: 0.5, icicle: 0.38, fat: 0.62, sled: 0.48, ram: 0.55, plow: 0.8, split: 0.42, crow: 0.85, leshy: 1.15, raz: 0.9, yaga: 0.95, kiki: 0.85,
    solovey: 1.5, koschei: 1.05, chariot: 1.45, giant: 2.4, gorynych: 2.2, sneg: 0.9, emelya: 0.95, belka: 0.38, kolobok: 0.3, plombir: 1.15, vasilisa: 0.9, kot: 0.5 };
  var BB = { raccoon: 73, thrower: 88, engineer: 73, sculptor: 76, icicle: 68, fat: 76, sled: 63, ram: 53, plow: 59, split: 62, crow: 102, leshy: 88, raz: 64, yaga: 58, kiki: 73, solovey: 130, koschei: 80, chariot: 88, giant: 91, gorynych: 73,
    sneg: 251, emelya: 222, belka: 217, kolobok: 139, plombir: 228, vasilisa: 231, kot: 258 };
  var HM = 3.39 * 0.45 * 0.3;   // рост Деда Мороза в долях высоты картинки
  function sizeFor(tp, isA) {
    var hgt = Math.min(0.86, (REL[tp] || 0.5) * HM);
    if (isA) return hgt / (BB[tp] / 100 * 0.45);
    var fs = Math.min(1.2, (Z.ENEMIES[tp] && Z.ENEMIES[tp].size) || 1); return hgt / (BB[tp] / 100 * fs * 1.3);
  }
  DATA.forEach(function (d, i) {
    var id = d[0], v = d[1], foe = v === 'MET';
    Z.VL[id] = [v, d[2]]; if (Z.VLEN) Z.VLEN[id] = d[3];
    var old = Z.COMICS['lv_' + i], sc = old && old[0] ? old[0].sc : 'night';
    var ch = [[WHO[v], foe ? 0.74 : 0.26, 0.9, v === 'MET' ? 0.36 : v === 'SNE' ? 0.29 : 0.3, foe ? { star: true, dir: -1 } : {}]];
    var xs = d[4].length > 1 ? (foe ? [0.16, 0.4] : [0.6, 0.84]) : (foe ? [0.3] : [0.7]);
    if (i === 34) xs = [0.3];
    var big = d[4].length === 1 && (REL[d[4][0].slice(2)] || 0) >= 2; if (big) { xs = [d[4][0] === 'e:gorynych' ? 0.42 : 0.36]; ch[0][1] = d[4][0] === 'e:gorynych' ? 0.85 : 0.8; }   // великан и Горыныч целиком в кадре
    d[4].forEach(function (c, k) {
      if (i === 34) { ch = [['met', 0.5, 0.9, 0.38, { star: true }]]; return; }
      var isA = c.indexOf('a:') === 0, tp = c.slice(2);
      var air = Z.ENEMIES[tp] && Z.ENEMIES[tp].air; ch.push([c, xs[k], isA ? 0.9 : (air ? 0.62 : 0.93), sizeFor(tp, isA), isA ? { dir: foe ? 1 : -1 } : null]);
    });
    Z.COMICS['lv_' + i] = [{ sc: sc, ch: ch, k: 'lv_' + i, who: WHO[v], v: id }];
    Z.TXT.ru['lv_' + i] = NM[v][0] + ': «' + d[2] + '»';
    Z.TXT.en['lv_' + i] = NM[v][1] + ': "' + d[3] + '"';
  });
})();

// ---------- избы: не клонами — у каждой свой вид (крыша, цвет, размер, окна, труба, терем, амбар) ----------
(function () {
  var Z = window.Z, D = Z.D, OL = '#26304f';
  var ROOF = ['#b8323a', '#3d6fc4', '#2f8f5b', '#8a5a35', '#7a3fa0', '#c96b2a', '#2a8a96'];
  var WALL = [['#c7925f', '#9c6c40'], ['#b88250', '#8e5f36'], ['#d4a26c', '#a8774a'], ['#a87348', '#7f5332'], ['#cfa37a', '#a07650']];
  var SHUT = ['#3d6fc4', '#b8323a', '#2f8f5b', '#ffd54a', '#ffffff'];
  function sh(c, k) { return D.shade ? D.shade(c, k) : c; }
  D.house = function (x, y, cs, seed) {
    var ctx = D.ctx;
    if (seed === undefined) seed = Math.round(x * 0.37 + y * 0.71);   // без номера — по месту (картинки рисуются один раз)
    var r = Z.rng(Math.abs(seed | 0) * 7919 + 13), pick = function (a) { return a[Math.floor(r() * a.length)]; };
    var type = r(), roof = pick(ROOF), wall = pick(WALL), shut = pick(SHUT);
    var kind = type < 0.5 ? 'izba' : type < 0.68 ? 'tall' : type < 0.84 ? 'terem' : 'barn';
    var w = cs * (kind === 'barn' ? 0.92 : 0.62 + r() * 0.2), h = cs * (kind === 'tall' ? 0.72 : kind === 'barn' ? 0.42 : 0.44 + r() * 0.12), rh = cs * (0.3 + r() * 0.16), dep = cs * 0.16, l = Math.max(1.2, cs * 0.045);
    // 2.11.5: тень у основания — дом стоит на земле
    ctx.fillStyle = 'rgba(30,40,80,0.22)'; ctx.beginPath(); ctx.ellipse(x + dep * 0.5, y + cs * 0.01, w * 0.62 + dep * 0.4, cs * 0.075, 0, 0, Math.PI * 2); ctx.fill();
    // боковая стена в три четверти
    D.poly([x + w / 2, y, x + w / 2 + dep, y - cs * 0.08, x + w / 2 + dep, y - h - cs * 0.08, x + w / 2, y - h], wall[1], l);
    D.rr(x - w / 2, y - h, w, h, cs * 0.05); ctx.fillStyle = wall[0]; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = 'rgba(90,55,30,0.45)'; ctx.lineWidth = l * 0.6;
    var nl = kind === 'tall' ? 6 : 4; for (var lg = 1; lg < nl; lg++) { ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * lg / nl); ctx.lineTo(x + w / 2, y - h * lg / nl); ctx.stroke(); }
    // труба с дымком
    if (kind !== 'barn' && r() < 0.6) {
      var chx = x + w * (r() < 0.5 ? -0.22 : 0.2); D.rr(chx - cs * 0.05, y - h - rh * 0.75, cs * 0.1, rh * 0.5, 2); ctx.fillStyle = '#8a8fa8'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
      ctx.fillStyle = 'rgba(220,228,245,0.7)'; for (var sm = 0; sm < 3; sm++) { ctx.beginPath(); ctx.arc(chx + sm * cs * 0.05, y - h - rh * 0.85 - sm * cs * 0.1, cs * (0.04 + sm * 0.02), 0, 7); ctx.fill(); }
    }
    // крыша
    var peak = y - h - rh;
    if (kind === 'barn') {
      D.poly([x - w * 0.58, y - h, x - w * 0.3, peak + rh * 0.25, x + w * 0.3, peak + rh * 0.25, x + w * 0.58, y - h], roof, l);
      D.rr(x - w * 0.18, y - h * 0.8, w * 0.36, h * 0.8, 2); ctx.fillStyle = sh(wall[1], -10); ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - w * 0.18, y - h * 0.8); ctx.lineTo(x + w * 0.18, y); ctx.moveTo(x + w * 0.18, y - h * 0.8); ctx.lineTo(x - w * 0.18, y); ctx.stroke();
    } else {
      D.poly([x + w * 0.62, y - h, x, peak, x + w * 0.62 + dep, y - h - cs * 0.08], sh(roof, -25), l);
      D.poly([x - w * 0.62, y - h, x, peak, x + w * 0.62, y - h], roof, l);
    }
    ctx.beginPath(); ctx.moveTo(x - w * 0.55, y - h - cs * 0.03); ctx.lineTo(x, peak + cs * 0.04); ctx.lineTo(x + w * 0.55, y - h - cs * 0.03); ctx.strokeStyle = '#fff'; ctx.lineWidth = l * (1.2 + r() * 0.8); ctx.stroke();
    if (kind === 'terem') {   // башенка с флюгером
      var tw = w * 0.28, tx = x + w * 0.05; D.rr(tx - tw / 2, peak - cs * 0.02, tw, cs * 0.22, 2); ctx.fillStyle = wall[0]; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
      D.poly([tx - tw * 0.7, peak - cs * 0.02, tx, peak - cs * 0.3, tx + tw * 0.7, peak - cs * 0.02], roof, l * 0.8);
      ctx.strokeStyle = OL; ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(tx, peak - cs * 0.3); ctx.lineTo(tx, peak - cs * 0.42); ctx.stroke(); D.poly([tx, peak - cs * 0.42, tx + cs * 0.1, peak - cs * 0.38, tx, peak - cs * 0.34], '#ffd54a', l * 0.5);
    }
    // окна и ставни
    if (kind !== 'barn') {
      var rows = kind === 'tall' ? 2 : 1, cols = w > cs * 0.72 || kind === 'tall' ? 2 : 1, lit = r() < 0.75;
      for (var ry = 0; ry < rows; ry++) for (var cx = 0; cx < cols; cx++) {
        var wx = x + (cols === 1 ? 0 : (cx ? 0.2 : -0.2) * w), wy = y - h * (rows === 1 ? 0.62 : ry ? 0.82 : 0.4), ww = w * (cols === 1 ? 0.28 : 0.2), wh = h * (rows === 1 ? 0.34 : 0.2);
        D.rr(wx - ww / 2, wy, ww, wh, 2); ctx.fillStyle = lit ? '#ffcf6b' : '#4a5a85'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
        ctx.fillStyle = shut; ctx.fillRect(wx - ww / 2 - ww * 0.28, wy, ww * 0.24, wh); ctx.fillRect(wx + ww / 2 + ww * 0.04, wy, ww * 0.24, wh);
      }
      if (cols === 1 && r() < 0.5) { D.rr(x + w * 0.24, y - h * 0.5, w * 0.16, h * 0.5, 2); ctx.fillStyle = sh(wall[1], -15); ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke(); }
    }
    // сугроб у стены
    if (r() < 0.6) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x + (r() - 0.5) * w * 0.6, y, w * (0.2 + r() * 0.2), cs * 0.07, 0, Math.PI, 0); ctx.fill(); }
  };
})();

// ---------- анимация: Снегурочка и Кот двигаются при ходьбе и атаке; вспышка попадания у тех, у кого её не было ----------
(function () {
  var Z = window.Z, D = Z.D;
  var oldAlly = D.ally;
  D.ally = function (type, x, y, R, o) {
    if (type !== 'sneg' && type !== 'kot') return oldAlly.apply(this, arguments);
    o = o || {}; var ctx = D.ctx, t = Z.time, d = o.dir || 1, ph = (x * 0.013) % 6;
    var bob, lean, sx = 1, sy = 1;
    if (type === 'sneg') {   // плывёт в шубке: мягкое покачивание, подол чуть пружинит
      bob = o.walk ? Math.abs(Math.sin(t * 7 + ph)) * R * 0.06 : Math.sin(t * 1.8 + ph) * R * 0.012;
      lean = o.walk ? 0.06 + Math.sin(t * 7 + ph) * 0.03 : 0;
      if (o.walk) { sy = 1 + Math.sin(t * 14 + ph) * 0.02; sx = 2 - sy; }
      if (o.atk) { lean = 0.16; sx = 1.04; sy = 0.97; }
    } else {   // кот перепрыгивает лапками, при песне раскачивается
      bob = o.walk ? Math.abs(Math.sin(t * 9 + ph)) * R * 0.16 : 0;
      lean = o.walk ? Math.sin(t * 9 + ph) * 0.06 : (o.atk ? Math.sin(t * 6) * 0.12 : 0);
      var kp2 = o.atkP != null && o.atkP >= 0 ? o.atkP : -1;   // 2.7.21: выпад лапой вперёд
      if (kp2 >= 0) { var kw = kp2 < 0.25 ? kp2 / 0.25 : Math.max(0, 1 - (kp2 - 0.25) / 0.5); lean = 0.22 * kw; x += d * R * 0.12 * kw; bob = R * 0.08 * Math.sin(Math.min(1, kp2 / 0.5) * Math.PI); }
      if (o.walk) { var land = Math.max(0, -Math.sin(t * 9 + ph)); sy = 1 - land * 0.07; sx = 1 + land * 0.06; }
    }
    ctx.save(); ctx.translate(x, y - bob); ctx.rotate(lean * d); ctx.scale(sx, sy);
    oldAlly.call(this, type, 0, 0, R, o);
    ctx.restore();
    if (o.atk) {
      if (type === 'sneg') { for (var i = 0; i < 4; i++) { var a = t * 4 + i * 1.57, rr = R * (0.35 + 0.15 * Math.sin(t * 9 + i)); D.flake(x + d * R * 0.75 + Math.cos(a) * rr, y - R * 1.3 + Math.sin(a) * rr * 0.6, R * 0.09, '#ffffff', Math.max(1, R * 0.03)); } }
      else {
        // 2.7.21: кот царапает — три следа когтей перед мордой
        var cp = o.atkP != null && o.atkP >= 0 ? o.atkP : -1;
        if (cp >= 0.15 && cp < 0.75) { var cu = (cp - 0.15) / 0.6, ca = Math.min(1, cu * 2.2); ctx.save(); ctx.globalAlpha = 1 - cu; ctx.lineCap = 'round';
          for (var cl = 0; cl < 3; cl++) { var cx0 = x + d * R * (0.62 + cl * 0.15), cy0 = y - R * (1.2 - cl * 0.06); ctx.strokeStyle = '#26304f'; ctx.lineWidth = Math.max(2, R * 0.08); ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + d * R * 0.32 * ca, cy0 + R * 0.62 * ca); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, R * 0.04); ctx.stroke(); }
          ctx.restore(); }
        for (var n = 0; n < 3; n++) { var p = (t * 0.8 + n / 3) % 1; ctx.globalAlpha = 1 - p; D.text(n % 2 ? '♪' : '♫', x + d * R * (0.4 + p * 0.6), y - R * (1.2 + p * 0.9), R * 0.35, '#ffd54a', 'center', 'middle', Math.max(1, R * 0.05)); } ctx.globalAlpha = 1; }
    }
  };
  var FLASH = { witch: 1, hare: 1, solovey: 1, duck: 1 };
  var oldEnemy = D.enemy;
  D.enemy = function (e, x, y, cs, t) {
    if (!(e && FLASH[e.type] && e.hitT > 0)) return oldEnemy.apply(this, arguments);
    var ctx = D.ctx, k = Math.min(1, e.hitT / 0.15), sz = e.size || 1;
    ctx.save(); ctx.translate(Math.sin(Z.time * 80) * cs * 0.03 * k, 0);
    oldEnemy.call(this, e, x, y, cs, t);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45 * k; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(x, y - cs * 0.42 * sz, cs * 0.32 * sz, cs * 0.45 * sz, 0, 0, 7); ctx.fill();
    ctx.restore();
  };
})();

// ---------- говорящие враги без нарисованного рта (еноты, инженер, метатель, ворона): рот под их настоящими глазами ----------
(function () {
  var Z = window.Z, D = Z.D, OWN = { leshy: 1, raz: 1, yaga: 1, kiki: 1, koschei: 1, gorynych: 1, solovey: 1, hare: 1, duck: 1 }, busy = false, prev = D.enemy;
  D.enemy = function (e, x, y, cs, t) {
    var r = prev.apply(this, arguments);
    if (!e || !e.talk || busy || OWN[e.type] || !Z.eyeSpots || !Z.mouthAt) return r;
    var es; busy = true; try { es = Z.eyeSpots(e, x, y, cs, t); } catch (err) { es = []; } finally { busy = false; }
    if (!es || es.length < 2) return r;
    var a = es[0], b = es[1], ctx = D.ctx, inv = ctx.getTransform().inverse();
    var pa = inv.transformPoint({ x: a[0], y: a[1] }), pb = inv.transformPoint({ x: b[0], y: b[1] }), sp = Math.hypot(pa.x - pb.x, pa.y - pb.y);
    Z.mouthAt((pa.x + pb.x) / 2, Math.max(pa.y, pb.y) + sp * 0.75, sp * 0.42);
    return r;
  };
})();
