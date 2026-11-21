/* Rankings: profesores por área y rankings propuestos por la comunidad */
'use strict';
UI.rkTab = 'profes'; UI.rkArea = 'Ciencias básicas';
VISTAS.rankings = {
  titulo: 'Rankings', nav: 'rankings',
  render(params) {
    if (params[0] === 'nuevo') return formNuevoRanking();
    const tabs = `<div class="rejilla2" style="background:var(--suave);border-radius:14px;padding:4px">${[['profes', 'Profesores'], ['comunidad', 'Comunidad']].map(([k, t]) => `<button class="pastilla${UI.rkTab === k ? ' on' : ''}" style="border:0" data-a="rkTab" data-t="${k}">${t}</button>`).join('')}</div>`;
    if (UI.rkTab === 'profes') {
      const lista = DB.estado.profes.filter(p => p.area === UI.rkArea && p.opiniones.length >= REGLAS.minOpinionesProfe).map(p => ({ p, c: DB.calificacion(p) })).sort((a, b) => b.c - a.c);
      const mejores = lista.filter(x => x.c >= 3.5).slice(0, 3), peores = lista.filter(x => x.c < 3.5).sort((a, b) => a.c - b.c).slice(0, 3);
      const medalla = ['var(--g-accion)', 'linear-gradient(135deg,#CBD5E1,#F8FAFC)', 'linear-gradient(135deg,#E8C9A6,#D9A06B)'];
      return `<div class="pila">${tabs}<div class="pestanas">${AREAS.map(a => `<button class="pastilla${UI.rkArea === a ? ' on' : ''}" data-a="rkArea" data-a2="${esc(a)}">${esc(a)}</button>`).join('')}</div>
        <section class="tarjeta"><h2>Mejor evaluados</h2><p class="mini gris" style="margin:2px 0 6px">${esc(UI.rkArea)} · según los estudiantes</p>
        ${mejores.map((x, i) => `<a href="#/profe/${x.p.id}" class="fila" style="flex-wrap:nowrap;padding:10px 0;border-bottom:1px solid var(--linea);text-decoration:none;color:inherit"><span style="width:30px;height:30px;border-radius:50%;background:${medalla[i]};color:#1B1530;display:grid;place-items:center;font-weight:800;flex:none">${i + 1}</span><span style="flex:1"><b>${esc(x.p.nombre)}</b><br><span class="mini gris">${esc(x.p.materias.join(', '))} · ${x.p.opiniones.length} opiniones</span></span><b style="font-family:Sora,sans-serif;font-size:20px;color:var(--okTxt)">${x.c.toFixed(1)}</b></a>`).join('') || '<p class="vacio">Aún no hay suficientes opiniones.</p>'}</section>
        <section class="tarjeta"><h2>Peor evaluados</h2><p class="mini gris" style="margin:2px 0 6px">Con el motivo que más mencionan</p>
        ${peores.map(x => `<a href="#/profe/${x.p.id}" style="display:block;padding:10px 0;border-bottom:1px solid var(--linea);text-decoration:none;color:inherit"><span class="entre"><span><b>${esc(x.p.nombre)}</b><br><span class="mini gris">${esc(x.p.materias.join(', '))} · ${x.p.opiniones.length} opiniones</span></span><b style="font-family:Sora,sans-serif;font-size:20px;color:var(--malTxt)">${x.c.toFixed(1)}</b></span><span class="insignia i-rojo" style="margin-top:6px">${esc(DB.motivoFrecuente(x.p))}</span></a>`).join('') || '<p class="vacio">Nadie en esta lista. ¡Bien por el área!</p>'}</section></div>`;
    }
    const yo = DB.yo(), lista = DB.estado.rankings.filter(r => DB.rankingVisible(r)).sort((a, b) => Object.keys(b.votos).length - Object.keys(a.votos).length);
    return `<div class="pila">${tabs}<a class="btn ancho" href="#/rankings/nuevo">${icono('mas', 18)}Proponer un ranking</a>
      ${lista.map(r => { const votos = Object.values(r.votos), n = votos.length, mi = r.votos[yo.id], mio = r.autor === yo.id;
        const etiqueta = r.oficial ? '<span class="insignia i-morado">Del equipo</span>' : DB.etapaRanking(r) === 3 ? '<span class="insignia i-verde">Popular</span>' : '<span class="insignia i-amarillo">Nuevo</span>';
        const espera = mio && r.estado !== 'aprobado' ? `<p class="peq" style="margin:8px 0 0;color:var(--avisoTxt)">${r.estado === 'revision' ? 'Lo está revisando el equipo antes de publicarlo.' : r.estado === 'consentimiento' ? 'Esperando a que las personas mencionadas acepten aparecer.' : ''}</p>` : '';
        return `<article class="tarjeta"><div class="entre">${etiqueta}<span class="mini gris">${n} votos</span></div><h2 style="margin:8px 0 10px">${esc(r.titulo)}</h2>
          <div class="pila" style="gap:8px">${r.opciones.map((o, i) => { const c = votos.filter(v => v === i).length, pct = n ? Math.round(c / n * 100) : 0; return `<button class="reaccion${mi === i ? ' on' : ''}" style="border-radius:14px;min-height:48px;text-align:left;padding:8px 12px;display:block" data-a="votarRanking" data-id="${r.id}" data-op="${i}" ${r.estado !== 'aprobado' ? 'disabled' : ''}><span class="entre"><span>${esc(o)}</span><span class="gris">${mi !== undefined ? pct + '%' : ''}</span></span>${mi !== undefined ? `<span class="barra-prog" style="margin-top:6px;display:block"><span style="width:${pct}%"></span></span>` : ''}</button>`; }).join('')}</div>
          ${espera}<div class="entre" style="margin-top:8px"><span class="mini gris">por ${esc(nombreVisible(r.autor))}</span>${mio ? '' : `<button class="icono-btn" data-a="abrirReporte" data-tipo="ranking" data-ref="${r.id}" aria-label="Reportar ranking">${icono('bandera', 18)}</button>`}</div></article>`; }).join('') || '<p class="vacio">Todavía no hay rankings para ti. ¡Propón el primero!</p>'}</div>`;
  }
};
function formNuevoRanking() {
  return `<form class="pila" data-form="nuevoRanking"><h1>Proponer un ranking</h1>
    <div><label class="campo" for="rt">La pregunta</label><input id="rt" name="titulo" required maxlength="140" placeholder="¿Quién es el más fiestero de la generación?"></div>
    <div><span class="campo">Opciones</span><div class="pila" style="gap:6px">${[0, 1, 2, 3].map(i => `<label class="oculto" for="ro${i}">Opción ${i + 1}</label><input id="ro${i}" name="op${i}" maxlength="60" placeholder="Opción ${i + 1}${i > 1 ? ' (opcional)' : ''}" ${i < 2 ? 'required' : ''}>`).join('')}</div></div>
    <div><label class="campo" for="rm">¿Mencionas a alguien de la red?</label><input id="rm" name="nombrados" placeholder="@pedro.g, @vale.a" autocomplete="off"><p class="mini gris">Les llegará un aviso para que acepten aparecer.</p></div>
    <button class="btn ancho">Publicar</button><a class="btn3 ancho" href="#/rankings">Cancelar</a></form>`;
}
ACC.rkTab = b => { UI.rkTab = b.dataset.t; refrescar(); };
ACC.rkArea = b => { UI.rkArea = b.dataset.a2; refrescar(); };
ACC.votarRanking = b => { const r = DB.votarRanking(b.dataset.id, +b.dataset.op); if (r.error === 'verificar') return pedirVerificacion(); refrescar(); };
FORMS.nuevoRanking = d => {
  const r = DB.crearRanking(d.titulo, [d.op0, d.op1, d.op2, d.op3], (d.nombrados || '').split(/[,\s]+/).filter(Boolean));
  if (r.error) return aviso(r.error);
  aviso(r.ok.estado === 'aprobado' ? 'Publicado. Primero lo verán tus amigos.' : r.ok.estado === 'revision' ? 'Lo revisará el equipo antes de publicarse.' : 'Publicado en cuanto acepten las personas mencionadas.');
  UI.rkTab = 'comunidad'; ir('#/rankings');
};
