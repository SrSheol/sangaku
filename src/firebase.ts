import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAtZpRO-Gy59prAeKjpaAs_p-qqxuM9jMo',
  authDomain: 'quiniela-3c8fa.firebaseapp.com',
  projectId: 'quiniela-3c8fa',
  storageBucket: 'quiniela-3c8fa.firebasestorage.app',
  messagingSenderId: '321094792504',
  appId: '1:321094792504:web:532ba43015d1557a7cfdcd',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
/** Firestore — solo colección `pendientes`. No tocar docs de quiniela/forge. */
export const db = getFirestore(app)
