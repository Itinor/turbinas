/* Compraventa entre estudiantes con control de quién ve cada publicación */
'use strict';
UI.cvFiltro = 'todo'; UI.cvVis = 'todos'; UI.cvTipo = 'venta';
const VIS = { todos: ['mundo', 'Todos', 'Cualquier estudiante de la red'], amigos: ['grupo', 'Solo amigos', 'Tus amigos en Itinor'], elegidos: ['candado', 'Personas que elijas', 'Solo quien tú agregues'] };
VISTAS.compraventa = {
  titulo: 'Compraventa', nav: 'tienda', atras: '#/explorar',
  render() {
    const f = UI.cvFiltro, lista = DB.estado.ventas.filter(v => DB.ventaVisible(v) && (f === 'todo' || v.tipo === f)).sort((a, b) => b.fecha.localeCompare(a.fecha));
    return `<div class="pila"><div class="entre"><div class="pestanas">${[['todo', 'Todo'], ['venta', 'Venta'], ['intercambio', 'Intercambio'], ['regalo', 'Regalo']].map(([k, t]) => `<button class="pastilla${f === k ? ' on' : ''}" data-a="cvFiltro" data-f="${k}">${t}</button>`).join('')}</div></div>
      <button class="btn ancho" data-a="cvPublicar">${icono('mas', 18)}Publicar algo</button>
      <div class="rejilla2">${lista.map(v => { const [ic, t] = VIS[v.vis]; const mio = v.autor === DB.yo().id;
        return `<article class="tarjeta pila" style="gap:6px;padding:12px"><b style="line-height:1.25">${esc(v.titulo)}</b>
          <b style="font-family:Sora,sans-serif;font-size:18px;color:${v.tipo === 'venta' ? 'inherit' : 'var(--moradoTxt)'}">${v.tipo === 'venta' ? '$' + numero(v.precio) : v.tipo === 'intercambio' ? 'Intercambio' : 'Regalo'}</b>
          <span class="entre"><span class="mini gris" style="display:flex;align-items:center;gap:4px">${icono(ic, 13)}${t} · ${esc(nombreVisible(v.autor))}</span>${botonEliminar('venta', v.id)}</span>
          ${mio ? `<button class="btn3" data-a="cvVendido" data-id="${v.id}">${v.estado === 'vendido' ? 'Volver a publicar' : 'Ya se entregó'}</button>` : `<button class="btn2" data-a="escribirA" data-u="${v.autor}">Me interesa</button>`}</article>`; }).join('') || '<p class="vacio" style="grid-column:1/-1">No hay nada aquí todavía.</p>'}</div></div>`;
  }
};
ACC.cvFiltro = b => { UI.cvFiltro = b.dataset.f; refrescar(); };
ACC.cvVendido = b => { const v = DB.estado.ventas.find(x => x.id === b.dataset.id); v.estado = v.estado === 'vendido' ? null : 'vendido'; DB.guardar(); refrescar(); };
ACC.cvPublicar = () => hojaVenta();
function hojaVenta() {
  abrirHoja(`<form class="pila" data-form="publicarVenta"><h2>Publicar</h2>
    <div><label class="campo" for="vt">¿Qué ofreces?</label><input id="vt" name="titulo" required maxlength="100" placeholder="Calculadora Casio fx-991" value="${esc(UI.cvTitulo || '')}" data-entrada="cvTitulo"></div>
    <div class="rejilla3">${[['venta', 'Vender'], ['intercambio', 'Intercambiar'], ['regalo', 'Regalar']].map(([k, t]) => `<button type="button" class="pastilla${UI.cvTipo === k ? ' on' : ''}" data-a="cvTipo" data-t="${k}">${t}</button>`).join('')}</div>
    ${UI.cvTipo === 'venta' ? '<div><label class="campo" for="vp">Precio (MXN)</label><input id="vp" name="precio" type="number" min="0" max="100000" required></div>' : ''}
    <div><span class="campo">¿Quién lo puede ver?</span><div class="pila" style="gap:6px">${Object.entries(VIS).map(([k, [ic, t, d]]) => `<button type="button" class="tarjeta fila" style="flex-wrap:nowrap;text-align:left;padding:10px 12px;box-shadow:none;border:2px solid ${UI.cvVis === k ? 'var(--morado)' : 'var(--linea)'};background:${UI.cvVis === k ? 'var(--suave)' : 'var(--tarjeta)'}" data-a="cvVis" data-v="${k}" aria-pressed="${UI.cvVis === k}">${icono(ic, 20)}<span><b class="peq">${t}</b><br><span class="mini gris">${d}</span></span></button>`).join('')}</div></div>
    ${UI.cvVis === 'elegidos' ? '<div><label class="campo" for="ve">¿Quiénes?</label><input id="ve" name="elegidos" required placeholder="@vale.a, @pedro.g"></div>' : ''}
    <button class="btn ancho">Publicar</button></form>`);
}
ENTRADAS.cvTitulo = el => UI.cvTitulo = el.value;
ACC.cvTipo = b => { UI.cvTipo = b.dataset.t; hojaVenta(); };
ACC.cvVis = b => { UI.cvVis = b.dataset.v; hojaVenta(); };
FORMS.publicarVenta = d => { DB.publicarVenta({ titulo: d.titulo, tipo: UI.cvTipo, precio: d.precio, vis: UI.cvVis, elegidos: (d.elegidos || '').split(/[,\s]+/).filter(Boolean) }); UI.cvTitulo = ''; cerrarHoja(); aviso('Publicado'); refrescar(); };
