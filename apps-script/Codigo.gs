/**
 * Mulato Ediciones - Avisos por Telegram y cierre de mes
 * Solo los CEO. No depende de Claude ni de ningún servicio externo salvo Telegram.
 */
var ZONA = 'America/Caracas';
var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Agencia')
    .addItem('1. Preparar hoja (una sola vez)', 'prepararHoja')
    .addItem('2. Configurar Telegram', 'configurarTelegram')
    .addItem('3. Activar avisos automáticos', 'instalarAvisos')
    .addSeparator()
    .addItem('Avisar: cobros pendientes', 'avisoCobros')
    .addItem('Avisar: pagos pendientes', 'avisoPagos')
    .addItem('Avisar: resumen del mes', 'cierreDeMes')
    .addSeparator()
    .addItem('Abrir mes nuevo (guarda el actual)', 'abrirMesNuevo')
    .addToUi();
}

/* ---------- Utilidades ---------- */
function money(n) { return '$' + Math.round(Number(n) || 0).toLocaleString('en-US'); }
function hoy() { return new Date(); }
function dia(d) { return Number(Utilities.formatDate(d, ZONA, 'd')); }
function ultimoDia(d) {
  var y = Number(Utilities.formatDate(d, ZONA, 'yyyy')), m = Number(Utilities.formatDate(d, ZONA, 'M'));
  return new Date(y, m, 0).getDate();
}
function hoja(n) { return SpreadsheetApp.getActive().getSheetByName(n); }

/* ---------- Telegram ---------- */
function enviarTelegram(texto) {
  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty('TELEGRAM_TOKEN');
  var chats = (p.getProperty('TELEGRAM_CHATS') || '').split(',').filter(String);
  if (!token || !chats.length) throw new Error('Falta configurar Telegram (menú Agencia > 2. Configurar Telegram).');
  chats.forEach(function (c) {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', muteHttpExceptions: true,
      payload: { chat_id: c, text: texto }
    });
  });
}

function configurarTelegram() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Telegram', 'Pega el token que te dio @BotFather.\n(Antes, los dos CEO deben abrir el bot y escribirle /start)', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var token = r.getResponseText().trim();
  var res = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates', { muteHttpExceptions: true }).getContentText());
  if (!res.ok) { ui.alert('El token no es válido. Revisa que lo copiaste completo.'); return; }
  var ids = {};
  res.result.forEach(function (u) { if (u.message && u.message.chat) ids[u.message.chat.id] = u.message.chat.first_name || ''; });
  var lista = Object.keys(ids);
  if (!lista.length) { ui.alert('Nadie le ha escrito al bot. Cada CEO debe abrirlo en Telegram, escribir /start y repetir este paso.'); return; }
  var p = PropertiesService.getScriptProperties();
  p.setProperty('TELEGRAM_TOKEN', token);
  p.setProperty('TELEGRAM_CHATS', lista.join(','));
  enviarTelegram('✅ Mulato Ediciones: avisos conectados.');
  ui.alert('Listo. Se conectaron ' + lista.length + ' chat(s): ' + lista.map(function (i) { return ids[i]; }).join(', ') + '.\nDebes haber recibido un mensaje de prueba.');
}

/* ---------- Avisos ---------- */
function mesActual() { return hoja('Resumen').getRange('B2').getDisplayValue(); }

function avisoCobros() {
  var f = hoja('Cobros').getRange('A2:F11').getValues();
  var l = [], total = 0;
  f.forEach(function (r) { if (r[0] && r[5] > 0) { l.push('• ' + r[0] + ' (' + r[1] + '): ' + money(r[5]) + ' - ' + r[2]); total += r[5]; } });
  if (!l.length) { enviarTelegram('💰 ' + mesActual() + ': todo cobrado. ¡Excelente!'); return; }
  enviarTelegram('💰 Cobros pendientes - ' + mesActual() + '\n' + l.join('\n') + '\n\nFalta cobrar: ' + money(total));
}

function avisoPagos() {
  var f = hoja('Sueldos').getRange('A2:K10').getValues();
  var l = [], total = 0;
  f.forEach(function (r) { if (r[0] && r[9] > 0) { l.push('• ' + r[0] + ': ' + money(r[9])); total += r[9]; } });
  var caja = hoja('Resumen').getRange('B24').getValue();
  if (!l.length) { enviarTelegram('✅ ' + mesActual() + ': todos los sueldos están pagados.'); return; }
  var t = '💸 Pagos pendientes - ' + mesActual() + '\n' + l.join('\n') + '\n\nTotal por pagar: ' + money(total) + '\nDinero en caja: ' + money(caja);
  if (caja < total) t += '\n⚠️ La caja no alcanza. Faltan ' + money(total - caja) + '.';
  enviarTelegram(t);
}

function cierreDeMes() {
  var s = hoja('Resumen');
  var v = function (c) { return s.getRange(c).getValue(); };
  enviarTelegram('📊 Resumen - ' + mesActual() +
    '\nA cobrar: ' + money(v('B5')) + ' (cobrado ' + money(v('B6')) + ')' +
    '\nA pagar: ' + money(v('B12')) +
    '\nGanancia: ' + money(v('B15')) +
    '\nSe queda la agencia: ' + money(v('B17')) +
    '\nBono de cada CEO: ' + money(v('B19')) +
    '\nSueldos sobre lo cobrado: ' + Math.round(v('B29') * 100) + '% (meta 60%)');
}

/* ---------- Mes nuevo ---------- */
function abrirMesNuevo() {
  var ss = SpreadsheetApp.getActive();
  var mes = mesActual();
  ['Resumen', 'Cobros', 'Sueldos', 'Gastos'].forEach(function (n) {
    var s = ss.getSheetByName(n);
    var c = s.copyTo(ss).setName(n + ' ' + mes);
    var r = c.getDataRange();
    r.setValues(r.getValues());
    c.protect().setWarningOnly(true);
  });
  hoja('Cobros').getRange('E2:E11').clearContent();
  hoja('Sueldos').getRange('I2:I10').clearContent();
  hoja('Gastos').getRange('C2:C8').clearContent();
  var p = mes.split(' '), i = MESES.indexOf(p[0]), y = Number(p[1]);
  if (i < 0) return;
  i++; if (i > 11) { i = 0; y++; }
  hoja('Resumen').getRange('B2').setValue(MESES[i] + ' ' + y);
  enviarTelegram('🗓️ Se abrió ' + MESES[i] + ' ' + y + '. Revisa Clientes (pautas y precios) y Gastos.');
}

/* ---------- Tarea diaria ---------- */
function tareaDiaria() {
  var d = hoy(), n = dia(d);
  if (n === 1) abrirMesNuevo();
  if (n === 4 || n === 25) avisoCobros();
  if (n === 5) avisoPagos();
  if (n === ultimoDia(d)) cierreDeMes();
}

function instalarAvisos() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'tareaDiaria') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('tareaDiaria').timeBased().everyDays(1).atHour(9).inTimezone(ZONA).create();
  SpreadsheetApp.getUi().alert('Avisos activados: todos los días a las 9:00 (hora de Caracas) revisa si toca avisar.');
}

/* Corrige las columnas Cliente y Plan de la hoja Cobros */
function prepararHoja() {
  var c = hoja('Cobros');
  for (var r = 2; r <= 11; r++) {
    c.getRange(r, 1).setFormula('=Clientes!A' + r + '&""');
    c.getRange(r, 2).setFormula('=Clientes!B' + r + '&""');
  }
  SpreadsheetApp.getActive().setSpreadsheetTimeZone(ZONA);
  SpreadsheetApp.getUi().alert('Hoja preparada.');
}
