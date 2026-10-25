# Conectar la app con tu hoja (una sola vez)

La app es solo una pantalla. Los datos se quedan en tu hoja de Google (privada). Entran solo las cuentas con acceso a la hoja.

## 1. Crear el permiso de Google
1. Entra a https://console.cloud.google.com con la cuenta dueña de la hoja.
2. Arriba, "Seleccionar proyecto" > **Proyecto nuevo** > nombre `mulato-admin` > Crear.
3. Menú > **APIs y servicios** > **Biblioteca** > busca **Google Sheets API** > **Habilitar**.
4. **APIs y servicios** > **Pantalla de consentimiento de OAuth** > tipo **Externo** > nombre `Mulato Admin`, tu correo > Guardar.
   - En **Usuarios de prueba** agrega los correos de los dos CEO.
5. **Credenciales** > **Crear credenciales** > **ID de cliente de OAuth** > tipo **Aplicación web**.
   - **Orígenes de JavaScript autorizados**: `https://mulatoediciones-png.github.io`
   - Crear. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`).

## 2. Abrir la app
1. Abre https://mulatoediciones-png.github.io/mulato-admin/
2. Pega el ID de cliente y el link (o ID) de tu hoja "Sistema Mulato Ediciones - Administración".
3. Pulsa **Entrar con Google**. Como la app está en modo prueba, Google avisa "app no verificada": Avanzado > Continuar. Es normal, es tu propia app.

Los dos datos se guardan solo en tu navegador. No hay nada secreto en este repositorio.
