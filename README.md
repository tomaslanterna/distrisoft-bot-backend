# Order Processing API

Una API de Node.js Express que procesa pedidos y envía notificaciones de WhatsApp usando Twilio.

## Características

- Integración con MongoDB usando Mongoose ODM
- Procesamiento de pedidos con validación de clientes y distribuidores
- Notificaciones de WhatsApp vía Twilio (tanto para éxito como errores)
- Diseño de API RESTful
- Manejo de errores y validación completa

## Estructura del Proyecto

```
order-api/
├── models/
│   ├── Client.js          # Modelo de Cliente
│   ├── Distributor.js     # Modelo de Distribuidor
│   └── Order.js           # Modelo de Pedido
├── controllers/
│   └── orderController.js # Controlador de pedidos
├── routes/
│   └── orderRoutes.js     # Rutas de la API
├── scripts/
│   └── seedDatabase.js    # Script para poblar la BD
├── server.js              # Servidor principal
├── package.json
├── .env.example
└── README.md
```

## Configuración

1. **Instalar dependencias:**
   ```bash
   npm install