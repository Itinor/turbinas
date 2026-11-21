/* El rincón del castor: racha, retos académicos, diarios, mejores de la semana y juegos */
'use strict';
const JUEGOS_EXTERNOS = {
  runner: { nombre: 'Runner', desc: 'Corre, salta y no te caigas', src: 'juegos/runner/index.html?v=202611211715', ico: 'runner', tinte: '#FFF6DA', color: '#8A5A00' },
  spacewar: { nombre: 'Space War', desc: 'Derrota al jefe asteroide', src: 'juegos/spacewar/index.html?v=202611211715', ico: 'nave', tinte: '#DCE8FB', color: '#174EAD' },
  royal: { nombre: 'Ruleta y tragamonedas', desc: 'Juega con tus ramitas', src: 'juegos/royal/index.html?v=202611211715', ico: 'ruleta', tinte: '#F3EFFA', color: '#4B1F7A' }
};
VISTAS.juegos = {
  titulo: 'El rincón del castor', nav: 'juegos',
  render() {
    const u = DB.yo(), d = DB.diarios(), r = u.racha, hoy = fechaLocal();
    const semana = []; const lunes = inicioSemana(); for (let i = 0; i < 7; i++) { const f = new Date(lunes); f.setDate(f.getDate() + i); semana.push(fechaLocal(f)); }
    const diarios = [['trivia', 'Trivia del día', 'pregunta', '#F3EFFA', '#4B1F7A', 15], ['palabra', 'Palabra del día', 'cuadros', '#FFF6DA', '#8A5A00', 10], ['logica', 'Reto de lógica', 'estrella', '#DCE8FB', '#174EAD', 10]];
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
      <div class="seccion"><h2>Para relajarse</h2></div>
      <div class="rejilla2"><a class="juego-tile" href="#/juego/baraja"><span class="ico" style="background:#FFF6DA;color:#8A5A00">${icono('carta', 20)}</span><b>La Baraja</b><span class="mini gris">El oráculo del chisme</span></a>
        ${Object.entries(JUEGOS_EXTERNOS).map(([k, j]) => `<a class="juego-tile" href="#/juego/${k}"><span class="ico" style="background:${j.tinte};color:${j.color}">${icono(j.ico, 20)}</span><b>${j.nombre}</b><span class="mini gris">${j.desc}</span></a>`).join('')}</div>
      <section class="tarjeta fila" style="flex-wrap:nowrap;background:var(--avisoBg);border:1px dashed #E2C46A">${icono('regalo', 30, 'style="color:#8A5A00;flex:none"')}<span><b>Tienda del castor</b><br><span class="peq" style="color:var(--avisoTxt)">Muy pronto: cambia ramitas por cupones de negocios cerca del campus.</span></span></section>
    </div>`;
  }
};

/* ---------- Juegos individuales ---------- */
UI.trivia = null; UI.palabra = null; UI.logica = null; UI.baraja = { hist: [] };
VISTAS.juego = {
  titulo: ([k]) => ({ trivia: 'Trivia del día', palabra: 'Palabra del día', logica: 'Reto de lógica', baraja: 'La Baraja' }[k] || JUEGOS_EXTERNOS[k]?.nombre || 'Juego'), nav: 'juegos', atras: '#/juegos',
  render([k]) {
    const d = DB.diarios();
    if (k === 'trivia') {
      if (!UI.trivia || UI.trivia.fecha !== fechaLocal()) { const base = indiceDelDia(TRIVIA.length); UI.trivia = { fecha: fechaLocal(), qs: [0, 1, 2, 3, 4].map(i => (base + i * 7) % TRIVIA.length), i: 0, ok: 0, eleg: null }; }
      const t = UI.trivia;
      if (d.trivia && t.i < 5 && t.eleg === null && t.i === 0) return `<div class="tarjeta" style="text-align:center"><h2>Ya jugaste la trivia de hoy</h2><p class="gris">Vuelve mañana por 5 preguntas nuevas.</p><a class="btn" href="#/retos">Prueba un reto</a></div>`;
      if (t.i >= 5) return `<div class="tarjeta" style="text-align:center"><b style="font-family:Sora,sans-serif;font-size:56px;color:var(--moradoTxt)">${t.ok}/5</b><h2>${t.ok >= 4 ? '¡Muy bien! +15 ramitas' : 'Casi. Mañana hay otra'}</h2><a class="btn" style="margin-top:14px" href="#/juegos">Volver</a></div>`;
      const q = TRIVIA[t.qs[t.i]];
      return `<div class="problema"><div class="entre peq" style="font-weight:700"><span>Pregunta ${t.i + 1} de 5</span><span>${t.ok} aciertos</span></div>
        <div class="progreso">${[0, 1, 2, 3, 4].map(i => `<span class="${i < t.i ? 'b' : i === t.i ? 'a' : ''}"></span>`).join('')}</div>
        <h2 style="margin:16px 0 4px;font-size:21px;color:#fff">${esc(q.p)}</h2>
        <div class="opciones">${q.o.map((o, i) => `<button class="opcion${t.eleg !== null ? (i === q.c ? ' ok' : i === t.eleg ? ' mal' : '') : ''}" data-a="triviaResp" data-i="${i}"><span class="l">${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div>
        ${t.eleg !== null ? `<button class="btn" style="margin-top:14px" data-a="triviaSig">${t.i === 4 ? 'Ver resultado' : 'Siguiente'}</button>` : ''}</div>`;
    }
    if (k === 'palabra') {
      const sol = PALABRAS[indiceDelDia(PALABRAS.length, 3)];
      if (!UI.palabra || UI.palabra.fecha !== fechaLocal()) UI.palabra = { fecha: fechaLocal(), intentos: [], actual: '', fin: d.palabra ? 'hecho' : null };
      const P = UI.palabra, colores = w => { const r = Array(5).fill('g'), s = sol.split(''); w.split('').forEach((c, i) => { if (c === sol[i]) { r[i] = 'v'; s[i] = null; } }); w.split('').forEach((c, i) => { if (r[i] !== 'v') { const j = s.indexOf(c); if (j >= 0) { r[i] = 'a'; s[j] = null; } } }); return r; };
      const est = {}; P.intentos.forEach(w => colores(w).forEach((c, i) => { const l = w[i]; if (c === 'v' || (c === 'a' && est[l] !== 'v') || !est[l]) est[l] = c; }));
      const filas = []; for (let i = 0; i < 6; i++) { const w = P.intentos[i] || (i === P.intentos.length ? P.actual.padEnd(5) : '     '); const c = P.intentos[i] ? colores(w) : []; filas.push(`<div class="r">${w.split('').map((ch, j) => `<div class="c ${c[j] || ''}">${esc(ch.trim())}</div>`).join('')}</div>`); }
      const tec = ['QWERTYUIOP', 'ASDFGHJKLÑ', '<ZXCVBNM>'];
      return `<div class="pila"><p class="gris peq" style="text-align:center;margin:0">Adivina la palabra de 5 letras en 6 intentos. Verde: letra en su lugar. Amarillo: está, pero en otro lugar.</p>
        <div class="wordle" aria-live="polite">${filas.join('')}</div>
        ${P.fin ? `<div class="tarjeta" style="text-align:center"><h2>${P.fin === 'gano' ? '¡La sacaste! +10 ramitas' : P.fin === 'hecho' ? 'Ya jugaste la palabra de hoy' : 'Era ' + sol}</h2><a class="btn" style="margin-top:10px" href="#/juegos">Volver</a></div>`
          : `<div class="teclado">${tec.map(r => `<div class="r">${r.split('').map(ch => ch === '<' ? '<button class="ancha" data-a="tecla" data-k="borrar" aria-label="Borrar">Borrar</button>' : ch === '>' ? '<button class="ancha" data-a="tecla" data-k="enviar">Enviar</button>' : `<button class="${est[ch] || ''}" data-a="tecla" data-k="${ch}">${ch}</button>`).join('')}</div>`).join('')}</div>`}</div>`;
    }
    if (k === 'logica') {
      const q = LOGICA[indiceDelDia(LOGICA.length, 7)];
      if (!UI.logica || UI.logica.fecha !== fechaLocal()) { const ops = [...new Set([q.r, q.r + 1, q.r - 2, q.r + 3, q.r * 2])].slice(0, 4); const giro = Math.abs(q.r) % ops.length; ops.push(...ops.splice(0, giro)); UI.logica = { fecha: fechaLocal(), ops, eleg: d.logica ? q.r : null }; }
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
ACC.triviaResp = b => { const t = UI.trivia; if (t.eleg !== null) return; t.eleg = +b.dataset.i; if (t.eleg === TRIVIA[t.qs[t.i]].c) t.ok++; refrescar(); };
ACC.triviaSig = () => { const t = UI.trivia; t.i++; t.eleg = null; if (t.i >= 5) { DB.completarDiario('trivia', t.ok >= 4 ? 15 : 0); } refrescar(); };
ACC.tecla = b => {
  const P = UI.palabra, k = b.dataset.k, sol = PALABRAS[indiceDelDia(PALABRAS.length, 3)]; if (P.fin) return;
  if (k === 'borrar') P.actual = P.actual.slice(0, -1);
  else if (k === 'enviar') { if (P.actual.length < 5) return aviso('Faltan letras'); P.intentos.push(P.actual); P.actual = ''; if (P.intentos.at(-1) === sol) { P.fin = 'gano'; DB.completarDiario('palabra', 10); } else if (P.intentos.length >= 6) { P.fin = 'perdio'; DB.completarDiario('palabra', 0); } }
  else if (P.actual.length < 5) P.actual += k;
  refrescar();
};
document.addEventListener('keydown', e => { if (ruta().nombre !== 'juego' || ruta().params[0] !== 'palabra' || e.target.matches('input,textarea')) return; const k = e.key.toUpperCase(); if (k === 'BACKSPACE') ACC.tecla({ dataset: { k: 'borrar' } }); else if (k === 'ENTER') ACC.tecla({ dataset: { k: 'enviar' } }); else if (/^[A-ZÑ]$/.test(k)) ACC.tecla({ dataset: { k } }); });
ACC.logicaResp = b => { const L = UI.logica; if (L.eleg !== null) return; L.eleg = +b.dataset.v; const q = LOGICA[indiceDelDia(LOGICA.length, 7)]; DB.completarDiario('logica', L.eleg === q.r ? 10 : 0); refrescar(); };

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
