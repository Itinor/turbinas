'use strict';
const VISTAS = {};
const ACC = {};
const FORMS = {};
const UI = {};

const NAV_MOVIL = [['inicio', 'Inicio', '#/inicio'], ['propuestas', 'Propuestas', '#/propuestas'], ['juegos', 'Juegos', '#/juegos'], ['chat', 'Chat', '#/chat'], ['perfil', 'Perfil', '#/perfil']];
const NAV_LADO = [['inicio', 'Inicio', '#/inicio'], ['explorar', 'Explorar', '#/explorar'], ['propuestas', 'Propuestas', '#/propuestas'], ['rankings', 'Rankings', '#/rankings'], ['agenda', 'Agenda', '#/agenda'], ['chat', 'Chat', '#/chat'], ['juegos', 'Juegos', '#/juegos'], ['herramientas', 'Herramientas', '#/herramientas'], ['tienda', 'Compraventa', '#/compraventa'], ['tablon', 'Tablón', '#/tablon'], ['amigos', 'Amigos', '#/amigos'], ['perfil', 'Perfil', '#/perfil']];

function ruta() { const h = location.hash.replace(/^#\/?/, '') || 'inicio'; const [nombre, ...params] = h.split('/').map(decodeURIComponent); return { nombre, params }; }
function ir(h) { if (location.hash === h) pintar(); else location.hash = h; }

function pintar() {
  if (!DB.yo() && CONFIG.entrarDirecto && DB.usuario(CONFIG.entrarDirecto) && !UI.salioManual) DB.entrar(CONFIG.entrarDirecto);
  const yo = DB.yo(); let { nombre, params } = ruta();
  if (!yo && nombre !== 'bienvenida') { location.replace('#/bienvenida'); return; }
  if (yo && nombre === 'bienvenida' && UI.reg.paso !== 3) { location.replace('#/inicio'); return; }
  if (yo?.suspendido) { $('#app').innerHTML = `<main id="vista" style="max-width:480px;margin:40px auto;padding:20px;text-align:center">${castor(80)}<h1 style="margin-top:12px">Tu cuenta está suspendida</h1><p class="gris">Si crees que es un error, escribe al equipo de Itinor.</p><button class="btn3" data-a="cerrarSesion">Cerrar sesión</button></main>`; return; }
  const v = VISTAS[nombre] || VISTAS.inicio;
  if (v.soloAdmin && !DB.esAdmin()) { location.replace('#/inicio'); return; }
  const app = $('#app');
  if (nombre === 'bienvenida') { app.innerHTML = `<main id="vista" style="max-width:520px;margin:0 auto;padding:20px">${v.render(params)}</main>`; v.montar?.(params); return; }
  const titulo = typeof v.titulo === 'function' ? v.titulo(params) : v.titulo;
  const activo = v.nav || nombre, sinLeer = DB.sinLeerNotifs();
  const lado = NAV_LADO.concat(DB.esAdmin() ? [['admin', 'Administración', '#/admin']] : [], [['pregunta', 'Ayuda', '#/ayuda']]);
  app.innerHTML = `<div class="shell">
    <aside class="lado${UI.ladoContraido ? ' contraido' : ''}"><div class="marca"><a href="#/inicio" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;min-width:0">${castor(36)}<span class="txt">Itinor</span></a><button class="icono-btn plegar" data-a="plegarLado" aria-label="${UI.ladoContraido ? 'Expandir' : 'Contraer'} menú" title="${UI.ladoContraido ? 'Expandir' : 'Contraer'} menú">${icono('menu', 22)}</button></div>
      <nav aria-label="Secciones">${lado.map(([k, t, h]) => `<a href="${h}" class="${k === activo ? 'activo' : ''}" ${k === activo ? 'aria-current="page"' : ''} title="${t}">${icono(k === 'tienda' ? 'tienda' : k)}<span class="txt">${t}</span></a>`).join('')}</nav></aside>
    <div class="principal">
      <header class="barra">
        ${v.atras ? `<a class="icono-btn" href="${v.atras}" aria-label="Volver">${icono('atras')}</a>` : `<span class="lado-movil" style="display:flex">${castor(34)}</span>`}
        <h1 class="titulo">${esc(titulo || 'Itinor')}</h1>
        <span class="chip-ramitas" aria-label="Tus ramitas">${numero(DB.saldo())}<span class="oculto"> ramitas</span>${icono('rayo', 15)}</span>
        <a class="icono-btn campana" href="#/notificaciones" aria-label="Notificaciones${sinLeer ? ', ' + sinLeer + ' sin leer' : ''}">${icono('campana')}${sinLeer ? `<span class="punto">${sinLeer > 9 ? '9+' : sinLeer}</span>` : ''}</a>
      </header>
      <main id="vista">${v.render(params)}</main>
    </div>
    ${miniReproductor()}
    <nav class="abajo" aria-label="Navegación principal">${NAV_MOVIL.map(([k, t, h]) => `<a href="${h}" class="${k === activo ? 'activo' : ''}" ${k === activo ? 'aria-current="page"' : ''}>${icono(k)}${t}</a>`).join('')}</nav>
  </div>`;
  v.montar?.(params);
}

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

const TEMPS = new Set();
function temporizador(fn, ms) { const t = setInterval(fn, ms); TEMPS.add(t); return t; }
function detenerTemporizadores() { TEMPS.forEach(clearInterval); TEMPS.clear(); }

function pedirVerificacion() {
  abrirHoja(`<h2>Confirma que eres estudiante</h2><p class="gris">Para votar, opinar de profes y usar ramitas en predicciones necesitas verificarte. Toma un minuto con tu correo de la uni.</p>
    <div class="pila"><a class="btn ancho" href="#/verificar">Verificarme</a><button class="btn3 ancho" data-a="cerrarHoja">Ahora no</button></div>`);
}
ACC.cerrarHoja = () => cerrarHoja();
ACC.agregarOpcion = b => { const l = b.parentElement.querySelector('.lista-opciones'), n = l.querySelectorAll('input').length; if (n >= MAX_OPCIONES) return aviso(`Máximo ${MAX_OPCIONES} opciones.`); l.insertAdjacentHTML('beforeend', inputOpcion(b.dataset.pref, n)); l.querySelector(`#${b.dataset.pref}${n}`).focus(); if (n + 1 >= MAX_OPCIONES) b.remove(); };

function nombreVisible(id) { const u = DB.usuario(id); if (!u) return 'Alguien'; return '@' + u.usuario; }
function subNombre(id) { const u = DB.usuario(id); if (!u) return ''; return (DB.verNombreReal(id) ? u.nombre + ' · ' : '') + u.carrera + (u.gen ? ' · Gen ' + u.gen : ''); }
function avatar(id, grande = false) { const u = DB.usuario(id); const ini = (u?.usuario || '?')[0].toUpperCase(); const col = ['#DCE8FB:#174EAD', '#F3EFFA:#4B1F7A', '#FFF6DA:#6B4700', '#DCF5E3:#14632F'][(u?.usuario.charCodeAt(0) || 0) % 4].split(':'); const foto = u?.foto && /^data:image\/(jpeg|png|webp);base64,/.test(u.foto) ? u.foto : null; return `<a class="avatar${grande ? ' g' : ''}" href="#/perfil/${esc(u?.usuario || '')}" style="${foto ? `background:#DDD6EA url('${foto}') center/cover` : `background:${col[0]};color:${col[1]}`}" aria-label="Perfil de ${esc(nombreVisible(id))}">${foto ? '' : esc(ini)}</a>`; }
function rangoReputacion(p) { return p >= 15 ? ['Diamante', 'linear-gradient(135deg,#0891B2,#67E8F9,#E0F2FE)'] : p >= 8 ? ['Oro', 'linear-gradient(135deg,#B45309,#F59E0B,#FDE68A)'] : p >= 4 ? ['Plata', 'linear-gradient(135deg,#64748B,#CBD5E1,#F8FAFC)'] : ['Bronce', 'linear-gradient(135deg,#92400E,#D97706,#FBBF24)']; }

document.addEventListener('DOMContentLoaded', () => { DB.cargar(); DB.alEntrar(); pintar(); SYNC.iniciar(); });

let _llaveDe = null; setInterval(() => { const id = DB.yo()?.id || null, f = DB.yo()?.cripto?.pub?.x || ''; if (id + f === _llaveDe) return; _llaveDe = id + f; CRIPTO.iniciar().then(() => { if (location.hash.startsWith('#/chat')) refrescar(); }); }, 400);

function actualizarChip() { const c = $('.chip-ramitas'); if (c && c.firstChild) c.firstChild.nodeValue = numero(DB.saldo()); }

const NOMBRE_TIPO = { tablonItem: 'esto del tablón', tablon: 'este tablón y todo lo que tiene', profe: 'a este profesor y todas sus opiniones', opinion: 'esta opinión', post: 'esta publicación', comentario: 'este comentario', propuesta: 'esta propuesta', ranking: 'este ranking', venta: 'esta publicación de compraventa', nivel: 'este nivel', evento: 'este evento', lugar: 'este lugar del mapa' };
ACC.eliminar = b => abrirHoja(`<h2>¿Eliminar ${NOMBRE_TIPO[b.dataset.tipo] || 'esto'}?</h2><p class="gris">${b.dataset.tipo === 'propuesta' && DB.conRamitas(b.dataset.id) ? 'Tiene ramitas apostadas: a cada quien se le devuelve lo que puso y les llega aviso. ' : ''}No se puede deshacer.</p><div class="pila"><button class="btn-peligro ancho" data-a="confirmarEliminar" data-tipo="${b.dataset.tipo}" data-id="${b.dataset.id}" data-extra="${b.dataset.extra || ''}">Sí, eliminar</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);
ACC.confirmarEliminar = b => { const ok = DB.eliminar(b.dataset.tipo, b.dataset.id, b.dataset.extra); cerrarHoja(); aviso(ok ? 'Eliminado' : 'No tienes permiso para eliminar esto'); refrescar(); };
function botonEliminar(tipo, id, extra = '') { return DB.puedeEliminar(tipo, id) || (tipo === 'lugar' || tipo === 'evento' || tipo === 'comentario') && DB.esAdmin() ? `<button class="icono-btn" style="color:var(--malTxt)" data-a="eliminar" data-tipo="${tipo}" data-id="${esc(id)}" data-extra="${extra}" aria-label="Eliminar">${icono('basura', 18)}</button>` : ''; }

try { UI.ladoContraido = localStorage.getItem('cdu_lado') === '1'; } catch {}
ACC.plegarLado = () => { UI.ladoContraido = !UI.ladoContraido; try { localStorage.setItem('cdu_lado', UI.ladoContraido ? '1' : '0'); } catch {} pintar(); };

const REPRO = {
  audio: null, src: null, cancion: null, dueno: null, cola: [], modo: (() => { try { return localStorage.getItem('cdu_modo') || 'aleatorio'; } catch { return 'aleatorio'; } })(),

  bolsa: [],
  ordenada() { const c = this.cola.slice(); if (this.modo === 'subida') c.sort((a, b) => String(a.agregada || '').localeCompare(String(b.agregada || ''))); return c; },
  siguiente(auto) { const c = this.ordenada(); if (!c.length) return; let i = c.findIndex(x => x.archivo === this.src);
    if (this.modo === 'aleatorio' && c.length > 1) {

      this.bolsa = this.bolsa.filter(a => c.some(x => x.archivo === a) && a !== this.src);
      if (!this.bolsa.length) { this.bolsa = c.map(x => x.archivo).filter(a => a !== this.src); for (let k = this.bolsa.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [this.bolsa[k], this.bolsa[j]] = [this.bolsa[j], this.bolsa[k]]; } }
      const sig = this.bolsa.shift(); i = c.findIndex(x => x.archivo === sig);
    } else i = (i + 1) % c.length;
    const sig = c[i]; if (c.length === 1) { this.audio.currentTime = 0; this.audio.play().catch(() => {}); return; } this.src = null; this.alternar(sig, this.dueno, auto); },
  cambiarModo() { const m = ['aleatorio', 'orden', 'subida', 'repetir']; this.modo = m[(Math.max(0, m.indexOf(this.modo)) + 1) % 4]; try { localStorage.setItem('cdu_modo', this.modo); } catch {} if (this.audio) this.audio.loop = this.modo === 'repetir'; this.pintarMini(); aviso(NOMBRE_MODO[this.modo]); },
  sonando(src) { return !!(this.audio && !this.audio.paused && (!src || this.src === src)); },
  fondo: false,
  async alternar(cancion, dueno, auto, fondo) {
    if (this.audio && this.src === cancion.archivo) { if (this.audio.paused) this.audio.play().catch(() => {}); else this.audio.pause(); return; }
    let real = cancion.archivo;
    if (real.startsWith('idb:')) { const blob = await ARCHIVOS.leer(real.slice(4)).catch(() => null); if (!blob) { if (!auto) aviso('Esta canción solo está guardada en el celular de quien la subió.'); return; } real = URL.createObjectURL(blob);
      if (!cancion.portada && typeof extraerPortada === 'function') extraerPortada(blob).then(p => { if (!p) return; cancion.portada = p; DB.guardar(); $$('[data-vinilo]').forEach(v => { if (v.dataset.vinilo === cancion.archivo) { const e = v.querySelector('.etiqueta-disco'); if (e) e.style.background = `#4B1F7A url('${p}') center/cover`; } }); }).catch(() => {}); }
    this.parar(true);
    const a = new Audio(real); a.loop = this.modo === 'repetir'; this.audio = a; this.fondo = !!fondo; this.src = cancion.archivo; this.cancion = cancion; this.dueno = dueno;
    this.cola = (DB.usuario(dueno) ? DB.canciones(DB.usuario(dueno)) : [cancion]).filter(c => c.archivo); if (!this.cola.some(c => c.archivo === cancion.archivo)) this.cola.unshift(cancion);
    a.addEventListener('play', () => this.marcar()); a.addEventListener('pause', () => this.marcar()); a.addEventListener('ended', () => this.siguiente(true)); a.addEventListener('timeupdate', () => this.progreso()); a.addEventListener('loadedmetadata', () => this.progreso());
    this.ajustarVolumen();
    a.play().then(() => { this.pintarMini(); DB.registrarEscucha(dueno, cancion.archivo, cancion.titulo); }).catch(() => { if (!auto) aviso('No se pudo reproducir la canción'); });
  },
  parar(silencioso) { if (this.audio) { this.audio.pause(); if (this.audio.src.startsWith('blob:')) URL.revokeObjectURL(this.audio.src); } this.audio = null; this.src = null; this.cancion = null; this.dueno = null; this.fondo = false; if (!silencioso) { this.marcar(); this.pintarMini(); } },

  ajustarVolumen() { if (!this.audio) return; const u = DB.usuario(this.dueno), r = ruta(); const enSuPerfil = r.nombre === 'perfil' && ((r.params[0] && u && r.params[0] === u.usuario) || (!r.params[0] && this.dueno === DB.yo()?.id)); this.audio.volume = enSuPerfil && !this.fondo ? 1 : 0.35; },
  progreso() { const a = this.audio, b = $('#miniBarra'), t = $('#miniTiempo'); if (!a || !b) return; const d = a.duration || 0, p = d ? a.currentTime / d : 0; b.style.width = (p * 100).toFixed(1) + '%'; if (t) t.textContent = d ? `${minSeg(a.currentTime)} / ${minSeg(d)}` : ''; },
  marcar() { const on = this.sonando(); $$('[data-vinilo]').forEach(v => v.classList.toggle('girando', on && v.dataset.vinilo === this.src)); $$('[data-repro]').forEach(b => b.innerHTML = icono(on && b.dataset.repro === this.src ? 'pausa' : 'play', b.classList.contains('mini-btn') ? 18 : 20)); const m = $('#miniRepro'); if (m) m.classList.toggle('pausado', !on); },
  pintarMini() { const m = $('#miniRepro'), html = miniReproductor(); if (m) m.outerHTML = html; else if (html) $('.principal')?.insertAdjacentHTML('beforeend', html); }
};
function miniReproductor() {
  const R = REPRO; if (!R.audio || !R.cancion) return '';
  const c = R.cancion, ok = c.portada && /^data:image\/(jpeg|png|webp);base64,/.test(c.portada), u = DB.usuario(R.dueno);
  return `<div id="miniRepro" class="mini-repro${R.sonando() ? '' : ' pausado'}" role="region" aria-label="Reproductor">
    <span class="vinilo chico${R.sonando() ? ' girando' : ''}" data-vinilo="${esc(R.src)}" aria-hidden="true"><span class="etiqueta-disco" style="${ok ? `background:#4B1F7A url('${c.portada}') center/cover` : ''}"></span></span>
    <a href="${u ? '#/perfil/' + esc(u.usuario) : '#/perfil'}" style="flex:1;min-width:0;text-decoration:none;color:inherit"><b class="peq" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.titulo || 'Canción')}</b><span class="mini" style="opacity:.75">${u ? '@' + esc(u.usuario) : ''}${c.artista ? ' · ' + esc(c.artista) : ''} <span id="miniTiempo"></span></span></a>
    <button class="icono-btn" data-a="miniModo" aria-label="Modo: ${NOMBRE_MODO[R.modo]}" title="${NOMBRE_MODO[R.modo]}" style="${R.modo === 'repetir' ? 'color:#FFC93C' : ''}">${icono(ICONO_MODO[R.modo] || 'aleatorio', 18)}</button>
    <button class="icono-btn mini-btn" data-repro="${esc(R.src)}" data-a="miniPlay" aria-label="Reproducir o pausar">${icono(R.sonando() ? 'pausa' : 'play', 18)}</button>
    ${R.cola.length > 1 ? `<button class="icono-btn" data-a="miniSiguiente" aria-label="Siguiente canción">${icono('siguiente', 18)}</button>` : ''}
    <button class="icono-btn" data-a="miniCerrar" aria-label="Cerrar reproductor">${icono('cerrar', 18)}</button>
    <span class="mini-pista" data-a="miniBuscar" role="slider" aria-label="Avance de la canción" tabindex="0"><span id="miniBarra"></span></span></div>`;
}
ACC.miniPlay = () => { if (REPRO.audio) REPRO.audio.paused ? REPRO.audio.play().catch(() => {}) : REPRO.audio.pause(); };
ACC.miniCerrar = () => REPRO.parar();
window.addEventListener('hashchange', () => setTimeout(() => {

  if (REPRO.fondo) { const r = ruta(), u = DB.usuario(REPRO.dueno); if (!(r.nombre === 'perfil' && u && r.params[0] === u.usuario)) REPRO.parar(); }
  REPRO.ajustarVolumen(); }, 0));
ACC.miniModo = () => REPRO.cambiarModo();
ACC.miniSiguiente = () => REPRO.siguiente();

(() => { const actual = (document.querySelector('script[src*="app.js?v="]')?.src.match(/v=(\d+)/) || [])[1]; if (!actual) return;
  const revisar = () => fetch('index.html', { cache: 'no-store' }).then(r => r.text()).then(t => { const v = (t.match(/app\.js\?v=(\d+)/) || [])[1]; if (v && v > actual && !document.getElementById('aviso-version')) document.body.insertAdjacentHTML('beforeend', `<button id="aviso-version" class="aviso-version" onclick="ACC.actualizarApp()">Hay una versión nueva · toca para actualizar</button>`); }).catch(() => {});
  setTimeout(revisar, 3000); setInterval(revisar, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) revisar(); }); })();
ACC.actualizarApp = () => { const u = new URL(location.href); u.searchParams.set('v', Date.now()); location.replace(u.pathname + u.search + location.hash); };

(() => { let t = null; addEventListener('scroll', () => { document.documentElement.classList.add('desplazando'); clearTimeout(t); t = setTimeout(() => document.documentElement.classList.remove('desplazando'), 900); }, { capture: true, passive: true }); })();

const NOMBRE_MODO = { aleatorio: 'Aleatorio', orden: 'En el orden que elegiste', subida: 'En el orden en que se subieron', repetir: 'Repetir esta canción' };
const ICONO_MODO = { aleatorio: 'aleatorio', orden: 'orden', subida: 'subir', repetir: 'repetir' };
function minSeg(s) { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
ACC.miniBuscar = (b, e) => { const a = REPRO.audio; if (!a || !a.duration) return; const r = b.getBoundingClientRect(), x = ((e?.clientX ?? r.left) - r.left) / r.width; a.currentTime = Math.max(0, Math.min(1, x)) * a.duration; REPRO.progreso(); };
