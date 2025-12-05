# WhatsApp MVP Backend

Este repositorio contiene un backend mínimo para un bot de WhatsApp que soporta:

- Menú principal
- Flujo "Hacer pedido" (guardar items, finalizar)
- Flujo "Agendar hora" (servicio, fecha, hora)
- Estado por usuario guardado en Firestore

## PASOS RÁPIDOS

1. Crear proyecto en Firebase y generar service account (JSON).
2. Rellenar `.env` con las variables.
3. `npm install`
4. `npm run dev`
5. Desplegar en Render/Railway/Heroku/Vercel (procura exponer /webhook)
6. En Meta (developers.facebook.com) configura la Callback URL y VERIFY_TOKEN
7. Probar con "Send Test Message" en Meta o enviando mensajes al número.
