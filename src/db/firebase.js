import admin from 'firebase-admin'

export function initFirebase() {
  if (admin.apps.length) return admin.app()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase env vars missing. Skipping init.')
    return null
  }

  // Private key may contain literal \n sequences; replace them
  privateKey = privateKey.replace(/\\n/g, '\n')

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })

  console.log('Firebase initialized')
  return admin.app()
}

export const db = () => admin.firestore()
