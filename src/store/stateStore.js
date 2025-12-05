import admin from 'firebase-admin'
try {
  const ref = db().collection('orders').doc(userId)
  const doc = await ref.get()
  const data = doc.exists ? doc.data() : { items: [], createdAt: new Date() }
  data.items = data.items || []
  data.items.push(itemName)
  await ref.set(data, { merge: true })
} catch (e) {
  console.error('addOrderItem error', e)
}

export async function finalizeOrder(userId) {
  try {
    const ref = db().collection('orders').doc(userId)
    const doc = await ref.get()
    if (!doc.exists) return { items: [] }
    const data = doc.data()
    // Move to historic orders
    await db()
      .collection('orders_history')
      .add({ userId, ...data, finalizedAt: new Date() })
    // Clear draft
    await ref.delete()
    return data
  } catch (e) {
    console.error('finalizeOrder error', e)
    return { items: [] }
  }
}

// Bookings: save a booking document
export async function saveBooking(userId, bookingData) {
  try {
    const doc = {
      userId,
      ...bookingData,
      createdAt: new Date(),
    }
    const res = await db().collection('bookings').add(doc)
    return { id: res.id, ...doc }
  } catch (e) {
    console.error('saveBooking error', e)
    return null
  }
}
