import axios from 'axios'

if (state === 'AGENDAR_FECHA') {
  // store date
  await setUserDataPart(from, { date: text })
  await setUserState(from, 'AGENDAR_HORA')
  return sendMessage(from, `¿A qué hora? (Ej: 16:00)`)
}

if (state === 'AGENDAR_HORA') {
  await setUserDataPart(from, { time: text })
  const data = await getUserData(from)
  // Save booking
  const booking = await saveBooking(from, data)
  await setUserState(from, 'MENU_PRINCIPAL')
  return sendMessage(
    from,
    `¡Listo! Tu hora quedó agendada 🎉\n\n📅 Fecha: ${data.date}\n⏰ Hora: ${data.time}\nServicio: ${data.service}\n\nTe confirmaremos en breve.`,
  )
}

// fallback
return sendMessage(from, `No entendí. Escribe 'menu' para volver al inicio.`)

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
