(function (root, f) { if (typeof module === 'object') module.exports = f(); else root.Calc = f(); })(this, function () {
  var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var FIJO = ['Emprendedor', 'Impulso'];
  function n(x) { x = Number(x); return isFinite(x) ? x : 0; }
  function money(x) { x = Math.round(n(x)); return (x < 0 ? '-' : '') + '$' + Math.abs(x).toLocaleString('en-US'); }

  function calc(d) {
    var cl = d.clientes.map(function (c) {
      var act = c.estado === 'Activo';
      var v = 0;
      if (act && c.viatico) v = FIJO.indexOf(c.plan) >= 0 ? n(d.viatico) : n(d.viatico) * n(c.pautas);
      var pg = d.pagos[c.plan] || { cm: 0, manuel: 0 };
      var total = act ? n(c.precio) + v : 0;
      return Object.assign({}, c, { activo: act, viaticoCobrar: v, total: total, falta: total - n(c.cobrado),
        pagoCM: act ? n(pg.cm) : 0, pagoManuel: act ? n(pg.manuel) : 0 });
    });
    var sum = function (a, k) { return a.reduce(function (s, x) { return s + n(x[k]); }, 0); };
    var porCuenta = { cm: sum(cl, 'pagoCM'), manuel: sum(cl, 'pagoManuel') };
    var ceos = d.equipo.filter(function (p) { return p.bono; }).length || 1;
    var totalCobrar = sum(cl, 'total'), cobrado = cl.reduce(function (s, c) { return s + (c.activo ? n(c.cobrado) : 0); }, 0);
    var sueldos = d.equipo.reduce(function (s, p) { return s + n(p.fijo) + (p.porCuenta ? porCuenta[p.porCuenta] : 0); }, 0);
    var gastos = sum(d.gastos, 'monto'), gastosPagados = sum(d.gastos, 'pagado');
    var ganancia = totalCobrar - sueldos - gastos;
    var agencia = ganancia > 0 ? ganancia * n(d.agenciaPct) : ganancia;
    var bonoTotal = ganancia > 0 ? ganancia - agencia : 0;
    var bonoCada = bonoTotal / ceos;
    var personas = d.equipo.map(function (p) {
      var pc = p.porCuenta ? porCuenta[p.porCuenta] : 0;
      var bono = p.bono ? bonoCada : 0;
      var total = n(p.fijo) + pc + bono;
      return Object.assign({}, p, { porCuentas: pc, bonoMonto: bono, total: total, falta: total - n(p.pagado) });
    });
    var pagadoPersonas = sum(personas, 'pagado');
    return { clientes: cl, personas: personas, totalCobrar: totalCobrar, cobrado: cobrado, faltaCobrar: totalCobrar - cobrado,
      sueldos: sueldos, gastos: gastos, totalPagar: sueldos + gastos, ganancia: ganancia, agencia: agencia, bonoTotal: bonoTotal,
      bonoCada: bonoCada, caja: cobrado - pagadoPersonas - gastosPagados, faltaPagar: sum(personas, 'falta'),
      margen: totalCobrar ? ganancia / totalCobrar : 0, ratioSueldos: totalCobrar ? sueldos / totalCobrar : 0 };
  }

  function avisoCobros(d) {
    var r = calc(d), l = r.clientes.filter(function (c) { return c.activo && c.falta > 0; });
    if (!l.length) return '💰 ' + d.mes + ': todo cobrado. ¡Excelente!';
    return '💰 Cobros pendientes - ' + d.mes + '\n' + l.map(function (c) { return '• ' + c.nombre + ' (' + c.plan + '): ' + money(c.falta) + ' - ' + c.fechaLimite; }).join('\n') +
      '\n\nFalta cobrar: ' + money(r.faltaCobrar);
  }
  function avisoPagos(d) {
    var r = calc(d), l = r.personas.filter(function (p) { return p.falta > 0; });
    if (!l.length) return '✅ ' + d.mes + ': todos los sueldos están pagados.';
    var t = '💸 Pagos pendientes - ' + d.mes + '\n' + l.map(function (p) { return '• ' + p.nombre + ': ' + money(p.falta); }).join('\n') +
      '\n\nTotal por pagar: ' + money(r.faltaPagar) + '\nDinero en caja: ' + money(r.caja);
    if (r.caja < r.faltaPagar) t += '\n⚠️ La caja no alcanza. Faltan ' + money(r.faltaPagar - r.caja) + '.';
    return t;
  }
  function resumen(d) {
    var r = calc(d);
    return '📊 Resumen - ' + d.mes + '\nA cobrar: ' + money(r.totalCobrar) + ' (cobrado ' + money(r.cobrado) + ')\nA pagar: ' + money(r.totalPagar) +
      '\nGanancia: ' + money(r.ganancia) + '\nSe queda la agencia: ' + money(r.agencia) + '\nBono de cada CEO: ' + money(r.bonoCada) +
      '\nSueldos sobre lo cobrado: ' + Math.round(r.ratioSueldos * 100) + '% (meta 60%)';
  }

  function siguienteMes(mes) {
    var p = String(mes).split(' '), i = MESES.indexOf(p[0]), y = n(p[1]);
    if (i < 0) return mes;
    i++; if (i > 11) { i = 0; y++; }
    return MESES[i] + ' ' + y;
  }
  function cerrarMes(d) {
    var r = calc(d), x = JSON.parse(JSON.stringify(d));
    x.historial = (x.historial || []).concat([{ mes: d.mes, totalCobrar: r.totalCobrar, cobrado: r.cobrado, sueldos: r.sueldos, gastos: r.gastos,
      ganancia: r.ganancia, agencia: r.agencia, bonoCada: r.bonoCada,
      personas: r.personas.map(function (p) { return { nombre: p.nombre, total: p.total, pagado: n(p.pagado) }; }) }]);
    x.clientes.forEach(function (c) { c.cobrado = 0; });
    x.equipo.forEach(function (p) { p.pagado = 0; });
    x.gastos.forEach(function (g) { g.pagado = 0; });
    x.mes = siguienteMes(d.mes);
    return x;
  }
  return { calc: calc, money: money, avisoCobros: avisoCobros, avisoPagos: avisoPagos, resumen: resumen, cerrarMes: cerrarMes, siguienteMes: siguienteMes, n: n };
});
