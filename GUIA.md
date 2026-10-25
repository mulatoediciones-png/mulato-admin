# Guía de instalación (20 minutos, una sola vez)

Link de la app: https://mulatoediciones-png.github.io/mulato-admin/

## 1. Activar el link (GitHub Pages)
Repositorio > Settings > Pages > Source: **Deploy from a branch** > Branch `main`, carpeta `/ (root)` > Save. En 1–2 minutos abre el link.

## 2. Token para guardar cambios
1. GitHub > tu foto > Settings > Developer settings > Personal access tokens > **Fine-grained tokens** > Generate new token.
2. Nombre `mulato-admin`, vencimiento: 1 año. En "Repository access" elige **Only select repositories** > `mulato-admin`.
3. En Permissions > Repository permissions: **Contents: Read and write**. Generar y copiar el token.
4. En la app: Ajustes > pega el token de GitHub > Guardar. Arriba debe decir "● Conectado".
5. El otro CEO crea su propio token igual (o usa el mismo) y lo pega en su teléfono.

## 3. Bot de Telegram
1. En Telegram busca @BotFather > `/newbot` > nombre y usuario terminado en `bot`. Copia el token.
2. Los dos CEO abren el bot y escriben `/start`.
3. En la app: Ajustes > pega el token del bot > **Detectar chats** > Guardar > **Mensaje de prueba**. Debe llegarles a los dos.

## 4. Avisos automáticos (diarios, 9:00 hora de Caracas)
Repositorio > Settings > Secrets and variables > Actions > New repository secret:
- `TELEGRAM_TOKEN`: el token del bot.
- `TELEGRAM_CHATS`: los chats detectados, separados por coma (ej. `123456,789012`).

Para probar: pestaña Actions > Avisos > Run workflow > modo `prueba`.

Avisa: día 4 y 25 cobros pendientes; día 5 sueldos pendientes y si la caja alcanza; último día resumen del mes. El día 1 cierra el mes (lo guarda en Historial, pone cobros y pagos en cero y abre el siguiente).

## Uso mensual
Clientes (precios y pautas) > Cobros (anota lo que pagan) > Sueldos (marca lo que pagas) > Gastos (montos reales). Sueldos por cuenta, bono de los CEO y ganancia se calculan solos.
