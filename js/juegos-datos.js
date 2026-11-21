/* Bancos de los juegos diarios. Se pueden ampliar sin tocar el resto del código. */
'use strict';
const TRIVIA = [
  { p: '¿Cuál es la derivada de una constante?', o: ['0', '1', 'La misma constante', 'x'], c: 0 },
  { p: '¿Qué científico propuso las tres leyes del movimiento?', o: ['Galileo Galilei', 'Isaac Newton', 'Albert Einstein', 'Johannes Kepler'], c: 1 },
  { p: '¿Cuál es el elemento químico con símbolo Na?', o: ['Nitrógeno', 'Níquel', 'Sodio', 'Neón'], c: 2 },
  { p: '¿Cuántos lados tiene un hexágono?', o: ['5', '6', '7', '8'], c: 1 },
  { p: 'En el SI, ¿en qué unidad se mide la fuerza?', o: ['Joule', 'Pascal', 'Watt', 'Newton'], c: 3 },
  { p: '¿Qué gas absorben las plantas para hacer la fotosíntesis?', o: ['Oxígeno', 'Dióxido de carbono', 'Nitrógeno', 'Hidrógeno'], c: 1 },
  { p: '¿Cuánto vale π redondeado a dos decimales?', o: ['3.12', '3.14', '3.16', '3.41'], c: 1 },
  { p: '¿Qué número binario equivale al 5 decimal?', o: ['101', '110', '111', '100'], c: 0 },
  { p: '¿Cuál es el pH del agua pura a 25 °C?', o: ['0', '5', '7', '14'], c: 2 },
  { p: 'En contabilidad, ¿qué ecuación es la básica?', o: ['Activo = Pasivo + Capital', 'Activo = Ingresos − Gastos', 'Capital = Activo + Pasivo', 'Pasivo = Activo + Capital'], c: 0 },
  { p: '¿Qué planeta es el más grande del sistema solar?', o: ['Saturno', 'Neptuno', 'Júpiter', 'Tierra'], c: 2 },
  { p: '¿Cuál es la integral de 1/x?', o: ['x²/2 + C', 'ln|x| + C', '−1/x² + C', 'eˣ + C'], c: 1 },
  { p: '¿Cuántos bits tiene un byte?', o: ['4', '8', '16', '32'], c: 1 },
  { p: 'La ley de Ohm relaciona voltaje, corriente y…', o: ['Potencia', 'Resistencia', 'Frecuencia', 'Capacitancia'], c: 1 },
  { p: '¿Cuál es la fórmula química del agua?', o: ['H₂O', 'HO₂', 'H₂O₂', 'OH'], c: 0 },
  { p: '¿Qué ángulo suman los ángulos internos de un triángulo?', o: ['90°', '180°', '270°', '360°'], c: 1 },
  { p: '¿Quién escribió "Cien años de soledad"?', o: ['Octavio Paz', 'Gabriel García Márquez', 'Mario Vargas Llosa', 'Carlos Fuentes'], c: 1 },
  { p: '¿Cuál es la velocidad aproximada de la luz en el vacío?', o: ['300,000 km/s', '30,000 km/s', '3,000 km/s', '300 km/s'], c: 0 }
];
const PALABRAS = ['PLANO', 'VALOR', 'SUMAR', 'RESTA', 'CURVA', 'RECTA', 'ATOMO', 'CARGA', 'CAMPO', 'ONDAS', 'LIBRO', 'NOTAS', 'CLASE', 'TAREA', 'PUNTO', 'BECAS', 'LAPIZ', 'REGLA', 'METRO', 'LITRO', 'GRAMO', 'MASAS', 'FUSIL', 'MOTOR', 'PLACA', 'DATOS', 'TABLA', 'SALON', 'RAMAS', 'NODOS'];
const LOGICA = [
  { p: '2, 4, 8, 16, ?', r: 32, pista: 'Cada número es el doble del anterior.' },
  { p: '1, 1, 2, 3, 5, 8, ?', r: 13, pista: 'Cada número es la suma de los dos anteriores.' },
  { p: '3, 6, 11, 18, ?', r: 27, pista: 'Las diferencias son 3, 5, 7, 9…' },
  { p: '1, 4, 9, 16, ?', r: 25, pista: 'Son cuadrados perfectos.' },
  { p: '2, 3, 5, 7, 11, ?', r: 13, pista: 'Son números primos.' },
  { p: '10, 7, 4, 1, ?', r: -2, pista: 'Se resta 3 cada vez.' },
  { p: '1, 2, 6, 24, ?', r: 120, pista: 'Se multiplica por 2, 3, 4, 5…' },
  { p: '0, 1, 3, 6, 10, ?', r: 15, pista: 'Se suma 1, 2, 3, 4, 5…' },
  { p: '5, 10, 20, 35, 55, ?', r: 80, pista: 'Las diferencias son 5, 10, 15, 20, 25…' },
  { p: '1, 8, 27, 64, ?', r: 125, pista: 'Son cubos perfectos.' }
];
/* Índice del día: todos ven lo mismo el mismo día */
function indiceDelDia(n, sal = 0) { const d = new Date(); const k = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate() + sal; return ((k * 2654435761) >>> 0) % n; }
