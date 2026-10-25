/**
 * Mulato Admin - app web sobre la hoja
 * "Sistema Mulato Ediciones - Administración".
 * Corre todo en Google. No depende de Claude.
 */
var SS_ID = '1IocvmKXciJXKsBQrZk8HNPyC0MJc34ndrlm1fmGZ6Uw';
var ZONA = 'America/Caracas';
var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function ss() { return SpreadsheetApp.openById(SS_ID); }
function hoja(n) { return ss().getSheetByName(n); }
function money(n) { return '$' + Math.round(Number(n) || 0).toLocaleString('en-US'); }

/* ---------- Web app ---------- */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Mulato Admin')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getData() {
  var R = hoja('Resumen').getRange('A1:B31').getValues();
  var v = function (r) { return R[r - 1][1]; };
  var cob = hoja('Cobros').getRange('A2:F11').getValues();
  var cli = hoja('Clientes').getRange('A2:L11').getValues();
  var sue = hoja('Sueldos').getRange('A2:K10').getValues();
  var gas = hoja('Gastos').getRange('A2:D8').getValues();
  var o = { mes: String(v(2)), pct: v(16), r: {
    cobrar: v(5), cobrado: v(6), faltaCobrar: v(7), sueldos: v(10), gastos: v(11), pagar: v(12), ganancia: v(15), agencia: v(17),
    bono: v(18), bonoCada: v(19), caja: v(24), faltaPagar: v(25), margen: v(28), ratio: v(29) } };
  o.cobros = []; o.clientes = []; o.sueldos = []; o.gastos = [];
  cli.forEach(function (c, i) {
    o.clientes.push({ row: i + 2, nombre: c[0], plan: c[1], precio: c[2], viatico: c[3], pautas: c[4], viaticoMonto: c[5], forma: c[6], fecha: c[7], estado: c[8], obs: c[11] });
    var k = cob[i];
    if (c[0] && c[8] === 'Activo') o.cobros.push({ row: i + 2, nombre: c[0], plan: c[1], fecha: c[7], forma: c[6], precio: c[2], viatico: c[5], total: k[3], cobrado: k[4], falta: k[5] });
  });
  sue.forEach(function (s, i) { if (s[0]) o.sueldos.push({ row: i + 2, nombre: s[0], cargo: s[1], fijo: s[3], cuentas: s[4], bono: s[6], total: s[7], pagado: s[8], falta: s[9] }); });
  gas.forEach(function (g, i) { o.gastos.push({ row: i + 2, concepto: g[0], monto: g[1], pagado: g[2], falta: g[3] }); });
  return o;
}

// Solo se pueden escribir celdas de entrada (las demás son fórmulas).
var PERMITIDO = {
  Cobros: { cols: [5], filas: [2, 11] },
  Sueldos: { cols: [1, 2, 3, 4, 9], filas: [2, 10] },
  Gastos: { cols: [1, 2, 3], filas: [2, 8] },
  Clientes: { cols: [1, 2, 3, 4, 5, 7, 8, 9, 12], filas: [2, 11] },
  Resumen: { cols: [2], filas: [2, 2], extra: [16] }
};
function guardar(cambios) {
  cambios.forEach(function (c) {
    var p = PERMITIDO[c.hoja];
    var ok = p && p.cols.indexOf(c.col) >= 0 && ((c.fila >= p.filas[0] && c.fila <= p.filas[1]) || (p.extra && p.extra.indexOf(c.fila) >= 0));
    if (!ok) throw new Error('Celda no permitida: ' + c.hoja + ' ' + c.fila + ',' + c.col);
    hoja(c.hoja).getRange(c.fila, c.col).setValue(c.valor);
  });
  SpreadsheetApp.flush();
  return getData();
}
function agregarCliente() {
  var s = hoja('Clientes'), f = s.getRange('A2:A11').getValues();
  for (var i = 0; i < f.length; i++) if (!f[i][0]) {
    s.getRange(i + 2, 1, 1, 5).setValues([['Cliente nuevo', 'Emprendedor', 120, 'Sí', 1]]);
    s.getRange(i + 2, 7, 1, 3).setValues([['Bolívares a tasa euro', 'Del 1 al 5', 'Activo']]);
    SpreadsheetApp.flush(); return getData();
  }
  throw new Error('No hay filas libres en Clientes (máximo 10).');
}
function agregarPersona() {
  var s = hoja('Sueldos'), f = s.getRange('A2:A10').getValues();
  for (var i = 0; i < f.length; i++) if (!f[i][0]) { s.getRange(i + 2, 1, 1, 4).setValues([['Persona nueva', '', 'Fijo', 0]]); SpreadsheetApp.flush(); return getData(); }
  throw new Error('No hay filas libres en Sueldos.');
}

function mesActual() { return String(hoja('Resumen').getRange('B2').getDisplayValue()); }

/* ---------- Mes nuevo y tarea diaria ---------- */
function abrirMesNuevo() {
  var book = ss(), mes = mesActual();
  ['Resumen', 'Cobros', 'Sueldos', 'Gastos'].forEach(function (n) {
    var c = book.getSheetByName(n).copyTo(book).setName(n + ' ' + mes), r = c.getDataRange();
    r.setValues(r.getValues()); c.protect().setWarningOnly(true);
  });
  hoja('Cobros').getRange('E2:E11').clearContent();
  hoja('Sueldos').getRange('I2:I10').clearContent();
  hoja('Gastos').getRange('C2:C8').clearContent();
  var p = mes.split(' '), i = MESES.indexOf(p[0]), y = Number(p[1]);
  if (i < 0) return 'No entendí el mes';
  i++; if (i > 11) { i = 0; y++; }
  hoja('Resumen').getRange('B2').setValue(MESES[i] + ' ' + y);
  return 'Se abrió ' + MESES[i] + ' ' + y;
}
function tareaDiaria() {
  if (Number(Utilities.formatDate(new Date(), ZONA, 'd')) === 1) abrirMesNuevo();
}
function instalarAvisos() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'tareaDiaria') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('tareaDiaria').timeBased().everyDays(1).atHour(9).inTimezone(ZONA).create();
  SpreadsheetApp.getUi().alert('Listo: el día 1 de cada mes se guarda el mes anterior y se abre el siguiente.');
}
function prepararHoja() {
  var c = hoja('Cobros');
  for (var r = 2; r <= 11; r++) { c.getRange(r, 1).setFormula('=Clientes!A' + r + '&""'); c.getRange(r, 2).setFormula('=Clientes!B' + r + '&""'); }
  ss().setSpreadsheetTimeZone(ZONA);
  SpreadsheetApp.getUi().alert('Hoja preparada.');
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Agencia')
    .addItem('1. Preparar hoja (una vez)', 'prepararHoja')
    .addItem('2. Activar cierre de mes automático', 'instalarAvisos').addToUi();
}
