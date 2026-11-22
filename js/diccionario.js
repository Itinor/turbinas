/* Palabras para los juegos de palabras y definiciones en vivo de Wikcionario (licencia CC BY-SA).
   Cada persona recibe palabras distintas cada día (se mezclan con su id), así no se pueden pasar las respuestas. */
'use strict';
const PALABRAS_ES = `alma amor año agua aire alto arte ave azul baño beso boca bola bota brazo cama cara casa cielo cine coche
cola copa cosa cruz cuna dado dedo diente día dios dolor duda edad eje fama faro fe fila flor foca foto fuego gato gota gris
grupo hielo hijo hilo hoja hora hueso idea isla jefe juego lago lana largo leche león letra libro llave lluvia loco luna luz
madre mano mapa mar masa mesa miel mina misa modo mono monte mundo muro nada nariz niño noche norte nube nudo ojo ola olor oro
oso padre país pan papel pared paso pata paz pelo perro peso piano pico pie piel pila pino piso plata playa plaza poco pollo
pozo prisa puente puerta pulpo punto queso radio rama rana rato rayo red reloj rey río roca rojo ropa rosa rueda ruido sal
salud santo sed selva señal siglo silla sol sombra sopa suelo sueño tarde taza techo tela tema tierra tigre tinta tío toro
torre tos trago tren tribu tubo uva vaca valle vaso vela vida viento vino voz yema zapato zorro
abeja abrazo acero actor adiós águila alegre almohada altura amigo ancla ángel anillo antes árbol arena arroz asiento
atún aula ayuda azúcar bailar balón banco bandera barco barro batalla baúl bebida biblia boleto bolsa bosque botella
brillo broma bruja buzón caballo cabeza cadena café caja calle calor cámara camino camisa campo canción cangrejo cantar
carta carne cartón castillo cebolla cena cepillo cerdo cerebro cereza cereal chiste ciudad clase clavo cobre cocina cohete
collar color comida concha conejo corazón corona correo cuadro cuchara cuello cuento cuerda cuerpo cueva cultura dátil
deseo desierto destino diablo dibujo dinero disco doctor domingo dragón ducha dulce durazno elefante enano enero escuela
espada espejo esposa estrella examen fábrica falda familia fiesta firma flecha fresa fruta fuente futuro galleta gallina
ganso garaje gigante globo gorra grano granja guante guerra guitarra gusano hambre harina helado hermano historia hombre
horno huevo humo iglesia imagen insecto invierno isla jabón jamón jardín jarra jirafa joven joya juguete justicia ladrón
lámpara lápiz lazo lechuga lengua lente libertad limón línea lobo lunes madera maestro maíz maleta mañana manzana marco
martes máscara mazo médico mejilla melón mensaje mercado meta metal miedo minuto mirada moneda montaña morado mosca motor
muela mujer museo música naranja nevera nieve nivel noticia novio número océano oficina oreja orilla otoño oveja palabra
pájaro palacio paloma pantalla papa pañuelo paraguas parque pasillo pastel patio pecho peine película pelota pepino pera
perla pescado piedra pierna pimienta pintura pirata planeta planta plátano plato pluma pobre poema pregunta premio primo
princesa prueba pueblo pulmón queja quieto raíz rápido ratón razón receta regalo reina riñón risa ritmo robot rodilla
saco salida salto sandía sartén secreto semana semilla señor serpiente silencio sobre soldado sonrisa suerte tablero
talento tambor tarea teatro teclado tiempo tijera timbre tobillo tomate tormenta tortuga trabajo trigo trompeta trueno
tuerca tumba universo uña vacío valor vapor vecino veneno ventana verano verde vestido viaje viejo violín visita volcán
zanahoria`.split(/\s+/).filter(Boolean);
const sinAcentos = w => w.toUpperCase().normalize('NFD').replace(/(?![̃])[̀-ͯ]/g, '').normalize('NFC');
/* número al azar estable para una persona y un día */
function semillaPersonal(sal) { const u = (typeof DB !== 'undefined' && DB.yo()?.id) || 'anon'; let h = 2166136261; for (const c of u + '|' + fechaLocal() + '|' + sal) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function azar(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function palabraPersonal() {
  const r = azar(semillaPersonal('palabra')), largo = 4 + Math.floor(r() * 4);
  const l = PALABRAS_ES.filter(w => [...sinAcentos(w)].length === largo && !/ü/.test(w));
  const w = l[Math.floor(r() * l.length)]; return { palabra: w, sol: sinAcentos(w), largo };
}

/* ---------- Definiciones (Wikcionario, en vivo) ---------- */
const DEFINICIONES = {
  cache: (() => { try { return JSON.parse(localStorage.getItem('cdu_def') || '{}'); } catch { return {}; } })(),
  guardar() { try { const k = Object.keys(this.cache); if (k.length > 600) k.slice(0, k.length - 600).forEach(x => delete this.cache[x]); localStorage.setItem('cdu_def', JSON.stringify(this.cache)); } catch {} },
  limpiar(t, palabra) {
    t = t.replace(/<ref[^>]*>[\s\S]*?<\/ref>|<ref[^>]*\/>/g, '').replace(/<[^>]+>/g, '');
    for (let i = 0; i < 4; i++) t = t.replace(/\{\{\s*(?:plm|l|l\+|plmp|f|lex)\s*\|(?:\s*es\s*\|)?\s*([^|{}]+)[^{}]*\}\}/gi, '$1');
    t = t.replace(/\{\{[^{}]*\}\}/g, '').replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1').replace(/'{2,}/g, '').replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
    if (palabra) { const raiz = palabra.toLowerCase().slice(0, Math.max(4, palabra.length - 2)); t = t.replace(new RegExp(raiz + '\\p{L}*', 'giu'), '___'); }
    return t.replace(/^[,;:.\s]+/, '');
  },
  /* lee el wikitexto de una entrada y saca las acepciones en español */
  extraer(wiki, palabra) {
    const ini = wiki.search(/==\s*\{\{\s*lengua\s*\|\s*es\s*\}\}\s*==/i); if (ini < 0) return [];
    const resto = wiki.slice(ini + 5), fin = resto.search(/\n==\s*\{\{\s*lengua\s*\|/i), sec = fin >= 0 ? resto.slice(0, fin) : resto;
    const defs = [];
    sec.split('\n').forEach(l => { const m = /^;\s*\d+[^:\n]*?:\s*(.+)$/.exec(l); if (m) { const d = this.limpiar(m[1], palabra); if (d.length > 3) defs.push(d); } });
    return defs;
  },
  /* pide las que falten en un solo viaje (hasta 40 a la vez) */
  async de(palabras) {
    const faltan = palabras.filter(p => !(p in this.cache));
    for (let i = 0; i < faltan.length; i += 40) {
      const lote = faltan.slice(i, i + 40);
      try {
        const r = await fetch(`https://es.wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2&origin=*&titles=${encodeURIComponent(lote.join('|'))}`);
        const j = await r.json(), norm = {}; (j.query?.normalized || []).forEach(n => norm[n.to] = n.from);
        (j.query?.pages || []).forEach(pg => { const t = norm[pg.title] || pg.title, w = pg.revisions?.[0]?.slots?.main?.content || ''; this.cache[t] = pg.missing ? [] : this.extraer(w, t).slice(0, 3); });
        lote.forEach(p => { if (!(p in this.cache)) this.cache[p] = []; });
      } catch (e) { console.warn('[diccionario]', e); }
    }
    this.guardar();
    const o = {}; palabras.forEach(p => o[p] = this.cache[p] || null); return o;
  },
  enlace: p => `https://es.wiktionary.org/wiki/${encodeURIComponent(p)}`
};

/* ---------- Crucigrama automático ---------- */
function armarCrucigrama(seed, N = 12, cuantas = 9) {
  const r = azar(seed), cand = PALABRAS_ES.filter(w => { const n = [...sinAcentos(w)].length; return n >= 4 && n <= 8 && !/ü/.test(w); }).sort(() => r() - 0.5).slice(0, 80);
  const g = Array.from({ length: N }, () => Array(N).fill(null)), puestas = [];
  const cabe = (s, f, c, h) => {
    const L = [...s]; if (h ? c + L.length > N : f + L.length > N) return -1; let cruces = 0;
    if (h ? (c > 0 && g[f][c - 1]) || (c + L.length < N && g[f][c + L.length]) : (f > 0 && g[f - 1][c]) || (f + L.length < N && g[f + L.length][c])) return -1;
    for (let i = 0; i < L.length; i++) { const y = h ? f : f + i, x = h ? c + i : c, v = g[y][x];
      if (v) { if (v !== L[i]) return -1; cruces++; }
      else if (h ? (y > 0 && g[y - 1][x]) || (y < N - 1 && g[y + 1][x]) : (x > 0 && g[y][x - 1]) || (x < N - 1 && g[y][x + 1])) return -1; }
    return cruces;
  };
  const poner = (w, s, f, c, h) => { [...s].forEach((ch, i) => { g[h ? f : f + i][h ? c + i : c] = ch; }); puestas.push({ palabra: w, sol: s, f, c, h }); };
  const pri = cand.find(w => [...sinAcentos(w)].length >= 6) || cand[0]; const s0 = sinAcentos(pri); poner(pri, s0, Math.floor(N / 2) - 1, Math.floor((N - [...s0].length) / 2), true);
  for (const w of cand) {
    if (puestas.length >= cuantas) break; if (puestas.some(p => p.palabra === w)) continue;
    const s = sinAcentos(w), L = [...s]; let mejor = null;
    for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) for (const h of [true, false]) { const k = cabe(s, f, c, h); if (k > 0 && (!mejor || k > mejor.k)) mejor = { f, c, h, k }; }
    if (mejor) poner(w, s, mejor.f, mejor.c, mejor.h);
  }
  /* numerar */
  const inicio = {}; let n = 0;
  puestas.sort((a, b) => a.f - b.f || a.c - b.c).forEach(p => { const k = p.f + ',' + p.c; if (!inicio[k]) inicio[k] = ++n; p.n = inicio[k]; });
  return { N, grid: g, palabras: puestas, inicio };
}

/* ---------- Trivia de cultura general (se mezcla con la de la carrera) ---------- */
const TRIVIA_GENERAL = [
  { p: '¿Cuál es el río más largo de América?', o: ['Misisipi', 'Amazonas', 'Paraná', 'Bravo'], c: 1 },
  { p: '¿En qué año llegó el ser humano a la Luna?', o: ['1965', '1969', '1972', '1959'], c: 1 },
  { p: '¿Cuál es la capital de Canadá?', o: ['Toronto', 'Montreal', 'Ottawa', 'Vancouver'], c: 2 },
  { p: '¿Quién pintó "La noche estrellada"?', o: ['Picasso', 'Van Gogh', 'Monet', 'Dalí'], c: 1 },
  { p: '¿Cuántos jugadores tiene un equipo de fútbol en la cancha?', o: ['9', '10', '11', '12'], c: 2 },
  { p: '¿Cuál es el océano más grande?', o: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'], c: 3 },
  { p: '¿Qué planeta es conocido como el planeta rojo?', o: ['Venus', 'Marte', 'Júpiter', 'Mercurio'], c: 1 },
  { p: '¿En qué estado de México está la Sierra Tarahumara?', o: ['Sonora', 'Durango', 'Chihuahua', 'Sinaloa'], c: 2 },
  { p: '¿Quién escribió "Cien años de soledad"?', o: ['Mario Vargas Llosa', 'Gabriel García Márquez', 'Julio Cortázar', 'Octavio Paz'], c: 1 },
  { p: '¿Cuál es el idioma más hablado del mundo como lengua materna?', o: ['Inglés', 'Español', 'Chino mandarín', 'Hindi'], c: 2 },
  { p: '¿Cuántos continentes se cuentan habitualmente?', o: ['5', '6', '7', '8'], c: 2 },
  { p: '¿Qué país regaló la Estatua de la Libertad a Estados Unidos?', o: ['Inglaterra', 'Francia', 'España', 'Italia'], c: 1 },
  { p: '¿Cuál es el animal terrestre más rápido?', o: ['León', 'Guepardo', 'Caballo', 'Antílope'], c: 1 },
  { p: '¿Qué instrumento tiene 88 teclas?', o: ['Órgano', 'Acordeón', 'Piano', 'Sintetizador'], c: 2 },
  { p: '¿En qué año inició la Revolución Mexicana?', o: ['1810', '1857', '1910', '1917'], c: 2 },
  { p: '¿Cuál es la montaña más alta del mundo?', o: ['K2', 'Everest', 'Aconcagua', 'Kilimanjaro'], c: 1 },
  { p: '¿Qué órgano bombea la sangre?', o: ['Pulmón', 'Hígado', 'Corazón', 'Riñón'], c: 2 },
  { p: '¿Cuál es la capital de Chihuahua?', o: ['Ciudad Juárez', 'Chihuahua', 'Delicias', 'Parral'], c: 1 },
  { p: '¿Qué gas necesitan las plantas para la fotosíntesis?', o: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Helio'], c: 2 },
  { p: '¿Cuántos lados tiene un hexágono?', o: ['5', '6', '7', '8'], c: 1 },
  { p: '¿Quién fue el primer presidente de México?', o: ['Benito Juárez', 'Guadalupe Victoria', 'Agustín de Iturbide', 'Miguel Hidalgo'], c: 1 },
  { p: '¿Qué país tiene más habitantes?', o: ['Estados Unidos', 'India', 'Rusia', 'Brasil'], c: 1 },
  { p: '¿De qué país es originaria la pizza?', o: ['Francia', 'Grecia', 'Italia', 'España'], c: 2 },
  { p: '¿Cuántos huesos tiene un adulto aproximadamente?', o: ['106', '206', '306', '156'], c: 1 },
  { p: '¿Cuál es el metal más caro entre estos?', o: ['Plata', 'Cobre', 'Oro', 'Hierro'], c: 2 },
  { p: '¿En qué continente está Egipto?', o: ['Asia', 'África', 'Europa', 'Oceanía'], c: 1 },
  { p: '¿Qué selección ha ganado más Copas del Mundo de fútbol?', o: ['Alemania', 'Argentina', 'Brasil', 'Italia'], c: 2 },
  { p: '¿Quién escribió "Don Quijote de la Mancha"?', o: ['Lope de Vega', 'Miguel de Cervantes', 'Quevedo', 'Góngora'], c: 1 },
  { p: '¿Cuál es el desierto más grande de México?', o: ['Desierto de Sonora', 'Desierto de Chihuahua', 'Desierto de Altar', 'Vizcaíno'], c: 1 },
  { p: '¿Qué vitamina produce la piel con la luz del sol?', o: ['Vitamina A', 'Vitamina C', 'Vitamina D', 'Vitamina K'], c: 2 },
  { p: '¿Cuántos minutos tiene un día?', o: ['1,240', '1,440', '1,640', '1,040'], c: 1 },
  { p: '¿Qué civilización construyó Chichén Itzá?', o: ['Azteca', 'Maya', 'Olmeca', 'Tolteca'], c: 1 },
  { p: '¿Cuál es la moneda de Japón?', o: ['Yuan', 'Won', 'Yen', 'Rupia'], c: 2 },
  { p: '¿Qué animal es el más grande del planeta?', o: ['Elefante africano', 'Ballena azul', 'Tiburón ballena', 'Jirafa'], c: 1 },
  { p: '¿Quién compuso la Novena Sinfonía con el "Himno a la alegría"?', o: ['Mozart', 'Bach', 'Beethoven', 'Chopin'], c: 2 },
  { p: '¿Cuál es el país más grande del mundo por territorio?', o: ['Canadá', 'China', 'Rusia', 'Estados Unidos'], c: 2 },
  { p: '¿Cuántas cuerdas tiene una guitarra clásica?', o: ['4', '5', '6', '7'], c: 2 },
  { p: '¿En qué ciudad están las pirámides de Teotihuacán?', o: ['En el Estado de México', 'En Puebla', 'En Oaxaca', 'En Yucatán'], c: 0 },
  { p: '¿Qué significa la sigla ONU?', o: ['Organización de las Naciones Unidas', 'Orden Nacional Unificada', 'Oficina de Normas Universales', 'Organismo de Naciones Unidas'], c: 0 },
  { p: '¿Cuál es el planeta más grande del sistema solar?', o: ['Saturno', 'Neptuno', 'Júpiter', 'Urano'], c: 2 },
  { p: '¿Qué pintora mexicana es famosa por sus autorretratos?', o: ['Frida Kahlo', 'María Izquierdo', 'Remedios Varo', 'Leonora Carrington'], c: 0 },
  { p: '¿Cuántos años tiene un siglo?', o: ['10', '50', '100', '1000'], c: 2 },
  { p: '¿Qué deporte se juega en Wimbledon?', o: ['Golf', 'Tenis', 'Críquet', 'Rugby'], c: 1 },
  { p: '¿Cuál es el hueso más largo del cuerpo?', o: ['Húmero', 'Tibia', 'Fémur', 'Radio'], c: 2 },
  { p: '¿Qué país tiene forma de bota?', o: ['Grecia', 'Italia', 'Portugal', 'Chile'], c: 1 },
  { p: '¿Quién desarrolló la teoría de la evolución por selección natural?', o: ['Mendel', 'Darwin', 'Pasteur', 'Lamarck'], c: 1 },
  { p: '¿Cuál es la lengua indígena más hablada en México?', o: ['Maya', 'Náhuatl', 'Zapoteco', 'Rarámuri'], c: 1 },
  { p: '¿Qué es más rápido?', o: ['El sonido', 'La luz', 'Un avión', 'Un tren bala'], c: 1 },
  { p: '¿Cuántos colores tiene el arcoíris tradicionalmente?', o: ['5', '6', '7', '8'], c: 2 },
  { p: '¿En qué año cayó el Muro de Berlín?', o: ['1979', '1989', '1991', '1985'], c: 1 }
];
