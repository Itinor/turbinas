/* Trivia nivel ingeniería: preguntas difíciles que escribe el admin (materia, nivel, 4 opciones, una correcta y su explicación).
   Al jugar, las opciones se revuelven y no se repiten preguntas hasta que se acaban. */
'use strict';
const NIVELES_TP = [['normal', 'Normal'], ['dificil', 'Difícil'], ['brutal', 'Brutal']];
UI.tp = null; UI.tpFiltro = { materia: '', nivel: '' };
const tpVistas = () => { try { return JSON.parse(localStorage.getItem('itinor_tp_' + DB.yo().id) || '[]'); } catch { return []; } };
const tpMarcar = id => { try { const v = tpVistas().filter(x => x !== id); v.push(id); localStorage.setItem('itinor_tp_' + DB.yo().id, JSON.stringify(v.slice(-1000))); } catch {} };
const tpMaterias = () => [...new Set(DB.estado.triviaPro.map(q => q.materia))].sort((a, b) => a.localeCompare(b));

VISTAS.triviapro = {
  titulo: 'Trivia nivel ingeniería', nav: 'juegos', atras: '#/juegos',
  render() {
    const todas = DB.estado.triviaPro, t = UI.tp;
    if (!todas.length) return `<div class="tarjeta" style="text-align:center"><h2>Todavía no hay preguntas</h2><p class="gris">El equipo está escribiendo las primeras.</p>${DB.esAdmin() ? '<button class="btn" data-a="tpNueva">Escribir una pregunta</button>' : ''}</div>`;
    if (!t) {
      const f = UI.tpFiltro, n = todas.filter(q => (!f.materia || q.materia === f.materia) && (!f.nivel || q.nivel === f.nivel)).length;
      return `<div class="pila"><section class="tarjeta"><h2>Elige tu tortura</h2><p class="peq gris" style="margin:4px 0 0">Preguntas escritas por estudiantes de ingeniería. Todas las opciones suenan convincentes: solo una está bien.</p>
        <p class="etiqueta gris" style="margin:14px 0 6px">Materia</p><div class="pestanas" style="flex-wrap:wrap">${[['', 'Todas'], ...tpMaterias().map(m => [m, m])].map(([k, nm]) => `<button class="pastilla${f.materia === k ? ' on' : ''}" data-a="tpFiltro" data-k="materia" data-v="${esc(k)}">${esc(nm)}</button>`).join('')}</div>
        <p class="etiqueta gris" style="margin:14px 0 6px">Nivel</p><div class="pestanas">${[['', 'Todos'], ...NIVELES_TP].map(([k, nm]) => `<button class="pastilla${f.nivel === k ? ' on' : ''}" data-a="tpFiltro" data-k="nivel" data-v="${k}">${nm}</button>`).join('')}</div>
        <button class="btn ancho" style="margin-top:16px" data-a="tpEmpezar" ${n ? '' : 'disabled'}>${n ? `Jugar ${Math.min(10, n)} pregunta${Math.min(10, n) > 1 ? 's' : ''}` : 'No hay preguntas con ese filtro'}</button></section>
        ${DB.esAdmin() ? '<button class="btn3" data-a="admTriviaIr">Administrar preguntas</button>' : ''}</div>`;
    }
    if (t.i >= t.qs.length) return `<div class="tarjeta" style="text-align:center"><h2>${t.ok} de ${t.qs.length}</h2><p class="gris">${t.ok === t.qs.length ? 'Impecable. Eres el coco del salón.' : t.ok >= t.qs.length * 0.7 ? 'Muy bien, casi nadie llega ahí.' : t.ok >= t.qs.length * 0.4 ? 'Nada mal para este nivel.' : 'Estas estaban ojetes. Repasa las explicaciones.'}</p><div class="pila"><button class="btn" data-a="tpEmpezar">Otra ronda</button><button class="btn3" data-a="tpSalir">Cambiar materia o nivel</button></div></div>`;
    const q = DB.estado.triviaPro.find(x => x.id === t.qs[t.i]); if (!q) { t.i++; return this.render(); }
    const orden = t.orden[t.i], resp = t.eleg;
    return `<div class="tarjeta"><div class="entre"><span class="mini gris">Pregunta ${t.i + 1} de ${t.qs.length} · ${esc(q.materia)}</span><span class="insignia ${q.nivel === 'brutal' ? 'i-rojo' : q.nivel === 'dificil' ? 'i-amarillo' : 'i-morado'}">${NIVELES_TP.find(n => n[0] === q.nivel)?.[1] || ''}</span></div>
      <h2 style="margin:10px 0 14px;white-space:pre-wrap">${esc(q.p)}</h2>
      <div class="opciones">${orden.map((oi, i) => `<button class="opcion clara${resp !== null ? (oi === q.c ? ' ok' : oi === resp ? ' mal' : '') : ''}" style="white-space:pre-wrap;text-align:left;height:auto;padding-top:10px;padding-bottom:10px" data-a="tpResp" data-i="${oi}"><span class="l">${'ABCD'[i]}</span>${esc(q.o[oi])}</button>`).join('')}</div>
      ${resp !== null ? `${q.x ? `<div class="tarjeta" style="box-shadow:none;background:var(--suave);margin-top:12px;white-space:pre-wrap"><b class="peq">Por qué</b><p class="peq" style="margin:4px 0 0">${esc(q.x)}</p></div>` : ''}<button class="btn" style="margin-top:14px" data-a="tpSig">${t.i === t.qs.length - 1 ? 'Ver resultado' : 'Siguiente'}</button>` : ''}
      ${q.autor ? `<p class="mini gris" style="margin:12px 0 0">Pregunta de @${esc(DB.usuario(q.autor)?.usuario || 'equipo')}</p>` : ''}</div>`;
  }
};
ACC.tpFiltro = b => { UI.tpFiltro[b.dataset.k] = b.dataset.v; refrescar(); };
ACC.tpSalir = () => { UI.tp = null; refrescar(); };
ACC.tpEmpezar = () => {
  const f = UI.tpFiltro, pool = DB.estado.triviaPro.filter(q => (!f.materia || q.materia === f.materia) && (!f.nivel || q.nivel === f.nivel)), vistas = tpVistas();
  /* primero las que nunca ha visto; si ya vio todas, las que vio hace más tiempo */
  const nuevas = pool.filter(q => !vistas.includes(q.id)).sort(() => Math.random() - 0.5), viejas = pool.filter(q => vistas.includes(q.id)).sort((a, b) => vistas.indexOf(a.id) - vistas.indexOf(b.id));
  const qs = [...nuevas, ...viejas].slice(0, 10).map(q => q.id);
  UI.tp = { qs, orden: qs.map(() => [0, 1, 2, 3].sort(() => Math.random() - 0.5)), i: 0, ok: 0, eleg: null }; refrescar(); scrollTo(0, 0);
};
ACC.tpResp = b => { const t = UI.tp; if (t.eleg !== null) return; t.eleg = +b.dataset.i; const q = DB.estado.triviaPro.find(x => x.id === t.qs[t.i]); if (t.eleg === q.c) t.ok++; tpMarcar(q.id); refrescar(); };
ACC.tpSig = () => { const t = UI.tp; t.i++; t.eleg = null; refrescar(); scrollTo(0, 0); };

/* ---------- administración (pestaña "Trivia" del panel de admin) ---------- */
UI.admTp = '';
function admTrivia() {
  const l = DB.estado.triviaPro.filter(q => !UI.admTp || q.materia === UI.admTp).slice().sort((a, b) => a.materia.localeCompare(b.materia) || String(b.f).localeCompare(String(a.f)));
  return `<section class="tarjeta"><div class="entre"><h2>Trivia nivel ingeniería · ${DB.estado.triviaPro.length}</h2><button class="btn" style="min-height:40px;padding:0 12px" data-a="tpNueva">${icono('mas', 16)}Nueva</button></div>
    <p class="peq gris" style="margin:4px 0 10px">Escribe la correcta en cualquier lugar: al jugar las opciones se revuelven. Para demostraciones, haz que las 3 incorrectas tengan un solo error escondido.</p>
    <div class="pestanas" style="flex-wrap:wrap">${[['', 'Todas'], ...tpMaterias().map(m => [m, m])].map(([k, n]) => `<button class="pastilla${UI.admTp === k ? ' on' : ''}" data-a="admTpFiltro" data-v="${esc(k)}">${esc(n)}</button>`).join('')}</div>
    ${l.map(q => `<div style="padding:10px 0;border-bottom:1px solid var(--linea)"><div class="entre" style="align-items:flex-start;gap:8px"><span style="min-width:0"><span class="mini gris">${esc(q.materia)} · ${NIVELES_TP.find(n => n[0] === q.nivel)?.[1]}</span><br><b class="peq" style="white-space:pre-wrap">${esc(q.p.slice(0, 160))}${q.p.length > 160 ? '…' : ''}</b><br><span class="mini" style="color:var(--okTxt)">✓ ${esc(q.o[q.c].slice(0, 80))}</span></span>
      <span class="fila" style="gap:4px;flex:none"><button class="icono-btn" data-a="tpEditar" data-id="${q.id}" aria-label="Editar">${icono('lapiz', 18)}</button><button class="icono-btn" data-a="tpBorrar" data-id="${q.id}" aria-label="Borrar">${icono('basura', 18)}</button></span></div></div>`).join('') || '<p class="vacio">Sin preguntas todavía.</p>'}
  </section>`;
}
ACC.admTpFiltro = b => { UI.admTp = b.dataset.v; refrescar(); };
ACC.admTriviaIr = () => { UI.admTab = 'trivia'; ir('#/admin'); };
function hojaTp(q) {
  abrirHoja(`<form class="pila" data-form="tpGuardar"><h2>${q ? 'Editar pregunta' : 'Nueva pregunta'}</h2><input type="hidden" name="id" value="${q?.id || ''}">
    <div class="fila" style="flex-wrap:nowrap"><div style="flex:1"><label class="campo" for="tpm">Materia</label><input id="tpm" name="materia" required maxlength="40" list="tpMats" value="${esc(q?.materia || UI.admTp || '')}" placeholder="Ciencia de materiales"><datalist id="tpMats">${tpMaterias().map(m => `<option value="${esc(m)}">`).join('')}</datalist></div>
      <div><label class="campo" for="tpn">Nivel</label><select id="tpn" name="nivel">${NIVELES_TP.map(([k, n]) => `<option value="${k}" ${(q?.nivel || 'dificil') === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
    <div><label class="campo" for="tpp">Pregunta</label><textarea id="tpp" name="p" required maxlength="1500" rows="3" placeholder="¿A partir de qué temperatura empieza a formarse martensita en un acero 1080 templado?">${esc(q?.p || '')}</textarea></div>
    ${[0, 1, 2, 3].map(i => `<div><label class="fila campo" style="gap:6px;flex-wrap:nowrap"><input type="radio" name="c" value="${i}" ${(q ? q.c : 0) === i ? 'checked' : ''} required> Opción ${'ABCD'[i]} <span class="mini gris">(marca la correcta)</span></label><textarea name="o${i}" required maxlength="800" rows="2" aria-label="Opción ${'ABCD'[i]}">${esc(q?.o[i] || '')}</textarea></div>`).join('')}
    <div><label class="campo" for="tpx">Explicación <span class="mini gris">(se muestra al responder)</span></label><textarea id="tpx" name="x" maxlength="1500" rows="3">${esc(q?.x || '')}</textarea></div>
    <button class="btn ancho">Guardar</button></form>`);
}
ACC.tpNueva = () => hojaTp(null);
ACC.tpEditar = b => hojaTp(DB.estado.triviaPro.find(q => q.id === b.dataset.id));
ACC.tpBorrar = b => { if (!confirm('¿Borrar esta pregunta?')) return; DB.estado.triviaPro = DB.estado.triviaPro.filter(q => q.id !== b.dataset.id); DB.guardar(); refrescar(); };
FORMS.tpGuardar = d => {
  if (!DB.esAdmin()) return;
  const o = [0, 1, 2, 3].map(i => String(d['o' + i] || '').trim());
  if (o.some(x => !x)) return aviso('Llena las 4 opciones.');
  if (new Set(o.map(x => x.toLowerCase())).size < 4) return aviso('Hay dos opciones iguales.');
  const q = { materia: d.materia.trim().slice(0, 40), nivel: d.nivel, p: d.p.trim(), o, c: +d.c, x: String(d.x || '').trim() };
  const ya = d.id && DB.estado.triviaPro.find(x => x.id === d.id);
  if (ya) Object.assign(ya, q); else DB.estado.triviaPro.push({ id: uid('tp'), ...q, autor: DB.yo().id, f: new Date().toISOString() });
  DB.guardar(); cerrarHoja(); aviso('Pregunta guardada'); refrescar();
};
