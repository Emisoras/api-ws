const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const express = require('express')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')

let providerInstance = null
let adapterProvider = null
const app = express()

// Middleware para logging de solicitudes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
    next()
})

app.use(express.json())

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.json({ status: 'API is running' })
})

// Ruta de prueba adicional para verificar el enrutamiento
app.all('/test-route', (req, res) => {
    res.json({
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query
    })
})

// Función para validar el formato del número de teléfono
const validarNumero = (numero) => {
    return numero.match(/^\d{10}$/);
}

const flowPedido = addKeyword(['pedido', 'orden'])
    .addAnswer('👋 ¡Hola! Gracias por contactar a nuestra droguería.')
    .addAnswer('Por favor, ingresa el número de teléfono del cliente:', {
        capture: true
    },
    async (ctx, { flowDynamic, endFlow }) => {
        const numeroCliente = ctx.body;
        if (!validarNumero(numeroCliente)) {
            await flowDynamic('❌ Número inválido. Por favor, ingresa un número de 10 dígitos.');
            return;
        }
        await flowDynamic(`✅ Hemos registrado el pedido para el número: ${numeroCliente}\n🚚 Pronto nos pondremos en contacto para coordinar la entrega.`);
    })



const flowPrincipal = addKeyword(['hola', 'ole', 'alo'])
    .addAnswer('🙌 Bienvenido a la Droguería')
    .addAnswer(
        [
            '¿En qué podemos ayudarte?',
            '👉 Escribe *pedido* para registrar un nuevo pedido',
            '👉 Escribe *ayuda* para obtener más información',
        ],
        null,
        null,
        [flowPedido]
    )

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal, flowPedido])
    adapterProvider = createProvider(BaileysProvider)

    providerInstance = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()

    // Esperar a que el provider esté listo antes de configurar las rutas
    await new Promise(resolve => setTimeout(resolve, 1000))

    // API Endpoint para enviar mensajes
    app.post('/send-message/', async (req, res) => {
        try {
            const { phone, message } = req.body
            
            if (!phone || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere número de teléfono y mensaje'
                })
            }

            // Asegurarse que el número tenga el formato correcto
            const formattedPhone = phone.replace(/\D/g, '')
            if (formattedPhone.length !== 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de número inválido. Debe tener 10 dígitos.'
                })
            }

            // Agregar el código del país (57 para Colombia) y el sufijo de WhatsApp
            const phoneWithCountryCode = `57${formattedPhone}@s.whatsapp.net`
            await adapterProvider.sendMessage(phoneWithCountryCode, String(message), {})

            res.json({
                success: true,
                message: 'Mensaje enviado exitosamente'
            })
        } catch (error) {
            console.error('Error al enviar mensaje:', error)
            res.status(500).json({
                success: false,
                message: 'Error al enviar el mensaje',
                error: error.message
            })
        }
    })

    // Iniciar servidor API
    const PORT = process.env.PORT || 3000
    const HOST = process.env.HOST || '127.0.0.1'
    app.listen(PORT, HOST, () => {
        console.log(`API escuchando en http://${HOST}:${PORT}`)
    })
}

main()
