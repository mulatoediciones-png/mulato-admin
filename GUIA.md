# Instalación (15 minutos, una sola vez, desde un computador)

## 1. Bot de Telegram
En Telegram: @BotFather > /newbot > copia el token. Los dos CEO abren el bot y escriben /start.

## 2. Pegar el código en la hoja
1. Abre la hoja "Sistema Mulato Ediciones - Administración" > Extensiones > Apps Script.
2. Borra el contenido de `Code.gs`, pega todo `apps-script/Codigo.gs` y guarda.
3. Botón "+" junto a Archivos > HTML > nómbralo `Index` > pega todo `apps-script/Index.html` y guarda.
4. Recarga la hoja. Menú **Agencia**: (1) Preparar hoja, (2) Configurar Telegram (pega el token), (3) Activar avisos automáticos. La primera vez Google pide permisos: Avanzado > Ir a proyecto > Permitir.

## 3. Publicar el link
Apps Script > **Implementar > Nueva implementación** > tipo **Aplicación web**:
- Ejecutar como: **Usuario que accede a la aplicación web**
- Quién tiene acceso: **Cualquier usuario con cuenta de Google**
Implementar > copia la URL. Esa es tu app: ábrela desde cualquier teléfono o computador y añádela a la pantalla de inicio.

## 4. Segundo CEO
Compartir la hoja con su correo como **Editor**. Solo quien tenga acceso a la hoja puede ver y editar datos en la app; los demás reciben error.
