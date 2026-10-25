const S=[["Video estándar (reel)","por video",30,[6,8,6,0]],["Video avanzado (reel)","por video",45,[0,0,6,18]],["Carrusel o infografía","por pieza",20,[0,4,6,6]],["Flyer","por pieza",10,[6,0,0,0]],["Story","por story",1,[40,60,90,0]],["Stories ilimitadas (cobertura diaria)","por mes",60,[0,0,0,1]],["Pauta de producción integral (4 horas)","por pauta",130,[1,1,2,4]],["Estrategia de contenido","por mes",40,[1,0,0,0]],["Optimización de SEO","por mes",25,[1,0,0,0]],["Setup o auditoría de perfiles","por mes",50,[0,1,1,0]],["Content plan","por publicación",5,[0,12,18,24]],["Estrategia omnicanal premium","por mes",100,[0,0,0,1]],["Copywriting básico","por mes",40,[0,1,0,0]],["Copywriting de conversión","por mes",60,[0,0,1,0]],["Copywriting persuasivo avanzado","por mes",80,[0,0,0,1]],["Campaña de ads (iniciación)","por campaña",80,[0,0,1,0]],["Paid media avanzado","por mes",200,[0,0,0,1]],["Auditoría de ventas","por sesión",90,[0,0,1,0]],["Consultoría integral","por servicio",150,[0,0,0,1]],["Dashboard de control comercial","por mes",40,[0,0,1,0]]];
const est=new Set(["Story","Stories ilimitadas (cobertura diaria)","Estrategia de contenido","Optimización de SEO","Setup o auditoría de perfiles","Content plan","Estrategia omnicanal premium","Copywriting básico","Copywriting de conversión","Copywriting persuasivo avanzado","Campaña de ads (iniciación)","Paid media avanzado","Dashboard de control comercial"]);
let id=0;const c=(nombre,plan,precio,viatico,pautas,formaPago,fechaLimite,obs)=>({id:++id,nombre,plan,precio,viatico,pautas,formaPago,fechaLimite,estado:"Activo",cobrado:0,obs:obs||""});
const p=(nombre,cargo,fijo,porCuenta,bono)=>({id:++id,nombre,cargo,fijo,porCuenta,bono,pagado:0});
const d={mes:"Noviembre 2026",agenciaPct:0.6,viatico:50,videomakerPauta:15.4,
planPrecio:{Emprendedor:120,Impulso:200,"Expansión":300,Escala:500},
pagos:{Emprendedor:{cm:20,manuel:20},Impulso:{cm:30,manuel:30},"Expansión":{cm:35,manuel:40},Escala:{cm:50,manuel:50},Personalizado:{cm:50,manuel:100}},
clientes:[c("WiFi Prado","Escala",470,false,4,"Bolívares a tasa euro","Del 1 al 5","La oficina queda en su local: no hay traslado."),
c("Deli Snacks","Personalizado",1000,true,0,"Bolívares a tasa BCV","Por acordar","Anotar las pautas del mes para calcular el viático."),
c("Mangueras El Prado","Emprendedor",120,false,1,"Bolívares a tasa euro","Del 1 al 5"),
c("Cartopekf","Emprendedor",120,true,1,"Bolívares a tasa euro","Del 1 al 5"),
c("Nua","Impulso",200,true,1,"Efectivo","Del 1 al 5"),
c("Carnes Don Guillermo","Impulso",150,true,1,"Bolívares a tasa BCV","Último día del mes","Todavía paga 150. El plan vale 200.")],
equipo:[p("CEO 1","Comercial, cobros y pautas de Meta",300,"",true),p("CEO 2","Creativo y operaciones",300,"",true),p("Community manager","Atención diaria de las cuentas",0,"cm",false),p("Videomaker","Graba pautas y edita reels",200,"",false),p("Manuel Pineda","Diseñador y videos con IA",200,"manuel",false),p("Eduardo Daboin","Asistente de producción (aprendiz)",100,"",false)],
gastos:[{concepto:"Herramientas (Claude y CapCut)",monto:50,pagado:0},{concepto:"Viáticos (traslados a las pautas)",monto:200,pagado:0}],
tabulador:S.map(s=>({servicio:s[0],unidad:s[1],precio:s[2],estimado:est.has(s[0]),cant:s[3]})),
historial:[]};
require('fs').writeFileSync(__dirname+'/../data.json',JSON.stringify(d,null,1));
const C=require('../calc.js'),r=C.calc(d);
console.log(r.totalCobrar,r.sueldos,r.gastos,r.ganancia,r.agencia,r.bonoCada,r.faltaPagar,r.personas.find(x=>x.nombre.startsWith('Manuel')).total);
