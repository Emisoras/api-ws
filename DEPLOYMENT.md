# Guía de Despliegue de la API de WhatsApp en un VPS con Nginx

Esta guía detalla los pasos necesarios para desplegar tu API de WhatsApp (basada en `@bot-whatsapp/provider/baileys`) en un servidor VPS, utilizando Nginx como proxy inverso.

## 1. Preparación del Entorno Local (Antes de subir a GitHub)

### 1.1. Inicializar Git y Crear Repositorio (si no lo has hecho)

Si aún no has inicializado Git en tu proyecto, hazlo desde la raíz de tu proyecto `base-baileys-memory`:

```bash
cd c:\Users\user\Desktop\Servidor Emisoras\pruebas Chatbot\api-ws2\base-baileys-memory
git init
```

### 1.2. Crear un archivo `.gitignore`

Ya he creado este archivo por ti en la raíz de `base-baileys-memory`. Este archivo es crucial para evitar subir archivos innecesarios o sensibles a tu repositorio de GitHub. Contiene entradas para:
*   `node_modules/`: Dependencias del proyecto.
*   `bot_sessions/`: Archivos de sesión de Baileys (contienen información sensible).
*   `*.log`: Archivos de log.
*   `.env`: Archivos de variables de entorno (si los usas).
*   `bot.qr.png`: Imagen del código QR.
*   Archivos de configuración de IDEs (`.vscode/`, `.idea/`).

### 1.3. Realizar el primer commit y subir a GitHub

Añade todos tus archivos al control de versiones, realiza tu primer commit y sube tu proyecto a un repositorio de GitHub.

```bash
git add .
git commit -m "Initial commit: Project setup and .gitignore"
git branch -M main
git remote add origin <URL_DE_TU_REPOSITORIO_GITHUB>
git push -u origin main
```
Reemplaza `<URL_DE_TU_REPOSITORIO_GITHUB>` con la URL real de tu repositorio.

## 2. Configuración del Servidor VPS

### 2.1. Acceder a tu VPS

Conéctate a tu servidor VPS usando SSH. Necesitarás la IP de tu VPS, tu nombre de usuario y contraseña (o clave SSH).

```bash
ssh tu_usuario@149.130.175.81
```
Reemplaza `tu_usuario` con tu nombre de usuario en el VPS.

### 2.2. Instalar Dependencias Necesarias

Asegúrate de tener Node.js, npm y Nginx instalados en tu VPS.

#### Instalar Node.js y npm (ejemplo para Ubuntu/Debian)

```bash
sudo apt update
sudo apt install curl
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```
Verifica las instalaciones:
```bash
node -v
npm -v
```

#### Instalar Nginx (ejemplo para Ubuntu/Debian)

```bash
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```
Verifica que Nginx esté corriendo:
```bash
sudo systemctl status nginx
```

### 2.3. Clonar tu Repositorio de GitHub

Navega a un directorio adecuado en tu VPS (por ejemplo, `/var/www/`) y clona tu repositorio:

```bash
cd /var/www/
git clone <URL_DE_TU_REPOSITORIO_GITHUB>
cd <NOMBRE_DE_TU_CARPETA_DE_PROYECTO> # Por ejemplo, cd api-ws2/base-baileys-memory
```
Reemplaza `<URL_DE_TU_REPOSITORIO_GITHUB>` con la URL de tu repositorio y `<NOMBRE_DE_TU_CARPETA_DE_PROYECTO>` con el nombre de la carpeta que se crea al clonar (probablemente `base-baileys-memory`).

### 2.4. Instalar Dependencias del Proyecto

Una vez dentro de la carpeta de tu proyecto clonado, instala las dependencias:

```bash
npm install
```

### 2.5. Configurar Nginx como Proxy Inverso

Nginx reenviará las solicitudes de tu IP pública al puerto donde tu aplicación Node.js está escuchando (por defecto, 3000).

1.  **Crear un archivo de configuración para tu sitio:**

    ```bash
    sudo nano /etc/nginx/sites-available/whatsapp_api
    ```

2.  **Pega la siguiente configuración en el archivo `whatsapp_api`:**

    ```nginx
    server {
        listen 80;
        server_name 149.130.175.81; # Reemplaza con la IP de tu VPS o tu dominio

        location / {
            proxy_pass http://localhost:3000; # Puerto donde tu app Node.js escucha
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    Guarda y cierra el archivo (Ctrl+X, Y, Enter en `nano`).

3.  **Habilitar la configuración creando un enlace simbólico:**

    ```bash
    sudo ln -s /etc/nginx/sites-available/whatsapp_api /etc/nginx/sites-enabled/
    ```

4.  **Probar la configuración de Nginx y reiniciar:**

    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

### 2.6. Iniciar tu Aplicación Node.js

Es crucial que tu aplicación Node.js escuche en `0.0.0.0` para que Nginx pueda acceder a ella. Puedes hacerlo estableciendo la variable de entorno `HOST`.

```bash
cd /var/www/<NOMBRE_DE_TU_CARPETA_DE_PROYECTO> # Asegúrate de estar en la raíz de tu proyecto
HOST=0.0.0.0 PORT=3000 npm start
```

**Nota:** Ejecutar `npm start` directamente en la terminal la bloqueará. Para mantener la aplicación corriendo en segundo plano de forma robusta, se recomienda usar un gestor de procesos como `pm2`.

#### Usando PM2 (Recomendado para Producción)

1.  **Instalar PM2:**

    ```bash
    sudo npm install -g pm2
    ```

2.  **Iniciar tu aplicación con PM2:**

    ```bash
    cd /var/www/<NOMBRE_DE_TU_CARPETA_DE_PROYECTO>
    pm2 start npm --name "whatsapp-api" -- start -- --host 0.0.0.0 --port 3000
    ```
    Esto iniciará tu script `start` de `package.json` con las variables de entorno `HOST` y `PORT` configuradas.

3.  **Configurar PM2 para que se inicie automáticamente al reiniciar el servidor:**

    ```bash
    pm2 startup systemd
    pm2 save
    ```
    Sigue las instrucciones que te dé `pm2 startup` para ejecutar el comando generado.

### 2.7. Configurar Firewall (UFW - Uncomplicated Firewall)

Si tienes un firewall activo (como UFW en Ubuntu), asegúrate de permitir el tráfico HTTP (puerto 80) y HTTPS (puerto 443, si usas SSL).

```bash
sudo ufw allow 'Nginx HTTP'
sudo ufw allow 'OpenSSH' # Para mantener tu acceso SSH
sudo ufw enable
```

## 3. Acceso y Pruebas

Una vez que todo esté configurado y tu aplicación esté corriendo con PM2 (o `npm start` en segundo plano):

*   **Acceso a la Interfaz Web (QR):** Abre tu navegador y ve a `http://149.130.175.81/`. Deberías ver la interfaz para escanear el código QR.
*   **Envío de Mensajes (API):** Desde Postman o tu aplicación externa, realiza peticiones `POST` a `http://149.130.175.81/send-message/` con el cuerpo JSON adecuado:

    ```json
    {
        "phone": "573001234567",
        "message": "Hola desde mi API desplegada!"
    }
    ```

¡Con estos pasos, tu API debería estar funcionando correctamente en tu VPS!