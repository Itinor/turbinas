/* Herramientas: graficadora (con lector de fórmulas seguro) y métodos numéricos */
'use strict';
const COLORES_FN = ['#4B1F7A', '#1D5FD1', '#FF9F1C', '#15803D'];
UI.graf = { fns: ['x^3 - 3x', 'sen(x)', '', ''], cx: 0, cy: 0, esc: 45, area: { on: false, a: 0, b: 2 }, ver: { raices: true, extremos: true, inflexion: true, cortes: true, derivada: false } };
VISTAS.herramientas = {
  titulo: 'Herramientas', nav: 'herramientas',
  render(params) {
    if (params[0] === 'calculadora') return vistaCalculadora();
    if (params[0] === 'metodos') return `<div class="pila">${pestanasHerr('metodos')}<iframe class="marco-juego" style="background:#fff;height:min(80vh,900px)" src="herramientas/metodos.html?v=202611212204" title="Métodos numéricos"></iframe><a class="btn3" href="herramientas/metodos.html?v=202611212204" target="_blank" rel="noopener">Abrir en pantalla completa</a></div>`;
    const G = UI.graf;
    return `<div class="pila">
      ${pestanasHerr('')}
      <section class="tarjeta pila" style="gap:8px">${G.fns.map((f, i) => `<div class="fn-fila"><span class="color" style="background:${COLORES_FN[i]}"></span><label class="oculto" for="fn${i}">Función ${i + 1}</label><span class="peq" style="font-weight:800;white-space:nowrap">${'fghp'[i]}(x) =</span><input id="fn${i}" value="${esc(f)}" placeholder="${i === 0 ? 'x^2 - 4' : 'opcional'}" data-entrada="fn" data-i="${i}" autocomplete="off" spellcheck="false"><span id="err${i}" class="mini" style="color:var(--malTxt);min-width:0"></span></div>`).join('')}</section>
      <div class="lienzo" id="lienzo"><canvas id="graf" aria-label="Gráfica de las funciones" role="img"></canvas><span class="coord" id="coord">Arrastra para moverte · rueda o pellizco para acercar</span></div>
      <div class="fila"><button class="btn3" data-a="zoom" data-z="1.4" aria-label="Acercar">${icono('mas', 18)}</button><button class="btn3" data-a="zoom" data-z="0.7" aria-label="Alejar">${MENOS}</button><button class="btn3" data-a="centrar">Centrar</button>
        <label class="fila peq" style="margin-left:auto"><input type="checkbox" data-cambio="areaOn" ${G.area.on ? 'checked' : ''}> Área bajo f entre</label><label class="oculto" for="aa">a</label><input id="aa" type="number" step="any" value="${G.area.a}" style="width:80px" data-entrada="areaA"><label class="oculto" for="ab">b</label><input id="ab" type="number" step="any" value="${G.area.b}" style="width:80px" data-entrada="areaB"></div>
      <div class="fila">${[['raices', 'Raíces'], ['extremos', 'Máximos y mínimos'], ['inflexion', 'Inflexión'], ['cortes', 'Cruces y eje y'], ['derivada', "Derivada f′"]].map(([k, t]) => `<button class="pastilla${G.ver[k] ? ' on' : ''}" data-a="verGraf" data-k="${k}" aria-pressed="${G.ver[k]}">${t}</button>`).join('')}</div>
      <section class="tarjeta" id="hallazgos" aria-live="polite"></section></div>`;
  },
  montar(params) { if (!params[0]) iniciarGraficadora(); if (params[0] === 'calculadora') { const i = $('#calcEntrada'); i?.focus(); } }
};
let grafCompiladas = [];
function compilarTodas() {
  grafCompiladas = UI.graf.fns.map((f, i) => { const err = $('#err' + i); if (!f.trim()) { if (err) err.textContent = ''; return null; } try { const fn = compilarFormula(f); fn(1); if (err) err.textContent = ''; return fn; } catch (e) { if (err) err.textContent = e.message; return null; } });
}
function iniciarGraficadora() {
  const cv = $('#graf'), caja = $('#lienzo'); if (!cv) return; compilarTodas();
  const ctx = cv.getContext('2d'), G = UI.graf;
  const dibujar = () => {
    if (!cv.isConnected) { obs.disconnect(); return; }
    const W = caja.clientWidth, H = caja.clientHeight, dpr = devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const oscuro = document.documentElement.dataset.tema === 'oscuro', tinta = oscuro ? '#F3EFFA' : '#1B1530', linea = oscuro ? '#352B4D' : '#ECE8F4';
    const X = x => W / 2 + (x - G.cx) * G.esc, Y = y => H / 2 - (y - G.cy) * G.esc, xv = px => G.cx + (px - W / 2) / G.esc;
    ctx.clearRect(0, 0, W, H);
    const crudo = 80 / G.esc, pot = Math.pow(10, Math.floor(Math.log10(crudo))), paso = [1, 2, 5, 10].map(m => m * pot).find(v => v >= crudo);
    ctx.lineWidth = 1; ctx.strokeStyle = linea; ctx.fillStyle = oscuro ? '#B9B0CF' : '#5E5873'; ctx.font = '12px Inter, sans-serif';
    const x0 = Math.ceil(xv(0) / paso) * paso, y0 = Math.ceil((G.cy - H / 2 / G.esc) / paso) * paso;
    for (let x = x0; X(x) < W; x += paso) { ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); ctx.stroke(); if (Math.abs(x) > paso / 2) ctx.fillText(+x.toPrecision(6) + '', X(x) + 3, Math.min(H - 4, Math.max(14, Y(0) + 14))); }
    for (let y = y0; Y(y) > 0; y += paso) { ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(W, Y(y)); ctx.stroke(); if (Math.abs(y) > paso / 2) ctx.fillText(+y.toPrecision(6) + '', Math.min(W - 40, Math.max(4, X(0) + 4)), Y(y) - 3); }
    ctx.strokeStyle = tinta; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
    // área bajo f
    const f0 = grafCompiladas[0];
    if (G.area.on && f0 && G.area.b > G.area.a) { ctx.fillStyle = 'rgba(255,159,28,.28)'; ctx.beginPath(); ctx.moveTo(X(G.area.a), Y(0)); const n = 300; for (let k = 0; k <= n; k++) { const x = G.area.a + (G.area.b - G.area.a) * k / n, y = f0(x); ctx.lineTo(X(x), Y(Number.isFinite(y) ? y : 0)); } ctx.lineTo(X(G.area.b), Y(0)); ctx.closePath(); ctx.fill(); }
    grafCompiladas.forEach((f, i) => { if (!f) return; ctx.strokeStyle = COLORES_FN[i]; ctx.lineWidth = 3; ctx.beginPath(); let pen = false, prev = null;
      for (let px = 0; px <= W; px++) { const y = f(xv(px)), py = Y(y); if (!Number.isFinite(y) || Math.abs(py) > H * 4 || (prev !== null && Math.abs(py - prev) > H)) { pen = false; prev = null; continue; } if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; } prev = py; }
      ctx.stroke(); });
    // derivada de f (punteada)
    const xmin = xv(0), xmax = xv(W), V = G.ver;
    if (V.derivada && f0) { const h = 1e-4; ctx.strokeStyle = COLORES_FN[0]; ctx.setLineDash([7, 6]); ctx.lineWidth = 2; ctx.beginPath(); let pen = false;
      for (let px = 0; px <= W; px += 2) { const x = xv(px), y = (f0(x + h) - f0(x - h)) / (2 * h), py = Y(y); if (!Number.isFinite(y) || Math.abs(py) > H * 4) { pen = false; continue; } if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; } }
      ctx.stroke(); ctx.setLineDash([]); }
    // puntos notables: raíces, máximos, mínimos, inflexión, cruces y corte con el eje y
    const pts = [], N = Math.min(1200, Math.max(300, W)), dx = (xmax - xmin) / N;
    const refina = (g, a, b) => { let ga = g(a); for (let k = 0; k < 60; k++) { const m = (a + b) / 2, gm = g(m); if (ga * gm <= 0) b = m; else { a = m; ga = gm; } } return (a + b) / 2; };
    const cambios = (g, cb) => { let a = xmin, ga = g(a); for (let k = 1; k <= N; k++) { const b = xmin + k * dx, gb = g(b); if (Number.isFinite(ga) && Number.isFinite(gb) && ga * gb < 0 && Math.abs(ga - gb) < 1e3) cb(refina(g, a, b), ga, gb); else if (gb === 0 && Number.isFinite(ga) && ga !== 0) cb(b, ga, gb); a = b; ga = gb; } };
    const agrega = (p) => { if (!pts.some(q => q.tipo === p.tipo && q.fn === p.fn && Math.abs(q.x - p.x) < dx)) pts.push(p); };
    grafCompiladas.forEach((f, i) => { if (!f) return; const nombre = 'fghp'[i], c = COLORES_FN[i], h = Math.max(1e-6, dx / 50);
      const d1 = x => (f(x + h) - f(x - h)) / (2 * h), d2 = x => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
      const continua = x => { const y = f(x); return Number.isFinite(y) && Math.abs(f(x + dx) - y) < 50 * (Math.abs(d1(x)) * dx + 1); };
      if (V.raices) cambios(f, r => continua(r) && agrega({ x: r, y: 0, tipo: 'raiz', fn: nombre, c }));
      if (V.extremos) cambios(d1, (r, a) => { const y = f(r); if (continua(r)) agrega({ x: r, y, tipo: a > 0 ? 'max' : 'min', fn: nombre, c }); });
      if (V.inflexion) { const h2 = Math.max(1e-4, dx / 4), dd = x => (f(x + h2) - 2 * f(x) + f(x - h2)) / (h2 * h2); cambios(dd, r => { const y = f(r); if (continua(r) && Math.abs(dd(r - dx)) > 1e-6 && Math.abs(dd(r + dx)) > 1e-6) agrega({ x: r, y, tipo: 'inflexion', fn: nombre, c }); }); }
      if (V.cortes && xmin < 0 && xmax > 0) { const y = f(0); if (Number.isFinite(y)) agrega({ x: 0, y, tipo: 'ejey', fn: nombre, c }); } });
    if (V.cortes) grafCompiladas.forEach((f, i) => grafCompiladas.forEach((g, j) => { if (!f || !g || j <= i) return; cambios(x => f(x) - g(x), r => { const y = f(r); if (Number.isFinite(y)) agrega({ x: r, y, tipo: 'cruce', fn: 'fghp'[i] + ' y ' + 'fghp'[j], c: '#1B1530' }); }); }));
    const forma = (p) => { const x = X(p.x), y = Y(p.y); ctx.lineWidth = 3; ctx.strokeStyle = p.c; ctx.fillStyle = oscuro ? '#1F1830' : '#fff'; ctx.beginPath();
      if (p.tipo === 'max') { ctx.moveTo(x, y - 8); ctx.lineTo(x + 7, y + 5); ctx.lineTo(x - 7, y + 5); ctx.closePath(); }
      else if (p.tipo === 'min') { ctx.moveTo(x, y + 8); ctx.lineTo(x + 7, y - 5); ctx.lineTo(x - 7, y - 5); ctx.closePath(); }
      else if (p.tipo === 'inflexion') { ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.closePath(); }
      else if (p.tipo === 'ejey') { ctx.rect(x - 5, y - 5, 10, 10); }
      else ctx.arc(x, y, 5, 0, 7);
      ctx.fill(); ctx.stroke(); };
    pts.forEach(forma);
    let area = '';
    if (G.area.on && f0 && G.area.b > G.area.a) { const n = 1000, h = (G.area.b - G.area.a) / n; let s = f0(G.area.a) + f0(G.area.b); for (let k = 1; k < n; k++) s += (k % 2 ? 4 : 2) * f0(G.area.a + k * h); area = `<p class="peq" style="margin:10px 0 0">∫ de ${G.area.a} a ${G.area.b} de f(x) dx ≈ <b>${(s * h / 3).toFixed(6)}</b> <span class="gris mini">(Simpson 1/3, n = 1000)</span></p>`; }
    const NOMBRE_P = { raiz: ['Raíz', '○'], max: ['Máximo', '▲'], min: ['Mínimo', '▼'], inflexion: ['Inflexión', '◆'], ejey: ['Corte con eje y', '■'], cruce: ['Cruce', '●'] };
    const orden = ['max', 'min', 'raiz', 'inflexion', 'ejey', 'cruce'], fmt = v => (Math.abs(v) < 5e-10 ? 0 : v).toFixed(4).replace('-', MENOS);
    UI.graf.puntos = pts.slice().sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo) || a.x - b.x).slice(0, 40);
    $('#hallazgos').innerHTML = `<div class="entre"><h3>Puntos en esta vista</h3><span class="mini gris">Toca uno para centrarlo</span></div>${UI.graf.puntos.map((p, k) => `<button class="entre ancho" style="border:0;background:transparent;border-bottom:1px solid var(--linea);padding:8px 0;text-align:left;color:inherit" data-a="irPunto" data-i="${k}"><span class="peq"><b style="color:${p.c};display:inline-block;width:18px">${NOMBRE_P[p.tipo][1]}</b>${NOMBRE_P[p.tipo][0]} de ${esc(p.fn)}</span><span class="peq" style="font-family:Sora,sans-serif">(${fmt(p.x)}, ${fmt(p.y)})</span></button>`).join('') || '<p class="peq gris" style="margin:6px 0 0">No hay puntos notables a la vista. Mueve o aleja la gráfica.</p>'}${area}`;
  };
  const obs = new ResizeObserver(() => dibujar());
  UI.graf.dibujar = dibujar; dibujar();
  obs.observe(caja);
  const punteros = new Map(); let ultimaDist = null;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); punteros.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(), x = G.cx + (e.clientX - r.left - r.width / 2) / G.esc, y = G.cy - (e.clientY - r.top - r.height / 2) / G.esc;
    $('#coord').textContent = `x = ${x.toFixed(3)}  ·  y = ${y.toFixed(3)}` + (grafCompiladas[0] ? `  ·  f(x) = ${(+grafCompiladas[0](x)).toFixed(4)}` : '');
    if (!punteros.has(e.pointerId)) return; const p = punteros.get(e.pointerId);
    if (punteros.size === 1) { G.cx -= (e.clientX - p.x) / G.esc; G.cy += (e.clientY - p.y) / G.esc; }
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.size === 2) { const [a, b] = [...punteros.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (ultimaDist) G.esc = Math.min(4000, Math.max(2, G.esc * d / ultimaDist)); ultimaDist = d; }
    dibujar();
  });
  const soltar = e => { punteros.delete(e.pointerId); ultimaDist = null; };
  cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', soltar);
  cv.addEventListener('wheel', e => { e.preventDefault(); G.esc = Math.min(4000, Math.max(2, G.esc * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); dibujar(); }, { passive: false });
}
ENTRADAS.fn = el => { UI.graf.fns[+el.dataset.i] = el.value; compilarTodas(); UI.graf.dibujar?.(); };
ENTRADAS.areaA = el => { UI.graf.area.a = Number(el.value); UI.graf.dibujar?.(); };
ENTRADAS.areaB = el => { UI.graf.area.b = Number(el.value); UI.graf.dibujar?.(); };
CAMBIOS.areaOn = el => { UI.graf.area.on = el.checked; UI.graf.dibujar?.(); };
ACC.zoom = b => { UI.graf.esc = Math.min(4000, Math.max(2, UI.graf.esc * +b.dataset.z)); UI.graf.dibujar?.(); };
ACC.centrar = () => { Object.assign(UI.graf, { cx: 0, cy: 0, esc: 45 }); UI.graf.dibujar?.(); };

function pestanasHerr(act) { return `<div class="pestanas">${[['', 'Graficadora'], ['calculadora', 'Calculadora'], ['metodos', 'Métodos numéricos']].map(([k, t]) => `<a class="pastilla${act === k ? ' on' : ''}" style="display:inline-grid;place-items:center;text-decoration:none;color:inherit" href="#/herramientas${k ? '/' + k : ''}">${t}</a>`).join('')}</div>`; }

/* ---------- Calculadora científica ---------- */
UI.calc = { expr: '', res: '', ans: 0, grados: true, hist: (() => { try { return JSON.parse(localStorage.getItem('cdu_calc') || '[]'); } catch (e) { return []; } })() };
const TECLAS = [['DEG', 'sen(', 'cos(', 'tan(', '(', ')'], ['asen(', 'acos(', 'atan(', '^', 'x²', '⌫'], ['senh(', 'cosh(', 'tanh(', 'x³', '1/x', 'C'], ['raiz(', 'cbrt(', 'ln(', 'log(', 'abs(', '!'], ['7', '8', '9', '/', 'eˣ', '10ˣ'], ['4', '5', '6', '*', 'pi', 'e'], ['1', '2', '3', '-', 'EXP', 'Ans'], ['0', '.', '+', '=']];
const INSERTA = { 'x²': '^2', 'x³': '^3', '1/x': '^(-1)', 'eˣ': 'e^(', '10ˣ': '10^(', 'EXP': '*10^(' };
const ETIQ = { '/': '÷', '*': '×', '-': MENOS, 'pi': 'π', 'raiz(': '√', 'cbrt(': '∛', 'abs(': '|x|', 'sen(': 'sen', 'cos(': 'cos', 'tan(': 'tan', 'asen(': 'sen⁻¹', 'acos(': 'cos⁻¹', 'atan(': 'tan⁻¹', 'senh(': 'senh', 'cosh(': 'cosh', 'tanh(': 'tanh', 'ln(': 'ln', 'log(': 'log', '^': 'xʸ', '!': 'n!', 'EXP': '×10ⁿ' };
function formatoNum(v) { if (!Number.isFinite(v)) return 'No definido'; if (v !== 0 && (Math.abs(v) >= 1e12 || Math.abs(v) < 1e-9)) return v.toExponential(8).replace('-', MENOS); return String(+v.toPrecision(12)).replace('-', MENOS); }
function evaluarCalc(texto) {
  const t = texto.replace(/ans/gi, '(' + UI.calc.ans + ')');
  if (/x/i.test(t.replace(/exp/gi, ''))) throw new Error('Para usar x, ve a la graficadora');
  return compilarFormula(t, { grados: UI.calc.grados })(0);
}
function vistaCalculadora() {
  const C = UI.calc;
  return `<div class="pila">${pestanasHerr('calculadora')}
    <section class="tarjeta" style="background:#1B1530;color:#fff;border:0">
      <div class="entre"><span class="insignia" style="background:rgba(255,255,255,.12);color:#fff">${C.grados ? 'Grados' : 'Radianes'}</span><span class="mini" style="opacity:.7">Ans = ${esc(formatoNum(C.ans))}</span></div>
      <label class="oculto" for="calcEntrada">Operación</label>
      <input id="calcEntrada" value="${esc(C.expr)}" data-entrada="calc" autocomplete="off" spellcheck="false" inputmode="none" style="background:transparent;border:0;color:#fff;font-family:Sora,sans-serif;font-size:24px;text-align:right;padding:12px 0 4px" placeholder="0">
      <div id="calcRes" aria-live="polite" style="text-align:right;font-family:Sora,sans-serif;font-weight:800;font-size:clamp(30px,8vw,44px);color:var(--amarillo);min-height:52px;overflow-x:auto">${esc(C.res)}</div></section>
    <div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px">${TECLAS.flat().map(k => {
      const op = '+-*/^!'.includes(k), igual = k === '=', fn = /\($/.test(k) || ['DEG', 'pi', 'e', 'Ans'].includes(k) || INSERTA[k], borra = k === 'C' || k === '⌫';
      const fondo = igual ? 'var(--g-accion)' : borra ? 'var(--malBg)' : op ? 'var(--g-marca)' : fn ? 'var(--suave)' : 'var(--tarjeta)';
      const color = igual ? '#1B1530' : borra ? 'var(--malTxt)' : op ? '#fff' : fn ? 'var(--moradoTxt)' : 'var(--tinta)';
      const et = k === 'DEG' ? (C.grados ? 'DEG' : 'RAD') : (ETIQ[k] || k);
      return `<button class="tarjeta" style="${igual ? 'grid-column:span 3;' : ''}min-height:50px;padding:0;box-shadow:none;border:1px solid var(--linea);background:${fondo};color:${color};font-family:Sora,sans-serif;font-weight:800;font-size:${/^[0-9.]$/.test(k) ? 20 : 15}px" data-a="tecla_calc" data-k="${esc(k)}" aria-label="${esc(et)}">${esc(et)}</button>`; }).join('')}</div>
    <section class="tarjeta"><div class="entre"><h3>Historial</h3>${C.hist.length ? '<button class="btn3" style="min-height:36px" data-a="borrarHistCalc">Borrar</button>' : ''}</div>
      ${C.hist.map((h, i) => `<button class="entre ancho" style="border:0;background:transparent;border-bottom:1px solid var(--linea);padding:10px 0;text-align:left;color:inherit" data-a="usarHistCalc" data-i="${i}"><span class="peq gris" style="overflow-wrap:anywhere">${esc(h.e)}</span><b style="white-space:nowrap">= ${esc(h.r)}</b></button>`).join('') || '<p class="peq gris" style="margin:6px 0 0">Tus operaciones aparecen aquí. Toca una para reutilizarla.</p>'}</section>
    <p class="mini gris" style="margin:0">También puedes escribir con el teclado: 2^10, 5!, raiz(2), cbrt(27), sen(30), senh(1), ln(e), 3*10^(8), (1+2)(3+4).</p></div>`;
}
function previewCalc() { const out = $('#calcRes'); if (!out) return; try { UI.calc.res = UI.calc.expr.trim() ? formatoNum(evaluarCalc(UI.calc.expr)) : ''; out.style.opacity = .55; } catch (e) { UI.calc.res = ''; } out.textContent = UI.calc.res; }
function igualCalc() {
  const C = UI.calc; if (!C.expr.trim()) return;
  try { const v = evaluarCalc(C.expr); C.res = formatoNum(v); if (Number.isFinite(v)) C.ans = v; C.hist.unshift({ e: C.expr, r: C.res }); C.hist = C.hist.slice(0, 30); try { localStorage.setItem('cdu_calc', JSON.stringify(C.hist)); } catch (e) {} C.expr = ''; }
  catch (e) { C.res = e.message; }
  refrescar(); const out = $('#calcRes'); if (out) out.style.opacity = 1;
}
ENTRADAS.calc = el => { UI.calc.expr = el.value; previewCalc(); };
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'calcEntrada') { e.preventDefault(); igualCalc(); } });
ACC.tecla_calc = b => {
  const C = UI.calc, k = b.dataset.k, inp = $('#calcEntrada');
  if (k === '=') return igualCalc();
  if (k === 'C') { C.expr = ''; C.res = ''; }
  else if (k === 'DEG') { C.grados = !C.grados; refrescar(); return; }
  else if (k === '⌫') C.expr = C.expr.slice(0, -1);
  else { const ins = INSERTA[k] || k; if (!C.expr && /^[+*/^!]/.test(ins)) C.expr = 'Ans'; if (k === 'EXP' && !C.expr) C.expr = '1'; C.expr += ins; }
  if (inp) { inp.value = C.expr; inp.focus(); } previewCalc();
};
ACC.usarHistCalc = b => { UI.calc.expr = UI.calc.hist[+b.dataset.i].e; refrescar(); previewCalc(); };
ACC.borrarHistCalc = () => { UI.calc.hist = []; try { localStorage.removeItem('cdu_calc'); } catch (e) {} refrescar(); };
ACC.verGraf = b => { const k = b.dataset.k; UI.graf.ver[k] = !UI.graf.ver[k]; b.classList.toggle('on', UI.graf.ver[k]); b.setAttribute('aria-pressed', UI.graf.ver[k]); UI.graf.dibujar?.(); };
ACC.irPunto = b => { const p = UI.graf.puntos[+b.dataset.i]; if (!p) return; Object.assign(UI.graf, { cx: p.x, cy: p.y }); UI.graf.dibujar?.(); $('#lienzo').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
