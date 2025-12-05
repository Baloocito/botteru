import express from 'express'
import axios from 'axios'

const app = express()
app.use(express.json())

app.post('/webhook', async (req, res) => {
  try {
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

    if (message?.text?.body) {
      const userMessage = message.text.body.toLowerCase()
      const from = message.from

      let reply = 'No entendí 😅 ¿Te puedo ayudar con algo más?'

      if (userMessage.includes('hola')) {
        reply = '¡Hola! 👋 ¿Qué necesitas?'
      } else if (userMessage.includes('precio')) {
        reply = 'Ofrecemos planes desde $9.990 al mes 🚀'
      } else if (userMessage.includes('horario')) {
        reply = 'Nuestro horario es de 9 a 18 hrs 👍'
      }

      await axios.post(
        `https://graph.facebook.com/v20.0/${process.env.PHONE_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: from,
          text: { body: reply },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      )
    }

    res.sendStatus(200)
  } catch (e) {
    console.error('Error:', e)
    res.sendStatus(500)
  }
})
app.get('/webhook', (req, res) => {
  const verifyToken = 'bot123' // el mismo que pusiste en Meta

  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified!')
      res.status(200).send(challenge)
    } else {
      res.sendStatus(403)
    }
  }
})

app.listen(3000, () => console.log('Bot running on port 3000'))
