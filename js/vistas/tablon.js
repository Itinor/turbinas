/* Tablón: trabajos, PDFs, fotos y notas, como un corcho; también en lista ordenada */
'use strict';
UI.tablon = { vista: 'corcho', filtro: 'todo' };
const COLORES_NOTA = { amarillo: '#FFF3A6', rosa: '#FFD6E0', azul: '#DCE8FB', verde: '#DCF5E3' };
const COLOR_CHINCHE = ['#E2453C', '#1D5FD1', '#FFC93C', '#4B1F7A', '#14632F'];
function giro(id) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0; return { r: ((h % 13) + 13) % 13 - 6, c: COLOR_CHINCHE[((h >> 3) % 5 + 5) % 5], dx: ((h >> 5) % 9 + 9) % 9 }; }
function pesoBonito(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

VISTAS.tablon = {
  titulo: ([id]) => { const t = id && DB.estado.tablones.find(x => x.id === id); return t ? t.nombre : 'Tablón'; },
  nav: 'tablon', get atras() { return ruta().params[0] ? '#/tablon' : null; },
  render([id]) {
    if (!id) return listaTablones();
    const t = DB.estado.tablones.find(x => x.id === id);
    if (!DB.tablonVisible(t)) return '<p class="vacio">Este tablón no existe o es de un grupo en el que no estás. <a href="#/tablon">Volver</a></p>';
    const U = UI.tablon, todos = DB.itemsTablon(id), items = todos.filter(x => U.filtro === 'todo' || x.tipo === U.filtro);
    const barra = `<div class="entre"><div class="pestanas" style="flex:1">${[['todo', 'Todo'], ['archivo', 'Archivos'], ['foto', 'Fotos'], ['nota', 'Notas']].map(([k, n]) => `<button class="pastilla${U.filtro === k ? ' on' : ''}" data-a="filtroTablon" data-f="${k}">${n}</button>`).join('')}</div>
      <button class="btn3" style="min-height:40px;padding:0 12px;flex:none" data-a="vistaTablon">${U.vista === 'corcho' ? 'Ver ordenado' : 'Ver tablón'}</button></div>`;
    const vacio = `<p class="peq" style="margin:auto;text-align:center;color:#3B2410;background:rgba(255,246,218,.85);padding:12px 16px;border-radius:12px">Todavía no hay nada aquí.<br>Toca el botón amarillo para fijar algo.</p>`;
    const cuerpo = U.vista === 'corcho' ? corcho(items, vacio) : `<div class="pila" style="gap:10px">${items.map(filaTablon).join('') || '<p class="vacio">Todavía no hay nada aquí.</p>'}</div>`;
    return `<div class="pila">${t.chat ? `<a class="insignia i-morado" style="align-self:flex-start;text-decoration:none" href="#/chat/${t.chat}">Tablón del grupo · solo lo ven sus integrantes</a>` : ''}${barra}${cuerpo}
      <button class="fab-tablon" data-a="nuevoEnTablon" data-t="${t.id}" aria-label="Fijar algo en el tablón">${icono('mas', 26)}</button></div>`;
  },
  montar() { cargarArchivosTablon(); }
};
function listaTablones() {
  const ts = DB.misTablones();
  return `<div class="pila"><button class="btn ancho" data-a="nuevoTablon">${icono('mas', 18)}Nuevo tablón</button>
    ${ts.map(t => { const n = DB.itemsTablon(t.id).length; return `<div class="tarjeta fila" style="flex-wrap:nowrap;padding:12px 14px"><a href="#/tablon/${t.id}" class="fila" style="flex:1;flex-wrap:nowrap;text-decoration:none;color:inherit"><span class="corcho-mini" aria-hidden="true">${icono('tablon', 20)}</span><span style="flex:1"><b>${esc(t.nombre)}</b><br><span class="mini gris">${t.chat ? 'Grupo · ' : ''}${n} ${n === 1 ? 'cosa fijada' : 'cosas fijadas'}</span></span></a>${t.id !== 'tb_general' ? botonEliminar('tablon', t.id) : ''}</div>`; }).join('')}</div>`;
}
function corcho(items, vacio) {
  const alto = { nota: 150, archivo: 190, foto: 215 }, cols = [12, 12]; let html = '';
  items.forEach(it => {
    const g = giro(it.id), c = cols[0] <= cols[1] ? 0 : 1, top = cols[c];
    cols[c] += alto[it.tipo] + 14;
    html += `<button class="pin-tablon tipo-${it.tipo}" style="left:calc(${c * 50}% + ${6 + g.dx}px);top:${top}px;transform:rotate(${g.r}deg);${it.tipo === 'nota' ? `background:${COLORES_NOTA[it.color] || COLORES_NOTA.amarillo}` : ''}" data-a="verTablonItem" data-id="${it.id}" aria-label="${esc(it.titulo || it.texto.slice(0, 40))}">
      <span class="chinche" style="background:${it.fijado ? '#E2453C' : g.c}"></span>${it.fijado ? '<span class="mini" style="position:absolute;right:6px;top:4px;font-weight:800;color:#B42318">FIJADO</span>' : ''}
      ${it.tipo === 'nota' ? `<span class="letra-nota">${esc(it.texto)}</span>`
        : it.tipo === 'foto' ? `<span class="foto-pin" data-idb="${esc(it.archivo.clave)}" data-como="fondo"></span><b class="peq" style="display:block;margin-top:6px">${esc(it.titulo || 'Foto')}</b>`
        : `<span class="doc-pin">${icono('archivo', 30)}<span class="mini" style="font-weight:800">${esc((it.archivo.nombre.split('.').pop() || '').toUpperCase().slice(0, 4))}</span></span><b class="peq" style="display:block;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.titulo || it.archivo.nombre)}</b>`}
      <span class="mini" style="color:#6B6280">@${esc(DB.usuario(it.autor)?.usuario || '')}</span></button>`;
  });
  return `<div class="corcho" style="height:${Math.max(560, Math.max(...cols) + 90)}px">${html || vacio}</div>`;
}
function filaTablon(it) {
  const quien = `@${esc(DB.usuario(it.autor)?.usuario || '')} · ${hace(it.fecha)}`;
  if (it.tipo === 'nota') return `<button class="tarjeta" style="text-align:left;border:0;background:${COLORES_NOTA[it.color] || COLORES_NOTA.amarillo}" data-a="verTablonItem" data-id="${it.id}">${it.fijado ? '<span class="mini" style="font-weight:800;color:#B42318">FIJADO · </span>' : ''}<b>${esc(it.texto)}</b><br><span class="mini gris">${quien}</span></button>`;
  return `<button class="tarjeta fila" style="flex-wrap:nowrap;text-align:left" data-a="verTablonItem" data-id="${it.id}">
    ${it.tipo === 'foto' ? `<span class="foto-pin" style="width:64px;height:64px;flex:none" data-idb="${esc(it.archivo.clave)}" data-como="fondo"></span>` : `<span class="doc-pin" style="width:52px;height:64px;flex:none">${icono('archivo', 22)}</span>`}
    <span style="flex:1;min-width:0">${it.fijado ? '<span class="mini" style="font-weight:800;color:#B42318">FIJADO · </span>' : ''}<b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.titulo || (it.tipo === 'foto' ? 'Foto' : it.archivo.nombre))}</b><span class="mini gris">${quien}${it.archivo?.peso ? ' · ' + pesoBonito(it.archivo.peso) : ''}</span></span></button>`;
}
/* los archivos viven en este celular (IndexedDB) hasta conectar el servidor */
async function cargarArchivosTablon() {
  for (const el of $$('[data-idb]')) {
    if (el.dataset.listo) continue; el.dataset.listo = '1';
    const blob = await ARCHIVOS.leer(el.dataset.idb).catch(() => null);
    if (!blob) { el.classList.add('sin-archivo'); el.textContent = 'Solo en el celular de quien lo subió'; continue; }
    const url = URL.createObjectURL(blob);
    if (el.dataset.como === 'fondo') el.style.backgroundImage = `url('${url}')`; else el.src = url;
  }
}
function reducirFoto(archivo, max = 1400) {
  return new Promise((ok, mal) => { const img = new Image(), url = URL.createObjectURL(archivo);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? ok(b) : mal(new Error('foto')), 'image/jpeg', 0.85); };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('foto')); }; img.src = url; });
}
ACC.filtroTablon = b => { UI.tablon.filtro = b.dataset.f; refrescar(); };
ACC.vistaTablon = () => { UI.tablon.vista = UI.tablon.vista === 'corcho' ? 'lista' : 'corcho'; refrescar(); };
ACC.nuevoTablon = () => abrirHoja(`<form class="pila" data-form="nuevoTablon"><h2>Nuevo tablón</h2><label class="oculto" for="ntb">Nombre</label><input id="ntb" name="nombre" required maxlength="50" placeholder="Ej. Física II · Grupo 3"><button class="btn ancho">Crear</button></form>`);
FORMS.nuevoTablon = d => { const r = DB.crearTablon(d.nombre); if (r.error) return aviso(r.error); cerrarHoja(); ir('#/tablon/' + r.ok.id); };
UI.nuevoTab = { tipo: 'archivo', color: 'amarillo' };
ACC.nuevoEnTablon = b => { UI.nuevoTab.tablon = b.dataset.t; UI.nuevoTab.archivo = null; hojaNuevoTablon(); };
function hojaNuevoTablon() {
  const N = UI.nuevoTab;
  abrirHoja(`<form class="pila" data-form="fijarTablon"><h2>Fijar en el tablón</h2>
    <div class="rejilla3">${[['archivo', 'Archivo'], ['foto', 'Foto'], ['nota', 'Nota']].map(([k, n]) => `<button type="button" class="pastilla${N.tipo === k ? ' on' : ''}" data-a="tipoTablon" data-t="${k}">${n}</button>`).join('')}</div>
    ${N.tipo === 'nota' ? `<label class="oculto" for="tnt">Nota</label><textarea id="tnt" name="texto" required maxlength="400" rows="4" placeholder="Ej. Entrega del reporte el viernes"></textarea>
      <div class="fila">${Object.entries(COLORES_NOTA).map(([k, c]) => `<button type="button" class="pastilla${N.color === k ? ' on' : ''}" style="${N.color === k ? '' : `background:${c}`}" data-a="colorTablon" data-c="${k}">${k}</button>`).join('')}</div>`
      : `<label class="tarjeta" style="border:2px dashed var(--linea);display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px;cursor:pointer;text-align:center">${icono(N.tipo === 'foto' ? 'camara' : 'subir', 28)}<b style="color:var(--moradoTxt)" id="tabArchivo">${N.archivo ? esc(N.archivo.nombre) : N.tipo === 'foto' ? 'Elegir foto' : 'Elegir archivo (PDF, Word, etc.)'}</b><span class="mini gris">Hasta 10 MB</span><input type="file" class="oculto" accept="${N.tipo === 'foto' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,image/*'}" data-cambio="archivoTablon"></label>
      <div><label class="campo" for="ttt">Título <span class="mini gris">(opcional)</span></label><input id="ttt" name="titulo" maxlength="80" placeholder="${N.tipo === 'foto' ? 'Lo que vimos el martes' : 'Práctica 4 · Ley de Ohm'}"></div>`}
    <button class="btn ancho">Fijar</button></form>`);
}
ACC.tipoTablon = b => { UI.nuevoTab.tipo = b.dataset.t; UI.nuevoTab.archivo = null; hojaNuevoTablon(); };
ACC.colorTablon = b => { UI.nuevoTab.color = b.dataset.c; const t = $('#tnt')?.value; hojaNuevoTablon(); if (t) $('#tnt').value = t; };
CAMBIOS.archivoTablon = async el => {
  const f = el.files[0]; if (!f) return; if (f.size > 10 * 1024 * 1024) return aviso('Máximo 10 MB.');
  const N = UI.nuevoTab, et = $('#tabArchivo'); if (et) et.textContent = 'Cargando…';
  try {
    const blob = N.tipo === 'foto' ? await reducirFoto(f) : f, clave = 'tab_' + uid('f');
    await ARCHIVOS.guardar(clave, blob);
    N.archivo = { clave, nombre: f.name.slice(0, 120), peso: blob.size, mime: blob.type || f.type };
    if (et) et.textContent = f.name;
  } catch { aviso('No pudimos leer ese archivo.'); if (et) et.textContent = 'Elegir de nuevo'; }
};
FORMS.fijarTablon = d => { const N = UI.nuevoTab; const r = DB.fijarEnTablon({ tablon: N.tablon, tipo: N.tipo, titulo: d.titulo, texto: d.texto, color: N.color, archivo: N.archivo }); if (r.error) return aviso(r.error); N.archivo = null; cerrarHoja(); aviso('Fijado'); refrescar(); };
ACC.verTablonItem = b => {
  const it = DB.estado.tablonItems.find(x => x.id === b.dataset.id); if (!it) return; const mio = it.autor === DB.yo().id || DB.esAdmin();
  abrirHoja(`<div class="pila"><span class="mini gris">@${esc(DB.usuario(it.autor)?.usuario || '')} · ${hace(it.fecha)}</span>
    ${it.tipo === 'nota' ? `<div style="background:${COLORES_NOTA[it.color] || COLORES_NOTA.amarillo};border-radius:14px;padding:16px;white-space:pre-wrap;font-size:17px">${esc(it.texto)}</div>`
      : it.tipo === 'foto' ? `<h2>${esc(it.titulo || 'Foto')}</h2><img alt="${esc(it.titulo || 'Foto del tablón')}" data-idb="${esc(it.archivo.clave)}" style="width:100%;border-radius:14px;background:var(--suave);min-height:120px">`
      : `<h2 style="overflow-wrap:anywhere">${esc(it.titulo || it.archivo.nombre)}</h2><p class="peq gris" style="margin:0">${esc(it.archivo.nombre)} · ${pesoBonito(it.archivo.peso)}</p>`}
    ${it.tipo !== 'nota' ? `<div class="rejilla2"><button class="btn2" data-a="abrirArchivoTablon" data-id="${it.id}">Abrir</button><button class="btn3" data-a="abrirArchivoTablon" data-id="${it.id}" data-bajar="1">${icono('descargar', 18)}Descargar</button></div>` : ''}
    <div class="fila">${mio ? `<button class="btn3" data-a="fijarArriba" data-id="${it.id}">${it.fijado ? 'Quitar de arriba' : 'Fijar arriba'}</button>` : ''}${it.autor !== DB.yo().id ? `<button class="btn3" style="color:var(--malTxt)" data-a="abrirReporte" data-tipo="tablon" data-ref="${it.id}">${icono('bandera', 16)}Reportar</button>` : ''}${botonEliminar('tablonItem', it.id)}</div></div>`);
  cargarArchivosTablon();
};
ACC.abrirArchivoTablon = async b => {
  const it = DB.estado.tablonItems.find(x => x.id === b.dataset.id), blob = it && await ARCHIVOS.leer(it.archivo.clave).catch(() => null);
  if (!blob) return aviso('Este archivo solo está en el celular de quien lo subió (hasta que conectemos el servidor).');
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
  if (b.dataset.bajar) a.download = it.archivo.nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
};
ACC.fijarArriba = b => { DB.fijarArriba(b.dataset.id); cerrarHoja(); refrescar(); };
