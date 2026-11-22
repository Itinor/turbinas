/* Mi horario: foto del horario y/o lista de clases. Por defecto solo lo ve el dueño; puede compartirlo con quien elija. */
'use strict';
const DIAS_H = [['lu', 'Lunes'], ['ma', 'Martes'], ['mi', 'Miércoles'], ['ju', 'Jueves'], ['vi', 'Viernes'], ['sa', 'Sábado']];
function diasDeClase(t) { const s = String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); return DIAS_H.filter(([k]) => new RegExp('\\b' + k).test(s)).map(([k]) => k); }
DB.puedeVerHorario = function (dueno, quien = DB.yo()?.id) { const u = DB.usuario(dueno); if (!u) return false; if (dueno === quien) return true; return u.horarioVis === 'elegidos' && (u.horarioCompartido || []).includes(quien); };

VISTAS.horario = {
  titulo: ([n]) => n ? 'Horario de @' + n : 'Mi horario', nav: 'perfil', get atras() { const n = ruta().params[0]; return n ? '#/perfil/' + n : '#/perfil'; },
  render([n]) {
    const yo = DB.yo(), u = n ? DB.porUsuario(n) : yo; if (!u) return '<p class="vacio">No encontramos ese horario.</p>';
    const mio = u.id === yo.id;
    if (!DB.puedeVerHorario(u.id)) return `<div class="tarjeta" style="text-align:center">${avatar(u.id, true)}<h2 style="margin-top:10px">@${esc(u.usuario)}</h2><p class="gris">Su horario es privado.</p></div>`;
    const foto = u.horarioFoto, clases = u.horario || [];
    const porDia = DIAS_H.map(([k, nombre]) => [nombre, clases.map((c, i) => ({ ...c, i })).filter(c => diasDeClase(c.dias).includes(k)).sort((a, b) => String(a.hora).localeCompare(String(b.hora)))]).filter(([, l]) => l.length);
    const sinDia = clases.map((c, i) => ({ ...c, i })).filter(c => !diasDeClase(c.dias).length);
    return `<div class="pila">
      <section class="tarjeta"><div class="entre"><h2>Foto del horario</h2>${mio ? `<label class="btn3" style="cursor:pointer;min-height:40px;padding:0 12px">${icono('camara', 16)}${foto ? 'Cambiar' : 'Subir'}<input type="file" accept="image/*,.pdf" class="oculto" data-cambio="fotoHorario"></label>` : ''}</div>
        ${foto ? (/pdf/.test(foto.mime || '') ? `<button class="adj-doc" style="margin-top:10px;max-width:none;width:100%" data-a="abrirAdjunto" data-c="${esc(foto.clave)}" data-n="${esc(foto.nombre)}">${icono('archivo', 26)}<b>${esc(foto.nombre)}</b></button>` : `<button class="adj-foto" style="max-width:none;width:100%;margin:10px 0 0" data-a="abrirAdjunto" data-c="${esc(foto.clave)}" data-n="${esc(foto.nombre)}" data-img="1" aria-label="Ver horario en grande"><img alt="Horario" data-idb="${esc(foto.clave)}" style="max-height:none;object-fit:contain"></button>`)
          + (mio ? `<button class="btn3" style="margin-top:8px;min-height:38px;color:var(--malTxt)" data-a="quitarFotoHorario">Quitar foto</button>` : '')
          : `<p class="peq gris" style="margin:6px 0 0">${mio ? 'Sube una foto o captura de tu horario.' : 'No ha subido foto.'}</p>`}</section>
      <section class="tarjeta"><h2 style="margin-bottom:8px">Clases de la semana</h2>
        ${porDia.map(([nombre, l]) => `<div style="margin-bottom:10px"><b class="peq" style="color:var(--moradoTxt)">${nombre}</b>${l.map(c => filaClase(c, mio)).join('')}</div>`).join('')}
        ${sinDia.map(c => filaClase(c, mio)).join('')}
        ${!clases.length ? `<p class="peq gris" style="margin:0">${mio ? 'Agrega tus clases y te las acomodamos por día.' : 'Sin clases registradas.'}</p>` : ''}
        ${mio ? `<form data-form="agregarClase" class="pila" style="gap:6px;margin-top:10px"><div class="rejilla2"><label class="oculto" for="hm">Materia</label><input id="hm" name="materia" required placeholder="Materia"><label class="oculto" for="hd">Días</label><input id="hd" name="dias" required placeholder="Lun y Mié"></div><div class="rejilla2"><label class="oculto" for="hh">Hora</label><input id="hh" name="hora" type="time" required><label class="oculto" for="hs">Salón</label><input id="hs" name="salon" placeholder="Salón (opcional)"></div><button class="btn2">Agregar clase</button></form>` : ''}</section>
      ${mio ? `<section class="tarjeta"><h2>¿Quién lo puede ver?</h2>
        <div class="pestanas" style="margin-top:8px"><button class="pastilla${u.horarioVis !== 'elegidos' ? ' on' : ''}" data-a="visHorario" data-v="yo">Solo yo</button><button class="pastilla${u.horarioVis === 'elegidos' ? ' on' : ''}" data-a="visHorario" data-v="elegidos">Personas que elijo</button></div>
        ${u.horarioVis === 'elegidos' ? `<div style="margin-top:10px">${(u.horarioCompartido || []).map(id => DB.usuario(id)).filter(Boolean).map(p => `<div class="entre" style="padding:6px 0;border-bottom:1px solid var(--linea)"><span class="fila" style="flex-wrap:nowrap">${avatar(p.id)}<span>@${esc(p.usuario)}</span></span><button class="icono-btn" data-a="dejarCompartir" data-u="${p.id}" aria-label="Quitar a @${esc(p.usuario)}">${icono('cerrar', 18)}</button></div>`).join('') || '<p class="peq gris" style="margin:0">Todavía no lo compartes con nadie.</p>'}
          <button class="btn3" style="margin-top:8px" data-a="elegirCompartir">${icono('mas', 16)}Elegir personas</button></div>` : ''}</section>` : ''}
    </div>`;
  },
  montar() { cargarArchivosTablon(); }
};
function filaClase(c, mio) { return `<div class="entre" style="padding:8px 10px;border-radius:12px;background:var(--suave);margin-top:6px"><span><b class="peq">${esc(c.hora || '')} · ${esc(c.materia)}</b><br><span class="mini gris">${esc(c.dias)}${c.salon ? ' · ' + esc(c.salon) : ''}</span></span>${mio ? `<button class="icono-btn" data-a="quitarClase" data-i="${c.i}" aria-label="Quitar ${esc(c.materia)}">${icono('cerrar', 18)}</button>` : ''}</div>`; }
CAMBIOS.fotoHorario = async el => {
  const f = el.files[0]; el.value = ''; if (!f) return; if (f.size > 10 * 1024 * 1024) return aviso('Máximo 10 MB.');
  try { const img = /^image\//.test(f.type), blob = img ? await reducirFoto(f, 2000) : f, clave = 'horario_' + uid('f'); await ARCHIVOS.guardar(clave, blob);
    DB.yo().horarioFoto = { clave, nombre: f.name.slice(0, 120), mime: blob.type || f.type }; DB.guardar(); aviso('Horario guardado'); refrescar(); }
  catch { aviso('No se pudo subir.'); }
};
ACC.quitarFotoHorario = () => { DB.yo().horarioFoto = null; DB.guardar(); refrescar(); };
ACC.visHorario = b => { DB.yo().horarioVis = b.dataset.v; DB.guardar(); refrescar(); };
ACC.dejarCompartir = b => { const u = DB.yo(); u.horarioCompartido = (u.horarioCompartido || []).filter(x => x !== b.dataset.u); DB.guardar(); refrescar(); };
ACC.elegirCompartir = () => {
  const u = DB.yo(), ya = new Set(u.horarioCompartido || []), gente = Object.values(DB.estado.usuarios).filter(p => p.id !== u.id && p.id !== 'u_equipo' && !p.suspendido).sort((a, b) => (u.amigos.includes(b.id) - u.amigos.includes(a.id)) || a.usuario.localeCompare(b.usuario));
  abrirHoja(`<form class="pila" data-form="compartirHorario"><h2>¿Con quién lo compartes?</h2><div class="pila" style="gap:4px;max-height:50vh;overflow:auto">${gente.map(p => `<label class="fila" style="flex-wrap:nowrap;padding:6px 4px;border-bottom:1px solid var(--linea)"><input type="checkbox" name="u_${p.id}" ${ya.has(p.id) ? 'checked' : ''}> ${avatar(p.id).replace('<a ', '<span ').replace('</a>', '</span>')}<span>@${esc(p.usuario)}${u.amigos.includes(p.id) ? ' <span class="mini gris">· amigo</span>' : ''}</span></label>`).join('')}</div><button class="btn ancho">Guardar</button></form>`);
};
FORMS.compartirHorario = d => { const u = DB.yo(), antes = new Set(u.horarioCompartido || []); u.horarioCompartido = Object.keys(d).filter(k => k.startsWith('u_')).map(k => k.slice(2)); u.horarioCompartido.filter(id => !antes.has(id)).forEach(id => notificar(id, `@${u.usuario} compartió su horario contigo`, '#/horario/' + u.usuario)); DB.guardar(); cerrarHoja(); aviso('Listo'); refrescar(); };
