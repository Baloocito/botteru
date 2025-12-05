import express from 'express'
import {
  handleIncomingWebhook,
  verifyWebhook,
} from '../services/whatsappHandler.js'

const router = express.Router()

// GET used by Meta to verify webhook during setup
router.get('/', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED')
      return res.status(200).send(challenge)
    } else {
      return res.sendStatus(403)
    }
  }

  res.sendStatus(400)
})

router.post('/', async (req, res) => {
  try {
    await handleIncomingWebhook(req.body)
    res.sendStatus(200)
  } catch (e) {
    console.error('Error handling webhook:', e)
    res.sendStatus(500)
  }
})

export default router
