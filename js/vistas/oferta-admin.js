'use strict';
const OF_ACENTOS = Object.fromEntries('García Martínez González Pérez Hernández Ramírez Sánchez Gómez Díaz Rodríguez López Vázquez Jiménez Gutiérrez Domínguez Fernández Álvarez Núñez Muñoz Cárdenas Chávez Juárez Suárez Méndez Ibáñez Peña Piñón Treviño José María Jesús Ángel Raúl Martín Adrián Héctor Óscar Rubén Sofía Mónica Julián Iván Andrés Ramón Germán Agustín Sebastián Nicolás Tomás Joaquín Efraín Benítez Velázquez Márquez Rocío Inés Lucía Verónica Bárbara Durán Solís Ríos Báez Quiñónez Saúl Álvaro Arámbula Elías Cálculo Estadística Química Física Álgebra Termodinámica Mecánica Electrónica Hidráulica Geología Topografía Metalurgia Mineralogía Geofísica Dinámica Estática Análisis Numéricos Numérico Métodos Técnica Técnicas Ecología Economía Administración Programación Computación Lógica Matemáticas Introducción Teoría Prácticas Práctica Diseño Ingeniería Simulación Investigación Producción Planeación Gestión Organización Comunicación Presentación Redacción Inglés Ética Geometría Analítica Vibraciones Máquinas Térmica Hidrología Geotécnica Petrología Paleontología Cristalografía Exploración Explotación Fotogrametría Geodésica Cartografía Energía Eléctrica Eléctricos Electrónicos Óptica Acústica Biología Básica Probabilidad Construcción Estratigrafía Petróleo Tecnología Información Legislación Dirección Contabilidad Logística Automatización Robótica Señales Instrumentación Orgánica Inorgánica Aeronáutica Aeroespacial Propulsión Aerodinámica Navegación Órbitas Psicología Sociología Filosofía Historia Pensamiento Crítico Sistemas Dinámicos Tránsito Vías Edificación'.split(' ').map(w => [w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), w.toLowerCase()]));
const OF_MOJIBAKE = [['Ã‘', 'Ñ'], ['Ã±', 'ñ'], ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'], ['Ã\u0081', 'Á'], ['Ã‰', 'É'], ['Ã“', 'Ó'], ['Ãš', 'Ú'], ['Ã¼', 'ü'], ['Ãœ', 'Ü']];
const ofArreglar = s => OF_MOJIBAKE.reduce((t, [a, b]) => t.split(a).join(b), String(s ?? '').trim());
function ofTitulo(s, nombre) {
  const MIN = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'o', 'a', 'en', 'para', 'con', 'por', 'el', 'al']);
  return s.toLowerCase().split(/\s+/).filter(Boolean).map((x, i) => { if (/^(i|ii|iii|iv|v|vi|vii|viii)$/.test(x)) return x.toUpperCase(); if ((i > 0 || nombre) && MIN.has(x)) return x;
    const k = x.normalize('NFD').replace(/[̀-ͯ]/g, ''), w = OF_ACENTOS[k] || x; return w[0].toUpperCase() + w.slice(1); }).join(' ');
}
function ofNombre(n) {
  const PART = new Set(['DE', 'LA', 'DEL', 'LOS', 'LAS', 'Y', 'SAN', 'VAN', 'VON']), u = []; let buf = [];
  n.toUpperCase().split(/\s+/).filter(Boolean).forEach(t => { buf.push(t); if (!PART.has(t)) { u.push(buf.join(' ')); buf = []; } }); if (buf.length) u.push(buf.join(' '));
  const [ap, no] = u.length >= 3 ? [u.slice(0, 2), u.slice(2)] : u.length === 2 ? [u.slice(0, 1), u.slice(1)] : [u, []];
  return ofTitulo([...no, ...ap].join(' '), true);
}
function ofDesdeFilas(filas) {
  const cab = filas[0].map(h => String(h ?? '').trim().toLowerCase()), col = n => cab.indexOf(n.toLowerCase());
  const req = ['Grupo', 'Clave', 'Materia', 'Nombre']; const falta = req.filter(n => col(n) < 0); if (falta.length) throw new Error('Faltan columnas: ' + falta.join(', '));
  const DIAS = [['lu', 'HLunes', 'L_SalonGrupo'], ['ma', 'HMartes', 'M_SalonGrupo'], ['mi', 'HMiercoles', 'MM_SalonGrupo'], ['ju', 'HJueves', 'J_SalonGrupo'], ['vi', 'HViernes', 'V_SalonGrupo'], ['sa', 'HSabado', 'S_SalonGrupo']];
  const profes = [], idx = new Map(), grupos = [];
  filas.slice(1).forEach(r => { const pn = ofArreglar(r[col('Nombre')]), mat = ofArreglar(r[col('Materia')]); if (!pn || !mat) return;
    if (!idx.has(pn)) { idx.set(pn, profes.length); profes.push([ofNombre(pn), []]); }
    const pi = idx.get(pn), m = ofTitulo(mat); if (!profes[pi][1].includes(m)) profes[pi][1].push(m);
    const ses = []; DIAS.forEach(([d, h, sl]) => { const v = col(h) >= 0 ? r[col(h)] : null, mm = String(v ?? '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/); if (mm) ses.push([d, mm[1].padStart(5, '0'), mm[2].padStart(5, '0'), col(sl) >= 0 && r[col(sl)] != null ? String(r[col(sl)]).trim() : '']); });
    grupos.push([String(r[col('Grupo')] ?? '').trim(), String(r[col('Clave')] ?? '').trim(), m, pi, String(col('TipoGrupo') >= 0 ? r[col('TipoGrupo')] ?? '' : '').toLowerCase().slice(0, 4), /virtual/i.test(String(col('Modalidad') >= 0 ? r[col('Modalidad')] : '')) ? 'v' : 'p', ses]); });
  if (!grupos.length) throw new Error('No se encontró ningún grupo.');
  return { profes, grupos };
}
let _xlsx = null;
const cargarXlsx = () => _xlsx || (_xlsx = new Promise((ok, mal) => { if (window.XLSX) return ok(window.XLSX); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = () => ok(window.XLSX); s.onerror = () => { _xlsx = null; mal(new Error('No se pudo cargar el lector de Excel')); }; document.head.appendChild(s); }));
function admOferta() {
  const o = DB.estado.ofertaSemestre, d = ofertaActual();
  return `<section class="tarjeta pila" style="gap:10px"><h2>Oferta del semestre</h2>
    <p class="peq gris" style="margin:0">${o ? `Subida ${hace(o.f)}${o.archivo ? ' · ' + esc(o.archivo) : ''}` : 'La que venía con la app'} · ${d.grupos.length} grupos · ${d.profes.length} profesores</p>
    <p class="mini gris" style="margin:0">Sube el Excel con el mismo formato (Grupo, Clave, Materia, Modalidad, Nombre, TipoGrupo, HLunes, L_SalonGrupo…). Reemplaza los grupos de "Buscar mi grupo" y actualiza los profesores.</p>
    <label class="btn" style="cursor:pointer;align-self:flex-start">${icono('subir', 18)}Subir Excel<input type="file" accept=".xlsx,.xls,.csv" class="oculto" data-cambio="ofertaArchivo"></label>
    <div id="ofPrevia"></div></section>`;
}
CAMBIOS.ofertaArchivo = async el => {
  const f = el.files[0]; el.value = ''; if (!f) return; const caja = $('#ofPrevia'); caja.innerHTML = '<p class="peq gris">Leyendo…</p>';
  try {
    const X = await cargarXlsx(), wb = X.read(await f.arrayBuffer(), { type: 'array' }), filas = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: null });
    const data = ofDesdeFilas(filas), antes = new Set(ofertaActual().profes.map(p => DB.claveNombre(p[0]))), ahora = new Set(data.profes.map(p => DB.claveNombre(p[0])));
    const nuevos = data.profes.filter(p => !antes.has(DB.claveNombre(p[0]))), fuera = ofertaActual().profes.filter(p => !ahora.has(DB.claveNombre(p[0])));
    UI.ofNueva = { data, archivo: f.name, fuera };
    caja.innerHTML = `<div class="tarjeta pila" style="gap:8px;box-shadow:none;background:var(--suave)"><b>${esc(f.name)}</b><span class="peq">${data.grupos.length} grupos · ${data.profes.length} profesores</span>
      <span class="peq"><b>${nuevos.length}</b> profesores nuevos${nuevos.length ? ': ' + nuevos.slice(0, 6).map(p => esc(p[0])).join(', ') + (nuevos.length > 6 ? '…' : '') : ''}</span>
      <span class="peq"><b>${fuera.length}</b> ya no aparecen${fuera.length ? ': ' + fuera.slice(0, 6).map(p => esc(p[0])).join(', ') + (fuera.length > 6 ? '…' : '') : ''}</span>
      ${fuera.length ? `<label class="fila peq" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" id="ofQuitar" checked> Quitarlos del directorio (sus fichas y calificaciones en Rankings se quedan)</label>` : ''}
      <button class="btn" data-a="ofPublicar">Publicar esta oferta</button></div>`;
  } catch (e) { console.warn(e); caja.innerHTML = `<p class="peq" style="color:var(--malTxt)">${esc(e.message || 'No se pudo leer el archivo.')}</p>`; }
};
ACC.ofPublicar = () => {
  const N = UI.ofNueva; if (!N || !DB.esAdmin()) return;
  if (N.fuera.length && !$('#ofQuitar')?.checked) { const E = DB.estado; E.dirProfes = E.dirProfes || []; N.fuera.forEach(([nombre, materias]) => { if (!E.dirProfes.some(p => DB.claveNombre(p.nombre) === DB.claveNombre(nombre))) E.dirProfes.push({ id: uid('dp'), nombre, materias, carrera: '' }); }); }
  DB.estado.ofertaSemestre = { f: new Date().toISOString(), archivo: N.archivo, data: N.data }; UI.ofNueva = null;
  DB.guardar(); aviso('Oferta publicada'); refrescar();
};
