/* Arranque, navegación por rutas (#/ruta) y manejo de botones y formularios. */
'use strict';
const VISTAS = {};   // cada pantalla se registra aquí: VISTAS.nombre = { titulo, nav, atras, render(params), montar(params) }
const ACC = {};      // acciones de botones: data-a="nombre"
const FORMS = {};    // formularios: data-form="nombre"
const UI = {};       // estado temporal de las pantallas (pestaña elegida, etc.)

const NAV_MOVIL = [['inicio', 'Inicio', '#/inicio'], ['propuestas', 'Propuestas', '#/propuestas'], ['juegos', 'Juegos', '#/juegos'], ['chat', 'Chat', '#/chat'], ['perfil', 'Perfil', '#/perfil']];
const NAV_LADO = [['inicio', 'Inicio', '#/inicio'], ['explorar', 'Explorar', '#/explorar'], ['propuestas', 'Propuestas', '#/propuestas'], ['rankings', 'Rankings', '#/rankings'], ['agenda', 'Agenda', '#/agenda'], ['chat', 'Chat', '#/chat'], ['juegos', 'Juegos', '#/juegos'], ['herramientas', 'Herramientas', '#/herramientas'], ['tienda', 'Compraventa', '#/compraventa'], ['perfil', 'Perfil', '#/perfil']];

function ruta() { const h = location.hash.replace(/^#\/?/, '') || 'inicio'; const [nombre, ...params] = h.split('/').map(decodeURIComponent); return { nombre, params }; }
function ir(h) { if (location.hash === h) pintar(); else location.hash = h; }

function pintar() {
  if (!DB.yo() && CONFIG.entrarDirecto && DB.usuario(CONFIG.entrarDirecto) && !UI.salioManual) DB.entrar(CONFIG.entrarDirecto);
  const yo = DB.yo(); let { nombre, params } = ruta();
  if (!yo && nombre !== 'bienvenida') { location.replace('#/bienvenida'); return; }
  if (yo && nombre === 'bienvenida' && UI.reg.paso !== 3) { location.replace('#/inicio'); return; }
  if (yo?.suspendido) { $('#app').innerHTML = `<main id="vista" style="max-width:480px;margin:40px auto;padding:20px;text-align:center">${castor(80)}<h1 style="margin-top:12px">Tu cuenta está suspendida</h1><p class="gris">Si crees que es un error, escribe al equipo de Cosas de la uni.</p><button class="btn3" data-a="cerrarSesion">Cerrar sesión</button></main>`; return; }
  const v = VISTAS[nombre] || VISTAS.inicio;
  if (v.soloAdmin && !DB.esAdmin()) { location.replace('#/inicio'); return; }
  const app = $('#app');
  if (nombre === 'bienvenida') { app.innerHTML = `<main id="vista" style="max-width:520px;margin:0 auto;padding:20px">${v.render(params)}</main>`; v.montar?.(params); return; }
  const titulo = typeof v.titulo === 'function' ? v.titulo(params) : v.titulo;
  const activo = v.nav || nombre, sinLeer = DB.sinLeerNotifs();
  const lado = NAV_LADO.concat(DB.esAdmin() ? [['admin', 'Administración', '#/admin']] : []);
  app.innerHTML = `<div class="shell">
    <aside class="lado${UI.ladoContraido ? ' contraido' : ''}"><div class="marca"><a href="#/inicio" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;min-width:0">${castor(36)}<span class="txt">Cosas de la uni</span></a><button class="icono-btn plegar" data-a="plegarLado" aria-label="${UI.ladoContraido ? 'Expandir' : 'Contraer'} menú" title="${UI.ladoContraido ? 'Expandir' : 'Contraer'} menú">${icono(UI.ladoContraido ? 'mas' : 'atras', 18)}</button></div>
      <nav aria-label="Secciones">${lado.map(([k, t, h]) => `<a href="${h}" class="${k === activo ? 'activo' : ''}" ${k === activo ? 'aria-current="page"' : ''} title="${t}">${icono(k === 'tienda' ? 'tienda' : k)}<span class="txt">${t}</span></a>`).join('')}</nav></aside>
    <div class="principal">
      <header class="barra">
        ${v.atras ? `<a class="icono-btn" href="${v.atras}" aria-label="Volver">${icono('atras')}</a>` : `<span class="lado-movil" style="display:flex">${castor(34)}</span>`}
        <h1 class="titulo">${esc(titulo || 'Cosas de la uni')}</h1>
        <a class="chip-ramitas" href="#/ramitas" aria-label="Tus ramitas">${numero(DB.saldo())}<span class="oculto"> ramitas</span>${icono('rayo', 15)}</a>
        <a class="icono-btn campana" href="#/notificaciones" aria-label="Notificaciones${sinLeer ? ', ' + sinLeer + ' sin leer' : ''}">${icono('campana')}${sinLeer ? `<span class="punto">${sinLeer > 9 ? '9+' : sinLeer}</span>` : ''}</a>
      </header>
      <main id="vista">${v.render(params)}</main>
    </div>
    <nav class="abajo" aria-label="Navegación principal">${NAV_MOVIL.map(([k, t, h]) => `<a href="${h}" class="${k === activo ? 'activo' : ''}" ${k === activo ? 'aria-current="page"' : ''}>${icono(k)}${t}</a>`).join('')}</nav>
  </div>`;
  v.montar?.(params);
}
/* Vuelve a dibujar solo el contenido (sin perder el scroll) */
function refrescar() { const y = scrollY; pintar(); scrollTo(0, y); }

document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const f = ACC[b.dataset.a]; if (!f) return; e.preventDefault(); f(b, e);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  const fn = FORMS[f.dataset.form]; if (fn) fn(Object.fromEntries(new FormData(f)), f);
});
window.addEventListener('hashchange', () => { cerrarHoja(); detenerTemporizadores(); pintar(); scrollTo(0, 0); });

/* temporizadores de juegos que se apagan al salir de la pantalla */
const TEMPS = new Set();
function temporizador(fn, ms) { const t = setInterval(fn, ms); TEMPS.add(t); return t; }
function detenerTemporizadores() { TEMPS.forEach(clearInterval); TEMPS.clear(); }

/* pantalla de "necesitas verificarte" reutilizable */
function pedirVerificacion() {
  abrirHoja(`<h2>Confirma que eres estudiante</h2><p class="gris">Para votar, opinar de profes y usar ramitas en predicciones necesitas verificarte. Toma un minuto con tu correo de la uni.</p>
    <div class="pila"><a class="btn ancho" href="#/verificar">Verificarme</a><button class="btn3 ancho" data-a="cerrarHoja">Ahora no</button></div>`);
}
ACC.cerrarHoja = () => cerrarHoja();

/* utilidades de vista */
function nombreVisible(id) { const u = DB.usuario(id); if (!u) return 'Alguien'; return '@' + u.usuario; }
function subNombre(id) { const u = DB.usuario(id); if (!u) return ''; return (DB.verNombreReal(id) ? u.nombre + ' · ' : '') + u.carrera + (u.gen ? ' · Gen ' + u.gen : ''); }
function avatar(id, grande = false) { const u = DB.usuario(id); const ini = (u?.usuario || '?')[0].toUpperCase(); const col = ['#DCE8FB:#174EAD', '#F3EFFA:#4B1F7A', '#FFF6DA:#6B4700', '#DCF5E3:#14632F'][(u?.usuario.charCodeAt(0) || 0) % 4].split(':'); const foto = u?.foto && /^data:image\/(jpeg|png|webp);base64,/.test(u.foto) ? u.foto : null; return `<a class="avatar${grande ? ' g' : ''}" href="#/perfil/${esc(u?.usuario || '')}" style="${foto ? `background:#DDD6EA url('${foto}') center/cover` : `background:${col[0]};color:${col[1]}`}" aria-label="Perfil de ${esc(nombreVisible(id))}">${foto ? '' : esc(ini)}</a>`; }
function rangoReputacion(p) { return p >= 15 ? ['Diamante', 'linear-gradient(135deg,#0891B2,#67E8F9,#E0F2FE)'] : p >= 8 ? ['Oro', 'linear-gradient(135deg,#B45309,#F59E0B,#FDE68A)'] : p >= 4 ? ['Plata', 'linear-gradient(135deg,#64748B,#CBD5E1,#F8FAFC)'] : ['Bronce', 'linear-gradient(135deg,#92400E,#D97706,#FBBF24)']; }

document.addEventListener('DOMContentLoaded', () => { DB.cargar(); DB.alEntrar(); pintar(); });

/* actualiza solo el número de ramitas de la barra (lo usan los juegos dentro de un iframe) */
function actualizarChip() { const c = $('.chip-ramitas'); if (c && c.firstChild) c.firstChild.nodeValue = numero(DB.saldo()); }

/* Eliminar con confirmación: data-a="eliminar" data-tipo="post|propuesta|ranking|venta|nivel|evento|lugar|comentario" data-id data-extra */
const NOMBRE_TIPO = { profe: 'a este profesor y todas sus opiniones', opinion: 'esta opinión', post: 'esta publicación', comentario: 'este comentario', propuesta: 'esta propuesta', ranking: 'este ranking', venta: 'esta publicación de compraventa', nivel: 'este nivel', evento: 'este evento', lugar: 'este lugar del mapa' };
ACC.eliminar = b => abrirHoja(`<h2>¿Eliminar ${NOMBRE_TIPO[b.dataset.tipo] || 'esto'}?</h2><p class="gris">${b.dataset.tipo === 'propuesta' && DB.conRamitas(b.dataset.id) ? 'Tiene ramitas apostadas: a cada quien se le devuelve lo que puso y les llega aviso. ' : ''}No se puede deshacer.</p><div class="pila"><button class="btn-peligro ancho" data-a="confirmarEliminar" data-tipo="${b.dataset.tipo}" data-id="${b.dataset.id}" data-extra="${b.dataset.extra || ''}">Sí, eliminar</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);
ACC.confirmarEliminar = b => { const ok = DB.eliminar(b.dataset.tipo, b.dataset.id, b.dataset.extra); cerrarHoja(); aviso(ok ? 'Eliminado' : 'No tienes permiso para eliminar esto'); refrescar(); };
function botonEliminar(tipo, id, extra = '') { return DB.puedeEliminar(tipo, id) || (tipo === 'lugar' || tipo === 'evento' || tipo === 'comentario') && DB.esAdmin() ? `<button class="icono-btn" style="color:var(--malTxt)" data-a="eliminar" data-tipo="${tipo}" data-id="${esc(id)}" data-extra="${extra}" aria-label="Eliminar">${icono('basura', 18)}</button>` : ''; }

try { UI.ladoContraido = localStorage.getItem('cdu_lado') === '1'; } catch {}
ACC.plegarLado = () => { UI.ladoContraido = !UI.ladoContraido; try { localStorage.setItem('cdu_lado', UI.ladoContraido ? '1' : '0'); } catch {} pintar(); };
