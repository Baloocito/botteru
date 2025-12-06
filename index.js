import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initFirebase } from './src/db/firebase.js'
import webhookRouter from './src/routes/webhook.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(bodyParser.json())

// Inicia Firebase
initFirebase()

// Rutas del webhook
app.use('/webhook', webhookRouter)

// Health check
app.get('/health', (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() }),
)

// Servir páginas estáticas (Términos y Privacidad)
app.use(express.static(path.join(__dirname, 'public')))

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'))
})

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`))
