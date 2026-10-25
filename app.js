(function () {
  var REPO = 'mulatoediciones-png/mulato-admin';
  var PLANES = ['Emprendedor', 'Impulso', 'Expansión', 'Escala', 'Personalizado'];
  var $ = function (id) { return document.getElementById(id); };
  var n = Calc.n, money = Calc.money;
  var ls = {
    get: function (k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var D = null, sha = '', tab = 'resumen', saveTimer = null, renderTimer = null, dirty = false;
  var TABS = [['resumen', 'Resumen'], ['cobros', 'Cobros'], ['sueldos', 'Sueldos'], ['clientes', 'Clientes'], ['gastos', 'Gastos'], ['tabulador', 'Precios'], ['ajustes', 'Ajustes']];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(t) { var m = $('msg'); m.textContent = t; m.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(function () { m.style.display = 'none'; }, 3500); }
  function estado(t, cls) { var e = $('estado'); e.textContent = t; e.className = cls || ''; }

  /* ---------- GitHub como base de datos ---------- */
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64d(s) { return decodeURIComponent(escape(atob(s.replace(/\n/g, '')))); }
  function gh(path, opt) {
    opt = opt || {};
    opt.headers = Object.assign({ Authorization: 'Bearer ' + ls.get('gh'), Accept: 'application/vnd.github+json' }, opt.headers || {});
    return fetch('https://api.github.com/repos/' + REPO + path, opt);
  }
  async function cargar() {
    estado('Cargando…');
    try {
      if (ls.get('gh')) {
        var r = await gh('/contents/data.json?ref=main&t=' + Date.now());
        if (!r.ok) throw new Error('GitHub respondió ' + r.status + (r.status === 401 ? ' (revisa el token en Ajustes)' : ''));
        var j = await r.json(); sha = j.sha; D = JSON.parse(b64d(j.content));
        estado('● Conectado', 'ok');
      } else {
        var r2 = await fetch('data.json?t=' + Date.now()); D = await r2.json(); sha = '';
        estado('Solo lectura (falta el token)', 'warn');
      }
    } catch (e) { estado('Sin conexión', 'bad'); toast('No se pudo cargar: ' + e.message); if (!D) { var r3 = await fetch('data.json').catch(function () { return null; }); if (r3) D = await r3.json(); } }
    render();
  }
  async function guardar() {
    if (!ls.get('gh')) { estado('Solo lectura (falta el token)', 'warn'); return; }
    estado('Guardando…');
    try {
      var r = await gh('/contents/data.json', { method: 'PUT', body: JSON.stringify({ message: 'Actualizar datos', branch: 'main', sha: sha, content: b64e(JSON.stringify(D, null, 1)) }) });
      if (r.status === 409 || r.status === 422) { estado('Conflicto: otro cambio', 'bad'); toast('Alguien más guardó antes. Toca el estado arriba para recargar.'); return; }
      if (!r.ok) throw new Error(r.status);
      sha = (await r.json()).content.sha; dirty = false; estado('● Guardado', 'ok');
    } catch (e) { estado('No se guardó', 'bad'); toast('Error al guardar: ' + e.message); }
  }
  function cambio() { dirty = true; estado('Cambios sin guardar…'); clearTimeout(saveTimer); saveTimer = setTimeout(guardar, 900); softRender(); }
  function softRender() { clearTimeout(renderTimer); renderTimer = setTimeout(function () { var a = document.activeElement; if (a && /INPUT|SELECT|TEXTAREA/.test(a.tagName)) return; render(); }, 150); }

  /* ---------- Edición por ruta ---------- */
  function setPath(p, v) { var k = p.split('.'), o = D; for (var i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = v; }
  function inp(p, v, t, extra) {
    t = t || 's';
    if (t === 'b') return '<input type="checkbox" data-p="' + p + '" data-t="b"' + (v ? ' checked' : '') + '>';
    return '<input data-p="' + p + '" data-t="' + t + '" value="' + esc(v) + '"' + (t === 'n' ? ' inputmode="decimal"' : '') + (extra || '') + '>';
  }
  function sel(p, v, opts) { return '<select data-p="' + p + '" data-t="s">' + opts.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>'; }
  function fld(lbl, html, w) { return '<div' + (w ? ' class="w"' : '') + '><label>' + lbl + '</label>' + html + '</div>'; }
  function row(a, b) { return '<div class="row"><span>' + a + '</span><b>' + b + '</b></div>'; }
  function kpi(t, v, c) { return '<div class="kpi"><small>' + t + '</small><strong class="' + (c || '') + '">' + v + '</strong></div>'; }

  /* ---------- Vistas ---------- */
  var V = {};
  V.resumen = function (r) {
    var h = '<div class="kpis">' + kpi('Falta cobrar', money(r.faltaCobrar)) + kpi('Falta pagar a la gente', money(r.faltaPagar)) +
      kpi('Ganancia del mes', money(r.ganancia), r.ganancia < 0 ? 'bad' : 'ok') + kpi('Dinero en caja', money(r.caja), r.caja < 0 ? 'bad' : '') + '</div>';
    h += '<h2>Cobros</h2><div class="card">' + row('Total a cobrar', money(r.totalCobrar)) + row('Ya cobrado', money(r.cobrado)) + '</div>';
    h += '<h2>Pagos del mes</h2><div class="card">' + row('Sueldos (sin bono)', money(r.sueldos)) + row('Herramientas y viáticos', money(r.gastos)) + row('Total a pagar (sin bono)', money(r.totalPagar)) + '</div>';
    h += '<h2>Ganancia</h2><div class="card">' + row('Ganancia del mes', money(r.ganancia)) + row('Se queda la agencia (' + Math.round(n(D.agenciaPct) * 100) + '%)', money(r.agencia)) +
      row('Bono de cada CEO', money(r.bonoCada)) + '</div>';
    h += '<h2>Salud del negocio</h2><div class="card">' + row('Ganancia sobre lo cobrado (meta 15%+)', '<span class="' + (r.margen >= 0.15 ? 'ok' : 'warn') + '">' + Math.round(r.margen * 100) + '%</span>') +
      row('Sueldos sobre lo cobrado (meta 60%-)', '<span class="' + (r.ratioSueldos <= 0.6 ? 'ok' : 'warn') + '">' + Math.round(r.ratioSueldos * 100) + '%</span>') + '</div>';
    return h;
  };
  V.cobros = function (r) {
    var h = '<div class="kpis">' + kpi('Total a cobrar', money(r.totalCobrar)) + kpi('Falta cobrar', money(r.faltaCobrar), r.faltaCobrar > 0 ? 'warn' : 'ok') + '</div>';
    r.clientes.forEach(function (c, i) {
      if (!c.activo) return;
      h += '<div class="card"><div class="top"><b>' + esc(c.nombre) + '</b><span class="' + (c.falta > 0 ? 'warn' : 'ok') + '">' + (c.falta > 0 ? 'falta ' + money(c.falta) : 'cobrado ✓') + '</span></div>' +
        '<div class="mut">' + esc(c.plan) + ' · ' + esc(c.fechaLimite) + ' · ' + esc(c.formaPago) + '</div>' +
        '<div class="mut">' + money(c.precio) + (c.viaticoCobrar ? ' + viático ' + money(c.viaticoCobrar) : '') + ' = <b>' + money(c.total) + '</b></div>' +
        '<div class="grid">' + fld('Ya cobrado', inp('clientes.' + i + '.cobrado', c.cobrado, 'n')) +
        '<div style="align-self:end"><button class="b s" data-act="cobrar" data-i="' + i + '">Cobrado completo</button></div></div></div>';
    });
    return h;
  };
  V.sueldos = function (r) {
    var h = '<div class="kpis">' + kpi('Total del equipo', money(r.sueldos + r.bonoTotal)) + kpi('Falta pagar', money(r.faltaPagar), r.faltaPagar > 0 ? 'warn' : 'ok') + '</div>';
    r.personas.forEach(function (p, i) {
      h += '<div class="card"><div class="top"><b>' + esc(p.nombre) + '</b><span class="' + (p.falta > 0 ? 'warn' : 'ok') + '">' + (p.falta > 0 ? 'falta ' + money(p.falta) : 'pagado ✓') + '</span></div>' +
        '<div class="mut">' + esc(p.cargo) + '</div>' +
        '<div class="mut">Fijo ' + money(p.fijo) + (p.porCuentas ? ' + cuentas ' + money(p.porCuentas) : '') + (p.bonoMonto ? ' + bono ' + money(p.bonoMonto) : '') + ' = <b>' + money(p.total) + '</b></div>' +
        '<div class="grid">' + fld('Ya pagado', inp('equipo.' + i + '.pagado', p.pagado, 'n')) +
        '<div style="align-self:end"><button class="b s" data-act="pagar" data-i="' + i + '">Pagado completo</button></div></div>' +
        '<details><summary class="mut" style="margin-top:8px">Editar persona</summary><div class="grid">' + fld('Nombre', inp('equipo.' + i + '.nombre', p.nombre)) + fld('Cargo', inp('equipo.' + i + '.cargo', p.cargo)) +
        fld('Sueldo fijo', inp('equipo.' + i + '.fijo', p.fijo, 'n')) +
        fld('Cobra por cuenta', '<select data-p="equipo.' + i + '.porCuenta" data-t="s"><option value=""' + (!p.porCuenta ? ' selected' : '') + '>No</option><option value="cm"' + (p.porCuenta === 'cm' ? ' selected' : '') + '>Tarifa de la CM</option><option value="manuel"' + (p.porCuenta === 'manuel' ? ' selected' : '') + '>Tarifa de Manuel</option></select>') +
        '<div><label>Recibe bono de CEO</label>' + inp('equipo.' + i + '.bono', p.bono, 'b') + '</div>' +
        '<div style="align-self:end"><button class="b d" data-act="delpersona" data-i="' + i + '">Quitar</button></div></div></details></div>';
    });
    return h + '<div class="acts"><button class="b s" data-act="addpersona">+ Agregar persona</button></div>';
  };
  V.clientes = function () {
    var h = '';
    D.clientes.forEach(function (c, i) {
      var p = 'clientes.' + i + '.';
      h += '<details class="card"><summary><b>' + esc(c.nombre || 'Cliente nuevo') + '</b> <span class="pill">' + esc(c.plan) + '</span> <span class="pill">' + money(c.precio) + '</span>' + (c.estado !== 'Activo' ? ' <span class="pill">inactivo</span>' : '') + '</summary><div class="grid">' +
        fld('Cliente', inp(p + 'nombre', c.nombre)) + fld('Plan', sel(p + 'plan', c.plan, PLANES)) + fld('Precio acordado (€)', inp(p + 'precio', c.precio, 'n')) +
        fld('Pautas del mes', inp(p + 'pautas', c.pautas, 'n')) + fld('Estado', sel(p + 'estado', c.estado, ['Activo', 'Inactivo'])) +
        '<div><label>Cobra viático</label>' + inp(p + 'viatico', c.viatico, 'b') + '</div>' +
        fld('Forma de pago', sel(p + 'formaPago', c.formaPago, ['Bolívares a tasa euro', 'Bolívares a tasa BCV', 'Efectivo', 'Divisas (USDT)', 'Otro'])) +
        fld('Fecha límite', sel(p + 'fechaLimite', c.fechaLimite, ['Del 1 al 5', 'Último día del mes', 'Por acordar'])) + fld('Observación', inp(p + 'obs', c.obs), true) +
        '</div><div class="acts"><button class="b d" data-act="delcliente" data-i="' + i + '">Quitar cliente</button></div></details>';
    });
    return h + '<div class="acts"><button class="b s" data-act="addcliente">+ Agregar cliente</button></div><p class="mut">Precio de lista: ' +
      ['Emprendedor', 'Impulso', 'Expansión', 'Escala'].map(function (k) { return k + ' ' + money(D.planPrecio[k]); }).join(' · ') + '</p>';
  };
  V.gastos = function (r) {
    var h = '<div class="kpis">' + kpi('Gastos del mes', money(r.gastos)) + kpi('Pagado', money(D.gastos.reduce(function (s, g) { return s + n(g.pagado); }, 0))) + '</div>';
    D.gastos.forEach(function (g, i) {
      h += '<div class="card"><div class="grid">' + fld('Concepto', inp('gastos.' + i + '.concepto', g.concepto), true) + fld('Monto del mes', inp('gastos.' + i + '.monto', g.monto, 'n')) + fld('Ya pagado', inp('gastos.' + i + '.pagado', g.pagado, 'n')) + '</div>' +
        '<div class="acts"><button class="b d" data-act="delgasto" data-i="' + i + '">Quitar</button></div></div>';
    });
    return h + '<div class="acts"><button class="b s" data-act="addgasto">+ Agregar gasto</button></div>';
  };
  V.tabulador = function () {
    var T = D.tabulador, P = ['Emprendedor', 'Impulso', 'Expansión', 'Escala'];
    D.tabPers = D.tabPers || T.map(function () { return 0; }); if (D.tabDesc == null) D.tabDesc = 0;
    var tot = [0, 0, 0, 0], pers = 0, pautas = 0;
    var h = '<p class="mut">Cambia un precio y todo se recalcula. Los marcados con * son estimados que debes confirmar. La última columna arma un plan personalizado.</p><div style="overflow-x:auto"><table><tr><th>Servicio</th><th>€</th>' + P.map(function (p) { return '<th>' + p.slice(0, 4) + '.</th>'; }).join('') + '<th>Pers.</th></tr>';
    T.forEach(function (s, i) {
      s.cant.forEach(function (q, k) { tot[k] += n(q) * n(s.precio); });
      pers += n(D.tabPers[i]) * n(s.precio); if (/^Pauta de producción/.test(s.servicio)) pautas = n(D.tabPers[i]);
      h += '<tr><td style="min-width:140px">' + esc(s.servicio) + (s.estimado ? ' *' : '') + '<br><span class="mut">' + esc(s.unidad) + '</span></td><td style="min-width:64px">' + inp('tabulador.' + i + '.precio', s.precio, 'n') + '</td>' +
        s.cant.map(function (q, k) { return '<td style="min-width:54px">' + inp('tabulador.' + i + '.cant.' + k, q, 'n') + '</td>'; }).join('') + '<td style="min-width:54px">' + inp('tabPers.' + i, D.tabPers[i], 'n') + '</td></tr>';
    });
    h += '</table></div><h2>Valor de lo incluido vs. lo que cobras</h2><div class="card">';
    P.forEach(function (p, k) { h += row(p, 'vale ' + money(tot[k]) + ' · cobras ' + money(D.planPrecio[p]) + ' · ahorra ' + money(tot[k] - D.planPrecio[p])); });
    h += '</div><h2>Plan personalizado</h2><div class="card"><div class="grid">' + fld('Descuento (0 a 1, ej. 0.2 = 20%)', inp('tabDesc', D.tabDesc, 'n')) +
      '<div><label>Cobra viático (por pauta)</label>' + inp('tabViat', !!D.tabViat, 'b') + '</div></div>';
    var base = pers * (1 - n(D.tabDesc)), viat = D.tabViat ? n(D.viatico) * pautas : 0, total = base + viat;
    var cm = n((D.pagos.Personalizado || {}).cm), vm = pautas * n(D.videomakerPauta), gan = total - cm - vm;
    h += row('Precio de los servicios', money(base)) + row('Viático', money(viat)) + row('Total que paga el cliente', money(total)) + row('Pago a la CM', money(cm)) +
      row('Pago a la videomaker (' + pautas + ' pautas)', money(vm)) + row('Ganancia antes de sueldos de CEO', money(gan)) + row('Margen', total ? Math.round(gan / total * 100) + '%' : '0%') + '</div>';
    return h;
  };
  V.ajustes = function () {
    var h = '<div class="card"><div class="grid">' + fld('Mes en curso', inp('mes', D.mes)) + fld('% que se queda la agencia (0.6 = 60%)', inp('agenciaPct', D.agenciaPct, 'n')) +
      fld('Viático (€)', inp('viatico', D.viatico, 'n')) + fld('Videomaker por pauta ($)', inp('videomakerPauta', D.videomakerPauta, 'n')) + '</div></div>';
    h += '<h2>Pago por cuenta según el plan</h2><div class="card"><table><tr><th>Plan</th><th>CM</th><th>Manuel</th><th>Precio</th></tr>' + PLANES.map(function (p) {
      return '<tr><td>' + p + '</td><td>' + inp('pagos.' + p + '.cm', D.pagos[p].cm, 'n') + '</td><td>' + inp('pagos.' + p + '.manuel', D.pagos[p].manuel, 'n') + '</td><td>' + (D.planPrecio[p] != null ? inp('planPrecio.' + p, D.planPrecio[p], 'n') : '') + '</td></tr>';
    }).join('') + '</table></div>';
    h += '<h2>Conexión (se guarda solo en este teléfono)</h2><div class="card"><div class="grid">' +
      fld('Token de GitHub (para guardar cambios)', '<input id="ghtok" type="password" autocomplete="off" value="' + esc(ls.get('gh')) + '">', true) +
      fld('Token del bot de Telegram (para probar y avisar a mano)', '<input id="tgtok" type="password" autocomplete="off" value="' + esc(ls.get('tg')) + '">', true) +
      fld('Chats de Telegram (separados por coma)', '<input id="tgchats" value="' + esc(ls.get('chats')) + '">', true) + '</div>' +
      '<div class="acts"><button class="b" data-act="savecfg">Guardar</button><button class="b s" data-act="detect">Detectar chats</button><button class="b s" data-act="tgtest">Mensaje de prueba</button></div></div>';
    h += '<h2>Avisos a Telegram ahora</h2><div class="acts"><button class="b s" data-act="tg" data-k="cobros">Cobros</button><button class="b s" data-act="tg" data-k="pagos">Pagos</button><button class="b s" data-act="tg" data-k="resumen">Resumen</button></div>';
    h += '<h2>Cierre de mes</h2><div class="card"><p class="mut">Guarda el mes en el historial, deja cobros y pagos en cero y abre el siguiente. Pasa solo el día 1.</p><button class="b d" data-act="cerrar">Cerrar ' + esc(D.mes) + ' ahora</button></div>';
    h += '<h2>Historial</h2>' + ((D.historial || []).slice().reverse().map(function (m) {
      return '<div class="card"><div class="top"><b>' + esc(m.mes) + '</b><span>' + money(m.ganancia) + ' ganancia</span></div><div class="mut">Cobrado ' + money(m.cobrado) + ' de ' + money(m.totalCobrar) + ' · agencia ' + money(m.agencia) + ' · bono CEO ' + money(m.bonoCada) + '</div></div>';
    }).join('') || '<p class="mut">Aún no hay meses cerrados.</p>');
    return h;
  };

  function render() {
    if (!D) return;
    $('mes').textContent = '· ' + D.mes;
    $('tabs').innerHTML = TABS.map(function (t) { return '<button data-tab="' + t[0] + '"' + (t[0] === tab ? ' class="on"' : '') + '>' + t[1] + '</button>'; }).join('');
    $('vista').innerHTML = V[tab](Calc.calc(D));
  }

  /* ---------- Telegram desde el navegador ---------- */
  async function tgSend(text) {
    var tok = ls.get('tg'), chats = ls.get('chats').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!tok || !chats.length) { toast('Falta el token del bot o los chats (Ajustes).'); return; }
    var ok = 0;
    for (var i = 0; i < chats.length; i++) { var r = await fetch('https://api.telegram.org/bot' + tok + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chats[i], text: text }) }); if (r.ok) ok++; }
    toast(ok ? 'Enviado a ' + ok + ' chat(s)' : 'No se pudo enviar. Revisa el token.');
  }
  async function detect() {
    var tok = ($('tgtok') || {}).value || ls.get('tg');
    if (!tok) { toast('Pega primero el token del bot.'); return; }
    var j = await (await fetch('https://api.telegram.org/bot' + tok + '/getUpdates')).json();
    if (!j.ok) { toast('Token inválido.'); return; }
    var ids = {}; j.result.forEach(function (u) { if (u.message && u.message.chat) ids[u.message.chat.id] = 1; });
    var l = Object.keys(ids);
    if (!l.length) { toast('Nadie ha escrito al bot. Cada CEO debe enviarle /start.'); return; }
    $('tgchats').value = l.join(','); toast('Detectados: ' + l.length + '. Pulsa Guardar.');
  }

  /* ---------- Eventos ---------- */
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.p) return;
    var v = t.dataset.t === 'b' ? t.checked : t.dataset.t === 'n' ? n(String(t.value).replace(',', '.')) : t.value;
    setPath(t.dataset.p, v); cambio();
  });
  document.addEventListener('focusout', softRender);
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.dataset.tab) { tab = t.dataset.tab; render(); window.scrollTo(0, 0); return; }
    var a = t.dataset.act, i = Number(t.dataset.i), r;
    if (!a) return;
    if (a === 'cobrar') { r = Calc.calc(D).clientes[i]; D.clientes[i].cobrado = r.total; cambio(); render(); }
    else if (a === 'pagar') { r = Calc.calc(D).personas[i]; D.equipo[i].pagado = Math.round(r.total * 100) / 100; cambio(); render(); }
    else if (a === 'addcliente') { D.clientes.push({ id: Date.now(), nombre: 'Cliente nuevo', plan: 'Emprendedor', precio: D.planPrecio.Emprendedor, viatico: true, pautas: 1, formaPago: 'Bolívares a tasa euro', fechaLimite: 'Del 1 al 5', estado: 'Activo', cobrado: 0, obs: '' }); cambio(); render(); }
    else if (a === 'delcliente') { if (confirm('¿Quitar a ' + D.clientes[i].nombre + '?')) { D.clientes.splice(i, 1); cambio(); render(); } }
    else if (a === 'addpersona') { D.equipo.push({ id: Date.now(), nombre: 'Persona nueva', cargo: '', fijo: 0, porCuenta: '', bono: false, pagado: 0 }); cambio(); render(); }
    else if (a === 'delpersona') { if (confirm('¿Quitar a ' + D.equipo[i].nombre + '?')) { D.equipo.splice(i, 1); cambio(); render(); } }
    else if (a === 'addgasto') { D.gastos.push({ concepto: 'Nuevo gasto', monto: 0, pagado: 0 }); cambio(); render(); }
    else if (a === 'delgasto') { D.gastos.splice(i, 1); cambio(); render(); }
    else if (a === 'savecfg') { ls.set('gh', $('ghtok').value.trim()); ls.set('tg', $('tgtok').value.trim()); ls.set('chats', $('tgchats').value.trim()); toast('Guardado en este teléfono'); cargar(); }
    else if (a === 'detect') detect();
    else if (a === 'tgtest') tgSend('✅ Mulato Admin: avisos conectados.');
    else if (a === 'tg') tgSend(Calc[{ cobros: 'avisoCobros', pagos: 'avisoPagos', resumen: 'resumen' }[t.dataset.k]](D));
    else if (a === 'cerrar') { if (confirm('¿Cerrar ' + D.mes + ' y abrir el siguiente?')) { D = Calc.cerrarMes(D); cambio(); render(); } }
  });
  $('estado').addEventListener('click', function () { if (!dirty) cargar(); });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  cargar();
})();
