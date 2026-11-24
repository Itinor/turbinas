'use strict';
const ofertaActual = () => DB.estado.ofertaSemestre?.data || OFERTA;
let _ofCache = null, _ofDe = null;
const ofProfes = () => { const o = ofertaActual(); if (_ofDe !== o) { _ofDe = o; _ofCache = o.profes.map(([nombre, materias], i) => ({ id: 'of' + i, nombre, materias, carrera: '', oferta: true })); } return _ofCache; };
const directorioCompleto = () => [...(DB.estado.dirProfes || []), ...ofProfes().filter(p => !(DB.estado.dirProfes || []).some(d => DB.claveNombre(d.nombre) === DB.claveNombre(p.nombre)))];
DB.buscarEnDirectorio = function (q, max = 5) {
  const ts = normNombre(DB.claveNombre(q)).split(' ').filter(t => t.length >= 2); if (!ts.length) return [];
  return directorioCompleto().map(p => { const ws = normNombre(p.nombre).split(' '); const ok = ts.every(t => ws.some(w => w.startsWith(t))); return ok ? { p, pts: ts.filter(t => ws.includes(t)).length } : null; })
    .filter(Boolean).sort((a, b) => b.pts - a.pts || a.p.nombre.localeCompare(b.p.nombre)).slice(0, max).map(x => x.p);
};
DB.profeDeDirectorio = id => directorioCompleto().find(p => p.id === id);
const OF_DIAS = { lu: 'Lun', ma: 'Mar', mi: 'Mié', ju: 'Jue', vi: 'Vie', sa: 'Sáb' };
const ofGrupo = g => ({ grupo: g[0], clave: g[1], materia: g[2], profe: ofertaActual().profes[g[3]]?.[0] || '', tipo: { teor: 'Teoría', prac: 'Práctica', labo: 'Laboratorio' }[g[4]] || '', virtual: g[5] === 'v', ses: g[6] });
const salonTxt = s => !s ? '' : /^virt/i.test(s) ? 'Virtual' : 'SA-' + s;
function ofBuscar(q) {
  const s = normNombre(q).replace(/\s+/g, ' ').trim(), crudo = String(q || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!crudo) return { lista: [], grupo: null };
  const O = ofertaActual(), L = O.grupos.map((g, i) => ({ i, g }));
  const delGrupo = L.filter(x => x.g[0].toUpperCase() === crudo);
  if (delGrupo.length) return { lista: delGrupo, grupo: crudo };
  const ts = s.split(' ').filter(t => t.length >= 2);
  const r = L.filter(({ g }) => { const txt = normNombre(g[2] + ' ' + g[1] + ' ' + g[0] + ' ' + (O.profes[g[3]]?.[0] || '')); return g[1].toUpperCase() === crudo || (ts.length && ts.every(t => txt.split(' ').some(w => w.startsWith(t)))); });
  return { lista: r.slice(0, 60), grupo: null, mas: r.length > 60 };
}
ACC.ofertaHoja = () => {
  abrirHoja(`<div class="pila" style="gap:10px"><h2>Buscar en la oferta de la facultad</h2>
    <p class="peq gris" style="margin:0">Escribe tu <b>grupo</b> (como 3G2) para ver todas sus materias, o busca por materia, clave o profesor.</p>
    <input id="ofQ" placeholder="3G2, Cálculo vectorial, IA705, Nava…" data-entrada="ofQ" autocomplete="off" aria-label="Buscar materia o grupo">
    <div id="ofRes" class="pila" style="gap:8px"></div></div>`);
  setTimeout(() => $('#ofQ')?.focus(), 80);
};
let ofT = null;
ENTRADAS.ofQ = el => { clearTimeout(ofT); ofT = setTimeout(() => { const r = ofBuscar(el.value), c = $('#ofRes'); if (!c) return; UI.ofRes = r;
  if (!el.value.trim()) { c.innerHTML = ''; return; }
  if (!r.lista.length) { c.innerHTML = '<p class="peq gris">No encontramos esa materia o grupo.</p>'; return; }
  const ya = new Set(normalizarHorario(DB.yo()).map(x => x.ofi).filter(x => x !== undefined));
  c.innerHTML = (r.grupo ? `<button class="btn ancho" data-a="ofAgregarGrupo">Agregar las ${r.lista.length} materias del grupo ${esc(r.grupo)}</button>` : '') + r.lista.map(({ i, g }) => { const x = ofGrupo(g);
    return `<div class="of-item"><div style="min-width:0;flex:1"><b class="peq">${esc(x.materia)}</b> <span class="mini gris">${esc(x.grupo)} · ${esc(x.clave)}${x.tipo && x.tipo !== 'Teoría' ? ' · ' + x.tipo : ''}${x.virtual ? ' · virtual' : ''}</span><br><span class="mini">${esc(x.profe)}</span><br><span class="mini gris">${x.ses.map(s => `${OF_DIAS[s[0]]} ${s[1]}–${s[2]}${s[3] ? ' ' + esc(salonTxt(s[3])) : ''}`).join(' · ') || 'Sin horario'}</span></div>${ya.has(i) ? '<span class="mini" style="color:var(--okTxt);font-weight:700">Agregada</span>' : `<button class="btn2" style="min-height:36px;padding:0 12px" data-a="ofAgregar" data-i="${i}">Agregar</button>`}</div>`; }).join('') + (r.mas ? '<p class="mini gris">Hay más resultados; escribe algo más específico.</p>' : ''); }, 120); };
function ofAgregarIdx(i) {
  const u = DB.yo(), l = normalizarHorario(u), x = ofGrupo(ofertaActual().grupos[i]); if (l.some(c => c.ofi === i)) return false;
  const salones = x.ses.map(s => s[3]).filter(Boolean), moda = salones.sort((a, b) => salones.filter(v => v === b).length - salones.filter(v => v === a).length)[0] || '';
  const titulo = x.tipo && x.tipo !== 'Teoría' ? `${x.materia} (${x.tipo})` : x.materia;
  l.push({ id: uid('cl'), materia: titulo.slice(0, 60), salon: salonTxt(moda), profe: x.profe, grupo: x.grupo, ofi: i, color: COLORES_CLASE[l.length % COLORES_CLASE.length], sesiones: x.ses.map(s => ({ d: s[0], ini: s[1], fin: s[2], salon: salonTxt(s[3]) })) });
  u.horario = l; return true;
}
ACC.ofAgregar = b => { if (ofAgregarIdx(+b.dataset.i)) { DB.guardar(); aviso('Agregada a tu horario'); } ENTRADAS.ofQ($('#ofQ')); };
ACC.ofAgregarGrupo = () => { let n = 0; (UI.ofRes?.lista || []).forEach(({ i }) => { if (ofAgregarIdx(i)) n++; }); DB.guardar(); cerrarHoja(); aviso(n ? `${n} materias agregadas` : 'Ya las tenías'); refrescar(); };
