// Corre en GitHub Actions todos los dias. Lee data.json y avisa por Telegram.
const fs = require('fs');
const C = require('../calc.js');
const FILE = __dirname + '/../data.json';
let d = JSON.parse(fs.readFileSync(FILE, 'utf8'));

async function send(text) {
  const token = process.env.TELEGRAM_TOKEN;
  const chats = (process.env.TELEGRAM_CHATS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!token || !chats.length) { console.log('Sin Telegram configurado. Mensaje:\n' + text); return; }
  for (const chat of chats) {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text })
    });
    if (!r.ok) console.log('Fallo al enviar a ' + chat + ': ' + (await r.text()));
  }
}

(async () => {
  const modo = process.env.MODO || 'auto';
  const t = new Date(Date.now() - 4 * 3600 * 1000); // hora de Caracas (UTC-4)
  const dia = t.getUTCDate();
  const ultimo = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  if (modo === 'prueba') return send('✅ Mulato Admin: avisos conectados.');
  if (modo === 'cobros') return send(C.avisoCobros(d));
  if (modo === 'pagos') return send(C.avisoPagos(d));
  if (modo === 'resumen') return send(C.resumen(d));
  if (dia === ultimo) await send(C.resumen(d));
  if (dia === 4 || dia === 25) await send(C.avisoCobros(d));
  if (dia === 5) await send(C.avisoPagos(d));
  if (dia === 1) {
    d = C.cerrarMes(d);
    fs.writeFileSync(FILE, JSON.stringify(d, null, 1));
    await send('🗓️ Se abrió ' + d.mes + '. Revisa Clientes (precios y pautas) y Gastos.');
  }
})();
