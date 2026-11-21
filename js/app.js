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
  const v = VISTAS[nombre] || VISTAS.inicio;
  if (v.soloAdmin && !DB.esAdmin()) { location.replace('#/inicio'); return; }
  const app = $('#app');
  if (nombre === 'bienvenida') { app.innerHTML = `<main id="vista" style="max-width:520px;margin:0 auto;padding:20px">${v.render(params)}</main>`; v.montar?.(params); return; }
  const titulo = typeof v.titulo === 'function' ? v.titulo(params) : v.titulo;
  const activo = v.nav || nombre, sinLeer = DB.sinLeerNotifs();
  const lado = NAV_LADO.concat(DB.esAdmin() ? [['admin', 'Administración', '#/admin']] : []);
  app.innerHTML = `<div class="shell">
    <aside class="lado"><a href="#/inicio" class="marca" style="text-decoration:none;color:inherit">${castor(36)}Cosas de la uni</a>
      <nav aria-label="Secciones">${lado.map(([k, t, h]) => `<a href="${h}" class="${k === activo ? 'activo' : ''}" ${k === activo ? 'aria-current="page"' : ''}>${icono(k === 'tienda' ? 'tienda' : k)}${t}</a>`).join('')}</nav>
      <p class="aviso-legal">Proyecto independiente, creado por y para estudiantes. No afiliado ni administrado por la universidad.</p></aside>
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
function avatar(id, grande = false) { const u = DB.usuario(id); const ini = (u?.usuario || '?')[0].toUpperCase(); const col = ['#DCE8FB:#174EAD', '#F3EFFA:#4B1F7A', '#FFF6DA:#6B4700', '#DCF5E3:#14632F'][(u?.usuario.charCodeAt(0) || 0) % 4].split(':'); return `<a class="avatar${grande ? ' g' : ''}" href="#/perfil/${esc(u?.usuario || '')}" style="background:${col[0]};color:${col[1]}" aria-label="Perfil de ${esc(nombreVisible(id))}">${esc(ini)}</a>`; }
function rangoReputacion(p) { return p >= 15 ? ['Diamante', 'linear-gradient(135deg,#0891B2,#67E8F9,#E0F2FE)'] : p >= 8 ? ['Oro', 'linear-gradient(135deg,#B45309,#F59E0B,#FDE68A)'] : p >= 4 ? ['Plata', 'linear-gradient(135deg,#64748B,#CBD5E1,#F8FAFC)'] : ['Bronce', 'linear-gradient(135deg,#92400E,#D97706,#FBBF24)']; }

document.addEventListener('DOMContentLoaded', () => { DB.cargar(); DB.alEntrar(); pintar(); });

/* actualiza solo el número de ramitas de la barra (lo usan los juegos dentro de un iframe) */
function actualizarChip() { const c = $('.chip-ramitas'); if (c && c.firstChild) c.firstChild.nodeValue = numero(DB.saldo()); }
