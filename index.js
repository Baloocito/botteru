import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { initFirebase } from './src/db/firebase.js'
import webhookRouter from './src/routes/webhook.js'

dotenv.config()

const app = express()
app.use(bodyParser.json())

// Inicia Firebase
initFirebase()

app.use('/webhook', webhookRouter)

app.get('/health', (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() }),
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`))
