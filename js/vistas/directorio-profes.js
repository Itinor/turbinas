'use strict';
const normNombre = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
DB.buscarEnDirectorio = function (q, max = 5) {
  const ts = normNombre(DB.claveNombre(q)).split(' ').filter(t => t.length >= 2); if (!ts.length) return [];
  return (DB.estado.dirProfes || []).map(p => { const ws = normNombre(p.nombre).split(' '); const ok = ts.every(t => ws.some(w => w.startsWith(t))); return ok ? { p, pts: ts.filter(t => ws.includes(t)).length } : null; })
    .filter(Boolean).sort((a, b) => b.pts - a.pts || a.p.nombre.localeCompare(b.p.nombre)).slice(0, max).map(x => x.p);
};
function sugerenciasDirectorio(q) {
  const l = DB.buscarEnDirectorio(q); if (!l.length) return '';
  return `<p class="mini gris" style="margin:6px 0 4px">¿Es alguno de estos?</p>${l.map(p => { const ya = DB.profeParecido(p.nombre); return `<button type="button" class="sug-profe" data-a="elegirDirProfe" data-id="${p.id}"><b>${esc(p.nombre)}</b><span>${esc(p.materias.join(', '))}${p.carrera ? ' · ' + esc(p.carrera) : ''}</span>${ya ? '<em>Ya tiene ficha</em>' : ''}</button>`; }).join('')}`;
}
ACC.elegirDirProfe = b => {
  const p = (DB.estado.dirProfes || []).find(x => x.id === b.dataset.id); if (!p) return;
  const ya = DB.profeParecido(p.nombre); if (ya) { cerrarHoja(); location.hash = '#/profe/' + ya.id; return; }
  const f = b.closest('form'); f.nombre.value = p.nombre; f.materias.value = p.materias.join(', '); if (p.carrera && f.area) f.area.value = p.carrera;
  let h = f.querySelector('input[name=dir]'); if (!h) { h = document.createElement('input'); h.type = 'hidden'; h.name = 'dir'; f.appendChild(h); } h.value = p.id;
  const s = $('#ppDir'); if (s) s.innerHTML = `<p class="mini" style="margin:6px 0 0;color:var(--okTxt)">Elegiste a <b>${esc(p.nombre)}</b> del directorio de la facultad.</p>`;
};

UI.dirBusca = '';
function admDirectorio() {
  const L = DB.estado.dirProfes || [], q = normNombre(UI.dirBusca), vis = q ? L.filter(p => normNombre(p.nombre + ' ' + p.materias.join(' ') + ' ' + (p.carrera || '')).includes(q)) : L;
  return `<section class="tarjeta pila" style="gap:10px"><div class="entre"><h2>Directorio de profesores · ${L.length}</h2>${L.length ? '<button class="btn3" style="color:var(--malTxt)" data-a="dirVaciar">Vaciar</button>' : ''}</div>
    <p class="peq gris" style="margin:0">No aparecen en los rankings. Sirven para que, al agregar un profesor, la gente vea las coincidencias con sus materias y elija al correcto. Si eligen uno del directorio, se agrega sin esperar revisión.</p>
    <form class="pila" style="gap:8px" data-form="dirImportar"><label class="campo" for="dirTxt">Pegar lista (un profesor por renglón)</label>
      <textarea id="dirTxt" name="txt" rows="6" placeholder="Nombre | Materia 1, Materia 2 | Carrera&#10;Pedro Páramo Jacinto | Física, Química | Ingeniería Física"></textarea>
      <p class="mini gris" style="margin:0">Separa con | ; o tabulador (sirve copiar y pegar desde Excel). Si el nombre ya está, se juntan sus materias.</p>
      <button class="btn">Importar</button></form></section>
    ${L.length ? `<section class="tarjeta"><input placeholder="Buscar en el directorio…" value="${esc(UI.dirBusca)}" data-entrada="dirBusca" aria-label="Buscar en el directorio"><div id="dirLista">${listaDirectorio(vis)}</div></section>` : ''}`;
}
function listaDirectorio(l) { return l.slice(0, 200).map(p => `<div class="entre" style="padding:8px 0;border-bottom:1px solid var(--linea);gap:8px"><span style="min-width:0"><b class="peq">${esc(p.nombre)}</b><br><span class="mini gris">${esc(p.materias.join(', '))}${p.carrera ? ' · ' + esc(p.carrera) : ''}</span></span><button class="icono-btn" data-a="dirQuitar" data-id="${p.id}" aria-label="Quitar">${icono('basura', 18)}</button></div>`).join('') + (l.length > 200 ? `<p class="mini gris">Y ${l.length - 200} más. Usa el buscador.</p>` : ''); }
ENTRADAS.dirBusca = el => { UI.dirBusca = el.value; const q = normNombre(el.value), L = DB.estado.dirProfes || []; const d = $('#dirLista'); if (d) d.innerHTML = listaDirectorio(q ? L.filter(p => normNombre(p.nombre + ' ' + p.materias.join(' ') + ' ' + (p.carrera || '')).includes(q)) : L); };
FORMS.dirImportar = d => {
  if (!DB.esAdmin()) return;
  const E = DB.estado; E.dirProfes = E.dirProfes || []; let nuevos = 0, juntados = 0;
  String(d.txt || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
    const [nombre, mats = '', carrera = ''] = l.split(/\s*[|;\t]\s*/); if (!nombre || normNombre(nombre).length < 5 || /^nombre$/i.test(nombre)) return;
    const materias = mats.split(',').map(m => m.trim()).filter(Boolean).slice(0, 12), k = normNombre(DB.claveNombre(nombre));
    const ya = E.dirProfes.find(p => normNombre(DB.claveNombre(p.nombre)) === k);
    if (ya) { ya.materias = [...new Set([...ya.materias, ...materias])].slice(0, 12); if (carrera && !ya.carrera) ya.carrera = carrera.slice(0, 60); juntados++; }
    else { E.dirProfes.push({ id: uid('dp'), nombre: nombre.slice(0, 80), materias, carrera: carrera.slice(0, 60) }); nuevos++; }
  });
  DB.guardar(); aviso(`${nuevos} agregados${juntados ? `, ${juntados} actualizados` : ''}`); refrescar();
};
ACC.dirQuitar = b => { DB.estado.dirProfes = (DB.estado.dirProfes || []).filter(p => p.id !== b.dataset.id); DB.guardar(); refrescar(); };
ACC.dirVaciar = () => { if (!confirm('¿Quitar todo el directorio de profesores?')) return; DB.estado.dirProfes = []; DB.guardar(); refrescar(); };
