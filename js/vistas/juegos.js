/* El rincón del castor: racha, retos académicos, diarios, mejores de la semana y juegos */
'use strict';
const JUEGOS_EXTERNOS = {
  runner: { nombre: 'Runner', desc: 'Corre, salta y no te caigas', src: 'juegos/runner/index.html?v=202611212204', ico: 'runner', tinte: '#FFF6DA', color: '#8A5A00' },
  spacewar: { nombre: 'Space War', desc: 'Derrota al jefe asteroide', src: 'juegos/spacewar/index.html?v=202611212204', ico: 'nave', tinte: '#DCE8FB', color: '#174EAD' },
  royal: { nombre: 'Ruleta y tragamonedas', desc: 'Juega con tus ramitas', src: 'juegos/royal/index.html?v=202611212204', ico: 'ruleta', tinte: '#F3EFFA', color: '#4B1F7A' }
};
VISTAS.juegos = {
  titulo: 'El rincón del castor', nav: 'juegos',
  render() {
    const u = DB.yo(), d = DB.diarios(), r = u.racha, hoy = fechaLocal();
    const semana = []; const lunes = inicioSemana(); for (let i = 0; i < 7; i++) { const f = new Date(lunes); f.setDate(f.getDate() + i); semana.push(fechaLocal(f)); }
    const diarios = [['trivia', 'Trivia del día', 'pregunta', '#F3EFFA', '#4B1F7A', 15], ['palabra', 'Palabra del día', 'cuadros', '#FFF6DA', '#8A5A00', 10], ['logica', 'Reto de lógica', 'estrella', '#DCE8FB', '#174EAD', 10], ['crucigrama', 'Crucigrama', 'cuadros', '#DCF5E3', '#14632F', 15], ['significa', '¿Qué significa?', 'carta', '#FFE7D6', '#B45309', 10]];
    const mejores = DB.mejoresSemana(), premios = ['+100', '+60', '+30', '+10', '+10'];
    return `<div class="pila">
      <section class="tarjeta"><div class="entre"><h2>Racha de ${r.ultimo === hoy || r.ultimo === sumarDias(hoy, -1) ? r.dias : 0} días</h2><span class="mini gris">A los 7 días: +${REGLAS.premioRacha7}</span></div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:10px">${semana.map((f, i) => { const si = (r.semana || []).includes(f); return `<div style="text-align:center"><span class="dia-racha${si ? ' si' : ''}" style="${f === hoy && !si ? 'border-color:var(--morado)' : ''}">${si ? icono('ok', 16) : ''}</span><span class="mini gris" style="font-weight:${f === hoy ? 800 : 500}">${'LMMJVSD'[i]}</span></div>`; }).join('')}</div></section>
      <section class="tarjeta" style="background:var(--g-marca);color:#fff;border:0">
        <span class="insignia" style="background:var(--g-accion);color:#1B1530">Retos de tu carrera</span>
        <h2 style="margin:10px 0 2px;font-size:22px">${esc(CARRERAS.find(c => c.nombre === u.carrera)?.facultad || 'Ingeniería')}</h2>
        <div class="fila" style="margin-top:12px"><a class="btn" href="#/retos">Jugar retos</a><a class="btn3" style="background:rgba(255,255,255,.14);color:#fff;border:0" href="#/retos/niveles">Niveles</a><a class="btn3" style="background:rgba(255,255,255,.14);color:#fff;border:0" href="#/retos/crear">Crear nivel</a></div></section>
      <div class="seccion"><h2>Diarios</h2><span class="mini gris">Mantienen tu racha</span></div>
      <div class="rejilla3">${diarios.map(([k, t, ic, ti, co, p]) => `<a class="juego-tile" href="#/juego/${k}"><span class="ico" style="background:${ti};color:${co}">${icono(ic, 20)}</span><b style="font-size:14px;line-height:1.2">${t}</b><span class="mini" style="font-weight:700;color:${d[k] ? 'var(--okTxt)' : '#8A5A00'}">${d[k] ? 'Hecho' : '+' + p}</span></a>`).join('')}</div>
      <section class="tarjeta"><div class="entre"><h2>Los mejores de la semana</h2><span class="mini gris">Cierra el domingo</span></div>
        ${mejores.map((m, i) => `<div class="fila" style="flex-wrap:nowrap;padding:8px 6px;border-bottom:1px solid var(--linea);${m.u.id === u.id ? 'background:var(--suave);border-radius:10px' : ''}"><b style="width:24px">${i + 1}</b><span style="flex:1"><b class="peq">@${esc(m.u.usuario)}${m.u.id === u.id ? ' (tú)' : ''}</b><br><span class="mini gris">${esc(m.u.carrera)} · ${m.pts} pts</span></span><span class="insignia i-amarillo">${premios[i]}</span></div>`).join('') || '<p class="vacio">Juega un reto para aparecer aquí.</p>'}</section>
      <div class="seccion"><h2>Para relajarse</h2><span class="mini gris">Sin ramitas, las veces que quieras</span></div>
      <div class="rejilla3">${diarios.map(([k, t, ic, ti, co]) => `<a class="juego-tile" href="#/juego/${k}/libre"><span class="ico" style="background:${ti};color:${co}">${icono(ic, 20)}</span><b style="font-size:14px;line-height:1.2">${t.replace(' del día', '')}</b><span class="mini gris">Libre</span></a>`).join('')}</div>
      <div class="rejilla2"><a class="juego-tile" href="#/juego/baraja"><span class="ico" style="background:#FFF6DA;color:#8A5A00">${icono('carta', 20)}</span><b>La Baraja</b><span class="mini gris">El oráculo del chisme</span></a>
        ${Object.entries(JUEGOS_EXTERNOS).map(([k, j]) => `<a class="juego-tile" href="#/juego/${k}"><span class="ico" style="background:${j.tinte};color:${j.color}">${icono(j.ico, 20)}</span><b>${j.nombre}</b><span class="mini gris">${j.desc}</span></a>`).join('')}</div>
      <section class="tarjeta fila" style="flex-wrap:nowrap;background:var(--avisoBg);border:1px dashed #E2C46A">${icono('regalo', 30, 'style="color:#8A5A00;flex:none"')}<span><b>Tienda del castor</b><br><span class="peq" style="color:var(--avisoTxt)">Muy pronto: cambia ramitas por cupones de negocios cerca del campus.</span></span></section>
    </div>`;
  }
};

/* ---------- Juegos individuales ---------- */
UI.trivia = null; UI.palabra = null; UI.logica = null; UI.baraja = { hist: [] };
VISTAS.juego = {
  titulo: ([k, m]) => m === 'libre' ? ({ trivia: 'Trivia', palabra: 'Palabra', logica: 'Lógica', crucigrama: 'Crucigrama', significa: '¿Qué significa?' }[k] || 'Juego') + ' · libre' : ({ trivia: 'Trivia del día', palabra: 'Palabra del día', logica: 'Reto de lógica', crucigrama: 'Crucigrama del día', significa: '¿Qué significa?', baraja: 'La Baraja' }[k] || JUEGOS_EXTERNOS[k]?.nombre || 'Juego'), nav: 'juegos', atras: '#/juegos',
  montar() { cargarDefiniciones(); },
  render([k]) {
    const d = modoLibre() ? {} : DB.diarios();
    if (k === 'trivia') {
      if (!UI.trivia || UI.trivia.clave !== claveJuego()) { const r = azar(semillaPersonal('trivia')), ids = TRIVIA_TODA().map((_, i) => i).sort(() => r() - 0.5); UI.trivia = { clave: claveJuego(), qs: ids.slice(0, 5), i: 0, ok: 0, eleg: null }; }
      const t = UI.trivia;
      if (d.trivia && t.i < 5 && t.eleg === null && t.i === 0) return `<div class="tarjeta" style="text-align:center"><h2>Ya jugaste la trivia de hoy</h2><p class="gris">Vuelve mañana por 5 preguntas nuevas.</p><a class="btn" href="#/retos">Prueba un reto</a></div>`;
      if (t.i >= 5) return `<div class="tarjeta" style="text-align:center"><b style="font-family:Sora,sans-serif;font-size:56px;color:var(--moradoTxt)">${t.ok}/5</b><h2>${t.ok >= 4 ? '¡Muy bien!' + txtPremio(15) : modoLibre() ? 'Casi' : 'Casi. Mañana hay otra'}</h2>${botonFinal()}</div>`;
      const q = TRIVIA_TODA()[t.qs[t.i]];
      return `<div class="problema"><div class="entre peq" style="font-weight:700"><span>Pregunta ${t.i + 1} de 5</span><span>${t.ok} aciertos</span></div>
        <div class="progreso">${[0, 1, 2, 3, 4].map(i => `<span class="${i < t.i ? 'b' : i === t.i ? 'a' : ''}"></span>`).join('')}</div>
        <h2 style="margin:16px 0 4px;font-size:21px;color:#fff">${esc(q.p)}</h2>
        <div class="opciones">${q.o.map((o, i) => `<button class="opcion${t.eleg !== null ? (i === q.c ? ' ok' : i === t.eleg ? ' mal' : '') : ''}" data-a="triviaResp" data-i="${i}"><span class="l">${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div>
        ${t.eleg !== null ? `<button class="btn" style="margin-top:14px" data-a="triviaSig">${t.i === 4 ? 'Ver resultado' : 'Siguiente'}</button>` : ''}</div>`;
    }
    if (k === 'palabra') {
      const PP = palabraPersonal(), sol = PP.sol, N = PP.largo;
      if (!UI.palabra || UI.palabra.clave !== claveJuego()) UI.palabra = { clave: claveJuego(), intentos: [], actual: '', fin: d.palabra ? 'hecho' : null };
      const P = UI.palabra, colores = w => { const r = Array(N).fill('g'), s = [...sol]; w.split('').forEach((c, i) => { if (c === sol[i]) { r[i] = 'v'; s[i] = null; } }); w.split('').forEach((c, i) => { if (r[i] !== 'v') { const j = s.indexOf(c); if (j >= 0) { r[i] = 'a'; s[j] = null; } } }); return r; };
      const est = {}; P.intentos.forEach(w => colores(w).forEach((c, i) => { const l = w[i]; if (c === 'v' || (c === 'a' && est[l] !== 'v') || !est[l]) est[l] = c; }));
      const filas = []; for (let i = 0; i < 6; i++) { const w = P.intentos[i] || (i === P.intentos.length ? P.actual.padEnd(N) : ' '.repeat(N)); const c = P.intentos[i] ? colores(w) : []; filas.push(`<div class="r" style="grid-template-columns:repeat(${N},1fr)">${[...w].map((ch, j) => `<div class="c ${c[j] || ''}">${esc(ch.trim())}</div>`).join('')}</div>`); }
      const tec = ['QWERTYUIOP', 'ASDFGHJKLÑ', '<ZXCVBNM>'];
      return `<div class="pila"><p class="gris peq" style="text-align:center;margin:0">Adivina la palabra de ${N} letras en 6 intentos. Hoy cada quien tiene la suya. Verde: letra en su lugar. Amarillo: está, pero en otro lugar.</p>
        <div class="wordle" aria-live="polite">${filas.join('')}</div>
        ${P.fin ? `<div class="tarjeta" style="text-align:center"><h2>${P.fin === 'gano' ? '¡La sacaste!' + txtPremio(10) : P.fin === 'hecho' ? 'Ya jugaste la palabra de hoy' : 'Era ' + sol}</h2>${P.fin !== 'hecho' || P.intentos.length ? cajaDefinicion(PP.palabra) : ''}${botonFinal()}</div>`
          : `<div class="teclado">${tec.map(r => `<div class="r">${r.split('').map(ch => ch === '<' ? '<button class="ancha" data-a="tecla" data-k="borrar" aria-label="Borrar">Borrar</button>' : ch === '>' ? '<button class="ancha" data-a="tecla" data-k="enviar">Enviar</button>' : `<button class="${est[ch] || ''}" data-a="tecla" data-k="${ch}">${ch}</button>`).join('')}</div>`).join('')}</div>`}</div>`;
    }
    if (k === 'crucigrama') return vistaCrucigrama(d);
    if (k === 'significa') return vistaSignifica(d);
    if (k === 'logica') {
      const q = LOGICA[semillaPersonal('logica') % LOGICA.length];
      if (!UI.logica || UI.logica.clave !== claveJuego()) { const ops = [...new Set([q.r, q.r + 1, q.r - 2, q.r + 3, q.r * 2])].slice(0, 4); const giro = Math.abs(q.r) % ops.length; ops.push(...ops.splice(0, giro)); UI.logica = { clave: claveJuego(), ops, eleg: d.logica ? q.r : null }; }
      const L = UI.logica;
      return `<div class="problema"><span class="etiqueta">Completa la secuencia</span><div class="expr" style="margin-top:12px">${esc(q.p).replace(/-/g, MENOS)}</div>
        <div class="opciones">${L.ops.map((o, i) => `<button class="opcion${L.eleg !== null ? (o === q.r ? ' ok' : o === L.eleg ? ' mal' : '') : ''}" data-a="logicaResp" data-v="${o}"><span class="l">${'ABCD'[i]}</span>${String(o).replace('-', MENOS)}</button>`).join('')}</div>
        ${L.eleg !== null ? `<div class="explica"><b>${L.eleg === q.r ? '¡Correcto!' : 'Era ' + q.r}</b>${esc(q.pista)}</div><a class="btn" style="margin-top:12px" href="#/juegos">Volver</a>` : ''}</div>`;
    }
    if (k === 'baraja') return vistaBaraja();
    const j = JUEGOS_EXTERNOS[k]; if (!j) return '<p class="vacio">Ese juego no existe.</p>';
    return `<div class="pila"><iframe class="marco-juego" src="${j.src}" title="${esc(j.nombre)}" allow="autoplay; fullscreen"></iframe>
      <div class="entre"><span class="mini gris">${k === 'royal' ? '1 ramita = 100 créditos. Cambia y cobra en el botón + del juego; lo que no cobres se queda guardado.' : 'Toca dentro del juego para activar el teclado y el sonido.'}</span><button class="btn3" data-a="pantallaCompleta">Pantalla completa</button></div></div>`;
  }
};
ACC.triviaResp = b => { const t = UI.trivia; if (t.eleg !== null) return; t.eleg = +b.dataset.i; if (t.eleg === TRIVIA_TODA()[t.qs[t.i]].c) t.ok++; refrescar(); };
ACC.triviaSig = () => { const t = UI.trivia; t.i++; t.eleg = null; if (t.i >= 5) { premiarDiario('trivia', t.ok >= 4 ? 15 : 0); } refrescar(); };
ACC.tecla = b => {
  const P = UI.palabra, k = b.dataset.k, PP = palabraPersonal(), sol = PP.sol, N = PP.largo; if (P.fin) return;
  if (k === 'borrar') P.actual = P.actual.slice(0, -1);
  else if (k === 'enviar') { if ([...P.actual].length < N) return aviso('Faltan letras'); P.intentos.push(P.actual); P.actual = ''; if (P.intentos.at(-1) === sol) { P.fin = 'gano'; premiarDiario('palabra', 10); } else if (P.intentos.length >= 6) { P.fin = 'perdio'; premiarDiario('palabra', 0); } }
  else if ([...P.actual].length < N) P.actual += k;
  refrescar();
};
document.addEventListener('keydown', e => { if (ruta().nombre !== 'juego' || ruta().params[0] !== 'palabra' || e.target.matches('input,textarea')) return; const k = e.key.toUpperCase(); if (k === 'BACKSPACE') ACC.tecla({ dataset: { k: 'borrar' } }); else if (k === 'ENTER') ACC.tecla({ dataset: { k: 'enviar' } }); else if (/^[A-ZÑ]$/.test(k)) ACC.tecla({ dataset: { k } }); });
ACC.logicaResp = b => { const L = UI.logica; if (L.eleg !== null) return; L.eleg = +b.dataset.v; const q = LOGICA[semillaPersonal('logica') % LOGICA.length]; premiarDiario('logica', L.eleg === q.r ? 10 : 0); refrescar(); };

/* ---------- La Baraja (oráculo del chisme) ---------- */
const PALOS = [['♥', 'roja'], ['♦', 'roja'], ['♣', ''], ['♠', '']], VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RESP = { SÍ: ['Sí, no te hagas.', 'Sí, las cartas ya te quemaron.', 'Sí, pero actúa normal.', 'Sí, la baraja habló claro.'], NO: ['No, ahí no es.', 'No, ni le muevas.', 'No, la baraja dijo que nel.', 'No, y sin llorar.'], 'TAL VEZ': ['Tal vez… aquí falta chisme.', 'Tal vez, pregunta más específico.', 'Tal vez, la novela apenas empieza.', 'Tal vez… esto se va a poner bueno.'] };
const PREG_RANDOM = ['¿Mi crush me va a hablar pronto?', '¿Voy a pasar el examen?', '¿Alguien está hablando de mí?', '¿Hoy va a pasar algo interesante?', '¿Me van a contestar el mensaje?', '¿Esta semana se arma el chisme?', '¿Me conviene decir la verdad?'];
function vistaBaraja() {
  const B = UI.baraja, carta = c => `<div class="carta ${c.color}"><span>${c.v}<br>${c.p}</span><span class="c">${c.p}</span><span style="transform:rotate(180deg)">${c.v}<br>${c.p}</span></div>`;
  return `<div class="pila"><form data-form="baraja" class="pila" style="gap:8px"><label class="campo" for="bq">Pregunta algo y baraja</label><textarea id="bq" name="q" required maxlength="160" placeholder="Ejemplo: ¿Voy a pasar el parcial?">${esc(B.q || '')}</textarea>
      <div class="rejilla2"><button class="btn">Barajar</button><button type="button" class="btn3" data-a="barajaRandom">Pregunta random</button></div></form>
    <div class="mesa">${B.cartas ? B.cartas.map(carta).join('') : '<div class="reverso"></div><div class="reverso"></div>'}</div>
    <div class="tarjeta" style="text-align:center"><b style="font-family:Sora,sans-serif;font-size:34px;color:${B.res === 'SÍ' ? 'var(--okTxt)' : B.res === 'NO' ? 'var(--malTxt)' : '#B45309'}">${B.res || '—'}</b><p class="gris" style="margin:4px 0 0">${esc(B.msg || 'Escribe tu pregunta y baraja.')}</p></div>
    ${B.hist.length ? `<div class="tarjeta"><h3>Historial</h3>${B.hist.map(h => `<p class="peq" style="margin:8px 0 0"><b>${h.res}</b> — ${esc(h.q)}</p>`).join('')}</div>` : ''}</div>`;
}
FORMS.baraja = d => {
  const mazo = []; PALOS.forEach(([p, c]) => VALORES.forEach((v, i) => mazo.push({ p, color: c, v, n: i + 1 })));
  const a = mazo.splice(Math.floor(Math.random() * mazo.length), 1)[0], b = mazo[Math.floor(Math.random() * mazo.length)];
  const res = a.n % 2 === 0 && b.n % 2 === 0 ? 'SÍ' : a.n % 2 && b.n % 2 ? 'NO' : 'TAL VEZ';
  Object.assign(UI.baraja, { q: d.q, cartas: [a, b], res, msg: RESP[res][Math.floor(Math.random() * 4)] }); UI.baraja.hist.unshift({ q: d.q, res }); UI.baraja.hist = UI.baraja.hist.slice(0, 8); refrescar();
};
ACC.barajaRandom = () => { UI.baraja.q = PREG_RANDOM[Math.floor(Math.random() * PREG_RANDOM.length)]; refrescar(); };

ACC.pantallaCompleta = () => { const f = $('.marco-juego'); (f.requestFullscreen || f.webkitRequestFullscreen)?.call(f)?.catch?.(() => aviso('Tu navegador no permite pantalla completa aquí')); };

const TRIVIA_TODA = () => TRIVIA.concat(TRIVIA_GENERAL);
const FUENTE_DEF = '<p class="mini gris" style="margin:6px 0 0">Definiciones: <a href="https://es.wiktionary.org" target="_blank" rel="noopener noreferrer">Wikcionario</a> (CC BY-SA)</p>';
function cajaDefinicion(palabra) { return `<div class="def-caja" data-def="${esc(palabra)}" style="text-align:left;margin-top:12px;background:var(--suave);border-radius:14px;padding:12px"><b style="text-transform:capitalize">${esc(palabra)}</b><p class="peq gris" style="margin:4px 0 0">Buscando su significado…</p></div>`; }
async function cargarDefiniciones() {
  const cajas = $$('[data-def]:not([data-listo])'); if (!cajas.length) return;
  cajas.forEach(c => c.dataset.listo = '1');
  const r = await DEFINICIONES.de(cajas.map(c => c.dataset.def));
  cajas.forEach(c => { const p = c.dataset.def, d = r[p]; c.querySelector('p').outerHTML = d && d.length ? `<ol class="peq" style="margin:6px 0 0;padding-left:18px">${d.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${FUENTE_DEF}` : `<p class="peq gris" style="margin:4px 0 0">${d ? 'No encontramos su significado.' : 'Sin conexión para buscar su significado.'} <a href="${DEFINICIONES.enlace(p)}" target="_blank" rel="noopener noreferrer">Buscar en Wikcionario</a></p>`; });
}

/* ---------- Crucigrama del día (cada quien el suyo) ---------- */
function vistaCrucigrama(d) {
  if (!UI.cruci || UI.cruci.clave !== claveJuego()) UI.cruci = { clave: claveJuego(), data: armarCrucigrama(semillaPersonal('cruci')), resp: {}, defs: null, dir: true, mal: {}, fin: !!d.crucigrama };
  const C = UI.cruci, X = C.data;
  if (!C.defs && !C.pidiendo) { C.pidiendo = true; DEFINICIONES.de(X.palabras.map(p => p.palabra)).then(r => { C.defs = r; C.pidiendo = false; if (ruta().params[0] === 'crucigrama') refrescar(); }); }
  const pista = p => { const dd = C.defs?.[p.palabra]; return dd && dd.length ? esc(dd[0]) : C.defs ? `Empieza con “${p.sol[0]}” (${[...p.sol].length} letras)` : 'Cargando pista…'; };
  const celdas = []; for (let f = 0; f < X.N; f++) for (let c = 0; c < X.N; c++) { const v = X.grid[f][c], k = f + ',' + c;
    celdas.push(v ? `<span class="cc${C.mal[k] ? ' mal' : ''}">${X.inicio[k] ? `<i>${X.inicio[k]}</i>` : ''}<input aria-label="Casilla ${f + 1},${c + 1}" maxlength="1" autocomplete="off" autocapitalize="characters" data-entrada="cruci" data-k="${k}" value="${esc(C.fin && !C.resp[k] ? v : C.resp[k] || '')}" ${C.fin ? 'readonly' : ''}></span>` : '<span class="cn"></span>'); }
  const lista = h => X.palabras.filter(p => p.h === h).sort((a, b) => a.n - b.n).map(p => `<li value="${p.n}" class="peq" style="margin-bottom:6px">${pista(p)}</li>`).join('');
  return `<div class="pila"><p class="gris peq" style="text-align:center;margin:0">Hoy cada quien tiene su propio crucigrama. Sin acentos.</p>
    <div class="crucigrama" style="grid-template-columns:repeat(${X.N},1fr)">${celdas.join('')}</div>
    ${C.fin ? `<div class="tarjeta" style="text-align:center"><h2>${d.crucigrama && !C.gano ? 'Ya hiciste el crucigrama de hoy' : '¡Completo!' + txtPremio(15)}</h2>${botonFinal()}</div>` : `<div class="rejilla2"><button class="btn" data-a="revisarCruci">Revisar</button><button class="btn3" data-a="dirCruci">Escribir ${C.dir ? 'hacia abajo' : 'hacia la derecha'}</button></div>`}
    <section class="tarjeta"><h3 style="margin:0 0 6px">Horizontales</h3><ol style="margin:0;padding-left:22px">${lista(true)}</ol><h3 style="margin:12px 0 6px">Verticales</h3><ol style="margin:0;padding-left:22px">${lista(false)}</ol>${C.defs ? FUENTE_DEF : ''}</section></div>`;
}
ENTRADAS.cruci = el => {
  const C = UI.cruci, v = sinAcentos(el.value.slice(-1)).replace(/[^A-ZÑ]/g, ''); el.value = v; C.resp[el.dataset.k] = v; delete C.mal[el.dataset.k]; el.parentElement.classList.remove('mal');
  if (v) { const [f, c] = el.dataset.k.split(',').map(Number), sig = $(`[data-k="${C.dir ? f + ',' + (c + 1) : (f + 1) + ',' + c}"]`) || $(`[data-k="${C.dir ? (f + 1) + ',' + c : f + ',' + (c + 1)}"]`); sig?.focus(); sig?.select?.(); }
};
ACC.dirCruci = () => { UI.cruci.dir = !UI.cruci.dir; refrescar(); };
ACC.revisarCruci = () => {
  const C = UI.cruci, X = C.data; let ok = true, vacias = 0; C.mal = {};
  for (let f = 0; f < X.N; f++) for (let c = 0; c < X.N; c++) { const v = X.grid[f][c]; if (!v) continue; const k = f + ',' + c, r = C.resp[k]; if (!r) { vacias++; ok = false; } else if (r !== v) { C.mal[k] = true; ok = false; } }
  if (ok) { C.fin = true; C.gano = true; premiarDiario('crucigrama', 15); aviso('¡Crucigrama completo!' + txtPremio(15)); }
  else aviso(Object.keys(C.mal).length ? `${Object.keys(C.mal).length} letra${Object.keys(C.mal).length > 1 ? 's' : ''} no van (en rojo)` : `Te faltan ${vacias} casillas`);
  refrescar();
};

/* ---------- ¿Qué significa? (cada quien el suyo) ---------- */
function vistaSignifica(d) {
  if (!UI.signi || UI.signi.clave !== claveJuego()) {
    const r = azar(semillaPersonal('significa')), ws = PALABRAS_ES.filter(w => w.length >= 4).sort(() => r() - 0.5).slice(0, 10);
    UI.signi = { clave: claveJuego(), ws, defs: null, eleg: null, fin: !!d.significa };
  }
  const S = UI.signi;
  if (!S.defs && !S.pidiendo) { S.pidiendo = true; DEFINICIONES.de(S.ws).then(r => { S.defs = r; S.pidiendo = false; if (ruta().params[0] === 'significa') refrescar(); }); }
  if (!S.defs) return `<div class="tarjeta" style="text-align:center"><p class="gris">Buscando palabras…</p></div>`;
  const con = S.ws.filter(w => S.defs[w]?.length); if (con.length < 4) return `<div class="tarjeta" style="text-align:center"><h2>Necesitas internet</h2><p class="gris">Este juego busca los significados en Wikcionario.</p><a class="btn" href="#/juegos">Volver</a></div>`;
  const w = con[0], ops = con.slice(0, 4).map(x => S.defs[x][0]), orden = [0, 1, 2, 3].sort((a, b) => (semillaPersonal('s' + a) % 97) - (semillaPersonal('s' + b) % 97));
  if (S.fin && S.eleg === null) return `<div class="tarjeta" style="text-align:center"><h2>Ya jugaste hoy</h2>${cajaDefinicion(w)}${botonFinal()}</div>`;
  return `<div class="pila"><div class="tarjeta" style="text-align:center"><span class="etiqueta gris">¿Qué significa?</span><h1 style="font-size:34px;margin:6px 0 0;text-transform:capitalize">${esc(w)}</h1></div>
    <div class="pila" style="gap:8px">${orden.map(i => { const bien = i === 0, elegido = S.eleg === i; return `<button class="opcion clara${S.eleg !== null ? (bien ? ' ok' : elegido ? ' mal' : '') : ''}" style="text-align:left" data-a="signiResp" data-i="${i}" ${S.eleg !== null ? 'disabled' : ''}>${esc(ops[i])}</button>`; }).join('')}</div>
    ${S.eleg !== null ? `<div class="tarjeta" style="text-align:center"><h2>${S.eleg === 0 ? '¡Correcto!' + txtPremio(10) : 'Era la otra'}</h2>${FUENTE_DEF}${botonFinal()}</div>` : ''}</div>`;
}
ACC.signiResp = b => { const S = UI.signi; if (S.eleg !== null) return; S.eleg = +b.dataset.i; premiarDiario('significa', S.eleg === 0 ? 10 : 0); refrescar(); };

/* ---------- modo libre (para relajarse): mismos juegos, sin ramitas, uno tras otro ---------- */
UI.libreN = 0;
function modoLibre() { const r = ruta(); return r.nombre === 'juego' && r.params[1] === 'libre'; }
function claveJuego() { return fechaLocal() + '|' + (DB.yo()?.id || '') + '|' + (modoLibre() ? 'L' + UI.libreN : 'D'); }
function txtPremio(n) { return modoLibre() ? '' : ` +${n} ramitas`; }
function premiarDiario(cual, premio) { if (modoLibre()) return 0; return DB.completarDiario(cual, premio); }
function botonFinal() { return modoLibre() ? `<div class="fila" style="justify-content:center;margin-top:12px"><button class="btn" data-a="otraLibre">Otra</button><a class="btn3" href="#/juegos">Volver</a></div>` : '<a class="btn" style="margin-top:12px" href="#/juegos">Volver</a>'; }
ACC.otraLibre = () => { UI.libreN++; ['trivia', 'palabra', 'logica', 'cruci', 'signi'].forEach(k => UI[k] = null); refrescar(); scrollTo(0, 0); };
