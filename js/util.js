/* Utilidades compartidas: escape de texto, fechas, íconos, avisos, hoja inferior
   y un lector de fórmulas SEGURO (no usa eval ni Function). */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = 'id') => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const MENOS = '−';

/* ---------- Fechas ---------- */
function fechaLocal(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function sumarDias(fecha, n) { const d = new Date(fecha + 'T12:00:00'); d.setDate(d.getDate() + n); return fechaLocal(d); }
function diasHasta(fecha) { const a = new Date(fechaLocal() + 'T12:00:00'), b = new Date(fecha + 'T12:00:00'); return Math.round((b - a) / 864e5); }
function hace(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'ahora'; if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h'; if (s < 172800) return 'ayer';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
/* cierre: puede ser 'AAAA-MM-DD' (cierra al terminar ese día) o fecha y hora completas */
function cierreMs(c) { return !c ? Infinity : String(c).length === 10 ? new Date(c + 'T23:59:59').getTime() : new Date(c).getTime(); }
function yaCerro(p) { return Date.now() >= cierreMs(p.cierre); }
function faltaTexto(c) {
  const ms = cierreMs(c) - Date.now(); if (ms <= 0) return null;
  const min = Math.ceil(ms / 6e4); if (min < 60) return min + ' min';
  const h = Math.floor(min / 60); if (h < 24) return h + ' h' + (min % 60 && h < 3 ? ' ' + (min % 60) + ' min' : '');
  return Math.round(h / 24) + ' d';
}
function cierreBonito(c) { return String(c).length === 10 ? fechaBonita(c) : new Date(c).toLocaleString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); }
/* archivos grandes (canciones) en IndexedDB; con la base de datos real irán a Supabase Storage */
const ARCHIVOS = {
  _db: null,
  abrir() { return this._db || (this._db = new Promise((ok, mal) => { const r = indexedDB.open('cdu_archivos', 1); r.onupgradeneeded = () => r.result.createObjectStore('a'); r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); })); },
  async guardar(clave, blob) { const db = await this.abrir(); return new Promise((ok, mal) => { const t = db.transaction('a', 'readwrite'); t.objectStore('a').put(blob, clave); t.oncomplete = () => ok(clave); t.onerror = () => mal(t.error); }); },
  async leer(clave) { const db = await this.abrir(); return new Promise((ok, mal) => { const r = db.transaction('a').objectStore('a').get(clave); r.onsuccess = () => ok(r.result || null); r.onerror = () => mal(r.error); }); }
};
/* reduce una imagen a un cuadrado de `lado` px y la devuelve como dataURL (jpg) */
function reducirImagen(archivo, lado = 256) {
  return new Promise((ok, mal) => { const img = new Image(), url = URL.createObjectURL(archivo);
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = lado; const m = Math.min(img.width, img.height); c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, lado, lado); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.85)); };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('imagen')); }; img.src = url; });
}
function fechaBonita(f) { return new Date(f + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }); }
function inicioSemana(d = new Date()) { const x = new Date(d); const dia = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dia); x.setHours(0, 0, 0, 0); return x; }
const numero = n => new Intl.NumberFormat('es-MX').format(n);

/* ---------- Íconos (trazos SVG) ---------- */
const RUTAS = {
  inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  propuestas: 'M5 21V4M5 4h11l-2 4 2 4H5',
  juegos: 'M6 9h12a3 3 0 0 1 3 3v3a3 3 0 0 1-5.2 2L14 15h-4l-1.8 2A3 3 0 0 1 3 15v-3a3 3 0 0 1 3-3zM8 11v3M6.5 12.5h3M15.5 12h.01M17.5 14h.01',
  perfil: 'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  chat: 'M4 5h16v11H9l-5 4z',
  explorar: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',
  agenda: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  rankings: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  tienda: 'M4 7h16l-1 13H5zM8 7a4 4 0 0 1 8 0',
  herramientas: 'M3 3v18h18M7 15l4-5 3 3 5-7',
  admin: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  campana: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  atras: 'M15 5l-7 7 7 7',
  cerrar: 'M6 6l12 12M18 6L6 18',
  mas: 'M12 5v14M5 12h14',
  puntos: 'M5 12h.01M12 12h.01M19 12h.01',
  ajustes: 'M12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  enviar: 'M4 12l16-8-6 16-2-7z',
  ok: 'M5 12l5 5 9-10',
  musica: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0a3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0a3 3 0 0 1 6 0z',
  play: 'M7 4l13 8-13 8z',
  pausa: 'M6 5h4v14H6zM14 5h4v14h-4z',
  mapa: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  profe: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5',
  grupo: 'M9 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 20a6 6 0 0 0-4-5.6',
  mundo: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  candado: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z',
  bandera: 'M5 21V4M5 4h11l-2 4 2 4H5',
  bloquear: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM5.6 5.6l12.8 12.8',
  silencio: 'M11 5L6 9H3v6h3l5 4zM17 9l4 6M21 9l-4 6',
  subir: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
  camara: 'M4 7h4l2-3h4l2 3h4v13H4zM12 17a4 4 0 1 0 0-8a4 4 0 0 0 0 8z',
  rayo: 'M13 2L4 14h7l-1 8 9-12h-7z',
  estrella: 'M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.6 6.7 19.5l1.1-6L3.4 9.3l6-.8z',
  carta: 'M7 3h10v18H7zM10 8l2 3 2-3M12 11v5',
  nave: 'M12 2l3 7v6l-3 3-3-3V9zM9 13l-4 3v3l4-2M15 13l4 3v3l-4-2',
  runner: 'M13 4a2 2 0 1 0 0 .1M9 20l3-6 3 3v4M6 12l3-4 4 1 3 3 3 1',
  ruleta: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 3v18M3 12h18M5.6 5.6l12.8 12.8',
  tragamonedas: 'M4 5h16v14H4zM9 5v14M15 5v14',
  pregunta: 'M9 9a3 3 0 1 1 4 2.8c-.8.4-1 1-1 1.7V15M12 18h.01',
  cuadros: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  sigma: 'M18 4H6l6 8-6 8h12',
  regalo: 'M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9c-2-4-6-4-6-1s6 1 6 1zM12 9c2-4 6-4 6-1s-6 1-6 1z',
  tienda2: 'M4 7h16l-1 13H5zM8 7a4 4 0 0 1 8 0',
  luna: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  lapiz: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  tablon: 'M12 17v5M8 3h8l-1 6 3 4H6l3-4z',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8zM17.5 6.5h.01',
  tiktok: 'M14 4v10a4 4 0 1 1-4-4M14 4c1 3 3 4 6 4',
  descargar: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  archivo: 'M6 2h9l5 5v15H6zM15 2v5h5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  basura: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3'
};
function icono(n, t = 22, extra = '') { return `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}><path d="${RUTAS[n] || ''}"/></svg>`; }
function castor(t = 40) {
  return `<svg width="${t}" height="${t}" viewBox="0 0 40 40" aria-hidden="true"><circle cx="10" cy="10" r="5" fill="#8A5A3B"/><circle cx="30" cy="10" r="5" fill="#8A5A3B"/><ellipse cx="20" cy="21" rx="14" ry="13" fill="#A86E47"/><ellipse cx="20" cy="26" rx="8" ry="6" fill="#E8C9A6"/><circle cx="14.5" cy="18" r="2" fill="#1B1530"/><circle cx="25.5" cy="18" r="2" fill="#1B1530"/><ellipse cx="20" cy="22.5" rx="3" ry="2" fill="#1B1530"/><rect x="17.6" y="28" width="4.8" height="5" rx="1" fill="#FFFFFF" stroke="#1B1530" stroke-width="1"/><line x1="20" y1="28" x2="20" y2="33" stroke="#1B1530" stroke-width="1"/></svg>`;
}

/* ---------- Avisos y hoja inferior ---------- */
let _toastT;
function aviso(msg) {
  $('.toast')?.remove(); clearTimeout(_toastT);
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); _toastT = setTimeout(() => t.remove(), 3200);
}
function abrirHoja(html) {
  cerrarHoja();
  const v = document.createElement('div'); v.className = 'velo'; v.id = 'velo';
  v.innerHTML = `<div class="hoja aparece" role="dialog" aria-modal="true"><div class="asa"></div>${html}</div>`;
  v.addEventListener('click', e => { if (e.target === v) cerrarHoja(); });
  document.body.appendChild(v);
  v.querySelector('input,textarea,select,button')?.focus();
}
function cerrarHoja() { $('#velo')?.remove(); }
if (typeof document !== 'undefined') document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarHoja(); });

/* ---------- Lector de fórmulas seguro ----------
   Acepta: + - * / ^, paréntesis, x, pi, e, números y funciones
   sen/sin, cos, tan, asen/asin, acos, atan, raiz/sqrt, exp, ln, log, abs, piso/floor, techo/ceil.
   Multiplicación implícita: 2x, 3sen(x), (x+1)(x-1). */
const FUNCS = { sin: Math.sin, sen: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, asen: Math.asin, acos: Math.acos, atan: Math.atan, sqrt: Math.sqrt, raiz: Math.sqrt, exp: Math.exp, ln: Math.log, log: Math.log10, abs: Math.abs, sinh: Math.sinh, senh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, cbrt: Math.cbrt, floor: Math.floor, piso: Math.floor, ceil: Math.ceil, techo: Math.ceil };
function compilarFormula(texto, opciones = {}) {
  const GRADOS = !!opciones.grados, TRIG = ['sin', 'sen', 'cos', 'tan'], ATRIG = ['asin', 'asen', 'acos', 'atan'];
  const factorial = n => { if (!Number.isInteger(n) || n < 0 || n > 170) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const src = String(texto).toLowerCase().replace(/\s+/g, '').replace(/\*\*/g, '^').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/−/g, '-').replace(/,/g, '.');
  if (!src) throw new Error('Escribe una función');
  if (src.length > 200) throw new Error('La fórmula es demasiado larga');
  const tk = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/[0-9.]/.test(c)) { let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++; const n = Number(src.slice(i, j)); if (!Number.isFinite(n)) throw new Error('Número no válido'); tk.push({ t: 'n', v: n }); i = j; }
    else if (/[a-z]/.test(c)) {
      let j = i; while (j < src.length && /[a-z]/.test(src[j])) j++; let w = src.slice(i, j);
      // separar palabras pegadas como "xsen" o "pix"
      while (w) {
        const f = Object.keys(FUNCS).concat(['pi', 'x', 'e']).sort((a, b) => b.length - a.length).find(k => w.startsWith(k));
        if (!f) throw new Error('No conozco "' + w + '"');
        tk.push(FUNCS[f] ? { t: 'f', v: f } : f === 'x' ? { t: 'x' } : { t: 'n', v: f === 'pi' ? Math.PI : Math.E });
        w = w.slice(f.length);
      }
      i = j;
    }
    else if ('+-*/^()!'.includes(c)) { tk.push({ t: c }); i++; }
    else throw new Error('Carácter no permitido: ' + c);
  }
  // multiplicación implícita
  const tk2 = [];
  tk.forEach((t, k) => { const p = tk2[tk2.length - 1]; if (p && (p.t === 'n' || p.t === 'x' || p.t === ')' || p.t === '!') && (t.t === 'n' || t.t === 'x' || t.t === 'f' || t.t === '(')) tk2.push({ t: '*' }); tk2.push(t); });
  let p = 0;
  const ver = () => tk2[p], tomar = t => { if (!tk2[p] || tk2[p].t !== t) throw new Error('Falta "' + t + '"'); p++; };
  function suma() { let a = prod(); while (ver() && (ver().t === '+' || ver().t === '-')) { const o = tk2[p++].t, b = prod(), A = a; a = o === '+' ? x => A(x) + b(x) : x => A(x) - b(x); } return a; }
  function prod() { let a = unario(); while (ver() && (ver().t === '*' || ver().t === '/')) { const o = tk2[p++].t, b = unario(), A = a; a = o === '*' ? x => A(x) * b(x) : x => A(x) / b(x); } return a; }
  function unario() { if (ver() && ver().t === '-') { p++; const a = unario(); return x => -a(x); } if (ver() && ver().t === '+') { p++; return unario(); } return pot(); }
  function postfijo() { let a = base(); while (ver() && ver().t === '!') { p++; const A = a; a = x => factorial(A(x)); } return a; }
  function pot() { const a = postfijo(); if (ver() && ver().t === '^') { p++; const b = unario(); return x => Math.pow(a(x), b(x)); } return a; }
  function base() {
    const t = tk2[p++]; if (!t) throw new Error('La fórmula está incompleta');
    if (t.t === 'n') { const v = t.v; return () => v; }
    if (t.t === 'x') return x => x;
    if (t.t === '(') { const a = suma(); tomar(')'); return a; }
    if (t.t === 'f') { const f = FUNCS[t.v]; let a; if (ver() && ver().t === '(') { p++; a = suma(); tomar(')'); } else a = pot();
      if (GRADOS && TRIG.includes(t.v)) return x => f(a(x) * Math.PI / 180);
      if (GRADOS && ATRIG.includes(t.v)) return x => f(a(x)) * 180 / Math.PI;
      return x => f(a(x)); }
    throw new Error('Algo no cuadra cerca de "' + t.t + '"');
  }
  const f = suma(); if (p < tk2.length) throw new Error('Sobra algo al final');
  return f;
}
function formulaBonita(t) { return esc(t).replace(/\*\*/g, '^').replace(/\*/g, '·').replace(/\^(\d+)/g, '<sup>$1</sup>').replace(/\bpi\b/g, 'π').replace(/\bsin\b/g, 'sen').replace(/-/g, MENOS); }
if (typeof module !== 'undefined') module.exports = { compilarFormula };
