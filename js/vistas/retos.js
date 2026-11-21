/* Retos académicos: ejercicios generados por plantillas, niveles oficiales y de la comunidad */
'use strict';
UI.reto = { dif: 'Aleatorio', p: null, eleg: null, juego: null, crear: { nombre: '', ids: [] }, seg: REGLAS.segundosPorPregunta };
const COLOR_DIF = { 'Muy fácil': 'i-verde', 'Fácil': 'i-azul', 'Difícil': 'i-naranja', 'Muy difícil': 'i-rojo' };
const insigniaDif = n => `<span class="insignia ${COLOR_DIF[n]}">${n}</span>`;
const nivelMax = ids => NIVELES[Math.max(...ids.map(id => NIVELES.indexOf(T.find(t => t.id === id).nivel)))];
const hashTexto = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

VISTAS.retos = {
  titulo: 'Retos de Cálculo', nav: 'juegos', atras: '#/juegos',
  render(params) {
    const sub = params[0] || 'jugar', R = UI.reto;
    const tabs = `<div class="pestanas">${[['jugar', 'Jugar'], ['niveles', 'Niveles'], ['crear', 'Crear nivel']].map(([k, t]) => `<a class="pastilla${sub === k || (sub === 'nivel' && k === 'niveles') ? ' on' : ''}" style="display:inline-grid;place-items:center;text-decoration:none;color:inherit" href="#/retos/${k}">${t}</a>`).join('')}</div>`;
    if (sub === 'niveles') {
      const nv = DB.estado.niveles, tarjeta = n => `<article class="tarjeta pila" style="gap:8px;${n.oficial ? 'border:2px solid var(--amarillo)' : ''}"><div class="entre">${insigniaDif(nivelMax(n.ids))}<span class="fila">${n.nuevo ? '<span class="insignia i-azul">Nuevo</span>' : ''}${botonEliminar('nivel', n.id)}</span></div><h3 style="font-size:17px">${esc(n.nombre)}</h3><span class="mini gris">por ${esc(n.oficial ? 'el equipo' : nombreVisible(n.autor))} · 5 preguntas</span><div class="entre" style="margin-top:4px"><span class="mini gris">${n.likes} me gusta · ${n.jugadas} jugadas</span><a class="btn" style="min-height:42px" href="#/retos/nivel/${n.id}">Jugar</a></div></article>`;
      return `<div class="pila">${tabs}<div class="seccion"><h2>Oficiales</h2><span class="mini gris">Los pone el equipo</span></div><div class="auto">${nv.filter(n => n.oficial).map(tarjeta).join('')}</div>
        <div class="seccion"><h2>De la comunidad</h2><span class="mini gris">Los más gustados primero</span></div><div class="auto">${nv.filter(n => !n.oficial).sort((a, b) => b.likes - a.likes).map(tarjeta).join('')}</div></div>`;
    }
    if (sub === 'crear') {
      const c = R.crear, lleno = c.ids.length >= 5, listo = c.ids.length === 5 && c.nombre.trim();
      return `<div class="pila">${tabs}<div class="tarjeta pila"><div><label class="campo" for="nn">Nombre de tu nivel</label><input id="nn" value="${esc(c.nombre)}" maxlength="60" placeholder="Ej. Repaso para el segundo parcial" data-entrada="nombreNivel"></div>
        <div class="entre"><h3>Tus preguntas (${c.ids.length}/5)</h3><span class="mini gris">${c.ids.length ? 'Dificultad: ' + nivelMax(c.ids) : ''}</span></div>
        ${c.ids.map((id, i) => `<div class="entre" style="background:var(--suave);border-radius:12px;padding:4px 4px 4px 12px"><span class="peq"><b>${i + 1}.</b> ${esc(T.find(t => t.id === id).titulo)}</span><button class="icono-btn" data-a="quitarPlantilla" data-i="${i}" aria-label="Quitar">${icono('cerrar', 18)}</button></div>`).join('') || '<p class="peq gris" style="margin:0">Agrega 5 preguntas de las plantillas de abajo.</p>'}
        <button class="btn" id="pubNivel" data-a="publicarNivel" ${listo ? '' : 'disabled'}>Publicar nivel</button><p class="mini gris" style="margin:0">Los números de cada pregunta se fijan al publicar, como un nivel de verdad.</p></div>
        ${NIVELES.map(n => `<div class="seccion"><h3>${n}</h3><span class="mini gris">+${PREMIO[n]} por acierto</span></div><div class="auto">${T.filter(t => t.nivel === n).map(t => `<button class="tarjeta entre" style="text-align:left;padding:10px 12px" data-a="agregarPlantilla" data-id="${t.id}" ${lleno ? 'disabled' : ''}><span><b class="peq">${esc(t.titulo)}</b><br><span class="mini gris">${esc(t.tema)}</span></span>${icono('mas', 18)}</button>`).join('')}</div>`).join('')}</div>`;
    }
    if (sub === 'nivel') {
      const n = DB.estado.niveles.find(x => x.id === params[1]); if (!n) return '<p class="vacio">Ese nivel ya no existe.</p>';
      if (!R.juego || R.juego.id !== n.id) { R.juego = { id: n.id, i: 0, ok: 0, gan: 0, res: [] }; n.jugadas++; DB.guardar(); R.p = crear(n.ids[0], hashTexto(n.id + '0')); R.eleg = null; R.seg = REGLAS.segundosPorPregunta; }
      const J = R.juego;
      if (J.i >= 5) { const gusta = n.likers.includes(DB.yo().id); return `<div class="tarjeta" style="text-align:center"><b style="font-family:Sora,sans-serif;font-size:60px;color:var(--moradoTxt)">${J.ok}/5</b><h2>${esc(n.nombre)}</h2><p class="gris">Ganaste ${J.gan} ramitas en este nivel</p><div class="fila" style="justify-content:center"><button class="btn3" data-a="gustarNivel" data-id="${n.id}" aria-pressed="${gusta}">${gusta ? 'Te gusta' : 'Me gusta'} · ${n.likes}</button><button class="btn" data-a="repetirNivel">Jugar otra vez</button><a class="btn2" href="#/retos/niveles">Más niveles</a></div></div>`; }
      const prog = `<div class="progreso">${[0, 1, 2, 3, 4].map(i => `<span class="${i < J.res.length ? (J.res[i] ? 'b' : 'm') : i === J.i ? 'a' : ''}"></span>`).join('')}</div>`;
      return `<div class="pila">${tabs}${tarjetaProblema(`<div style="font-family:Sora,sans-serif;font-weight:800;font-size:19px;margin-top:8px">${esc(n.nombre)}</div><div class="mini" style="opacity:.85">pregunta ${J.i + 1} de 5</div>${prog}`)}
        ${R.eleg !== null ? `<button class="btn" data-a="sigNivel">${J.i === 4 ? 'Ver resultado' : 'Siguiente'}</button>` : ''}</div>`;
    }
    if (!R.p || R.juego) { R.juego = null; nuevoReto(); }
    return `<div class="pila">${tabs}<div class="pestanas">${['Aleatorio', ...NIVELES].map(d => `<button class="pastilla${R.dif === d ? ' on' : ''}" data-a="difReto" data-d="${d}">${d}${d === 'Aleatorio' ? '' : ' · +' + PREMIO[d]}</button>`).join('')}</div>
      ${tarjetaProblema('')}<div class="fila"><button class="btn" data-a="sigReto">${R.eleg === null ? 'Saltar' : 'Siguiente'}</button><span class="mini gris">Cada ejercicio se genera al momento: los números cambian siempre.</span></div></div>`;
  },
  montar() { detenerTemporizadores(); const R = UI.reto; if (R.eleg !== null || !$('#reloj')) return; temporizador(() => { R.seg--; const b = $('#reloj span'); if (b) b.style.width = Math.max(0, R.seg / REGLAS.segundosPorPregunta * 100) + '%'; if (R.seg <= 0) { detenerTemporizadores(); responderReto(-1); } }, 1000); }
};
function nuevoReto() { const R = UI.reto, pool = R.dif === 'Aleatorio' ? T : T.filter(t => t.nivel === R.dif), t = pool[Math.floor(Math.random() * pool.length)]; R.p = crear(t.id, Math.floor(Math.random() * 1e9)); R.eleg = null; R.seg = REGLAS.segundosPorPregunta; }
function tarjetaProblema(extra) {
  const R = UI.reto, p = R.p, r = R.eleg !== null, ok = R.eleg === p.correcta;
  return `<section class="problema aparece" aria-live="polite"><div class="entre peq" style="font-weight:700"><span>${esc(p.tema)} · ${esc(p.titulo)}</span>${insigniaDif(p.nivel)}</div>${extra}
    ${r ? '' : `<div class="tiempo" id="reloj" aria-hidden="true"><span style="width:${R.seg / REGLAS.segundosPorPregunta * 100}%"></span></div>`}
    <p style="font-family:Sora,sans-serif;font-size:18px;margin:14px 0 10px;opacity:.92">${p.pregunta}</p><div class="expr">${p.expr}</div>
    <div class="opciones">${p.opciones.map((o, i) => `<button class="opcion${r ? (i === p.correcta ? ' ok' : i === R.eleg ? ' mal' : '') : ''}" data-a="respReto" data-i="${i}"><span class="l">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}</div>
    ${r ? `<div class="explica"><b style="color:${ok ? '#14632F' : '#991B1B'}">${ok ? '¡Correcto!' + (R.ganado ? ' +' + R.ganado + ' ramitas' : '') : R.eleg === -1 ? 'Se acabó el tiempo. Era la ' + 'ABCD'[p.correcta] : 'Casi. Era la ' + 'ABCD'[p.correcta]}</b>${p.porque}</div>` : ''}</section>`;
}
function responderReto(i) {
  const R = UI.reto; if (R.eleg !== null) return; R.eleg = i; detenerTemporizadores();
  const ok = i === R.p.correcta; R.ganado = ok ? DB.premioReto(R.p.premio, R.p.plantilla) : 0;
  if (R.juego) { R.juego.res.push(ok); if (ok) { R.juego.ok++; R.juego.gan += R.ganado; } }
  refrescar();
}
ACC.respReto = b => responderReto(+b.dataset.i);
ACC.difReto = b => { UI.reto.dif = b.dataset.d; nuevoReto(); detenerTemporizadores(); refrescar(); };
ACC.sigReto = () => { detenerTemporizadores(); nuevoReto(); refrescar(); };
ACC.sigNivel = () => { const R = UI.reto, J = R.juego, n = DB.estado.niveles.find(x => x.id === J.id); J.i++; if (J.i < 5) { R.p = crear(n.ids[J.i], hashTexto(n.id + J.i)); R.eleg = null; R.seg = REGLAS.segundosPorPregunta; } refrescar(); };
ACC.repetirNivel = () => { UI.reto.juego = null; refrescar(); };
ACC.gustarNivel = b => { DB.gustarNivel(b.dataset.id); refrescar(); };
ACC.agregarPlantilla = b => { if (UI.reto.crear.ids.length < 5) UI.reto.crear.ids.push(b.dataset.id); refrescar(); };
ACC.quitarPlantilla = b => { UI.reto.crear.ids.splice(+b.dataset.i, 1); refrescar(); };
ENTRADAS.nombreNivel = el => { UI.reto.crear.nombre = el.value; const b = $('#pubNivel'); if (b) b.disabled = !(UI.reto.crear.ids.length === 5 && el.value.trim()); };
ACC.publicarNivel = () => { const c = UI.reto.crear; DB.crearNivel(c.nombre, c.ids.slice()); UI.reto.crear = { nombre: '', ids: [] }; aviso('Nivel publicado'); ir('#/retos/niveles'); };
