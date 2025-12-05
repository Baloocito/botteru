import admin from 'firebase-admin'

const db = () => admin.firestore()

// ---------------- USER STATE ----------------
export async function getUserState(userId) {
  try {
    const doc = await db().collection('users').doc(userId).get()
    return doc.exists ? doc.data().state : null
  } catch (e) {
    console.error('getUserState error', e)
    return null
  }
}

export async function setUserState(userId, state) {
  try {
    await db().collection('users').doc(userId).set({ state }, { merge: true })
  } catch (e) {
    console.error('setUserState error', e)
  }
}

// ---------------- USER DATA ----------------
export async function getUserData(userId) {
  try {
    const doc = await db().collection('users').doc(userId).get()
    return doc.exists ? doc.data().data || {} : {}
  } catch (e) {
    console.error('getUserData error', e)
    return {}
  }
}

export async function setUserData(userId, data) {
  try {
    await db().collection('users').doc(userId).set({ data }, { merge: true })
  } catch (e) {
    console.error('setUserData error', e)
  }
}

export async function setUserDataPart(userId, partial) {
  try {
    const current = await getUserData(userId)
    const merged = { ...(current || {}), ...(partial || {}) }
    await setUserData(userId, merged)
  } catch (e) {
    console.error('setUserDataPart error', e)
  }
}

// ---------------- ORDERS ----------------
export async function addOrderItem(userId, itemName) {
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

// ---------------- BOOKINGS ----------------
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
