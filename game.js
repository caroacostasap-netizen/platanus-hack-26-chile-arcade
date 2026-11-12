// ¡Comprá tu auto! — Platanus Hack 26 Arcade Challenge
// Juego educativo: el circuito de SAP para comprar un auto en Argentina.
// Pasos: Pedido, Fábrica, Camión, Factura, Chapita y Llaves.
// Módulos: SD, PP, MM, QM, LE, FI y CO. Para 1 o 2 jugadores.

const W = 800, H = 600;

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) KEYBOARD_TO_ARCADE[normalizeIncomingKey(key)] = arcadeCode;
}
function normalizeIncomingKey(key) {
  if (typeof key !== 'string' || !key.length) return '';
  return key === ' ' ? 'space' : key.toLowerCase();
}

// ---------- Entrada: solo códigos del gabinete ----------
const held = {}, pressed = {};
addEventListener('keydown', e => {
  const c = KEYBOARD_TO_ARCADE[normalizeIncomingKey(e.key)];
  if (!c) return;
  e.preventDefault();
  if (!held[c]) pressed[c] = 1;
  held[c] = 1;
  audioOn();
});
addEventListener('keyup', e => {
  const c = KEYBOARD_TO_ARCADE[normalizeIncomingKey(e.key)];
  if (c) held[c] = 0;
});
addEventListener('blur', () => { for (const k in held) held[k] = 0; });
const hit = c => (pressed[c] ? (delete pressed[c], 1) : 0);
const clearKeys = () => { for (const k in pressed) delete pressed[k]; };
const DIR = ['L', 'D', 'U', 'R'];
const dirHit = p => { for (let i = 0; i < 4; i++) if (hit(p + DIR[i])) return i; return -1; };
// A acepta también los botones extra (3 a 6), porque mucha gente aprieta cualquiera
const btnA = p => [1, 3, 4, 5, 6].map(n => hit(p + n)).some(Boolean);
const btnB = p => hit(p + '2');

// ---------- Colores (paleta oscura del documento) ----------
const BG = 0x151a23, SF = 0x212935, SF2 = 0x2c3646, LN = 0x04060a, P1C = 0x4aa3ef, P2C = 0xffc933,
  OK = 0x5bd17f, ER = 0xff6b6b, WA = 0xffa94d, IN = 0x74c0fc, BLUE = 0x1f4fa3, GRAY = 0x5a6678;
const ARW = [0xff4f8b, 0x2f9df4, 0x28b85c, 0xff9a1f];
const hx = n => '#' + n.toString(16).padStart(6, '0');
const F = 'Arial, Helvetica, sans-serif';

// ---------- Contenido ----------
const MOD = {
  SD: ['Ventas', 0x1c7ed6, 'Hizo el pedido y la factura, anotó la patente y te dio las llaves.', 'vende y factura'],
  PP: ['Producción', 0x7950f2, 'Planificó y fabricó tu auto.', 'fabrica el auto'],
  MM: ['Compras', 0xf59f00, 'Compró las piezas y sacó el auto del depósito.', 'compra y guarda las piezas'],
  QM: ['Calidad', 0x1098ad, 'Revisó que tu auto saliera perfecto.', 'controla la calidad'],
  LE: ['Logística', 0xe03131, 'Armó la entrega y el viaje en camión.', 'mueve los camiones'],
  FI: ['Finanzas', 0x2f9e44, 'Revisó el crédito y anotó toda la plata.', 'maneja la plata'],
  CO: ['Costos', 0xd6336c, 'Calculó el costo y cuánto ganó la empresa.', 'calcula los costos'],
};
const MK = Object.keys(MOD);

// n nombre, x transacción, t título, d documento, s sello, m módulos (el primero es el principal),
// b globo al terminar, o barra de SAP, k texto si se lo saltean, f lo que falta
const STEPS = [
  { n: 'Pedido', x: 'VA01', t: 'Crear pedido de venta', d: 'Pedido 10{d}', s: 'GRABADO',
    m: [['SD', 'Ventas está creando el pedido'], ['FI', 'Finanzas revisa si podés pagar']],
    b: '¡Quiero un auto {c}! SD anotó mi pedido y FI dijo que puedo pagar.', o: 'Se grabó el Pedido 10{d}',
    k: 'SAP no sabe qué auto querés. ¡Primero hacé el pedido!', f: 'el pedido' },
  { n: 'Fábrica', x: 'CO01', t: 'Crear orden de fabricación', d: 'Orden 20{d}', s: 'GRABADA',
    m: [['PP', 'Producción está fabricando tu auto'], ['MM', 'Compras trae las piezas'], ['QM', 'Calidad revisa la calidad'], ['CO', 'Costos calcula el costo']],
    b: '¡PP armó mi auto, MM trajo las piezas y QM lo revisó!', o: 'Orden 20{d} (del Pedido 10{d})',
    k: 'Tu auto todavía no existe. ¡Primero la fábrica lo tiene que armar!', f: 'la orden de fabricación' },
  { n: 'Camión', x: 'VL01N', t: 'Crear entrega', d: 'Entrega 80{d}', s: 'GRABADA',
    m: [['LE', 'Logística está preparando el camión'], ['MM', 'Compras saca el auto del depósito'], ['FI', 'Finanzas anota el movimiento']],
    b: '¡LE subió mi auto al camión rumbo a la concesionaria!', o: 'Entrega 80{d} (del Pedido 10{d})',
    k: 'Tu auto sigue en la fábrica. ¡Primero subilo al camión!', f: 'la entrega' },
  { n: 'Factura', x: 'VF01', t: 'Crear factura', d: 'Factura 90{d}', s: 'GRABADA',
    m: [['SD', 'Ventas está haciendo la factura'], ['FI', 'Finanzas anota la plata'], ['CO', 'Costos mide la ganancia']],
    b: 'SD hizo la factura y FI anotó cuánto debo pagar.', o: 'Factura 90{d} (de la Entrega 80{d})',
    k: 'Nadie sabe cuánto cuesta. ¡Primero la factura!', f: 'la factura' },
  { n: 'Chapita', x: 'REGISTRO', t: 'Patentamiento', d: 'Patente {p}', s: 'ANOTADA',
    m: [[0, 'Fuera de SAP: el Registro Automotor da la patente'], ['SD', 'Ventas anota la patente']],
    b: '¡El Registro Automotor le dio chapita a mi auto: {p}!', o: 'Patente {p} anotada en SAP',
    k: 'Sin chapita no podés salir a la calle. ¡Primero la chapita!', f: 'la chapita' },
  { n: 'Llaves', x: 'VA03', t: 'Ver pedido', d: '¡Llaves entregadas!', s: '¡COMPLETO!',
    m: [['SD', 'Ventas revisa que el pedido esté completo'], ['CO', 'Costos calcula cuánto ganó la empresa']],
    b: '¡Las llaves! ¡El auto es mío!', o: 'Pedido 10{d}: ¡todo completo!', k: '', f: 'las llaves' },
];

// [paso, módulo que lo resuelve, tipo (0 sirena, 1 plata, 2 bonus), título, globo, barra, pista, al resolverlo]
const INC = [
  [0, 'FI', 0, '¡Pedido bloqueado por crédito!', '¡Uy! Mi pedido quedó bloqueado… ¿Quién lo destraba?', 'Pedido 10{d} bloqueado por crédito', 'es un tema de plata', 'FI revisó el crédito y liberó el pedido (VKM1)'],
  [1, 'MM', 0, '¡Faltan los neumáticos!', '¡Faltan los neumáticos! ¿Quién se los compra al proveedor?', 'Falta material: neumáticos', 'hay que comprar piezas', 'MM compró los neumáticos (ME21N) y llegaron (MIGO)'],
  [1, 'QM', 0, '¡El auto tiene un rayón!', '¡Mi auto tiene un rayón! ¿Quién revisa la calidad?', 'Inspección pendiente: rayón en la puerta', 'hay que revisar la calidad', 'QM lo revisó y lo mandó a arreglar (QA32)'],
  [2, 'LE', 0, '¡El camión no tiene ruta!', '¡El camión no sabe adónde ir! ¿Quién arma el viaje?', 'Transporte sin ruta asignada', 'es un tema de transporte', 'LE armó el transporte con su ruta (VT01N)'],
  [3, 'FI', 1, '¡Llegó la plata del cliente!', '¡Ya pagué! ¿Quién anota que entró la plata?', 'Pago recibido sin registrar', 'es plata que entra', 'FI registró el cobro (F-28)'],
  [0, 'SD', 1, '¡Me olvidé del estéreo!', '¡Me olvidé de pedir el estéreo! ¿Quién cambia mi pedido?', 'Pedido 10{d}: falta un accesorio', 'es un cambio en el pedido', 'SD agregó el estéreo al pedido (VA02)'],
  [1, 'CO', 2, '¿Cuánto cuesta fabricarlo?', '¿Y quién calcula cuánto cuesta fabricar mi auto?', 'Falta el cálculo de costo', 'hay que hacer cuentas', 'CO calculó el costo del auto (CK11N)'],
  [2, 'MM', 0, '¡No encuentran el auto!', '¡No encuentran mi auto en el depósito! ¿Quién se fija el stock?', 'Stock no encontrado en el depósito', 'es un tema de depósito', 'MM encontró el auto en el stock (MMBE)'],
  [3, 'FI', 1, '¡Hay que pagarle al proveedor!', '¡Hay que pagarle los neumáticos al proveedor! ¿Quién paga?', 'Factura de proveedor sin pagar', 'es plata que sale', 'FI le pagó al proveedor (F-53)'],
  [4, 'SD', 1, '¡El Registro pide la factura!', '¡El Registro me pide la factura! ¿Quién me la muestra?', 'Registro: falta la Factura 90{d}', 'la factura la hace Ventas', 'SD mostró la Factura 90{d} (VF03)'],
  [5, 'CO', 2, '¡Pregunta bonus!', '¿Y quién calcula cuánto ganó la empresa con mi auto?', 'Falta calcular la ganancia', 'hay que hacer cuentas', 'CO calculó la ganancia (KE30)'],
];

// Dificultad: [nombre, imprevistos, bloqueo por error (ms), pista en el camino, castigo por error (ms)]
const DIF = [['FÁCIL', 1, 600, 1, 0], ['NORMAL', 3, 1200, 0, 0], ['DIFÍCIL', 4, 1200, 0, 2000]];
// Rival de la máquina (modo solo y desafío): [nombre, segundos que tarda en llevarse el auto]
const RIV = [['Concesionaria del barrio', 44], ['Agencia oficial', 54], ['Fábrica express', 58]];
const TIPS = [
  'Cada papel nace del anterior: Pedido, Fábrica, Camión, Factura, Chapita y Llaves.',
  'Plata: FI. Piezas: MM. Calidad: QM. Camión: LE. Costos: CO.',
  '¡Sin errores! Ahora elegí más rápido: el orden es siempre el mismo.',
];
const FACTS = [
  'SD viene de «Sales and Distribution»: ventas y distribución.',
  'MM viene de «Materials Management»: gestión de materiales.',
  'PP viene de «Production Planning»: planificación de la producción.',
  'QM viene de «Quality Management»: gestión de la calidad.',
  'LE viene de «Logistics Execution»: ejecución de la logística.',
  'FI viene de «Financial Accounting»: contabilidad financiera.',
  'CO viene de «Controlling»: el control de los costos.',
  'VA01 crea un pedido y VA03 lo muestra: en muchas transacciones, 01 crea, 02 modifica y 03 muestra.',
  'En SAP cada documento recuerda de cuál nació: eso se llama flujo de documentos.',
  'La patente Mercosur de Argentina tiene 2 letras, 3 números y 2 letras.',
];
const fact = () => '¿Sabías que…? ' + FACTS[rnd(FACTS.length)];

const CH = [['Abuelo', 'El'], ['Abuela', 'La'], ['Nene', 'El'], ['Nena', 'La'], ['Gaucho', 'El'], ['Oficinista', 'La']];
const COL = [['rojo', 0xe63946], ['celeste', 0x4fb3ff], ['verde', 0x2fb35a], ['amarillo', 0xffc61a]];

// ---------- Utilidades ----------
const rnd = n => Phaser.Math.Between(0, n - 1);
const shuf = a => Phaser.Utils.Array.Shuffle(a);
const fmt = t => (t / 1000).toFixed(1).replace('.', ',');
const wait = (s, ms) => new Promise(r => s.time.delayedCall(ms, r));
const plateTxt = () => {
  const L = () => String.fromCharCode(65 + rnd(26));
  return L() + L() + ' ' + Phaser.Math.Between(100, 999) + ' ' + L() + L();
};
const who = p => CH[p.ch][1] + ' ' + CH[p.ch][0];

function T(s, x, y, t, z, c, o) {
  return s.add.text(x, y, t, { fontFamily: F, fontSize: z + 'px', color: c || '#eef3f9', fontStyle: 'bold', align: 'center', ...o }).setOrigin(.5);
}
function car(s, x, y, col, sc) {
  const b = s.add.image(0, 0, 'cb' + col);
  return s.add.container(x, y, [b, s.add.image(0, 0, 'cd')]).setScale(sc || 1);
}
function plate(s, x, y, w, h, txt, z) {
  const c = s.add.container(x, y), g = s.add.graphics();
  g.fillStyle(LN).fillRoundedRect(-w / 2 + 5, -h / 2 + 6, w, h, 10)
    .fillStyle(0xffffff).fillRoundedRect(-w / 2, -h / 2, w, h, 10)
    .lineStyle(3, LN).strokeRoundedRect(-w / 2, -h / 2, w, h, 10)
    .fillStyle(BLUE).fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, 22)
    .fillStyle(0x74acdf).fillRect(-w / 2 + 10, -h / 2 + 6, 24, 16)
    .fillStyle(0xffffff).fillRect(-w / 2 + 10, -h / 2 + 11, 24, 6);
  c.add([g, T(s, 0, -h / 2 + 14, 'ARGENTINA', 16), T(s, 0, 11, txt, z, '#1c2a3a')]);
  return c;
}
function badge(s, x, y, m, w, h) {
  const g = s.add.graphics().fillStyle(MOD[m][1]).fillRoundedRect(-w / 2, -h / 2, w, h, 6).lineStyle(2, LN).strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
  return s.add.container(x, y, [g, T(s, 0, 0, m, 20, m == 'MM' ? '#151a23' : '#ffffff')]);
}
function tri(g, x, y, d, r) {
  const P = [[x - r, y, x + r * .7, y - r, x + r * .7, y + r], [x, y + r, x - r, y - r * .7, x + r, y - r * .7],
    [x, y - r, x - r, y + r * .7, x + r, y + r * .7], [x + r, y, x - r * .7, y - r, x - r * .7, y + r]][d];
  g.fillTriangle(...P);
}
// Partículas con texturas de color propias (se ven igual con WebGL o con Canvas)
const QC = [0x5bd17f, 0xff6b6b, 0xffc933, 0xffd43b, 0xe63946, 0x4fb3ff, 0x2fb35a, 0xffc61a, 0xff4f8b, 0xffffff];
const qk = c => 'q' + c.toString(16), gk = c => 'g' + c.toString(16);
function spark(s, c, n, x, y) {
  const e = s.add.particles(x, y, qk(c), { speed: { min: 120, max: 340 }, lifespan: 650, scale: { start: 1, end: 0 }, gravityY: 400, emitting: false }).setDepth(8);
  e.explode(n); s.time.delayedCall(900, () => e.destroy());
}
// Papelitos de colores
function confetti(s, z) {
  [0xe63946, 0x4fb3ff, 0x2fb35a, 0xffc61a, 0xff4f8b, 0xffffff].forEach(c => s.add.particles(0, -10, qk(c), {
    x: { min: 0, max: W }, speedY: { min: 140, max: 320 }, speedX: { min: -90, max: 90 }, rotate: { min: 0, max: 360 },
    scaleX: 1.6, lifespan: 3500, emitting: false,
  }).setDepth(z == null ? 9 : z).explode(14));
}
function star(g, x, y, r, c) {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r;
    p.push({ x: x + Math.cos(a) * q, y: y + Math.sin(a) * q });
  }
  g.fillStyle(c).fillPoints(p, true).lineStyle(3, LN).strokePoints(p, true);
}

// ---------- Sonido (WebAudio, sin archivos) ----------
let MUTE = 0, DF = 0;
const AC = () => window.game && game.sound && game.sound.context;
function audioOn() { const c = AC(); if (c && c.state == 'suspended') c.resume(); }
function tone(f, d, w, v, dl, f2) {
  const c = AC();
  if (!c || MUTE || c.state != 'running') return;
  const t = c.currentTime + (dl || 0), o = c.createOscillator(), g = c.createGain();
  o.type = w || 'square';
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v || .1, t);
  g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + d + .05);
}
const SND = {
  tick: () => tone(880, .05, 'square', .04),
  ok: () => { tone(1047, .12, 'triangle', .15); tone(1568, .2, 'triangle', .12, .08); },
  bad: () => tone(170, .32, 'sawtooth', .1, 0, 80),
  siren: () => { for (let i = 0; i < 3; i++) { tone(650, .25, 'square', .05, i * .5, 950); tone(950, .25, 'square', .05, i * .5 + .25, 650); } },
  soft: () => { tone(784, .12, 'sine', .15); tone(988, .2, 'sine', .15, .12); },
  fiu: () => tone(1400, .3, 'sine', .05, 0, 350),
  stamp: () => { tone(120, .2, 'square', .15, 0, 45); tone(1800, .04, 'square', .04); },
  arp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'triangle', .1, i * .07)),
  fan: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i > 4 ? .6 : .16, 'square', .07, i * .14)),
  beep: () => tone(660, .14, 'square', .08),
  go: () => tone(1320, .35, 'square', .08),
};
const snd = k => SND[k] && SND[k]();
// Música de fondo suave: 112 pulsos por minuto, en corcheas
let beat = 0, FEV = 0;
const BASS = [131, 131, 175, 175, 196, 196, 131, 131], MEL = [523, 659, 784, 659, 698, 880, 784, 659];
const music = () => {
  const b = beat++ % 16;
  if (!(b % 2)) tone(BASS[b >> 1], .3, 'triangle', .045);
  if (b % 4 == 1) tone(MEL[(beat >> 2) % 8], .16, 'sine', .022);
  if (FEV && !(b % 4)) tone(55, .18, 'sine', .14);
  setTimeout(music, FEV ? 170 : 268);
};
music();

// ---------- Récords ----------
// Top 5 de puntajes { n: iniciales, s: puntaje } y mejor racha
// Rankings separados: partidas sueltas y desafío. EV cuenta los autos entregados en el evento.
const SKEY = 'compra-tu-auto/puntajes', CKEY = 'compra-tu-auto/desafio', RKEY = 'compra-tu-auto/racha', EKEY = 'compra-tu-auto/evento';
let TOP = [], CTOP = [], BEST = 0, EV = 0, GH = [0, 0, 0];
const GKEY = 'compra-tu-auto/fantasma';
const vGh = g => Array.isArray(g) && g.length == 6 && g.every((x, i) => typeof x == 'number' && x > 0 && x < 6e5 && (!i || x >= g[i - 1])) ? g : 0;
const vTop = v => Array.isArray(v) ? v.filter(e => e && typeof e.n == 'string' && /^[A-Z]{3}$/.test(e.n) &&
  Number.isInteger(e.s) && e.s >= 0 && e.s < 1e6).sort((a, b) => b.s - a.s).slice(0, 5) : [];
// Puntaje: rapidez × dificultad, menos errores, más la mejor racha
const score = (p, d) => Math.max(0, Math.round((100 - p.t / 1000) * 10 * [1, 1.5, 2][d]) - p.err * 50 + p.top * 10);
async function sGet(k) {
  try {
    const r = await Promise.race([window.platanusArcadeStorage.get(k), new Promise(z => setTimeout(z, 1500))]);
    return r && r.found ? r.value : null;
  } catch (e) { return null; }
}
async function sSet(k, v) { try { await window.platanusArcadeStorage.set(k, v); } catch (e) {} }

// ---------- Escenas ----------
// Cambio de escena con fundido (ignora pedidos repetidos mientras se va)
function go(s, k, d) {
  if (s.lv) return;
  s.lv = 1; s.cameras.main.fadeOut(180, 4, 6, 10);
  s.time.delayedCall(190, () => s.scene.start(k, d));
}
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    this.gen();
    Promise.all([sGet(SKEY), sGet('compra-tu-auto/mute'), sGet(RKEY), sGet(CKEY), sGet(EKEY), sGet(GKEY)]).then(([t, m, r, c, e, h]) => {
      if (Array.isArray(h)) GH = [0, 1, 2].map(i => vGh(h[i]));
      CTOP = vTop(c); EV = Number.isInteger(e) && e > 0 && e < 1e7 ? e : 0;
      TOP = vTop(t); MUTE = m === true ? 1 : 0;
      BEST = Number.isInteger(r) && r > 0 && r < 100 ? r : 0;
      this.scene.start('Title');
    });
  }
  gen() {
    const g = this.add.graphics(), O = LN, tex = (k, w, h) => { g.generateTexture(k, w, h); g.clear(); };
    g.fillStyle(0xffffff).fillRect(0, 0, 8, 8); tex('px', 8, 8);
    // Personajes
    const SK = 0xf2c49b, SH = [0x6c8ebf, 0xb06ab3, 0x2f9df4, 0xff7eb6, 0x8b5a2b, 0x3a4a5e];
    for (let i = 0; i < 6; i++) {
      g.lineStyle(3, O).fillStyle(SH[i]).fillRoundedRect(12, 47, 40, 18, 9).strokeRoundedRect(12, 47, 40, 18, 9);
      if (i == 0) g.fillStyle(0xf1f3f5).fillCircle(15, 29, 7).fillCircle(49, 29, 7);
      if (i == 1) g.fillStyle(0xdfe3e8).fillCircle(32, 10, 8).strokeCircle(32, 10, 8);
      if (i == 3) g.fillStyle(0xb5562b).fillCircle(13, 33, 7).fillCircle(51, 33, 7).strokeCircle(13, 33, 7).strokeCircle(51, 33, 7);
      if (i == 5) g.fillStyle(0x3b2a20).fillCircle(32, 31, 21);
      g.fillStyle(SK).fillCircle(32, 31, 17).strokeCircle(32, 31, 17);
      const hr = [0, 0xdfe3e8, 0x7a4a24, 0xb5562b, 0, 0x3b2a20][i];
      if (hr) g.fillStyle(hr).fillEllipse(32, 18, 32, 12);
      g.fillStyle(O).fillCircle(26, 31, 2.5).fillCircle(38, 31, 2.5);
      g.lineStyle(2, O).beginPath(); g.arc(32, 35, 6, .3, Math.PI - .3); g.strokePath();
      if (i < 2) g.strokeCircle(26, 31, 5).strokeCircle(38, 31, 5).lineBetween(31, 31, 33, 31);
      if (i == 0) g.fillStyle(0xf1f3f5).fillEllipse(32, 40, 16, 5);
      if (i == 3) g.fillStyle(0xff4f8b).fillTriangle(40, 11, 49, 6, 49, 16);
      if (i == 4) g.fillStyle(0x3a2a1a).fillEllipse(32, 40, 16, 5).fillStyle(0x2b2b2b).fillRoundedRect(20, 2, 24, 13, 4)
        .fillEllipse(32, 15, 50, 9).fillStyle(0xe03131).fillTriangle(24, 47, 40, 47, 32, 56);
      if (i == 5) g.fillStyle(0xffffff).fillTriangle(25, 47, 39, 47, 32, 53).fillStyle(0xe03131).fillTriangle(30, 50, 34, 50, 32, 62);
      tex('c' + i, 64, 64);
    }
    // Auto: carrocería blanca (se tiñe) y detalles
    [...COL.map(c => c[1]), 0xb8c2cf, 0xffffff].forEach((c, i) => {
      g.lineStyle(3, O).fillStyle(c).fillRoundedRect(22, 4, 40, 20, 8).strokeRoundedRect(22, 4, 40, 20, 8)
        .fillRoundedRect(3, 18, 78, 18, 7).strokeRoundedRect(3, 18, 78, 18, 7);
      tex('cb' + i, 84, 44);
    });
    g.fillStyle(0xbfe6ff).fillRoundedRect(27, 8, 14, 11, 3).fillRoundedRect(45, 8, 13, 11, 3)
      .fillStyle(0x22262e).fillCircle(20, 36, 7).fillCircle(64, 36, 7).fillStyle(0x9aa5b4).fillCircle(20, 36, 3).fillCircle(64, 36, 3)
      .fillStyle(0xffe066).fillCircle(77, 24, 3);
    tex('cd', 84, 44);
    // Íconos de los 6 pasos
    g.lineStyle(3, O).fillStyle(0xffffff).fillRoundedRect(10, 4, 28, 40, 4).strokeRoundedRect(10, 4, 28, 40, 4)
      .lineStyle(3, 0x9aa5b4).lineBetween(16, 14, 32, 14).lineBetween(16, 22, 32, 22).lineBetween(16, 30, 26, 30)
      .fillStyle(0x1c7ed6).fillCircle(32, 36, 5);
    tex('i0', 48, 48);
    const fab = [{ x: 4, y: 44 }, { x: 4, y: 22 }, { x: 16, y: 13 }, { x: 16, y: 22 }, { x: 28, y: 13 }, { x: 28, y: 22 }, { x: 44, y: 22 }, { x: 44, y: 44 }];
    g.lineStyle(3, O).fillStyle(0xd6336c).fillRect(32, 5, 8, 18).strokeRect(32, 5, 8, 18)
      .fillStyle(0x8f9bb0).fillPoints(fab, true).strokePoints(fab, true)
      .fillStyle(0xffe066).fillRect(9, 30, 7, 7).fillRect(21, 30, 7, 7).fillRect(33, 30, 7, 7);
    tex('i1', 48, 48);
    g.lineStyle(3, O).fillStyle(0x2f9df4).fillRoundedRect(2, 12, 30, 22, 3).strokeRoundedRect(2, 12, 30, 22, 3)
      .fillStyle(0xe03131).fillRoundedRect(32, 18, 14, 16, 3).strokeRoundedRect(32, 18, 14, 16, 3)
      .fillStyle(0xbfe6ff).fillRect(36, 21, 7, 6).fillStyle(0x22262e).fillCircle(12, 38, 6).fillCircle(38, 38, 6);
    tex('i2', 48, 48);
    const fac = [{ x: 10, y: 4 }, { x: 38, y: 4 }, { x: 38, y: 43 }, { x: 33, y: 39 }, { x: 28, y: 43 }, { x: 24, y: 39 }, { x: 19, y: 43 }, { x: 14, y: 39 }, { x: 10, y: 43 }];
    g.lineStyle(3, O).fillStyle(0xffffff).fillPoints(fac, true).strokePoints(fac, true)
      .lineStyle(3, 0x9aa5b4).lineBetween(16, 13, 32, 13).lineBetween(16, 20, 26, 20)
      .lineStyle(2, O).fillStyle(0x2fb35a).fillCircle(29, 30, 7).strokeCircle(29, 30, 7);
    tex('i3', 48, 48);
    g.lineStyle(3, O).fillStyle(0xffffff).fillRoundedRect(2, 12, 44, 24, 4).strokeRoundedRect(2, 12, 44, 24, 4)
      .fillStyle(BLUE).fillRect(4, 14, 40, 6).fillStyle(0x1c2a3a);
    for (let i = 0; i < 5; i++) g.fillRect(8 + i * 7 + (i > 1 ? 2 : 0), 24, 5, 8);
    tex('i4', 48, 48);
    g.lineStyle(3, O).fillStyle(0xffc21a).fillRect(20, 21, 24, 7).strokeRect(20, 21, 24, 7)
      .fillRect(36, 27, 5, 7).fillRect(29, 27, 5, 6).fillCircle(14, 24, 11).strokeCircle(14, 24, 11)
      .fillStyle(SF).fillCircle(11, 24, 4);
    tex('i5', 48, 48);
    g.lineStyle(2, O).fillStyle(0xffffff).fillRect(2, 2, 18, 22).strokeRect(2, 2, 18, 22)
      .lineStyle(2, 0x9aa5b4).lineBetween(6, 9, 16, 9).lineBetween(6, 14, 16, 14).lineBetween(6, 19, 13, 19);
    tex('doc', 22, 26);
    QC.forEach(c => { g.fillStyle(c).fillRect(0, 0, 8, 8); tex(qk(c), 8, 8); });
    [...MK.map(m => MOD[m][1]), ER, 0x4dabf7].forEach(c => {
      for (let r = 32; r > 2; r -= 3) g.fillStyle(c, .1).fillCircle(32, 32, r);
      tex(gk(c), 64, 64);
    });
    g.fillStyle(0x2a313d).fillRect(0, 0, 64, 18).fillStyle(0xffc933).fillRect(8, 8, 30, 3);
    tex('rd', 64, 18);
    g.destroy();
  }
}

class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    clearKeys();
    this.cameras.main.setBackgroundColor(BG).fadeIn(220, 4, 6, 10); this.lv = 0;
    this.sel = 0; this.idle = 0; FEV = 0;
    T(this, W / 2, 134, '«SAP no es difícil: solo hay que entender el camino».', 18, '#ffc933', { stroke: '#151a23', strokeThickness: 5 }).setDepth(2);
    // Ciudad de noche con ventanas que titilan y una ruta que corre
    const g = this.add.graphics(), wg = this.add.graphics(), B = [];
    for (let x = 0; x < W; x += 38 + rnd(26)) { const h = 22 + rnd(36); B.push([x, 196 - h, h]); g.fillStyle(0x1d2533).fillRect(x, 196 - h, 34, h); }
    const win = () => { wg.clear(); B.forEach(([x, y, h]) => { for (let j = y + 6; j < 190; j += 10) for (let i = x + 5; i < x + 30; i += 9) if (rnd(4)) wg.fillStyle(0xffd43b, rnd(2) ? .55 : .2).fillRect(i, j, 5, 5); }); };
    win(); this.time.addEvent({ delay: 700, loop: true, callback: win });
    this.rd = this.add.tileSprite(W / 2, 204, W, 18, 'rd');
    this.time.addEvent({ delay: 2600, loop: true, callback: () => {
      const o = this.add.image(830, 186, 'c' + rnd(6)).setScale(.55);
      this.tweens.add({ targets: o, x: -30, duration: 7000, onComplete: () => o.destroy() });
      this.tweens.add({ targets: o, y: 178, duration: 180, yoyo: true, repeat: 19 });
    } });
    plate(this, W / 2, 64, 500, 100, '¡COMPRÁ TU AUTO!', 46).setDepth(2);
    const c = car(this, 120, 188, 0, .9), a = this.add.image(60, 180, 'c0').setScale(.8);
    this.tweens.add({ targets: [c, a], x: '+=560', duration: 5200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // Menú con el joystick
    this.cur = this.add.graphics();
    this.mi = [0, 1, 2, 3, 4].map(i => T(this, 230, 238 + i * 38, '', 22));
    T(this, 600, 226, 'Mejores puntajes', 20, '#4aa3ef');
    for (let i = 0; i < 5; i++) {
      const e = TOP[i];
      T(this, 600, 256 + i * 24, e ? `${i + 1}. ${e.n}   ${e.s}` : `${i + 1}. ---`, 17, e ? '#eef3f9' : '#8b97a8');
    }
    T(this, 600, 382, `Mejor racha: ${BEST}` + (CTOP[0] ? `  ·  Desafío: ${CTOP[0].n} ${CTOP[0].s}` : ''), 16, '#ffc933');
    T(this, 600, 406, `Autos entregados en el evento: ${EV}`, 16, '#5bd17f');
    MK.forEach((m, i) => {
      const x = 76 + i * 108;
      badge(this, x, 444, m, 52, 32);
      T(this, x, 474, MOD[m][0], 16, '#c9d3df');
    });
    this.ft = T(this, W / 2, 522, fact(), 17, '#74c0fc', { wordWrap: { width: 740 } });
    this.time.addEvent({ delay: 6000, loop: true, callback: () => this.ft.setText(fact()) });
    T(this, W / 2, 572, 'Joystick: mover  ·  A: elegir  ·  B: volver  ·  START 1: solo  ·  START 2: de a dos', 16, '#c9d3df');
    this.draw();
  }
  draw() {
    ['Jugar solo', 'Jugar de a dos', 'Modo desafío', this.sel == 2 ? 'Dificultad: sube por etapa' : `Dificultad: ‹ ${DIF[DF][0]} ›`, `Sonido: ${MUTE ? 'NO' : 'SÍ'}`].forEach((t, i) =>
      this.mi[i].setText(t).setColor(i == this.sel ? '#151a23' : '#eef3f9'));
    this.cur.clear().fillStyle(0xffc933).fillRoundedRect(70, 220 + this.sel * 38, 320, 36, 10);
  }
  go(i) {
    if (i < 3) return go(this, 'Select', { n: i == 1 ? 2 : 1, m: i == 2 ? 1 : 0, dif: DF, st: 0, acc: 0 });
    if (i == 3) DF = (DF + 1) % 3;
    else { MUTE ^= 1; sSet('compra-tu-auto/mute', !!MUTE); }
    snd('tick'); this.draw();
  }
  update(t, dt) {
    this.rd.tilePositionX += dt * .15;
    this.idle = Object.keys(pressed).length ? 0 : this.idle + dt;
    // Modo demo: el juego se muestra jugando solo
    if (this.idle > 15000) return go(this, 'Play', { pl: [{ ch: rnd(6), col: rnd(4) }], dif: 0, m: 0, demo: 1 });
    if (hit('START1')) return this.go(0);
    if (hit('START2')) return this.go(1);
    for (const p of ['P1_', 'P2_']) {
      const k = dirHit(p);
      if (k == 1 || k == 2) { this.sel = (this.sel + (k == 1 ? 1 : 4)) % 5; snd('tick'); this.draw(); }
      if ((k == 0 || k == 3) && this.sel == 3) { DF = (DF + (k ? 1 : 2)) % 3; snd('tick'); this.draw(); }
      if ((k == 0 || k == 3) && this.sel == 4) this.go(4);
      if (btnA(p)) return this.go(this.sel);
    }
    clearKeys();
  }
}

class Select extends Phaser.Scene {
  constructor() { super('Select'); }
  create(d) {
    clearKeys();
    this.cameras.main.setBackgroundColor(BG).fadeIn(220, 4, 6, 10); this.lv = 0;
    const n = d.n, w = W / n;
    this.d = d;
    T(this, W / 2, 30, d.m ? 'Modo desafío: 3 etapas, cada una más difícil' : `Elegí tu personaje y color · ${DIF[d.dif][0]}`, 26, '#ffc933');
    this.S = [];
    for (let i = 0; i < n; i++) {
      const x = i * w, pc = i ? P2C : P1C, st = { ch: i ? 3 : 0, col: i ? 2 : 0, r: 0 }, g = this.add.graphics();
      g.fillStyle(SF).fillRoundedRect(x + 8, 58, w - 16, 534, 12).lineStyle(3, pc).strokeRoundedRect(x + 8, 58, w - 16, 534, 12)
        .fillStyle(pc).fillRoundedRect(x + 8, 58, w - 16, 34, { tl: 12, tr: 12, bl: 0, br: 0 });
      T(this, x + w / 2, 75, n > 1 ? `Jugador ${i + 1}` : 'Tu jugador', 18, '#151a23');
      // Showroom: plataforma y cono de luz bajo el auto
      const cx = x + w / 2 + 70;
      this.add.graphics().fillStyle(0xffd43b, .08).fillTriangle(cx, 96, cx - 80, 198, cx + 80, 198)
        .fillStyle(SF2).fillEllipse(cx, 200, 170, 26).lineStyle(3, 0xffc933, .6).strokeEllipse(cx, 200, 170, 26);
      st.f = this.add.image(x + w / 2 - 70, 160, 'c0').setScale(1.5);
      st.c = car(this, x + w / 2 + 70, 170, 0, 1.2);
      st.t = T(this, x + w / 2, 234, '', 18, '#eef3f9', { wordWrap: { width: w - 40 } });
      T(this, x + w / 2, 276, '¿Quién compra?  ← →', 18, '#c9d3df');
      st.th = [];
      const cw = Math.min(62, (w - 40) / 6);
      for (let j = 0; j < 6; j++) st.th.push(this.add.image(x + w / 2 + (j - 2.5) * cw, 322, 'c' + j).setScale(cw / 70));
      st.nm = T(this, x + w / 2, 364, '', 18, '#ffc933');
      T(this, x + w / 2, 404, '¿De qué color lo querés?  ↑ ↓', 18, '#c9d3df');
      st.hg = this.add.graphics();
      st.x = x; st.w = w; st.cw = cw;
      st.rd = T(this, x + w / 2, 528, '', 20, '#5bd17f');
      T(this, x + w / 2, 566, 'A: ¡listo!   ·   B: volver', 18, '#c9d3df');
      this.S.push(st);
      this.draw(st);
    }
    if (n < 2) T(this, W / 2, 492, fact(), 17, '#74c0fc', { wordWrap: { width: 700 } });
  }
  draw(st) {
    const { x, w, cw, hg } = st, cx = x + w / 2;
    st.f.setTexture('c' + st.ch);
    st.c.list[0].setTexture('cb' + st.col);
    st.t.setText(`${who(st)} quiere un auto ${COL[st.col][0]}.`);
    st.nm.setText(CH[st.ch][0]);
    hg.clear().lineStyle(4, 0xffc933).strokeRoundedRect(cx + (st.ch - 2.5) * cw - cw / 2 + 2, 322 - cw / 2, cw - 4, cw, 8);
    COL.forEach((c, j) => {
      const px = cx + (j - 1.5) * 64;
      hg.fillStyle(c[1]).fillCircle(px, 450, 20).lineStyle(3, LN).strokeCircle(px, 450, 20);
      if (j == st.col) hg.lineStyle(4, 0xffffff).strokeCircle(px, 450, 27);
    });
    st.rd.setText(st.r ? (this.S.length > 1 && this.S.some(s => !s.r) ? '¡Listo! Esperando al otro…' : '¡Listo!') : '');
  }
  update() {
    this.S.forEach((st, i) => {
      const p = `P${i + 1}_`;
      if (btnB(p)) { if (st.r) { st.r = 0; this.draw(st); } else return go(this, 'Title'); }
      if (st.r) return;
      const k = dirHit(p);
      if (k >= 0) {
        if (k == 0 || k == 3) st.ch = (st.ch + (k ? 1 : 5)) % 6; else { st.col = (st.col + (k == 1 ? 1 : 3)) % 4; this.tweens.add({ targets: st.c, y: { from: 170, to: 156 }, duration: 120, yoyo: true }); }
        snd('tick'); this.draw(st);
        this.tweens.add({ targets: st.f, y: { from: 160, to: 146 }, duration: 110, yoyo: true });
      }
      if (btnA(p) || (i == 0 && hit('START1')) || (i == 1 && hit('START2'))) { st.r = 1; snd('ok'); this.S.forEach(s => this.draw(s)); }
    });
    if (this.S.every(s => s.r)) go(this, 'Play', { ...this.d, pl: this.S.map(s => ({ ch: s.ch, col: s.col })) });
    clearKeys();
  }
}

// Panel de un jugador: camino, globo, caja SAP, zona de acción y 4 botones
class Panel {
  constructor(s, i, x, w, p, inc) {
    Object.assign(this, { s, i, w, p, inc, cx: x, err: 0, es: 0, em: 0, sp: 1, str: 0, top: 0, k: 0, t: 0, on: 0, used: new Set() });
    this.d = Phaser.Math.Between(10, 99); this.pl = plateTxt();
    const pc = i ? P2C : P1C, wide = this.wide = w > 500, c = this.c = s.add.container(x, 0), A = o => (c.add(o), o);
    const g = A(s.add.graphics());
    g.fillStyle(SF).fillRoundedRect(6, 36, w - 12, H - 40, 12).lineStyle(3, pc).strokeRoundedRect(6, 36, w - 12, H - 40, 12)
      .fillStyle(pc).fillRoundedRect(6, 36, w - 12, 32, { tl: 12, tr: 12, bl: 0, br: 0 });
    A(s.add.image(26, 52, 'c' + p.ch).setScale(.42));
    A(T(s, 46, 52, `J${i + 1} · ${CH[p.ch][0]}`, 18, '#151a23').setOrigin(0, .5));
    this.stT = A(T(s, w - 96, 52, '', 18, '#151a23').setOrigin(1, .5));
    this.tm = A(T(s, w - 18, 52, '0,0 s', 18, '#151a23').setOrigin(1, .5));
    // Camino de 6 estaciones
    this.sx = j => 36 + j * (w - 72) / 5;
    g.lineStyle(4, 0x3a4556).lineBetween(this.sx(0), 98, this.sx(5), 98);
    this.sg = A(s.add.graphics());
    this.q = []; this.ic = [];
    for (let j = 0; j < 6; j++) {
      this.q.push(A(T(s, this.sx(j), 98, '?', 20, '#8b97a8')));
      this.ic.push(A(s.add.image(this.sx(j), 98, 'i' + j).setScale(.62).setVisible(false)));
    }
    this.ck = A(s.add.graphics());
    this.car = A(car(s, this.sx(0), 136, p.col, wide ? .6 : .5)).setAlpha(.6);
    this.car.list[0].setTexture('cb4');
    this.sp6 = []; this.G = s.n < 2 && !s.d.demo && !s.d.m && GH[s.d.dif];
    if (this.G) { this.gh = A(car(s, this.sx(0), 136, 5, wide ? .6 : .5)).setAlpha(.3); this.gi = 0; }
    // Globo del personaje
    this.av = A(s.add.image(30, 184, 'c' + p.ch).setScale(.6));
    s.tweens.add({ targets: this.av, scaleY: .64, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.bg = A(s.add.graphics());
    this.bt = A(T(s, 68, 184, '', 16, '#eef3f9', { fontStyle: 'normal', align: 'left', wordWrap: { width: w - 92 } }).setOrigin(0, .5));
    // Caja SAP
    const sy = 222, bh = wide ? 128 : 100;
    g.fillStyle(LN).fillRoundedRect(18, sy + 4, w - 28, bh + 24, 8).fillStyle(0x1a2230).fillRoundedRect(14, sy, w - 28, bh + 24, 8).fillStyle(0x0b1119).fillRoundedRect(14, sy, w - 28, 24, { tl: 8, tr: 8, bl: 0, br: 0 })
      .fillStyle(0xffffff).fillRect(60, sy + 3, 86, 18);
    A(T(s, 22, sy + 12, 'SAP', 16, '#4aa3ef').setOrigin(0, .5));
    this.tx = A(T(s, 103, sy + 12, '', 16, '#151a23'));
    this.tt = A(T(s, 154, sy + 12, wide ? 'Esperando el próximo paso…' : 'Esperando…', 16, '#c9d3df', { fontStyle: 'normal' }).setOrigin(0, .5));
    this.cnt = A(T(s, w - 22, sy + 12, wide ? 'Módulos 0/7' : '', 16, '#c9d3df').setOrigin(1, .5));
    const bw = (w - 28) / 7;
    this.bx = m => 14 + bw * MK.indexOf(m) + bw / 2;
    this.bd = {};
    this.halo = A(s.add.image(0, sy + 46, gk(ER)).setBlendMode('ADD').setVisible(false));
    s.tweens.add({ targets: this.halo, scale: { from: 1.1, to: 1.6 }, duration: 420, yoyo: true, repeat: -1 });
    MK.forEach(m => {
      const bg = s.add.graphics(), t = T(s, 0, 0, m, 20), b = A(s.add.container(this.bx(m), sy + 46, [bg, t]));
      b.g = bg; b.t = t; this.bd[m] = b; this.badge(m, 0);
      if (wide) A(T(s, this.bx(m), sy + 76, MOD[m][0], 16, '#c9d3df'));
    });
    this.sdot = A(s.add.graphics());
    this.sy = wide ? sy + 108 : sy + 86;
    this.st = A(T(s, 38, this.sy, '', 16, '#eef3f9', { fontStyle: 'normal', align: 'left', wordWrap: { width: w - 66 } }).setOrigin(0, .5));
    this.doc = A(s.add.image(0, 0, 'doc').setVisible(false));
    // Zona de acción
    const ay = this.ay = wide ? 424 : 410;
    this.a1 = A(T(s, w / 2, ay + 4, '', 26, '#eef3f9', { wordWrap: { width: w - 40 } }).setOrigin(.5, 1));
    this.a2 = A(T(s, w / 2, ay + 26, '', 18, '#c9d3df'));
    this.card = A(s.add.container(w / 2, ay).setVisible(false));
    const cg = s.add.graphics().fillStyle(LN).fillRoundedRect(-116, -24, 236, 54, 10).fillStyle(0xffffff).fillRoundedRect(-120, -28, 236, 54, 10)
      .lineStyle(3, LN).strokeRoundedRect(-120, -28, 236, 54, 10);
    this.cardT = T(s, 12, -1, '', 20, '#1c2a3a');
    this.seal = s.add.container(70, -34, [s.add.graphics().fillStyle(0xffffff).fillRoundedRect(-58, -14, 116, 28, 4).lineStyle(3, 0x1d8644).strokeRoundedRect(-58, -14, 116, 28, 4)]).setAngle(-8);
    this.sealT = T(s, 0, 0, '', 16, '#1d8644'); this.seal.add(this.sealT);
    this.ring = s.add.circle(70, -34, 70).setStrokeStyle(4, 0xffc933).setVisible(false);
    this.card.add([cg, s.add.image(-94, -1, 'doc'), this.cardT, this.seal, this.ring]);
    // 4 botones
    this.bW = (w - 28 - 24) / 4; this.B = [];
    for (let j = 0; j < 4; j++) {
      const bg = s.add.graphics(), im = s.add.image(this.bW / 2, 52, 'i0').setScale(.85), cd = T(s, this.bW / 2, 52, '', 22),
        lb = T(s, this.bW / 2, 90, '', 16), hl = s.add.graphics().lineStyle(6, 0xffc933).strokeRoundedRect(-3, -3, this.bW + 6, 110, 12).setAlpha(0),
        b = A(s.add.container(14 + j * (this.bW + 8), 482, [bg, im, cd, lb, hl]));
      Object.assign(b, { g: bg, im, cd, lb, hl, x0: b.x });
      this.B.push(b); this.btn(j, 4);
    }
    // Taller: mientras SAP trabaja, tu auto viaja por la ruta hacia el lugar del paso
    const ww = w - 28, wg = s.add.graphics().fillStyle(LN).fillRoundedRect(4, 5, ww, 104, 10).fillStyle(0x10151d).fillRoundedRect(0, 0, ww, 104, 10);
    for (let x = 10; x < ww - 40; x += 30 + rnd(24)) { const h = 18 + rnd(36); wg.fillStyle(0x1d2533).fillRect(x, 80 - h, 26, h).fillStyle(0xffd43b, .3).fillRect(x + 6, 86 - h, 4, 4).fillRect(x + 15, 92 - h, 4, 4); }
    this.wr = s.add.tileSprite(ww / 2, 88, ww - 8, 18, 'rd');
    this.wi = s.add.image(ww - 52, 46, 'i0').setScale(wide ? 1.5 : 1.15);
    this.wc = car(s, 44, 70, p.col, wide ? .8 : .55);
    s.tweens.add({ targets: this.wc, y: 67, duration: 120, yoyo: true, repeat: -1 });
    this.ws = A(s.add.container(14, 482, [wg, this.wr, this.wi, this.wc]).setVisible(false));
    this.bl = [ER, 0x4dabf7].map((c, j) => A(s.add.image(j ? w - 44 : 44, this.ay - 18, gk(c)).setBlendMode('ADD').setScale(1.5).setAlpha(0)));
    this.tr = s.add.particles(0, 0, qk(0xffd43b), { lifespan: 320, speed: 25, scale: { start: .7, end: 0 }, frequency: 22, emitting: false }).setDepth(5);
    this.alarmG = A(s.add.graphics().lineStyle(8, ER).strokeRoundedRect(4, 34, w - 8, H - 36, 12).setAlpha(0));
    this.say(this.F('¡Quiero un auto {c}! ¿Qué hago primero?'), 0);
    this.drawSt();
  }
  F(t) { return t.replace(/\{d\}/g, this.d).replace('{p}', this.pl).replace('{c}', COL[this.p.col][0]); }
  // Espera; si la partida terminó, la promesa no se resuelve y el flujo se corta
  z(ms) { return new Promise(r => this.s.time.delayedCall(ms, () => { if (!this.s.over) r(); })); }
  badge(m, st) {
    const b = this.bd[m], c = MOD[m][1], w = Math.min(60, (this.w - 28) / 7 - 8);
    b.g.clear();
    if (st) b.g.fillStyle(c).fillRoundedRect(-w / 2, -15, w, 30, 6).lineStyle(2, LN).strokeRoundedRect(-w / 2, -15, w, 30, 6);
    else b.g.fillStyle(SF).fillRoundedRect(-w / 2, -15, w, 30, 6).lineStyle(2, c).strokeRoundedRect(-w / 2, -15, w, 30, 6);
    if (st == 2) b.g.lineStyle(4, 0xffd43b).strokeRoundedRect(-w / 2 - 4, -19, w + 8, 38, 8);
    b.t.setColor(st ? (m == 'MM' ? '#151a23' : '#ffffff') : '#c9d3df');
    b.setScale(st == 2 ? 1.15 : 1);
  }
  light(m) {
    if (this.lit) this.badge(this.lit, 1);
    this.lit = m; this.used.add(m); this.badge(m, 2);
    this.halo.setPosition(this.bx(m), this.halo.y).setTexture(gk(MOD[m][1])).setVisible(true);
    if (this.wide) this.cnt.setText(`Módulos ${this.used.size}/7`);
  }
  status(t, c) {
    this.st.setText(t);
    this.sdot.clear().fillStyle(c).fillCircle(26, this.sy, 6);
  }
  bar(x, t) { this.tx.setText(x); this.tt.setText(t); }
  say(t, mood) {
    const c = [SF2, 0x1f3a2a, 0x3a3020, 0x3d1f22][mood], e = [GRAY, OK, WA, ER][mood];
    this.bg.clear().fillStyle(LN).fillRoundedRect(62, 158, this.w - 72, 60, 12).fillStyle(c).fillRoundedRect(58, 154, this.w - 72, 60, 12).lineStyle(2, e).strokeRoundedRect(58, 154, this.w - 72, 60, 12)
      .fillStyle(c).fillTriangle(59, 178, 48, 184, 59, 190);
    this.bt.setText(t);
    const a = this.av, S = this.s.tweens;
    if (mood == 1) S.add({ targets: a, y: { from: 184, to: 172 }, duration: 130, yoyo: true, ease: 'Quad.out' });
    if (mood == 3) S.add({ targets: a, angle: { from: -12, to: 12 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => a.setAngle(0) });
  }
  emote(t) {
    const o = this.c.add(T(this.s, 30, 150, t, 30, '#ffc933', { stroke: '#04060a', strokeThickness: 6 })).last;
    this.s.tweens.add({ targets: o, y: 128, alpha: 0, duration: 900, onComplete: () => o.destroy() });
  }
  az(a, b, c) { this.card.setVisible(false); this.stp = 0; this.a1.setText(a).setColor(hx(c || 0xeef3f9)); this.a2.setText(b || '').setY(this.ay + 26); }
  drawSt() {
    this.sg.clear(); this.ck.clear();
    for (let j = 0; j < 6; j++) {
      const d = j < this.k, x = this.sx(j);
      this.sg.fillStyle(d ? 0x1d3a2a : BG).fillCircle(x, 98, 21).lineStyle(3, d ? OK : GRAY).strokeCircle(x, 98, 21);
      this.q[j].setVisible(!d); this.ic[j].setVisible(d).setAlpha(1);
      if (d) this.ck.fillStyle(OK).fillCircle(x + 16, 82, 8).lineStyle(3, LN).lineBetween(x + 12, 82, x + 15, 86).lineBetween(x + 15, 86, x + 21, 78);
    }
  }
  btn(j, st) {
    const b = this.B[j], it = this.items && this.items[j], w = this.bW, g = b.g.clear();
    const fill = [SF2, SF2, 0x1d6b3a, 0xb02a2a, SF][st];
    g.fillStyle(LN).fillRoundedRect(4, 5, w, 104, 10).fillStyle(fill).fillRoundedRect(0, 0, w, 104, 10)
      .lineStyle(st == 1 ? 5 : 3, st == 1 ? 0xffffff : LN).strokeRoundedRect(0, 0, w, 104, 10);
    b.im.setVisible(false); b.cd.setText(''); b.lb.setText('');
    if (b.ht) b.ht.stop(), b.hl.setAlpha(0), b.ht = 0;
    if (st == 4 || !it) return;
    g.fillStyle(ARW[j]); tri(g, w / 2, 17, j, 10);
    if (it.s != null) { b.im.setTexture('i' + it.s).setVisible(true); b.lb.setText(STEPS[it.s].n); }
    else {
      g.fillStyle(MOD[it.m][1]).fillRoundedRect(w / 2 - 30, 36, 60, 32, 6).lineStyle(2, LN).strokeRoundedRect(w / 2 - 30, 36, 60, 32, 6);
      b.cd.setText(it.m).setColor(it.m == 'MM' ? '#151a23' : '#ffffff'); b.lb.setText(MOD[it.m][0]);
    }
  }
  clearBtns() {
    this.items = null;
    this.B.forEach(b => b.setVisible(false));
    this.wi.setTexture('i' + this.cs); this.wc.list[0].setTexture(this.car.list[0].texture.key);
    this.ws.setVisible(true); this.wc.x = 44;
    this.s.tweens.add({ targets: this.wc, x: this.w - 150, duration: 1800 * this.sp, ease: 'Sine.inOut' });
  }
  shake(o, x0) { this.s.tweens.add({ targets: o, x: x0 + 7, duration: 45, yoyo: true, repeat: 3, onComplete: () => o.x = x0 }); }
  streak(ok) {
    if (!ok) { this.str = 0; this.sp = 1; this.stT.setText(''); return; }
    this.str++; this.top = Math.max(this.top, this.str);
    this.sp = Math.max(.6, 1 - .07 * this.str);
    if (this.str > 1) this.stT.setText(`Racha ${this.str} · ×${(1 / this.sp).toFixed(1).replace('.', ',')}`);
    if ([3, 5, 7, 9].includes(this.str)) { this.pop(`¡Racha de ${this.str}!`, '#ffc933'); snd('arp'); }
  }
  pop(t, c) {
    const o = this.c.add(T(this.s, this.w / 2, this.ay - 30, t, 30, c, { stroke: '#04060a', strokeThickness: 6 })).last;
    this.s.tweens.add({ targets: o, y: this.ay - 70, alpha: 0, duration: 1100, ease: 'Cubic.in', onComplete: () => o.destroy() });
  }
  // Muestra 4 opciones y resuelve cuando el jugador elige la correcta
  choose(items, ok, wrong) {
    this.items = items; this.ok = ok; this.first = 1; this.tries = 0;
    this.ws.setVisible(false); this.B.forEach(b => b.setVisible(true));
    for (let j = 0; j < 4; j++) this.btn(j, 0);
    return new Promise(res => {
      const f = async k => {
        this.pick = null; this.btn(k, 1); snd('tick');
        await this.z(140);
        const bx = this.c.x + this.B[k].x + this.bW / 2;
        if (k == ok) {
          this.btn(k, 2); snd('ok'); this.s.tweens.add({ targets: this.B[k], scale: 1.06, duration: 70, yoyo: true }); spark(this.s, OK, 18, bx, 520);
          this.streak(this.first);
          res();
        } else {
          this.first = 0; this.err++; this.streak(0);
          this.btn(k, 3); this.shake(this.B[k], this.B[k].x0); this.shake(this.c, this.cx); snd('bad');
          spark(this.s, ER, 10, bx, 520);
          wrong(items[k]);
          const D = this.s.D, B = this.B[ok];
          if (++this.tries > 1 && !B.ht) B.ht = this.s.tweens.add({ targets: B.hl, alpha: { from: .2, to: 1 }, duration: 300, yoyo: true, repeat: -1 });
          if (D[4]) this.pop(`+${D[4] / 1000} s`, '#ff6b6b');
          await this.z(D[2] + D[4]);
          this.btn(k, 0); this.pick = f;
        }
      };
      this.pick = f;
    });
  }
  stamp() {
    const d = Math.abs(this.s.time.now - this.stp - 600);
    this.stp = 0; this.a2.setText('');
    if (d > 140) return snd('tick');
    this.t0 += 500; this.sealT.setColor('#b8860b');
    this.pop('¡SELLO PERFECTO! −0,5 s', '#ffc933'); snd('arp');
    spark(this.s, 0xffc933, 26, this.cx + this.w / 2 + 70, this.ay - 34);
  }
  // FÁCIL: el ícono del paso que sigue se ve a medias
  hint(i) {
    if (this.ht) this.ht.stop();
    this.q[i].setVisible(false);
    this.ht = this.s.tweens.add({ targets: this.ic[i].setVisible(true), alpha: { from: .2, to: .7 }, duration: 420, yoyo: true, repeat: -1 });
  }
  start() { this.t0 = this.s.time.now; this.on = 1; this.run(); }
  tick() {
    if (this.G && this.on) {
      const k = this.G.filter(x => x <= this.t).length;
      if (k != this.gi) { this.gi = k; this.s.tweens.add({ targets: this.gh, x: this.sx(k - 1), duration: 500 }); }
    }
    if (this.ws.visible) this.wr.tilePositionX += 4;
    if (this.on) { this.t = this.s.time.now - this.t0; this.tm.setText(fmt(this.t) + ' s'); } }
  async run() {
    const s = this.s, J = 'J' + (this.i + 1);
    for (let i = 0; i < 6; i++) {
      const S = STEPS[i];
      this.cs = i;
      this.az('¿Qué sigue?', 'Elegí con el joystick'); this.bar('', this.wide ? 'Esperando el próximo paso…' : 'Esperando…');
      const o = shuf([i, ...shuf([0, 1, 2, 3, 4, 5].filter(j => j != i)).slice(0, 3)]);
      if (s.D[3]) this.hint(i);
      await this.choose(o.map(j => ({ s: j })), o.indexOf(i), it => {
        const j = it.s;
        this.es++;
        if (j > i) { this.say(`¿${STEPS[j].n}? ¡Todavía no! ${S.k}`, 3); this.status('Error: falta ' + S.f, ER); }
        else { this.say('¡Eso ya está hecho! Mirá tu camino: ¿qué sigue?', 3); this.status(this.F(STEPS[j].d) + ' ya existe', WA); }
        s.r(`¡${J} se equivocó de paso!`);
      });
      await this.z(280 * this.sp);
      // SAP en acción
      this.clearBtns(); this.bar(S.x, S.t); this.az('SAP trabajando…', '');
      const [m0, t0] = S.m[0];
      if (m0) this.light(m0);
      this.status(t0, m0 ? MOD[m0][1] : IN);
      await this.z(650 * this.sp);
      const n = this.inc[i];
      if (n != null) await this.incident(n);
      let prev = m0;
      for (const [m, t] of S.m.slice(1)) {
        await this.travel(prev, m); this.light(m); this.status(t, MOD[m][1]);
        await this.z(480 * this.sp); prev = m;
      }
      // Documento grabado
      if (this.ht) this.ht.stop();
      this.k = i + 1; this.drawSt(); this.sp6.push(this.t);
      if (this.G) { const df = this.t - this.G[i]; s.rel(`Récord: ${df > 0 ? 'vas ' + fmt(df) + ' s atrás' : '¡vas ' + fmt(-df) + ' s adelante!'}`); }
      s.tweens.add({ targets: this.ic[i], scale: { from: 1.1, to: .62 }, duration: 320, ease: 'Back.out' });
      const cs = this.car.scale;
      s.tweens.add({ targets: this.car, x: this.sx(i), duration: 500, ease: 'Cubic.out',
        onComplete: () => s.tweens.add({ targets: this.car, scaleY: cs * .8, scaleX: cs * 1.12, duration: 90, yoyo: true }) });
      if (i == 1) {
        this.car.setAlpha(1); this.car.list[0].setTexture('cb5');
        s.time.delayedCall(160, () => this.car.list[0].setTexture('cb' + this.p.col));
        spark(s, COL[this.p.col][1], 24, this.cx + this.sx(1), 136);
      }
      if (this.lit) this.badge(this.lit, 1), this.lit = 0;
      this.halo.setVisible(false);
      this.say(this.F(S.b), 1); this.status(this.F(S.o), OK);
      this.az('', ''); this.cardT.setText(this.F(S.d)); this.sealT.setText(S.s); this.card.setVisible(true);
      this.seal.setScale(2.2).setAlpha(0);
      s.tweens.add({ targets: this.seal, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
      // Sello perfecto: A justo cuando el aro toca el sello
      if (i < 5) {
        this.stp = s.time.now; this.sealT.setColor('#1d8644');
        this.a2.setText('¡Apretá A cuando el aro toque el sello!').setY(this.ay + 44);
        s.tweens.add({ targets: this.ring.setVisible(true).setAlpha(1), radius: { from: 72, to: 16 }, duration: 600, onComplete: () => this.ring.setVisible(false) });
      }
      snd('stamp'); s.prog(this);
      s.time.delayedCall(150, () => {
        s.tweens.add({ targets: this.card, scale: 1.12, duration: 70, yoyo: true });
        if (s.n < 2) s.cameras.main.shake(90, .004);
      });
      if (i == 5) { this.on = 0; return s.done(this); }
      await this.z(1050 * this.sp);
    }
  }
  travel(a, b) {
    const sy = 268, x0 = a ? this.bx(a) : 14, d = this.doc.setPosition(x0, sy - 4).setVisible(true);
    snd('fiu'); this.tr.startFollow(d, this.cx, 0).start();
    return new Promise(r => this.s.tweens.add({ targets: d, x: this.bx(b), y: sy - 4, duration: 320 * this.sp, onComplete: () => { d.setVisible(false); this.tr.stop(); if (!this.s.over) r(); } }));
  }
  async incident(n) {
    const [, code, kind, title, sayT, barT, hint, fix] = INC[n], col = [ER, WA, IN][kind], J = 'J' + (this.i + 1);
    this.s.r(kind == 2 ? `¡Pregunta para ${J}!` : `¡Imprevisto para ${J}!`);
    if (!kind) {
      this.s.tweens.add({ targets: this.alarmG, alpha: 1, duration: 150, yoyo: true, repeat: 3 });
      this.bl.forEach((b, j) => this.s.tweens.add({ targets: b, alpha: 1, duration: 150, delay: j * 150, yoyo: true, repeat: 5 }));
    }
    this.emote(kind == 2 ? '?' : '!');
    snd(kind ? 'soft' : 'siren');
    this.say(sayT, kind ? 2 : 3); this.status(this.F(barT), col);
    this.az(title, '¿Qué módulo lo resuelve?', col);
    const o = shuf([code, ...shuf(MK.filter(m => m != code)).slice(0, 3)]);
    await this.choose(o.map(m => ({ m })), o.indexOf(code), it => {
      this.em++;
      this.say(`¡${it.m} no es: ${it.m} ${MOD[it.m][3]}! Pista: ${hint}.`, 3);
      this.s.r(`¡${J} eligió mal el módulo!`);
    });
    this.clearBtns(); this.light(code); this.status(fix, OK); this.say(`¡Gracias, ${code}!`, 1); this.az('¡Resuelto!', '', OK);
    await this.z(1100 * this.sp);
    this.az('SAP trabajando…', '');
  }
}

class Play extends Phaser.Scene {
  constructor() { super('Play'); }
  create(d) {
    clearKeys();
    this.cameras.main.setBackgroundColor(BG).fadeIn(220, 4, 6, 10); this.lv = 0;
    this.d = d; this.over = 0; this.go = 0; this.lead = -1; FEV = 0;
    this.rT = null; this.rk = 0; this.ch = 0; this.bt = 0; this.quit = 0; this.rt = null;
    const n = this.n = d.pl.length, w = W / n, lv = d.m ? d.st : d.dif;
    this.D = DIF[lv];
    // Imprevistos al azar según la dificultad: como máximo uno por paso. Iguales para ambos jugadores.
    const inc = {}, by = {};
    INC.forEach((e, j) => (by[e[0]] = by[e[0]] || []).push(j));
    shuf(Object.keys(by)).slice(0, this.D[1]).forEach(k => inc[k] = by[k][rnd(by[k].length)]);
    this.P = d.pl.map((p, i) => new Panel(this, i, i * w, w, p, inc));
    this.def = '';
    this.top = T(this, W / 2, 18, '', 18, '#ffc933');
    if (n < 2) {
      // Rival de la máquina: su auto avanza solo arriba; si llega antes, perdés
      const g = this.add.graphics(), rc = (d.pl[0].col + 2) % 4, base = RIV[lv][1] * 1000 * (.9 + Math.random() * .2);
      this.rx = k => 384 + k * 64;
      g.lineStyle(4, 0x3a4556).lineBetween(this.rx(0), 18, this.rx(6), 18);
      for (let k = 1; k < 7; k++) g.fillStyle(GRAY).fillCircle(this.rx(k), 18, 5);
      this.add.image(360, 17, 'c' + (d.pl[0].ch + 1 + rnd(5)) % 6).setScale(.42);
      this.rc = car(this, this.rx(0), 11, rc, .3);
      this.pc = car(this, this.rx(0), 25, d.pl[0].col, .3); this.ahead = 0;
      this.rT = [1, 2, 3, 4, 5, 6].map(k => base * k / 6 * (k < 6 ? .9 + Math.random() * .2 : 1)).sort((a, b) => a - b);
      this.rk = 0;
      this.def = (d.m ? `Etapa ${d.st + 1}/3 · ` : 'Rival: ') + RIV[lv][0];
      this.top.setX(14).setOrigin(0, .5).setFontSize(16).setText(this.def);
    }
    if (d.demo) {
      const b = T(this, W / 2, 140, 'DEMO · Apretá START para jugar', 24, '#ffc933', { stroke: '#04060a', strokeThickness: 6 }).setDepth(9);
      this.tweens.add({ targets: b, alpha: .3, duration: 600, yoyo: true, repeat: -1 });
    }
    this.big = T(this, W / 2, 300, '', 120, '#ffc933', { stroke: '#04060a', strokeThickness: 12 }).setDepth(9);
    this.count();
  }
  async count() {
    const sh = this.add.rectangle(W / 2, 300, W, 180, 0x04060a, .55).setDepth(8);
    for (const c of ['3', '2', '1']) { this.big.setText(c).setScale(1.3); this.tweens.add({ targets: this.big, scale: 1, duration: 300 }); snd('beep'); await wait(this, 650); }
    this.big.setText('¡Ya!'); snd('go'); await wait(this, 450);
    this.big.setText(''); sh.destroy(); this.go = 1; this.g0 = this.time.now;
    this.r('¡Largaron!');
    this.P.forEach(p => p.start());
  }
  rel(t) {
    this.top.setText(t);
    if (this.rt) this.rt.remove();
    this.rt = this.time.delayedCall(4000, () => this.top.setText(this.def));
  }
  r(t) { if (this.n > 1 && !this.over) this.rel(t); }
  prog(p) {
    if (this.pc) {
      this.tweens.add({ targets: this.pc, x: this.rx(p.k), duration: 400 });
      if (p.k > this.rk && !this.ahead && p.k < 6) { this.ahead = 1; this.rel('¡Pasaste a ' + RIV[this.d.m ? this.d.st : this.d.dif][0] + '!'); }
    }
    if (p.k == 5) {
      // Fiebre del último paso: música rápida, latido y borde dorado
      FEV = 1;
      const g = p.c.add(this.add.graphics().lineStyle(6, 0xffc933).strokeRoundedRect(4, 34, p.w - 8, H - 36, 12)).last;
      this.tweens.add({ targets: g, alpha: .15, duration: 260, yoyo: true, repeat: -1 });
      if (this.n < 2) this.rel('¡ÚLTIMO PASO!');
    }
    if (this.n < 2 || p.k > 5) return;
    const [a, b] = this.P;
    if (p.k == 5) return this.r(`¡J${p.i + 1} está a un paso de las llaves!`);
    if (a.k == b.k) return this.r('¡Van parejos!');
    const l = a.k > b.k ? 0 : 1;
    if (l != this.lead) { this.lead = l; this.r(`¡J${l + 1} pasa adelante!`); }
  }
  end(w, lost) {
    this.over = 1;
    this.P.forEach(q => q.on = 0);
    const d = this.d;
    this.time.delayedCall(lost ? 1800 : 1500, () => d.demo ? go(this, 'Title') : go(this, 'Result', {
      ...d, w, lost, ch: this.ch, rv: this.rT ? this.rT[5] : 0,
      pl: this.P.map(q => ({ ch: q.p.ch, col: q.p.col, t: q.t, err: q.err, es: q.es, em: q.em, k: q.k, pl: q.pl, top: q.top, d: q.d, sp: q.sp6 })),
    }));
  }
  done(p) {
    if (this.over) return;
    if (this.n > 1) this.rel(`¡J${p.i + 1} se llevó el auto!`);
    if (this.n > 1 && this.P[1 - p.i].k == 5) { this.cameras.main.flash(300); this.big.setText('¡FOTO FINISH!').setFontSize(64); }
    snd('fan'); confetti(this);
    this.end(p.i, 0);
  }
  lose() {
    this.rel('¡El rival se llevó el auto primero!');
    snd('bad'); this.cameras.main.shake(300, .006);
    this.end(0, 1);
  }
  update() {
    if (this.d.demo) {
      for (const n of [1, 2]) if (hit('START' + n)) return go(this, 'Select', { n, m: 0, dif: DF, st: 0, acc: 0 });
      if (Object.keys(pressed).length) return go(this, 'Title');
      const p = this.P[0];
      if (this.go && p.pick && !this.bt) this.bt = this.time.delayedCall(500 + rnd(900), () => {
        this.bt = 0; if (p.pick && !this.over) p.pick(rnd(100) < 85 ? p.ok : (p.ok + 1) % 4);
      });
    }
    if (this.go) this.P.forEach((p, i) => {
      const k = dirHit(`P${i + 1}_`);
      if (k >= 0 && p.pick && !this.over) p.pick(k);
      p.tick();
    });
    if (this.n < 2 && !this.d.demo && !this.ch && hit('START2')) { this.ch = 1; this.rel('¡NUEVO RETADOR! Juega la próxima'); snd('siren'); }
    if (this.rT && this.go && !this.over) {
      const e = this.time.now - this.g0;
      while (this.rk < 6 && e >= this.rT[this.rk]) {
        this.tweens.add({ targets: this.rc, x: this.rx(++this.rk), duration: 400 });
        if (this.ahead && this.rk > this.P[0].k) { this.ahead = 0; this.rel('¡El rival te pasó!'); snd('bad'); }
        if (this.rk == 5) this.rel('¡El rival está a un paso de las llaves!');
        if (this.rk == 6) return this.lose();
      }
    }
    for (let i = 0; i < this.n; i++) {
      const P = `P${i + 1}_`, p = this.P[i];
      if (btnA(P)) { if (p.stp) p.stamp(); else if (p.pick) { p.a2.setText('¡Usá el joystick! ← ↓ ↑ →'); snd('tick'); } }
      if (btnB(P)) {
        if (this.quit == P) return go(this, 'Title');
        this.quit = P; this.rel(`¿J${i + 1} quiere salir al inicio? Apretá B otra vez`);
        this.time.delayedCall(2000, () => this.quit = 0);
      }
    }
    clearKeys();
  }
}

class Result extends Phaser.Scene {
  constructor() { super('Result'); }
  create(d) {
    clearKeys();
    this.cameras.main.setBackgroundColor(BG).fadeIn(220, 4, 6, 10); this.lv = 0;
    this.d = d; this.idle = 0; FEV = 0; this.lock = this.time.now + 900;
    const P = this.P = d.pl[d.w], n = d.pl.length, lost = d.lost, lv = d.m ? d.st : d.dif, g = this.add.graphics(),
      N = (t, y, z, c) => T(this, 200, y, t, z || 17, c, { wordWrap: { width: 370 } });
    const pts = lost ? 0 : score(P, lv);
    this.acc = (d.acc || 0) + pts;
    // Mejor racha de la partida
    const best = Math.max(...d.pl.map(q => q.top));
    if (!lost) sSet(EKEY, ++EV);
    // Nuevo fantasma: la partida suelta más rápida de esta dificultad
    if (n < 2 && !lost && !d.m && P.sp.length == 6 && (!GH[lv] || P.t < GH[lv][5])) { GH[lv] = P.sp; sSet(GKEY, GH); }
    if (best > BEST) { BEST = best; sSet(RKEY, BEST); }
    // Columna izquierda: título, auto, chapita y puntaje
    N(lost ? (d.m ? `Llegaste a la etapa ${d.st + 1}/3` : '¡El rival ganó!') :
      d.m ? (d.st < 2 ? `¡Etapa ${d.st + 1} superada!` : '¡Ganaste el desafío!') :
      n > 1 ? `¡Ganó el Jugador ${d.w + 1}!` : '¡El auto es tuyo!', 30, 28, lost ? '#ff6b6b' : '#ffc933');
    const av = this.add.image(118, 96, 'c' + P.ch).setScale(1.1);
    if (!lost) this.tweens.add({ targets: av, y: 84, duration: 260, yoyo: true, repeat: -1, ease: 'Quad.out' });
    car(this, 250, 104, P.col, 1.1).setAlpha(lost ? .5 : 1);
    plate(this, 200, 164, 230, 70, lost ? 'SIN PATENTE' : P.pl, lost ? 24 : 32);
    const e = P.err, ns = lost ? 0 : e ? e < 3 ? 2 : 1 : 3;
    for (let i = 0; i < 3; i++) {
      const sg = this.add.graphics().setPosition(150 + i * 50, 230).setScale(0);
      star(sg, 0, 0, 19, i < ns ? 0xffc933 : 0x3a4556);
      this.tweens.add({ targets: sg, scale: 1, delay: 300 + i * 250, duration: 300, ease: 'Back.out', onStart: () => i < ns && tone(880 + i * 220, .15, 'triangle', .12) });
    }
    N(lost ? `${who(P)} hizo ${P.k} de 6 pasos  ${'●'.repeat(P.k)}${'○'.repeat(6 - P.k)}` :
      `${who(P)} se llevó su auto ${COL[P.col][0]} en ${fmt(P.t)}\u00a0s.`, 270);
    if (d.m && lost) N(`Puntaje del desafío: ${this.acc}`, 296, 18, '#ffc933');
    else N((e ? `Con ${e} error${e > 1 ? 'es' : ''}` : 'Sin errores') + ' · ' + ['Gurú del circuito SAP', `Consultor${CH[P.ch][1] == 'La' ? 'a' : ''} SAP en ascenso`, 'Pasante con ganas', 'Cliente que se hizo un lío'][e ? e < 3 ? 1 : e < 5 ? 2 : 3 : 0], 296, 17, e ? '#eef3f9' : '#5bd17f');
    // Consejo para quien perdió
    const L = lost ? P : n > 1 ? d.pl[1 - d.w] : 0;
    if (n < 2 && !lost && d.rv) N(`¡Le ganaste a ${RIV[lv][0]} por ${fmt(d.rv - P.t)}\u00a0s!`, 322, 16, '#5bd17f');
    if (n > 1) N(`J${2 - d.w} llegó a ${L.k} de 6 pasos  ${'●'.repeat(L.k)}${'○'.repeat(6 - L.k)}`, 322, 17, '#c9d3df');
    if (L) T(this, 200, 386, (n > 1 ? `Consejo J${2 - d.w}: ` : 'Consejo: ') + TIPS[L.es && L.es >= L.em ? 0 : L.em ? 1 : 2], 16, '#74c0fc', { fontStyle: 'normal', wordWrap: { width: 370 } });
    else {
      const pt = N('', 330, 22, '#ffc933');
      N(`Rapidez +${Math.round((100 - P.t / 1000) * 10 * [1, 1.5, 2][lv])}  ·  Errores −${e * 50}  ·  Racha +${P.top * 10}`, 358, 16, '#c9d3df');
      this.tweens.addCounter({ from: 0, to: pts, duration: 900, delay: 300, onUpdate: c => pt.setText(`Puntaje: ${Math.round(c.getValue())}` + (d.m ? `  ·  Desafío: ${this.acc}` : '')) });
    }
    if (n > 1) N(`Puntaje: ${pts}`, 348, 18, '#ffc933');
    // Al top 5 entra quien gana (en el desafío, al completar las 3 etapas)
    const sc = d.m ? this.acc : pts, R = this.R = d.m ? CTOP : TOP;
    this.q = (d.m ? lost || d.st == 2 : !lost) && sc > 0 && (R.length < 5 || sc > R[4].s);
    this.sc = sc;
    this.lo = this.add.container(0, 0);
    if (this.q) {
      this.L = [0, 0, 0]; this.li = 0; this.left = 15;
      if (sc > (R[0] || { s: 0 }).s) this.cameras.main.flash(400);
      this.lo.add(N(sc > (R[0] || { s: 0 }).s ? '¡Nuevo récord! Poné tus iniciales' : '¡Entraste al top 5! Poné tus iniciales', 420, 18, '#4aa3ef'));
      this.lg = this.add.graphics(); this.lo.add(this.lg);
      this.lt = [0, 1, 2].map(i => { const t = T(this, 150 + i * 50, 470, 'A', 30, '#151a23'); this.lo.add(t); return t; });
      this.lo.add(N('Joystick ↑ ↓: letra   ·   A: confirmar', 516, 16, '#c9d3df'));
      this.lc = N('', 540, 16, '#c9d3df'); this.lo.add(this.lc);
      this.time.addEvent({ delay: 1000, repeat: 14, callback: () => { if (this.q && !--this.left) this.save(); this.ini(); } });
      this.ini();
    } else this.top(-1);
    this.nx = d.m && !lost && d.st < 2;
    const h = T(this, 200, 580, d.ch ? '¡Hay un retador! A: jugar de a dos · B: inicio' : `A: ${this.nx ? 'siguiente etapa' : d.m && lost ? 'reintentar el desafío' : 'revancha'}   ·   B: volver al inicio`, 18, d.ch ? '#ffc933' : '#c9d3df');
    if (d.ch) this.tweens.add({ targets: h, alpha: .4, duration: 450, yoyo: true, repeat: -1 });
    // Columna derecha: qué hizo cada módulo y el flujo de documentos con los números de esta partida
    g.fillStyle(SF).fillRoundedRect(404, 12, 384, 576, 12).lineStyle(3, P1C).strokeRoundedRect(404, 12, 384, 576, 12);
    T(this, 596, 36, 'Los 7 módulos que trabajaron para tu auto', 18, '#4aa3ef');
    MK.forEach((m, i) => {
      const y = 76 + i * 46;
      badge(this, 442, y, m, 50, 30);
      T(this, 478, y, `${MOD[m][0]}: ${MOD[m][2]}`, 16, '#eef3f9', { fontStyle: 'normal', align: 'left', wordWrap: { width: 296 } }).setOrigin(0, .5);
    });
    T(this, 596, 412, 'El flujo de documentos en SAP', 18, '#4aa3ef');
    T(this, 596, 452, `Pedido 10${P.d} → Orden 20${P.d} → Entrega 80${P.d} → Factura 90${P.d} → Patente ${P.pl} → Llaves`, 16, '#eef3f9', { wordWrap: { width: 360 } });
    T(this, 596, 496, 'VA01 · CO01 · VL01N · VF01 · Registro · VA03', 16, '#c9d3df');
    T(this, 596, 544, 'Cada papel nace del anterior y cada módulo hace su parte. ¡SAP no es difícil: solo hay que entender el camino!', 16, '#ffc933', { wordWrap: { width: 350 } });
    if (!lost) confetti(this, -1);
  }
  ini() {
    if (!this.q) return;
    this.lg.clear();
    this.L.forEach((c, i) => {
      this.lg.fillStyle(0xffffff).fillRoundedRect(130 + i * 50, 444, 40, 52, 6).lineStyle(4, i == this.li ? 0xffc933 : LN).strokeRoundedRect(130 + i * 50, 444, 40, 52, 6);
      this.lt[i].setText(String.fromCharCode(65 + c));
    });
    this.lc.setText(this.left == 1 ? 'Queda 1 s' : `Quedan ${this.left} s`);
  }
  save() {
    const e = { n: this.L.map(c => String.fromCharCode(65 + c)).join(''), s: this.sc };
    this.q = 0;
    const R = this.R = vTop([...this.R, e]);
    if (this.d.m) CTOP = R; else TOP = R;
    sSet(this.d.m ? CKEY : SKEY, R);
    this.lo.destroy(); this.lo = this.add.container(0, 0);
    this.top(R.indexOf(e));
    snd('arp');
  }
  top(me) {
    this.lo.add(T(this, 200, 420, this.d.m ? 'Mejores desafíos' : 'Mejores puntajes', 18, '#4aa3ef'));
    for (let i = 0; i < 5; i++) {
      const e = this.R[i];
      this.lo.add(T(this, 200, 446 + i * 24, e ? `${i + 1}. ${e.n}   ${e.s}` : `${i + 1}. ---`, 17, i == me ? '#ffc933' : e ? '#eef3f9' : '#8b97a8'));
    }
  }
  update(t, dt) {
    const p = `P${this.d.w + 1}_`, d = this.d, pl = d.pl.map(q => ({ ch: q.ch, col: q.col }));
    this.idle = Object.keys(pressed).length ? 0 : this.idle + dt;
    if (this.idle > 30000) return go(this, 'Title');
    if (t < this.lock) return clearKeys();
    if (this.q) {
      const k = dirHit(p);
      if (k == 1 || k == 2) { this.L[this.li] = (this.L[this.li] + (k == 2 ? 1 : 25)) % 26; snd('tick'); this.ini(); }
      if (btnA(p)) { snd('ok'); if (++this.li > 2) this.save(); else this.ini(); }
    } else if (d.ch && (btnA('P1_') || btnA('P2_') || hit('START2'))) go(this, 'Select', { n: 2, m: 0, dif: d.dif, st: 0, acc: 0 });
    else if (btnA('P1_') || btnA('P2_')) go(this, 'Play', {
      ...d, pl, lost: 0, st: this.nx ? d.st + 1 : 0, acc: this.nx ? this.acc : 0,
    });
    else if (btnB('P1_') || btnB('P2_') || hit('START1') || hit('START2')) go(this, 'Title');
    clearKeys();
  }
}

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-root',
  backgroundColor: '#151a23',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
  scene: [Boot, Title, Select, Play, Result],
});
