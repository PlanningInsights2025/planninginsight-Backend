import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

// Expect FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in env
const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env

let initialized = false

export function initFirebaseAdmin() {
  if (initialized) return admin
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('Firebase Admin not configured (missing env vars), password sync with Firebase will be skipped.')
    return null
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Private key may have literal \n sequences; replace them
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
    initialized = true
    console.log('Firebase Admin initialized')
    return admin
  } catch (e) {
    console.error('Failed to initialize Firebase Admin:', e.message)
    return null
  }
}

export async function updateFirebaseUserPassword(email, newPassword) {
  const instance = initFirebaseAdmin()
  if (!instance) return { skipped: true, reason: 'admin not initialized' }
  try {
    const userRecord = await instance.auth().getUserByEmail(email)
    await instance.auth().updateUser(userRecord.uid, { password: newPassword })
    return { success: true }
  } catch (e) {
    console.error('Firebase password update failed:', e.message)
    return { success: false, error: e.message }
  }
}

export async function getFirebaseUserByEmail(email) {
  const instance = initFirebaseAdmin()
  if (!instance) return { skipped: true, reason: 'admin not initialized' }
  try {
    const userRecord = await instance.auth().getUserByEmail(email)
    const providers = (userRecord.providerData || []).map(p => p.providerId)
    return {
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        providers,
        disabled: userRecord.disabled,
        customClaims: userRecord.customClaims || {}
      }
    }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function setUserAdminClaimByEmail(email, isAdmin) {
  const instance = initFirebaseAdmin()
  if (!instance) return { skipped: true, reason: 'admin not initialized' }
  try {
    const userRecord = await instance.auth().getUserByEmail(email)
    const current = userRecord.customClaims || {}
    const roles = new Set(Array.isArray(current.roles) ? current.roles : [])
    if (isAdmin) roles.add('admin'); else roles.delete('admin')
    const updated = { ...current, admin: !!isAdmin, roles: Array.from(roles) }
    await instance.auth().setCustomUserClaims(userRecord.uid, updated)
    return { success: true, claims: updated }
  } catch (e) {
    return { success: false, error: e.message }
  }
}
