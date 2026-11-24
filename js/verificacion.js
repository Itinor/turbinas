'use strict';
const VERIF_DEF = { prefijo: 'a', digitos: 6, max: 403307 };
const confVerif = () => ({ ...VERIF_DEF, ...(DB.estado.confVerif || {}) });
function revisarMatricula(correo) {
  const c = String(correo || '').trim().toLowerCase(), [local, dom] = c.split('@');
  if (!local || !DB.correoInstitucional(c)) return { error: 'dominio' };
  const V = confVerif(), pre = String(V.prefijo || '').toLowerCase().replace(/[^a-z]/g, '');
  const m = local.match(new RegExp('^' + pre + '(\\d+)$'));
  if (!m || (V.digitos && m[1].length !== +V.digitos)) return { error: 'forma' };
  const n = +m[1]; if (V.max && n > +V.max) return { error: 'rango' };
  const otro = Object.values(DB.estado.usuarios).find(u => u.id !== DB.yo()?.id && String(u.correoUni || '').toLowerCase() === c);
  if (otro) return { error: 'usado' };
  return { ok: true, matricula: m[1], correo: c };
}
FORMS.correoVerif = d => {
  const r = revisarMatricula(d.correo), V = confVerif();
  if (r.error === 'dominio') return aviso(`Usa tu correo de la universidad (@${(CONFIG.dominiosUni || []).join(', @')}). Si no tienes, sube un documento.`);
  if (r.error === 'forma') return aviso(`Ese correo no tiene forma de matrícula (${V.prefijo || ''}${'0'.repeat(+V.digitos || 6)}@${(CONFIG.dominiosUni || ['uach.mx'])[0]}). Revisa que esté bien escrito o sube un documento.`);
  if (r.error === 'rango') return aviso('Esa matrícula todavía no existe. Revisa que esté bien escrita o sube un documento.');
  if (r.error === 'usado') return aviso('Ese correo ya verificó otra cuenta. Si es tuyo, repórtalo desde Ayuda.');
  const u = DB.yo(); u.verificado = 'si'; u.correoUni = r.correo; u.matricula = r.matricula; u.revisarVerif = new Date().toISOString();
  if (!u.insignias.includes('verificado')) u.insignias.push('verificado');
  DB.guardar(); aviso('¡Listo, ya estás verificado!'); refrescar();
};
function admVerifRevisar() {
  const V = confVerif(), l = Object.values(DB.estado.usuarios).filter(u => u.revisarVerif && u.verificado === 'si').sort((a, b) => String(b.revisarVerif).localeCompare(String(a.revisarVerif)));
  return `<section class="tarjeta"><div class="entre"><h2>Verificados por correo · revisar${l.length ? ' · ' + l.length : ''}</h2><button class="btn3" style="min-height:36px" data-a="confVerifHoja">Formato</button></div>
    <p class="mini gris" style="margin:2px 0 8px">Entraron verificados porque su correo tiene forma de matrícula válida (${esc(V.prefijo || '')}${'#'.repeat(+V.digitos || 6)}${V.max ? `, hasta ${esc(String(V.max))}` : ''}). Compáralos con tu lista y confirma o quita la verificación.</p>
    ${l.map(u => `<div class="entre" style="padding:8px 0;border-bottom:1px solid var(--linea);gap:8px"><span style="min-width:0"><b class="peq">@${esc(u.usuario)}</b> <span class="mini gris">${esc(u.nombre || '')}</span><br><span class="mini">${esc(u.correoUni || '')} · ${hace(u.revisarVerif)}</span></span><span class="fila" style="gap:6px;flex:none"><button class="btn2" style="min-height:36px;padding:0 10px" data-a="verifConfirmar" data-u="${u.id}">Confirmar</button><button class="btn-peligro" style="min-height:36px;padding:0 10px" data-a="verifQuitar" data-u="${u.id}">Quitar</button></span></div>`).join('') || '<p class="peq gris" style="margin:0">Nadie por revisar.</p>'}</section>`;
}
ACC.verifConfirmar = b => { const u = DB.usuario(b.dataset.u); delete u.revisarVerif; DB.guardar(); refrescar(); };
ACC.verifQuitar = b => { const u = DB.usuario(b.dataset.u); if (!confirm(`¿Quitar la verificación de @${u.usuario}?`)) return; delete u.revisarVerif; u.verificado = 'no'; u.correoUni = null; u.matricula = null; u.insignias = u.insignias.filter(i => i !== 'verificado'); notificar(u.id, 'No pudimos confirmar tu correo de estudiante. Verifícate con un documento oficial.', '#/verificar'); DB.guardar(); aviso('Verificación quitada'); refrescar(); };
ACC.confVerifHoja = () => { const V = confVerif(); abrirHoja(`<form class="pila" data-form="confVerif"><h2>Formato de matrícula</h2><p class="peq gris" style="margin:0">Así se revisa el correo al verificarse: <b>prefijo + número</b>@${esc((CONFIG.dominiosUni || ['uach.mx'])[0])}.</p>
  <div class="rejilla2"><div><label class="campo" for="cvp">Letras antes del número</label><input id="cvp" name="prefijo" maxlength="4" value="${esc(V.prefijo || '')}" placeholder="a"></div><div><label class="campo" for="cvd">Dígitos del número</label><input id="cvd" name="digitos" type="number" min="0" max="12" value="${esc(String(V.digitos || ''))}"></div></div>
  <div><label class="campo" for="cvm">Matrícula más alta que existe <span class="mini gris">(0 = sin límite)</span></label><input id="cvm" name="max" type="number" min="0" value="${esc(String(V.max || 0))}"></div>
  <button class="btn ancho">Guardar</button></form>`); };
FORMS.confVerif = d => { if (!DB.esAdmin()) return; DB.estado.confVerif = { prefijo: String(d.prefijo || '').toLowerCase().replace(/[^a-z]/g, ''), digitos: Math.max(0, Math.min(12, +d.digitos || 0)), max: Math.max(0, +d.max || 0) }; DB.guardar(); cerrarHoja(); aviso('Formato guardado'); refrescar(); };
