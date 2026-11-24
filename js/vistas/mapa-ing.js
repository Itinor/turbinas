'use strict';
const rango = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const EDIF_ING = [
  { id: 'D', nombre: 'Edificio D', desc: 'Aulas 16 a 39', tipo: 'aulas', color: '#E9DDF7', borde: '#4B1F7A',
    pisos: [{ n: 'Planta baja', alas: [rango(16, 21), rango(22, 27)] }, { n: 'Planta alta', alas: [rango(28, 33), rango(34, 39)] }],
    formas: [{ c: [738, 405], w: 195, h: 72, r: -17 }, { c: [935, 337], w: 195, h: 68, r: -17 }], puente: [826, 352, 22, 46, -17], et: [722, 412] },
  { id: 'E', nombre: 'Edificio E', desc: 'Aulas 40 a 63', tipo: 'aulas', color: '#DCE8FB', borde: '#174EAD',
    pisos: [{ n: 'Planta baja', alas: [rango(40, 45), rango(46, 51)] }, { n: 'Planta alta', alas: [rango(52, 57), rango(58, 63)] }],
    formas: [{ c: [758, 488], w: 190, h: 70, r: -17 }, { c: [955, 420], w: 195, h: 68, r: -17 }], puente: [858, 458, 24, 50, -17], et: [745, 495] },
  { id: 'C', nombre: 'Edificio C', desc: 'Laboratorios', tipo: 'lab', color: '#DCF5E3', borde: '#14632F', puntos: '520,458 642,508 560,662 545,695 495,708 418,664', et: [572, 530] },
  { id: 'B', nombre: 'Edificio B', desc: 'Edificio de Posgrado', tipo: 'otro', color: '#FFF1C7', borde: '#8A5A00', puntos: '678,572 718,598 580,798 545,772', et: [636, 680] },
  { id: 'A', nombre: 'Edificio A', desc: 'Cubículos de Maestros', tipo: 'otro', color: '#FFE1D6', borde: '#B45309', puntos: '800,700 838,716 752,842 718,822', et: [788, 772] },
  { id: 'ADM', nombre: 'Edificio Administrativo', desc: 'Dirección y servicios escolares', tipo: 'otro', color: '#ECE7DF', borde: '#6B5B4B', puntos: '900,722 978,710 1000,672 1036,676 1040,692 1092,690 1092,776 1036,778 1000,770 990,800 908,806', et: [990, 745] },
  { id: 'BIB', nombre: 'Biblioteca', desc: 'Biblioteca DES de las Ingenierías', tipo: 'otro', color: '#FCE1EC', borde: '#A3245E', puntos: '1160,540 1262,702 1310,734 1330,800 1290,836 1216,822 1074,602', et: [1195, 690] },
  { id: 'CAF', nombre: 'Cafetería', desc: 'Cafetería central', tipo: 'otro', color: '#FFD3E2', borde: '#A3245E', puntos: '1132,180 1200,180 1226,210 1226,278 1196,308 1132,308 1108,280 1108,210', et: [1166, 268] },
  { id: 'MAQ', nombre: 'Laboratorio de Máquinas y Herramientas', desc: 'Talleres', tipo: 'lab', color: '#DCF5E3', borde: '#14632F', puntos: '410,665 492,702 460,766 380,726', et: [436, 716], corto: 'Máquinas' },
  { id: 'RES', nombre: 'Centro de Resonancia Magnética', desc: '', tipo: 'otro', color: '#ECE7DF', borde: '#6B5B4B', puntos: '404,524 440,540 428,562 392,546', et: [416, 544] },
  { id: 'PLZ', nombre: 'Plaza del Estudiante', desc: 'Punto de reunión 10', tipo: 'otro', color: '#FFF6DA', borde: '#8A5A00', puntos: '1070,205 1106,205 1106,300 1070,300', et: [1088, 255] }
];
const PUNTOS_REUNION = [['1', 'Edificio Administrativo', 1018, 692], ['2a', 'Audiovisual 1 y 2 de Posgrado', 680, 578], ['2b', 'Audiovisual 3 de Posgrado', 557, 757], ['3', 'Explanada de Laboratorios', 508, 568], ['4', 'Lobby de Laboratorios', 586, 606], ['5', 'Área de Cafetería', 1166, 218], ['6', 'Asta Bandera', 617, 438], ['7', 'Área de Biblioteca', 1162, 632], ['8', 'Visión de los Aerópagos', 1275, 792], ['9', 'Sala de Maestros', 705, 490], ['10', 'Plaza del Estudiante', 1088, 252]];
UI.ing = { sel: null, salon: null };
const edifDeSalon = n => EDIF_ING.find(e => e.pisos?.some(p => p.alas.some(a => a.includes(n))));
function numeroSalon(t) { const m = String(t || '').match(/(?:^|[^\d])(\d{1,3})(?!\d)/); if (!m) return null; const n = +m[1]; return edifDeSalon(n) ? n : null; }
function formaEdif(e, on) {
  const st = `fill="${e.color}" stroke="${e.borde}" stroke-width="${on ? 6 : 3}"`;
  if (e.formas) return e.formas.map(f => `<rect x="${f.c[0] - f.w / 2}" y="${f.c[1] - f.h / 2}" width="${f.w}" height="${f.h}" rx="${f.h / 2.2}" transform="rotate(${f.r} ${f.c[0]} ${f.c[1]})" ${st}/>`).join('') + (e.puente ? `<rect x="${e.puente[0] - e.puente[2] / 2}" y="${e.puente[1] - e.puente[3] / 2}" width="${e.puente[2]}" height="${e.puente[3]}" transform="rotate(${e.puente[4]} ${e.puente[0]} ${e.puente[1]})" ${st}/>` : '');
  return `<polygon points="${e.puntos}" stroke-linejoin="round" ${st}/>`;
}
function svgIngenieria() {
  const S = UI.ing;
  const edifs = EDIF_ING.map(e => { const on = S.sel === e.id, chico = ['RES', 'PLZ'].includes(e.id);
    return `<g data-a="ingEdif" data-id="${e.id}" role="button" tabindex="0" aria-label="${esc(e.nombre)}" style="cursor:pointer">${formaEdif(e, on)}${chico ? '' : `<text x="${e.et[0]}" y="${e.et[1]}" text-anchor="middle" dominant-baseline="middle" font-family="Sora,sans-serif" font-weight="900" font-size="${e.id.length === 1 ? 34 : 15}" fill="${e.borde}" pointer-events="none">${e.id.length === 1 ? e.id : esc(e.corto || e.nombre.replace('Edificio ', ''))}</text>`}</g>`; }).join('');
  const puntos = PUNTOS_REUNION.map(([n, t, x, y]) => `<g aria-hidden="true"><circle cx="${x}" cy="${y}" r="13" fill="#fff" stroke="#1B1530" stroke-width="2"/><text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle" font-family="Inter,sans-serif" font-weight="800" font-size="${n.length > 1 ? 10 : 12}" fill="#1B1530">${n}</text></g>`).join('');
  const rayas = (x1, y1, x2, y2, n) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1), x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; return `<line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" stroke="#fff" stroke-width="2"/>`; }).join('');
  return `<svg viewBox="340 70 1040 840" width="100%" style="display:block;min-width:680px" role="img" aria-label="Croquis de la Facultad de Ingeniería">
    <rect x="340" y="70" width="1040" height="840" fill="#E3F0CF"/>
    <path d="M372,700 L610,250 Q700,140 830,108 L1160,96" fill="none" stroke="#CFCAD9" stroke-width="58" stroke-linejoin="round"/>
    <path d="M372,700 L610,250 Q700,140 830,108 L1160,96" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="14 10"/>
    <text font-family="Inter,sans-serif" font-size="15" font-weight="700" fill="#5E5873"><textPath href="#calleNorte" startOffset="18%">Estacionamiento alumnos</textPath></text>
    <path id="calleNorte" d="M372,700 L610,250 Q700,140 830,108 L1160,96" fill="none"/>
    <polygon points="722,580 870,515 890,575 782,640" fill="#CFCAD9"/>${rayas(780, 590, 850, 560, 7)}
    <text x="805" y="625" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#5E5873" transform="rotate(-22 805 625)">Estac. personal</text>
    <polygon points="835,665 920,632 950,700 892,800 1000,812 1010,850 840,850 808,830" fill="#CFCAD9"/>
    <path d="M980,905 C1150,870 1400,850 1700,820" fill="none" stroke="#C9BEDF" stroke-width="34"/>
    <text x="1135" y="895" font-family="Inter,sans-serif" font-size="15" font-weight="700" fill="#5E5873" transform="rotate(-6 1135 895)">Circuito Universitario</text>
    <text x="1010" y="878" font-family="Inter,sans-serif" font-size="14" font-weight="800" fill="#1B1530">Entrada principal</text>
    <text x="628" y="200" font-family="Inter,sans-serif" font-size="13" font-weight="800" fill="#1B1530" transform="rotate(-40 628 200)">Entrada norte</text>
    ${edifs}${puntos}
    <g transform="translate(1250 410)" aria-hidden="true"><circle r="30" fill="#fff" stroke="#B9B0CF"/><path d="M0,-26 L7,0 L0,26 L-7,0Z" fill="#1B1530"/><text y="-34" text-anchor="middle" font-size="13" font-weight="800" font-family="Inter,sans-serif">N</text></g>
  </svg>`;
}
function panelEdificio(e) {
  const S = UI.ing;
  if (!e.pisos) return `<section class="tarjeta"><span class="etiqueta" style="color:${e.borde}">Ingeniería</span><h2 style="margin:4px 0">${esc(e.nombre)}</h2>${e.desc ? `<p class="gris" style="margin:0">${esc(e.desc)}</p>` : ''}</section>`;
  return `<section class="tarjeta"><div class="entre"><span><span class="etiqueta" style="color:${e.borde}">Ingeniería</span><h2 style="margin:4px 0">${esc(e.nombre)}</h2><p class="gris peq" style="margin:0">${esc(e.desc)} · 2 plantas, cada una partida en dos alas de 6 salones</p></span></div>
    ${e.pisos.slice().reverse().map(p => `<p class="etiqueta gris" style="margin:14px 0 6px">${p.n}</p><div class="alas-edif">${p.alas.map(a => `<div class="ala">${a.map(n => `<button class="salon-cel${S.salon === n ? ' on' : ''}" data-a="ingSalon" data-n="${n}">${n}</button>`).join('')}</div>`).join('<span class="pasillo" aria-hidden="true"></span>')}</div>`).join('')}
    ${S.salon && e.pisos.some(p => p.alas.some(a => a.includes(S.salon))) ? (() => { const p = e.pisos.find(p => p.alas.some(a => a.includes(S.salon))), ala = p.alas.findIndex(a => a.includes(S.salon)); return `<p class="peq" style="margin:12px 0 0"><b>Salón ${S.salon}</b>: ${esc(e.nombre)}, ${p.n.toLowerCase()}, ${ala === 0 ? 'primera' : 'segunda'} mitad (${p.alas[ala][0]} a ${p.alas[ala].at(-1)}).</p>`; })() : ''}
  </section>`;
}
function vistaMapaIng() {
  const S = UI.ing, e = EDIF_ING.find(x => x.id === S.sel);
  return `<form data-form="buscarIng" class="fila" style="flex-wrap:nowrap"><label class="oculto" for="bsi">Buscar salón o edificio</label><input id="bsi" name="q" list="lugaresIng" placeholder="Busca: 21, SA-42, biblioteca, laboratorios…" autocomplete="off"><datalist id="lugaresIng">${EDIF_ING.map(x => `<option value="${esc(x.nombre)}">`).join('')}</datalist><button class="btn2">Buscar</button></form>
    <div class="mapa" id="mapaIng">${svgIngenieria()}</div>
    ${e ? panelEdificio(e) : '<p class="peq gris" style="margin:0">Toca un edificio para ver sus salones. Los números en círculo son los puntos de reunión.</p>'}
    <details class="tarjeta"><summary class="peq" style="cursor:pointer"><b>Puntos de reunión</b></summary><ol class="peq" style="margin:8px 0 0;padding-left:28px">${PUNTOS_REUNION.map(([n, t]) => `<li value="${parseInt(n)}">${n.length > 1 ? `<b>${n}</b> ` : ''}${esc(t)}</li>`).join('')}</ol></details>
    <p class="mini gris" style="margin:0">Croquis sin medidas reales, basado en el letrero del campus.</p>`;
}
ACC.ingEdif = b => { UI.ing.sel = b.dataset.id; UI.ing.salon = null; refrescar(); };
ACC.ingSalon = b => { UI.ing.salon = +b.dataset.n; refrescar(); };
FORMS.buscarIng = d => {
  const q = String(d.q || '').trim(); if (!q) return;
  const n = numeroSalon(q);
  if (n) { const e = edifDeSalon(n); UI.ing.sel = e.id; UI.ing.salon = n; refrescar(); return; }
  const s = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const e = EDIF_ING.find(x => (x.nombre + ' ' + x.desc).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(s)) || EDIF_ING.find(x => x.id.toLowerCase() === s.replace(/^edificio\s*/, ''));
  if (!e) return aviso('No encontramos ese salón o lugar todavía.');
  UI.ing.sel = e.id; UI.ing.salon = null; refrescar();
};
function irASalon(t) { const n = numeroSalon(t); if (!n) return false; UI.mapa.vista = 'ing'; UI.ing.sel = edifDeSalon(n).id; UI.ing.salon = n; ir('#/explorar/mapa'); return true; }
ACC.salonEnMapa = b => { cerrarHoja(); irASalon(b.dataset.s); };
