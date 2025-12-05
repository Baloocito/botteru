import axios from 'axios'
import {
  getUserState,
  setUserState,
  getUserData,
  setUserData,
  setUserDataPart,
  addOrderItem,
  finalizeOrder,
  saveBooking,
} from '../store/stateStore.js'

const API_BASE = `https://graph.facebook.com/v20.0/${process.env.PHONE_ID}/messages`

// ---------------- HANDLE INCOMING WEBHOOK ----------------
export async function handleIncomingWebhook(body) {
  const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  if (!message) return

  const from = message.from
  const text = (message.text?.body || '').trim()

  let state = await getUserState(from)
  if (!state) {
    await setUserState(from, 'MENU_PRINCIPAL')
    state = 'MENU_PRINCIPAL'
  }

  const lower = text.toLowerCase()

  // Reset to menu with greetings
  if (['hola', 'hi', 'menu', 'start'].includes(lower)) {
    await setUserState(from, 'MENU_PRINCIPAL')
    return sendMessage(from, mainMenuText())
  }

  switch (state) {
    case 'MENU_PRINCIPAL':
      return handleMainMenu(from, lower)
    case 'HACER_PEDIDO':
    case 'PEDIDO_AGREGAR':
      return handleOrderFlow(from, text)
    case 'AGENDAR_SERVICIO':
    case 'AGENDAR_FECHA':
    case 'AGENDAR_HORA':
      return handleBookingFlow(from, text, state)
    case 'CONFIRMAR_PEDIDO':
      return handleConfirmOrder(from, text)
    default:
      await setUserState(from, 'MENU_PRINCIPAL')
      return sendMessage(from, mainMenuText())
  }
}

// ---------------- MENÚ PRINCIPAL ----------------
function mainMenuText() {
  return `¡Hola! 👋 Soy el asistente automático.\n¿Qué deseas hacer?\n\n1️⃣ Hacer un pedido 🍔\n2️⃣ Agendar una hora 📅\n3️⃣ Hablar con un humano 👨‍💼\n\nEscribe el número de la opción.`
}

async function handleMainMenu(from, text) {
  if (text === '1' || text.includes('pedido')) {
    await setUserState(from, 'HACER_PEDIDO')
    return sendMessage(
      from,
      `Perfecto 🍕 ¿Qué te gustaría hacer?\n\n1️⃣ Ver menú\n2️⃣ Ver promociones\n3️⃣ Volver al inicio`,
    )
  }

  if (text === '2' || text.includes('agenda') || text.includes('agendar')) {
    await setUserState(from, 'AGENDAR_SERVICIO')
    return sendMessage(
      from,
      `Perfecto 📅 ¿Para qué servicio deseas agendar?\n\n1️⃣ Corte de pelo\n2️⃣ Limpieza facial\n3️⃣ Mantención de auto\n4️⃣ Visita de venta\n5️⃣ Volver al inicio`,
    )
  }

  if (text === '3' || text.includes('humano')) {
    return sendMessage(
      from,
      `Te conecto con un humano. Por favor escribe tu consulta y te responderemos en breve.`,
    )
  }

  return sendMessage(from, mainMenuText())
}

// ---------------- PEDIDOS ----------------
async function handleOrderFlow(from, text) {
  const lower = text.toLowerCase()

  if (lower === '1' || lower.includes('menu')) {
    await setUserState(from, 'PEDIDO_AGREGAR')
    return sendMessage(
      from,
      `MENÚ 🍽️\n- Hamburguesa clásica → $5.990\n- Hamburguesa doble → $7.490\n- Papas fritas → $2.000\n\nEscribe el nombre del producto que quieres agregar.`,
    )
  }

  if (lower === '2' || lower.includes('promoc')) {
    return sendMessage(
      from,
      `Promoción del día: Combo hamburguesa + papas → $7.000`,
    )
  }

  const state = await getUserState(from)
  if (state === 'PEDIDO_AGREGAR') {
    await addOrderItem(from, text)
    await setUserState(from, 'CONFIRMAR_PEDIDO')
    return sendMessage(
      from,
      `Agregué "${text}" al pedido.\n\n1️⃣ Agregar más\n2️⃣ Finalizar pedido`,
    )
  }

  return sendMessage(
    from,
    `No entendí esa opción en el flujo de pedidos.\nEscribe 1 para ver menú o 2 para ver promociones.`,
  )
}

async function handleConfirmOrder(from, text) {
  const lower = text.trim()
  if (lower === '1') {
    await setUserState(from, 'PEDIDO_AGREGAR')
    return sendMessage(from, `Perfecto, ¿qué deseas agregar?`)
  }
  if (lower === '2') {
    const order = await finalizeOrder(from)
    await setUserState(from, 'MENU_PRINCIPAL')
    return sendMessage(
      from,
      `Pedido confirmado 🎉\n\nResumen:\n${orderSummaryText(
        order,
      )}\n\nGracias por tu pedido.`,
    )
  }
  return sendMessage(
    from,
    `No entendí. Escribe 1 para agregar más o 2 para finalizar.`,
  )
}

function orderSummaryText(order) {
  if (!order || !order.items || order.items.length === 0) return 'No hay items.'
  return order.items.map((it) => `- ${it}`).join('\n')
}

// ---------------- AGENDAMIENTO ----------------
export async function handleBookingFlow(from, text, state) {
  const lower = text.toLowerCase().trim()

  if (state === 'AGENDAR_SERVICIO') {
    const service = parseServiceSelection(lower)
    if (!service)
      return sendMessage(
        from,
        `No entendí el servicio. Escribe el número del servicio (ej: 1).`,
      )
    await setUserData(from, { service })
    await setUserState(from, 'AGENDAR_FECHA')
    return sendMessage(
      from,
      `Perfecto. ¿Qué día deseas la hora?\nEj: 14-12 o "mañana"`,
    )
  }

  if (state === 'AGENDAR_FECHA') {
    await setUserDataPart(from, { date: text })
    await setUserState(from, 'AGENDAR_HORA')
    return sendMessage(from, `¿A qué hora? (Ej: 16:00)`)
  }

  if (state === 'AGENDAR_HORA') {
    await setUserDataPart(from, { time: text })
    const data = await getUserData(from)
    const booking = await saveBooking(from, data)
    await setUserState(from, 'MENU_PRINCIPAL')
    return sendMessage(
      from,
      `¡Listo! Tu hora quedó agendada 🎉\n\n📅 Fecha: ${data.date}\n⏰ Hora: ${data.time}\nServicio: ${data.service}`,
    )
  }

  return sendMessage(from, `No entendí. Escribe 'menu' para volver al inicio.`)
}

function parseServiceSelection(text) {
  if (text === '1') return 'Corte de pelo'
  if (text === '2') return 'Limpieza facial'
  if (text === '3') return 'Mantención de auto'
  if (text === '4') return 'Visita de venta'
  return null
}

// ---------------- SEND MESSAGE ----------------
export async function sendMessage(to, message) {
  try {
    await axios.post(
      API_BASE,
      {
        messaging_product: 'whatsapp',
        to,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (e) {
    console.error('Error sending message:', e?.response?.data || e.message)
  }
}
