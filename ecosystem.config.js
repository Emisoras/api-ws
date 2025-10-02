module.exports = {
  apps : [{
    name   : "whatsapp-bot-api", // Un nombre para tu aplicación
    script : "./app.js",         // El script principal de tu aplicación
    watch  : true,               // Reiniciar la aplicación si hay cambios en los archivos
    max_memory_restart: '1000M', // Reiniciar si la memoria excede 1000MB
    exec_mode: "fork",        // Modo de ejecución en clúster
    instances: 1,                // Número de instancias
    cron_restart: "59 23 * * *", // Reiniciar todos los días a las 23:59
    env: {
      "PORT": 3000,
      "HOST": "0.0.0.0"
    }
  }]
}